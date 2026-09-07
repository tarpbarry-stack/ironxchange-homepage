import assert from "node:assert/strict";
import test from "node:test";

import {
  getAosPassportDisplaySerial,
  getCanonicalAosPassportId,
  isValidIxiPassportId
} from "../lib/mos/ixiAosPassportPresentation.mjs";


test("AOS headers display the verified seven-character IXI Passport serial", () => {
  const object = {
    objectId:
      "OBJECT_128EEED0-FF40-4AD0-BAD0-INTERNAL",
    ixiNumber:
      "OBJECT_128EEED0-FF40-4AD0-BAD0-INTERNAL",
    identities: [
      {
        identityType:
          "ixi-passport",
        passportId:
          "IXIGHMQNQH"
      }
    ]
  };

  assert.equal(
    getCanonicalAosPassportId(object),
    "IXIGHMQNQH"
  );
  assert.equal(
    getAosPassportDisplaySerial(object),
    "GHMQNQH"
  );
});


test("internal Object IDs and six-character browser fallbacks are never presented as Passports", () => {
  assert.equal(
    getCanonicalAosPassportId({
      ixiNumber:
        "OBJECT_128EEED0-FF40-4AD0",
      objectId:
        "object-afebb7"
    }),
    ""
  );
  assert.equal(
    getAosPassportDisplaySerial({
      objectId:
        "object-afebb7"
    }),
    "PENDING"
  );
});


test("Passport presentation accepts separators but enforces the IX Core alphabet", () => {
  assert.equal(
    isValidIxiPassportId("IXI-GHMQNQH"),
    true
  );
  assert.equal(
    isValidIxiPassportId("IXI-ABC10OL"),
    false
  );
});
