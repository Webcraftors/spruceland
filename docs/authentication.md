# Account authentication

## Implemented
- Lovable Cloud email/password registration and sign-in, Google and Lovable sign-in.
- Email confirmation remains required. A successful registration without a session shows a confirmation message, not the dashboard.
- Forgot-password links return to the public `/reset-password` page; recovery updates omit current_password.
- The existing auth.users trigger creates profiles. Profiles store full name, phone, avatar, employee reference and a client/store context; only the account owner can read/update personal fields.
- The existing organization membership and role-assignment tables remain the source of internal privileges. The protected current_internal_role function derives staff roles from active STGL membership, active profile and active organization. Registration never assigns a privileged role.
- One root account listener updates navigation/cache on identity changes. Sign-out cancels requests, clears protected query cache and legacy demo identities, clears auth, and replaces navigation with the portal chooser.
- Client and internal navigation/context remain separate. They use one account identity on the same origin: this is not two independently authenticated identities. Deploy separate origins/apps if simultaneous independent audience accounts are required.

## Important limitations
- Tickets, equipment, jobs, financials and uploads still use demo repositories. Real sign-in does not make local ticket storage, audit history or financial models production-ready.
- Self-entered client company/store details are preferences for demo screens, NOT verified tenant membership and NOT authorization. Before replacing demo repositories, require invitation-approved organization/location membership and enforce it in every protected function and database policy.
- Existing internal privileges are not editable from public registration. Administrators must provision staff through a trusted administrative process; this change does not create an account/role management screen.
- Managed OAuth is configured for Lovable-hosted apps. External hosting and native Capacitor callback URLs require their own verified deployment integration before release.

## Checks before release
- Test confirmation and recovery emails on every deployment origin, including recovery after Auth consumes the fragment.
- Verify Google and Lovable redirect flows with actual provider accounts.
- Apply database RLS/GRANT policies to every live operational table before connecting repositories.
- Test invitation approval, suspension, cross-tenant access and server-side authorization on all mutations.