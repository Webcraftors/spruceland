# Spruceland IQ — Final MVP completion plan

Reuse the existing screens, cards, dialogs, Kanban, client portal and job card. Restructure and connect them to the real backend instead of rebuilding.

## Blocker found in your uploads
Both Firebase files you uploaded are registered to `com.sprucelandiq.technician`. The Yalelo file must be registered to `com.sprucelandiq.yalelo`. Please add a Yalelo Android app in Firebase with that package name and upload its new file. The Technician build is unaffected.

## Order of work

### Step 1 — Safety and audit (Phase A)
- Record the current migration history and tables in the tracker.
- Keep the E2E test records hidden and labelled; no destructive cleanup.

### Step 2 — Email via Resend (Stage 6 email)
- Server-only email sender using RESEND_API_KEY and RESEND_FROM_EMAIL.
- Send for: user invitations, important breakdown reports, escalations.
- Prepared breakdown drafts stay as drafts. Staff review, edit and send them manually; sending never overwrites the draft text.
- Every send is logged in the delivery outbox (sent, failed, reason).
- Live test: send one invitation, one breakdown alert and one escalation to a test address, and confirm them in the delivery records.

### Step 3 — Push via OneSignal (Stage 6 push)
- Two OneSignal apps: Technician (job assigned, escalated, due) and Yalelo (breakdown updates, resolved, awaiting sign-off, order status).
- Server-side sender picks the app by recipient role, using the four OneSignal secrets.
- Phone registers its device with the signed-in user so alerts reach the right person.
- In-app notification inbox reads from the backend, with read/unread state and open-job quick actions.

### Step 4 — Real sign-in and protected portals (Stage 7)
- Portal chooser stays. Staff sign-in, client sign-in and the two mobile apps use real accounts.
- Navigation and pages show only what the user's role and locations allow.
- Admin and HQ areas are web-only; the mobile apps open only their own screens.

### Step 5 — Connect existing screens to the backend
- Staff portal: dashboard, clients, equipment, breakdowns/jobs Kanban, stock, orders, notifications and activity read and write real data.
- Client portal: equipment and ZMA due dates, breakdown tickets, sign-off, job card, client store.
- Unfinished modules (e.g. financial deep-dives without data) show "Coming soon".
- Profile photos, equipment photos and multiple product images use private storage.
- Bulk equipment import from Excel/CSV with a preview and duplicate check.

### Step 6 — Technician and Yalelo mobile apps (Capacitor)
- One codebase, two app builds:
  - STGL Technician: `com.sprucelandiq.technician`, opens the technician screens.
  - Yalelo Store Manager: `com.sprucelandiq.yalelo`, opens the client store screens.
- Each build gets its own name, icon, OneSignal app and Firebase file.
- Android projects are generated on your computer with the build commands in the handover doc (Lovable cannot produce the APK itself).

### Step 7 — Polish and handover
- Professional STGL job card with signature options.
- Visual check on phone, tablet and desktop.
- Run all tests, update tracker, roadmap and final report.

## What I still need from you
1. Corrected Yalelo Firebase file (see blocker).
2. A test email address for live delivery checks.
3. STGL address, phone, email, website, registration and tax numbers for the job card (placeholders until then).
4. Approved staff emails for the leadership access test.

## Technical details
- Email: `src/lib/email/resend.server.ts` calls Resend directly with the user's key (explicitly chosen provider); triggered from server functions after database writes; outcomes written to `notification_deliveries`.
- Push: `src/lib/push/onesignal.server.ts`; app ID chosen per audience (`ONESIGNAL_STGL_*` / `ONESIGNAL_YALELO_*`); devices stored by external user ID = profile id via `OneSignal.login`.
- Capacitor: `capacitor.technician.config.ts` and `capacitor.yalelo.config.ts`, build mode `--mode technician|yalelo` sets `VITE_APP_FLAVOR` which chooses the start route; `google-services.json` copied into each `android/app/`. Firebase files are kept out of the public web bundle.
- Repositories swap from localStorage to backend RPCs behind the existing repository interfaces, so screens change minimally.
- Scheduled reminders via a protected `/api/public/cron/*` route verified with a generated secret.
