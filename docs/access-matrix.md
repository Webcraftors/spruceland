# Intended production access

This matrix is an integration proposal, not permissions currently enforced by the mock browser sessions.

| Audience | Site tickets/assets | Report breakdown | Assign | Repair report | Approve repair | Finance |
| --- | --- | --- | --- | --- | --- | --- |
| Client employee | Authorized site only | Yes | No | No | Authorized site signer | No |
| Client HQ | Authorized company sites | Policy-dependent | No | No | Policy-dependent | Client-approved reports only |
| Technician | Assigned jobs/assets | Operational policy | No | Assigned work | No | No |
| STGL dispatch/head of tech | Authorized office scope | Yes | Yes | Operational policy | No | No by default |
| STGL administrator | Granted office/company scope | Yes | Yes | Operational policy | No | Explicit grant |
| STGL owner | Organization-wide granted scope | Yes | Yes | Operational policy | No | Yes |

## Backend requirements
- Verify membership on every read and mutation; never trust a submitted client ID, site ID, role or employee reference.
- Enforce tenant/site scope on lists, ID lookups, signed attachment URLs, job cards, notifications, exports and search.
- Technician assignment and closure are separate authorities; client sign-off must not be impersonated by a technician or dispatcher.
- Treat NRC as sensitive personal information. Prefer employee identifiers where possible, mask outside authorized views, and establish retention/deletion rules.
- Remove self-selected roles and arbitrary employee sign-in before production; approve/invite contracted client users.
- Admin console and HQ console should be separately distributed from the mobile app. Separate bundles reduce exposure, but server permissions remain mandatory.