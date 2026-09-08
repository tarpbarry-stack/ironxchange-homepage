import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = file => fs.readFileSync(path.join(root, file), "utf8");

test("signup and login establish the commercial AOS identity before navigation", () => {
  const signup = read("pages/signup.js");
  const login = read("pages/login.js");

  assert.match(signup, /await ensureCommercialOnboarding\(\)/u);
  assert.match(signup, /\/aos\?welcome=1/u);
  assert.match(login, /await ensureCommercialOnboarding\(\)/u);
  assert.match(login, /await backfillOwnedMachines\(\)/u);
});

test("browser bootstrap derives identity from the Sharetribe session and IX-Core", () => {
  const route = read("pages/api/ixi/onboarding/bootstrap.js");
  const session = read("lib/server/aos/resolveAosBrowserSession.js");
  const core = read("lib/server/aos/ixiMosInternalClient.js");

  assert.match(route, /resolveAosBrowserSession\(req, res\)/u);
  assert.match(route, /resolveIxCoreAosContext/u);
  assert.match(session, /authInfo\.isAnonymous !== false/u);
  assert.match(core, /\/aos\/onboarding\/bootstrap/u);
  assert.match(core, /entityDisplayName/u);
  assert.match(core, /person: getOnboardingProfile\(session\)/u);
});

test("Post Free and URL Import use governed listing admission, never generic Passport ensure", () => {
  const postFree = read("pages/post-free.js");
  const urlImport = read("pages/url-import.js");
  const attach = read("lib/passport/attachPassportToSharetribeListing.js");
  const client = read("lib/onboarding/ixiCommercialOnboardingClient.js");
  const machineRoute = read("pages/api/ixi/onboarding/machine.js");

  assert.match(postFree, /attachPassportToSharetribeListing/u);
  assert.match(urlImport, /attachPassportToSharetribeListing/u);
  assert.match(attach, /provisionListingMachine\(listingId\)/u);
  assert.doesNotMatch(attach, /ensurePassportForMachine/u);
  assert.match(client, /\/api\/ixi\/onboarding\/machine/u);
  assert.match(machineRoute, /session\.sdk\.ownListings\.show/u);
  assert.match(machineRoute, /\/aos\/machines\/sharetribe-listing/u);
  assert.equal(fs.existsSync(path.join(root, "pages/api/passport/ensure.js")), false);
  assert.doesNotMatch(postFree, /passport\/ensure/u);
  assert.doesNotMatch(urlImport, /passport\/ensure/u);
});

test("bulk upload uses authenticated governed listing admission", () => {
  const route = read("pages/api/bulk-create-listings.js");
  const attach = read("lib/passport/attachPassportToIntegrationListing.js");

  assert.match(route, /resolveAosBrowserSession\(req, res\)/u);
  assert.match(route, /resolveIxCoreAosContext/u);
  assert.match(route, /principalId: context\.userId/u);
  assert.match(route, /entityId: context\.entityId/u);
  assert.match(attach, /\/aos\/machines\/sharetribe-listing/u);
  assert.match(attach, /Idempotency-Key/u);
  assert.doesNotMatch(attach, /passport\/ensure/u);
  assert.doesNotMatch(attach, /ensurePassportForMachineServer/u);
});

test("AOS root renders the provisioned owner Person beside the Entity card", () => {
  const aos = read("pages/aos/index.js");

  assert.match(aos, /ownerPeople/u);
  assert.match(aos, /metadata\?\.onboarding\?\.relationship === "owner"/u);
  assert.match(aos, /<IXIAosCardRenderer/u);
  assert.match(aos, /parentLabel=\{entityName\}/u);
});

test("machine backfill is bounded and idempotent", () => {
  const route = read("pages/api/ixi/onboarding/backfill.js");

  assert.match(route, /Math\.min\(max, Math\.max\(min, number\)\)/u);
  assert.match(route, /perPage, 20, 1, 25/u);
  assert.match(route, /Idempotency-Key/u);
  assert.match(route, /sharetribe-listing:\$\{listing\.listingId\}/u);
  assert.equal(fs.existsSync(path.join(root, "scripts/backfillPassports.mjs")), false);
});
