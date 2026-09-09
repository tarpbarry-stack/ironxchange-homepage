import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import {
  getIXITransactAttentionBand,
  getIXITransactControlCounts,
  groupIXITransactAttention
} from "../components/ixi-command-center/IXIAosCommandCenterModel.js";

const read = path => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("TODAY classifies financial work into explicit operating bands", () => {
  const items = [
    { id: "1", title: "Identity conflict blocks posting" },
    { id: "2", title: "Past due customer invoice" },
    { id: "3", title: "Receipt pending approval" },
    { id: "4", title: "Bank statement unmatched" },
    { id: "5", title: "Period close journal task" },
    { id: "6", title: "Review vendor detail" }
  ];

  assert.deepEqual(items.map(getIXITransactAttentionBand), [
    "BLOCKED",
    "MONEY EXPOSED",
    "WAITING",
    "RECONCILE",
    "CLOSE",
    "REVIEW"
  ]);

  const groups = groupIXITransactAttention(items);
  const counts = getIXITransactControlCounts(items);
  assert.equal(groups.BLOCKED[0].attentionBand, "BLOCKED");
  assert.equal(counts["MONEY EXPOSED"], 1);
  assert.equal(counts.REVIEW, 1);
});

test("desktop remains an authenticated read surface over governed financial contracts", () => {
  const source = read("components/ixi-command-center/IXITransactCommandCenter.jsx");
  const environmentSource = read("lib/mos/loadIXIMosEnvironment.js");

  assert.match(source, /loadIXIMosEnvironment/u);
  assert.match(source, /loadIXIFinancialAccessContext/u);
  assert.match(source, /loadIXITransactDashboard/u);
  assert.match(source, /entityPassportId/u);
  assert.match(source, /accountingPeriod: period/u);
  assert.match(source, /No financial values have been fabricated/u);
  assert.match(source, /Queue completion never substitutes/u);
  assert.match(source, /accessResult\.error\?\.status === 401/u);
  assert.match(source, /onAuthenticatedEnvironment: authenticatedEnvironment/u);
  assert.match(source, /setEnvironment\(authenticatedEnvironment\);[\s\S]*setLoading\(false\);[\s\S]*setContextLoading\(true\)/u);
  assert.match(source, /setEnvironment\(aosResult\);[\s\S]*setContextLoading\(false\);[\s\S]*await accessRequest/u);
  assert.match(source, /COMPANY CONNECTED/u);
  assert.match(source, /Only IX-Core-admitted Objects and permanent Passports will appear/u);
  assert.match(source, /canonicalAdmissionBatchSize: 32/u);
  assert.match(environmentSource, /Math\.min\(32, Number\(batchSize\) \|\| 12\)/u);
  assert.match(environmentSource, /typeof onAuthenticatedEnvironment === "function"/u);
  assert.match(environmentSource, /canonicalObjects: "pending"/u);
  assert.match(environmentSource, /ownedListings: \[\],[\s\S]*objects: \[\]/u);
  assert.doesNotMatch(source, /const \[aosResult, accessResult\] = await Promise\.all/u);
  assert.doesNotMatch(source, /localStorage|sessionStorage/u);
  assert.doesNotMatch(source, /directContainerId\s*=/u);
  assert.doesNotMatch(source, /method:\s*"(?:POST|PUT|PATCH|DELETE)"/u);
});

test("TRAN$ACT login returns the authenticated operator to the desktop", () => {
  const source = read("components/ixi-command-center/IXITransactCommandCenter.jsx");

  assert.match(source, /const TRANSACT_LOGIN_HREF = `\/login\?returnTo=\$\{encodeURIComponent\("\/transact"\)\}`/u);
  assert.match(source, /LOG IN AND RETURN TO TRAN\$ACT/u);
  assert.match(source, /window\.location\.assign\(TRANSACT_LOGIN_HREF\)/u);
  const loadingState = source.slice(
    source.indexOf("{loading ?"),
    source.indexOf(": null}", source.indexOf("{loading ?"))
  );
  assert.match(loadingState, /VERIFYING TRAN\$ACT SESSION/u);
  assert.doesNotMatch(loadingState, /LOG IN/u);
});

test("desktop styling preserves the permanent professional shell and responsive safety", () => {
  const styles = read("components/ixi-command-center/IXIAosCommandCenter.module.css");

  assert.match(styles, /\.topbar\s*\{[\s\S]*position:\s*sticky/u);
  assert.match(styles, /grid-template-columns:\s*220px minmax\(0, 1fr\) 296px/u);
  assert.match(styles, /@media \(max-width: 1220px\)/u);
  assert.match(styles, /overflow-x:\s*hidden/u);
  assert.match(styles, /--gold:\s*#ffc400/u);
});
