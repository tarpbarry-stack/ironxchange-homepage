import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import test from "node:test";
import { normalizeOwnedMachineListing } from "../lib/server/onboarding/normalizeOwnedMachineListing.js";

test("server normalization preserves explicit persisted ownership, never inferring it from private visibility", () => {
  const raw = { id: { uuid: "listing-owned" }, attributes: {
    title: "2018 KOMATSU WA500-8", publicData: { machineAccess: "private" }
  } };
  assert.deepEqual(normalizeOwnedMachineListing(raw).ownership, { role: "", status: "" });
  raw.attributes.publicData.ownershipRole = "owner";
  raw.attributes.publicData.ownershipStatus = "owned";
  assert.deepEqual(normalizeOwnedMachineListing(raw).ownership, { role: "owner", status: "owned" });
});

test("persisted owned listing reaches the real Core Equipment projection on creation and retry", () => {
  const coreRoot = process.env.IXI_CORE_CONTRACT_ROOT;
  assert.ok(coreRoot, "The owned-machine contract requires the pinned Core checkout");
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "ixi-owned-machine-pair-"));
  process.env.IXI_MOS_DATA_ROOT = path.join(root, "mos");
  process.env.IXI_PASSPORT_DATA_FILE = path.join(root, "passports.json");
  const requireCore = createRequire(path.join(coreRoot, "package.json"));
  const { ensureCommercialOnboarding } = requireCore("./mos/onboarding/aosCommercialOnboardingService");
  const { provisionSharetribeMachine } = requireCore("./mos/onboarding/sharetribeMachineProvisioningService");
  const { listRelationships } = requireCore("./mos/relationships/relationshipService");
  const { listObjects } = requireCore("./mos/objects/objectService");
  const { buildRailProjectionMap } = requireCore("./mos/accounts/aosEnvironmentService");
  try {
    const owner = ensureCommercialOnboarding({ ownerUserId: "paired-owner", entityDisplayName: "Paired Company" });
    const listing = normalizeOwnedMachineListing({ id: { uuid: "paired-wa500" }, attributes: {
      title: "2018 KOMATSU WA500-8", state: "published", publicData: {
        machineAccess: "private", machineChannel: "none", ownershipRole: "owner", ownershipStatus: "owned"
      }
    } });
    const input = { entityId: owner.entity.entityId, principalId: "paired-owner",
      commandId: "sharetribe-listing:paired-wa500", creationBoundary: "authenticated-listing-admission.v1", listing };
    const first = provisionSharetribeMachine(input);
    const second = provisionSharetribeMachine(input);
    const memberships = listRelationships({ entityId: input.entityId,
      sourceObjectId: first.object.objectId, behaviorId: "aos.rail-membership.v1" });
    assert.equal(memberships.length, 1);
    assert.equal(memberships[0].targetObjectId, first.equipmentMembership.equipmentObjectId);
    const projection = buildRailProjectionMap(memberships, listObjects({ entityId: input.entityId }));
    assert.deepEqual(projection[first.equipmentMembership.equipmentObjectId].members.map(item => item.objectId), [first.object.objectId]);
    assert.equal(second.object.objectId, first.object.objectId);
    assert.equal(second.passport.passportId, first.passport.passportId);
    assert.equal(second.equipmentMembership.changed, false);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
