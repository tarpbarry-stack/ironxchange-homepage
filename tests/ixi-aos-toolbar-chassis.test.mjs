import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import {
  AOS_TOOLBAR_SURFACES, getAosToolbarContents, getAosToolbarObjectIds,
  getAosToolbarReturnOperation, isAosToolbarSurface
} from "../components/ixi-mos/workspace/IXIAosToolbarModel.mjs";
import { evaluateAosSystemIndexMembership } from "../lib/mos/IXIAosSystemIndexMembershipPolicy.js";
import { moveObjectToWorkspaceSurface } from "../components/ixi-chassis/IXIWorkspacePlacementEngine.js";

test("both toolbars preserve all six legacy parking surfaces without rewriting placement or contents", () => {
  const placements = { board: ["object_board"], pocketLeft: ["object_a"], pocketLeft2: ["object_b"],
    stackTop: ["object_c"], pocketRight: ["object_d"], pocketRight2: ["object_e"], stackBottom: ["object_f"],
    [AOS_TOOLBAR_SURFACES.left]: ["object_new"], "container:object_yard": ["object_machine"] };
  const before = structuredClone(placements);
  assert.deepEqual(getAosToolbarObjectIds(placements, "left"), ["object_new", "object_a", "object_b", "object_c"]);
  assert.deepEqual(getAosToolbarObjectIds(placements, "right"), ["object_d", "object_e", "object_f"]);
  assert.equal(isAosToolbarSurface("container:object_yard"), false);
  assert.equal(isAosToolbarSurface(AOS_TOOLBAR_SURFACES.left), true);
  assert.deepEqual(placements, before);
  const registry = new Map([["object_machine", { objectId: "object_machine" }], ["object_a", { objectId: "object_a" }]]);
  assert.deepEqual(getAosToolbarContents({ itemObjectIds: ["object_machine", "object_no_authority"] }, registry), [{ objectId: "object_machine" }]);
  assert.deepEqual(placements, before);
});

test("a single toolbar Return cannot silently undo a container's group movement", () => {
  const session = { objects: {
    object_a: { returnSnapshot: { operationId: "group-board" } },
    object_b: { returnSnapshot: { operationId: "group-board" } }
  } };
  assert.equal(getAosToolbarReturnOperation(session, "object_a"), "");
  session.objects.object_a.returnSnapshot.operationId = "dock-a";
  assert.equal(getAosToolbarReturnOperation(session, "object_a"), "dock-a");
});

const work = fs.readFileSync(new URL("../pages/aos/work.js", import.meta.url), "utf8");
const source = work.slice(work.indexOf("async function connectAosWorkspaceObjects("), work.indexOf("function moveMachineToContainer("));
const bindConnect = new Function("getCanonicalMosObjectForWorkspaceId", "getAosWorkspaceObjectById",
  "workspaceSessionControllerRef", "workspaceSessionReady", "evaluateAosSystemIndexMembership",
  "moveObjectToWorkspaceSurface", "createAosRailOrderKey", "setAosRelationships", "isAosDraftId",
  source + "\nreturn connectAosWorkspaceObjects;");

test("the shared card/toolbar connect command blocks root nesting and direct Ripper membership in Locations", async () => {
  const locations = { objectId: "object_locations", passportId: "IXILOC2345", objectType: "system-index",
    actorAuthority: { canRelate: true }, metadata: { systemIndexMembershipPolicy: {
      schema: "aos.system-index-membership.v1", enabled: true, allowedObjectTypes: ["location"]
    } } };
  const ripper = { objectId: "object_ripper", passportId: "IXIMAC2345", objectType: "machine", actorAuthority: { canRelate: true } };
  let connected = 0;
  const controller = { readPlacements: () => ({ board: [ripper.objectId] }), connect: () => { connected++; throw new Error("unexpected connect"); } };
  const connect = bindConnect(id => id === ripper.objectId ? ripper : locations, () => locations,
    { current: controller }, true, evaluateAosSystemIndexMembership, moveObjectToWorkspaceSurface,
    String, () => {}, () => false);
  await assert.rejects(connect(ripper.objectId, locations.objectId), /does not accept/);
  await assert.rejects(connect(locations.objectId, "object_other"), /peer roots/);
  assert.equal(connected, 0);
});

test("the shared connect command uses existing identities and publishes only confirmed membership", async () => {
  const machine = { objectId: "object_machine", passportId: "IXIMAC2345", objectType: "machine", actorAuthority: { canRelate: true } };
  const yard = { objectId: "object_yard", passportId: "IXIYAR2345", objectType: "location", actorAuthority: { canRelate: true } };
  const before = structuredClone({ machine, yard });
  let command, relationships = [];
  const controller = { readPlacements: () => ({ board: [machine.objectId] }), connect: request => {
    command = request;
    return { completion: Promise.resolve({ response: { relationship: { relationshipId: "edge_existing" } } }) };
  } };
  const connect = bindConnect(() => machine, () => yard, { current: controller }, true,
    evaluateAosSystemIndexMembership, moveObjectToWorkspaceSurface, String,
    update => { relationships = update(relationships); }, () => false);
  await connect(machine.objectId, yard.objectId);
  assert.equal(command.relationship.memberPassportId, machine.passportId);
  assert.equal(command.relationship.parentPassportId, yard.passportId);
  assert.deepEqual(command.nextPlacements[`container:${yard.objectId}`], [machine.objectId]);
  assert.deepEqual(relationships, [{ relationshipId: "edge_existing" }]);
  assert.deepEqual({ machine, yard }, before);
});
