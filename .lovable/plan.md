
# Spruceland Operations App — Plan

Mock-only build (no backend). Role picker on login + name + location + subcontractor toggle. All data lives in typed mock modules so the app is instantly demoable and looks full. Industrial slate/amber theme, TV-first layout.

## Login
- One screen: Name input, Role dropdown (Owner, Head of Tech, Technician, Administrator, Client Relationship Manager), Location (Lusaka / Ndola / Both), Subcontractor toggle (technicians/managers only).
- Selection persisted to `localStorage`; simple `useSession()` hook. Logout clears it.
- Owner/Admin get an extra "Permissions" screen (mock UI for who-can-see-what — visual only).

## Shell / Navigation
- Left sidebar (collapsible, icon-mini mode for TV), top bar with logo, global search, location filter, notifications bell, user menu.
- Logo used from uploaded PNG at proper size in sidebar header + login.
- Fully responsive; dedicated `tv:` breakpoint (>=1920px) that enlarges cards, fonts, KPI numbers.

## Role-based Dashboards
Owner sees everything. Others see filtered slices. Permission map is a plain object keyed by role → visible modules.

Modules shown per role:
- **Owner**: KPIs (Quarterly Revenue ~ZMW 3.5M, per-office split Lusaka/Ndola, profit margin, top clients, receivables), Jobs board, Clients, Inventory, Financials, Team, Notifications, Settings.
- **Head of Tech**: Jobs board (all), Technicians workload, Clients, Inventory, SOPs.
- **Technician**: My Jobs, Team Board (read), Client info, SOPs & Calibration guides, Inventory (view).
- **Administrator**: Clients, Jobs, Inventory, Orders, Users & Permissions, Financials (limited).
- **CRM**: Clients (full), Service schedule / due-soon, Payments status, Jobs (read).

## Jobs Board (core feature)
- Views: Kanban (drag & drop between columns: Backlog → Scheduled → In Progress → On Hold → Awaiting Parts → Completed → Closed), Calendar (month/week), Grid/Table, and TV view (big color-coded tiles auto-cycling).
- Each job card: client, branch/location, type (Delivery / Installation / Service / Calibration / Breakdown / Assembly), technician(s), priority (color coded: red=escalated, amber=due-soon, blue=normal, gray=on-hold, green=done), age in days, progress %, notes.
- Actions: Escalate / De-escalate / Hold / Reassign / Close. Drag between columns updates status. Uses `@dnd-kit/core` (mock state).
- Filters: location, technician, client, type, status.

## Clients Directory
- Grid + detail page for each client (Pick'n Pay, Yalelo, Bonaventure, Kachema, Chilanga Cement, KCM, Sabo, National Breweries, Zambeef, Parmalat, Zambezi Portland Cement, Superior Milling, Zambia Sugar, Mpongwe Milling, DHL, First Quantum Minerals, ENRC, Indeni, plus more from logo sheet).
- Per client: primary contact (PNP = "Bumblebee"), phone/email, service cadence (monthly / 3-mo / 6-mo / annual), next service due date, equipment inventory (scales count, scale types, weighbridges), branches with addresses.
  - PNP: 13 Lusaka outlets listed.
  - Yalelo: 26 Lusaka + branches across 9 provinces.
  - Chilanga Cement: weighbridge, active project ("Civils — Week 5", subcontractor/technician assigned).
- Active projects panel, service history, payment status (Paid / Overdue / Pending).

## Financials (Owner-heavy)
- Revenue: 3.5M ZMW/quarter split by office and month; charts (Recharts) — line for trend, bar per office, donut for revenue by client.
- Top paying clients ranked, AR aging, expenses vs profit margin.
- Currency: ZMW formatted (`Intl.NumberFormat('en-ZM',{style:'currency',currency:'ZMW'})`).

## Inventory & Orders
- Stock table (load cells, indicators, junction boxes, cabling, calibration weights, printers, spares), qty on hand, reorder threshold, location.
- Pending orders list w/ supplier, ETA, status.

## Knowledge Base / SOPs
- Sections: Scale calibration (step-by-step for platform, bench, weighbridge), Indicator setup, Diagnosis flowcharts, Safety SOP.
- Rich text pages with numbered steps, "mark step complete" (local state).

## Notifications & Settings
- Notifications page + bell dropdown (service due, breakdown reported, job escalated, payment overdue).
- Settings: theme (already dark by default), density, notification prefs, profile.

## Design System
- Tokens in `src/styles.css` (@theme): slate background `#0f172a`, surface `#1e293b`, amber primary `#f59e0b`, success `#22c55e`, danger `#ef4444`, info `#38bdf8`.
- Status colors mapped to Tailwind semantic tokens so job coding is consistent everywhere including TV view.
- Typography: Inter via `<link>` in `__root.tsx` head. Larger scale at `tv:` breakpoint.
- Shadcn components (Button, Card, Table, Dialog, DropdownMenu, Tabs, Badge, Progress, Sidebar, Calendar, Sheet, Command).

## Routes (TanStack Start)
```
/                    -> redirect to /login or /dashboard
/login
/dashboard           (role-aware)
/jobs                (kanban default; ?view=calendar|grid|tv)
/jobs/$id
/clients
/clients/$id
/inventory
/orders
/financials          (owner/admin)
/team                (technicians roster + workload)
/knowledge
/knowledge/$slug
/notifications
/settings
/permissions         (owner/admin)
```
Simple client-side role gate in a layout route (mock — no server auth).

## Mock Data Modules
`src/data/`: `clients.ts`, `jobs.ts`, `technicians.ts` (Peter, Martin, Charles, Chris, Mwando + a few more), `inventory.ts`, `orders.ts`, `financials.ts`, `notifications.ts`, `sops.ts`, `branches.ts`.
Dates generated relative to today so "due soon" always looks live.

## Tech Notes
- Deps to add: `@dnd-kit/core @dnd-kit/sortable recharts date-fns`.
- Logo: upload via lovable-assets, import pointer JSON, use in sidebar + login.
- All state client-side (zustand-free — React context + localStorage is enough).
- Head metadata per route (title/description/og).

## Out of scope (v1)
Real auth, real persistence, live realtime, per-user permission editing beyond visual mock, offline mode, real payments/invoicing.

Ready to build on approval.
