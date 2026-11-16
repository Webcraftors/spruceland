# Spruceland Client Portal & Operational Workflows: Phased UI Build (Mock Data First)

Yes. We build every screen and workflow with realistic mock data and test it end to end in the preview. Once you're happy with it, the backend gets connected by swapping the data layer. The screens don't need to change.

## Guiding principles
- Production-grade UI. Mock data sits behind one data layer so it can be replaced cleanly later.
- Client app is mobile-first (ready to wrap in Capacitor). The STGL admin console is desktop/TV-first.
- The existing admin features stay as they are.
- Each phase ends with a test run on mobile and desktop before the next one starts.

## Phase 1: Foundations and documentation
- `/docs` folder: architecture, domain model (tickets, assets, job cards, sign-offs), workflow state machine, role/permission matrix, the backend integration contract, and the environment strategy (dev / staging / prod).
- Typed domain models and a repository layer (`TicketsRepo`, `AssetsRepo`, `ClientSessionRepo`). The first version is backed by localStorage. Later versions can be backed by Supabase or an API.
- Seed data: client employees, departments per client (PNP: Butchery, Bakery, Deli, Produce, Receiving, Production), installed scales per outlet (make, model, serial, type), Spruceland service schedules and ZMA verification dates.

## Phase 2: Entry and client sign-in
- `/` becomes the portal chooser: two centered options, **Client Portal** and **Spruceland Admin**. Admin sign-out returns here.
- `/client` sign-in steps: search company, then name + NRC/Employee ID, then province, then outlet/site (this step is skipped when the company has only one site in that province).
- Client session is stored separately from the admin session.

## Phase 3: Client app shell and home
- Branded header, bottom navigation (Home, Tickets, Schedule, Profile) and safe-area padding.
- Home shows: open tickets, the next Spruceland service date, the next ZMA verification date, and recent activity.
- Profile shows: employee, company, province, outlet, department, and sign-out.

## Phase 4: Breakdown tickets (client side)
- Ticket list with filters by status: Open, Assigned, In Progress, Awaiting Sign-off, Closed.
- Raise-ticket form:
  - Store and location are pre-filled.
  - Picking the equipment fills in make, model, serial and type (Platform/Retail/Floor/Lab).
  - Department, common fault (calibration, product, label printing, wiring, display, load cell, power, other), priority and description.
  - Photo/video attachments with previews.
- Ticket detail page with a status timeline.

## Phase 5: Technician resolution (admin side)
- New **Client Tickets** page in the admin console: queue, assign technician, change status.
- Resolve form: diagnosis, work done, parts used, test readings. Submitting it sets the ticket to Awaiting Client Sign-off.
- Activity entries are recorded in the existing admin activity log.

## Phase 6: Client sign-off and digital job card
- Sign-off screen with the technician's report, a consent checkbox, typed name, and an NRC/ID that must match the signed-in employee, then "Agree, work completed". Only then does the ticket close.
- Job card / service voucher page with **Print / Save as PDF**. It includes client, asset, fault, work done, technician, sign-off and audit trail.
- Both sides see the history.

## Phase 7: Schedule and compliance
- Per-asset upcoming Spruceland service dates and ZMA verification dates.
- Overdue and due-soon badges.

## Phase 8: Polish and handoff
- Every new page gets its own title, description and share metadata.
- Empty, loading and error states. Accessibility checks.
- Full lifecycle tested at mobile and desktop sizes.
- Capacitor readiness notes and a final update to `/docs` for Claude Code.

## Technical notes
- Routes: `src/routes/index.tsx` (chooser), `client.tsx` (sign-in), `client_.app.tsx` layout with `client_.app.index/tickets/tickets.$id/tickets.new/schedule/profile/jobcard.$id`, plus admin `_app.client-tickets.tsx` and `_app.client-tickets.$id.tsx`.
- The ticket state machine is a pure module, `src/domain/ticket-workflow.ts`, with unit tests for allowed transitions and for the sign-off ID-match rule.
- Repositories expose async functions. Swapping in the backend later means a new implementation of the same interface.
- AGENTS.md records the data-layer and routing decisions.

We can approve the plan and start at Phase 1, then review each phase in the preview before moving on.
