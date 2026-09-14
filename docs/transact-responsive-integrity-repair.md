# TRAN$ACT responsive and accounting presentation repair

This candidate separates the working area from secondary navigation and makes accounting loading and reconciliation evidence explicit. It does not alter financial documents, posting rules, journal amounts, period-close records, Object/Passport identity, relationships, or payment commands.

## Behavior

- At 1600px and above, navigation, worksheets and context/apps remain docked.
- From 1200px to 1599px, apps/details move into a dismissible native dialog.
- Below 1200px, navigation/machines also move into a dialog, leaving the working area available. Controls and scope choices wrap at smaller widths.
- Native dialogs support browser focus management and Escape. They close when a selection changes, the view is left, or the panel becomes docked.
- Search supports arrow keys, Enter and Escape; the selected result scrolls into view.
- App tiles use the existing mouse, touch and keyboard sortable launcher. Only module ordering is stored, scoped to the actor, entity and object kind on the current device. Storage failure preserves session use and displays a notice.
- Machine history has one main heading and compact lifetime metrics. Detailed calculation notes are expandable; warnings, payment states, drilldown and exports remain available. Calculations are unchanged.
- The ledger only displays balances and OPEN/CLOSED after the response explicitly matches the selected period and currency. Missing or failed data cannot appear as an open period or retain balances from another period. Existing unfinished journal text survives refresh failures while posting is disabled.
- Server-returned reconciliation counts, differences and exceptions are visible. Current-period source coverage and cumulative balances are labeled separately. Journal details retain source and posting evidence.

## Verification

Run against the exact backend commit in `config/ixi-core-release.json`:

```sh
IXI_CORE_CONTRACT_ROOT=/path/to/pinned/ixi-core node scripts/verify-aos-stabilization.mjs
npm run build
```

Added regressions exercise the actual ledger component during pending, failed and out-of-order responses; preservation of unfinished journal text; modal open/close and docking; preference persistence and user/entity isolation; and storage failure.

## Release follow-up

The browser could not reach the local candidate. Authenticated preview verification remains required at desktop, laptop and tablet sizes, including navigation, searches, open worksheets, dialog focus, tile reordering, history exports and ledger loading. Existing production gates in `AGENTS.md` still apply.

Disputed existing closes and acquisition balances require read-only source/audit inspection before any correction. The live AWS audit connection requested reauthentication during investigation. No close was reopened and no historical journal was deleted, reversed or reposted. Acquisition posting can use configured rules; the absence of a default branch alone is not proof that an acquisition should be automatically posted. Counteraccounts and duplicate-source protection must be verified against the actual entity configuration and records.
