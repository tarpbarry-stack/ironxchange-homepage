import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import { moveObjectToWorkspaceSurface } from "../components/ixi-chassis/IXIWorkspacePlacementEngine.js";
import { buildAosCanonicalAdmission } from "../lib/mos/ixiAosCanonicalAdmission.mjs";

const read = file => fs.readFileSync(new URL(`../${file}`, import.meta.url), "utf8");

function object(overrides = {}) {
  return {
    objectId: "object-1",
    entityId: "entity-1",
    objectType: "customer-defined",
    passportId: "IXIABC2345",
    permissions: {},
    ...overrides
  };
}

test("every numbered Card 001-018 enters through the shared data contract adapter", () => {
  const paths = [
    "components/ixi-aos/cards/001/IXIAosCard001Location.jsx",
    "components/ixi-aos/cards/002/IXIAosCard002Location.jsx",
    "components/ixi-aos/cards/003/IXIAosCard003Location.jsx",
    "components/ixi-aos/cards/004/IXIAosCard004Personnel.jsx",
    "components/ixi-aos/cards/005/IXIAosCard005Personnel.jsx",
    "components/ixi-aos/cards/006/IXIAosCard006Personnel.jsx",
    "components/ixi-aos/cards/007/IXIAosCard007EmployeeApplication.jsx",
    "components/ixi-aos/cards/008/IXIAosCard008Profile.jsx",
    "components/ixi-aos/cards/009/IXIAosCard009.jsx",
    "components/ixi-aos/cards/010/IXIAosCard010.jsx",
    "components/ixi-aos/cards/011/IXIAosCard011.jsx",
    "components/ixi-aos/cards/012/IXIAosCard012.jsx",
    "components/ixi-aos/cards/013/IXIAosCard013.jsx",
    "components/ixi-aos/cards/014/IXIAosCard014.jsx",
    "components/ixi-aos/cards/015/IXIAosCard015.jsx",
    "components/ixi-aos/cards/016/IXIAosCard016.jsx",
    "components/ixi-aos/cards/017/IXIAosCard017.jsx",
    "components/ixi-aos/cards/018/IXIAosCard018.jsx"
  ];

  paths.forEach(path => assert.match(read(path), /IXIAosDataContractCardAdapter/u, path));
});

test("frontend runtimes do not manufacture create or TRAN$ACT authority", () => {
  const runtime = read("components/ixi-aos/card-runtime/IXIAosOperatingCardRuntime.jsx");
  const registry = read("components/ixi-mos/workspace/useIXIAosWorkspaceRegistry.js");
  const privateMachine = read("components/ixi-machine-card/private/IXIOwnedPrivateListingRuntime.jsx");
  const semantic = read("components/ixi-aos/card-runtime/IXIAosSemanticObjectPresentation.js");

  for (const source of [runtime, registry, privateMachine]) {
    assert.doesNotMatch(source, /canCreate:\s*true/u);
    assert.doesNotMatch(source, /canTransact:\s*true/u);
    assert.doesNotMatch(source, /transactEligible:\s*true/u);
  }
  assert.doesNotMatch(semantic, /canContain[\s\S]{0,80}canCreate/u);
  assert.match(runtime, /actorAuthority\?\.canTransact === true/u);
});

test("movement paths never import or call machine provisioning", () => {
  const work = read("pages/aos/work.js");
  const equipment = read("components/ixi-mos/equipment/useIXIEquipmentWorkspace.js");
  const placement = read("components/ixi-chassis/IXIWorkspacePlacementEngine.js");

  [work, equipment, placement].forEach(source => {
    assert.doesNotMatch(source, /provisionListingMachine/u);
    assert.doesNotMatch(source, /provisionAosObject/u);
    assert.doesNotMatch(source, /objects\/provision/u);
  });
});

test("active AOS movement exposes no legacy direct-container mutation", () => {
  const work = read("pages/aos/work.js");
  const board = read("components/ixi-mos/workspace/IXIAosWorkspaceBoard.jsx");
  const client = read("lib/mos/ixiMosBrowserGatewayClient.js");
  const gateway = read("pages/api/aos/mos/[...path].js");

  for (const source of [work, board, client, gateway]) {
    assert.doesNotMatch(source, /commitMosContainerPlacement/u);
    assert.doesNotMatch(source, /placeMosObject/u);
    assert.doesNotMatch(source, /removeMosObjectFromContainer/u);
  }
  assert.doesNotMatch(board, /directContainerId\s*:/u);
  assert.doesNotMatch(gateway, /containers\\\/\[\^\/\]\+\\\/place/u);
  assert.doesNotMatch(gateway, /remove-from-container/u);
});

test("the broken caller-identified IXI state API is absent from the production source graph", () => {
  assert.equal(
    fs.existsSync(new URL("../pages/api/ixi-state.js", import.meta.url)),
    false
  );
  assert.doesNotMatch(
    read("lib/ixi-store.js"),
    /getUserIxiState|saveUserIxiPatch/u
  );
});

test("movement cannot change canonical object or Passport counts", () => {
  const admission = buildAosCanonicalAdmission({ aosObjects: [object()] });
  const objectCount = admission.objectsById.size;
  const passportCount = admission.passportToObjectId.size;
  const before = { board: ["object-1"], pocketLeft: [] };
  const after = moveObjectToWorkspaceSurface({
    placements: before,
    objectId: "object-1",
    targetSurface: "pocketLeft"
  });

  assert.deepEqual(after, { board: [], pocketLeft: ["object-1"] });
  assert.equal(admission.objectsById.size, objectCount);
  assert.equal(admission.passportToObjectId.size, passportCount);
});

test("active membership logic uses only the governed rail behavior", () => {
  const work = read("pages/aos/work.js");
  const registry = read("components/ixi-mos/workspace/useIXIAosWorkspaceRegistry.js");
  const bridge = read("lib/mos/IXIAosMembershipBridge.mjs");

  assert.doesNotMatch(work, /"contains"/u);
  assert.doesNotMatch(registry, /"contains"/u);
  assert.doesNotMatch(bridge, /["']contains["']/u);
  assert.match(bridge, /aos\.rail-membership\.v1/u);
  assert.match(bridge, /neutralContractAvailable:\s*true/u);
});

test("machine routing is presentation-driven while operating identity remains objectId", () => {
  const board = read("components/ixi-mos/workspace/IXIAosWorkspaceBoard.jsx");
  const registry = read("components/ixi-mos/workspace/useIXIAosWorkspaceRegistry.js");

  assert.match(board, /presentation\?\.kind !== "ixi-private-machine"/u);
  assert.match(board, /return getMosObjectId\(item\) \|\| null/u);
  assert.match(registry, /registry\.set\(objectId/u);
  assert.doesNotMatch(registry, /registry\.set\(\s*id,/u);
});

test("System Index rendering preserves customer titles", () => {
  const board = read("components/ixi-mos/workspace/IXIAosWorkspaceBoard.jsx");

  assert.doesNotMatch(board, /displayName:\s*"EQUIPMENT"/u);
  assert.doesNotMatch(board, /displayName:\s*"LOCATIONS"/u);
  assert.match(board, /displayName:\s*cleanId\(item\?\.displayName/u);
});
