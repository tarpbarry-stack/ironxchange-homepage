# IXI Chat Ticket — Frontend / AWS Contract

## Status

Frontend V1 is intentionally usable before the AWS Ticket domain exists. Local drafts are real browser records. GitHub publication is **never simulated**: until the AWS Ticket API is configured, `SEND TO GITHUB` keeps the ticket local and reports that no GitHub call occurred.

## Canonical ticket contract

Schema: `ixi-ticket-v1`

Stable identity:

- `ticketId` — immutable internal identity.
- `displayNumber` — human-facing ticket number. Frontend-only V1 uses a collision-resistant local `CT-YYMMDD-XXXXXX` number. AWS may replace/reserve the display number when remote creation is introduced, but must preserve `ticketId` linkage.

Lifecycle:

- `draft`
- `ready-for-chat`
- `working`
- `pr-open`
- `ready-to-verify`
- `reopened`
- `rejected`
- `closed`

`originalRequest` and the initial edit request set become audit evidence once a ticket leaves `draft`. Completion does not close a ticket. Engineering moves completed work to `ready-to-verify`; a human audit closes it.

## Browser persistence

Frontend-only V1 stores drafts under:

`ixi:chat-tickets:v1`

Cross-window synchronization uses:

- `BroadcastChannel("ixi-chat-tickets")`
- the browser `storage` event
- `ixi-ticket-store-changed` in-window event

The pop-out worksheet is `/tickets/popout?ticketId=<ticketId>` and reads the same local record.

## Future AWS endpoints

The browser client is centralized in `lib/ixi-tickets/ixiTicketClient.js`. No component should call AWS or GitHub directly.

Target server contract:

- `POST /tickets/v1/tickets/reserve`
- `POST /tickets/v1/tickets`
- `GET /tickets/v1/tickets`
- `GET /tickets/v1/tickets/:ticketId`
- `PATCH /tickets/v1/tickets/:ticketId`
- `DELETE /tickets/v1/tickets/:ticketId` (unworked `draft` or `ready-for-chat` only)
- `POST /tickets/v1/tickets/:ticketId/github/publish`
- `POST /tickets/v1/tickets/:ticketId/verify`
- `POST /tickets/v1/tickets/:ticketId/reopen`

The final proxy/base path may be configured with `NEXT_PUBLIC_IXI_TICKET_API_BASE` without changing components.

## Authentication boundary

The browser must never contain a GitHub PAT, GitHub App private key, AWS privileged credential, role, permission claim, or trusted entity claim.

Ticket AWS requests must follow the existing IXI trusted-auth doctrine:

1. browser supplies normal authenticated request material;
2. IX-Core resolves the authenticated actor/entity/membership server-side;
3. IX-Core authorizes the Ticket command;
4. IX-Core performs GitHub publication with server-held credentials;
5. returned GitHub issue/PR identifiers are persisted back to the Ticket record.

Diagnostic context captured by the worksheet is evidence only and **must not establish authority**.

## GitHub publication

AWS owns GitHub publication. Expected GitHub issue metadata:

- label `ixi-chat-ticket`
- label representing lifecycle (`ready-for-chat`, etc.)
- type / priority / area labels where supported
- structured ticket body preserving original request and edit sections
- source ticket identity (`ticketId`, `displayNumber`)

GitHub issue number is not the IXI ticket number.

## Context enrichment

Any AOS/Card/TRAN$ACT module can enrich future ticket captures through:

`publishIXITicketContext(detail)`

Useful fields include:

- `objectId`
- `passportId`
- `cardFamily`
- `cardContext`
- `face`
- `scaleMode`
- `transactModule`
- `recordIds`

The global provider adds browser route, environment, viewport, user agent, and build version automatically.

## Attachments

Frontend-only V1 stores attachment metadata only. It intentionally does not put binary screenshots/PDFs into localStorage. AWS V2 should issue/upload to durable object storage and persist attachment references on the Ticket record. Customer support attachments must pass the future support privacy/sanitization boundary before engineering/GitHub exposure.

## Closeout and verification

AWS/GitHub automation may populate:

- `closeout.summary`
- `closeout.editResults`
- `closeout.filesChanged`
- `closeout.tests`
- `closeout.before`
- `closeout.after`
- `closeout.risks`
- `closeout.notes`
- `closeout.prs`

The Ticket Command page renders this as an audit record. `APPROVE & CLOSE` and `REOPEN TICKET` become server commands when AWS persistence is enabled.

## Future Support

The same Ticket domain can later accept sources:

- `internal-chat`
- `customer-support`
- `customer-feedback`
- `system-generated`

Raw customer support data must not be copied directly to GitHub. Support cases remain in the secure IXI support domain, are sanitized/correlated, and may link many support cases to one engineering ticket.
