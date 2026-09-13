# TRAN$ACT simple payments

Every TRAN$ACT app exposes Payments / Mark Paid for the current Passport. Saved
Bills and Expenses put Total, Paid, Balance Due and the payment action near the
top. Freight and Work Orders expose their linked charges. Desktop provides the
same action in transaction rows and through its Payments button.

The common form defaults to the remaining balance, supports partial payments,
asks for actual payment date and method, and keeps reference/notes optional.
English and Spanish use the same component in card and worksheet presentations.
An authorized user can approve and record a Bill payment in the same visible
flow; approval is still a separate authenticated command and its failure blocks
payment. Existing holds, disputes and accounting-period controls remain enforced.

Payment history supports edit and explicit confirmed void. Amount, date, method
and reference are read from canonical payments. Voiding a payment restores the
balance without reviving old embedded paid flags. Later credits preserve cash
already paid and show credit/overpayment separately.

New Expenses can be saved Unpaid. Company cash/card purchases already recorded
as paid display Paid and permit payment-detail corrections without another cash
write. My Money remains an employee reimbursement payable. Unknown legacy payment
dates are shown as not recorded, never inferred from record creation dates.

Unpaid Expense creation credits A/P; its payment debits A/P. Payment records never
increase Work Order cost. Paid Expenses must not be recreated as Bills.

Validation includes shared model/command tests, exact cents and historical dates,
same-ID revisions, voids, credits, GL/A/P reconciliation, permission/hold failures,
and an isolated React form exercised against the actual Payment factory. The UI
exercise covers approval, partial/full payment, failed refresh after successful
save, safe retry, edit, void cancellation/confirmation and Spanish. No real
transaction is used for synthetic payment tests.

The required paired stabilization gate, production build and deployed browser
checks remain release gates. Deployment evidence will be added after verification.
