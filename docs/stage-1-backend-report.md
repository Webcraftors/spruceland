# Spruceland IQ — Stage 1 implementation report

## Scope and platform adaptation

Backend-only leadership provisioning; no Stage 2 frontend authentication or operational data integration.

This project is TanStack Start, so new HTTP endpoints use a TanStack server route rather than a new Deno/Supabase Edge Function. The protected endpoint is `POST /api/public/provision-leadership`. The `public` URL prefix bypasses site-level authentication for external/mobile callers, but the handler itself always requires and verifies a Supabase Auth bearer token before any provisioning. There is no unauthenticated write path. Numbered secrets are read from the server's environment inside the handler, not via Deno.env.

## Files

Created:
- `src/server/leadership-policy.ts`: pure matching, method/body validation, auth decision flow and CORS policy.
- `src/server/leadership-handler.server.ts`: Auth validation, account eligibility and existing transactional RPC integration.
- `src/server/leadership-policy.test.ts`: policy tests using synthetic identities and mocked dependencies only.
- `src/routes/api/public/provision-leadership.ts`: POST/OPTIONS endpoint; GET rejected.
- `docs/stage-1-backend-report.md`: this report and manual testing guidance.

Updated: `AGENTS.md`, `roadmap.md`, `docs/README.md`. The route generator adds the endpoint automatically.

Frontend changes begun for the earlier authentication request were restored to commit `3d6f504` for the existing login, root, internal shell, client screens, session provider, package manifest and lockfile. The newly introduced AuthForm, account provider and authentication/recovery pages were removed. The pre-authentication demo UI is preserved.

### Earlier-request database/configuration changes

Before this Stage 1-only attachment arrived, the preceding authentication request had already enabled email, Google and Lovable auth and applied `0000_account_profiles_and_internal_access.sql`. That migration added `employee_ref` and `client_context`, owner-only profile policies/limited update grants and `current_internal_role()`. These are not used by the restored frontend. The migration history and database additions were retained rather than silently reversed. No additional migration or data mutation was executed for the Stage 1 request. If those earlier additions must be retired, review and approve a separate corrective migration first; no correction was applied here.

## Database compatibility findings (read-only verification)

- All 16 foundation tables exist and have RLS enabled.
- Counts match the supplied foundation: 3 organizations, 15 roles, 16 permissions, 5 applications, 5 organization-application assignments, 0 platform administrators, 0 leadership provisioning records.
- STGL `Owner` and `Admin` roles exist; Yalelo `Client Admin` exists.
- STGL `stgl_owner` and Yalelo `client_admin` applications exist, are active and enabled for their organizations. The SQL function intentionally routes STGL Admin to the `stgl_owner` application.
- The actual `provision_leadership(uuid,text,text)` function is SECURITY DEFINER, uses an empty explicit search path and a per-user transaction-scoped advisory lock. It locks/checks the verified Auth user and active profile before writes.
- Its ON CONFLICT targets match actual keys: platform_admins(user_id), organization_members(organization_id,user_id), member_roles(member_id,role_id), member_app_access(member_id,application_id), leadership_provisioning(user_id,leadership_type).
- Actual defaults, nullable audit organization IDs, UUID/JSONB fields and status checks support the existing inserts. Membership and platform-admin `active` are permitted values; application/organization `active` checks match the actual schema.
- Existing foreign keys enforce matching organization IDs for membership, role and portal assignments.
- `anon` and `authenticated` cannot execute the privileged function; `service_role` can. Verified using `has_function_privilege`, not inferred from RLS.
- The SQL function returns `already_processed` when history exists before attempting to restore grants. This response means historical processing, NOT current entitlement. Revoked assignments are not restored by the endpoint. Pre-existing suspended memberships/platform accounts without history are rejected by the SQL function.
- Each category RPC is independently transactional; failure in one category does not undo a successful separately authorized category. Individual outcomes are returned with 200, 207 (partial) or 409 (all failed).

No compatibility correction to the existing provisioning function was identified by static schema/function inspection. Successful live SQL execution, concurrent locking, audit creation and revocation scenarios remain unverified until run with approved existing accounts; function creation alone is not claimed as runtime proof.

## Secrets conventions

Each prefix is independently scanned from index 1 through 100 inclusive; gaps, missing prefixes and repeated matching addresses within a category are supported:

| Prefix | Server-derived category |
| --- | --- |
| `SUPER_ADMIN_EMAIL_` | `super_admin` |
| `STGL_OWNER_EMAIL_` | `stgl_owner` |
| `STGL_ADMIN_EMAIL_` | `stgl_admin` |
| `YALELO_ADMIN_EMAIL_` | `yalelo_admin` |

Addresses are trimmed and lowercased for comparison. Multiple categories are processed only if independently allowlisted. Removing a secret prevents future bootstrap requests; it does NOT revoke existing database privileges. No allowlist values are copied to the browser, output, logs or database. The source uses the existing generated service-role client; no private credential is hardcoded or returned.

Optional `PROVISION_LEADERSHIP_ALLOWED_ORIGINS` is a comma-separated list of exact HTTPS origins. The request's own origin is allowed by default. No wildcard CORS or credential cookies are enabled. Native/no-Origin requests still require the same verified bearer token. Additional Capacitor origins require a later explicitly reviewed configuration; no APK changes were made.

## Auth and request handling

- Missing/malformed/invalid access token: 401.
- Genuine identity retrieved with Auth `getUser(token)`, not decoded JWT claims alone.
- Unconfirmed email: 403 before secret matching or privileged client access.
- Non-allowlisted user: 403 with no privileged database operation.
- Matching caller: server-only admin lookup confirms the current user, ban status, verified email and active profile; the SQL function independently rechecks identity/profile/membership constraints in its transaction.
- Only self-provisioning. No caller-provided user ID, email, role or organization is accepted. Request body may be absent or `{}` only.
- GET: 405; restricted OPTIONS preflight does not provision anything.
- Errors are generic; SQL/provider details and identities are neither logged nor returned. Responses are `Cache-Control: no-store`.
- No Auth users are created, emails confirmed, suspended accounts reactivated, mock foundation rows inserted or existing rows deleted by this implementation/testing.

## Automated tests and live checks

Policy test suite: 22 tests passed. Covers index 100, all 400 secret lookups, gaps, normalization, duplicates, index 101 ignored, 401/403 rejections, four prohibited body parameters, self-only identity forwarding, explicit multi-category grants, category isolation, historical result handling, partial-error sanitization, method restrictions, no-store and exact-origin CORS.

Existing workflow regression suite: 11 tests passed across ticket workflow, ticket audit and repository lifecycle.

Live local HTTP checks executed against the actual endpoint:
- Missing token POST: 401, generic authentication error.
- Invalid synthetic token POST: 401, generic authentication error.
- Untrusted Origin POST: 403, generic origin error.
- GET: 405; same-origin POST preflight: 204.

Read-only catalog checks verified the real schema, counts, matching role/application mappings, function definition and API-role execution privileges. No real leadership assignment was written during tests.

## Deployment status

Publishing was requested for `https://spruceland.lovable.app`. After publication, actual POST requests to `https://spruceland.lovable.app/api/public/provision-leadership` returned 401 for both missing and invalid synthetic tokens, with the expected generic JSON responses. This verifies the published endpoint's rejection paths, not a successful leadership assignment or every aspect of the deployment. This is a TanStack endpoint, not a separately deployed Supabase Edge Function. New server endpoint/secret changes require publishing the application to affect the live deployment.

The final preview build/typecheck log reported `build OK`. All 33 targeted tests passed. Basic security checks reported no issues; deep code security analysis was not run. Final read-only counts remain 0 platform administrators and 0 leadership provisioning records, confirming the safe checks did not provision leadership. Source comparison against the pre-authentication UI shows only the new API route in the frontend directory tree; existing screens, components, session code, styles and package files match that baseline.

## Secure manual acceptance tests

Use only existing, approved, verified accounts; do not create accounts or change production allowlists merely for testing. Use an isolated integration environment for grant/revocation/concurrency tests.

1. Sign in with an approved existing account using the normal Auth flow; keep its access token private in an API client's secret-variable store. Never paste tokens into source, chat, screenshots or test logs.
2. POST `{}` to the endpoint with `Authorization: Bearer` plus that private token. Check only expected category/status output. An unverified account should get 403; a verified non-allowlisted account should get 403 and no writes.
3. With a pre-approved matching account, verify expected membership/role/app rows, one history record and the `leadership.bootstrap_completed` audit entry through a trusted administrative read. Never infer current access from `already_processed` alone.
4. Repeat the request; row counts must not increase. In integration, issue two concurrent requests for the same approved identity; verify one set of rows and consistent history. This validates the actual advisory lock, not a mocked lock.
5. Verify a solely STGL-allowlisted account gets neither Yalelo nor platform authority. A separately multi-allowlisted account gets exactly the configured categories.
6. In integration only, suspend the profile/membership or revoke an already provisioned assignment while retaining history. Repeating bootstrap must not restore/reactivate anything. Restore test state through the authorized administrative process, not the bootstrap endpoint.
7. Remove an integration allowlist entry; future bootstrap must return 403 but existing grants remain unchanged until separately revoked.
8. Retest missing/invalid token, direct privileged SQL execution denial for anon/authenticated, blocked Origin and absence of secret/identity detail in all responses after publication.

## Remaining work

Live successful provisioning, duplicate/concurrent/revocation/audit tests require approved verified accounts and permission to alter integration privileges. No such production writes were attempted. Stage 2 frontend authentication, tenant data policies, technician/client-admin applications and operational integration remain deliberately deferred.