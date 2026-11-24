# Stage 5 — Technician Operations, Job Cards & Notifications (Verified 2026-11-24)

## Technician backend (five app areas)
| Area | Functions |
|---|---|
| Home | `technician_home()` — available, assigned, active, completed (30 days), availability, unread notifications |
| Jobs | `list_jobs(view => 'available'|'mine')`, `get_job`, `pickup_job`, `transition_job` (accept/decline/return/en_route/start/hold/resume), `complete_job` |
| Job cards | `complete_job` creates the card; `get_job_card`; `get_job` lists cards |
| Notifications | `list_my_notifications`, `mark_notification_read`, `mark_all_notifications_read` |
| Profile | existing profile functions + `set_technician_availability(available|busy|off_duty|leave)` |
Deliberately not built: photos/evidence uploads, timesheets, parts used, checklists, GPS, routing, performance analytics, multi-level approvals.

## Completion & job cards (`job_cards`, `company_branding`)
- `complete_job(job, fault_identified, work_carried_out, repair_outcome, signature_method, recommendations?, client_rep?, signature_data?, physical_ref?, no_signature_reason?)` — only the assigned technician, only from `in_progress`.
- Outcome rules: `fully_resolved` → job **closed**; `partially_resolved` / `not_resolved` → job **on hold** ("Follow-up required"). A manager can close an unresolved job with a reason; the real outcome is kept. Completion never changes equipment compliance or maintenance records.
- Signature: `digital` (needs signature image + representative name), `physical` (optional card number), or `none` (optional reason). A missing signature never blocks completion. The signature is an acknowledgement only, not identity verification.
- Each card stores a snapshot (company branding, client, store, equipment, technician, breakdown, timestamps) so later changes don't rewrite history. Cards are immutable (trigger, even for the backend). `correct_job_card` (needs `jobcard.correct`) issues revision N+1 with the same reference and a reason; the old revision is shown as superseded.
- Branding: `company_branding` holds legal name (seeded from the STGL organization) and logo path `/spruceland-logo.png`. **Missing and to be supplied by STGL:** registered address, phone, email, website, registration and tax numbers. Editable via `save_company_branding` (needs `configuration.manage`). Print layout/PDF is Stage 7.

## Notifications (`notifications`, `notification_settings`, `notification_deliveries`)
- One shared in-app inbox for every portal/app. Recipients are chosen server-side by permission and store scope, so nobody receives data they couldn't open. The person who made a change is not notified about it.
- Events: breakdown reported/escalated/cancelled; job available/assigned/reassigned/accepted/returned/en route/started/on hold/completed/cancelled; order placed/status changed. Equipment, maintenance and ZMA reminders continue to use `equipment_notification_events` (Stage 3).
- `notification_settings` (per event: in-app, push, email, email recipients) — STGL admins change it with `save_notification_setting`; defaults: push on for breakdowns, escalations, assignments, cancellations, available jobs; email on for breakdowns and escalations (no recipients configured yet).
- Push/email are written to `notification_deliveries` as `pending_provider`. Nothing is sent and nothing is marked sent until Stage 6.

## Stage 6 integration requirements
- **OneSignal:** App ID + REST API key (server secret), map users with `external_id = auth user id`; worker reads `notification_deliveries` where `channel='push' AND status='pending_provider'`, sends, then sets `sent`/`failed` + `processed_at`.
- **Resend:** API key (server secret) and a verified sending domain; same worker pattern for `channel='email'`, plus configured `email_recipients` for breakdown events.
- Device tokens / OneSignal subscription mapping table and a scheduled worker route under `src/routes/api/public/*` (caller-verified).

## E2E (shared with Stage 4): 109/109 passed
Highlights: duplicate breakdown protection; store-scoped visibility; cross-client denial on every read/write; simultaneous pickup (one winner); full lifecycle with reasons; partial repair → hold → return visit → signed closure; job-card immutability and revisions; reopen/cancel; management close of unresolved jobs; notification routing and read state; no overselling; reservation/dispatch/cancel stock math; price snapshots; cost data hidden from clients; append-only stock history. The audit trail for these runs was checked by SQL (breakdown 9, job 69, job card 12, order 27, product 9, stock 9 entries).

### Re-running
Create temporary users (STGL Admin, two Technicians, Yalelo Client Admin, Yalelo Store Manager, Pick n Pay Client Admin), write their ids/member ids/access tokens to a context JSON as in the script header, then:
`E2E_CTX=ctx.json bun scripts/e2e/stage4-5-operations.ts` (needs `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`).

### Test data left behind
Test accounts were removed from their organizations, banned and set inactive (the database blocked deleting the login records). Job cards and stock movements are permanent by design, so the E2E breakdowns, jobs, cards, orders and products (all named "E2E …", products deactivated and hidden from the store) remain. Use a separate staging database for future test runs.
