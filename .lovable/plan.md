# Spruceland Client Service Portal — Implementation Plan

## Goal
Add a polished, mobile-first client portal beside the existing Spruceland admin application. Everything remains presentation-only: demo identities, tickets, equipment, approvals, and uploads use local browser state with no backend or real authentication.

## Entry and sign-in flow
- Change `/` from an automatic admin redirect into a centered portal chooser with two clear options: **Client Portal** and **Spruceland Admin**.
- Keep the current admin sign-in and dashboard unchanged behind **Spruceland Admin**; admin sign-out returns to the portal chooser.
- Add a guided client sign-in at `/client`:
  1. Search and select a company.
  2. Enter employee name and NRC or Employee ID.
  3. Select province.
  4. Select outlet/site when that company has multiple sites in the chosen province.
- Use existing companies and branches, with richer demo coverage for Yalelo and Pick n Pay. Single-site clients skip the unnecessary outlet step.
- Store the demo client session separately from the admin session so the two experiences cannot conflict.

## Client dashboard and navigation
- Add a dedicated client layout with a compact branded header and mobile bottom navigation: **Home, Tickets, Schedule, Profile**.
- Make the desktop presentation equally polished with a restrained navigation rail/header while retaining the mobile-first density.
- Show the signed-in employee, company, province, outlet/site, employee reference, and department.
- Home dashboard highlights the three primary tasks:
  - Raise and track breakdown tickets.
  - View upcoming Spruceland service dates.
  - View upcoming Zambia Metrology Agency verification dates.
- Include realistic status summaries, assigned technician details, service contacts, and recent activity using dummy data.

## Breakdown ticket experience
- Add ticket list and ticket detail views with seeded examples across Open, Assigned, In Progress, Awaiting Client Sign-off, and Closed states.
- Add a mobile-friendly **Raise ticket** flow with pre-filled company/site details and equipment selection that fills scale make, model, serial number, and type.
- Include department choices tailored to the selected client, including Pick n Pay’s Butchery, Bakery, Deli, Produce, Receiving, and Production departments.
- Include common fault categories such as calibration, display/indicator, load-cell, printer/label, power/wiring, communication, physical damage, and other.
- Support description, priority/operational impact, and presentation-only photo/video attachment previews.
- Newly raised tickets appear immediately in the client’s local ticket list and history.

## Resolution, sign-off, and digital job card
- Model the full visible lifecycle as a demo: client report → technician assignment → work completed → client sign-off → closed.
- Add a small **Client tickets** area to the existing admin app for Owner, Administrator, Head of Tech, and Technician profiles.
- Let a technician open a ticket, document diagnosis, work completed, parts used, readings/tests, and mark it **Awaiting client sign-off**.
- On the client side, show the technician’s completion report and require:
  - Consent checkbox.
  - Typed employee name.
  - Matching NRC or Employee ID.
  - Explicit confirmation that the work is complete.
- Closing a ticket adds timestamped activity to both presentation views.
- Add a professional digital job card/service voucher view with a **Print / Save as PDF** action containing client, asset, fault, technician work, sign-off, and audit details.

## Demo data and behavior
- Add typed mock data for client employees, departments, installed equipment, service/verification schedules, tickets, attachments, and ticket activity.
- Use local browser persistence only for the demo client session and ticket changes, so raised/resolved/signed-off examples survive page refreshes on the same device.
- Clearly label presentation-only uploads and identity checks without adding visible technical explanations.
- Reuse the existing Spruceland blue/white theme, logo, cards, forms, status colors, and responsive conventions.

## Safety and compatibility
- Preserve all existing admin CRUD, dashboards, search, notifications, activity log, themes, and routes.
- Keep Vercel-safe bundled/public assets and browser-only demo storage.
- Add unique title, description, Open Graph, and Twitter metadata to every new page.
- Verify the chooser, both sign-in paths, ticket creation, technician resolution, client sign-off, PDF/print view, logout redirects, and mobile bottom navigation at desktop and mobile sizes.
