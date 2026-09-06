import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("scoreboard identity loads independently from the MOS environment", async () => {
  const source = await readFile(
    new URL("../pages/aos/work.js", import.meta.url),
    "utf8"
  );

  const identityStart = source.indexOf("async function loadAosIdentity");
  const environmentStart = source.indexOf("async function loadAosScoreboardEnvironment");

  assert.ok(identityStart > -1);
  assert.ok(environmentStart > identityStart);
  assert.match(source.slice(identityStart, environmentStart), /currentUser\.show/u);
  assert.match(source, /loadAosIdentity\(\);\s*loadAosScoreboardEnvironment\(\);/u);
});

test("AOS gateway records upstream conflict diagnostics", async () => {
  const source = await readFile(
    new URL("../pages/api/aos/mos/[...path].js", import.meta.url),
    "utf8"
  );

  assert.match(source, /AOS_BROWSER_GATEWAY_ERROR/u);
  assert.match(source, /error\?\.details/u);
});
