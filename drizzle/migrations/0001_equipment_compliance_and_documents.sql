CREATE TABLE public.equipment_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  equipment_id uuid NOT NULL REFERENCES public.equipment(id),
  actor_organization_id uuid REFERENCES public.organizations(id),
  authority text NOT NULL DEFAULT 'ZMA',
  verified_on date NOT NULL,
  valid_until date NOT NULL,
  certificate_number text,
  seal_number text,
  outcome text NOT NULL CHECK (outcome IN ('passed','failed','conditional')),
  notes text,
  supersedes_verification_id uuid REFERENCES public.equipment_verifications(id),
  recorded_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (valid_until >= verified_on)
);
CREATE INDEX equipment_verifications_equipment_idx ON public.equipment_verifications(equipment_id, verified_on DESC);
CREATE INDEX equipment_verifications_org_due_idx ON public.equipment_verifications(organization_id, valid_until);
GRANT ALL ON public.equipment_verifications TO service_role;
ALTER TABLE public.equipment_verifications ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.equipment_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  equipment_id uuid NOT NULL REFERENCES public.equipment(id),
  verification_id uuid REFERENCES public.equipment_verifications(id),
  document_type text NOT NULL CHECK (document_type IN ('certificate','manual','invoice','photo','other')),
  file_name text NOT NULL,
  storage_path text NOT NULL UNIQUE,
  mime_type text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','archived')),
  uploaded_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz
);
CREATE INDEX equipment_documents_equipment_idx ON public.equipment_documents(equipment_id);
GRANT ALL ON public.equipment_documents TO service_role;
ALTER TABLE public.equipment_documents ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.prevent_equipment_verification_mutation()
RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  RAISE EXCEPTION 'Verification records are immutable; record a superseding verification' USING ERRCODE = '42501';
END $$;
CREATE TRIGGER equipment_verifications_immutable BEFORE UPDATE OR DELETE ON public.equipment_verifications
FOR EACH ROW EXECUTE FUNCTION public.prevent_equipment_verification_mutation();

CREATE OR REPLACE FUNCTION public.prevent_equipment_document_delete()
RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'Documents cannot be deleted; archive instead' USING ERRCODE = '42501';
  END IF;
  IF NEW.id <> OLD.id OR NEW.equipment_id <> OLD.equipment_id OR NEW.organization_id <> OLD.organization_id
     OR NEW.storage_path <> OLD.storage_path OR NEW.uploaded_by <> OLD.uploaded_by OR NEW.created_at <> OLD.created_at THEN
    RAISE EXCEPTION 'Only document status may change' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER equipment_documents_guard BEFORE UPDATE OR DELETE ON public.equipment_documents
FOR EACH ROW EXECUTE FUNCTION public.prevent_equipment_document_delete();

-- Caller-level check across all of the caller's active organizations (used by storage policies).
CREATE OR REPLACE FUNCTION public.caller_can_access_equipment(p_equipment_id uuid, p_operation text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT public.can_access_equipment(NULL, p_equipment_id, p_operation)
      OR EXISTS (
        SELECT 1 FROM public.organization_members m
        WHERE m.user_id = auth.uid() AND m.membership_status = 'active'
          AND public.can_access_equipment(m.organization_id, p_equipment_id, p_operation)
      );
$$;

CREATE OR REPLACE FUNCTION public.record_equipment_verification(
  p_actor_organization_id uuid, p_equipment_id uuid, p_verified_on date, p_valid_until date,
  p_outcome text, p_certificate_number text DEFAULT NULL, p_seal_number text DEFAULT NULL,
  p_notes text DEFAULT NULL, p_supersedes_verification_id uuid DEFAULT NULL, p_authority text DEFAULT 'ZMA')
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_eq public.equipment%ROWTYPE; v_row public.equipment_verifications%ROWTYPE;
BEGIN
  IF NOT public.can_access_equipment(p_actor_organization_id, p_equipment_id, 'compliance_record') THEN
    RAISE EXCEPTION 'Compliance recording denied' USING ERRCODE = '42501';
  END IF;
  IF p_verified_on IS NULL OR p_valid_until IS NULL OR p_valid_until < p_verified_on THEN
    RAISE EXCEPTION 'Invalid verification dates' USING ERRCODE = '22023';
  END IF;
  IF p_verified_on > current_date THEN
    RAISE EXCEPTION 'Verification date cannot be in the future' USING ERRCODE = '22023';
  END IF;
  IF p_outcome NOT IN ('passed','failed','conditional') THEN
    RAISE EXCEPTION 'Invalid outcome' USING ERRCODE = '22023';
  END IF;
  SELECT * INTO STRICT v_eq FROM public.equipment WHERE id = p_equipment_id;
  IF p_supersedes_verification_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.equipment_verifications WHERE id = p_supersedes_verification_id AND equipment_id = p_equipment_id) THEN
    RAISE EXCEPTION 'Superseded verification not found for this equipment' USING ERRCODE = '22023';
  END IF;
  INSERT INTO public.equipment_verifications(organization_id, equipment_id, actor_organization_id, authority, verified_on,
    valid_until, certificate_number, seal_number, outcome, notes, supersedes_verification_id, recorded_by)
  VALUES (v_eq.organization_id, p_equipment_id, p_actor_organization_id, coalesce(nullif(trim(p_authority),''),'ZMA'),
    p_verified_on, p_valid_until, nullif(trim(p_certificate_number),''), nullif(trim(p_seal_number),''), p_outcome,
    nullif(trim(p_notes),''), p_supersedes_verification_id, auth.uid())
  RETURNING * INTO v_row;
  INSERT INTO public.audit_logs(organization_id, actor_user_id, action, entity_type, entity_id, new_values, metadata)
  VALUES (v_eq.organization_id, auth.uid(), 'equipment.verification_recorded', 'equipment_verification', v_row.id,
    to_jsonb(v_row), jsonb_build_object('equipment_id', p_equipment_id, 'actor_organization_id', p_actor_organization_id));
  RETURN to_jsonb(v_row);
END $$;

CREATE OR REPLACE FUNCTION public.list_equipment_verifications(p_actor_organization_id uuid, p_equipment_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NOT public.can_access_equipment(p_actor_organization_id, p_equipment_id, 'compliance_view') THEN
    RAISE EXCEPTION 'Compliance access denied' USING ERRCODE = '42501';
  END IF;
  RETURN coalesce((SELECT jsonb_agg(to_jsonb(v) || jsonb_build_object(
      'is_superseded', EXISTS (SELECT 1 FROM public.equipment_verifications x WHERE x.supersedes_verification_id = v.id))
    ORDER BY v.verified_on DESC, v.created_at DESC)
    FROM public.equipment_verifications v WHERE v.equipment_id = p_equipment_id), '[]'::jsonb);
END $$;

-- Compliance status per equipment: latest non-superseded verification.
CREATE OR REPLACE FUNCTION public.list_equipment_compliance_status(
  p_actor_organization_id uuid, p_owner_organization_id uuid, p_due_within_days integer DEFAULT 30)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NOT public.is_active_user() THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501'; END IF;
  IF p_due_within_days IS NULL OR p_due_within_days NOT BETWEEN 0 AND 365 THEN
    RAISE EXCEPTION 'Invalid due window' USING ERRCODE = '22023';
  END IF;
  RETURN coalesce((SELECT jsonb_agg(jsonb_build_object(
      'equipment_id', e.id, 'equipment_name', e.equipment_name, 'serial_number', e.serial_number,
      'location_id', e.location_id, 'verification_id', lv.id, 'verified_on', lv.verified_on,
      'valid_until', lv.valid_until, 'outcome', lv.outcome,
      'compliance_status', CASE
        WHEN lv.id IS NULL THEN 'never_verified'
        WHEN lv.outcome = 'failed' THEN 'failed'
        WHEN lv.valid_until < current_date THEN 'expired'
        WHEN lv.valid_until <= current_date + p_due_within_days THEN 'due_soon'
        ELSE 'compliant' END) ORDER BY lv.valid_until NULLS FIRST)
    FROM public.equipment e
    LEFT JOIN LATERAL (
      SELECT v.* FROM public.equipment_verifications v
      WHERE v.equipment_id = e.id
        AND NOT EXISTS (SELECT 1 FROM public.equipment_verifications x WHERE x.supersedes_verification_id = v.id)
      ORDER BY v.verified_on DESC, v.created_at DESC LIMIT 1) lv ON true
    WHERE e.organization_id = p_owner_organization_id
      AND public.can_access_equipment(p_actor_organization_id, e.id, 'compliance_view')), '[]'::jsonb);
END $$;

CREATE OR REPLACE FUNCTION public.register_equipment_document(
  p_actor_organization_id uuid, p_equipment_id uuid, p_document_type text, p_file_name text,
  p_storage_path text, p_mime_type text DEFAULT NULL, p_verification_id uuid DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_eq public.equipment%ROWTYPE; v_row public.equipment_documents%ROWTYPE;
BEGIN
  IF NOT public.can_access_equipment(p_actor_organization_id, p_equipment_id, 'document_manage') THEN
    RAISE EXCEPTION 'Document management denied' USING ERRCODE = '42501';
  END IF;
  SELECT * INTO STRICT v_eq FROM public.equipment WHERE id = p_equipment_id;
  IF p_storage_path IS NULL OR split_part(p_storage_path,'/',1) <> v_eq.organization_id::text
     OR split_part(p_storage_path,'/',2) <> p_equipment_id::text OR split_part(p_storage_path,'/',3) = '' THEN
    RAISE EXCEPTION 'Storage path must be <organization_id>/<equipment_id>/<file>' USING ERRCODE = '22023';
  END IF;
  IF nullif(trim(p_file_name),'') IS NULL THEN RAISE EXCEPTION 'File name required' USING ERRCODE = '22023'; END IF;
  IF p_verification_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.equipment_verifications WHERE id = p_verification_id AND equipment_id = p_equipment_id) THEN
    RAISE EXCEPTION 'Verification not found for this equipment' USING ERRCODE = '22023';
  END IF;
  INSERT INTO public.equipment_documents(organization_id, equipment_id, verification_id, document_type, file_name,
    storage_path, mime_type, uploaded_by)
  VALUES (v_eq.organization_id, p_equipment_id, p_verification_id, p_document_type, trim(p_file_name), p_storage_path,
    p_mime_type, auth.uid()) RETURNING * INTO v_row;
  INSERT INTO public.audit_logs(organization_id, actor_user_id, action, entity_type, entity_id, new_values)
  VALUES (v_eq.organization_id, auth.uid(), 'equipment.document_registered', 'equipment_document', v_row.id, to_jsonb(v_row));
  RETURN to_jsonb(v_row);
END $$;

CREATE OR REPLACE FUNCTION public.archive_equipment_document(p_actor_organization_id uuid, p_document_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_row public.equipment_documents%ROWTYPE;
BEGIN
  SELECT * INTO v_row FROM public.equipment_documents WHERE id = p_document_id FOR UPDATE;
  IF NOT FOUND OR NOT public.can_access_equipment(p_actor_organization_id, v_row.equipment_id, 'document_manage') THEN
    RAISE EXCEPTION 'Document management denied' USING ERRCODE = '42501';
  END IF;
  IF v_row.status = 'archived' THEN RETURN to_jsonb(v_row); END IF;
  UPDATE public.equipment_documents SET status = 'archived', archived_at = now() WHERE id = p_document_id RETURNING * INTO v_row;
  INSERT INTO public.audit_logs(organization_id, actor_user_id, action, entity_type, entity_id, new_values)
  VALUES (v_row.organization_id, auth.uid(), 'equipment.document_archived', 'equipment_document', v_row.id, to_jsonb(v_row));
  RETURN to_jsonb(v_row);
END $$;

CREATE OR REPLACE FUNCTION public.list_equipment_documents(p_actor_organization_id uuid, p_equipment_id uuid, p_include_archived boolean DEFAULT false)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NOT public.can_access_equipment(p_actor_organization_id, p_equipment_id, 'document_view') THEN
    RAISE EXCEPTION 'Document access denied' USING ERRCODE = '42501';
  END IF;
  RETURN coalesce((SELECT jsonb_agg(to_jsonb(d) ORDER BY d.created_at DESC) FROM public.equipment_documents d
    WHERE d.equipment_id = p_equipment_id AND (p_include_archived OR d.status = 'active')), '[]'::jsonb);
END $$;

REVOKE ALL ON FUNCTION public.prevent_equipment_verification_mutation() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.prevent_equipment_document_delete() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.caller_can_access_equipment(uuid,text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.record_equipment_verification(uuid,uuid,date,date,text,text,text,text,uuid,text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.list_equipment_verifications(uuid,uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.list_equipment_compliance_status(uuid,uuid,integer) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.register_equipment_document(uuid,uuid,text,text,text,text,uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.archive_equipment_document(uuid,uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.list_equipment_documents(uuid,uuid,boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.caller_can_access_equipment(uuid,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_equipment_verification(uuid,uuid,date,date,text,text,text,text,uuid,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_equipment_verifications(uuid,uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_equipment_compliance_status(uuid,uuid,integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.register_equipment_document(uuid,uuid,text,text,text,text,uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.archive_equipment_document(uuid,uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_equipment_documents(uuid,uuid,boolean) TO authenticated;

-- Storage: private bucket "equipment-documents", path <org_id>/<equipment_id>/<file>.
CREATE POLICY "Equipment documents readable with document access" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'equipment-documents'
  AND (storage.foldername(name))[2] ~ '^[0-9a-f-]{36}$'
  AND public.caller_can_access_equipment(((storage.foldername(name))[2])::uuid, 'document_view'));
CREATE POLICY "Equipment documents uploadable with document access" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'equipment-documents'
  AND (storage.foldername(name))[2] ~ '^[0-9a-f-]{36}$'
  AND EXISTS (SELECT 1 FROM public.equipment e WHERE e.id = ((storage.foldername(name))[2])::uuid
              AND e.organization_id::text = (storage.foldername(name))[1])
  AND public.caller_can_access_equipment(((storage.foldername(name))[2])::uuid, 'document_manage'));