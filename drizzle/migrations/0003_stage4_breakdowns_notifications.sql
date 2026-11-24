-- Stage 4/5: permissions
INSERT INTO public.permissions(permission_code, module, description, is_delegable) VALUES
 ('breakdown.report','breakdowns','Report breakdowns for permitted locations',true),
 ('breakdown.view','breakdowns','View breakdowns and job progress for permitted locations',true),
 ('breakdown.manage','breakdowns','STGL: triage, escalate and cancel breakdowns',true),
 ('job.view','jobs','STGL: view jobs',true),
 ('job.manage','jobs','STGL: create, assign, close, cancel and reopen jobs',true),
 ('job.execute','jobs','STGL technician: pick up and execute jobs',true),
 ('jobcard.correct','jobs','STGL: issue corrected job card revisions',true),
 ('inventory.view','inventory','STGL: view inventory and stock movements',true),
 ('inventory.manage','inventory','STGL: manage products, stock, pricing and store publication',true),
 ('inventory.cost.view','inventory','STGL: view internal cost prices and supplier references',true),
 ('order.manage','store','STGL: confirm, fulfil, cancel orders and record commercial references',true),
 ('store.browse','store','Client: browse the STGL client store',true),
 ('store.order.place','store','Client: place store orders',true),
 ('store.order.view','store','Client: view own organization orders',true),
 ('notification.manage','notifications','Configure notification channels and recipients',true)
ON CONFLICT (permission_code) DO NOTHING;

INSERT INTO public.role_permissions(role_id, permission_id)
SELECT r.id, p.id FROM public.roles r JOIN public.organizations o ON o.id = r.organization_id
JOIN public.permissions p ON p.permission_code = ANY (CASE
  WHEN o.organization_type = 'stgl' AND r.name IN ('Owner','Admin') THEN ARRAY['breakdown.report','breakdown.view','breakdown.manage','job.view','job.manage','job.execute','jobcard.correct','inventory.view','inventory.manage','inventory.cost.view','order.manage','notification.manage']
  WHEN o.organization_type = 'stgl' AND r.name IN ('Manager','Department Head') THEN ARRAY['breakdown.view','breakdown.manage','job.view','job.manage','inventory.view']
  WHEN o.organization_type = 'stgl' AND r.name = 'Technician' THEN ARRAY['job.view','job.execute']
  WHEN o.organization_type = 'client' AND r.name = 'Client Admin' THEN ARRAY['breakdown.report','breakdown.view','store.browse','store.order.place','store.order.view','notification.manage']
  WHEN o.organization_type = 'client' AND r.name IN ('Manager','Department Head') THEN ARRAY['breakdown.report','breakdown.view','store.browse','store.order.place','store.order.view']
  WHEN o.organization_type = 'client' AND r.name = 'Store Manager' THEN ARRAY['breakdown.report','breakdown.view']
  ELSE ARRAY[]::text[] END)
ON CONFLICT DO NOTHING;

-- Helpers (user-parameterised permission checks for notification fan-out)
CREATE OR REPLACE FUNCTION public.stgl_organization_id() RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT id FROM public.organizations WHERE organization_type = 'stgl' AND status = 'active' ORDER BY created_at LIMIT 1 $$;

CREATE OR REPLACE FUNCTION public.user_has_org_permission(p_user uuid, p_org uuid, p_perm text) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (SELECT 1 FROM public.organization_members om
    JOIN public.member_roles mr ON mr.member_id = om.id AND mr.organization_id = om.organization_id
    JOIN public.role_permissions rp ON rp.role_id = mr.role_id JOIN public.permissions p ON p.id = rp.permission_id
    JOIN public.profiles pr ON pr.id = om.user_id AND pr.status = 'active'
    WHERE om.user_id = p_user AND om.organization_id = p_org AND om.membership_status = 'active' AND p.permission_code = p_perm) $$;

CREATE OR REPLACE FUNCTION public.user_can_see_location(p_user uuid, p_org uuid, p_loc uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT public.user_has_org_permission(p_user, p_org, 'location.scope.organization')
      OR (p_loc IS NOT NULL AND EXISTS (SELECT 1 FROM public.member_locations ml JOIN public.organization_members om ON om.id = ml.member_id
           WHERE om.user_id = p_user AND om.organization_id = p_org AND ml.location_id = p_loc)) $$;

-- Caller can see a client record (breakdown/job) at org+location
CREATE OR REPLACE FUNCTION public.can_view_client_service_record(p_org uuid, p_loc uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT public.is_active_user() AND (
    public.has_org_permission(public.stgl_organization_id(), 'job.manage')
    OR public.has_org_permission(public.stgl_organization_id(), 'breakdown.manage')
    OR (public.has_org_permission(p_org, 'breakdown.view') AND public.user_can_see_location(auth.uid(), p_org, p_loc))) $$;

-- Notifications
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_user_id uuid NOT NULL,
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  notification_type text NOT NULL,
  title text NOT NULL, body text,
  entity_type text, entity_id uuid, link text,
  read_at timestamptz, created_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX notifications_recipient_idx ON public.notifications(recipient_user_id, created_at DESC);
CREATE INDEX notifications_unread_idx ON public.notifications(recipient_user_id) WHERE read_at IS NULL;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.notification_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  event_type text NOT NULL,
  in_app_enabled boolean NOT NULL DEFAULT true,
  push_enabled boolean NOT NULL DEFAULT false,
  email_enabled boolean NOT NULL DEFAULT false,
  email_recipients text[] NOT NULL DEFAULT '{}',
  updated_by uuid, updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, event_type));
GRANT ALL ON public.notification_settings TO service_role;
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;

-- Outbox for Stage 6 providers (OneSignal / Resend). Never marked sent here.
CREATE TABLE public.notification_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  event_type text NOT NULL,
  channel text NOT NULL CHECK (channel IN ('push','email')),
  recipient_user_ids uuid[] NOT NULL DEFAULT '{}',
  email_recipients text[] NOT NULL DEFAULT '{}',
  payload jsonb NOT NULL,
  status text NOT NULL DEFAULT 'pending_provider' CHECK (status IN ('pending_provider','sent','failed','skipped')),
  created_at timestamptz NOT NULL DEFAULT now(), processed_at timestamptz);
GRANT ALL ON public.notification_deliveries TO service_role;
ALTER TABLE public.notification_deliveries ENABLE ROW LEVEL SECURITY;

INSERT INTO public.notification_settings(organization_id, event_type, push_enabled, email_enabled)
SELECT o.id, e.ev, e.push, e.email FROM public.organizations o CROSS JOIN (VALUES
 ('breakdown.reported',true,true),('breakdown.escalated',true,true),('job.assigned',true,false),('job.reassigned',true,false),
 ('job.accepted',false,false),('job.en_route',false,false),('job.started',false,false),('job.on_hold',false,false),
 ('job.completed',false,false),('job.cancelled',true,false),('job.available',true,false),('order.placed',false,false),('order.status_changed',false,false)) e(ev,push,email)
WHERE o.organization_type = 'stgl' ON CONFLICT DO NOTHING;

-- Internal fan-out: recipients = active members of p_org holding p_perm and able to see p_loc (when p_loc_scoped)
CREATE OR REPLACE FUNCTION public.notify_members(p_org uuid, p_perm text, p_loc uuid, p_loc_scoped boolean, p_type text,
  p_title text, p_body text, p_entity_type text, p_entity_id uuid, p_link text, p_exclude uuid DEFAULT NULL)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_users uuid[]; v_set public.notification_settings%ROWTYPE;
BEGIN
  SELECT * INTO v_set FROM public.notification_settings WHERE organization_id = public.stgl_organization_id() AND event_type = p_type;
  IF FOUND AND NOT v_set.in_app_enabled THEN RETURN 0; END IF;
  SELECT coalesce(array_agg(DISTINCT om.user_id), '{}') INTO v_users FROM public.organization_members om
  WHERE om.organization_id = p_org AND om.membership_status = 'active' AND om.user_id IS DISTINCT FROM p_exclude
    AND public.user_has_org_permission(om.user_id, p_org, p_perm)
    AND (NOT p_loc_scoped OR public.user_can_see_location(om.user_id, p_org, p_loc));
  INSERT INTO public.notifications(recipient_user_id, organization_id, notification_type, title, body, entity_type, entity_id, link)
  SELECT u, p_org, p_type, p_title, p_body, p_entity_type, p_entity_id, p_link FROM unnest(v_users) u;
  IF FOUND AND v_set.push_enabled AND cardinality(v_users) > 0 THEN
    INSERT INTO public.notification_deliveries(organization_id, event_type, channel, recipient_user_ids, payload)
    VALUES (p_org, p_type, 'push', v_users, jsonb_build_object('title',p_title,'body',p_body,'entity_type',p_entity_type,'entity_id',p_entity_id,'link',p_link));
  END IF;
  RETURN cardinality(v_users);
END $$;

CREATE OR REPLACE FUNCTION public.notify_user(p_user uuid, p_org uuid, p_type text, p_title text, p_body text,
  p_entity_type text, p_entity_id uuid, p_link text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_set public.notification_settings%ROWTYPE;
BEGIN
  IF p_user IS NULL THEN RETURN; END IF;
  SELECT * INTO v_set FROM public.notification_settings WHERE organization_id = public.stgl_organization_id() AND event_type = p_type;
  IF FOUND AND NOT v_set.in_app_enabled THEN RETURN; END IF;
  INSERT INTO public.notifications(recipient_user_id, organization_id, notification_type, title, body, entity_type, entity_id, link)
  VALUES (p_user, p_org, p_type, p_title, p_body, p_entity_type, p_entity_id, p_link);
  IF FOUND AND v_set.push_enabled THEN
    INSERT INTO public.notification_deliveries(organization_id, event_type, channel, recipient_user_ids, payload)
    VALUES (p_org, p_type, 'push', ARRAY[p_user], jsonb_build_object('title',p_title,'body',p_body,'entity_type',p_entity_type,'entity_id',p_entity_id,'link',p_link));
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.list_my_notifications(p_unread_only boolean DEFAULT false, p_limit integer DEFAULT 50, p_offset integer DEFAULT 0)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NOT public.is_active_user() THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501'; END IF;
  RETURN jsonb_build_object(
    'unread_count', (SELECT count(*) FROM public.notifications WHERE recipient_user_id = auth.uid() AND read_at IS NULL),
    'items', coalesce((SELECT jsonb_agg(to_jsonb(n) ORDER BY n.created_at DESC) FROM (
       SELECT * FROM public.notifications WHERE recipient_user_id = auth.uid() AND (NOT p_unread_only OR read_at IS NULL)
       ORDER BY created_at DESC LIMIT least(greatest(p_limit,1),200) OFFSET greatest(p_offset,0)) n), '[]'::jsonb));
END $$;

CREATE OR REPLACE FUNCTION public.mark_notification_read(p_notification_id uuid) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  UPDATE public.notifications SET read_at = coalesce(read_at, now()) WHERE id = p_notification_id AND recipient_user_id = auth.uid();
  RETURN FOUND;
END $$;

CREATE OR REPLACE FUNCTION public.mark_all_notifications_read() RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE n integer;
BEGIN
  UPDATE public.notifications SET read_at = now() WHERE recipient_user_id = auth.uid() AND read_at IS NULL;
  GET DIAGNOSTICS n = ROW_COUNT; RETURN n;
END $$;

CREATE OR REPLACE FUNCTION public.save_notification_setting(p_event_type text, p_in_app boolean, p_push boolean, p_email boolean, p_email_recipients text[])
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_org uuid := public.stgl_organization_id(); v_row public.notification_settings%ROWTYPE;
BEGIN
  IF NOT public.has_org_permission(v_org, 'notification.manage') THEN RAISE EXCEPTION 'Notification configuration denied' USING ERRCODE = '42501'; END IF;
  IF EXISTS (SELECT 1 FROM unnest(coalesce(p_email_recipients,'{}')) e WHERE e !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$') THEN
    RAISE EXCEPTION 'Invalid email recipient' USING ERRCODE = '22023'; END IF;
  INSERT INTO public.notification_settings(organization_id, event_type, in_app_enabled, push_enabled, email_enabled, email_recipients, updated_by, updated_at)
  VALUES (v_org, p_event_type, coalesce(p_in_app,true), coalesce(p_push,false), coalesce(p_email,false), coalesce(p_email_recipients,'{}'), auth.uid(), now())
  ON CONFLICT (organization_id, event_type) DO UPDATE SET in_app_enabled = EXCLUDED.in_app_enabled, push_enabled = EXCLUDED.push_enabled,
    email_enabled = EXCLUDED.email_enabled, email_recipients = EXCLUDED.email_recipients, updated_by = EXCLUDED.updated_by, updated_at = now()
  RETURNING * INTO v_row;
  INSERT INTO public.audit_logs(organization_id, actor_user_id, action, entity_type, entity_id, new_values)
  VALUES (v_org, auth.uid(), 'notification.setting_saved', 'notification_setting', v_row.id, to_jsonb(v_row));
  RETURN to_jsonb(v_row);
END $$;

CREATE OR REPLACE FUNCTION public.list_notification_settings() RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NOT public.has_org_permission(public.stgl_organization_id(), 'notification.manage') THEN RAISE EXCEPTION 'Denied' USING ERRCODE = '42501'; END IF;
  RETURN coalesce((SELECT jsonb_agg(to_jsonb(s) ORDER BY s.event_type) FROM public.notification_settings s WHERE s.organization_id = public.stgl_organization_id()), '[]'::jsonb);
END $$;
-- Breakdowns, jobs, job cards
CREATE SEQUENCE public.breakdown_ref_seq; CREATE SEQUENCE public.job_ref_seq; CREATE SEQUENCE public.job_card_ref_seq;
GRANT USAGE ON SEQUENCE public.breakdown_ref_seq, public.job_ref_seq, public.job_card_ref_seq TO service_role;

CREATE TABLE public.breakdowns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference text NOT NULL UNIQUE DEFAULT ('BD-' || to_char(now(),'YYYY') || '-' || lpad(nextval('public.breakdown_ref_seq')::text, 5, '0')),
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  location_id uuid REFERENCES public.locations(id),
  equipment_id uuid REFERENCES public.equipment(id),
  fault_category text,
  fault_description text NOT NULL CHECK (length(btrim(fault_description)) >= 5),
  priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('low','normal','high','critical')),
  channel text NOT NULL DEFAULT 'client_portal' CHECK (channel IN ('client_portal','phone','email','whatsapp','other')),
  reported_by uuid NOT NULL,
  contact_name text, contact_phone text, contact_email text,
  client_request_key text,
  escalated_at timestamptz, escalation_reason text,
  cancelled_at timestamptz, cancel_reason text,
  reported_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now());
CREATE UNIQUE INDEX breakdowns_request_key_uq ON public.breakdowns(organization_id, client_request_key) WHERE client_request_key IS NOT NULL;
CREATE INDEX breakdowns_org_idx ON public.breakdowns(organization_id, reported_at DESC);
GRANT ALL ON public.breakdowns TO service_role;
ALTER TABLE public.breakdowns ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference text NOT NULL UNIQUE DEFAULT ('JB-' || to_char(now(),'YYYY') || '-' || lpad(nextval('public.job_ref_seq')::text, 5, '0')),
  breakdown_id uuid REFERENCES public.breakdowns(id),
  parent_job_id uuid REFERENCES public.jobs(id),
  maintenance_occurrence_id uuid REFERENCES public.equipment_maintenance_occurrences(id),
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  location_id uuid REFERENCES public.locations(id),
  equipment_id uuid REFERENCES public.equipment(id),
  job_type text NOT NULL DEFAULT 'breakdown' CHECK (job_type IN ('breakdown','maintenance','verification','installation','other')),
  description text NOT NULL,
  priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('low','normal','high','critical')),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','assigned','accepted','en_route','in_progress','on_hold','closed','cancelled')),
  assigned_technician_id uuid,
  scheduled_for date,
  contact_name text, contact_phone text, contact_email text,
  internal_notes text,
  hold_reason text,
  repair_outcome text CHECK (repair_outcome IN ('fully_resolved','partially_resolved','not_resolved')),
  close_reason text, cancel_reason text,
  assigned_at timestamptz, accepted_at timestamptz, en_route_at timestamptz, started_at timestamptz,
  completed_at timestamptz, closed_at timestamptz, cancelled_at timestamptz,
  created_by uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((status IN ('open','closed','cancelled')) OR assigned_technician_id IS NOT NULL),
  CHECK (status <> 'on_hold' OR hold_reason IS NOT NULL));
CREATE INDEX jobs_org_status_idx ON public.jobs(organization_id, status);
CREATE INDEX jobs_tech_idx ON public.jobs(assigned_technician_id, status);
CREATE INDEX jobs_breakdown_idx ON public.jobs(breakdown_id, created_at DESC);
CREATE INDEX jobs_open_idx ON public.jobs(created_at) WHERE status = 'open';
GRANT ALL ON public.jobs TO service_role;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.job_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id),
  action text NOT NULL, from_status text, to_status text, reason text,
  technician_id uuid, actor_user_id uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX job_events_job_idx ON public.job_events(job_id, created_at);
GRANT ALL ON public.job_events TO service_role;
ALTER TABLE public.job_events ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.company_branding (
  organization_id uuid PRIMARY KEY REFERENCES public.organizations(id),
  legal_name text NOT NULL, trading_name text, address text, phone text, email text, website text,
  registration_number text, tax_number text, logo_storage_path text, logo_public_url text,
  updated_by uuid, updated_at timestamptz NOT NULL DEFAULT now());
GRANT ALL ON public.company_branding TO service_role;
ALTER TABLE public.company_branding ENABLE ROW LEVEL SECURITY;
INSERT INTO public.company_branding(organization_id, legal_name, logo_public_url)
SELECT id, name, '/spruceland-logo.png' FROM public.organizations WHERE organization_type = 'stgl' ON CONFLICT DO NOTHING;

CREATE TABLE public.job_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference text NOT NULL DEFAULT ('JC-' || to_char(now(),'YYYY') || '-' || lpad(nextval('public.job_card_ref_seq')::text, 5, '0')),
  job_id uuid NOT NULL REFERENCES public.jobs(id),
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  revision integer NOT NULL DEFAULT 1,
  supersedes_job_card_id uuid REFERENCES public.job_cards(id),
  correction_reason text,
  snapshot jsonb NOT NULL,
  fault_identified text NOT NULL, work_carried_out text NOT NULL,
  repair_outcome text NOT NULL CHECK (repair_outcome IN ('fully_resolved','partially_resolved','not_resolved')),
  recommendations text,
  client_representative_name text,
  signature_method text NOT NULL CHECK (signature_method IN ('digital','physical','none')),
  signature_data text, physical_card_reference text, no_signature_reason text,
  technician_id uuid NOT NULL, service_date date NOT NULL DEFAULT current_date,
  created_by uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (signature_method <> 'digital' OR (signature_data IS NOT NULL AND client_representative_name IS NOT NULL)),
  UNIQUE (reference, revision));
CREATE INDEX job_cards_job_idx ON public.job_cards(job_id, created_at);
GRANT ALL ON public.job_cards TO service_role;
ALTER TABLE public.job_cards ENABLE ROW LEVEL SECURITY;
CREATE OR REPLACE FUNCTION public.prevent_job_card_mutation() RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN RAISE EXCEPTION 'Finalized job cards are immutable; issue a corrected revision' USING ERRCODE = '42501'; END $$;
CREATE TRIGGER job_cards_immutable BEFORE UPDATE OR DELETE ON public.job_cards FOR EACH ROW EXECUTE FUNCTION public.prevent_job_card_mutation();

CREATE TABLE public.technician_availability (
  user_id uuid PRIMARY KEY,
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available','busy','off_duty','leave')),
  note text, updated_at timestamptz NOT NULL DEFAULT now());
GRANT ALL ON public.technician_availability TO service_role;
ALTER TABLE public.technician_availability ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.breakdown_email_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  breakdown_id uuid NOT NULL UNIQUE REFERENCES public.breakdowns(id),
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  prepared_for uuid NOT NULL,
  to_recipients text[] NOT NULL DEFAULT '{}', cc_recipients text[] NOT NULL DEFAULT '{}',
  subject text NOT NULL, body text NOT NULL,
  status text NOT NULL DEFAULT 'prepared' CHECK (status IN ('prepared','opened_by_user','sent_confirmed')),
  created_at timestamptz NOT NULL DEFAULT now());
GRANT ALL ON public.breakdown_email_drafts TO service_role;
ALTER TABLE public.breakdown_email_drafts ENABLE ROW LEVEL SECURITY;

-- Internal helpers
CREATE OR REPLACE FUNCTION public.is_stgl(p_perm text) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT public.has_org_permission(public.stgl_organization_id(), p_perm) $$;

CREATE OR REPLACE FUNCTION public.log_job_event(p_job public.jobs, p_action text, p_from text, p_reason text) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  INSERT INTO public.job_events(job_id, action, from_status, to_status, reason, technician_id, actor_user_id)
  VALUES (p_job.id, p_action, p_from, p_job.status, p_reason, p_job.assigned_technician_id, auth.uid());
  INSERT INTO public.audit_logs(organization_id, actor_user_id, action, entity_type, entity_id, old_values, new_values, metadata)
  VALUES (p_job.organization_id, auth.uid(), 'job.' || p_action, 'job', p_job.id, jsonb_build_object('status', p_from),
    jsonb_build_object('status', p_job.status, 'assigned_technician_id', p_job.assigned_technician_id, 'repair_outcome', p_job.repair_outcome),
    jsonb_build_object('reference', p_job.reference, 'reason', p_reason));
END $$;

-- Client-safe job JSON (no internal notes)
CREATE OR REPLACE FUNCTION public.job_public_json(p_job public.jobs, p_internal boolean) RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT (to_jsonb(p_job) - CASE WHEN p_internal THEN 'none' ELSE 'internal_notes' END) || jsonb_build_object(
    'technician_name', (SELECT full_name FROM public.profiles WHERE id = p_job.assigned_technician_id),
    'client_name', (SELECT name FROM public.organizations WHERE id = p_job.organization_id),
    'location_name', (SELECT name FROM public.locations WHERE id = p_job.location_id),
    'equipment_name', (SELECT equipment_name FROM public.equipment WHERE id = p_job.equipment_id),
    'is_overdue', (p_job.scheduled_for IS NOT NULL AND p_job.scheduled_for < current_date AND p_job.status NOT IN ('closed','cancelled'))) $$;

CREATE OR REPLACE FUNCTION public.breakdown_derived_status(p_b public.breakdowns) RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT CASE WHEN p_b.cancelled_at IS NOT NULL THEN 'cancelled'
    ELSE coalesce((SELECT j.status FROM public.jobs j WHERE j.breakdown_id = p_b.id ORDER BY j.created_at DESC LIMIT 1), 'reported') END $$;

CREATE OR REPLACE FUNCTION public.notify_job_parties(p_job public.jobs, p_type text, p_title text, p_body text, p_to_managers boolean, p_to_client boolean, p_to_tech boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_link text := '/jobs/' || p_job.id;
BEGIN
  IF p_to_managers THEN PERFORM public.notify_members(public.stgl_organization_id(), 'job.manage', NULL, false, p_type, p_title, p_body, 'job', p_job.id, v_link, auth.uid()); END IF;
  IF p_to_client THEN PERFORM public.notify_members(p_job.organization_id, 'breakdown.view', p_job.location_id, true, p_type, p_title, p_body, 'job', p_job.id, '/client/app/jobs/' || p_job.id, auth.uid()); END IF;
  IF p_to_tech AND p_job.assigned_technician_id IS DISTINCT FROM auth.uid() THEN
    PERFORM public.notify_user(p_job.assigned_technician_id, public.stgl_organization_id(), p_type, p_title, p_body, 'job', p_job.id, v_link); END IF;
END $$;

-- Breakdown reporting
CREATE OR REPLACE FUNCTION public.report_breakdown(p_organization_id uuid, p_location_id uuid, p_equipment_id uuid, p_fault_description text,
  p_fault_category text DEFAULT NULL, p_priority text DEFAULT 'normal', p_contact_name text DEFAULT NULL, p_contact_phone text DEFAULT NULL,
  p_contact_email text DEFAULT NULL, p_client_request_key text DEFAULT NULL, p_channel text DEFAULT 'client_portal')
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_stgl boolean := public.is_stgl('breakdown.manage'); v_row public.breakdowns%ROWTYPE; v_dup public.breakdowns%ROWTYPE;
  v_set public.notification_settings%ROWTYPE; v_org text; v_loc text; v_eq text; v_body text; v_reporter public.profiles%ROWTYPE;
BEGIN
  IF NOT public.is_active_user() THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501'; END IF;
  IF NOT v_stgl THEN
    IF NOT public.has_org_permission(p_organization_id, 'breakdown.report')
       OR NOT public.user_can_see_location(auth.uid(), p_organization_id, p_location_id) THEN
      RAISE EXCEPTION 'Breakdown reporting denied' USING ERRCODE = '42501'; END IF;
    IF p_location_id IS NOT NULL AND NOT public.has_location_access(p_organization_id, p_location_id) THEN
      RAISE EXCEPTION 'Location access denied' USING ERRCODE = '42501'; END IF;
    p_channel := 'client_portal';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.organizations WHERE id = p_organization_id AND organization_type = 'client' AND status = 'active') THEN
    RAISE EXCEPTION 'Client organization not found' USING ERRCODE = '22023'; END IF;
  IF p_location_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.locations WHERE id = p_location_id AND organization_id = p_organization_id) THEN
    RAISE EXCEPTION 'Location does not belong to organization' USING ERRCODE = '22023'; END IF;
  IF p_equipment_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.equipment WHERE id = p_equipment_id AND organization_id = p_organization_id
       AND (p_location_id IS NULL OR location_id = p_location_id)) THEN
    RAISE EXCEPTION 'Equipment does not belong to organization/location' USING ERRCODE = '22023'; END IF;
  IF length(btrim(coalesce(p_fault_description,''))) < 5 THEN RAISE EXCEPTION 'Fault description required' USING ERRCODE = '22023'; END IF;
  IF coalesce(p_priority,'normal') NOT IN ('low','normal','high','critical') THEN RAISE EXCEPTION 'Invalid priority' USING ERRCODE = '22023'; END IF;
  -- duplicate guards
  IF p_client_request_key IS NOT NULL THEN
    SELECT * INTO v_dup FROM public.breakdowns WHERE organization_id = p_organization_id AND client_request_key = p_client_request_key;
    IF FOUND THEN RETURN to_jsonb(v_dup) || jsonb_build_object('duplicate', true); END IF;
  END IF;
  SELECT * INTO v_dup FROM public.breakdowns WHERE organization_id = p_organization_id AND cancelled_at IS NULL
    AND location_id IS NOT DISTINCT FROM p_location_id AND equipment_id IS NOT DISTINCT FROM p_equipment_id
    AND lower(btrim(fault_description)) = lower(btrim(p_fault_description)) AND reported_at > now() - interval '10 minutes' LIMIT 1;
  IF FOUND THEN RETURN to_jsonb(v_dup) || jsonb_build_object('duplicate', true); END IF;
  SELECT * INTO v_reporter FROM public.profiles WHERE id = auth.uid();
  INSERT INTO public.breakdowns(organization_id, location_id, equipment_id, fault_category, fault_description, priority, channel, reported_by,
    contact_name, contact_phone, contact_email, client_request_key)
  VALUES (p_organization_id, p_location_id, p_equipment_id, nullif(btrim(p_fault_category),''), btrim(p_fault_description), coalesce(p_priority,'normal'),
    coalesce(p_channel,'client_portal'), auth.uid(), coalesce(nullif(btrim(p_contact_name),''), v_reporter.full_name),
    coalesce(nullif(btrim(p_contact_phone),''), v_reporter.phone), coalesce(nullif(btrim(p_contact_email),''), v_reporter.email), p_client_request_key)
  RETURNING * INTO v_row;
  INSERT INTO public.audit_logs(organization_id, actor_user_id, action, entity_type, entity_id, new_values)
  VALUES (p_organization_id, auth.uid(), 'breakdown.reported', 'breakdown', v_row.id, to_jsonb(v_row));
  SELECT name INTO v_org FROM public.organizations WHERE id = p_organization_id;
  SELECT name INTO v_loc FROM public.locations WHERE id = p_location_id;
  SELECT equipment_name || coalesce(' (S/N ' || serial_number || ')','') INTO v_eq FROM public.equipment WHERE id = p_equipment_id;
  PERFORM public.notify_members(public.stgl_organization_id(), 'breakdown.manage', NULL, false, 'breakdown.reported',
    'New breakdown ' || v_row.reference, v_org || coalesce(' · ' || v_loc, '') || ' · ' || v_row.priority, 'breakdown', v_row.id, '/breakdowns/' || v_row.id, auth.uid());
  SELECT * INTO v_set FROM public.notification_settings WHERE organization_id = public.stgl_organization_id() AND event_type = 'breakdown.reported';
  v_body := 'Breakdown reference: ' || v_row.reference || E'\nClient: ' || v_org || E'\nStore/location: ' || coalesce(v_loc,'Not specified')
    || E'\nEquipment: ' || coalesce(v_eq,'Not specified') || E'\nPriority: ' || v_row.priority || E'\nFault: ' || v_row.fault_description
    || E'\nReported by: ' || coalesce(v_row.contact_name,'') || coalesce(' · ' || v_row.contact_phone,'') || coalesce(' · ' || v_row.contact_email,'')
    || E'\nDate reported: ' || to_char(v_row.reported_at AT TIME ZONE 'Africa/Lusaka', 'YYYY-MM-DD HH24:MI') || ' (CAT)';
  INSERT INTO public.breakdown_email_drafts(breakdown_id, organization_id, prepared_for, to_recipients, subject, body)
  VALUES (v_row.id, p_organization_id, auth.uid(), coalesce(v_set.email_recipients,'{}'),
    'Breakdown ' || v_row.reference || ' – ' || v_org || coalesce(' – ' || v_loc,'') || ' [' || upper(v_row.priority) || ']', v_body);
  IF FOUND AND coalesce(v_set.email_enabled,false) AND cardinality(coalesce(v_set.email_recipients,'{}')) > 0 THEN
    INSERT INTO public.notification_deliveries(organization_id, event_type, channel, email_recipients, payload)
    VALUES (p_organization_id, 'breakdown.reported', 'email', v_set.email_recipients, jsonb_build_object('breakdown_id', v_row.id, 'subject', 'Breakdown ' || v_row.reference));
  END IF;
  RETURN to_jsonb(v_row) || jsonb_build_object('duplicate', false, 'status', 'reported');
END $$;

CREATE OR REPLACE FUNCTION public.get_breakdown_email_draft(p_breakdown_id uuid) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_b public.breakdowns%ROWTYPE; v_d public.breakdown_email_drafts%ROWTYPE;
BEGIN
  SELECT * INTO v_b FROM public.breakdowns WHERE id = p_breakdown_id;
  IF NOT FOUND OR NOT (v_b.reported_by = auth.uid() OR public.can_view_client_service_record(v_b.organization_id, v_b.location_id)) THEN
    RAISE EXCEPTION 'Breakdown access denied' USING ERRCODE = '42501'; END IF;
  SELECT * INTO v_d FROM public.breakdown_email_drafts WHERE breakdown_id = p_breakdown_id;
  IF NOT FOUND THEN RETURN NULL; END IF;
  RETURN to_jsonb(v_d) || jsonb_build_object('mailto', 'mailto:' || array_to_string(v_d.to_recipients, ',')
    || '?subject=' || replace(replace(replace(v_d.subject,'%','%25'),' ','%20'),'&','%26') || '&body=' || replace(replace(replace(replace(v_d.body,'%','%25'),' ','%20'),'&','%26'),E'\n','%0A'),
    'delivery_confirmed', v_d.status = 'sent_confirmed');
END $$;

CREATE OR REPLACE FUNCTION public.list_breakdowns(p_organization_id uuid DEFAULT NULL, p_status text DEFAULT NULL, p_limit integer DEFAULT 50, p_offset integer DEFAULT 0)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_internal boolean := public.is_stgl('breakdown.manage') OR public.is_stgl('job.manage');
BEGIN
  IF NOT public.is_active_user() THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501'; END IF;
  IF NOT v_internal AND (p_organization_id IS NULL OR NOT public.has_org_permission(p_organization_id, 'breakdown.view')) THEN
    RAISE EXCEPTION 'Breakdown access denied' USING ERRCODE = '42501'; END IF;
  RETURN coalesce((SELECT jsonb_agg(x.j ORDER BY x.reported_at DESC) FROM (
    SELECT b.reported_at, to_jsonb(b) - 'client_request_key' || jsonb_build_object('status', public.breakdown_derived_status(b),
      'client_name', o.name, 'location_name', l.name, 'equipment_name', e.equipment_name,
      'latest_job', (SELECT jsonb_build_object('id', j.id, 'reference', j.reference, 'status', j.status, 'technician_name', pr.full_name, 'scheduled_for', j.scheduled_for)
                     FROM public.jobs j LEFT JOIN public.profiles pr ON pr.id = j.assigned_technician_id WHERE j.breakdown_id = b.id ORDER BY j.created_at DESC LIMIT 1)) j
    FROM public.breakdowns b JOIN public.organizations o ON o.id = b.organization_id
    LEFT JOIN public.locations l ON l.id = b.location_id LEFT JOIN public.equipment e ON e.id = b.equipment_id
    WHERE (p_organization_id IS NULL OR b.organization_id = p_organization_id)
      AND (v_internal OR public.user_can_see_location(auth.uid(), b.organization_id, b.location_id))
      AND (p_status IS NULL OR public.breakdown_derived_status(b) = p_status)
    ORDER BY b.reported_at DESC LIMIT least(greatest(p_limit,1),200) OFFSET greatest(p_offset,0)) x), '[]'::jsonb);
END $$;

CREATE OR REPLACE FUNCTION public.update_breakdown(p_breakdown_id uuid, p_action text, p_reason text DEFAULT NULL, p_priority text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_b public.breakdowns%ROWTYPE; v_old jsonb; v_job public.jobs%ROWTYPE; v_from text;
BEGIN
  IF NOT public.is_stgl('breakdown.manage') THEN RAISE EXCEPTION 'Breakdown management denied' USING ERRCODE = '42501'; END IF;
  SELECT * INTO v_b FROM public.breakdowns WHERE id = p_breakdown_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Breakdown not found' USING ERRCODE = '22023'; END IF;
  IF v_b.cancelled_at IS NOT NULL THEN RAISE EXCEPTION 'Breakdown is cancelled' USING ERRCODE = '22023'; END IF;
  v_old := to_jsonb(v_b);
  IF p_action = 'set_priority' THEN
    IF p_priority NOT IN ('low','normal','high','critical') THEN RAISE EXCEPTION 'Invalid priority' USING ERRCODE = '22023'; END IF;
    UPDATE public.breakdowns SET priority = p_priority, updated_at = now() WHERE id = v_b.id RETURNING * INTO v_b;
    UPDATE public.jobs SET priority = p_priority, updated_at = now() WHERE breakdown_id = v_b.id AND status NOT IN ('closed','cancelled');
  ELSIF p_action = 'escalate' THEN
    IF length(btrim(coalesce(p_reason,''))) < 3 THEN RAISE EXCEPTION 'Escalation reason required' USING ERRCODE = '22023'; END IF;
    UPDATE public.breakdowns SET escalated_at = now(), escalation_reason = btrim(p_reason), priority = CASE WHEN priority IN ('low','normal') THEN 'high' ELSE priority END, updated_at = now()
      WHERE id = v_b.id RETURNING * INTO v_b;
    PERFORM public.notify_members(public.stgl_organization_id(), 'breakdown.manage', NULL, false, 'breakdown.escalated',
      'Escalated: ' || v_b.reference, btrim(p_reason), 'breakdown', v_b.id, '/breakdowns/' || v_b.id, auth.uid());
  ELSIF p_action = 'cancel' THEN
    IF length(btrim(coalesce(p_reason,''))) < 3 THEN RAISE EXCEPTION 'Cancellation reason required' USING ERRCODE = '22023'; END IF;
    IF EXISTS (SELECT 1 FROM public.jobs WHERE breakdown_id = v_b.id AND status IN ('en_route','in_progress')) THEN
      RAISE EXCEPTION 'A technician is actively working on this breakdown' USING ERRCODE = '22023'; END IF;
    UPDATE public.breakdowns SET cancelled_at = now(), cancel_reason = btrim(p_reason), updated_at = now() WHERE id = v_b.id RETURNING * INTO v_b;
    FOR v_job IN SELECT * FROM public.jobs WHERE breakdown_id = v_b.id AND status NOT IN ('closed','cancelled') FOR UPDATE LOOP
      v_from := v_job.status;
      UPDATE public.jobs SET status = 'cancelled', cancelled_at = now(), cancel_reason = btrim(p_reason), updated_at = now() WHERE id = v_job.id RETURNING * INTO v_job;
      PERFORM public.log_job_event(v_job, 'cancelled', v_from, p_reason);
      PERFORM public.notify_job_parties(v_job, 'job.cancelled', 'Job ' || v_job.reference || ' cancelled', p_reason, false, false, true);
    END LOOP;
    PERFORM public.notify_members(v_b.organization_id, 'breakdown.view', v_b.location_id, true, 'breakdown.cancelled', 'Breakdown ' || v_b.reference || ' cancelled', p_reason, 'breakdown', v_b.id, '/client/app/tickets/' || v_b.id, auth.uid());
  ELSE RAISE EXCEPTION 'Unknown action' USING ERRCODE = '22023'; END IF;
  INSERT INTO public.audit_logs(organization_id, actor_user_id, action, entity_type, entity_id, old_values, new_values, metadata)
  VALUES (v_b.organization_id, auth.uid(), 'breakdown.' || p_action, 'breakdown', v_b.id, v_old, to_jsonb(v_b), jsonb_build_object('reason', p_reason));
  RETURN to_jsonb(v_b) || jsonb_build_object('status', public.breakdown_derived_status(v_b));
END $$;