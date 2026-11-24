# Spruceland operational UI

## Current delivery
The internal operations console and client-store portal still use mock data and unverified demo sign-in. Client tickets and the client session persist in this browser; internal CRUD data remains in React memory. Lovable Cloud is now connected and the Stage 1 leadership provisioning endpoint is implemented independently of the UI. Operational data, native applications, remote uploads and live notifications are not integrated yet. These are production-intended screens, not a production-secure system yet.

## Documentation map
- [Architecture](architecture.md): portal boundaries, source responsibilities and current limitations.
- [Domain and workflow](domain-model.md): equipment, tickets, two-party completion and metrology.
- [Access matrix](access-matrix.md): intended access, not a claim of enforced security.
- [Backend contract](backend-contract.md): adapter responsibilities and integration acceptance criteria.
- [Environments and native delivery](environments-and-native.md): development, staging, production and Capacitor constraints.
- [Stage 1 backend report](stage-1-backend-report.md): leadership provisioning, verified database compatibility, security checks, deployment status and manual acceptance tests.

## Phased progress
1. Foundations: typed tickets, state transitions, async mutation repository and documentation delivered. Assets still come from deterministic sample functions; repository-backed asset reads remain an integration task.
2. Entry: portal chooser and separate client/internal sign-in delivered; identity is unverified.
3. Client shell: Home, Tickets, Schedule and Profile delivered with mobile bottom navigation.
4. Breakdown reporting: equipment prefill, departments, fault, priority, description and attachment selection delivered.
5. Internal ticket handling: assignment, on-site start and repair report delivered; shared activity feed includes ticket history.
6. Client approval: consent, name/reference validation, rejection and printable job card delivered.
7. Compliance: separate Spruceland service and ZMA verification schedules delivered with sample dates.
8. Handoff: tests, documentation and browser lifecycle checks accompany delivery; production work below remains open.

## Next implementation stages
- Dedicated technician mobile experience, then client-HQ experience; do not expand the shared portal selector as a security substitute.
- Replace mock adapters with a real authenticated backend after agreeing identities, tenant membership, policy and schedule rules.
- Deliver native builds only after selecting a static-mobile build or compatible SPA distribution; the current TanStack application includes SSR.
- Review production authorization, audit integrity, financial definitions, ZMA evidence, attachment storage, backups and operational support before go-live.

## Local verification
Run `bunx vitest run src/domain/ticket-workflow.test.ts src/domain/ticket-audit.test.ts src/repositories/portal-repo.test.ts` for ticket rules and repository lifecycle checks. Browser acceptance must also cover client reporting, internal resolution, client approval, printable job card, refresh and mobile layout.