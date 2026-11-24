# Stage 2 — Authentication & Security (Verified backend, 2026-11-24)

## In place
- Email/password + social sign-in on the shared auth service; `profiles` row auto-created by `handle_new_user`; `sync_auth_user_email` keeps email in sync.
- `is_active_user()` requires an active profile. Inactive or suspended users fail every function.
- RBAC: permission codes (`permissions.permission_code`) → roles → `member_roles`. Checked by `has_org_permission(org, code)`. Location scope: `location.scope.organization` / `.hierarchy` + `member_locations`.
- Invitations: the inviter sends only a SHA-256 **hash** (`create_user_invitation`, `onboarding_method` ∈ `email_invitation|admin_created`). The invitee calls `accept_user_invitation(raw_token)`, which needs the same email, is single-use and expires.
- Storage: private bucket `equipment-documents` (25 MB; PDF, images, MP4). Path `<owner_org_id>/<equipment_id>/<file>`. Read/upload are allowed only with `equipment.document.view` / `.manage` on that equipment, via `caller_can_access_equipment` / `caller_can_upload_equipment_document`.

## E2E results (`scripts/e2e/stage2-auth-security.ts`, two temporary tenant admins): 12/12 passed
- Own permissions readable; another org's permissions empty.
- Cross-tenant location create and invite denied.
- Invite created; wrong user can't accept; bad token rejected; invitee accepts; token is single-use; invitee gains only Client User rights (can't create locations).
- Profiles only return the caller's own row.

## Not done in Stage 2 (by scope)
- Frontend sign-in screens remain mock (Stage 7).
- Invitation email delivery (Stage 6).
- Leadership live grant (Blocked, see Stage 1).
