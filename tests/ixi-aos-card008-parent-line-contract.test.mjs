import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

function read(path) {
  return fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

const preview = read(
  "components/ixi-aos-card-library/IXIAosCardCatalogPreview.jsx"
);
const adapter = read(
  "components/ixi-aos/card-runtime/IXIAosDataContractCardAdapter.jsx"
);

test("numbered FaceLab cards receive their canonical catalog parent", () => {
  assert.match(
    preview,
    /const catalogParentLabel = clean\(parentLabel\) \|\| clean\(template\?\.librarySection\) \|\| "AOS"/u
  );
  assert.match(
    preview,
    /const renderNumberedPreview = Card[\s\S]*?<Card[\s\S]*?parentLabel=\{catalogParentLabel\}/u
  );
  assert.match(
    preview,
    /renderNumberedPreview\(NumberedObjectCard\)/u
  );
});

test("Card 008 uses the existing real-parent overlay contract", () => {
  assert.match(adapter, /getAosParentDisplayName\(object, props\?\.parentLabel\)/u);
  assert.match(adapter, /className="ixi-aos-runtime-parent-line"/u);
  assert.match(adapter, /has-real-parent/u);
});
