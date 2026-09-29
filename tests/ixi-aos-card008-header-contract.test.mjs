import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const card008 = fs.readFileSync(
  new URL("../components/ixi-aos/cards/008/IXIAosCard008Profile.jsx", import.meta.url),
  "utf8"
);
const genericObject = fs.readFileSync(
  new URL("../components/ixi-aos/cards/generic/IXIAosGenericObjectLayout007.jsx", import.meta.url),
  "utf8"
);
const headerIdentity = fs.readFileSync(
  new URL("../components/ixi-aos/card-runtime/modules/IXIAosCardHeaderIdentity.jsx", import.meta.url),
  "utf8"
);

test("Card 008 opts into a live display-name header beneath its parent line", () => {
  assert.match(card008, /<IXIAosGenericObjectLayout007[^>]*showHeaderDisplayName/u);
  assert.match(genericObject, /showHeaderDisplayName = false/u);
  assert.match(genericObject, /showHeaderDisplayName \? <strong title=\{displayName\}>\{displayName\}<\/strong> : null/u);
});

test("Card 008 shows the employee identifier in the profile body without a duplicate corner identifier", () => {
  assert.match(card008, /<IXIAosDataContractCardAdapter \{\.\.\.props\} showBusinessIdentifier=\{false\}>/u);
  assert.match(card008, /<IXIAosCardHeaderIdentity object=\{runtimeObject\} showPassportIdentity=\{false\}>/u);
  assert.match(headerIdentity, /showPassportIdentity = true/u);
  assert.match(headerIdentity, /\{showPassportIdentity \? <span className="ixi-aos-header-ixi-number">IXI - \{getAosPassportDisplaySerial\(object\)\}<\/span> : null\}/u);
  assert.match(genericObject, /presentationFields\.identifier \? <div className="go007-fact"><small>\{presentationFields\.identifier\.label\}<\/small><strong>\{fieldValueText\(runtimeObject, presentationFields\.identifier\)\}<\/strong><\/div> : null/u);
});

test("Card 008's second header line remains bounded inside the native header", () => {
  assert.match(genericObject, /\.go007-header-copy span,\.go007-header-copy strong\{[^}]*max-width:145px[^}]*text-overflow:ellipsis/u);
  assert.match(genericObject, /\.go007-header-copy strong\{[^}]*font-size:11px[^}]*font-weight:950/u);
});
