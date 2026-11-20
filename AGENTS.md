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
