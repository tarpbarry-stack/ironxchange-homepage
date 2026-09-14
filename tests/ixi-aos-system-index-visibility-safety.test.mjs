import assert from "node:assert/strict";
import test from "node:test";

import {
  excludePeerSystemIndexMembers,
  reconcilePeerSystemIndexesToBoard
} from "../components/ixi-mos/workspace/IXIAosSystemIndexPlacement.mjs";
import {
  buildAosSystemIndexes
} from "../lib/mos/buildAosSystemIndexes.js";

const LOCATIONS = "object_locations";
const WORKFORCE = "object_workforce";
const EQUIPMENT = "object_equipment";
const YARD = "object_yard";
const PERSON = "object_person";
const MACHINE = "object_machine";

function canonicalObject({
  objectId,
  passportId,
  displayName,
  objectType = "generic",
  metadata = {}
}) {
  return {
    objectId,
    passportId,
    entityId: "entity_star_and_sons",
    displayName,
    objectType,
    status: "active",
    canonicalAdmissionVerified: true,
    aliases: [],
    metadata
  };
}

function railMember(objectId) {
  return { objectId };
}

test("peer System Index cards return to the board without moving their children", () => {
  const objects = [
    canonicalObject({
      objectId: LOCATIONS,
      passportId: "IXIABC2345",
      displayName: "LOCATIONS",
      objectType: "system-index",
      metadata: { systemIndex: true }
    }),
    canonicalObject({
      objectId: WORKFORCE,
      passportId: "IXIDEF2345",
      displayName: "WORKFORCE",
      objectType: "system-index",
      metadata: { systemIndex: true }
    }),
    canonicalObject({
      objectId: EQUIPMENT,
      passportId: "IXIGHJ2345",
      displayName: "EQUIPMENT",
      objectType: "system-index",
      metadata: {
        systemIndex: true,
        adapterId: "ixi-owned-equipment"
      }
    }),
    canonicalObject({
      objectId: YARD,
      passportId: "IXIKMN2345",
      displayName: "RINGLING YARD"
    }),
    canonicalObject({
      objectId: PERSON,
      passportId: "IXIPQR2345",
      displayName: "COOPER LILES"
    }),
    canonicalObject({
      objectId: MACHINE,
      passportId: "IXISTU2345",
      displayName: "2019 DEERE 770GP"
    })
  ];
  const railProjections = {
    [LOCATIONS]: { members: [railMember(YARD), railMember(WORKFORCE)] },
    [WORKFORCE]: { members: [railMember(PERSON), railMember(EQUIPMENT)] },
    [EQUIPMENT]: { members: [railMember(MACHINE)] }
  };
  const systemIndexObjectIds = buildAosSystemIndexes({
    aosObjects: objects,
    railProjections
  }).map(index => index.objectId);

  assert.deepEqual(
    new Set(systemIndexObjectIds),
    new Set([LOCATIONS, WORKFORCE, EQUIPMENT])
  );

  const originalPlacements = {
    board: [LOCATIONS],
    [`container:${LOCATIONS}`]: [YARD, WORKFORCE],
    [`container:${WORKFORCE}`]: [PERSON, EQUIPMENT],
    [`container:${EQUIPMENT}`]: [MACHINE]
  };

  const result = reconcilePeerSystemIndexesToBoard({
    placements: originalPlacements,
    systemIndexObjectIds
  });

  assert.deepEqual(result.releasedObjectIds, [WORKFORCE, EQUIPMENT]);
  assert.deepEqual(result.placements.board, [LOCATIONS, WORKFORCE, EQUIPMENT]);
  assert.deepEqual(result.placements[`container:${LOCATIONS}`], [YARD]);
  assert.deepEqual(result.placements[`container:${WORKFORCE}`], [PERSON]);
  assert.deepEqual(result.placements[`container:${EQUIPMENT}`], [MACHINE]);
  assert.deepEqual(originalPlacements, {
    board: [LOCATIONS],
    [`container:${LOCATIONS}`]: [YARD, WORKFORCE],
    [`container:${WORKFORCE}`]: [PERSON, EQUIPMENT],
    [`container:${EQUIPMENT}`]: [MACHINE]
  });
});

test("System Index rail projection excludes peer indexes and preserves real children", () => {
  const systemIndexObjectIds = [LOCATIONS, WORKFORCE, EQUIPMENT];

  assert.deepEqual(
    excludePeerSystemIndexMembers({
      ownerObjectId: LOCATIONS,
      memberObjectIds: [YARD, WORKFORCE],
      systemIndexObjectIds
    }),
    [YARD]
  );
  assert.deepEqual(
    excludePeerSystemIndexMembers({
      ownerObjectId: WORKFORCE,
      memberObjectIds: [PERSON, EQUIPMENT],
      systemIndexObjectIds
    }),
    [PERSON]
  );
  assert.deepEqual(
    excludePeerSystemIndexMembers({
      ownerObjectId: EQUIPMENT,
      memberObjectIds: [MACHINE],
      systemIndexObjectIds
    }),
    [MACHINE]
  );
});

test("ordinary containers are not changed by the System Index safety rule", () => {
  const ordinaryContainer = "object_ordinary_container";
  const placements = {
    board: [LOCATIONS],
    [`container:${ordinaryContainer}`]: [WORKFORCE]
  };

  const result = reconcilePeerSystemIndexesToBoard({
    placements,
    systemIndexObjectIds: [LOCATIONS, WORKFORCE]
  });

  assert.deepEqual(result.releasedObjectIds, []);
  assert.deepEqual(result.placements, placements);
});
