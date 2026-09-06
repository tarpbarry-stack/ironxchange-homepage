import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import {
  buildIXIAosCommandContexts,
  getIXIAosContextGroups,
  getIXIAosRelatedContexts,
  getIXIFinancialQueryScope
} from "../components/ixi-command-center/IXIAosCommandCenterModel.js";

const entity = {
  entityId: "entity-1",
  displayName: "IronXchange Equipment",
  passportId: "IXI-ENTITY-1"
};

const objects = [
  {
    objectId: "location-1",
    objectType: "customer-defined-container",
    cardTemplateSlug: "ixi-location-layout-001",
    displayName: "DFW Airport Yard",
    passportId: "IXI-LOCATION-1"
  },
  {
    objectId: "work-1",
    objectType: "work-order",
    displayName: "WO-4418",
    directContainerId: "location-1"
  },
  {
    objectId: "person-1",
    objectFamily: "employee",
    displayName: "Keith Clements",
    directContainerId: "location-1"
  }
];

const ownedListings = [
  {
    id: "machine-1",
    title: "2017 Deere 544K II",
    passportId: "IXI-MACHINE-1",
    publicData: { machineLocation: "DFW Airport Yard", hours: 4500 },
    price: { amount: 4150000, currency: "USD" }
  }
];

test("command contexts preserve recursive company, location, machine, person and work perspectives", () => {
  const contexts = buildIXIAosCommandContexts({ entity, aosObjects: objects, ownedListings });
  const groups = getIXIAosContextGroups(contexts);

  assert.equal(groups.company.length, 1);
  assert.equal(groups.location.length, 1);
  assert.equal(groups.machine.length, 1);
  assert.equal(groups.person.length, 1);
  assert.equal(groups.work.length, 1);
});

test("location perspective resolves direct children and machines sharing the location", () => {
  const contexts = buildIXIAosCommandContexts({ entity, aosObjects: objects, ownedListings });
  const location = contexts.find(item => item.kind === "location");
  const related = getIXIAosRelatedContexts(location, contexts);

  assert.deepEqual(new Set(related.map(item => item.kind)), new Set(["work", "person", "machine"]));
});

test("financial scope is explicit and never invents unsupported person or work mappings", () => {
  assert.deepEqual(
    getIXIFinancialQueryScope({ kind: "machine", passportId: "IXI-MACHINE-1" }, "IXI-ENTITY-1"),
    {
      entityPassportIds: ["IXI-ENTITY-1"],
      locationPassportIds: [],
      assetPassportIds: ["IXI-MACHINE-1"],
      customerPassportIds: [],
      vendorPassportIds: []
    }
  );
  assert.equal(getIXIFinancialQueryScope({ kind: "person", passportId: "IXI-PERSON-1" }, "IXI-ENTITY-1"), null);
});

test("recursive command center owns transact while the detailed ledger remains available", () => {
  const transactPage = fs.readFileSync(
    new URL("../pages/transact/index.js", import.meta.url),
    "utf8"
  );
  const ledgerPage = fs.readFileSync(
    new URL("../pages/transact/ledger.js", import.meta.url),
    "utf8"
  );
  const commandCenter = fs.readFileSync(
    new URL("../components/ixi-command-center/IXITransactCommandCenter.jsx", import.meta.url),
    "utf8"
  );

  assert.match(transactPage, /IXITransactCommandCenter/u);
  assert.match(ledgerPage, /IXITransactDashboardApp/u);
  assert.match(commandCenter, /"Sales \/ A\/R"/u);
  assert.match(commandCenter, /"Buy \/ A\/P"/u);
  assert.match(commandCenter, /"GL \/ Close"/u);
  assert.doesNotMatch(commandCenter, /returnTo=.*dashboard/u);
});
