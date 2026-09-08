import {
  getCanonicalAosPassportId
} from "./ixiAosPassportPresentation.mjs";

const INACTIVE_STATUSES = new Set([
  "archived",
  "deleted",
  "soft-deleted"
]);

const LISTING_SOURCE_TYPES = new Set([
  "sharetribe-listing",
  "sharetribe",
  "listing"
]);

const PASSPORT_SOURCE_TYPES = new Set([
  "ixi-passport",
  "passport"
]);

export const IXI_PRIVATE_MACHINE_PRESENTATION_ADAPTER_ID =
  "ixi.sharetribe-owned-machine.v1";

function clean(value) {
  return String(value ?? "").trim();
}

function cleanLower(value) {
  return clean(value).toLowerCase();
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function safeObject(value) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value
    : {};
}

function listingIdOf(source = {}) {
  return clean(
    source?.listingId ||
    source?.id?.uuid ||
    source?.id ||
    source?.uuid
  );
}

function isActive(source = {}) {
  return !INACTIVE_STATUSES.has(cleanLower(source?.status || source?.listingStatus));
}

function admissionError(code, message, details = {}) {
  const error = new Error(message);
  error.code = code;
  error.details = details;
  return error;
}

function sourceBindingsOf(source = {}) {
  const metadata = safeObject(source?.metadata);
  const provisioning = safeObject(metadata?.provisioning || source?.provisioning);

  return [
    ...safeArray(source?.sourceBindings),
    ...safeArray(metadata?.sourceBindings),
    ...safeArray(provisioning?.sourceBindings),
    ...safeArray(source?.historicalSourceBindings),
    ...safeArray(metadata?.historicalSourceBindings)
  ];
}

function identitiesOf(source = {}) {
  const metadata = safeObject(source?.metadata);
  const provisioning = safeObject(metadata?.provisioning || source?.provisioning);
  return [
    ...safeArray(source?.aliases),
    ...safeArray(source?.identities),
    ...safeArray(source?.identity?.identities),
    ...safeArray(source?.passport?.identities),
    ...safeArray(metadata?.identities),
    ...safeArray(provisioning?.identities),
    ...sourceBindingsOf(source)
  ];
}

function addAlias(target, value) {
  const resolved = clean(value);
  if (resolved) target.add(resolved);
}

function collectAliases(source = {}) {
  const passportIds = new Set();
  const listingIds = new Set();
  const historicalIds = new Set();
  const externalIds = new Set();
  const verifiedAdmission = source?.canonicalAdmissionVerified === true;
  const metadata = safeObject(source?.metadata);
  const provisioning = safeObject(metadata?.provisioning || source?.provisioning);
  const passportId = verifiedAdmission
    ? getCanonicalAosPassportId({ passportId: source?.passportId })
    : getCanonicalAosPassportId(source);

  addAlias(passportIds, passportId);
  if (!verifiedAdmission) {
    [
      source?.passportId,
      source?.ixiPassportId,
      source?.passport?.passportId,
      source?.passport?.id,
      metadata?.passportIdentity?.passportId,
      source?.publicData?.passportId,
      source?.attributes?.publicData?.passportId,
      source?.ixiMedia?.passportId,
      source?.publicData?.ixiMedia?.passportId,
      source?.attributes?.publicData?.ixiMedia?.passportId,
      metadata?.provisioning?.passportId,
      source?.provisioning?.passportId,
      source?.ixiNumber,
      source?.ixiId,
      metadata?.ixiNumber,
      metadata?.ixiId
    ].forEach(value => {
      const normalized = getCanonicalAosPassportId({ passportId: value });
      addAlias(passportIds, normalized);
    });
  }
  if (!verifiedAdmission) {
    addAlias(listingIds, source?.listingId);
    addAlias(listingIds, source?.sourceListingId);
    addAlias(listingIds, metadata?.sourceListingId);
    addAlias(listingIds, provisioning?.sourceListingId);
  }

  if (!verifiedAdmission) {
    [
      ...safeArray(source?.historicalIds),
      ...safeArray(metadata?.historicalIds),
      ...safeArray(provisioning?.historicalIds)
    ].forEach(value => addAlias(historicalIds, value?.id || value?.value || value));
  }

  const identities = verifiedAdmission
    ? safeArray(source?.aliases)
    : identitiesOf(source);

  identities.forEach(identity => {
    const sourceType = cleanLower(
      identity?.sourceType ||
      identity?.identityType ||
      identity?.type ||
      identity?.kind
    );
    const value = clean(
      identity?.sourceId ||
      identity?.passportId ||
      identity?.identityId ||
      identity?.externalId ||
      identity?.value ||
      identity?.id
    );

    if (!value) return;
    if (PASSPORT_SOURCE_TYPES.has(sourceType)) {
      addAlias(passportIds, getCanonicalAosPassportId({
        identities: [{ identityType: "ixi-passport", passportId: value }]
      }));
      return;
    }
    if (LISTING_SOURCE_TYPES.has(sourceType)) {
      addAlias(listingIds, value);
      return;
    }
    if (sourceType.includes("historical") || identity?.historical === true) {
      addAlias(historicalIds, value);
      return;
    }
    if (
      verifiedAdmission ||
      identity?.authorized === true ||
      identity?.verified === true ||
      identity?.serverVerified === true
    ) {
      addAlias(externalIds, value);
    }
  });

  if (!verifiedAdmission) {
    [
      ...safeArray(source?.externalAliases),
      ...safeArray(metadata?.externalAliases)
    ].forEach(alias => {
      if (
        alias?.authorized === true ||
        alias?.verified === true ||
        alias?.serverVerified === true
      ) {
        addAlias(externalIds, alias?.externalId || alias?.id || alias?.value);
      }
    });
  }

  /*
   * Released machine Objects predate the canonical alias array. Their
   * Sharetribe source is nevertheless durable IX-Core data. Once the Object
   * has passed authenticated canonical admission, these fields are trusted
   * historical aliases and may join presentation data to that same Object.
   * They are never accepted from an unverified browser record.
   */
  if (verifiedAdmission) {
    const trustedListingSources = [
      {
        sourceType: source?.sourceType,
        sourceId: source?.sourceId
      },
      ...sourceBindingsOf(source)
    ];

    trustedListingSources.forEach(binding => {
      const sourceType = cleanLower(
        binding?.sourceType ||
        binding?.identityType ||
        binding?.type ||
        binding?.kind
      );
      if (!LISTING_SOURCE_TYPES.has(sourceType)) return;
      addAlias(
        listingIds,
        binding?.sourceId ||
        binding?.identityId ||
        binding?.externalId ||
        binding?.value ||
        binding?.id
      );
    });

    [
      source?.sourceListingId,
      metadata?.sourceListingId,
      provisioning?.sourceListingId
    ].forEach(value => addAlias(listingIds, value));
  }

  return {
    passportIds: [...passportIds],
    listingIds: [...listingIds],
    historicalIds: [...historicalIds],
    externalIds: [...externalIds]
  };
}

export function normalizeIxCoreAdmissionEnvelope({
  response = {},
  requestedObject = {},
  expectedEntityId = ""
} = {}) {
  const identity = safeObject(response?.identity);
  const canonicalObject = safeObject(response?.object);
  const requestedObjectId = clean(requestedObject?.objectId);
  const requestedPassportId = getCanonicalAosPassportId(requestedObject);
  const objectId = clean(identity?.objectId);
  const passportId = getCanonicalAosPassportId({ passportId: identity?.passportId });
  const entityId = clean(identity?.entityId);
  const objectRecordId = clean(canonicalObject?.objectId);
  const objectEntityId = clean(canonicalObject?.entityId || canonicalObject?.tenantId);
  const objectPassportId = getCanonicalAosPassportId(canonicalObject);
  const hasEvidence = Object.prototype.hasOwnProperty.call(identity, "evidence");

  if (
    response?.ok !== true ||
    !objectId ||
    !passportId ||
    !entityId ||
    !objectRecordId ||
    objectId !== objectRecordId ||
    objectId !== requestedObjectId ||
    passportId !== requestedPassportId ||
    entityId !== clean(expectedEntityId) ||
    (objectEntityId && objectEntityId !== entityId) ||
    (objectPassportId && objectPassportId !== passportId) ||
    !Array.isArray(identity?.aliases) ||
    !hasEvidence
  ) {
    throw admissionError(
      "CANONICAL_IDENTITY_REPAIR_REQUIRED",
      "IX-Core canonical admission did not return the requested Object, Passport, and Entity.",
      {
        requestedObjectId,
        requestedPassportId,
        expectedEntityId: clean(expectedEntityId),
        objectId,
        passportId,
        entityId,
        objectRecordId,
        objectEntityId,
        objectPassportId
      }
    );
  }

  return {
    ...requestedObject,
    ...canonicalObject,
    objectId,
    passportId,
    entityId,
    aliases: identity.aliases,
    admissionIdentity: identity,
    evidence: identity.evidence,
    canonicalAdmissionVerified: true
  };
}

function authorityOf(object = {}) {
  const source = safeObject(
    object?.actorAuthority ||
    object?.effectiveAuthority ||
    object?.effectivePermissions ||
    object?.permissions
  );

  const decision = (...keys) => keys.some(key => source?.[key] === true);

  return Object.freeze({
    canCreateChild: decision("canCreateChild", "createChild", "create"),
    canRelate: decision("canRelate", "relate", "createRelationship"),
    canEdit: decision("canEdit", "edit", "write"),
    canTransact: decision("canTransact", "transact", "financial"),
    canDelete: decision("canDelete", "delete", "remove"),
    canHide: decision("canHide", "hide"),
    canOpenConsole: decision("canOpenConsole", "openConsole", "console")
  });
}

function explicitCardNumber(object = {}) {
  const candidates = [
    object?.selectedCardTemplate?.templateNumber,
    object?.presentation?.templateNumber,
    object?.templateNumber,
    object?.cardNumber,
    object?.metadata?.cardNumber,
    object?.definition?.templateNumber,
    object?.definition?.metadata?.cardNumber,
    object?.metadata?.cardDefinition?.templateNumber
  ];

  for (const value of candidates) {
    const number = Number(value);
    if (Number.isInteger(number) && number >= 1 && number <= 18) return number;
  }

  return 0;
}

function selectedTemplateSlug(object = {}) {
  return clean(
    object?.selectedCardTemplate?.templateSlug ||
    object?.presentation?.templateSlug ||
    object?.cardTemplateSlug ||
    object?.templateSlug ||
    object?.definition?.cardTemplateSlug ||
    object?.definition?.templateSlug ||
    object?.metadata?.cardTemplateSlug ||
    object?.metadata?.templateSlug ||
    object?.metadata?.cardDefinition?.templateSlug
  );
}

export function resolveAosCanonicalPresentation({
  object = {},
  listing = null,
  sourceAdapterId = ""
} = {}) {
  const presentationAdapterId = clean(
    sourceAdapterId ||
    object?.selectedPresentation?.sourceAdapterId ||
    object?.presentation?.sourceAdapterId ||
    object?.metadata?.presentationSourceAdapterId
  );

  if (presentationAdapterId === IXI_PRIVATE_MACHINE_PRESENTATION_ADAPTER_ID) {
    return Object.freeze({
      kind: "ixi-private-machine",
      renderer: "established-private-machine-card",
      sourceAdapterId: presentationAdapterId,
      sourceAlias: listingIdOf(listing)
    });
  }

  const templateNumber = explicitCardNumber(object);
  const templateSlug = selectedTemplateSlug(object);

  if (templateNumber || templateSlug) {
    return Object.freeze({
      kind: "aos-numbered-card",
      templateNumber,
      templateSlug,
      explicit: true
    });
  }

  /*
   * Missing presentation metadata is not permission to manufacture Card 007.
   * The caller must quarantine or preserve an independently established
   * presentation (for example, an owned Private listing).
   */
  return Object.freeze({
    kind: "unresolved-presentation",
    renderer: null,
    explicit: false
  });
}

export function normalizeAosCanonicalObject({ object = {}, listing = null } = {}) {
  const objectId = clean(object?.objectId);
  const entityId = clean(object?.entityId || object?.tenantId || object?.entity?.entityId);
  const aliases = collectAliases(object);
  const passportId = aliases.passportIds[0] || "";

  if (!objectId) {
    throw admissionError(
      "IXI_AOS_OBJECT_ID_REQUIRED",
      "Canonical AOS admission requires IX-Core objectId."
    );
  }
  if (!passportId) {
    throw admissionError(
      "IXI_AOS_PASSPORT_REQUIRED",
      `Canonical AOS object ${objectId} does not have a recognized permanent Passport.`,
      { objectId }
    );
  }
  if (!entityId) {
    throw admissionError(
      "IXI_AOS_TENANT_ID_REQUIRED",
      `Canonical AOS object ${objectId} does not have tenant/entity identity.`,
      { objectId }
    );
  }

  const presentationListingId = listingIdOf(listing || {});
  if (presentationListingId && !aliases.listingIds.includes(presentationListingId)) {
    aliases.listingIds.push(presentationListingId);
  }
  if (aliases.passportIds.length !== 1) {
    throw admissionError(
      "IXI_AOS_OBJECT_PASSPORT_CONFLICT",
      `Canonical AOS object ${objectId} has conflicting permanent Passport identities.`,
      { objectId, passportIds: aliases.passportIds }
    );
  }
  const actorAuthority = authorityOf(object);
  const hasVerifiedListingSource =
    object?.canonicalAdmissionVerified === true &&
    aliases.listingIds.length > 0;
  const presentation = resolveAosCanonicalPresentation({
    object,
    listing,
    sourceAdapterId: listing || hasVerifiedListingSource
      ? IXI_PRIVATE_MACHINE_PRESENTATION_ADAPTER_ID
      : ""
  });

  return {
    ...(listing || {}),
    ...object,
    objectId,
    passportId,
    entityId,
    canonicalIdentity: Object.freeze({ objectId, passportId, entityId }),
    aliases: Object.freeze({
      passportIds: Object.freeze([...aliases.passportIds]),
      listingIds: Object.freeze([...aliases.listingIds]),
      historicalIds: Object.freeze([...aliases.historicalIds]),
      externalIds: Object.freeze([...aliases.externalIds])
    }),
    actorAuthority,
    presentation,
    selectedPresentation: presentation,
    authorizedPreviews: hasVerifiedListingSource
      ? Object.freeze(aliases.listingIds.map(alias => Object.freeze({
          source: "sharetribe-listing",
          alias
        })))
      : Object.freeze([]),
    canonicalObject: object,
    presentationSource: listing,
    normalizedAosObject: true
  };
}

function addIndexAlias(index, alias, objectId, kind) {
  const value = clean(alias);
  if (!value) return;
  const existing = index.get(value);
  if (existing && existing !== objectId) {
    throw admissionError(
      "IXI_AOS_ALIAS_COLLISION",
      `${kind} alias ${value} resolves to multiple active canonical objects.`,
      { kind, alias: value, objectIds: [existing, objectId] }
    );
  }
  index.set(value, objectId);
}

function assertOneObjectRecord(objectsById, object) {
  const objectId = clean(object?.objectId);
  if (objectsById.has(objectId)) {
    throw admissionError(
      "IXI_AOS_ACTIVE_OBJECT_COLLISION",
      `Canonical objectId ${objectId} has multiple active records.`,
      { objectId }
    );
  }
}

export function buildAosCanonicalAdmission({
  aosObjects = [],
  workspaceListings = []
} = {}) {
  const activeObjects = safeArray(aosObjects).filter(isActive);
  const activeListings = safeArray(workspaceListings).filter(isActive);
  const objectsById = new Map();
  const passportToObjectId = new Map();
  const listingToObjectId = new Map();
  const historicalToObjectId = new Map();
  const externalToObjectId = new Map();

  activeObjects.forEach(object => {
    const normalized = normalizeAosCanonicalObject({ object });
    assertOneObjectRecord(objectsById, normalized);
    objectsById.set(normalized.objectId, normalized);

    normalized.aliases.passportIds.forEach(alias => addIndexAlias(passportToObjectId, alias, normalized.objectId, "Passport"));
    normalized.aliases.listingIds.forEach(alias => addIndexAlias(listingToObjectId, alias, normalized.objectId, "listing"));
    normalized.aliases.historicalIds.forEach(alias => addIndexAlias(historicalToObjectId, alias, normalized.objectId, "historical"));
    normalized.aliases.externalIds.forEach(alias => addIndexAlias(externalToObjectId, alias, normalized.objectId, "external"));
  });

  const listingPresentationByObjectId = new Map();
  const unresolvedListings = [];

  activeListings.forEach(listing => {
    const listingId = listingIdOf(listing);
    const passportId = getCanonicalAosPassportId(listing);
    const byListing = listingId ? listingToObjectId.get(listingId) : "";
    const byPassport = passportId ? passportToObjectId.get(passportId) : "";

    if (byListing && byPassport && byListing !== byPassport) {
      throw admissionError(
        "IXI_AOS_LISTING_PASSPORT_CONFLICT",
        `Listing ${listingId} and Passport ${passportId} resolve to different active canonical objects.`,
        { listingId, passportId, objectIds: [byListing, byPassport] }
      );
    }

    const objectId = byListing || byPassport;
    if (!objectId) {
      unresolvedListings.push(listing);
      return;
    }

    addIndexAlias(listingToObjectId, listingId, objectId, "listing");
    if (!listingPresentationByObjectId.has(objectId)) {
      listingPresentationByObjectId.set(objectId, listing);
    }
  });

  for (const [objectId, object] of objectsById) {
    const listing = listingPresentationByObjectId.get(objectId) || null;
    if (listing) objectsById.set(objectId, normalizeAosCanonicalObject({ object: object.canonicalObject, listing }));
  }

  const resolveObjectId = alias => {
    const value = clean(alias);
    if (!value) return "";
    if (objectsById.has(value)) return value;

    const matches = new Set([
      passportToObjectId.get(value),
      listingToObjectId.get(value),
      historicalToObjectId.get(value),
      externalToObjectId.get(value)
    ].filter(Boolean));

    if (matches.size > 1) {
      throw admissionError(
        "IXI_AOS_ALIAS_INDEX_CONFLICT",
        `Alias ${value} resolves through multiple indexes to different active objects.`,
        { alias: value, objectIds: [...matches] }
      );
    }

    return matches.size === 1 ? [...matches][0] : "";
  };

  return Object.freeze({
    objectsById,
    passportToObjectId,
    listingToObjectId,
    historicalToObjectId,
    externalToObjectId,
    unresolvedListings: Object.freeze(unresolvedListings),
    resolveObjectId,
    resolveObject: alias => objectsById.get(resolveObjectId(alias)) || null
  });
}

export function canonicalizeAosPlacementReferences(placements = {}, admission) {
  const next = {};
  const placedObjectIds = new Set();
  Object.entries(safeObject(placements)).forEach(([surfaceId, aliases]) => {
    next[surfaceId] = safeArray(aliases).flatMap(alias => {
      const objectId = admission?.resolveObjectId?.(alias) || "";
      if (!objectId || placedObjectIds.has(objectId)) return [];
      placedObjectIds.add(objectId);
      return [objectId];
    });
  });
  return next;
}

export function createAosObjectPreviewReference(objectId, admission) {
  const object = admission?.objectsById?.get(clean(objectId));
  if (!object) return null;
  return Object.freeze({
    objectId: object.objectId,
    passportId: object.passportId,
    presentation: object.presentation,
    displayName: clean(object?.displayName || object?.title || object?.name),
    imageUrl: clean(object?.imageUrl),
    imageUrls: Object.freeze([...safeArray(object?.imageUrls)]),
    referenceOnly: true
  });
}

export function preserveAosOwnedListingPresentations(
  workspaceListings = [],
  admission
) {
  return safeArray(workspaceListings).filter(isActive).map(listing => {
    const listingId = listingIdOf(listing);
    const objectId = admission?.resolveObjectId?.(listingId) || "";
    const admittedObject = objectId
      ? admission?.objectsById?.get(objectId)
      : null;

    if (admittedObject) return admittedObject;

    return Object.freeze({
      ...listing,
      canonicalIdentityStatus: "unresolved",
      governedActionsDisabled: true,
      presentation: Object.freeze({
        kind: "ixi-private-machine",
        renderer: "established-private-machine-card",
        sourceAdapterId: IXI_PRIVATE_MACHINE_PRESENTATION_ADAPTER_ID,
        sourceAlias: listingId
      })
    });
  });
}

export default buildAosCanonicalAdmission;
