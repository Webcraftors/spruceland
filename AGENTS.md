<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep client routes separate from the internal console and keep their sessions independent; each audience needs its own navigation and future access boundary.
- Route client-ticket mutations through the async portal repository and pure workflow validators; backend adapters can replace local storage without changing the screens.
- Derive client-ticket audit entries from persisted ticket activity; this keeps client history and the internal audit feed consistent without duplicate writes.
- Persist the on-site start time before resolving a ticket; arrival time must not be replaced by the time the report was submitted.
- Keep mock identities and local persistence explicitly non-production; real authorization, tenant isolation, audit integrity and uploads must be enforced by the future backend.
- Implement leadership provisioning as a handler-authenticated TanStack HTTP route, not a new Edge Function; this project uses the supported Worker runtime and existing generated privileged client.
- Resolve leadership allowlists only on the server after verifying the caller; delegate writes to the existing transactional SQL function to preserve idempotency and revocation history.
- Keep Stage 1 backend provisioning disconnected from frontend sign-in and operational repositories; account integration belongs to a later explicitly approved stage.
- Expose operational tables only through permission-checking SECURITY DEFINER functions (no table grants); keeps tenant/location rules in one place.
- Derive breakdown status from its latest job instead of storing it; two independent statuses would drift.
- Change stock only through stock-movement or order functions (append-only history, server-side prices); prevents overselling and tampered totals.
- Choose notification recipients server-side by permission and location scope, and queue push/email as pending until a real provider confirms delivery.
- Send email/push only from the server outbox dispatcher (`notification_deliveries`, cron route) or server functions; DB functions only queue, so providers can change without touching SQL.
- Never let delivery code read or modify `breakdown_email_drafts`; drafts are staff-owned and preserved as written.
- Build both Android apps from one codebase via `CAP_FLAVOR` + Vite mode; package names are permanent and must not change.
