# Roadmap
Active: Master Backend Implementation Stages 1–5 — live status in `docs/backend-implementation/00-tracker.md`.
- [x] Phase A audit
- [x] Phase B Stage 1 close-out
- [x] Phase C Stage 2 auth & security (backend)
- [x] Phase D Stage 3 equipment & compliance (backend)
- [ ] Phase E breakdowns & jobs
- [ ] Phase F inventory & client store
- [ ] Phase G technician ops & job cards
- [ ] Phase H internal notifications
- [ ] Phase I handover

# Client portal delivery

## Current request — Stage 1 backend foundation
- [x] Verify the existing schema, privileged SQL function and grants without changing foundation data.
- [x] Implement self-only, verified-email leadership provisioning with numbered server secrets.
- [x] Test rejection paths and allowlist rules without creating users or changing real privileges.
- [x] Document compatibility findings, deployment status and secure manual tests.
- [x] Restore frontend authentication edits from the superseded request; preserve the pre-authentication UI.

- [ ] Verify successful provisioning, concurrency, revocation and audit creation; blocked on approved existing verified accounts and an integration environment authorized for privilege-changing tests.
- [x] Confirm published missing-token and invalid-token rejection paths: both returned 401 with expected generic JSON.

## Later stages (outside Stage 1)
- Frontend authentication integration is explicitly deferred to Stage 2 by the attached instructions.
- Operational repositories, native apps and production workflow acceptance remain later-stage work.

## Prior UI delivery
- [x] Restore the approved phased plan and inspect existing portal screens.
- [x] Shared client-ticket audit tracking and workflow validation delivered; regression tests pass.
- [x] Architecture, domain, access, environment and backend/Capacitor documentation delivered.
- [x] Original repair-to-approval browser workflow verified in the prior UI phase; no new browser lifecycle claim for Stage 1.
- [x] Remaining production work documented; screens and operational data remain mock-backed.
- [x] Backend Stages 1–5 (see docs/backend-implementation/99-handover.md)
- [ ] Stage 6 push/email providers — needs OneSignal and Resend keys
- [ ] Leadership grant/revoke live test — needs approved staff emails

## Final MVP (current)
- [x] Resend email: invitations, new breakdowns, escalations; live test delivered
- [x] OneSignal push sender (Technician + Yalelo apps) and 5-minute dispatcher
- [x] Capacitor setup for com.sprucelandiq.technician / com.sprucelandiq.yalelo
- [x] GitHub APK workflow for both apps (debug; release when signing key added)
- [x] Real staff sign-in (email/password, first-time account, password reset, approved leadership emails get access automatically); staff pages blocked without staff access
- [x] App icons, splash screens (STGL; Yalelo × STGL), 5-second progress loader and welcome pop-up on app open and sign-in
- [ ] Client portal sign-in on real accounts (needs client user accounts/invitations)
- [ ] Equipment/ZMA, breakdowns/jobs/job cards, stock/store screens on real data (plan steps 3–5)
- [ ] Image uploads, bulk import, Coming-soon modules — next run
- [ ] Job card company details — waiting on STGL address/phone/registration/tax numbers
