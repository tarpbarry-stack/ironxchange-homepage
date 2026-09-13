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
  assert.match(source, /loadIXIAosPassportFinancialDocuments/u);
  assert.match(source, /LIFETIME PASSPORT HISTORY/u);
  assert.match(source, /PASSPORT RECORDS/u);
  assert.match(source, /entityPassportId/u);
  assert.match(source, /accountingPeriod: period/u);
  assert.match(source, /No financial values have been fabricated/u);
  assert.match(source, /Queue completion never substitutes/u);
  assert.match(source, /accessError\?\.status !== 401/u);
  assert.match(source, /buildIXITransactFastEnvironment\(accessPayload\)/u);
  assert.match(source, /buildIXIAosCommandContexts\(\{[\s\S]*entityPassportId,/u);
  assert.match(source, /contextHydrationStarted\.current = true;[\s\S]*await loadIXIMosEnvironment/u);
  assert.match(source, /financialLoading \|\| \(!projectionPayload && !financialError\)/u);
  assert.match(source, /COMPANY CONNECTED/u);
  assert.match(source, /Machines appear only through the authoritative company Equipment projection/u);
  assert.match(environmentSource, /admitMosCanonicalIdentities\(\{ requests \}\)/u);
  assert.match(environmentSource, /AOS_IDENTITY_BATCH_INCOMPLETE/u);
  assert.match(environmentSource, /typeof onAuthenticatedEnvironment === "function"/u);
  assert.match(environmentSource, /canonicalObjects: "pending"/u);
  assert.match(environmentSource, /ownedListings: \[\],[\s\S]*objects: \[\]/u);
  assert.doesNotMatch(source, /const \[aosResult, accessResult\] = await Promise\.all/u);
  assert.doesNotMatch(source, /localStorage|sessionStorage/u);
  assert.doesNotMatch(source, /directContainerId\s*=/u);
  assert.doesNotMatch(source, /method:\s*"(?:POST|PUT|PATCH|DELETE)"/u);
});

test("Object console is History-first and reuses the governed TRAN$ACT app bus", () => {
  const source = read("components/ixi-command-center/IXITransactCommandCenter.jsx");
  const app = read("components/ixi-aos/transact/IXITransactApp.jsx");

  assert.match(source, /Governed AOS Object directory/u);
  assert.match(source, /className=\{styles\.objectDirectoryCount\}[\s\S]*\{objectDirectory\.length\}/u);
  assert.match(source, /className=\{styles\.objectDirectorySelect\}[\s\S]*aria-label="Object directory"/u);
  assert.doesNotMatch(source, /selectedDirectory\?\.label \|\| "AOS OBJECTS"/u);
  assert.doesNotMatch(source, /<span>INDEX<\/span>/u);
  assert.match(source, /<b>SN<\/b><span>\{item\.serialNumber \|\| "NOT RECORDED"\}<\/span>/u);
  assert.match(source, /<b>ID<\/b><span>\{item\.stockNumber \|\| item\.assetId \|\| item\.passportId \|\| "NOT RECORDED"\}<\/span>/u);
  assert.match(source, /className=\{styles\.headerIdentity\}[\s\S]*selectedContext\.serialNumber[\s\S]*selectedContext\.stockNumber[\s\S]*selectedContext\.passportId[\s\S]*selectedContext\.sourceId/u);
  assert.match(source, /SERIAL NUMBER[\s\S]*context\.serialNumber[\s\S]*STOCK NUMBER[\s\S]*context\.stockNumber[\s\S]*PASSPORT NUMBER[\s\S]*context\.passportId[\s\S]*OBJECT ID[\s\S]*context\.sourceId/u);
  assert.doesNotMatch(source, /shortIdentity/u);
  assert.match(source, /setActiveWorkspace\(context\.kind === "company" \? "today" : "object-history"\)/u);
  assert.match(source, /title="TRANSACTION HISTORY"/u);
  assert.match(source, /getIXITransactModules/u);
  assert.match(source, /workspaceEmbedded/u);
  assert.match(source, /dynamic\([\s\S]*import\("\.\.\/ixi-aos\/transact\/IXITransactApp"\)/u);
  assert.match(source, /IXI CORE CONNECTED · PASSPORT HISTORY/u);
  assert.doesNotMatch(source, /window\.location[^\n]*object-history/u);
  assert.match(app, /workspaceEmbedded = false/u);
  assert.match(app, /workspaceEmbedded[\s\S]*"RETURN TO TRANSACTION HISTORY"/u);
});

test("machine photos hydrate progressively from the deduplicated IXI Media bus", () => {
  const source = read("components/ixi-command-center/IXITransactCommandCenter.jsx");

  assert.match(source, /import \{ hydrateIXIListingMedia \} from "\.\.\/\.\.\/lib\/listings\/hydrateIXIListingMedia"/u);
  assert.match(source, /hydrateIXIListingMedia\(listing, \{ dedupeRequests: true \}\)/u);
  assert.match(source, /IntersectionObserver/u);
  assert.match(source, /rootMargin: "160px 0px"/u);
  assert.match(source, /label=`?\{?`?\$?\{?context\.title/u);
  assert.match(source, /eager/u);
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
  assert.match(styles, /grid-template-columns:\s*250px minmax\(0, 1fr\) 330px/u);
  assert.match(styles, /@media \(max-width: 1220px\)/u);
  assert.match(styles, /overflow-x:\s*hidden/u);
  assert.match(styles, /--gold:\s*#ffc400/u);
  assert.match(styles, /font-family:\s*'Inter Variable', Inter, ui-sans-serif/u);
  assert.match(styles, /--tx-type-meta:\s*12px/u);
  assert.match(styles, /--tx-type-body:\s*14px/u);
  assert.match(styles, /--tx-type-control:\s*14px/u);
  assert.match(styles, /--tx-type-value:\s*16px/u);
  assert.match(styles, /--tx-type-section:\s*20px/u);
  assert.match(
    styles,
    /\.shell button,[\s\S]*\.shell input,[\s\S]*\.shell select,[\s\S]*\.shell textarea\s*\{[\s\S]*font-family:\s*inherit/u,
    "native controls must inherit the approved TRAN$ACT type system"
  );
  assert.doesNotMatch(
    styles,
    /font-size:\s*(?:[5-9](?:\.\d+)?|1[01])px/u,
    "TRAN$ACT desktop must preserve the V13 12px type floor"
  );
  assert.match(
    styles,
    /\.shell :global\(\.ixi-transact-dialog\.workspace-embedded\.worksheet-open\)/u,
    "opened desktop apps must receive the V13 worksheet typography contract"
  );
  assert.doesNotMatch(
    styles,
    /:global\([^)]*\.card-open/u,
    "desktop typography must never target the card-level presentation"
  );
});
