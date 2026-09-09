import assert from "node:assert/strict";
import test from "node:test";

import { getSafeIXILoginReturnTarget } from "../lib/auth/ixiLoginReturn.js";

test("login honors TRAN$ACT returnTo and legacy next destinations", () => {
  assert.equal(getSafeIXILoginReturnTarget("?returnTo=%2Ftransact"), "/transact");
  assert.equal(getSafeIXILoginReturnTarget("?next=%2Faccount%2Fmessages"), "/account/messages");
  assert.equal(getSafeIXILoginReturnTarget("?returnTo=%2Ftransact&next=%2F"), "/transact");
});

test("login refuses external and malformed redirect destinations", () => {
  assert.equal(getSafeIXILoginReturnTarget("?returnTo=https%3A%2F%2Fevil.example"), "/");
  assert.equal(getSafeIXILoginReturnTarget("?returnTo=%2F%2Fevil.example"), "/");
  assert.equal(getSafeIXILoginReturnTarget("?next=%2F%5C%5Cevil.example"), "/");
  assert.equal(getSafeIXILoginReturnTarget(""), "/");
});

