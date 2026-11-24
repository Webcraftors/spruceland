# Stage 3 — Equipment & Compliance (Verified backend, 2026-11-24)

## Pre-existing (inspected)
- Configuration: categories, types, manufacturers, models, conditions, spec fields/values, maintenance types (`save_*`, `get_equipment_configuration`).
- Registry: `register_equipment`, `update_equipment_details`, `transfer_equipment`, `replace_equipment`, `set_equipment_lifecycle_status`, `list_equipment`, `get_equipment_details`, `get_equipment_history`.
- Shared STGL↔client access: `equipment_service_relationships` + `has_equipment_provider_access`.
- Change requests: submit → review → resolve.
- Maintenance plans/occurrences/service records with immutable, supersedable service history.

## Added this run (migrations 0001, 0002)
- `equipment_verifications`: ZMA (or other authority) verification. Fields: `verified_on`, `valid_until`, certificate/seal numbers, outcome `passed|failed|conditional`. Immutable; corrections supersede.
- `equipment_documents`: metadata for files in `equipment-documents`. Archive-only (no delete; only status can change).
- Functions: `record_equipment_verification`, `list_equipment_verifications`, `list_equipment_compliance_status` (`never_verified|failed|expired|due_soon|compliant`, window 0–365 days), `register_equipment_document`, `list_equipment_documents`, `archive_equipment_document`. All write `audit_logs`.
- Rules: `valid_until ≥ verified_on`; `verified_on` not in the future; storage path must match the equipment's owner org and id.

## E2E results (`scripts/e2e/stage3-equipment-compliance.ts`): 31/31 passed
Covered:
- Config → location → equipment registration.
- Own list/details.
- Cross-tenant and spoofed-organization reads denied; anonymous users denied.
- Compliance status moves never_verified → due_soon → compliant (after a superseding verification); invalid and future dates rejected; cross-tenant recording denied; direct table reads blocked.
- Uploads: allowed for the owner; blocked for another tenant or a mismatched folder. Document registered; bad path rejected; owner download works; cross-tenant download denied; archive hides the document.

A first run failed 2 upload checks (the upload policy read `equipment` without a grant). Migration 0002 fixed it, and the re-run passed. All test data was removed afterwards; audit entries remain by design.

## Re-running
Create two test users who are admins of different client orgs. Save their session JSONs and run:
`E2E_SESSION_A=a.json E2E_SESSION_B=b.json bun scripts/e2e/stage3-equipment-compliance.ts`, then the stage 2 script.
