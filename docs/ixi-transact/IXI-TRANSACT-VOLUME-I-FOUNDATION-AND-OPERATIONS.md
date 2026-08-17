# IXI TRAN$ACT — VOLUME I
## Foundation, Runtime, V13 Doctrine, Work and Spend Operations

**Status:** Canonical engineering doctrine  
**Repository:** `tarpbarry-stack/ironxchange-homepage`  
**Read after:** `docs/IXI-TRANSACT-READ-FIRST.md`

---

# 1. PURPOSE

IXI TRAN$ACT is not a collection of disconnected forms. It is the financial and operational transaction layer inside AOS.

The governing stack is:

```text
AOS OBJECT / PASSPORT / ENTITY / LOCATION / PERSON
                    ↓
             IXI TRAN$ACT
                    ↓
       operational/commercial records
                    ↓
       AOS Financial Runtime Adapter
                    ↓
         IXI Financial Command Client
                    ↓
        AWS IX-Core / IXI Financial
                    ↓
              DynamoDB truth
                    ↓
           refreshed AOF2 snapshot
                    ↓
      GL / Reporting / full-size dashboard
```

Doctrine:

- AOS / Passport supplies business context and relationships.
- TRAN$ACT records operational and commercial truth.
- AWS IXI Financial owns canonical financial truth.
- General Ledger translates financial truth into accounting truth.
- Financial Reporting reads posted accounting truth.
- The full-size IXI TRAN$ACT page is an office command center over those same records and engines.

Never create a second frontend ledger.

---

# 2. PRIMARY RUNTIME FILES

```text
components/ixi-aos/transact/
  IXITransactApp.jsx
  IXITransactContext.js
  IXITransactModuleRegistry.js
  IXITransactStyles.jsx
```

Financial runtime:

```text
components/ixi-aos/financial-runtime/
  IXIAosFinancialRuntimeAdapter.js
  IXIAosFinancialCommandClient.js
```

The Runtime Adapter is the compatibility seam. Individual modules provide business intent and financial input. The adapter resolves Passport identity, object references, snapshot target and canonical IXI Financial command plumbing.

Do not reproduce Passport/reference normalization inside each module.

---

# 3. V13 UI DOCTRINE

Native V13 card geometry is **298 × 471**.

Core visual language:

- black / charcoal chassis
- white information typography
- TRAN$ACT yellow for primary actions, authority and system identity
- green for completed / valid / positive states
- red for destructive actions, rejection and critical exceptions
- cyan / purple / other established operational accents where appropriate
- compact information density
- scrolling inside persistent cards when necessary
- same DOM for ENG and `es-MX`; localization is presentation, not a duplicate component

A V13 card is a mini application. Do not cripple a module simply to make a file shorter.

Persistent record doctrine:

> Create a record once, then let the same record change state and expose the next authorized action.

Do not create unnecessary new workflow pages for every state transition.

---

# 4. COMMAND BUS / ACTION NOTICE SYSTEM

Use the existing IXI action/notice machinery where financial commands execute.

Typical lifecycle:

```text
user action
→ saving notice inside object/card
→ command executes
→ success notice + state update
or
→ failure notice + preserved record state
```

The reusable command/notice infrastructure is part of the product experience and should remain consistent across future modules.

---

# 5. WORK ORDER DOCTRINE

Directory:

`components/ixi-aos/transact/modules/work-order/`

The Work Order records **operational truth**.

A machine can be down, a leak can exist, or work can be required before anyone approves spending. Therefore a Work Order must be creatable immediately.

```text
PROBLEM / WORK EXISTS
        ↓
      WO-####
        ↓
TIME / MATERIAL / SERVICE / EXPENSE / PURCHASE / DOCUMENTS / NOTES / PHOTOS
```

Important rule:

> Work Order existence is not a spending approval event.

The Work Order can create or relate later purchases that require approval, but the problem/work record itself must not be blocked.

Current Work Order package includes app, commands, contract, selectors and V13 styles.

---

# 6. TECH WORK ORDER

Directory:

`components/ixi-aos/transact/modules/tech-work-order/`

Technology Work Order is a standalone operational system using `TECHWO-######` identity.

It deliberately mirrors the proven Work Order model because technology work is frequent and important enough to require a first-class system.

Tech Work must preserve evidence capture:

- screenshots
- warning/error photos
- code screens
- device/application evidence
- notes/documents
- time/material/service/expense/purchase relationships

Do not reduce Tech Work to a generic text task.

---

# 7. EXPENSE

Directory:

`components/ixi-aos/transact/modules/expense/`

Doctrine:

> Expense means money has already been spent/incurred in the expense path.

Expense is different from Bill.

An Expense must retain origin relationships so it can be attributed to the machine, location, employee, Work Order, Tech Work Order, entity or other AOS object that caused it.

The same economic fact should be related to multiple objects when needed, not copied into multiple fake expense records.

---

# 8. PURCHASE ORDER

Directory:

`components/ixi-aos/transact/modules/purchase-order/`

The standalone Purchase Order is not the Work Order `+ PURCHASE` action.

Canonical lifecycle:

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

Three-face V13 architecture:

1. **ORDER / APPROVAL** — requester, need, reason, vendor, items, authorization and current state.
2. **RECEIVE / COST** — ordered / received / remaining, shortages, substitutions, damage, packing slips and Estimated → Committed → Billed → Variance.
3. **HISTORY / RELATED** — immutable activity and related people/objects/documents.

Purchasing authority lives above the record:

```text
Company Purchasing Policy
        ↓
Person / Role Authority
        ↓
Purchase runtime evaluates current user + state + amount
```

Creating a request is not the approval event.

---

# 9. BILL / INVOICE — A/P INTAKE

Directory:

`components/ixi-aos/transact/modules/bill/`

Doctrine:

> Expense = we spent/incurred money.  
> Bill = somebody says we owe them money.

Bill is A/P intake + validation + approval/payment control.

Separate states must remain separate:

```text
BILL STATUS
DRAFT / OPEN / APPROVED / VOID

MATCH STATUS
N/A / UNMATCHED / MATCHED / EXCEPTION

PAYMENT STATUS
UNPAID / SCHEDULED / PARTIAL / PAID / OVERDUE
```

Three-way match:

```text
PO          = what was authorized
Receiving   = what was actually received
Bill        = what vendor charged
```

A mismatch creates an exception. It does not silently rewrite the PO or Bill.

---

# 10. RECEIPT

Receipt is a standalone evidence/transaction module.

Do not confuse three different things:

- vendor receipt / proof of purchase
- receiving goods against a PO
- customer cash receipt/payment

The TRAN$ACT Receipt module is for receipt evidence/transaction capture in the appropriate AOS context; downstream financial meaning must remain explicit.

---

# 11. TIME

Directory:

`components/ixi-aos/transact/modules/time/`

Time can be launched from a machine, Work Order, Tech WO, location, container or other supported AOS object.

The origin becomes part of the record relationship.

Standalone Time exists because labor cost/effort may need attribution even when no Work Order is open.

---

# 12. PART / MATERIAL

Directory:

`components/ixi-aos/transact/modules/material/`

Material usage means actual consumption/usage.

Do not confuse procurement with consumption:

```text
BUY PART
Expense / PO / Bill / inventory event
        ↓ later
USE PART
Material Usage against asset/job/work
```

Those are distinct facts and may occur on different dates.

---

# 13. DOCUMENT / PHOTO / NOTE RELATIONSHIP DOCTRINE

Documents, photos and notes should attach to the canonical record that owns them and be discoverable through relationships.

Example:

```text
Invoice PDF
  owns → BILL-19482
  related → Midland Yard
  related → Vendor
  related → PO-2048
```

Do not upload duplicate copies merely to make the same document appear in multiple object views.

---

# 14. FOUNDATION INVARIANTS

Never:

- turn Work Order into Purchase Order
- make field employees select GL accounts
- treat `approved` as `paid`
- treat `scheduled` as `paid`
- erase activity/history on correction
- bypass AOS/Passport relationships
- build one-off financial command plumbing in each card
- fork ENG and Spanish business logic
- replace a proven domain module with a generic placeholder to save code

Continue with **Volume II — Asset, Ownership, Rental and External Service Lifecycle**.
