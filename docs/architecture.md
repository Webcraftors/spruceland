# Architecture

## Portal boundaries
- `/`: portal chooser, not authorization.
- `/client`: mock employee onboarding with company → province → site and employee details.
- `/client/app/*`: client-store application with independent browser session and mobile navigation.
- `/login` and existing internal routes: STGL console with role-selected mock session.
- `/client-tickets/*`: internal queue consuming the same browser-local client ticket repository.
- `/jobcard/$id`: printable service record. Currently browser-local and **not access-protected**; the backend release must protect it.

Route filenames follow TanStack generated route IDs. `client_.app` deliberately un-nests the client shell from the sign-in page. Layouts render `Outlet`; generated route-tree files are not manually maintained.

## Data path
Screens → repository mutation methods → pure workflow validation → localStorage → reactive ticket subscription. Client history and the internal activity feed derive from the same ticket events. Internal jobs, clients, orders and inventory still use their original in-memory provider.

`src/domain` holds shared ticket contracts and validation. `src/data/portal.ts` supplies deterministic mock equipment and sample history. `src/repositories/portal-repo.ts` owns ticket persistence. Components use `useTickets()` for a browser snapshot; this is not yet a remote-query adapter. Replacing persistence alone is insufficient: backend integration must supply authenticated reads, loading/error states, refetch and subscriptions.

## Current limits
- Browser-local tickets do not sync across devices. There is no server audit, real permissions, notification service or trusted identity.
- Client list/detail access is not a security boundary. Tenant/site checks must be implemented consistently in lists, direct detail links, job cards, uploads, search and notifications.
- Small photo previews can be stored locally. Larger photos and videos currently retain metadata only after submission; do not describe them as uploaded evidence.
- Mock service and ZMA dates are generated relative to the current date, not immutable compliance records.
- Internal financial figures and contracts are demonstration calculations, not accounting records.

## Integration approach
Preserve domain-shaped screen inputs while introducing authenticated repository adapters and query-cache reads. Move mock fixtures into development-only builds before production. Keep admin/HQ screens out of the mobile bundle rather than merely hiding links. Do not ship private keys to any web or native client.