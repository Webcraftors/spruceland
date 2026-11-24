# Spruceland IQ — Backend Stages 1–5 Handover Report (2026-11-24)

| Stage | Scope | Status | Evidence |
|---|---|---|---|
| 1 Foundation | Tenancy, roles/permissions, audit, leadership provisioning endpoint | Verified (grant/revoke live test blocked) | 22 policy unit tests; endpoint 401/403/405 checks; `01-database-foundation.md` |
| 2 Auth & security | Invitations, RBAC, tenant isolation, private storage | Verified (backend) | 12/12 E2E — `02-auth-security.md` |
| 3 Equipment & ZMA compliance | Registry, verifications, compliance status, documents | Verified | 31/31 E2E — `03-equipment-compliance.md` |
| 4 Breakdowns, jobs, inventory, store | Reporting, triage, jobs, Kanban/grid/calendar data, stock, client store, orders | Verified | 109/109 E2E (shared) — `04-…md` |
| 5 Technician ops, job cards, notifications | Technician 5-area backend, digital/physical/no-signature cards, in-app notifications, push/email outbox | Verified | same run — `05-…md` |

## Architecture decisions
1. All operational tables are function-only (RLS on, no table grants). Every exposed function checks the caller with `is_active_user`, `has_org_permission`, location scope; internal helpers are not callable.
2. STGL is identified by `organization_type = 'stgl'`; STGL permissions are checked in the STGL org, client permissions in the client org.
3. Breakdown status is derived from its latest job (no duplicate status).
4. Job cards, stock movements, verifications and audit logs are append-only; corrections are new revisions.
5. Prices, totals and stock are always computed server-side; reservations happen on confirmation, deduction on dispatch.
6. Notifications are a single inbox with server-chosen recipients. External delivery is queued, never faked.

## Known limitations / open items
- **Blocked:** leadership grant/revoke live test — needs approved staff emails in the app secrets.
- **Migration history:** pre-Stage-3 schema was applied manually; take a full schema dump before staging/production (Stage 8).
- **Location hierarchy:** store-scoped notification/visibility uses direct store assignments or organization-wide scope; parent-region scope for jobs is not applied yet.
- **Branding details** (address, phone, email, registration/tax numbers) must be supplied by STGL.
- **Frontend** still runs on demo data; connecting screens, sign-in and APK packaging are Stage 7. Push/email providers are Stage 6.
- Linter notices "RLS enabled, no policy" and "signed-in can execute security-definer function" are expected under decision 1.
- E2E test records remain (immutable by design); use a separate staging database for repeated tests.
