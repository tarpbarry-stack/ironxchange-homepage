import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const FRONTEND_BASE = "8aac4cc65d5c04d9c0714b07cb10b3b6272581b7";
const CORE_COMMIT = "705e1c0185767ee89e8d0f7d011d4bb6f1902f81";
const CORE_TREE = "3c072e7cbbe0215ab279713f20f2eb28210f5a9b";
const frontendRoot = path.resolve(new URL("..", import.meta.url).pathname);
const coreRoot = process.env.IXI_CORE_CONTRACT_ROOT || "";

function read(root, relative) {
  return fs.readFileSync(path.join(root, relative), "utf8");
}

test("exact frontend and IX-Core commits expose one governed session contract", t => {
  if (!coreRoot) {
    t.skip("Set IXI_CORE_CONTRACT_ROOT for the paired cross-repository gate.");
    return;
  }

  assert.equal(
    execFileSync("git", ["rev-parse", "HEAD"], { cwd: coreRoot, encoding: "utf8" }).trim(),
    CORE_COMMIT
  );
  assert.equal(
    execFileSync("git", ["rev-parse", "HEAD^{tree}"], { cwd: coreRoot, encoding: "utf8" }).trim(),
    CORE_TREE
  );
  execFileSync("git", ["merge-base", "--is-ancestor", FRONTEND_BASE, "HEAD"], {
    cwd: frontendRoot
  });

  const service = read(coreRoot, "mos/workspaces/sessionPlacementService.js");
  const router = read(coreRoot, "mos/routes/mosRouter.js");
  const client = read(frontendRoot, "lib/mos/ixiMosBrowserGatewayClient.js");
  const gateway = read(frontendRoot, "pages/api/aos/mos/[...path].js");
  const controller = read(
    frontendRoot,
    "components/ixi-mos/workspace/IXIAosWorkspaceSessionController.mjs"
  );

  for (const operation of [
    "object.admit",
    "object.move",
    "object.recall",
    "object.snapshot.capture",
    "object.undo",
    "surface.reorder",
    "summon.set"
  ]) {
    assert.match(service, new RegExp(`"${operation.replace(".", "\\.")}"`, "u"));
    assert.match(controller, new RegExp(`"${operation.replace(".", "\\.")}"`, "u"));
  }

  assert.match(router, /response = \{ ok: true, result \}/u);
  assert.match(router, /return res\.json\(\{ ok: true, session \}\)/u);
  assert.match(client, /X-IXI-Expected-Revision/u);
  assert.match(client, /Idempotency-Key/u);
  assert.match(gateway, /headers\["If-Match"\]\s*=\s*expectedRevision/u);
  assert.match(service, /WORKSPACE_SHARED_SCOPE_DENIED/u);
  assert.match(service, /WORKSPACE_PERSONAL_SCOPE_DENIED/u);
  assert.match(service, /WORKSPACE_CANONICAL_OBJECT_REQUIRED/u);
  assert.match(controller, /WORKSPACE_SESSION_ORIGIN_MUTATED/u);
  assert.match(controller, /function rollbackLocal\(operationId\)/u);
  assert.match(controller, /commandId: operationId/u);

  const relationshipEvidence = read(
    coreRoot,
    "mos/relationships/relationshipIdentityEvidenceService.js"
  );
  assert.match(relationshipEvidence, /sourcePassportId/u);
  assert.match(relationshipEvidence, /targetPassportId/u);
  assert.match(router, /sourcePassportId: sourceAdmission\.passportId/u);
  assert.match(router, /targetPassportId: targetAdmission\.passportId/u);
  assert.match(client, /record\?\.sourcePassportId/u);
  assert.match(client, /record\?\.targetPassportId/u);
});
