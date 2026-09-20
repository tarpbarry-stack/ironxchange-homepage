import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import { ATLAS_TOPICS, atlasHelpHref, atlasLessonHref, atlasTopicForPage } from "../lib/ixi-atlas/helpRoutes.mjs";
import { atlasAssemblyHref, resolveAtlasView, searchAtlas } from "../lib/ixi-atlas/navigation.mjs";
import { atlasGuides } from "../lib/ixi-atlas/guideRegistry.mjs";

test("contextual help maps each primary environment and active financial worksheet", () => {
  for (const [path, expected] of [["/browse-v2","marketplace"],["/aos/work","aos-work"],["/transact","transact"],["/transact/ledger","ledger"],["/sold","sold"],["/sales-desk","sales-desk"],["/account/my-listings-v2","private"],["/p/[passportId]","passport"],["/listing/[slug]","machine-card"],["/url-import","url-import"],["/bulk-import","bulk-import"]]) assert.equal(atlasTopicForPage(path), expected);
  assert.equal(atlasTopicForPage("/transact", "invoice"), "invoice");
  assert.equal(atlasTopicForPage("/transact", "asset-acquisition"), "acquisition");
  assert.equal(atlasTopicForPage("/transact", "payments"), "payments");
  assert.equal(atlasTopicForPage("/sales-desk", "calendar"), "calendar");
  assert.equal(atlasTopicForPage("/account", "invoice"), "account");
});
test("help URLs never carry record, company, customer or session identifiers", () => {
  assert.equal(atlasHelpHref({ pathname: "/transact?record=PRIVATE&company=SECRET#TOKEN", moduleId: "invoice" }), "/atlas?topic=invoice");
  assert.equal(atlasHelpHref({ pathname: "/sales-desk?invitation=SECRET#TOKEN" }), "/atlas?topic=sales-desk");
  assert.equal(atlasHelpHref({ pathname: "/transact", topic: "javascript:alert(1)" }), "/atlas?topic=transact");
});
test("every header topic has a published guide and every related link resolves", () => {
  assert.deepEqual([...new Set(atlasGuides.map(x => x.id))].sort(), [...ATLAS_TOPICS].sort());
  assert.equal(atlasGuides.length, ATLAS_TOPICS.length);
  for (const guide of atlasGuides) {
    for (const related of guide.related) assert.ok(ATLAS_TOPICS.includes(related));
    assert.equal(guide.steps.length, 3);
    assert.equal(resolveAtlasView({ topic: guide.id }).topic, guide.id);
    assert.ok(atlasLessonHref(guide.id).startsWith("/atlas?topic="));
  }
});
test("deep links survive direct entry while malformed or unavailable lessons fail safely", () => {
  assert.deepEqual(resolveAtlasView({ assembly: "machine", part: "gearbox" }), { kind: "machine", part: "gearbox", unavailable: false });
  assert.equal(resolveAtlasView({ assembly: "chassis", part: "pockets" }).part, "pockets");
  assert.equal(resolveAtlasView({ topic: ["invoice", "payments"] }).topic, "overview");
  assert.equal(resolveAtlasView({ topic: "missing" }).unavailable, true);
  assert.equal(resolveAtlasView({ assembly: "missing" }).unavailable, true);
  assert.equal(atlasAssemblyHref("machine", "../../private"), "/atlas?assembly=machine&part=object");
});
test("search crosses chapters and matches practical tasks", () => {
  assert.ok(searchAtlas("money received").some(item => item.href === "/atlas?topic=payments"));
  assert.ok(searchAtlas("gearbox").some(item => item.href.includes("part=gearbox")));
  assert.ok(searchAtlas("pockets").some(item => item.group === "Chassis blueprint"));
  assert.deepEqual(searchAtlas("not-a-real-task-842753"), []);
  assert.deepEqual(searchAtlas("   "), []);
});
test("normal headers do not import Atlas content or start data checks", () => {
  const header = fs.readFileSync(new URL("../components/ixi-atlas/AtlasHelpLink.jsx", import.meta.url), "utf8");
  assert.doesNotMatch(header, /fetch\(|useEffect|guideRegistry|IXITechnicalAtlas|next\/link/);
  assert.match(header, /target="_blank"/);
  assert.match(header, /rel="noopener noreferrer"/);
});
