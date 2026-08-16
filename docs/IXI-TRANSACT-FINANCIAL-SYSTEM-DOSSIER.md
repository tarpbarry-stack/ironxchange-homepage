# IXI TRAN$ACT — FINANCIAL SYSTEM DOSSIER

**Status:** Canonical engineering handoff  
**Repository:** `tarpbarry-stack/ironxchange-homepage`  
**Primary frontend root:** `components/ixi-aos/transact/`  
**Financial runtime root:** `components/ixi-aos/financial-runtime/`  
**UI doctrine:** IXI TRAN$ACT V13  
**Native card geometry:** **298 × 471**  
**Backend authority:** AWS IX-Core / IXI Financial  
**Purpose:** This file is the authoritative orientation and build guide for future engineers/chats working on the IXI TRAN$ACT financial operating system.

---

# 0. READ THIS FIRST

IXI TRAN$ACT is **not a collection of unrelated forms** and it is not a traditional accounting package pushed onto field users.

The governing architecture is:

> **AOS / Passport supplies business context and relationships.**  
> **TRAN$ACT records operational and commercial truth.**  
> **IXI Financial on AWS owns canonical financial truth.**  
> **General Ledger translates financial truth into accounting truth.**  
> **Financial Reporting reads posted accounting truth.**

The system is intentionally layered so that a technician, salesperson, yard employee, buyer, accountant, controller and owner can all operate against the same business without being forced into the same interface or responsibilities.

Do not collapse these layers.

Do not solve backend/data problems by inventing frontend-only accounting state.

Do not make a field employee choose debits and credits.

Do not make a salesperson calculate partner settlement.

Do not make Collections edit A/R balances.

Do not make Payables edit A/P balances.

Do not make Treasury overwrite bank balances.

Do not make Reporting mutate the ledger.

---

# 1. THE CANONICAL STACK

```text
AOS OBJECT / PASSPORT / ENTITY / LOCATION / PERSON
                    │
                    ▼
             IXI TRAN$ACT V13
                    │
       operational/commercial records
                    │
                    ▼
       AOS Financial Runtime Adapter
                    │
       Passport/reference normalization
                    │
                    ▼
         IXI Financial Command Client
                    │
                    ▼
        AWS IX-Core / IXI Financial
                    │
              DynamoDB truth
                    │
                    ▼
           refreshed AOF2 snapshot
                    │
        ┌───────────┴───────────┐
        ▼                       ▼
 operational projections   General Ledger
                                │
                                ▼
                        Financial Reporting
```

The current shared adapter is:

`components/ixi-aos/financial-runtime/IXIAosFinancialRuntimeAdapter.js`

Its documented flow is already explicit:

```text
AOS Object / AOF2
      ↓
Runtime Adapter
      ↓
resolve Object Passport
      ↓
build Financial references
      ↓
build snapshot target
      ↓
Financial Command Client
      ↓
IX-Core
      ↓
DynamoDB
      ↓
refreshed AOF2 snapshot
```

The adapter is the compatibility seam. Individual V13 modules should provide financial input and business intent; they should not each reinvent Passport/reference plumbing.

---

# 2. TRAN$ACT RUNTIME

Primary files:

```text
components/ixi-aos/transact/
  IXITransactApp.jsx
  IXITransactContext.js
  IXITransactModuleRegistry.js
  IXITransactStyles.jsx
```

`IXITransactModuleRegistry.js` defines the top-level module catalog and ordering.

`IXITransactApp.jsx` resolves AOS context, opens the selected standalone module, preserves important runtime snapshots, and forwards completed records/actions through the parent integration seam.

A module is not considered properly integrated merely because a Face Lab route exists. It must also be deliberately registered and routed through TRAN$ACT when it belongs in the production launcher.

---

# 3. V13 UI DOCTRINE

V13 is the TRAN$ACT operational UI language.

Core rules:

- Native card surface remains **298 × 471**.
- Black/charcoal chassis.
- Yellow is the primary TRAN$ACT action/authority/accent language.
- Green indicates valid/completed/positive states.
- Red indicates rejection, failure, destructive actions, exceptions or critical imbalance.
- Cyan/purple/other accents may distinguish operational action families where already established.
- Cards are scrollable when the record is larger than the viewport.
- Persistent records change state; do not create unnecessary workflow pages just because the state changed.
- Same production DOM for English and Mexican Spanish where localization is implemented. Translation is presentation, not a forked business component.
- The card is a mini application. File length is not a reason to cut business capability or create a brittle abstraction.
- Do not degrade important records into generic placeholder forms for the sake of reuse.

Face Lab inspection routes live under `pages/facelab/` and are used to prove module UI/logic without polluting production flows.

---

# 4. COMMAND BUS / NOTICE SYSTEM

TRAN$ACT modules should use the existing reusable command/notice infrastructure where applicable rather than inventing local save spinners and disconnected alerts.

The system uses `IXIActionNoticeEngine` / `runIXIActionNoticeLifecycle` in financial command modules to surface saving/success/error state inside the object experience.

This is a product feature, not decoration. Future modules should preserve it.

---

# 5. CORE BUSINESS DOCTRINES

## 5.1 Work Order vs Purchase

A Work Order records **operational truth**. A problem can exist immediately and must be recordable immediately.

A Purchase is **spending authorization / procurement truth**.

Therefore:

```text
PROBLEM EXISTS
   ↓
WORK ORDER EXISTS IMMEDIATELY
   ↓
Time / Material / Service / Expense / Purchase / Documents / Photos / Notes
```

A purchase requested from inside the Work Order can still require authorization. The existence of the Work Order must not be blocked by purchasing approval.

Do not pollute Work Order by turning its `+ PURCHASE` action into the standalone Purchase Order application.

## 5.2 Quote vs Customer Service WO vs Service Invoice

```text
SERVICE QUOTE
commercial authorization
        ↓ accepted
CUSTOMER SERVICE WORK ORDER
operational execution + actual cost
        ↓ complete
SERVICE INVOICE
customer A/R / what we charge
        ↓
COLLECTION / PAYMENT
actual cash received
```

These are linked canonical records, not one record changing names.

## 5.3 Financial control truth

- Invoice/Sale creates receivable.
- Bill creates payable.
- Payment changes cash and clears the related receivable/payable when properly linked.
- Promise to pay does **not** reduce A/R.
- Dispute does **not** reduce A/R or A/P.
- Approval does **not** mean paid.
- Scheduled payment does **not** mean paid.
- Credit/write-off changes a balance only through a canonical Financial event.
- Treasury reconciliation does not overwrite book cash.
- GL journals do not replace source records.
- Reporting is read-only.

---

# 6. WORK ORDER SYSTEM

Directory:

`components/ixi-aos/transact/modules/work-order/`

Current package includes:

```text
IXIWorkOrderApp.jsx
IXIWorkOrderCommands.js
IXIWorkOrderContract.js
IXIWorkOrderSelectors.js
IXIWorkOrderStyles.jsx
```

The Work Order is the canonical operational work system. It supports work status/timer and subordinate operational additions such as Time, Material, Service, Expense, Purchase, Documents, Notes and Photos.

It is intentionally usable for immediate problem/work creation.

The customer-service architecture reuses this proven operational machinery rather than creating a second inferior work engine.

---

# 7. TECH WORK ORDER

Directory:

`components/ixi-aos/transact/modules/tech-work-order/`

Current package includes:

```text
IXITechWorkOrderApp.jsx
IXITechWorkOrderContract.js
IXITechWorkOrderEngine.js
IXITechWorkOrderEvidenceSections.jsx
IXITechWorkOrderStyles.jsx
```

Tech Work Order mirrors the operational discipline of Work Order but is a standalone technology-work system (`TECHWO-######`). It is used for technology incidents/work and must preserve evidence capture such as photos/screens/warning-code images rather than reducing the experience to text-only work logging.

---

# 8. EXPENSE

Directory:

`components/ixi-aos/transact/modules/expense/`

Expense means money has already been spent/incurred in the expense flow. It is conceptually different from a Bill, which says somebody claims the company owes money.

Expense records must retain AOS relationships so the same economic fact can be attributed to machine, location, Work Order, entity, employee, etc. without duplicating the transaction.

---

# 9. PURCHASE ORDER

Directory:

`components/ixi-aos/transact/modules/purchase-order/`

Purchase Order is a standalone TRAN$ACT procurement system. It is not the Work Order `+ PURCHASE` mini-flow.

Canonical lifecycle doctrine:

```text
REQUEST
→ PENDING APPROVAL
→ APPROVED / RETURNED / DENIED
→ PO ISSUED
→ SENT
→ PARTIAL RECEIPT / RECEIVED
→ BILL MATCH
→ CLOSED
```

The architecture is a single Purchase record with three V13 faces:

1. **ORDER / APPROVAL** — need, requester, vendor, items, estimated/committed value, approval state and state-aware actions.
2. **RECEIVE / COST** — ordered/received/remaining, shortages, substitutions, damage, packing slips and Estimated → Committed → Billed → Variance.
3. **HISTORY / RELATED** — immutable timeline and relationships.

Purchasing authority belongs above the individual card:

```text
TRAN$ACT Purchasing Policy
          ↓
Person / Role Authority
          ↓
Purchase Record runtime
```

The card shows only actions the current person is authorized to perform in the current state.

---

# 10. BILL / INVOICE (A/P INTAKE)

Directory:

`components/ixi-aos/transact/modules/bill/`

Bill doctrine:

> **Expense = we spent/incurred money.**  
> **Bill = somebody says we owe them money.**

Bill is Accounts Payable intake + validation + approval/payment control.

A Bill remains one persistent V13 record after creation. State changes determine which actions are available.

Separate states are important:

```text
BILL STATUS
DRAFT / OPEN / APPROVED / VOID

MATCH STATUS
N/A / UNMATCHED / MATCHED / EXCEPTION

PAYMENT STATUS
UNPAID / SCHEDULED / PARTIAL / PAID / OVERDUE
```

PO-connected Bills support three-way-match concepts:

```text
PO          = what was authorized
Receiving   = what arrived
Bill        = what vendor charged
```

A mismatch becomes a review/approval condition; it is not silently normalized.

---

# 11. RECEIPT

Receipt is a standalone TRAN$ACT evidence/financial-document function. It exists because a receipt may need to be captured and related to the originating object even when the surrounding transaction is not being created through another module at that moment.

Keep Receipt distinct from Bill and from customer cash receipts. Context determines what kind of receipt/document is being represented.

---

# 12. TIME

Directory:

`components/ixi-aos/transact/modules/time/`

Standalone Time is context-aware. When launched from a machine, Work Order, location, container or other supported AOS object, that origin must be retained as the financial/operational relationship.

Time exists so labor can be attributed and costed without requiring a Work Order in every situation.

---

# 13. PART / MATERIAL

Directory:

`components/ixi-aos/transact/modules/material/`

Material usage records actual consumption/usage against the originating object/context.

Important distinction: inventory procurement and material consumption are different facts. A part can be purchased through Expense/PO/Bill and later consumed against an asset/job/work record.

---

# 14. ASSET ACQUISITION

Directory:

`components/ixi-aos/transact/modules/asset-acquisition/`

Asset Acquisition is the canonical opening economic chapter of an owned asset.

It captures the important purchase/ownership facts, including purchase price and acquisition-related economics, payment/wire/invoice evidence, ownership partners and ownership percentages/dollar interests.

Ownership must support more than one partner.

Acquisition-period costs can include items required to put the asset into its acquired/ready state: freight, buyer fees, initial repairs, initial parts, technology and other qualifying initial costs.

## In-service cutover

Do not use a brittle theoretical cutoff workflow.

The product doctrine is:

- User records an **IN SERVICE date**.
- User explicitly confirms/puts the asset in service.
- Costs dated before that cutover remain available to the acquisition/make-ready view according to policy.
- Later costs route into ongoing asset economics rather than continuing to inflate the acquisition snapshot.

The lifetime machine economics shown elsewhere can still include later repairs, rental income and other post-acquisition activity. Acquisition is not the same thing as lifetime asset economics.

## Ownership changes

Later partner buyouts/contributions/ownership changes must be represented as events, not destructive edits that erase history. Settlement depends on that history.

---

# 15. RENTAL EXPENSE

Directory:

`components/ixi-aos/transact/modules/rental-expense/`

Rental Expense records the cost of renting equipment/assets/services from others. It should retain rental period, vendor, rate/terms, related object/job/location and financial relationships.

It is outgoing economics.

---

# 16. RENTAL INCOME

Directory:

`components/ixi-aos/transact/modules/rental-income/`

Rental Income is the mirror revenue-side system for company-owned assets rented to others.

It is incoming economics and should be capable of feeding receivable/cash/reporting flows rather than being treated as a decorative note on the machine.

---

# 17. SERVICE QUOTE

Directory:

`components/ixi-aos/transact/modules/service-quote/`

Current package includes:

```text
IXIServiceQuoteApp.jsx
IXIServiceQuoteCommands.js
IXIServiceQuoteContract.js
IXIServiceQuoteRecordEngine.js
IXIServiceQuoteStyles.jsx
```

Service Quote is commercial authorization for external customer work.

It supports pricing doctrines such as:

- Estimate
- Fixed Price
- Not To Exceed

It can contain base scope plus optional/alternate scope and commercial line detail.

Accepted quote data is not thrown away. The accepted revision/option set becomes the commercial authorization snapshot for the downstream Customer Service Work Order.

---

# 18. CUSTOMER SERVICE WORK ORDER

Directory:

`components/ixi-aos/transact/modules/customer-service-work-order/`

This is an adapter/integration layer, not a second field-work application.

Accepted Service Quote:

```text
SQ-####
   ↓
Customer Service Work Order adapter
   ↓
canonical Work Order contract
   ↓
CSWO-######
```

The generated Customer Service WO carries commercial context such as:

- Customer
- Customer asset / Passport
- Service Quote ID/number
- Accepted revision
- Pricing type
- Accepted options/lines snapshot
- Customer PO
- Acceptance evidence
- Authorized revenue
- Approved change-order authorization
- Estimated internal cost

But actual execution still uses the canonical Work Order machinery.

This separation is critical:

> Quote = authorization.  
> WO = operational truth and actual cost.  
> Service Invoice = customer A/R.

---

# 19. SERVICE INVOICE (OUT)

Directory:

`components/ixi-aos/transact/modules/service-invoice/`

Service Invoice is the revenue-side closeout of Customer Service Work.

It should inherit rather than re-key:

- Customer
- Customer asset / Passport
- CSWO
- Accepted Service Quote/revision
- Customer PO
- Pricing type
- Approved authorization/change orders
- Actual WO economics

Billing doctrine:

- **FIXED PRICE:** invoice authorized fixed amount.
- **ESTIMATE:** invoice actual billable work while retaining estimate comparison.
- **NOT TO EXCEED:** do not silently invoice above authorized ceiling; require approved commercial increase.

Management comparison:

```text
QUOTED
AUTHORIZED
ACTUAL INTERNAL COST
INVOICED
RECEIVED
```

Invoice and A/R states remain separate.

---

# 20. SOLD / ASSET SALE

Directory:

`components/ixi-aos/transact/modules/sold/`

SOLD is the sales/user-facing asset disposition system.

It is deliberately separate from Settlement.

The salesperson/owner/auction manager records the commercial exit:

- Asset
- Buyer
- Disposition type
- Sale date
- Sale price
- Terms / due date
- Buyer PO / Bill of Sale
- Meter/hours where applicable
- Documents