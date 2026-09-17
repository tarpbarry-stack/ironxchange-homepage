# Trade save and invoice handoff

The trade editor previously kept an unfinished machine in component-local state.
Saving its parent order did not save that machine, and changing between the card
and expanded worksheet unmounted the editor and discarded the entered fields.
The success notice also preceded attaching the allowance to the financial order.

The order now retains the pending trade and delegates Save Order to the complete
trade operation. Required fields are checked before creating an order. A successful
operation verifies the machine identity, persists the itemized allowance, updates
the linked draft invoice, and only then announces completion and refreshes the
surrounding record. An intermediate prepare-order save cannot remount the editor.
Stage and invoice-tab navigation completes the pending trade first. An interrupted
attachment keeps the existing machine and stable trade ID available for retry.

Sales-order workflow responses return an invoice document without its canonical
revision envelope. The frontend now loads and verifies that envelope before a
subsequent invoice write, rather than submitting an expected revision of zero.

Quote and Invoice provide explicit links to the same order's trades, acquisition
forms and Launch/photo links. Empty and locked trade sections explain their state.
The existing acquisition verification still controls owned-inventory admission.

Verification includes an actual React/DOM editor test: enter a trade, expand the
worksheet, save, and verify the card identity and net invoice amount. That test
fails against the previous released editor because the entered fields disappear.
It also verifies that incomplete trade fields cannot silently save a bare order,
and that Invoice navigation opens the linked order. Workflow tests cover failed
attachment recovery, duplicate prevention and invoice revision verification.

This source change does not reconstruct previously unsaved machine facts, change
an issued invoice, record an acquisition or close a sale. A historical invoice
missing a trade still requires the actual machine identity and the applicable
recorded financial correction; no invented payment or automatic ownership is used.
