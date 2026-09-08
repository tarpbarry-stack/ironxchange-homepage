import test from "node:test";
import assert from "node:assert/strict";

import {
  projectAosContainerChildren
} from "../components/ixi-mos/workspace/IXIAosWorkspaceContainerProjection.mjs";

test("accepted listing placement appears in the destination rail immediately", () => {
  const listing = {
    id: "listing-ripper-1",
    listingId: "listing-ripper-1",
    displayName: "2019 RIPPER OTHER - 2 HRS",
    imageUrl: "https://media.example/ripper.jpg"
  };

  assert.deepEqual(projectAosContainerChildren({
    canonicalChildren: [],
    placedChildren: [listing]
  }), [listing]);
});

test("canonical Machine replaces its placed listing without a duplicate", () => {
  const listing = {
    id: "listing-ripper-1",
    listingId: "listing-ripper-1",
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
      { listingId: "ripper-a", displayName: "2019 RIPPER OTHER - 2 HRS" },
      { listingId: "ripper-b", displayName: "2019 RIPPER OTHER - 2 HRS" }
    ]
  });

  assert.equal(result.length, 2);
  assert.deepEqual(result.map(item => item.listingId), ["ripper-a", "ripper-b"]);
});
