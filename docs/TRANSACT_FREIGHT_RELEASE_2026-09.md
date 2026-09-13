# Freight and TRAN$ACT accounting inputs

Freight now has three freely accessible pages: Request, Bills / Payments, and
History. Save the information available and fill optional carrier, route, price,
scheduling and commercial details later. Existing requests stay editable after
delivery or closure. Recording historical shipment dates does not move the
machine from its current AOS yard.

Bills, credits and payments stay linked to their machine and Freight request.
The current canonical financial records determine cost and balance everywhere.
Open a Bill to approve, correct or record payment using the user's actual server
authority. Add a credit against its original Bill even after full payment. A paid
$2,500 Bill with a $500 credit shows $2,000 net cost and $500 available carrier
credit, while retaining the original $2,500 payment. A credit is not a cash refund.

Bills can be reopened for corrections. Prior revisions and actor evidence remain
available in History. Closed accounting periods still require the existing
controlled period-reopen action. Saving a carrier Bill does not manufacture a
Purchase Order or require dispatch stages. Optional evidence is attached after
saving, with verified private storage and an explicit retry if upload fails.

Select company workforce recipients for durable in-app Freight request updates.
These updates are visible in Freight. Broker distribution and email sending are
deferred; customer rebilling and cash refunds are separate explicit records.

Shared money inputs cover 101 monetary controls across acquisition, Freight,
Bills, Payables, expenses, sales, rentals, collections, services, settlements,
materials, purchases, ownership capital, Treasury and the general ledger.
Inputs accept `$2,500.07`, show commas and two decimals on blur, and preserve the
difference between blank and zero. Quantities, meter readings and percentages
retain their existing numeric behavior. Mixed percentage/amount controls format
only the currency mode.

Validation before release:
- 641 frontend tests, all passing with the pinned backend available.
- Mandatory paired AOS/TRAN$ACT gate, passing against the exact backend commit.
- 261 backend tests, all passing, including payable balance concurrency controls.
- Optimized Next.js production build, passing.
- Isolated React form checks using synthetic records: paid-credit totals,
  closed-request destination edit, history diff, pasted currency formatting,
  approved Bill correction preserving payment, and draft without carrier/price.

The backend pin is in `config/ixi-core-release.json`. Production completion also
requires the complete runtime deployment workflow's recovery, source and canonical
data checks, plus live browser checks. Test evidence does not substitute for
those deployment checks.

Production evidence, 2026-09-13:
- Frontend PR #304 and backend PR #57 merged. Backend eea656050444997dc9b1c0ab1a9179dab6114687
  completed the full production workflow 34770091133; both the paired gate and
  deployment jobs succeeded. SSM command e29c12da-e71b-4800-8971-f811d357866b succeeded.
- The complete release enforces private recovery with restore verification,
  installed manifest verification, unchanged canonical identity and relationships,
  runtime health and the recurring recovery service before successful completion.
- S3 independently confirms the new recovery object at 17:03:09 UTC, immutable
  version 4VTsimni2UXAlJpLKUUZC1iK81oFZini, AES256 encryption, and SHA-256
  5c6a63db3c618f1fecc1489f03e7e1d1c6bfacd9f55efe033c8632d87d937347.
- Live browser checks found Equipment, Workforce and Locations containers,
  existing 544K inbound/outbound Freight requests, the linked $1,600 inbound Bill,
  available correction controls, and request/financial history. All business edits
  were cancelled; no real payment, approval, credit or settlement was posted.
- Live verification identified a focus/selection problem in the shared currency
  input. The follow-up retains displayed text while focused and formats on blur.
  Isolated form checks now explicitly preserve select-all on focus before replacing
  an amount, alongside the existing correction and paid-credit scenarios.
