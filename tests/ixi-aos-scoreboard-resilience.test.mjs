import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("AOS Work uses one startup orchestrator for identity, state, inventory and MOS", async () => {
  const source = await readFile(
    new URL("../pages/aos/work.js", import.meta.url),
    "utf8"
  );

  assert.match(source, /async function loadAosWorkEnvironment/u);
  assert.match(source, /await loadIXIMosEnvironment/u);
  assert.match(source, /listingEnvironment\?\.currentUser/u);
  assert.match(source, /environment\?\.ownedListings/u);
  assert.match(source, /listingEnvironment\?\.ixiState/u);
  assert.match(source, /IXI AOS BACKGROUND MEDIA HYDRATION FAILED/u);
  assert.match(source, /dedupeRequests:\s*true/u);
  assert.match(source, /concurrency:\s*4/u);
  assert.doesNotMatch(source, /async function loadAosIdentity/u);
  assert.doesNotMatch(source, /async function loadSavedPage/u);
  assert.doesNotMatch(source, /currentUser\.show/u);
  assert.doesNotMatch(source, /scope=aos-owned/u);
});

test("AOS gateway records upstream conflict diagnostics", async () => {
  const source = await readFile(
    new URL("../pages/api/aos/mos/[...path].js", import.meta.url),
    "utf8"
  );

  assert.match(source, /AOS_BROWSER_GATEWAY_ERROR/u);
  assert.match(source, /error\?\.details/u);
});
