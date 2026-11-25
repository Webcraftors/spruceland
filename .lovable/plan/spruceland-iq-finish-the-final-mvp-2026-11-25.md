# Spruceland IQ — Finish the final MVP

## Where things stand
- Done: backend Stages 1–5 (tested), live email (invitations, breakdowns, escalations), push sender for both apps, 5-minute alert sending, invitation acceptance page, Capacitor settings and both Firebase files.
- Not done yet: the screens still show demo data, and the Android projects do not exist in the repo yet, so an APK **cannot** be built from GitHub today. Step 1 fixes that.

## Build order

### Step 1 — APK builds from GitHub (Phase M)
- Generate and commit the two Android projects (Technician and Yalelo) with the permanent package names, Firebase files, OneSignal and app names.
- Add a GitHub Actions workflow: every push (or a manual "Run") builds both APKs and attaches them as downloads.
- Debug APKs right away; signed release APKs (for Play Store) once you add your signing key to GitHub secrets.
- Android back button, splash screen and app icons (Spruceland logo placeholder until you send final icons).

### Step 2 — Real sign-in and protected portals (Phase D / Stage 7)
- Replace demo login with real accounts on the existing login, client sign-in and chooser screens.
- Separate entry for STGL staff, client web portal, Platform Super Admin, Technician app and Yalelo app.
- Password reset, logout, suspended users blocked, direct links to pages you are not allowed to see are refused.
- Menus show only what the role and stores allow. Phones register for push after sign-in.

### Step 3 — Equipment, maintenance and ZMA on real data (Phases B, F, G)
- Equipment list/detail, transfers, history, photos (private storage).
- Bulk import from Excel/CSV with column mapping, preview, duplicate serial handling and a results report.
- Maintenance plans, due/overdue, completion; ZMA verifications, shared certificates and batches.

### Step 4 — Breakdowns, jobs and job cards on real data (Phases F, I, K)
- Existing Kanban, job pages and client tickets connected to the real breakdown/job functions.
- Technician app: available jobs, pick up, en route, on site, partial/full repair, decline/return with reason.
- Professional job card: digital signature, paper card number or no signature; print/PDF; corrections as revisions.
- Staff "send prepared email" action using the preserved drafts.

### Step 5 — Stock, client store and orders (Phases F, G, J)
- Inventory, multiple product images, publish/unpublish, cost price hidden from clients.
- Client store and Yalelo app ordering; confirm, dispatch, cancel with stock reservation.

### Step 6 — Dashboards, notifications, settings, Super Admin (Phases C, F, H)
- Dashboards fed by real figures; notification inbox live with read/unread; alert settings and email recipients editable by staff.
- Scheduled reminders (service due, ZMA expiry).
- Platform Super Admin portal; unfinished ERP modules (e.g. payroll, deep financials) clearly marked "Coming soon".

### Step 7 — Final acceptance and production readiness (Phases N, O)
- End-to-end checks for every list in section 19 (auth, workflows, imports, ZMA, store, uploads, interface, security).
- Phone, tablet and desktop visual check; remove all leftover demo data.
- Backup, Dev/Staging/Production setup notes, final handover report.

## What I need from you
1. **Android signing key** for Play Store releases (or say "create one" and I will add a secure form for it). Debug APKs need nothing.
2. **App icons and splash image** for both apps (optional; logo used until then).
3. **STGL company details** for job cards: address, phone, email, website, registration and tax numbers.
4. **Team email addresses** that should receive breakdown and escalation emails (currently your test address).
5. **Approved staff emails** for Owner/leadership and the Platform Super Admin.
6. Confirm the GitHub repo is connected (Lovable → GitHub) so the workflow can run there.

## Technical details
- `npx cap add android` run with `CAP_FLAVOR` for each flavor → `android-technician/`, `android-yalelo/` committed; gradle `applicationId` fixed; google-services plugin applied; `.github/workflows/android.yml` runs `bun install`, `bun run cap:<flavor>`, `./gradlew assembleDebug` (and `assembleRelease` with `ANDROID_KEYSTORE_*` secrets), uploads artifacts.
- Mobile builds point at the published backend; flavor decides start route and allowed routes.
- Screens move from localStorage repositories to RPC-backed repositories behind the same interfaces; mock data removed only after each module is verified.
- Uploads use private buckets with size/type limits enforced server-side.
