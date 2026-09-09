import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const FRONTEND_BASE = "8aac4cc65d5c04d9c0714b07cb10b3b6272581b7";
const CORE_COMMIT = "8f59cfe5d6e62f169022a4deba7b2d66861fe03d";
const CORE_TREE = "18dc5e8ae0bbdf3a88075c502296e2d498e6b57e";
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
    "objects.admit",
    "objects.move",
    "objects.recall",
    "objects.undo",
    "objects.summon.set",
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
