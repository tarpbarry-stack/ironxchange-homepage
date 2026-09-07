import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

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

test("container sources can enter accepted parent containers without moving the targets", () => {
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
});

test("desktop container drops land immediately while persistence stays ordered", () => {
  assert.match(
    work,
    /workspaceLayoutSaveQueueRef = useRef\([\s\S]*?Promise\.resolve\(\)/
  );
  assert.doesNotMatch(
    work,
    /const layoutResult = await saveWorkspaceLayout\([\s\S]*?nextPlacements[\s\S]*?\)/
  );
  assert.match(
    work,
    /void saveWorkspaceLayout\([\s\S]*?nextPlacements[\s\S]*?\)\.then/
  );
  const naturalDrop = work.indexOf("APPROVED NATURAL DROP CONTRACT");
  const visualLanding = work.indexOf("setWorkspacePlacements(", naturalDrop);
  const dragRelease = work.indexOf("setActiveDndId(null)", visualLanding);
  const backgroundPersistence = work.indexOf("void (async () =>", dragRelease);
  const canonicalCommit = work.indexOf("await commitMosContainerPlacement", backgroundPersistence);

  assert.ok(naturalDrop >= 0);
  assert.ok(visualLanding > naturalDrop);
  assert.ok(dragRelease > visualLanding);
  assert.ok(backgroundPersistence > dragRelease);
  assert.ok(canonicalCommit > backgroundPersistence);
  assert.match(
    work,
    /A real IX Core rejection restores the exact pre-drop state[\s\S]*?setWorkspacePlacements\([\s\S]*?previousPlacements/
  );
  assert.match(
    machineStateClient,
    /requestVersion=\$\{requestVersion\}/
  );
  assert.match(
    machineStateClient,
    /cache: "no-store"/
  );
  assert.match(
    work,
    /hasLoadedRemoteIxiState[\s\S]*?setHasLoadedRemoteIxiState\(true\)/
  );
  assert.match(
    work,
    /if \(!hasLoadedRemoteIxiState\)[\s\S]*?return;/
  );
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
  assert.match(
    workspaceRegistry,
    /UNIVERSAL AOS OBJECT LAW[\s\S]*?canContain: true[\s\S]*?canCreate: true/
  );
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
