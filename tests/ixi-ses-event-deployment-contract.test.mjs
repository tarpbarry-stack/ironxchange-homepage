import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("the paired release provisions, configures, activates and verifies SES events in order", () => {
  const workflow = fs.readFileSync(
    path.join(root, ".github/workflows/deploy-ixi-core-production.yml"),
    "utf8"
  );
  const provision = workflow.indexOf("Provision SES event foundation");
  const install = workflow.indexOf("Install and verify complete runtime");
  const activate = workflow.indexOf("Activate and verify SES delivery events");

  assert.ok(provision >= 0 && provision < install && install < activate);
  assert.match(workflow, /EnableDeliveryEvents=false/u);
  assert.match(workflow, /IXI_SES_EVENT_TOPIC_ARN:.*communication-events\.outputs\.topic_arn/u);
  assert.match(workflow, /EnableDeliveryEvents=true/u);
  assert.match(workflow, /PendingConfirmation/u);
  assert.match(workflow, /get-configuration-set-event-destinations/u);
});
