# Spruceland IQ — Build status and remaining work (25 Nov 2026)

## How to build and download the APKs
1. Lovable → Project settings → Git → connect GitHub (creates the repo; syncs the `main` branch).
2. GitHub repo → **Actions** → "Android APKs" → **Run workflow** (also runs on every push to `main`).
3. When both jobs finish (~10 min), open the run → **Artifacts**: `spruceland-technician-apk`, `spruceland-yalelo-apk`. Each zip holds `app-debug.apk` (install directly) and, when signing secrets exist, `app-release.apk`.
4. Signed release needs GitHub repo secrets (Settings → Secrets → Actions): `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`. Lovable Cloud secrets are NOT visible to GitHub Actions.
5. Apps load the published site, so **publish in Lovable** before testing; later web publishes update the apps without a new APK.

## Verified in this build
- Capacitor 8 installed (core, android, app, splash-screen, CLI) + OneSignal plugin.
- `npx cap add android`, icon/splash generation (100 assets) and `cap sync` succeed; applicationId `com.sprucelandiq.yalelo` / `com.sprucelandiq.technician`; Firebase google-services applied.
- Not verified here: the Gradle compile itself (no Java in this workspace) — the GitHub run is the first real compile. Push on a real phone untested.

## Done
- Backend Stages 1–5 (tested), Resend email, OneSignal sender, 5-minute dispatcher, invitations.
- Real staff sign-in, reset password, staff route guard, splash + welcome pop-up, branding/icons.
- Live sections: Equipment & ZMA page (register, ZMA status, service schedule, record verification); Live jobs (pickup → complete, job card with paper/no signature); Live stock (add product, movements, publish); Live client orders (confirm → complete, cancel/reject).

## Left in steps 3–5
- Replace remaining demo boards/tables (Kanban, inventory table, orders, dashboard cards) with live data; remove demo data.
- Real client sign-in (store employees, HQ, Yalelo) and client tickets/store/ordering on live data.
- Equipment transfer, photos/documents upload, bulk Excel/CSV import, maintenance completion.
- Digital on-screen signature, job-card PDF on live data, "send prepared email" action, multiple product images.

## Step 6 — Dashboards, notifications, settings, Super Admin
- Live dashboard figures; live notification inbox (read/unread); editable alert/email recipients; scheduled service & ZMA expiry reminders; Platform Super Admin portal; "Coming soon" for payroll/deep financials.

## Step 7 — Acceptance and production
- End-to-end checks of every workflow and security rule; phone/tablet/desktop review; Dev/Staging/Prod setup, backups, final handover.

## Needed from the owner
- STGL job-card company details; team & staff email addresses; GitHub connection + Android signing secrets in GitHub; a real phone to test push.
