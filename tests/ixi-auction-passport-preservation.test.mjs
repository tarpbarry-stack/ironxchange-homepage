import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(
  new URL("../pages/api/auction-object/disposition.js", import.meta.url),
  "utf8"
);

test("auction disposition preserves permanent Passport identity", () => {
  assert.doesNotMatch(source, /passport\/by-source/u);
  assert.doesNotMatch(source, /permanentlyDeletePassport/u);
  assert.doesNotMatch(source, /method:\s*"DELETE"[\s\S]{0,240}passport/u);
  assert.match(source, /passportPreserved:\s*true/u);
  assert.match(source, /permanent Passport preserved/u);
});

