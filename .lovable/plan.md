# Spruceland IQ — Master Backend Implementation (Stages 1–5)

Goal: finish a secure, practical backend for Stages 1–5 on the existing Lovable Cloud database, without redesigning the frontend. Stages 6–8 (external email/push, full frontend wiring, final deployment) stay out of scope.

## Tracker (project resource)
Create `docs/backend-implementation/` and keep it updated every phase:
- `00-tracker.md` — one row per stage/group: status (Not started / In progress / Implemented / Verified / Blocked / Deferred), existing work found, work done, files, database objects, tests run + results, open issues, dependencies, next action. "Verified" only after a test passes.
- `01-database-foundation.md`, `02-auth-security.md`, `03-equipment-compliance.md`, `04-breakdowns-jobs.md`, `05-inventory-store.md`, `06-technician-ops.md`, `07-notifications.md`, `99-handover.md` (section 22 format).
- `roadmap.md` at the root points to the tracker.

## Phases (run in order, each: inspect → build → test → document)

**A. Audit live state** — inventory every table, function, policy, grant, trigger and index in the live database (it already has ~45 tables incl. equipment, maintenance, ZMA, invitations), compare with repo migrations and source; record gaps, duplicates and security issues.

**B. Stage 1 close-out** — reconcile migration history with the live database, run the database linter, fix missing grants/indexes, write `01-database-foundation.md`.

**C. Stage 2 Authentication & Security** — real sign-in backend (email/password, Google), invitation acceptance, org/role/location/department permission helpers, tenant isolation on every table, private storage buckets with per-organization policies, security scan + cross-tenant tests.

**D. Stage 3 Equipment & Compliance** — complete configuration (categories, types, makes, models, spec fields), registry, shared STGL/client access, change requests with approval, maintenance plans and occurrences, ZMA verification tracking with due dates, documents and history.

**E. Stage 4 Breakdowns & Jobs** — breakdown reporting with photos, breakdown → job conversion, assignment/pickup, controlled job status transitions, completion, client view, management summaries.

**F. Stage 4 Inventory & Client Store** — products, stock movements, simple quotes/orders, store publication per organization, client ordering with stock reservation, order status flow; no online payments.

**G. Stage 5 Technician Ops** — assigned-job list, pickup, start (arrival time stored), resolve; two-party job card with client sign-off (typed name + ID), tamper protection after sign-off, printable branded card. Excluded: GPS, timesheets, checklists, parts consumption, evidence.

**H. Internal notifications + verification** — in-app notification records for the default events, breakdown email drafts (not sent), push/email hooks stubbed; full workflow and security test pass.

**I. Handover** — final `99-handover.md`: database inventory, function/API reference, business rules, security review, test report, frontend integration guide, remaining items.

## Rules kept throughout
- No destructive resets or drops; additive migrations only, retired items marked deprecated.
- Server logic via app server functions/routes, not separate edge functions; privileged access only after verifying the caller.
- Existing screens and styles untouched except minimal non-visual fixes.
- Tests added for each business rule (status transitions, sign-off, permissions, stock) and run before marking Verified.

## Technical notes
- Each phase ends with: build check, test run, linter/security scan, tracker update, commit.
- Steps needing real accounts (e.g., leadership grant, cross-tenant sign-in) use temporary test users; anything that still needs your approved accounts is marked Blocked in the tracker.
- Work spans many sessions; each session resumes from the tracker's "next action".
