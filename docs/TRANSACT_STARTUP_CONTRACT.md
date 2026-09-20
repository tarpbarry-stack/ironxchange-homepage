# TRAN$ACT startup and performance contract

TRAN$ACT must be usable without repeating full identity discovery for each card,
relationship or hidden application. This is a read architecture requirement, not
permission to remove authorization or retain stale business data.

## Startup ownership

The session layout owns one runtime per visit. Access and the canonical directory
start independently. The directory is published only after the Financial company
and the server-derived AOS company agree. Failed, disposed and superseded requests
cannot publish. Authority changes clear protected state and outstanding results.

The canonical bootstrap already contains Object/Passport admissions, definitions
and governed relationships. Its projection must not request another browser login,
private board placement state, listing census or individual identity admissions.
Optional listing detail and media enrich the same admitted Objects afterward.
Only a server-confirmed first-time onboarding response permits one additional
canonical readback; established accounts stay within the one-bootstrap budget.

Only visited workspaces mount. Hidden workspaces keep drafts but suspend financial
reads. A successful save invalidates financial results without reloading identity.

## Enforced budgets

| Operation | Required bound |
| --- | --- |
| Fresh browser access | One shared request; one bounded 401 recovery retry |
| Fresh canonical directory | One bootstrap, independent of access latency |
| Initial visible company data | One shared dashboard and one Passport history read |
| Hidden unvisited workspace | Zero mounted applications and zero financial reads |
| Directory presentation | One optional listing collection; media only as needed |
| Core cold HTTP bootstrap | At most two Object/Passport registry reads each, including authentication |
| Core 200-object repeated admission | One read of each registry per explicit read scope |
| Financial collection current records | At most 100 keys per batch and two requests in flight; 350 records require four batches |

The paired gate runs behavioral request-deduplication, abort, authority-change,
tenant-isolation, draft-retention and registry-read-budget tests. Read snapshots
exist only within an explicit server read operation. Writes are rejected inside
that scope. Each new request obtains fresh snapshots and permission inputs.
Financial batches use consistent reads, retry only unprocessed keys with bounded
backoff, and reject incomplete collections. Release preflight proves batch-read
permission before stopping the runtime. Collection reads must not regress to one
database request per record.

## Release evidence

Before/after browser measurements must distinguish shell readiness from actual
usable machine directory and worksheet readiness. Target directory readiness is
under three seconds on the measured production connection; report outliers and
upstream timings rather than claiming a universal network guarantee. Verify a new
visit after the deployment and check that photos, IDs and draft retention survive.
No customer records are created or modified by performance verification.

For fresh navigation, `IXI TRANSACT UI READY` records committed shell/directory
readiness using the browser navigation clock. Separate this from remote browser
control elapsed time; `navigationMs` is not a new timer on SPA route changes.
Gateway MOS/Financial timing logs expose numeric backend processing phases and
header/body durations without customer data. Use these to distinguish server
work from transport or queuing delay before changing checks or adding caches.

## Required deployment capability

The runtime role requires `dynamodb:BatchGetItem` on `ixi-financial-v1`. The
release operator intentionally lacks IAM administration. Provision the approved
core `ops/iam/transact-financial-batch-read.json` policy through an authorized AWS
administrator before release; do not expand the deployment account's privileges.
The complete release verifies the actual runtime capability before shutdown and
stops safely when it is absent. Keep IAM provisioning separate from each release.
