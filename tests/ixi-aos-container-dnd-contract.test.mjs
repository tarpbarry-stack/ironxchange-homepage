import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import {
  createAosMembershipRelationship,
  getExactActiveAosRelationship,
  getAosMembershipRelationships,
  getInvalidAosSystemIndexMemberships,
  isExplicitAosSystemIndexObject,
  removeAosRailProjectionMemberships
} from "../lib/mos/IXIAosMembershipBridge.mjs";

function read(relativePath) {
  return fs.readFileSync(relativePath, "utf8");
}

const workspaceBoard = read(
  "components/ixi-mos/workspace/IXIAosWorkspaceBoard.jsx"
);
const board = read(
  "components/ixi-chassis/IXIBoard.js"
);
const sortableCard = read(
  "components/ixi-chassis/IXISortableMachineCard.js"
);
const sortableObject = read(
  "components/ixi-chassis/IXISortableObject.jsx"
);
const collisionEngine = read(
  "components/ixi-chassis/IXIDndEngineHelpers.js"
);
const dropTarget = read(
  "components/ixi-chassis/IXIObjectDropTarget.jsx"
);
const dropAcceptanceEngine = read(
  "components/ixi-chassis/IXIDropAcceptanceEngine.js"
);
const operatingCardRuntime = read(
  "components/ixi-aos/card-runtime/IXIAosOperatingCardRuntime.jsx"
);
const numberedObjectConsole = read(
  "components/ixi-aos/console-runtime/IXIAosNumberedObjectConsole.jsx"
);
const card018 = read(
  "components/ixi-aos/cards/018/IXIAosCard018.jsx"
);
const containerDropTarget = read(
  "components/ixi-chassis/IXIContainerDropTarget.jsx"
);
const workspaceRegistry = read(
  "components/ixi-mos/workspace/useIXIAosWorkspaceRegistry.js"
);
const objectCreation = read(
  "components/ixi-mos/object-creation/useIXIMosObjectCreation.js"
);
const work = read(
  "pages/aos/work.js"
);
const machineStateClient = read(
  "lib/ixiMachineStateClient.js"
);
const identityFace = read(
  "components/ixi-aos/card-runtime/IXIAosCardIdentityFace.jsx"
);

test("AOS container policy reaches the universal sortable chassis", () => {
  assert.match(
    workspaceBoard,
    /getItemReorderBehavior=\{[\s\S]*?isContainerWorkspaceObject\(item\)[\s\S]*?"self-only"/
  );
  assert.match(
    board,
    /getItemReorderBehavior,/
  );
  assert.match(
    board,
    /getItemReorderBehavior\([\s\S]*?item[\s\S]*?\)/
  );
  assert.match(
    board,
    /reorderBehavior=\{[\s\S]*?reorderBehavior[\s\S]*?\}/
  );
  assert.match(
    sortableCard,
    /reorderBehavior=\{[\s\S]*?reorderBehavior[\s\S]*?\}/
  );
});

test("self-only containers stay planted during a foreign drag", () => {
  assert.match(
    sortableObject,
    /reorderBehavior === "self-only"[\s\S]*?activeId[\s\S]*?!isSelfDragging/
  );
  assert.match(
    sortableObject,
    /suppressForeignTransform[\s\S]*?\? null[\s\S]*?: transform/
  );
});

test("valid ON targets win collision detection and publish accepting state", () => {
  assert.match(
    collisionEngine,
    /droppableContainer[\s\S]*?accepted === true/
  );
  assert.match(
    collisionEngine,
    /if \([\s\S]*?onTargetHits\.length[\s\S]*?\)[\s\S]*?return onTargetHits/
  );
  assert.match(
    dropTarget,
    /disabled:[\s\S]*?!canAccept/
  );
  assert.match(
    dropTarget,
    /accepting[\s\S]*?"ixi-drop-accepting"/
  );
});

test("ordinary containers remain composable while System Index peers cannot contain each other", () => {
  assert.match(
    sortableObject,
    /data:[\s\S]*?reorderBehavior/
  );
  assert.doesNotMatch(
    collisionEngine,
    /activeReorderBehavior[\s\S]*?===\s*"self-only"/
  );
  assert.doesNotMatch(
    collisionEngine,
    /sortablePointerHits[\s\S]*?!isIXIDropOnTargetId/
  );
  assert.doesNotMatch(
    collisionEngine,
    /sortableContainers[\s\S]*?!isIXIDropOnTargetId/
  );
  assert.match(
    collisionEngine,
    /acceptance engine already rejects self-drop[\s\S]*?container nesting impossible/
  );
  assert.match(
    dropAcceptanceEngine,
    /isSystemIndexObject\(dragData\)[\s\S]*?isSystemIndexObject\(target\)[\s\S]*?reason: "system-index-nesting"/
  );
  assert.match(
    dropAcceptanceEngine,
    /metadata\.rootContainer === true[\s\S]*?metadata\.hierarchyRole/
  );
  assert.match(
    board,
    /dragData=\{\{[\s\S]*?metadata:[\s\S]*?item\?\.metadata/
  );
  assert.doesNotMatch(
    dropAcceptanceEngine,
    /acceptedObjectTypes\.length === 0[\s\S]{0,220}system-index-nesting/
  );
});

test("desktop container drops land immediately through operation-scoped session persistence", () => {
  assert.match(
    work,
    /workspaceSessionControllerRef = useRef\(null\)/
  );
  const naturalDrop = work.indexOf("ONE OBJECT / MANY RELATIONSHIPS / ONE VISUAL PLACEMENT");
  const dragRelease = work.indexOf("setActiveDndId(null)", naturalDrop);
  const sessionConnect = work.indexOf("controller.connect({", dragRelease);
  const operationCompletion = work.indexOf("void operation.completion", sessionConnect);

  assert.ok(naturalDrop >= 0);
  assert.ok(dragRelease > naturalDrop);
  assert.ok(sessionConnect > dragRelease);
  assert.ok(operationCompletion > sessionConnect);
  assert.match(
    work,
    /const operation = controller\.connect\(\{[\s\S]*?nextPlacements,[\s\S]*?objectId: sourceObject\.objectId/
  );
  assert.doesNotMatch(work, /workspaceLayoutSaveQueueRef/u);
  assert.doesNotMatch(work, /previousPlacements/u);
  const controller = read("components/ixi-mos/workspace/IXIAosWorkspaceSessionController.mjs");
  assert.match(controller, /function rollbackLocal\(operationId\)/u);
  assert.match(controller, /objectEpoch\.get\(record\.objectId\) !== record\.epoch/u);
  assert.match(controller, /objectIds:\s*\[sourceId\]/u);
  assert.match(
    machineStateClient,
    /requestVersion=\$\{requestVersion\}/
  );
  assert.match(
    machineStateClient,
    /cache: "no-store"/
  );
  assert.doesNotMatch(work, /hasLoadedRemoteIxiState/u);
  assert.match(work, /controller\.admitObjects\(descriptors\)/u);
  assert.match(work, /setWorkspaceSessionReady\(true\)/u);
});

test("every universal AOS container mounts a visible accepting target", () => {
  assert.match(
    workspaceBoard,
    /isSystemIndexPresentation\(item\)[\s\S]*?isMosWorkspaceObject\(item\)/
  );
  assert.match(
    workspaceBoard,
    /if \(isMosWorkspaceObject\(item\)\)[\s\S]*?enabled: true/
  );
  assert.match(workspaceRegistry, /for \(const \[objectId, admittedObject\] of admission\.objectsById\)/);
  assert.doesNotMatch(workspaceRegistry, /canCreate:\s*true/);
  assert.doesNotMatch(
    objectCreation,
    /Destination object does not allow child creation/
  );
  assert.match(
    operatingCardRuntime,
    /workspaceDropPolicy[\s\S]*?<IXIContainerDropTarget/
  );
  assert.match(
    numberedObjectConsole,
    /workspaceDropPolicy[\s\S]*?const shared = \{[\s\S]*?workspaceDropPolicy/
  );
  assert.match(
    card018,
    /<IXISystemIndexCard[\s\S]*?workspaceDropPolicy=\{workspaceDropPolicy\}/
  );
  assert.match(
    card018,
    /system-index-card\.ixi-container-drop-accepting[\s\S]*?rgba\(255,196,0,1\)!important[\s\S]*?0 0 24px rgba\(255,196,0,\.68\)[\s\S]*?important/
  );
  assert.match(
    containerDropTarget,
    /<IXIObjectDropTarget/
  );
  assert.match(
    containerDropTarget,
    /isDropAccepting[\s\S]*?ixi-container-drop-accepting/
  );
  assert.match(
    containerDropTarget,
    /outline: 2px solid rgba\(255, 196, 0, \.80\)[\s\S]*?0 0 24px rgba\(255, 196, 0, \.68\)/
  );
});

test("durable AOS containers wire BOARD, RECALL, and RETURN to the operating runtime", () => {
  assert.match(
    workspaceBoard,
    /workspaceDropSurface=\{`container:\$\{id\}`\}[\s\S]*?onBoard=\{\(\) =>[\s\S]*?onExposeContainerChildren/
  );
  assert.match(
    workspaceBoard,
    /workspaceDropSurface=\{`container:\$\{id\}`\}[\s\S]*?onRecall=\{\(\) =>[\s\S]*?onGatherContainerChildren/
  );
  assert.match(
    workspaceBoard,
    /workspaceDropSurface=\{`container:\$\{id\}`\}[\s\S]*?onReturn=\{\(\) =>[\s\S]*?onReturnContainerChildren/
  );
  assert.doesNotMatch(
    workspaceBoard,
    /workspaceDropSurface=\{`container:\$\{id\}`\}[\s\S]{0,1800}onExposeContents=/
  );
});

test("legacy clear-to-parent mutation is not connected to AOS Work", () => {
  assert.match(identityFace, /data-ixi-clear-to-parent/);
  assert.doesNotMatch(work, /clearContainerChildrenToParent/);
  assert.doesNotMatch(work, /commitMosContainerPlacement/);
  assert.doesNotMatch(work, /onClearContainerToParent=\{/);
});

test("System Index parent safety restores workspace visibility and preserves children", () => {
  assert.match(
    workspaceRegistry,
    /Recovery invariant:[\s\S]*?System Index can never disappear inside another[\s\S]*?recoveredSystemIndexes/
  );
  assert.match(
    workspaceRegistry,
    /excludePeerSystemIndexMembers/
  );
  assert.match(
    workspaceRegistry,
    /objectType: projectedIndex \? "system-index" : admittedObject\.objectType/
  );
  assert.match(
    work,
    /reconcilePeerSystemIndexesToBoard\(\{[\s\S]*?captureUndo: false[\s\S]*?SYSTEM INDEX RESTORED TO BOARD · CHILDREN PRESERVED/
  );
  assert.doesNotMatch(work, /automaticRepair: true/);
  assert.doesNotMatch(work, /aos-system-index-peer-containment-repair/);
  assert.match(
    workspaceBoard,
    /onDetachFromParent=[\s\S]*?onDetachContainerFromParents\(commandTarget\)/
  );
  assert.match(
    card018,
    /onDetachFromParent = null[\s\S]*?<IXIAosCardHeaderControls[\s\S]*?onDetachFromParent=/
  );
  assert.match(
    work,
    /equipmentWorkspaceIndex\?\.objectId/
  );
  assert.match(
    work,
    /pinSystemIndexToBoard\(\{[\s\S]*?objectId: equipmentObjectId/
  );
  assert.match(
    work,
    /aos-pin-equipment-board[\s\S]*?objectIds: \[equipmentObjectId\][\s\S]*?captureUndo: false/
  );
  assert.match(
    work,
    /getNestedRootSystemIndexObjectIds\(\{[\s\S]*?aosWorkspaceAdmission\.objectsById\.values\(\)/
  );
  assert.match(
    work,
    /aos-pin-root-system-indexes-board[\s\S]*?objectIds: nestedRootSystemIndexObjectIds[\s\S]*?captureUndo: false/
  );
  assert.match(
    work,
    /getInvalidAosSystemIndexMemberships\(\{[\s\S]*?relationships: aosRelationships[\s\S]*?systemIndexObjectIds/
  );
  assert.match(
    work,
    /aos-end-peer-system-index-membership[\s\S]*?reason: "aos-peer-system-index-nesting-prohibited"[\s\S]*?preserveChildren: true/
  );
  assert.match(
    work,
    /fetchMosObjectRelationships\(sourceObjectId[\s\S]*?IX Core did not confirm the peer System Index release/
  );
  assert.match(
    work,
    /parentObject: targetWorkspaceObject[\s\S]*?memberObject: sourceObject/
  );
  assert.doesNotMatch(
    work,
    /displayName[^\n]*WORKFORCE|label[^\n]*WORKFORCE/
  );
});


test("System Index reconciliation removes only the peer-index edge and projection", () => {
  const objectIds = [
    "object_locations",
    "object_workforce",
    "object_equipment",
    "object_yard",
    "object_person",
    "object_machine"
  ];
  const admission = {
    objectsById: new Map(objectIds.map(objectId => [objectId, {
      objectId,
      metadata: objectId === "object_locations" || objectId === "object_workforce"
        ? { rootContainer: true }
        : {},
      objectType: objectId === "object_equipment"
        ? "system-index"
        : "generic"
    }])),
    resolveObjectId(reference) {
      const objectId = String(reference || "").trim();
      return this.objectsById.has(objectId) ? objectId : "";
    }
  };
  const membership = ({
    relationshipId,
    sourceObjectId,
    targetObjectId
  }) => ({
    relationshipId,
    sourceObjectId,
    targetObjectId,
    sourcePassportId: `passport_${sourceObjectId}`,
    targetPassportId: `passport_${targetObjectId}`,
    behaviorId: "aos.rail-membership.v1",
    status: "active",
    revision: 1
  });
  objectIds.forEach(objectId => {
    admission.objectsById.get(objectId).passportId = `passport_${objectId}`;
  });
  const relationships = [
    membership({
      relationshipId: "relationship_workforce",
      sourceObjectId: "object_workforce",
      targetObjectId: "object_locations"
    }),
    membership({
      relationshipId: "relationship_equipment",
      sourceObjectId: "object_equipment",
      targetObjectId: "object_workforce"
    }),
    membership({
      relationshipId: "relationship_yard",
      sourceObjectId: "object_yard",
      targetObjectId: "object_locations"
    }),
    membership({
      relationshipId: "relationship_person",
      sourceObjectId: "object_person",
      targetObjectId: "object_workforce"
    }),
    membership({
      relationshipId: "relationship_machine",
      sourceObjectId: "object_machine",
      targetObjectId: "object_equipment"
    })
  ];

  const invalid = getInvalidAosSystemIndexMemberships({
    relationships,
    systemIndexObjectIds: [
      "object_locations",
      "object_workforce",
      "object_equipment"
    ],
    admission
  });

  assert.deepEqual(
    invalid.map(relationship => relationship.relationshipId),
    ["relationship_workforce", "relationship_equipment"]
  );

  const nextProjections = removeAosRailProjectionMemberships({
    railProjections: {
      object_locations: {
        members: [
          { objectId: "object_workforce" },
          { objectId: "object_yard" }
        ]
      },
      object_workforce: {
        members: [
          { objectId: "object_equipment" },
          { objectId: "object_person" }
        ]
      },
      object_equipment: {
        members: [
          { objectId: "object_machine" }
        ]
      }
    },
    memberships: invalid,
    admission
  });

  assert.deepEqual(
    nextProjections.object_locations.members.map(member => member.objectId),
    ["object_yard"]
  );
  assert.deepEqual(
    nextProjections.object_workforce.members.map(member => member.objectId),
    ["object_person"]
  );
  assert.deepEqual(
    nextProjections.object_equipment.members.map(member => member.objectId),
    ["object_machine"]
  );
  assert.deepEqual(
    relationships.map(relationship => relationship.relationshipId),
    [
      "relationship_workforce",
      "relationship_equipment",
      "relationship_yard",
      "relationship_person",
      "relationship_machine"
    ]
  );
});

test("targeted cleanup selects only requested active members of one canonical owner", () => {
  const objectIds = [
    "object_locations",
    "object_ripper",
    "object_kanyon",
    "object_yard",
    "object_equipment"
  ];
  const admission = {
    objectsById: new Map(objectIds.map(objectId => [objectId, {
      objectId,
      passportId: `passport_${objectId}`
    }])),
    resolveObjectId(reference) {
      const objectId = String(reference || "").trim();
      return this.objectsById.has(objectId) ? objectId : "";
    }
  };
  const relationship = ({ relationshipId, sourceObjectId, targetObjectId }) => ({
    relationshipId,
    sourceObjectId,
    sourcePassportId: `passport_${sourceObjectId}`,
    targetObjectId,
    targetPassportId: `passport_${targetObjectId}`,
    behaviorId: "aos.rail-membership.v1",
    status: "active"
  });
  const relationships = [
    relationship({
      relationshipId: "relationship-ripper-locations",
      sourceObjectId: "object_ripper",
      targetObjectId: "object_locations"
    }),
    relationship({
      relationshipId: "relationship-kanyon-locations",
      sourceObjectId: "object_kanyon",
      targetObjectId: "object_locations"
    }),
    relationship({
      relationshipId: "relationship-yard-locations",
      sourceObjectId: "object_yard",
      targetObjectId: "object_locations"
    }),
    relationship({
      relationshipId: "relationship-ripper-equipment",
      sourceObjectId: "object_ripper",
      targetObjectId: "object_equipment"
    })
  ];

  const selected = getAosMembershipRelationships({
    relationships,
    parentObjectId: "object_locations",
    memberObjectIds: ["object_ripper", "object_kanyon"],
    admission
  });

  assert.deepEqual(
    selected.map(item => item.relationshipId),
    ["relationship-ripper-locations", "relationship-kanyon-locations"]
  );
});

test("exact legacy relationship repair cannot select a different Ripper relationship", () => {
  const objects = [
    { objectId: "object_locations", passportId: "IXILOCATIONS" },
    { objectId: "object_equipment", passportId: "IXIEQUIPMENT" },
    { objectId: "object_ripper", passportId: "IXIRIPPER" }
  ];
  const admission = {
    objectsById: new Map(objects.map(object => [object.objectId, object])),
    resolveObjectId(reference) {
      const cleanReference = String(reference || "").trim();
      const byObjectId = this.objectsById.get(cleanReference);
      if (byObjectId) return byObjectId.objectId;
      return objects.find(object => object.passportId === cleanReference)?.objectId || "";
    }
  };
  const relationships = [
    {
      relationshipId: "relationship_ripper_locations",
      sourceObjectId: "object_ripper",
      sourcePassportId: "IXIRIPPER",
      targetObjectId: "object_locations",
      targetPassportId: "IXILOCATIONS",
      legacyType: "contained-in",
      status: "active",
      revision: 4
    },
    {
      relationshipId: "relationship_ripper_equipment",
      sourceObjectId: "object_ripper",
      sourcePassportId: "IXIRIPPER",
      targetObjectId: "object_equipment",
      targetPassportId: "IXIEQUIPMENT",
      behaviorId: "aos.rail-membership.v1",
      status: "active",
      revision: 8
    }
  ];

  const exact = getExactActiveAosRelationship({
    relationships,
    relationshipId: "relationship_ripper_locations",
    sourceObjectId: "object_ripper",
    targetObjectId: "object_locations",
    admission
  });

  assert.equal(exact?.relationshipId, "relationship_ripper_locations");
  assert.equal(exact?.legacyType, "contained-in");
  assert.equal(exact?.revision, 4);
  assert.equal(
    getExactActiveAosRelationship({
      relationships,
      relationshipId: "relationship_ripper_locations",
      sourceObjectId: "object_ripper",
      targetObjectId: "object_equipment",
      admission
    }),
    null
  );
});

test("work repairs only the exact deployed Ripper to Locations edge", () => {
  assert.match(
    work,
    /relationship_efb98dc5-cad0-4d51-90c0-90fa558d9696/
  );
  assert.match(
    work,
    /getExactActiveAosRelationship\(\{[\s\S]*?relationshipId,[\s\S]*?sourceObjectId,[\s\S]*?targetObjectId,[\s\S]*?admission: aosWorkspaceAdmission/
  );
  assert.match(
    work,
    /aos-exact-ripper-direct-locations-membership-repair/
  );
  assert.match(
    work,
    /preserveAllOtherRelationships: true/
  );
});

test("legacy root metadata identifies peer System Indexes and blocks new membership writes", async () => {
  const workforce = {
    objectId: "object_workforce",
    objectType: "generic",
    metadata: { rootContainer: true }
  };
  const locations = {
    objectId: "object_locations",
    objectType: "generic",
    metadata: { hierarchyRole: "index" }
  };

  assert.equal(isExplicitAosSystemIndexObject(workforce), true);
  assert.equal(isExplicitAosSystemIndexObject(locations), true);

  let transportCalled = false;
  await assert.rejects(
    createAosMembershipRelationship({
      createRelationship: async () => {
        transportCalled = true;
        return {};
      },
      parentObjectId: locations.objectId,
      parentPassportId: "passport_locations",
      parentObject: locations,
      memberObjectId: workforce.objectId,
      memberPassportId: "passport_workforce",
      memberObject: workforce,
      orderKey: "000100"
    }),
    error => error?.code === "IXI_AOS_SYSTEM_INDEX_NESTING_PROHIBITED"
  );
  assert.equal(transportCalled, false);

  const person = {
    objectId: "object_person",
    objectType: "person",
    metadata: {}
  };
  const result = await createAosMembershipRelationship({
    createRelationship: async request => {
      transportCalled = true;
      return request;
    },
    parentObjectId: workforce.objectId,
    parentPassportId: "passport_workforce",
    parentObject: workforce,
    memberObjectId: person.objectId,
    memberPassportId: "passport_person",
    memberObject: person,
    orderKey: "000200"
  });
  assert.equal(transportCalled, true);
  assert.equal(result.sourceObjectId, person.objectId);
  assert.equal(result.targetObjectId, workforce.objectId);
});
