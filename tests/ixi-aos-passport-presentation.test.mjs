import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import {
  getAosPassportDisplaySerial,
  getCanonicalAosPassportId,
  isValidIxiPassportId
} from "../lib/mos/ixiAosPassportPresentation.mjs";

const read = path => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");


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


test("location Cards 001 through 003 never present an internal Object ID as an IXI Passport", () => {
  for (const number of ["001", "002", "003"]) {
    const source = read(`components/ixi-aos/cards/${number}/IXIAosCard${number}Location.jsx`);
    assert.match(source, /getAosPassportDisplaySerial/u);
    assert.doesNotMatch(source, /getObjectId/u);
    assert.doesNotMatch(source, /FACELAB_IXI_ID_PREVIEW/u);
    assert.doesNotMatch(source, /OBJECT_/u);
  }
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
