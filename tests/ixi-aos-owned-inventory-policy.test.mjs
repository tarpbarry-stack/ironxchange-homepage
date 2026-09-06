import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  filterAosOwnedMachines,
  isAosOwnedMachine
} from "../lib/listings/IXIAosOwnedInventoryPolicy.mjs";

test("legacy private and marketplace inventory remains included", () => {
  for (const machineChannel of ["private", "marketplace"]) {
    assert.equal(isAosOwnedMachine({ publicData: { machineChannel } }), true);
  }
});

test("legacy URL-import media records are excluded", () => {
  const records = [
    { publicData: { ixiMedia: { machineKey: "url-import-1786552106931" } } },
    { publicData: { ixiMedia: { manifest: "/api/media/machines/url-import-123" } } },
    { publicData: { machineOrigin: "url-import" } }
  ];

  assert.equal(filterAosOwnedMachines(records).length, 0);
});

test("the reported 42-record mix resolves to the 23 owned machines", () => {
  const owned = Array.from({ length: 23 }, (_, index) => ({
    id: `owned-${index + 1}`,
    publicData: { machineChannel: index % 2 ? "private" : "marketplace" }
  }));
  const importedWork = Array.from({ length: 19 }, (_, index) => ({
    id: `research-${index + 1}`,
    publicData: {
      ixiMedia: { machineKey: `url-import-${1786378347516 + index}` }
    }
  }));

  assert.equal(filterAosOwnedMachines([...owned, ...importedWork]).length, 23);
});

test("explicitly owned auction and acquired URL-origin machines are included", () => {
  assert.equal(
    isAosOwnedMachine({
      publicData: { machineChannel: "auction", ownershipRole: "owner" }
    }),
    true
  );
  assert.equal(
    isAosOwnedMachine({
      publicData: {
        ownershipStatus: "owned",
        ixiMedia: { machineKey: "url-import-legacy" }
      }
    }),
    true
  );
});

test("legacy auction work, non-owner, reference, archived and deleted records are excluded", () => {
  const records = [
    { publicData: { machineChannel: "auction" } },
    { publicData: { ownershipRole: "non-owner" } },
    { publicData: { ownershipStatus: "reference" } },
    { publicData: { listingStatus: "archived" } },
    { publicData: { listingStatus: "deleted" } }
  ];

  assert.equal(filterAosOwnedMachines(records).length, 0);
});

test("AOS requests the owned scope and defends again after transport", async () => {
  const [loader, work, endpoint] = await Promise.all([
    readFile(new URL("../lib/listings/loadIXIOwnedListings.js", import.meta.url), "utf8"),
    readFile(new URL("../pages/aos/work.js", import.meta.url), "utf8"),
    readFile(new URL("../pages/api/account-listings.js", import.meta.url), "utf8")
  ]);

  assert.match(loader, /scope=aos-owned/u);
  assert.match(loader, /filterAosOwnedMachines\(listings\)/u);
  assert.match(work, /scope=aos-owned/u);
  assert.match(work, /filterAosOwnedMachines\(data\)/u);
  assert.match(endpoint, /req\.query\.scope === "aos-owned"/u);
});
