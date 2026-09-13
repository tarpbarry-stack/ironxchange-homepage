import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import {
  buildIXIAosCommandContexts,
  getIXIAosContextGroups,
  getIXIAosRelationshipEvidence,
  getIXIAosRelatedContexts,
  getIXITransactOwnedEquipmentObjectIds,
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
    objectId: "object-machine-1",
    title: "2017 Deere 544K II",
    passportId: "IXI-MACHINE-1",
    publicData: { machineLocation: "DFW Airport Yard", hours: 4500 },
    price: { amount: 4150000, currency: "USD" },
    imageUrl: "https://images.example.com/544k.jpg"
  }
];

const canonicalMachine = {
  objectId: "object-machine-1",
  objectType: "machine",
  displayName: "Canonical 544K",
  passportId: "IXI-MACHINE-1"
};

function equipmentIndex(items = []) {
  return {
    objectId: "equipment-index",
    indexId: "equipment",
    metadata: { adapterId: "ixi-owned-equipment" },
    items
  };
}

test("desktop machine scope rejects a listing without canonical object identity", () => {
  const contexts = buildIXIAosCommandContexts({
    entity,
    ownedListings: [{
      id: "listing-only",
      objectId: "object-machine-1",
      title: "Unadmitted listing",
      passportId: "IXI-ALIAS"
    }],
    systemIndexes: [equipmentIndex([{ objectId: "object-machine-1" }])]
  });

  assert.equal(contexts.some(item => item.kind === "machine"), false);
});

test("canonical machines fail closed without the governed Equipment projection", () => {
  const contexts = buildIXIAosCommandContexts({
    entity,
    aosObjects: [canonicalMachine],
    ownedListings
  });

  assert.equal(contexts.some(item => item.kind === "machine"), false);
});

test("one canonical Object produces one command context and keeps machine presentation", () => {
  const contexts = buildIXIAosCommandContexts({
    entity,
    aosObjects: [{
      objectId: "object-machine-1",
      objectType: "machine",
      displayName: "Canonical 544K",
      passportId: "IXI-MACHINE-1"
    }],
    ownedListings,
    systemIndexes: [equipmentIndex([{ objectId: "object-machine-1" }])]
  });
  const matching = contexts.filter(item => item.sourceId === "object-machine-1");
  assert.equal(matching.length, 1);
  assert.equal(matching[0].kind, "machine");
  assert.equal(matching[0].passportId, "IXI-MACHINE-1");
  assert.equal(matching[0].imageUrl, "https://images.example.com/544k.jpg");
});

test("a canonical IX-Core machine remains selectable when Sharetribe returns zero listings", () => {
  const contexts = buildIXIAosCommandContexts({
    entity,
    aosObjects: [{
      objectId: "object-544k",
      objectType: "equipment",
      displayName: "2017 DEERE 544K II",
      passportId: "IXIMZFWCE7",
      media: [{ imageUrl: "https://images.example.com/canonical-544k.jpg" }]
    }],
    ownedListings: [],
    systemIndexes: [equipmentIndex([{ objectId: "object-544k" }])]
  });

  const machine = contexts.find(context => context.sourceId === "object-544k");
  assert.equal(machine.kind, "machine");
  assert.equal(machine.passportId, "IXIMZFWCE7");
  assert.equal(machine.imageUrl, "https://images.example.com/canonical-544k.jpg");
});

test("command contexts preserve recursive company, location, machine, person and work perspectives", () => {
  const contexts = buildIXIAosCommandContexts({
    entity,
    aosObjects: [...objects, canonicalMachine],
    ownedListings,
    systemIndexes: [equipmentIndex([{ objectId: "object-machine-1" }])]
  });
  const groups = getIXIAosContextGroups(contexts);

  assert.equal(groups.company.length, 1);
  assert.equal(groups.location.length, 1);
  assert.equal(groups.machine.length, 1);
  assert.equal(groups.person.length, 1);
  assert.equal(groups.work.length, 1);
});

test("a mixed Locations projection keeps five Locations and one machine distinct", () => {
  const locations = Array.from({ length: 5 }, (_, index) => ({
    objectId: `location-${index + 1}`,
    objectType: "customer-defined-container",
    displayName: `Operating Location ${index + 1}`,
    passportId: `IXI-LOCATION-${index + 1}`,
    ...(index < 3
      ? { cardTemplateSlug: `location-standard${index ? `-00${index + 1}` : ""}` }
      : { selectedPresentation: { templateSlug: "aos-card-007" } })
  }));
  const projectedMachine = {
    objectId: "projected-machine-1",
    objectType: "machine",
    displayName: "2019 RIPPER OTHER - 2 Hrs",
    passportId: "IXI-PROJECTED-MACHINE-1"
  };
  const locationsIndex = {
    objectId: "locations-index",
    metadata: { systemIndexPresentation: true },
    items: [...locations, projectedMachine]
  };
  const contexts = buildIXIAosCommandContexts({
    entity,
    aosObjects: [...locations, projectedMachine],
    systemIndexes: [
      equipmentIndex([{ objectId: projectedMachine.objectId }]),
      locationsIndex
    ]
  });
  const groups = getIXIAosContextGroups(contexts);

  assert.equal(locationsIndex.items.length, 6);
  assert.equal(groups.location.length, 5);
  assert.equal(groups.machine.length, 1);
  assert.deepEqual(
    groups.location.map(context => context.sourceId).sort(),
    locations.map(location => location.objectId).sort()
  );
});

test("conflicting projection hints stay neutral regardless of container order", () => {
  const neutral = { objectId: "object_neutral", objectType: "generic", passportId: "IXI_NEUTRAL" };
  const locations = [1, 2].map(n => ({ objectId: `object_location_${n}`, objectType: "location" }));
  const people = [1, 2].map(n => ({ objectId: `object_person_${n}`, objectType: "person" }));
  const indexes = [{ items: [...locations, neutral] }, { items: [...people, neutral] }];
  const aosObjects = [neutral, ...locations, ...people];
  const before = structuredClone(aosObjects);
  const kind = systemIndexes => buildIXIAosCommandContexts({ aosObjects, systemIndexes })
    .find(context => context.sourceId === neutral.objectId).kind;
  assert.equal(kind(indexes), "object");
  assert.equal(kind([...indexes].reverse()), "object");
  assert.deepEqual(aosObjects, before);
});

test("repeated references to one projected member cannot manufacture dominant evidence", () => {
  const neutral = { objectId: "object_neutral", objectType: "generic" };
  const location = { objectId: "object_location", objectType: "location" };
  const contexts = buildIXIAosCommandContexts({
    aosObjects: [neutral, location],
    systemIndexes: [{ items: [location, location, location, neutral] }]
  });
  assert.equal(contexts.find(context => context.sourceId === neutral.objectId).kind, "object");
});

test("location perspective resolves only active canonical IX-Core edges", () => {
  const contexts = buildIXIAosCommandContexts({
    entity,
    aosObjects: [...objects, canonicalMachine],
    ownedListings,
    systemIndexes: [equipmentIndex([{ objectId: "object-machine-1" }])]
  });
  const location = contexts.find(item => item.kind === "location");
  const relationships = [
    {
      relationshipId: "rel-work",
      sourceObjectId: "work-1",
      targetObjectId: "location-1",
      status: "active"
    },
    {
      relationshipId: "rel-person",
      sourceObjectId: "person-1",
      targetObjectId: "location-1",
      status: "active"
    },
    {
      relationshipId: "rel-machine",
      sourceObjectId: "object-machine-1",
      targetObjectId: "location-1",
      status: "active"
    },
    {
      relationshipId: "rel-ended",
      sourceObjectId: "object-ended",
      targetObjectId: "location-1",
      status: "ended"
    }
  ];
  const related = getIXIAosRelatedContexts(location, contexts, relationships);

  assert.deepEqual(new Set(related.map(item => item.kind)), new Set(["work", "person", "machine"]));
  assert.equal(getIXIAosRelationshipEvidence(location, contexts, relationships).length, 3);
});

test("parent fields and matching location text cannot fabricate a relationship", () => {
  const contexts = buildIXIAosCommandContexts({
    entity,
    aosObjects: [...objects, canonicalMachine],
    ownedListings,
    systemIndexes: [equipmentIndex([{ objectId: "object-machine-1" }])]
  });
  const location = contexts.find(item => item.kind === "location");

  assert.deepEqual(getIXIAosRelatedContexts(location, contexts, []), []);
  assert.deepEqual(getIXIAosRelationshipEvidence(location, contexts, []), []);
});

test("TRAN$ACT admits 23 governed Equipment machines and rejects 19 unowned work machines", () => {
  const machines = Array.from({ length: 42 }, (_, index) => ({
    objectId: `machine-${index + 1}`,
    objectType: index < 23 ? "machine" : undefined,
    displayName: `Machine ${index + 1}`,
    passportId: `IXI-MACHINE-${index + 1}`,
    presentation: index < 23 ? undefined : { kind: "auction-work-machine" }
  }));
  const owned = machines.slice(0, 23);
  const unowned = machines.slice(23);
  const equipment = {
    objectId: "equipment-index",
    objectType: "system-index",
    displayName: "Company Equipment",
    passportId: "IXI-EQUIPMENT",
    metadata: { systemIndex: true, adapterId: "ixi-owned-equipment" }
  };
  const systemIndexes = [equipmentIndex(
    owned.map(machine => ({
      objectId: machine.objectId,
      passportId: machine.passportId
    }))
  )];
  const governedRelationships = owned.map((machine, index) => ({
    relationshipId: `equipment-rel-${index + 1}`,
    sourceObjectId: machine.objectId,
    targetObjectId: equipment.objectId,
    behaviorId: "aos.rail-membership.v1",
    status: "active"
  }));
  const relationships = [
    ...governedRelationships,
    { ...governedRelationships[0] },
    {
      relationshipId: "unowned-ended-rel",
      sourceObjectId: unowned[0].objectId,
      targetObjectId: equipment.objectId,
      behaviorId: "aos.rail-membership.v1",
      status: "ended"
    }
  ];
  const contexts = buildIXIAosCommandContexts({
    entity,
    aosObjects: [equipment, ...machines],
    ownedListings: machines.map(machine => ({
      objectId: machine.objectId,
      title: `${machine.displayName} presentation`,
      passportId: machine.passportId
    })),
    systemIndexes
  });
  const groups = getIXIAosContextGroups(contexts);
  const company = groups.company[0];

  assert.equal(new Set(machines.map(machine => machine.objectId)).size, 42);
  assert.equal(new Set(machines.map(machine => machine.passportId)).size, 42);
  assert.equal(getIXITransactOwnedEquipmentObjectIds(systemIndexes).length, 23);
  assert.equal(groups.machine.length, 23);
  assert.equal(
    unowned.some(machine => contexts.some(context => context.sourceId === machine.objectId)),
    false
  );
  assert.equal(getIXIAosRelationshipEvidence(company, contexts, relationships).length, 23);
  assert.equal(
    getIXIAosRelatedContexts(company, contexts, relationships)
      .filter(context => context.kind === "machine").length,
    23
  );
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
  const commandModel = fs.readFileSync(
    new URL("../components/ixi-command-center/IXIAosCommandCenterModel.js", import.meta.url),
    "utf8"
  );

  assert.match(transactPage, /IXITransactCommandCenter/u);
  assert.match(ledgerPage, /IXITransactDashboardApp/u);
  assert.match(commandCenter, /\["today", "TODAY", "01"\]/u);
  assert.match(commandCenter, /\["purchasing", "PURCHASING", "03"\]/u);
  assert.match(commandCenter, /\["sales", "SALES", "04"\]/u);
  assert.match(commandCenter, /\["ar", "A\/R", "05"\]/u);
  assert.match(commandCenter, /\["ap", "A\/P", "06"\]/u);
  assert.match(commandCenter, /\["gl", "GL \/ CLOSE", "08"\]/u);
  assert.match(commandCenter, /\["reporting", "REPORTING", "10"\]/u);
  assert.match(commandCenter, /TRAN\$ACT will not claim a clean state/u);
  assert.match(commandCenter, /VIEWS NEVER CHANGE POSTED TRUTH/u);
  assert.doesNotMatch(commandCenter, /createIXI|provision|passport\/ensure/u);
  assert.doesNotMatch(commandCenter, /returnTo=.*dashboard/u);
  assert.match(commandModel, /getIXITransactOwnedEquipmentObjectIds/u);
  assert.match(commandModel, /getIXIAosRelationshipEvidence/u);
  assert.doesNotMatch(commandModel, /all\.filter\(item => item\.id !== context\.id\)/u);
  assert.doesNotMatch(commandModel, /sameText|locationRelation|reverseLocationRelation/u);
});
