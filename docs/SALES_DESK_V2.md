# Sales Desk V2 release

The existing machine board now opens a selected deal's available machines and keeps its customer, assignee, next action and due date in view. Missing or sold machine references remain in deal history. Unsaved machine changes block switching to another deal. The active deal ID and board restore separately for each company and signed-in user; CRM details are read again from the server.

Customers have company/contact details, interests, budget, buying timeframe, related deals, follow-ups, notes and change history. Follow-ups link to their customer and deal, record outcomes, and can schedule the next action. Today/overdue filters use real due dates and completion state.

TEAM lets the company owner manage manager, sales and viewer seats, record scope, and seven-day invitations to an existing AOS person. Financial actions and machine editing remain owner-authorized. A delegated seat uses a sanitized read-only catalog. No trial seats or invitations are activated by the release.

IMPORT reviews a CSV of up to 500 contacts, lets the user map columns, flags duplicates/errors, and saves selected rows with per-row outcomes and retry-safe batch identifiers. It does not overwrite existing matches.

TRANSACTIONS reads actual financial records and current revisions, follows a deal's quote/order/invoice lineage, and offers machine-plus-customer matches for explicit linking. SOLD date, price, buyer, salesperson and settlement facts come from the existing inventory projection. CRM stage changes never create financial or inventory facts.

BUYER PACKAGE saves reviewed machine snapshots and creates a PDF with selected photos/specifications, optional asking prices/serials, and a buyer message. Saved packages reopen from connected work. The PDF reports unavailable photos; the user reviews and shares it. Internal costs, margins and notes are excluded.

## Verification and release order

The paired gate runs 560 frontend and 386 backend checks against the immutable backend pin, followed by the production frontend build. Backend deployment is staged before activating the new UI through the complete-release workflow. Verify backup/restore, installed manifest, canonical data and runtime health, then inspect the authenticated owner desk, AOS and TRAN$ACT in the browser.

Tests validate delegated access, revocation, command replay after reassignment, contact import recovery, canonical identity preservation, historical financial dates/prices, and package field filtering/PDF generation in isolated storage. Browser checks must not create dummy production contacts, invoices or memberships.

Specific concurrent-user capacity and latency targets require a separate measured load test; this release makes no seat-count or zero-defect guarantee.
