-- Job lifecycle
CREATE OR REPLACE FUNCTION public.assert_eligible_technician(p_user uuid) RETURNS void LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF p_user IS NULL OR NOT public.user_has_org_permission(p_user, public.stgl_organization_id(), 'job.execute') THEN
    RAISE EXCEPTION 'Not an eligible technician' USING ERRCODE = '22023'; END IF;
END $$;

CREATE OR REPLACE FUNCTION public.create_job(p_organization_id uuid, p_description text, p_breakdown_id uuid DEFAULT NULL,
  p_location_id uuid DEFAULT NULL, p_equipment_id uuid DEFAULT NULL, p_job_type text DEFAULT 'breakdown', p_priority text DEFAULT NULL,
  p_scheduled_for date DEFAULT NULL, p_technician_id uuid DEFAULT NULL, p_internal_notes text DEFAULT NULL, p_maintenance_occurrence_id uuid DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_b public.breakdowns%ROWTYPE; v_job public.jobs%ROWTYPE;
BEGIN
  IF NOT public.is_stgl('job.manage') THEN RAISE EXCEPTION 'Job management denied' USING ERRCODE = '42501'; END IF;
  IF p_breakdown_id IS NOT NULL THEN
    SELECT * INTO v_b FROM public.breakdowns WHERE id = p_breakdown_id FOR UPDATE;
    IF NOT FOUND OR v_b.cancelled_at IS NOT NULL THEN RAISE EXCEPTION 'Breakdown not available' USING ERRCODE = '22023'; END IF;
    IF EXISTS (SELECT 1 FROM public.jobs WHERE breakdown_id = p_breakdown_id AND status NOT IN ('closed','cancelled')) THEN
      RAISE EXCEPTION 'Breakdown already has an active job' USING ERRCODE = '23505'; END IF;
    p_organization_id := v_b.organization_id; p_location_id := coalesce(p_location_id, v_b.location_id);
    p_equipment_id := coalesce(p_equipment_id, v_b.equipment_id); p_priority := coalesce(p_priority, v_b.priority);
    p_description := coalesce(nullif(btrim(p_description),''), v_b.fault_description); p_job_type := 'breakdown';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.organizations WHERE id = p_organization_id AND organization_type = 'client' AND status = 'active') THEN
    RAISE EXCEPTION 'Client organization not found' USING ERRCODE = '22023'; END IF;
  IF p_location_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.locations WHERE id = p_location_id AND organization_id = p_organization_id) THEN
    RAISE EXCEPTION 'Location does not belong to organization' USING ERRCODE = '22023'; END IF;
  IF p_equipment_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.equipment WHERE id = p_equipment_id AND organization_id = p_organization_id) THEN
    RAISE EXCEPTION 'Equipment does not belong to organization' USING ERRCODE = '22023'; END IF;
  IF nullif(btrim(p_description),'') IS NULL THEN RAISE EXCEPTION 'Description required' USING ERRCODE = '22023'; END IF;
  IF p_technician_id IS NOT NULL THEN PERFORM public.assert_eligible_technician(p_technician_id); END IF;
  INSERT INTO public.jobs(breakdown_id, maintenance_occurrence_id, organization_id, location_id, equipment_id, job_type, description, priority, status,
    assigned_technician_id, assigned_at, scheduled_for, contact_name, contact_phone, contact_email, internal_notes, created_by)
  VALUES (p_breakdown_id, p_maintenance_occurrence_id, p_organization_id, p_location_id, p_equipment_id, coalesce(p_job_type,'breakdown'), btrim(p_description),
    coalesce(p_priority,'normal'), CASE WHEN p_technician_id IS NULL THEN 'open' ELSE 'assigned' END, p_technician_id,
    CASE WHEN p_technician_id IS NULL THEN NULL ELSE now() END, p_scheduled_for, v_b.contact_name, v_b.contact_phone, v_b.contact_email,
    nullif(btrim(p_internal_notes),''), auth.uid())
  RETURNING * INTO v_job;
  PERFORM public.log_job_event(v_job, 'created', NULL, NULL);
  IF p_technician_id IS NOT NULL THEN
    PERFORM public.notify_job_parties(v_job, 'job.assigned', 'New job ' || v_job.reference || ' assigned to you', v_job.description, false, false, true);
  ELSE
    PERFORM public.notify_members(public.stgl_organization_id(), 'job.execute', NULL, false, 'job.available', 'New job available: ' || v_job.reference, v_job.description, 'job', v_job.id, '/jobs/' || v_job.id, auth.uid());
  END IF;
  RETURN public.job_public_json(v_job, true);
END $$;

CREATE OR REPLACE FUNCTION public.assign_job(p_job_id uuid, p_technician_id uuid, p_scheduled_for date DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_job public.jobs%ROWTYPE; v_from text; v_prev uuid;
BEGIN
  IF NOT public.is_stgl('job.manage') THEN RAISE EXCEPTION 'Job management denied' USING ERRCODE = '42501'; END IF;
  PERFORM public.assert_eligible_technician(p_technician_id);
  SELECT * INTO v_job FROM public.jobs WHERE id = p_job_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Job not found' USING ERRCODE = '22023'; END IF;
  IF v_job.status NOT IN ('open','assigned','accepted','en_route','on_hold') THEN RAISE EXCEPTION 'Job cannot be assigned from status %', v_job.status USING ERRCODE = '22023'; END IF;
  v_from := v_job.status; v_prev := v_job.assigned_technician_id;
  UPDATE public.jobs SET assigned_technician_id = p_technician_id, status = 'assigned', assigned_at = now(), accepted_at = NULL, en_route_at = NULL,
    scheduled_for = coalesce(p_scheduled_for, scheduled_for), updated_at = now() WHERE id = p_job_id RETURNING * INTO v_job;
  PERFORM public.log_job_event(v_job, CASE WHEN v_prev IS NULL THEN 'assigned' ELSE 'reassigned' END, v_from, NULL);
  PERFORM public.notify_job_parties(v_job, CASE WHEN v_prev IS NULL THEN 'job.assigned' ELSE 'job.reassigned' END, 'Job ' || v_job.reference || ' assigned to you', v_job.description, false, false, true);
  IF v_prev IS NOT NULL AND v_prev <> p_technician_id THEN
    PERFORM public.notify_user(v_prev, public.stgl_organization_id(), 'job.reassigned', 'Job ' || v_job.reference || ' reassigned', 'This job was reassigned to another technician', 'job', v_job.id, '/jobs/' || v_job.id);
  END IF;
  RETURN public.job_public_json(v_job, true);
END $$;

-- Atomic pickup: only one technician can win
CREATE OR REPLACE FUNCTION public.pickup_job(p_job_id uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_job public.jobs%ROWTYPE;
BEGIN
  IF NOT public.is_stgl('job.execute') THEN RAISE EXCEPTION 'Technician access required' USING ERRCODE = '42501'; END IF;
  UPDATE public.jobs SET status = 'accepted', assigned_technician_id = auth.uid(), assigned_at = now(), accepted_at = now(), updated_at = now()
  WHERE id = p_job_id AND status = 'open' AND assigned_technician_id IS NULL RETURNING * INTO v_job;
  IF NOT FOUND THEN RAISE EXCEPTION 'Job is no longer available' USING ERRCODE = '40001'; END IF;
  PERFORM public.log_job_event(v_job, 'picked_up', 'open', NULL);
  PERFORM public.notify_job_parties(v_job, 'job.accepted', 'Job ' || v_job.reference || ' picked up', coalesce((SELECT full_name FROM public.profiles WHERE id = auth.uid()),'Technician') || ' picked up this job', true, true, false);
  RETURN public.job_public_json(v_job, true);
END $$;

CREATE OR REPLACE FUNCTION public.transition_job(p_job_id uuid, p_action text, p_reason text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_job public.jobs%ROWTYPE; v_from text; v_is_tech boolean; v_mgr boolean := public.is_stgl('job.manage'); v_reason text := nullif(btrim(p_reason),'');
  v_tech_name text;
BEGIN
  SELECT * INTO v_job FROM public.jobs WHERE id = p_job_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Job not found' USING ERRCODE = '22023'; END IF;
  v_is_tech := v_job.assigned_technician_id = auth.uid() AND public.is_stgl('job.execute');
  IF NOT v_is_tech AND NOT (v_mgr AND p_action IN ('return','hold','resume')) THEN RAISE EXCEPTION 'Only the assigned technician may do this' USING ERRCODE = '42501'; END IF;
  v_from := v_job.status; v_tech_name := coalesce((SELECT full_name FROM public.profiles WHERE id = v_job.assigned_technician_id),'Technician');
  IF p_action = 'accept' AND v_from = 'assigned' THEN
    UPDATE public.jobs SET status = 'accepted', accepted_at = now(), updated_at = now() WHERE id = p_job_id RETURNING * INTO v_job;
    PERFORM public.notify_job_parties(v_job, 'job.accepted', 'Job ' || v_job.reference || ' accepted', v_tech_name || ' accepted the job', true, false, false);
  ELSIF p_action IN ('decline','return') AND v_from IN ('assigned','accepted') THEN
    IF v_reason IS NULL THEN RAISE EXCEPTION 'Reason required' USING ERRCODE = '22023'; END IF;
    UPDATE public.jobs SET status = 'open', assigned_technician_id = NULL, assigned_at = NULL, accepted_at = NULL, updated_at = now() WHERE id = p_job_id RETURNING * INTO v_job;
    PERFORM public.notify_job_parties(v_job, 'job.returned', 'Job ' || v_job.reference || ' returned to queue', v_reason, true, false, false);
    PERFORM public.notify_members(public.stgl_organization_id(), 'job.execute', NULL, false, 'job.available', 'Job available: ' || v_job.reference, v_job.description, 'job', v_job.id, '/jobs/' || v_job.id, auth.uid());
  ELSIF p_action = 'en_route' AND v_from = 'accepted' THEN
    UPDATE public.jobs SET status = 'en_route', en_route_at = now(), updated_at = now() WHERE id = p_job_id RETURNING * INTO v_job;
    PERFORM public.notify_job_parties(v_job, 'job.en_route', 'Technician on the way', v_tech_name || ' is en route for ' || v_job.reference, false, true, false);
  ELSIF p_action = 'start' AND v_from IN ('accepted','en_route') THEN
    UPDATE public.jobs SET status = 'in_progress', started_at = coalesce(started_at, now()), updated_at = now() WHERE id = p_job_id RETURNING * INTO v_job;
    PERFORM public.notify_job_parties(v_job, 'job.started', 'Technician on site', v_tech_name || ' started work on ' || v_job.reference, false, true, false);
  ELSIF p_action = 'hold' AND v_from IN ('accepted','en_route','in_progress') THEN
    IF v_reason IS NULL THEN RAISE EXCEPTION 'Hold reason required' USING ERRCODE = '22023'; END IF;
    UPDATE public.jobs SET status = 'on_hold', hold_reason = v_reason, updated_at = now() WHERE id = p_job_id RETURNING * INTO v_job;
    PERFORM public.notify_job_parties(v_job, 'job.on_hold', 'Job ' || v_job.reference || ' on hold', v_reason, true, true, false);
  ELSIF p_action = 'resume' AND v_from = 'on_hold' THEN
    IF v_job.assigned_technician_id IS NULL THEN RAISE EXCEPTION 'Assign a technician first' USING ERRCODE = '22023'; END IF;
    UPDATE public.jobs SET status = 'in_progress', hold_reason = NULL, started_at = coalesce(started_at, now()), updated_at = now() WHERE id = p_job_id RETURNING * INTO v_job;
  ELSE
    RAISE EXCEPTION 'Invalid transition % from %', p_action, v_from USING ERRCODE = '22023';
  END IF;
  PERFORM public.log_job_event(v_job, p_action, v_from, v_reason);
  RETURN public.job_public_json(v_job, true);
END $$;

CREATE OR REPLACE FUNCTION public.build_job_card_snapshot(p_job public.jobs) RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT jsonb_build_object(
    'company', (SELECT to_jsonb(cb) - 'updated_by' FROM public.company_branding cb WHERE cb.organization_id = public.stgl_organization_id()),
    'job', jsonb_build_object('reference', p_job.reference, 'job_type', p_job.job_type, 'priority', p_job.priority, 'description', p_job.description),
    'breakdown', (SELECT jsonb_build_object('reference', b.reference, 'fault_description', b.fault_description, 'fault_category', b.fault_category, 'reported_at', b.reported_at)
                  FROM public.breakdowns b WHERE b.id = p_job.breakdown_id),
    'client', (SELECT jsonb_build_object('id', o.id, 'name', o.name) FROM public.organizations o WHERE o.id = p_job.organization_id),
    'location', (SELECT jsonb_build_object('id', l.id, 'name', l.name, 'code', l.location_code, 'city', l.city, 'province', l.province, 'address', l.address) FROM public.locations l WHERE l.id = p_job.location_id),
    'equipment', (SELECT jsonb_build_object('id', e.id, 'name', e.equipment_name, 'serial_number', e.serial_number, 'asset_tag', e.asset_tag) FROM public.equipment e WHERE e.id = p_job.equipment_id),
    'technician', (SELECT jsonb_build_object('id', pr.id, 'name', pr.full_name) FROM public.profiles pr WHERE pr.id = p_job.assigned_technician_id),
    'timestamps', jsonb_build_object('assigned_at', p_job.assigned_at, 'accepted_at', p_job.accepted_at, 'en_route_at', p_job.en_route_at, 'started_at', p_job.started_at)) $$;

CREATE OR REPLACE FUNCTION public.complete_job(p_job_id uuid, p_fault_identified text, p_work_carried_out text, p_repair_outcome text,
  p_signature_method text, p_recommendations text DEFAULT NULL, p_client_representative_name text DEFAULT NULL, p_signature_data text DEFAULT NULL,
  p_physical_card_reference text DEFAULT NULL, p_no_signature_reason text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_job public.jobs%ROWTYPE; v_card public.job_cards%ROWTYPE; v_from text; v_rev integer;
BEGIN
  SELECT * INTO v_job FROM public.jobs WHERE id = p_job_id FOR UPDATE;
  IF NOT FOUND OR v_job.assigned_technician_id IS DISTINCT FROM auth.uid() OR NOT public.is_stgl('job.execute') THEN
    RAISE EXCEPTION 'Only the assigned technician may complete this job' USING ERRCODE = '42501'; END IF;
  IF v_job.status <> 'in_progress' THEN RAISE EXCEPTION 'Job must be in progress to complete' USING ERRCODE = '22023'; END IF;
  IF nullif(btrim(p_fault_identified),'') IS NULL OR nullif(btrim(p_work_carried_out),'') IS NULL THEN
    RAISE EXCEPTION 'Fault identified and work carried out are required' USING ERRCODE = '22023'; END IF;
  IF p_repair_outcome NOT IN ('fully_resolved','partially_resolved','not_resolved') THEN RAISE EXCEPTION 'Invalid repair outcome' USING ERRCODE = '22023'; END IF;
  IF p_signature_method NOT IN ('digital','physical','none') THEN RAISE EXCEPTION 'Invalid signature method' USING ERRCODE = '22023'; END IF;
  IF p_signature_method = 'digital' AND (nullif(btrim(p_signature_data),'') IS NULL OR nullif(btrim(p_client_representative_name),'') IS NULL) THEN
    RAISE EXCEPTION 'Digital signature requires signature data and representative name' USING ERRCODE = '22023'; END IF;
  IF p_signature_data IS NOT NULL AND length(p_signature_data) > 500000 THEN RAISE EXCEPTION 'Signature too large' USING ERRCODE = '22023'; END IF;
  v_from := v_job.status;
  INSERT INTO public.job_cards(job_id, organization_id, snapshot, fault_identified, work_carried_out, repair_outcome, recommendations,
    client_representative_name, signature_method, signature_data, physical_card_reference, no_signature_reason, technician_id, created_by)
  VALUES (v_job.id, v_job.organization_id, public.build_job_card_snapshot(v_job), btrim(p_fault_identified), btrim(p_work_carried_out), p_repair_outcome,
    nullif(btrim(p_recommendations),''), nullif(btrim(p_client_representative_name),''), p_signature_method,
    CASE WHEN p_signature_method = 'digital' THEN p_signature_data END, CASE WHEN p_signature_method = 'physical' THEN nullif(btrim(p_physical_card_reference),'') END,
    CASE WHEN p_signature_method = 'none' THEN nullif(btrim(p_no_signature_reason),'') END, auth.uid(), auth.uid())
  RETURNING * INTO v_card;
  IF p_repair_outcome = 'fully_resolved' THEN
    UPDATE public.jobs SET status = 'closed', repair_outcome = p_repair_outcome, completed_at = now(), closed_at = now(), hold_reason = NULL, updated_at = now()
      WHERE id = p_job_id RETURNING * INTO v_job;
    PERFORM public.log_job_event(v_job, 'completed', v_from, NULL);
    PERFORM public.notify_job_parties(v_job, 'job.completed', 'Job ' || v_job.reference || ' completed', 'Repair fully resolved. Job card ' || v_card.reference, true, true, false);
  ELSE
    UPDATE public.jobs SET status = 'on_hold', repair_outcome = p_repair_outcome, completed_at = now(),
      hold_reason = 'Follow-up required: ' || replace(p_repair_outcome,'_',' '), updated_at = now() WHERE id = p_job_id RETURNING * INTO v_job;
    PERFORM public.log_job_event(v_job, 'visit_completed_unresolved', v_from, p_repair_outcome);
    PERFORM public.notify_job_parties(v_job, 'job.on_hold', 'Job ' || v_job.reference || ' needs follow-up', replace(p_repair_outcome,'_',' '), true, true, false);
  END IF;
  INSERT INTO public.audit_logs(organization_id, actor_user_id, action, entity_type, entity_id, new_values)
  VALUES (v_job.organization_id, auth.uid(), 'job_card.finalized', 'job_card', v_card.id, to_jsonb(v_card) - 'signature_data');
  RETURN jsonb_build_object('job', public.job_public_json(v_job, true), 'job_card', to_jsonb(v_card) - 'signature_data');
END $$;

CREATE OR REPLACE FUNCTION public.manage_job(p_job_id uuid, p_action text, p_reason text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_job public.jobs%ROWTYPE; v_from text; v_reason text := nullif(btrim(p_reason),''); v_prev uuid;
BEGIN
  IF NOT public.is_stgl('job.manage') THEN RAISE EXCEPTION 'Job management denied' USING ERRCODE = '42501'; END IF;
  SELECT * INTO v_job FROM public.jobs WHERE id = p_job_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Job not found' USING ERRCODE = '22023'; END IF;
  IF v_reason IS NULL THEN RAISE EXCEPTION 'Reason required' USING ERRCODE = '22023'; END IF;
  v_from := v_job.status; v_prev := v_job.assigned_technician_id;
  IF p_action = 'close' AND v_from = 'on_hold' THEN
    UPDATE public.jobs SET status = 'closed', closed_at = now(), close_reason = v_reason, updated_at = now() WHERE id = p_job_id RETURNING * INTO v_job;
    PERFORM public.notify_job_parties(v_job, 'job.completed', 'Job ' || v_job.reference || ' closed', v_reason, false, true, true);
  ELSIF p_action = 'cancel' AND v_from NOT IN ('closed','cancelled') THEN
    UPDATE public.jobs SET status = 'cancelled', cancelled_at = now(), cancel_reason = v_reason, updated_at = now() WHERE id = p_job_id RETURNING * INTO v_job;
    PERFORM public.notify_job_parties(v_job, 'job.cancelled', 'Job ' || v_job.reference || ' cancelled', v_reason, false, true, true);
  ELSIF p_action = 'reopen' AND v_from = 'closed' THEN
    UPDATE public.jobs SET status = 'open', assigned_technician_id = NULL, assigned_at = NULL, accepted_at = NULL, en_route_at = NULL,
      closed_at = NULL, close_reason = NULL, hold_reason = NULL, updated_at = now() WHERE id = p_job_id RETURNING * INTO v_job;
    PERFORM public.notify_members(public.stgl_organization_id(), 'job.execute', NULL, false, 'job.available', 'Job reopened: ' || v_job.reference, v_reason, 'job', v_job.id, '/jobs/' || v_job.id, auth.uid());
  ELSE RAISE EXCEPTION 'Invalid action % from %', p_action, v_from USING ERRCODE = '22023'; END IF;
  PERFORM public.log_job_event(v_job, p_action, v_from, v_reason);
  RETURN public.job_public_json(v_job, true);
END $$;

CREATE OR REPLACE FUNCTION public.list_jobs(p_view text DEFAULT 'all', p_organization_id uuid DEFAULT NULL, p_status text DEFAULT NULL,
  p_technician_id uuid DEFAULT NULL, p_location_id uuid DEFAULT NULL, p_overdue_only boolean DEFAULT false, p_limit integer DEFAULT 100, p_offset integer DEFAULT 0)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_mgr boolean := public.is_stgl('job.manage') OR public.is_stgl('breakdown.manage'); v_tech boolean := public.is_stgl('job.execute');
BEGIN
  IF NOT public.is_active_user() THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501'; END IF;
  IF NOT v_mgr AND NOT v_tech AND (p_organization_id IS NULL OR NOT public.has_org_permission(p_organization_id, 'breakdown.view')) THEN
    RAISE EXCEPTION 'Job access denied' USING ERRCODE = '42501'; END IF;
  RETURN coalesce((SELECT jsonb_agg(public.job_public_json(j, v_mgr OR v_tech) ORDER BY j.created_at DESC) FROM (
    SELECT j.* FROM public.jobs j
    WHERE (p_organization_id IS NULL OR j.organization_id = p_organization_id)
      AND (p_status IS NULL OR j.status = p_status)
      AND (p_technician_id IS NULL OR j.assigned_technician_id = p_technician_id)
      AND (p_location_id IS NULL OR j.location_id = p_location_id)
      AND (NOT p_overdue_only OR (j.scheduled_for < current_date AND j.status NOT IN ('closed','cancelled')))
      AND (CASE WHEN p_view = 'available' THEN j.status = 'open' AND j.assigned_technician_id IS NULL AND (v_tech OR v_mgr)
                WHEN p_view = 'mine' THEN j.assigned_technician_id = auth.uid()
                ELSE true END)
      AND (v_mgr OR (v_tech AND (j.assigned_technician_id = auth.uid() OR j.status = 'open'))
           OR (NOT v_tech AND public.has_org_permission(j.organization_id, 'breakdown.view') AND public.user_can_see_location(auth.uid(), j.organization_id, j.location_id)))
    ORDER BY j.created_at DESC LIMIT least(greatest(p_limit,1),500) OFFSET greatest(p_offset,0)) j), '[]'::jsonb);
END $$;

CREATE OR REPLACE FUNCTION public.get_job(p_job_id uuid) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_job public.jobs%ROWTYPE; v_internal boolean;
BEGIN
  SELECT * INTO v_job FROM public.jobs WHERE id = p_job_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Job access denied' USING ERRCODE = '42501'; END IF;
  v_internal := public.is_stgl('job.manage') OR public.is_stgl('breakdown.manage')
    OR (public.is_stgl('job.execute') AND (v_job.assigned_technician_id = auth.uid() OR v_job.status = 'open'));
  IF NOT v_internal AND NOT (public.has_org_permission(v_job.organization_id, 'breakdown.view') AND public.user_can_see_location(auth.uid(), v_job.organization_id, v_job.location_id)) THEN
    RAISE EXCEPTION 'Job access denied' USING ERRCODE = '42501'; END IF;
  RETURN public.job_public_json(v_job, v_internal) || jsonb_build_object(
    'events', coalesce((SELECT jsonb_agg(jsonb_build_object('action', e.action, 'from_status', e.from_status, 'to_status', e.to_status, 'reason', e.reason, 'created_at', e.created_at) ORDER BY e.created_at)
                        FROM public.job_events e WHERE e.job_id = v_job.id), '[]'::jsonb),
    'job_cards', coalesce((SELECT jsonb_agg(to_jsonb(c) - 'signature_data' || jsonb_build_object('has_signature', c.signature_data IS NOT NULL,
        'is_superseded', EXISTS (SELECT 1 FROM public.job_cards x WHERE x.supersedes_job_card_id = c.id)) ORDER BY c.created_at)
                        FROM public.job_cards c WHERE c.job_id = v_job.id), '[]'::jsonb));
END $$;

CREATE OR REPLACE FUNCTION public.get_job_card(p_job_card_id uuid) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_c public.job_cards%ROWTYPE; v_job public.jobs%ROWTYPE;
BEGIN
  SELECT * INTO v_c FROM public.job_cards WHERE id = p_job_card_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Job card access denied' USING ERRCODE = '42501'; END IF;
  SELECT * INTO v_job FROM public.jobs WHERE id = v_c.job_id;
  IF NOT (public.is_stgl('job.manage') OR (public.is_stgl('job.execute') AND v_job.assigned_technician_id = auth.uid()) OR v_c.technician_id = auth.uid()
     OR (public.has_org_permission(v_job.organization_id, 'breakdown.view') AND public.user_can_see_location(auth.uid(), v_job.organization_id, v_job.location_id))) THEN
    RAISE EXCEPTION 'Job card access denied' USING ERRCODE = '42501'; END IF;
  RETURN to_jsonb(v_c) || jsonb_build_object('is_superseded', EXISTS (SELECT 1 FROM public.job_cards x WHERE x.supersedes_job_card_id = v_c.id));
END $$;

CREATE OR REPLACE FUNCTION public.correct_job_card(p_job_card_id uuid, p_correction_reason text, p_fault_identified text DEFAULT NULL,
  p_work_carried_out text DEFAULT NULL, p_repair_outcome text DEFAULT NULL, p_recommendations text DEFAULT NULL, p_physical_card_reference text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_c public.job_cards%ROWTYPE; v_new public.job_cards%ROWTYPE;
BEGIN
  IF NOT public.is_stgl('jobcard.correct') THEN RAISE EXCEPTION 'Job card correction denied' USING ERRCODE = '42501'; END IF;
  IF length(btrim(coalesce(p_correction_reason,''))) < 5 THEN RAISE EXCEPTION 'Correction reason required' USING ERRCODE = '22023'; END IF;
  SELECT * INTO v_c FROM public.job_cards WHERE id = p_job_card_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Job card not found' USING ERRCODE = '22023'; END IF;
  IF EXISTS (SELECT 1 FROM public.job_cards WHERE supersedes_job_card_id = v_c.id) THEN RAISE EXCEPTION 'Correct the latest revision' USING ERRCODE = '22023'; END IF;
  IF p_repair_outcome IS NOT NULL AND p_repair_outcome NOT IN ('fully_resolved','partially_resolved','not_resolved') THEN RAISE EXCEPTION 'Invalid repair outcome' USING ERRCODE = '22023'; END IF;
  INSERT INTO public.job_cards(reference, job_id, organization_id, revision, supersedes_job_card_id, correction_reason, snapshot, fault_identified, work_carried_out,
    repair_outcome, recommendations, client_representative_name, signature_method, signature_data, physical_card_reference, no_signature_reason, technician_id, service_date, created_by)
  VALUES (v_c.reference, v_c.job_id, v_c.organization_id, v_c.revision + 1, v_c.id, btrim(p_correction_reason), v_c.snapshot,
    coalesce(nullif(btrim(p_fault_identified),''), v_c.fault_identified), coalesce(nullif(btrim(p_work_carried_out),''), v_c.work_carried_out),
    coalesce(p_repair_outcome, v_c.repair_outcome), coalesce(p_recommendations, v_c.recommendations), v_c.client_representative_name, v_c.signature_method,
    v_c.signature_data, coalesce(p_physical_card_reference, v_c.physical_card_reference), v_c.no_signature_reason, v_c.technician_id, v_c.service_date, auth.uid())
  RETURNING * INTO v_new;
  INSERT INTO public.audit_logs(organization_id, actor_user_id, action, entity_type, entity_id, old_values, new_values)
  VALUES (v_c.organization_id, auth.uid(), 'job_card.corrected', 'job_card', v_new.id, to_jsonb(v_c) - 'signature_data', to_jsonb(v_new) - 'signature_data');
  RETURN to_jsonb(v_new) - 'signature_data';
END $$;

CREATE OR REPLACE FUNCTION public.job_dashboard_summary() RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NOT (public.is_stgl('job.manage') OR public.is_stgl('breakdown.manage')) THEN RAISE EXCEPTION 'Denied' USING ERRCODE = '42501'; END IF;
  RETURN jsonb_build_object(
    'incoming_breakdowns', (SELECT count(*) FROM public.breakdowns b WHERE b.cancelled_at IS NULL AND NOT EXISTS (SELECT 1 FROM public.jobs j WHERE j.breakdown_id = b.id)),
    'by_status', coalesce((SELECT jsonb_object_agg(status, n) FROM (SELECT status, count(*) n FROM public.jobs GROUP BY status) s), '{}'::jsonb),
    'by_priority', coalesce((SELECT jsonb_object_agg(priority, n) FROM (SELECT priority, count(*) n FROM public.jobs WHERE status NOT IN ('closed','cancelled') GROUP BY priority) s), '{}'::jsonb),
    'overdue', (SELECT count(*) FROM public.jobs WHERE scheduled_for < current_date AND status NOT IN ('closed','cancelled')),
    'by_client', coalesce((SELECT jsonb_agg(jsonb_build_object('organization_id', organization_id, 'name', o.name, 'open', n)) FROM (SELECT organization_id, count(*) n FROM public.jobs WHERE status NOT IN ('closed','cancelled') GROUP BY organization_id) s JOIN public.organizations o ON o.id = s.organization_id), '[]'::jsonb),
    'technician_workload', coalesce((SELECT jsonb_agg(jsonb_build_object('technician_id', s.t, 'name', pr.full_name, 'active', s.n, 'availability', coalesce(ta.status,'available'))) FROM
      (SELECT assigned_technician_id t, count(*) n FROM public.jobs WHERE assigned_technician_id IS NOT NULL AND status NOT IN ('closed','cancelled') GROUP BY 1) s
      LEFT JOIN public.profiles pr ON pr.id = s.t LEFT JOIN public.technician_availability ta ON ta.user_id = s.t), '[]'::jsonb));
END $$;

CREATE OR REPLACE FUNCTION public.technician_home() RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NOT public.is_stgl('job.execute') THEN RAISE EXCEPTION 'Technician access required' USING ERRCODE = '42501'; END IF;
  RETURN jsonb_build_object(
    'available', (SELECT count(*) FROM public.jobs WHERE status = 'open' AND assigned_technician_id IS NULL),
    'assigned', (SELECT count(*) FROM public.jobs WHERE assigned_technician_id = auth.uid() AND status = 'assigned'),
    'active', (SELECT count(*) FROM public.jobs WHERE assigned_technician_id = auth.uid() AND status IN ('accepted','en_route','in_progress','on_hold')),
    'completed_30d', (SELECT count(*) FROM public.job_cards WHERE technician_id = auth.uid() AND supersedes_job_card_id IS NULL AND created_at > now() - interval '30 days'),
    'availability', coalesce((SELECT to_jsonb(t) FROM public.technician_availability t WHERE user_id = auth.uid()), jsonb_build_object('status','available')),
    'unread_notifications', (SELECT count(*) FROM public.notifications WHERE recipient_user_id = auth.uid() AND read_at IS NULL));
END $$;

CREATE OR REPLACE FUNCTION public.set_technician_availability(p_status text, p_note text DEFAULT NULL) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_row public.technician_availability%ROWTYPE;
BEGIN
  IF NOT public.is_stgl('job.execute') THEN RAISE EXCEPTION 'Technician access required' USING ERRCODE = '42501'; END IF;
  IF p_status NOT IN ('available','busy','off_duty','leave') THEN RAISE EXCEPTION 'Invalid availability' USING ERRCODE = '22023'; END IF;
  INSERT INTO public.technician_availability(user_id, status, note, updated_at) VALUES (auth.uid(), p_status, nullif(btrim(p_note),''), now())
  ON CONFLICT (user_id) DO UPDATE SET status = EXCLUDED.status, note = EXCLUDED.note, updated_at = now() RETURNING * INTO v_row;
  RETURN to_jsonb(v_row);
END $$;

CREATE OR REPLACE FUNCTION public.get_company_branding() RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT CASE WHEN public.is_active_user() THEN (SELECT to_jsonb(cb) - 'updated_by' FROM public.company_branding cb WHERE cb.organization_id = public.stgl_organization_id()) END $$;

CREATE OR REPLACE FUNCTION public.save_company_branding(p_legal_name text, p_trading_name text, p_address text, p_phone text, p_email text,
  p_website text, p_registration_number text, p_tax_number text, p_logo_public_url text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_row public.company_branding%ROWTYPE;
BEGIN
  IF NOT public.is_stgl('configuration.manage') THEN RAISE EXCEPTION 'Denied' USING ERRCODE = '42501'; END IF;
  UPDATE public.company_branding SET legal_name = coalesce(nullif(btrim(p_legal_name),''), legal_name), trading_name = p_trading_name, address = p_address,
    phone = p_phone, email = p_email, website = p_website, registration_number = p_registration_number, tax_number = p_tax_number,
    logo_public_url = coalesce(p_logo_public_url, logo_public_url), updated_by = auth.uid(), updated_at = now()
  WHERE organization_id = public.stgl_organization_id() RETURNING * INTO v_row;
  INSERT INTO public.audit_logs(organization_id, actor_user_id, action, entity_type, entity_id, new_values)
  VALUES (v_row.organization_id, auth.uid(), 'branding.updated', 'company_branding', v_row.organization_id, to_jsonb(v_row));
  RETURN to_jsonb(v_row);
END $$;