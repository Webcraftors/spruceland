# Stage 4 — Breakdowns, Jobs, Inventory & Client Store (Verified 2026-11-24)

Migrations: `0003_stage4_breakdowns_notifications`, `0004_stage5_job_lifecycle_job_cards`, `0005_stage4_inventory_client_store`, `0006_service_role_foundation_grants`.
Access model unchanged: new tables have RLS on, no table grants for signed-in users, and are reachable only through permission-checking `SECURITY DEFINER` functions. Internal helpers (`notify_*`, `log_job_event`, `is_stgl`, `user_has_org_permission`, `job_public_json`, `order_json`, snapshot builders, triggers) are not executable by signed-in users.

## Permissions added (assigned to existing system roles)
| Permission | STGL Owner/Admin | STGL Manager/Dept Head | STGL Technician | Client Admin | Client Manager/Dept Head | Store Manager |
|---|---|---|---|---|---|---|
| breakdown.report / breakdown.view | ✓ | view | – | ✓ | ✓ | ✓ (own stores) |
| breakdown.manage, job.view, job.manage | ✓ | ✓ | job.view | – | – | – |
| job.execute | ✓ | – | ✓ | – | – | – |
| jobcard.correct | ✓ | – | – | – | – | – |
| inventory.view / inventory.manage / inventory.cost.view | ✓ | view | – | – | – | – |
| order.manage | ✓ | – | – | – | – | – |
| store.browse / store.order.place / store.order.view | – | – | – | ✓ | ✓ | – |
| notification.manage | ✓ | – | – | ✓ | – | – |
All are delegable, so client admins can pass store access to managers. Technicians get no inventory or purchasing rights by default.

## Breakdowns (`breakdowns`, `breakdown_email_drafts`)
- `report_breakdown(org, location, equipment?, description, category?, priority?, contact…, client_request_key?, channel?)` — clients need `breakdown.report` + access to that store; STGL (`breakdown.manage`) can log phone/email/WhatsApp calls. Equipment optional. References `BD-YYYY-#####`.
- Duplicate protection: same `client_request_key` returns the original; identical fault at the same store/equipment within 10 minutes returns the original (`duplicate: true`).
- Every report prepares an email draft (subject, recipients from settings, full body) — `get_breakdown_email_draft` returns it plus a `mailto:` link. Status stays `prepared`; nothing claims it was sent.
- `update_breakdown(id, 'set_priority'|'escalate'|'cancel', reason, priority)` — STGL only; cancel needs a reason, is blocked while a technician is en route/on site, and cancels open jobs.
- **Status is derived, not stored**: `reported` (no job) → latest job status, or `cancelled`. Breakdown and job status can't drift apart.
- `list_breakdowns(org?, status?, limit, offset)` — STGL sees all; clients see their own org, location-scoped for store managers.

## Jobs (`jobs`, `job_events`)
- `create_job(...)` from a breakdown (inherits client/store/equipment/priority/contact) or standalone (maintenance, verification, installation, other; optional `maintenance_occurrence_id`). One active job per breakdown.
- `assign_job(job, technician, scheduled_for?)` — manager assignment/reassignment; technician must hold `job.execute` in STGL. Previous technician is told.
- `pickup_job(job)` — one atomic conditional update; when two technicians tap at once, only one wins (verified concurrently).
- `transition_job(job, action, reason)` — accept, decline*, return*, en_route, start, hold*, resume (*reason required). `manage_job(job, 'close'|'cancel'|'reopen', reason)` for managers.
- Lifecycle: `open → assigned → accepted → en_route → in_progress ⇄ on_hold → closed`, plus `cancelled`. Timestamps are written for each step; the first on-site time is never overwritten.
- `list_jobs(view 'all'|'available'|'mine', org?, status?, technician?, location?, overdue_only?, limit, offset)` feeds Kanban/grid/calendar (`scheduled_for`) views. `get_job` returns history + job cards. `job_dashboard_summary()` gives incoming, by status/priority/client, overdue, technician workload.
- Clients never receive `internal_notes`.

## Inventory (`product_categories`, `products`, `stock_movements`)
- Categories are data (seeded: scales, spare parts, accessories, consumables, label rolls), not code.
- `save_product` edits details/prices/publication but **never stock**. Stock changes only via `record_stock_movement(receipt|dispatch|adjustment)` (adjustment needs a reason) or order operations. Stock can't go negative or below reserved stock. Movements are append-only (trigger).
- `list_inventory` shows available = on hand − reserved and low-stock flag; cost price and supplier reference only with `inventory.cost.view`.

## Client store (`store_orders`, `store_order_lines`)
- `list_store_products(org, search?, category?)` — only active + published products; never cost, supplier or internal notes.
- `place_store_order(org, lines[{product_id, quantity}], delivery_location?, instructions?, po_ref?, request_key?)` — prices and totals calculated by the server (prices sent by the app are ignored); line snapshots keep name/SKU/unit price/currency so later price changes don't alter history; duplicate submissions return the original.
- `update_store_order(order, confirm|reject|process|dispatch|deliver|complete|cancel, reason)` — confirm reserves stock (fails if not enough available → no overselling), dispatch deducts stock and releases the reservation exactly once, cancel releases reservations; no cancel after dispatch. Clients may cancel only their own pending orders.
- `set_store_order_commercial(order, payment_status, quotation, invoice, PO)` — payment status (unpaid/invoiced/partially paid/paid/waived) kept separate from fulfilment. No payment gateway.
- Orders are isolated per client organization. The store is intended for the client web portal only (not the technician or store-manager APKs) — enforced by permissions; app-level hiding is Stage 7.

## E2E
`scripts/e2e/stage4-5-operations.ts` — **109/109 passed** (covers Stage 4 and Stage 5). See `05-technician-jobcards-notifications.md` for how to re-run.
