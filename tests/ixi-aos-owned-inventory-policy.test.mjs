import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  filterAosOwnedMachines,
  isAosOwnedMachine
} from "../lib/listings/IXIAosOwnedInventoryPolicy.mjs";

test("AOS ownership is independent of private, marketplace, and auction channels", () => {
  for (const machineChannel of ["private", "marketplace", "auction"]) {
    assert.equal(
      isAosOwnedMachine({
        publicData: {
          ownershipRole: "owner",
          machineChannel
        }
      }),
      true,
      `${machineChannel} owner should be included`
    );
  }
});

test("AOS excludes explicit non-owner and URL-imported reference machines", () => {
  assert.equal(
    isAosOwnedMachine({
      publicData: {
        ownershipRole: "non-owner",
        machineChannel: "private"
      }
    }),
    false
  );

  assert.equal(
    isAosOwnedMachine({
      publicData: {
        machineOrigin: "url-import",
        machineChannel: "auction"
      }
    }),
    false
  );
});

test("AOS keeps legacy author-owned machines and excludes deleted records", () => {
  assert.deepEqual(
    filterAosOwnedMachines([
      { id: "legacy-owner", publicData: { machineChannel: "marketplace" } },
      { id: "deleted", publicData: { listingStatus: "deleted" } }
    ]).map(item => item.id),
    ["legacy-owner"]
  );
});

test("creation paths stamp durable ownership provenance", async () => {
  const postFree = await readFile(
    new URL("../pages/post-free.js", import.meta.url),
    "utf8"
  );
  const urlImport = await readFile(
    new URL("../pages/url-import.js", import.meta.url),
    "utf8"
  );

  assert.match(postFree, /ownershipRole:\s*"owner"/u);
  assert.match(postFree, /machineOrigin:\s*"owner-created"/u);
  assert.match(urlImport, /ownershipRole:\s*"non-owner"/u);
  assert.match(urlImport, /machineOrigin:\s*"url-import"/u);
});

test("AOS refreshes inventory and reconciles newly discovered machines", async () => {
  const aosWork = await readFile(
    new URL("../pages/aos/work.js", import.meta.url),
    "utf8"
  );
  const endpoint = await readFile(
    new URL("../pages/api/account-listings.js", import.meta.url),
    "utf8"
  );

  assert.match(aosWork, /window\.addEventListener\("focus", refreshOwnedInventory\)/u);
  assert.match(aosWork, /document\.addEventListener\("visibilitychange", refreshWhenVisible\)/u);
  assert.match(aosWork, /targetSurface:\s*"indexEquipment"/u);
  assert.doesNotMatch(aosWork, /machineChannel ===\s*"auction"/u);
  assert.match(endpoint, /private, no-store, max-age=0, must-revalidate/u);
});
