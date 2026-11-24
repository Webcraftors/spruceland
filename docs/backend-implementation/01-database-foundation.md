# Stage 1 — Database Foundation (Verified 2026-11-24)

## Live baseline
- 47 public tables (45 pre-existing + `equipment_verifications`, `equipment_documents`), all with RLS enabled.
- ~170 public functions; ~22 integrity triggers; 150+ indexes. 3 organizations: `stgl` (type stgl), `yalelo`, `pick-n-pay` (type client), each with seeded system roles (Owner/Admin or Client Admin, Manager, Department Head, Technician/Store Manager, Client User).
- Migration history: most of the schema was applied manually before `drizzle/migrations` existed. Repo migrations 0000–0002 hold only later changes. **The live database is the source of truth.** Do not rebuild a fresh environment from repo migrations alone. A full schema dump is needed before creating staging/prod (Stage 8).

## Access model (intentional)
1. **Identity/tenancy tables** (organizations, applications, roles, permissions, role_permissions, profiles, organization_members, member_roles, member_app_access, member_locations, departments, department_members, locations, organization_applications): read grant for signed-in users + row policies scoped to membership.
2. **Operational and sensitive tables** (equipment*, invitations*, audit_logs, configuration*, leadership*, platform_admins, organization_settings, location_types): **no table grants, no policies** → unreachable directly. All access is via `SECURITY DEFINER` functions that call `is_active_user()`, `has_org_permission()` and `can_access_equipment_scope()`.
3. Linter: "RLS enabled, no policy" (31) and "signed-in can execute security-definer function" (≈115) are expected under this model. Every exposed function checks the caller inside. Internal helpers (triggers, `current_internal_role`, `advance_*`, `capture_*`) are not executable by signed-in users.

## Integrity
- Audit logs, bootstrap registry, service records, replacements, verifications: immutable (trigger-enforced). Corrections create superseding rows.
- Mutations take advisory locks (`lock_equipment_mutation`, `lock_invitation_resources`) and check `record_version`.

## Leadership provisioning
- See `docs/stage-1-backend-report.md`.
- Live grant/revocation test is still **Blocked**: it needs real approved accounts and the numbered email secrets.
