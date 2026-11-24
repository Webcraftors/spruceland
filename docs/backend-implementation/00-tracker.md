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
| B | Stage 1 close-out | In progress | Foundation tables + provisioning RPC + endpoint (33 tests) | Baseline-snapshot live schema into repo docs; run linter; write `01-database-foundation.md` |
| B1 | Leadership grant/revocation live test | Blocked | Endpoint returns 401 correctly | Needs approved verified accounts |
| C | Stage 2 Auth & security | Not started | `profiles`, role/permission helpers, invitations exist | Sign-in backend, invitation accept flow test, storage buckets + policies, cross-tenant tests |
| D | Stage 3 Equipment & compliance | In progress (pre-existing) | 18 equipment tables + list/get/maintenance/change-request functions | Verify each function with test users; gap check ZMA verification + documents |
| E | Stage 4 Breakdowns & jobs | Not started | none | Design tables + status-transition functions |
| F | Stage 4 Inventory & client store | Not started | none | Products, stock movements, store publication, orders |
| G | Stage 5 Technician ops + job cards | Not started | Mock workflow rules in `src/domain/ticket-workflow.ts` (tested) | Port rules to DB functions; sign-off lock |
| H | Internal notifications | Not started | `equipment_notification_events` | General notifications table + event triggers; email drafts |
| I | Handover | Not started | `docs/*` from UI phase | `99-handover.md` |

## Out of scope (Deferred)
Stages 6–8: external email/push delivery, frontend integration, APK/store, payments, final production deploy.
