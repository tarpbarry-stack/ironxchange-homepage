# TRAN$ACT hookup repair — release review

Status: user approved publication and deployment. The prepared source is being published through the connected GitHub app and the existing release workflow.

Both candidates use `fix/transact-commercial-hookups` and include the current freight billing and Ticket gateway fixes from main.

- Frontend repository: `tarpbarry-stack/ironxchange-homepage`
- Backend repository: `tarpbarry-stack/ixi-core`
- Pinned backend: `127fbd410a9669b51313d7e7e07e4f6f5e52c553`
- Frontend implementation commit: `2e5c3174` (this review is a subsequent documentation commit)

| Confirmed gap | Candidate repair |
| --- | --- |
| Operational inflow displayed as Revenue / Net Income | Overview and reports use posted general-ledger results. Missing accounting reads remain visibly unavailable. |
| Embedded Ledger / Reporting locked for authorized operators | Worksheets consume IX-Core's returned capabilities, retaining explicit denies. |
| Empty accounting lists and reports from incompatible response fields | Company dashboard exposes the canonical accounting projection, records, journals and four reports. |
| TODAY includes completed transactions, mixes activity with attention, and hides items after 20 | Completed and fully settled records leave the attention queue; history remains available. Queue pages expose all returned items. |
| Source buttons lead to a generic destination | Saved transaction IDs open the corresponding record; accounting controls open GL. |
| Search ignores documents, vendors and amounts | Search includes authorized saved transactions, document numbers, parties and exact monetary amounts. |
| + NEW opens the generic ledger | A context-specific worksheet chooser opens the existing applications. |
| Purchase-order updates do not refresh Desktop | Saves refresh Passport history and the financial projection. |
| SEND does not deliver a PDF; PO can claim SENT without delivery | Authenticated server renders the canonical selected revisions and sends the PDF through SES. Durable send tokens prevent duplicates. PO SENT requires a verified provider receipt for the actor, entity and document. |
| Service Invoice is an unfinished local workflow | Canonical draft save, revision-checked issue and draft void, readback, linked incoming receipts, Work Order entry and saved-record routing. Service invoices are excluded from equipment sales deals. |

Verification completed:

- Required paired gate: 426 frontend checks and 283 backend checks passed.
- Production frontend compilation passed; final compile is recorded in the task execution log.
- Report PDF rendered and visually inspected with embedded font, complete text, currency values, wrapping and page numbering. The PDF used fixtures, not a live financial statement.
- Email tests verify canonical revisions, authorization, provider receipts, retry behavior and duplicate prevention.
- Service Invoice tests verify draft creation, issue persistence, revision handling, incoming-payment readback and separation from equipment sales.
- Deployment packaging traces the embedded PDF font into the email API function.

Boundaries and remaining verification:

- No live payments, sales closeouts, signature attestations or test emails were created.
- Email acceptance means the provider accepted the message; it does not claim recipient delivery or reading.
- SMS and WhatsApp continue to open the external app with a private link. They do not claim delivery or attach a PDF automatically.
- Live browser, deployed email integration, runtime manifest, recovery and canonical-data checks remain release steps. The existing complete-runtime workflow and paired gate are unchanged.
- Supporting Service Invoice evidence stays attached through its source Work Order. Browser-only attachment placeholders are not presented as uploaded files.

Release authorization:

The user explicitly approved pushing and merging this repair in both named repositories and deploying through the existing complete-runtime workflow. GitHub publication retains the verified source tree; the backend pin identifies the connected-app publication commit.
