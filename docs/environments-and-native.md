# Environments, Vercel and Capacitor

## Git is not a database environment
Git branches isolate source changes; they do not automatically create separate data or credentials. Recommended setup:
- Development: feature branches and local previews, disposable development data/backend.
- Staging: integration branch or designated staging deployment with an isolated backend, sample accounts and test native builds.
- Production: reviewed release from the approved branch, separate production backend, real accounts, backups and restricted credentials.

Use at least separate staging and production backends; add a dedicated development backend when the team needs it. Keep preview builds away from production credentials. Apply versioned migrations to development/staging, verify access and workflows, then apply the reviewed migration to production. Never copy real NRC data into fixtures.

Configure each hosting environment separately. The current application has no backend variables; future adapters define their exact names. Public `VITE_*` values are compiled into the client and must never contain secrets. A branch name or build mode is not sufficient isolation by itself.

## Current web deployment
The project uses TanStack Start with Vite and a Nitro adapter; inspect `vite.config.ts` and the hosting preset before changing deployment. The UI continues using a local public logo path compatible with app hosting. Existing Vercel behavior is not reconfigured or independently certified in this phase. Test server-rendered deep links and static assets on a staging deployment, not only the development preview.

## Native delivery
Capacitor packages static web assets, not a running TanStack SSR server. Before native setup, choose a client-only mobile build with supported routing/static output, or a separately built mobile frontend sharing the domain/UI code. Point Capacitor `webDir` to the verified static output, not the server bundle. A production `server.url` pointing to a hosted app is not the default offline-ready packaging strategy.

The client screens already have mobile navigation and safe-area spacing. Capacitor configuration, Android/iOS projects, device testing, camera/media permissions, secure token storage, push, offline queue and app-store signing are **not implemented yet**. Add platform plugins behind adapters rather than embedding native calls in every screen.

Separate staging/production app identifiers, icons/labels, backend config and signing credentials. Keep STGL financial/admin and client-HQ modules out of the mobile build. Test keyboard, safe areas, camera, network loss, session expiry, deep links and upload retry on physical devices before distribution.