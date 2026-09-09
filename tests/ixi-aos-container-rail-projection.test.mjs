import test from "node:test";
import assert from "node:assert/strict";

import {
  projectAosContainerChildren
} from "../components/ixi-mos/workspace/IXIAosWorkspaceContainerProjection.mjs";

test("accepted canonical placement appears in the destination rail immediately", () => {
  const reference = {
    objectId: "object-ripper-1",
    displayName: "2019 RIPPER OTHER - 2 HRS",
    imageUrl: "https://media.example/ripper.jpg",
    referenceOnly: true
  };

  assert.deepEqual(projectAosContainerChildren({
    canonicalChildren: [],
    placedChildren: [reference]
  }), [reference]);
});

test("canonical Machine replaces its placed listing without a duplicate", () => {
  const listing = {
    objectId: "object-ripper-1",
    passportId: "IXIABC2345",
    displayName: "2019 RIPPER OTHER - 2 HRS",
    imageUrl: "https://media.example/ripper.jpg"
  };
  const machine = {
    objectId: "object-ripper-1",
    entityId: "entity-star-and-sons",
    objectType: "machine",
    displayName: "2019 RIPPER OTHER - 2 HRS",
    directContainerId: "object-wichita-falls",
    metadata: { sourceListingId: "listing-ripper-1" }
  };

  const result = projectAosContainerChildren({
    canonicalChildren: [machine],
    placedChildren: [listing]
  });

  assert.equal(result.length, 1);
  assert.equal(result[0].objectId, "object-ripper-1");
  assert.equal(result[0].directContainerId, "object-wichita-falls");
  assert.equal(result[0].imageUrl, "https://media.example/ripper.jpg");
});

test("distinct duplicate-name machines remain distinct by identity", () => {
  const result = projectAosContainerChildren({
    canonicalChildren: [],
    placedChildren: [
      { objectId: "object-ripper-a", displayName: "2019 RIPPER OTHER - 2 HRS" },
      { objectId: "object-ripper-b", displayName: "2019 RIPPER OTHER - 2 HRS" }
    ]
  });

  assert.equal(result.length, 2);
  assert.deepEqual(result.map(item => item.objectId), ["object-ripper-a", "object-ripper-b"]);
});
