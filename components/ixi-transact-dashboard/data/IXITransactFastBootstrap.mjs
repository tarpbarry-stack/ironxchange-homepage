const clean = value => String(value ?? "").trim();

export function buildIXITransactFastEnvironment(accessPayload = {}) {
  const data = accessPayload?.data || {};
  const sourceEntity = data?.operatingContext?.entity || {};
  const passportId = clean(
    sourceEntity.passportId ||
    data?.defaults?.entityPassportId ||
    data?.entities?.[0]?.passportId
  );
  const entityId = clean(sourceEntity.entityId);

  if (!entityId || !passportId) {
    return null;
  }

  return {
    ok: true,
    isAuthenticated: true,
    entity: {
      entityId,
      passportId,
      displayName: clean(sourceEntity.displayName) || "IXI Entity",
      status: clean(sourceEntity.status) || "active",
      officeLocation: clean(sourceEntity.officeLocation)
    },
    account: null,
    principal: null,
    ownedListings: [],
    systemIndexes: [],
    objectDefinitions: [],
    objects: [],
    relationships: [],
    rootObjects: [],
    projections: {},
    railProjections: {},
    hydration: {
      canonicalObjects: "deferred"
    }
  };
}
