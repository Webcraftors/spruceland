# Backend integration contract

## Existing ticket adapter
`ticketsRepo` currently exposes async `list`, `get`, `create`, `assign`, `startWork`, `resolve`, `signOff`, `dispute` and `ensureSiteSeed`. Hooks subscribe to a synchronous browser snapshot. Client sessions use `get`/`set`, not real auth. Asset reads are currently sample functions, not a completed AssetsRepo.

## Required replacement
| Operation | Backend obligation |
| --- | --- |
| list/get | Authenticated, tenant/site-scoped read; pagination and not-found behavior |
| create | Verify membership/asset ownership, generate server ID/time, commit event atomically |
| assign | Verify dispatch authority, technician/office eligibility, expected ticket revision |
| startWork | Assigned technician only, server timestamp, valid transition |
| resolve | Validate report, retain report revisions and stock/parts references; Awaiting Sign-off only |
| signOff | Verify authorized client signer and confirmation; atomically close and append immutable event |
| dispute | Verify client scope, explanation, reopen with retained prior report |
| ensureSiteSeed | Remove from production; fixtures belong only in dev/staging seed tooling |

Introduce authenticated assets and session adapters alongside remote ticket reads. Use the project query cache for server results and mutation invalidation; never assume the existing synchronous hook can read a remote database unchanged. Supply loading, error, retry and empty states; map authorization errors without leaking other tenants' records.

## Cross-cutting requirements
- Use transactions plus expected revision checks for concurrency. Duplicate submission must not duplicate tickets/sign-offs; support idempotency keys.
- Upload binaries to private storage; store metadata/object keys, validate MIME/size, scan where appropriate and issue short-lived signed URLs.
- Publish change notifications only after committed events; separate in-app updates from email/SMS/native push.
- Keep server credentials server-side. Browser/mobile config contains only public identifiers and publishable credentials.
- Preserve request correlation, actor IDs, server timestamps, before/after state and consent version for audit.
- Plan retention, backups, restore exercises, migration rollback/forward fixes and monitoring before launch.

## Claude Code handoff acceptance
Give Claude Code the source repository and this documentation. Ask it first to inspect the current routes, repositories and tests, then propose adapter/auth/migration changes. Do not provide production keys in prompts or commit `.env` files. Test against isolated staging before production.

Accept integration only when two different authorized users on different devices can report → assign → repair → approve, unauthorized direct ticket/job-card/upload access is denied, refresh reads the committed state, concurrent approval is handled and audit events cannot be edited by clients.