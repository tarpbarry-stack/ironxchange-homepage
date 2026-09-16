# IXI Sales Desk — first operational release

Entry: `/sales-desk`, linked from HOME. Uses the Dashboard's existing machine runtime, board, seller operations, relationship state and inventory lifecycle, with a compact TRAN$ACT-style workspace.

## Included

- Owned and relationship machines; filtered opening, gray ON BOARD placeholders, focus, return, reorder, full existing cards and consoles.
- Browser-restored working layout plus named boards saved on IX-Core.
- Company-private canonical contacts, searchable interests, deal records, next actions, follow-ups, immutable notes, revision history and machine comparison.
- Existing TRAN$ACT quote application with saved customer/Passport and deal/machine context; financial permission checks remain on existing endpoints.
- Owner access enforced on every request through verified browser session, signed server request, active membership and owner-company match. Direct access denials win.

## Persistence and invariants

Sales records use indexed tables in the existing MOS SQLite database. Existing full database recovery includes the tables. Every sales mutation has a stable command ID, expected revision, server actor and audit snapshot. Contact Save is an explicit creation boundary and uses existing canonical provisioning; linking an existing person reuses its Object and Passport. Board movement never creates canonical identity or inventory edges.

Sales Desk cannot set SOLD, record receipt of funds, close periods or settle assets. Sales stage `handoff` means the deal is being worked in TRAN$ACT. No financial status is inferred from that stage.

## Deliberately later releases

Delegated sales seats require verified integration with company membership and machine/financial authority before activation. Marketplace inquiry capture currently opens the existing inquiries environment. Automated messaging, holds, buyer-facing sharing, match alerts, contact import/export and pipeline reporting remain separate future work. No pretend controls for these appear here.

## Release evidence

Required paired AOS/TRAN$ACT gate, production build, isolated authorization and save/replay/conflict tests, and SQLite backup/restore test. Live review must check the deployed commit, machine rail/board behavior, forms and quote worksheet layout. Never create fictitious customer or financial records in the user's production books for testing.
