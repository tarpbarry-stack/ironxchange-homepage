import assert from "node:assert/strict";
import { createRequire } from "node:module";
import path from "node:path";
import test from "node:test";
import { isExplicitAosSystemIndexObject, evaluateAosSystemIndexMembership, getAosSystemIndexMembershipPolicy } from "../lib/mos/IXIAosSystemIndexMembershipPolicy.js";
import { canIXIObjectAcceptDrop } from "../components/ixi-chassis/IXIDropAcceptanceEngine.js";

const coreRoot = process.env.IXI_CORE_CONTRACT_ROOT;
test("frontend, drag acceptance and IX-Core agree across appearance and structural variants", {
  skip: coreRoot ? false : "Run the required paired gate with IXI_CORE_CONTRACT_ROOT."
}, () => {
  const require = createRequire(path.join(path.resolve(coreRoot), "package.json"));
  const core = require("./mos/relationships/aosSystemIndexMembershipPolicy.js");
  const appearanceVariants = [
    {}, { cardTemplateSlug: "ixi-system-index-v1" }, { templateId: "ixi-system-index-v1" },
    { cardTemplateSlug: "aos-card-007", metadata: { systemIndexPresentation: true } },
    { cardTemplateSlug: "aos-card-018", metadata: { systemAdapter: true } },
    { metadata: { templateId: "ixi-system-index-v1", cardTemplateId: "ixi-system-index-v1" } }
  ];
  const structuralVariants = [
    { objectType: "person" }, { objectType: "machine" }, { objectType: "generic" },
    { objectType: "system-index" },
    ...[{ systemIndex: true }, { isSystemIndex: true }, { hierarchyRole: "index" }, { rootContainer: true }]
      .map(metadata => ({ objectType: "generic", metadata }))
  ];
  const parent = { objectId: "parent", objectType: "container", workspaceDropPolicy: { enabled: true } };
  for (const structure of structuralVariants) {
    const expected = core.isExplicitAosSystemIndexObject(structure);
    for (const appearance of appearanceVariants) {
      const object = { ...structure, ...appearance, objectId: "member", metadata: { ...structure.metadata, ...appearance.metadata } };
      assert.equal(isExplicitAosSystemIndexObject(object), expected);
      assert.equal(core.isExplicitAosSystemIndexObject(object), expected);
      assert.equal(evaluateAosSystemIndexMembership({ sourceObject: object, targetObject: parent }).allowed, !expected);
      assert.equal(core.evaluateAosRailMembership({ sourceObject: object, targetObject: parent }).allowed, !expected);
      assert.equal(canIXIObjectAcceptDrop({ dragData: object, target: parent }).accepted, !expected);
    }
  }
});

test("Equipment presentation aliases do not confer its membership policy", () => {
  for (const index of [
    { objectType: "system-index", indexId: "equipment", metadata: { systemAdapter: true } },
    { objectId: "system-index:equipment", objectType: "system-index" },
    { objectType: "system-index", metadata: { adapterId: "equipment" } },
    { objectType: "system-index", metadata: { adapterId: "system-index:equipment" } }
  ]) assert.equal(getAosSystemIndexMembershipPolicy(index), null);
  const equipment = { objectType: "system-index", metadata: { adapterId: "ixi-owned-equipment" } };
  assert.deepEqual(getAosSystemIndexMembershipPolicy(equipment).allowedObjectTypes, ["machine"]);
});
