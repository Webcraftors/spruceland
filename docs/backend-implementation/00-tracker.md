# Spruceland IQ — Backend Implementation Tracker (Stages 1–5)

Source brief: Master Backend Implementation prompt (2026-11-24). Plan: `.lovable/plan/spruceland-iq-master-backend-implementation-stages-1-5-2026-11-24.md`.
Statuses: Not started · In progress · Implemented · Verified · Blocked · Deferred. "Verified" requires a passing test.

## Phase A — Live state audit (Verified, 2026-11-24)
Read-only queries against the live database:
- 45 public tables, all with RLS enabled. 162 public functions (110 executable by signed-in users), 22 triggers, 153 indexes.
- 16 foundation/identity tables have signed-in read grants + 1–2 policies. 29 tables (equipment*, invitations*, audit_logs, configuration*, leadership*, platform_admins, organization_settings, location_types) have no grants and no policies → reachable only through security-definer functions (e.g. `list_equipment`, `get_equipment_details`, `create_user_invitation`). Intentional function-only access; must be confirmed per table in Phase B.
- Repo holds one Drizzle migration (`0000_account_profiles_and_internal_access`); most schema was applied manually → migration history is NOT in sync with live DB.
- Data: 3 organizations, 0 profiles, 0 equipment. No storage buckets.
- Missing entirely: breakdowns, jobs, job cards, inventory/products/stock, client store/orders, general in-app notifications (only `equipment_notification_events`).
- Frontend: still mock/localStorage (`src/repositories/portal-repo.ts`); leadership endpoint is the only live server route.

| # | Group | Status | Found | Next action |
|---|---|---|---|---|
| B | Stage 1 close-out | Verified | Baseline + access model documented; linter reviewed | Full schema dump before staging (Stage 8) |
| B1 | Leadership grant/revocation live test | Blocked | Endpoint returns 401 correctly | Needs approved verified accounts |
| C | Stage 2 Auth & security | Verified (backend) | Invitations, RBAC, tenant isolation, private storage — 12/12 E2E | Frontend sign-in = Stage 7 |
| D | Stage 3 Equipment & compliance | Verified (backend) | Added ZMA verifications + documents; 31/31 E2E | — |
| E | Stage 4 Breakdowns & jobs | Verified (backend) | Breakdowns, jobs, derived status, dashboard data — 109/109 E2E (shared) | Frontend = Stage 7 |
| F | Stage 4 Inventory & client store | Verified (backend) | Products, append-only stock, reservations, store, orders | — |
| G | Stage 5 Technician ops + job cards | Verified (backend) | Pickup race, lifecycle, job cards + revisions | Branding details from STGL |
| H | Internal notifications | Verified (backend) | Inbox, settings, push/email outbox, breakdown email drafts | Providers = Stage 6 |
| I | Handover | Done | `99-handover.md` | — |

## Out of scope (Deferred)
Stages 6–8: external email/push delivery, frontend integration, APK/store, payments, final production deploy.
