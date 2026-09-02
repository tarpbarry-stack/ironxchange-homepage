import {
  assertAosCreationReceipt,
  buildAosCreationProvenance,
  IXI_AOS_CREATION_CHANNELS
} from "./ixiAosCreationBoundary";

function goodPayload() {
  return {
    object: {
      objectId: "object_test",
      entityId: "entity_test",
      identities: [
        {
          identityType: "ixi-passport",
          passportId: "IXITEST",
          sourceType: "aos-object",
          sourceId: "object_test"
        }
      ]
    },
    passport: {
      passportId: "IXITEST",
      sourceType: "aos-object",
      sourceId: "object_test"
    },
    transact: {
      eligible: true,
      objectId: "object_test",
      passportId: "IXITEST"
    }
  };
}

describe("AOS creation boundary", () => {
  test("accepts a complete permanent creation receipt", () => {
    const receipt = assertAosCreationReceipt(
      goodPayload(),
      {
        expectedEntityId: "entity_test",
        expectedChannel:
          IXI_AOS_CREATION_CHANNELS.OBJECT_STUDIO
      }
    );

    expect(receipt.identity).toEqual({
      objectId: "object_test",
      passportId: "IXITEST"
    });
    expect(receipt.transact.eligible).toBe(true);
  });

  test("rejects Passport conflict", () => {
    const payload = goodPayload();
    payload.passport.passportId = "IXIOTHER";

    expect(() =>
      assertAosCreationReceipt(payload)
    ).toThrow(
      "conflicting Object and Passport identity"
    );
  });

  test("rejects TRANSACT conflict", () => {
    const payload = goodPayload();
    payload.transact.objectId = "object_other";

    expect(() =>
      assertAosCreationReceipt(payload)
    ).toThrow(
      "verified TRAN$ACT eligibility"
    );
  });

  test("rejects cross-entity receipt", () => {
    expect(() =>
      assertAosCreationReceipt(
        goodPayload(),
        { expectedEntityId: "entity_other" }
      )
    ).toThrow(
      "outside the requested Entity"
    );
  });

  test("creation provenance is business-neutral", () => {
    const metadata = buildAosCreationProvenance({
      channel:
        IXI_AOS_CREATION_CHANNELS.BULK_IMPORT,
      intentId: "import:row:12",
      sourceReference: "row:12"
    });

    expect(metadata.creationBoundary.channel)
      .toBe("bulk-import");
    expect(metadata.creationBoundary.intentId)
      .toBe("import:row:12");
  });
});
