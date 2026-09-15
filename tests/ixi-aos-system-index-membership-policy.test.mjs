import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import { canIXIObjectAcceptDrop } from
  "../components/ixi-chassis/IXIDropAcceptanceEngine.js";
import {
  AOS_SYSTEM_INDEX_MEMBERSHIP_POLICY_SCHEMA,
  evaluateAosSystemIndexMembership,
  resolveAosDefaultSystemIndexHome
} from "../lib/mos/IXIAosSystemIndexMembershipPolicy.js";

function policy({ objectTypes = [], definitionIds = [], defaultHome = true } = {}) {
  return {
    schema: AOS_SYSTEM_INDEX_MEMBERSHIP_POLICY_SCHEMA,
    enabled: true,
    defaultWorkspaceHome: defaultHome,
    allowedObjectTypes: objectTypes,
    allowedDefinitionIds: definitionIds
  };
}

function index(objectId, membershipPolicy = null) {
  return {
    objectId,
    objectType: "system-index",
    metadata: {
      systemIndex: true,
      ...(membershipPolicy
        ? { systemIndexMembershipPolicy: membershipPolicy }
        : {})
    }
  };
}

test("System Index roots cannot be nested into any container", () => {
  const decision = evaluateAosSystemIndexMembership({
    sourceObject: index("index-a", policy({ objectTypes: ["location"] })),
    targetObject: { objectId: "ordinary", objectType: "container" }
  });
  assert.deepEqual(decision, { allowed: false, reason: "system-index-root" });
  assert.equal(canIXIObjectAcceptDrop({
    dragData: { objectId: "index-a", objectType: "system-index" },
    target: {
      objectId: "ordinary",
      workspaceDropPolicy: { enabled: true, acceptedObjectTypes: [] }
    }
  }).accepted, false);
});
test("System Index membership fails closed without a declared policy", () => {
  assert.deepEqual(
    evaluateAosSystemIndexMembership({
      sourceObject: { objectId: "machine", objectType: "machine" },
      targetObject: index("unconfigured")
    }),
    { allowed: false, reason: "policy-required" }
  );
});

test("membership follows canonical object type or customer definition identity", () => {
  const typedIndex = index("typed", policy({ objectTypes: ["location"] }));
  const definedIndex = index("defined", policy({ definitionIds: ["definition-7"] }));

  assert.equal(evaluateAosSystemIndexMembership({
    sourceObject: { objectId: "yard", objectType: "location" },
    targetObject: typedIndex
  }).allowed, true);
  assert.equal(evaluateAosSystemIndexMembership({
    sourceObject: { objectId: "person", objectType: "person" },
    targetObject: typedIndex
  }).allowed, false);
  assert.equal(evaluateAosSystemIndexMembership({
    sourceObject: {
      objectId: "custom",
      objectType: "generic",
      definitionId: "definition-7"
    },
    targetObject: definedIndex
  }).allowed, true);
});

test("default placement is deterministic and ambiguous matches stay on Board", () => {
  const member = { objectId: "person", objectType: "person" };
  const first = index("first", policy({ objectTypes: ["person"] }));
  const second = index("second", policy({ objectTypes: ["person"] }));

  assert.equal(resolveAosDefaultSystemIndexHome({
    object: member,
    systemIndexes: [first]
  })?.objectId, "first");
  assert.equal(resolveAosDefaultSystemIndexHome({
    object: member,
    systemIndexes: [first, second]
  }), null);
});

test("AOS source contains no record-specific repair or unrequested adapter vocabulary", () => {
  const sources = [
    "pages/aos/work.js",
    "lib/mos/IXIAosSystemAdapterRegistry.js",
    "lib/mos/buildAosSystemIndexes.js"
  ].map(path => fs.readFileSync(path, "utf8")).join("\n");

  assert.doesNotMatch(sources, /IXI_AOS_LOCATIONS_REPAIR/u);
  assert.doesNotMatch(sources, /for[ _-]?sale/iu);
});
