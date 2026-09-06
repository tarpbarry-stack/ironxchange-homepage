import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  formatAosCardNumber,
  getSelectableAosSystemTemplates,
  isCompleteAosSystemTemplateSet
} from "../lib/mos/ixiAosSystemObjectTemplateContract.mjs";


function templates() {
  return Array.from(
    { length: 17 },
    (_, index) => ({
      templateNumber: index + 1,
      templateSlug:
        index === 0
          ? "location-standard"
          : `aos-card-${String(index + 1).padStart(3, "0")}`
    })
  );
}


test("system object picker exposes exactly cards 001 through 017", () => {
  const source = [
    ...templates().reverse(),
    {
      templateNumber: 9,
      templateSlug: "aos-card-009b"
    },
    {
      templateNumber: 1,
      templateSlug: "duplicate-001"
    }
  ];

  const selected =
    getSelectableAosSystemTemplates(source);

  assert.equal(selected.length, 17);
  assert.deepEqual(
    selected.map(item => item.templateNumber),
    Array.from({ length: 17 }, (_, index) => index + 1)
  );
  assert.equal(isCompleteAosSystemTemplateSet(selected), true);
  assert.equal(formatAosCardNumber(7), "007");
});


test("an incomplete card library is rejected", () => {
  assert.equal(
    isCompleteAosSystemTemplateSet(
      templates().slice(0, 16)
    ),
    false
  );
});


test("AOS Work routes scoreboard plus through template selection and draft provisioning", async () => {
  const page = await readFile(
    new URL("../pages/aos/work.js", import.meta.url),
    "utf8"
  );
  const creationHook = await readFile(
    new URL(
      "../components/ixi-mos/object-creation/useIXIMosObjectCreation.js",
      import.meta.url
    ),
    "utf8"
  );
  const picker = await readFile(
    new URL(
      "../components/ixi-mos/object-creation/IXIAosSystemObjectTemplatePicker.jsx",
      import.meta.url
    ),
    "utf8"
  );
  const catalogPreview = await readFile(
    new URL(
      "../components/ixi-aos-card-library/IXIAosCardCatalogPreview.jsx",
      import.meta.url
    ),
    "utf8"
  );

  assert.match(page, /IXIAosSystemObjectTemplatePicker/u);
  assert.match(page, /onAdd=\{\s*\(\) => openSystemObjectTemplatePicker\(\)/u);
  assert.match(page, /isAosDraftId\(objectId\)/u);
  assert.match(page, /saveMosObjectName\(\{/u);
  assert.doesNotMatch(
    page,
    /parentDisplayName:\s*String\(\s*aosEntity/u
  );
  assert.match(picker, /previewScaleMode="work"/u);
  assert.match(picker, /showScaleControl=\{false\}/u);
  assert.match(catalogPreview, /scaleMode: previewScaleMode/u);
  assert.match(creationHook, /function createRootContainerDraft/u);
  assert.match(creationHook, /objectType:\s*"container"/u);
  assert.match(creationHook, /rootContainer:\s*true/u);
  assert.match(
    creationHook,
    /parentDisplayName:\s*IXI_AOS_SYSTEM_INDEX_LABEL/u
  );
  assert.match(creationHook, /provisionPermanentObject\(\{/u);
});


test("every AOS card plus opens the same 001-017 selector for a child", async () => {
  const [page, creationHook, picker] = await Promise.all([
    readFile(
      new URL("../pages/aos/work.js", import.meta.url),
      "utf8"
    ),
    readFile(
      new URL(
        "../components/ixi-mos/object-creation/useIXIMosObjectCreation.js",
        import.meta.url
      ),
      "utf8"
    ),
    readFile(
      new URL(
        "../components/ixi-mos/object-creation/IXIAosSystemObjectTemplatePicker.jsx",
        import.meta.url
      ),
      "utf8"
    )
  ]);

  assert.match(
    page,
    /function openChildContainerTemplatePicker\(\s*parentObject\s*\)[\s\S]*?openSystemObjectTemplatePicker\(\s*parentObject\s*\)/u
  );
  assert.match(
    page,
    /onAddObject=\{\s*openChildContainerTemplatePicker\s*\}/u
  );
  assert.match(
    page,
    /onCreateObjectChild=\{\s*openChildContainerTemplatePicker\s*\}/u
  );
  assert.match(
    page,
    /parentObject=\{systemObjectPickerParent\}/u
  );
  assert.match(
    page,
    /onCreate=\{createSelectedContainerTemplate\}/u
  );
  assert.doesNotMatch(
    page,
    /displayName:\s*"NEW OBJECT"/u
  );

  assert.match(
    creationHook,
    /function createChildContainerDraft/u
  );
  assert.match(
    creationHook,
    /createdInsideContainerId:\s*destinationContainerId/u
  );
  assert.match(
    creationHook,
    /parentObjectId:\s*destinationContainerId/u
  );
  assert.match(
    creationHook,
    /createChildContainerDraft,/u
  );

  assert.match(picker, /parentObject = null/u);
  assert.match(picker, /SELECT CHILD CONTAINER CARD/u);
  assert.match(picker, /parentLabel=\{parentName\}/u);
});


test("all numbered cards discard an unsaved creation draft on Cancel", async () => {
  const cards = [
    "001/IXIAosCard001Location.jsx",
    "002/IXIAosCard002Location.jsx",
    "003/IXIAosCard003Location.jsx",
    "004/IXIAosCard004Personnel.jsx",
    "005/IXIAosCard005Personnel.jsx",
    "006/IXIAosCard006Personnel.jsx",
    "007/IXIAosCard007EmployeeApplication.jsx",
    "008/IXIAosCard008Profile.jsx",
    "009/IXIAosCard009.jsx",
    "010/IXIAosCard010.jsx",
    "011/IXIAosCard011.jsx",
    "012/IXIAosCard012.jsx",
    "013/IXIAosCard013.jsx",
    "014/IXIAosCard014.jsx",
    "015/IXIAosCard015.jsx",
    "016/IXIAosCard016.jsx",
    "017/IXIAosCard017.jsx"
  ];

  for (const card of cards) {
    const source = await readFile(
      new URL(
        `../components/ixi-aos/cards/${card}`,
        import.meta.url
      ),
      "utf8"
    );

    assert.match(
      source,
      /onCancelDraft=\{contractProps\.onDeleteObject\}/u,
      card
    );
  }
});
