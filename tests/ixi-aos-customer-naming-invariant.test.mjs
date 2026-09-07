import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import {
  getAosObjectDisplayName
} from "../components/ixi-mos/system-index/IXISystemIndexPresentationEngine.js";

test("AOS presentation uses customer wording and does not manufacture an Object name", () => {
  assert.equal(
    getAosObjectDisplayName({
      displayName: "Whatever The Owner Calls This"
    }),
    "Whatever The Owner Calls This"
  );
  assert.equal(getAosObjectDisplayName({}), "");
});

test("durable creation rejects platform placeholder names", () => {
  const source = fs.readFileSync(
    new URL("../lib/mos/ixiAosObjectCommit.js", import.meta.url),
    "utf8"
  );
  assert.match(source, /"UNTITLED CARD"/u);
  assert.match(source, /"NEW CARD"/u);
  assert.match(source, /AOS_OBJECT_CUSTOMER_NAME_REQUIRED/u);
  assert.match(source, /Give this card a name before permanent creation\./u);
});

test("live AOS editors use neutral card language instead of imposing Object naming", () => {
  const files = [
    "components/ixi-aos/cards/generic/IXIAosGenericStructuralContainer017.jsx",
    "components/ixi-aos/cards/generic/IXIAosGenericMetricDominant011.jsx",
    "components/ixi-aos/cards/generic/IXIAosGenericObjectLayout007.jsx",
    "components/ixi-aos/cards/generic/IXIAosGenericSequence016.jsx",
    "components/ixi-aos/cards/generic/IXIAosGenericContainerLayoutV12.jsx",
    "components/ixi-aos/cards/generic/IXIAosGenericLifecycle012.jsx",
    "components/ixi-aos/cards/generic/IXIAosGenericAgreement015.jsx",
    "components/ixi-aos/cards/generic/IXIAosGenericContentDominant013.jsx",
    "components/ixi-aos/cards/generic/IXIAosGenericCondition014.jsx",
    "components/ixi-aos/cards/generic/IXIAosGenericUniversalLayout007.jsx",
    "components/ixi-aos/cards/generic/IXIAosGenericMediaDominant009.jsx",
    "components/ixi-aos/cards/generic/IXIAosGenericDataDominant010.jsx"
  ];

  for (const file of files) {
    const source = fs.readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
    assert.doesNotMatch(source, /EDIT OBJECT|OBJECT NAME|DISPLAY NAME/u, file);
    assert.match(source, /EDIT CARD|<span>NAME<\/span>/u, file);
  }
});
