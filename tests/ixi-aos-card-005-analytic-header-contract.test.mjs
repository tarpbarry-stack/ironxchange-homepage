import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = process.cwd();
const read = file => fs.readFileSync(path.join(root, file), "utf8");

test("AOS Card 005 owns one three-cell analytic shell with the shared business identifier", () => {
  const card = read("components/ixi-aos/cards/005/IXIAosCard005Personnel.jsx");
  const layout = read("components/ixi-aos/cards/generic/IXIAosGenericContainerLayoutV12.jsx");
  const samples = read("components/ixi-aos-card-library/IXIAosCardSampleData.js");

  assert.match(card, /showBusinessIdentifier=\{false\}/u);
  assert.match(card, /showAnalyticBusinessIdentifier/u);
  assert.match(layout, /gcv12-kpis-three/u);
  assert.match(layout, /getBusinessIdentifierValue\(runtimeObject\)/u);
  assert.match(layout, /getObjectFields\(runtimeObject\)\?\.\[analyticPrimaryFieldId\]/u);
  assert.match(samples, /analyticTotalLabel: "PEOPLE"/u);
  assert.match(samples, /analyticPrimaryFieldId: "openJobs"/u);
  assert.match(samples, /analyticPrimaryMetricLabel: "OPEN JOBS"/u);
  assert.match(samples, /analyticIdentifierLabel: "ID"/u);
});
