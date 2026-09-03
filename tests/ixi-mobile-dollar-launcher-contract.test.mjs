import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const page = fs.readFileSync("pages/mobile-aos-foundation.js", "utf8");
const ownerRuntime = fs.readFileSync(
  "components/ixi-machine-card/private/IXIOwnedPrivateListingRuntime.jsx",
  "utf8"
);
const privateCard = fs.readFileSync(
  "components/ixi-machine-card/private/PrivateListingCard.js",
  "utf8"
);
const transactRuntime = fs.readFileSync(
  "components/ixi-machine-card/private/IXIOwnedPrivateTransactRuntime.jsx",
  "utf8"
);

test("mobile AOS certification uses a real private Passport-backed account machine", () => {
  assert.match(page, /\/api\/account-listings\?authorId=/);
  assert.match(page, /access === "private"/);
  assert.match(page, /Boolean\(getPassportId\(listing\)\)/);
  assert.doesNotMatch(page, /machineAccess:\s*"private"/);
  assert.match(page, /No synthetic fallback is permitted/);
});

test("mobile AOS card stays on canonical IXIMachineCard inventory runtime", () => {
  assert.match(page, /<IXIMachineCard/);
  assert.match(page, /cardContext="inventory"/);
  assert.match(page, /sellerMode/);
  assert.match(page, /resolveIXIMobileSingleCardMetrics/);
});

test("existing owner dollar action remains the launcher", () => {
  assert.match(privateCard, /className="owner-action transact"/);
  assert.match(privateCard, /title="TRAN\$ACT"/);
  assert.match(privateCard, /onOpenTransact\?\.\(listing\)/);
  assert.match(ownerRuntime, /onOpenTransact=\{\(\) => !saving && setTransactOpen\(true\)\}/);
  assert.match(ownerRuntime, /if \(transactOpen\)/);
  assert.match(ownerRuntime, /<IXIOwnedPrivateTransactRuntime/);
});

test("TRAN$ACT runtime remains Passport and authority bound", () => {
  assert.match(transactRuntime, /const passportId = clean\(object\?\.passportId\)/);
  assert.match(transactRuntime, /loadIXIAosFinancialAccessContext/);
  assert.match(transactRuntime, /loadIXIAosPassportFinancialDocuments/);
  assert.match(transactRuntime, /onClose=\{onClose\}/);
});
