# Domain model and operational workflow

## Entities
| Entity | Current contract | Production additions |
| --- | --- | --- |
| Client/company | ID, name, industry, sites | Contract status, tenant ID, authorized contacts |
| Site | Name, city, province | Stable site ID, company membership, address/GPS |
| Employee session | Name, employee reference, company/site, department | Verified user ID, approved memberships, revocation |
| Asset | Make/model, serial, type, capacity, department, service/ZMA dates | Immutable ID, installation history, certificates, retirement |
| Ticket | Site/asset snapshot, fault, priority, description, reporter | Server ID, revision, SLA, assignment authorization |
| Attachment | Name, kind, size, optional preview | Object key, signed URL, uploader, scan status |
| Resolution | Technician, arrival, diagnosis, work, parts, readings, completion time | Verified technician user, labour, stock movements, evidence |
| Sign-off | Name, employee reference, consent, timestamp | Verified signer, consent version, server time, immutable evidence |
| Activity | Actor, side, timestamp, text | Stable event ID, actor user ID, action, before/after revision |

## Two-party repair completion
```text
Open → Assigned → In Progress → Awaiting Sign-off → Closed
                                 ↑       |
                                 └───────┘ client rejects repair
```
Only the client approval operation closes a ticket. The technician repair report moves it to Awaiting Sign-off, never directly to Closed. Assigned tickets can return to Open in the domain transition map, but no unassign control is currently exposed.

Assignment must reference a real sample technician and a valid visit date. Starting work records the arrival timestamp. Resolution requires the assigned technician, diagnosis and work completed. Approval requires a resolution, both consent/complete confirmations, typed employee name and matching NRC/employee reference. Reference comparison ignores spaces, slashes, hyphens and case. Rejection requires an explanation and returns the ticket to In Progress; the previous report remains visible until the technician submits a new report.

The current matching check is presentation validation, **not identity verification or a legally certified signature**. Production must check the signer is authorized for that company/site, use server timestamps and preserve each report revision rather than overwriting it.

## Preventive service versus statutory verification
Spruceland servicing and Zambia Metrology Agency verification are independent schedules. A repaired or calibrated asset is not automatically statutorily verified. Service intervals and ZMA sample dates are placeholders pending confirmed asset-specific policies, certificate evidence and applicable legal requirements. Never move ZMA due dates simply because a repair closes.

## Audit and financial boundaries
Ticket history records reporting, assignment, work start, resolution, rejection and sign-off. The internal Activity page combines those events with the existing CRUD feed and supports CSV export. Local history is editable browser data, not a tamper-proof audit log.

Existing revenue, MRR, ARR, profit and mileage calculations are modeled demonstration values. Backend accounting integration needs confirmed definitions for recognized versus collected revenue, recurring contract revenue, tax, depreciation, expense categories and mileage reimbursement per office.