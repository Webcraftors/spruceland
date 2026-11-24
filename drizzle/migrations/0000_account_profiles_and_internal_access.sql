ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS employee_ref text, ADD COLUMN IF NOT EXISTS client_context jsonb;
GRANT SELECT ON public.profiles TO authenticated;
GRANT UPDATE (full_name, phone, avatar_url, employee_ref, client_context) ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY profiles_read_own ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY profiles_edit_own ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE OR REPLACE FUNCTION public.current_internal_role() RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
 SELECT CASE r.name WHEN 'Owner' THEN 'owner' WHEN 'Admin' THEN 'administrator' WHEN 'Department Head' THEN 'head_tech' WHEN 'Technician' THEN 'technician' WHEN 'Manager' THEN 'crm' END
 FROM public.organization_members m
 JOIN public.organizations o ON o.id=m.organization_id
 JOIN public.profiles p ON p.id=m.user_id
 JOIN public.member_roles mr ON mr.member_id=m.id AND mr.organization_id=m.organization_id
 JOIN public.roles r ON r.id=mr.role_id AND r.organization_id=m.organization_id
 WHERE m.user_id=auth.uid() AND m.membership_status='active' AND o.slug='stgl' AND o.status='active' AND p.status='active'
 AND r.name IN ('Owner','Admin','Department Head','Technician','Manager')
 ORDER BY CASE r.name WHEN 'Owner' THEN 1 WHEN 'Admin' THEN 2 WHEN 'Department Head' THEN 3 WHEN 'Technician' THEN 4 ELSE 5 END LIMIT 1;
$$;
REVOKE ALL ON FUNCTION public.current_internal_role() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_internal_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_internal_role() TO service_role;