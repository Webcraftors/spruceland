CREATE OR REPLACE FUNCTION public.caller_can_upload_equipment_document(p_object_name text)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_org text := split_part(p_object_name,'/',1); v_eq text := split_part(p_object_name,'/',2);
BEGIN
  IF v_eq !~ '^[0-9a-f-]{36}$' OR split_part(p_object_name,'/',3) = '' THEN RETURN false; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.equipment e WHERE e.id = v_eq::uuid AND e.organization_id::text = v_org) THEN
    RETURN false;
  END IF;
  RETURN public.caller_can_access_equipment(v_eq::uuid, 'document_manage');
END $$;
REVOKE ALL ON FUNCTION public.caller_can_upload_equipment_document(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.caller_can_upload_equipment_document(text) TO authenticated;
DROP POLICY "Equipment documents uploadable with document access" ON storage.objects;
CREATE POLICY "Equipment documents uploadable with document access" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'equipment-documents' AND public.caller_can_upload_equipment_document(name));