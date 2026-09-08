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

test("Post Free uses canonical Machine provisioning and never infers ownership from upload", () => {
  const attach = read("lib/passport/attachPassportToSharetribeListing.js");
  const machineRoute = read("pages/api/ixi/onboarding/machine.js");
  const legacyRoute = read("pages/api/passport/ensure.js");

  assert.match(attach, /provisionListingMachine\(listingId\)/u);
  assert.doesNotMatch(attach, /ensurePassportForMachine/u);
  assert.match(machineRoute, /session\.sdk\.ownListings\.show/u);
  assert.match(machineRoute, /\/aos\/machines\/sharetribe-listing/u);
  assert.match(legacyRoute, /machineProvisioningHandler/u);
  assert.match(legacyRoute, /sourceType !== "sharetribe-listing"/u);
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
});
