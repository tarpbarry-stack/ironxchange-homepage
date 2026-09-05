const clean = value => String(value ?? "").trim();

function safeObject(value) {
  return (
    value &&
    typeof value === "object" &&
    !Array.isArray(value)
  )
    ? value
    : {};
}

function safeArray(value) {
  return Array.isArray(value)
    ? value
    : [];
}

export const IXI_AOS_PROVISIONING_CONTRACT_VERSION =
  "ixi-aos-object-provision-v1";

export const IXI_AOS_DRAFT_CONTRACT_VERSION =
  "ixi-aos-object-draft-v1";

export const IXI_AOS_OBJECT_IDENTITY_TYPES = Object.freeze({
  PASSPORT: "ixi-passport"
});

export function createAosDraftId() {
  const random =
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  return `aos-draft:${random}`;
}

export function isAosDraftId(value = "") {
  return clean(value).startsWith("aos-draft:");
}

export function createAosProvisioningKey({
  draftId = "",
  source = "manual",
  sourceReference = ""
} = {}) {
  const resolvedDraftId = clean(draftId);
  const resolvedSource = clean(source) || "manual";
  const resolvedReference = clean(sourceReference);

  if (resolvedDraftId) {
    return `${resolvedSource}:${resolvedDraftId}`;
  }

  if (resolvedReference) {
    return `${resolvedSource}:${resolvedReference}`;
  }

  return "";
}

export function normalizeAosProvisioningInput(input = {}) {
  const source = safeObject(input);

  return {
    contractVersion:
      IXI_AOS_PROVISIONING_CONTRACT_VERSION,

    entityId:
      clean(source.entityId),

    definitionId:
      clean(source.definitionId) || null,

    definitionKey:
      clean(source.definitionKey) || null,

    /*
     * Technical legacy/presentation role only.
     * Provisioning must never derive customer
     * business meaning from this value.
     */
    objectType:
      clean(source.objectType) || null,

    displayName:
      clean(source.displayName),

    businessIdentifiers:
      safeArray(source.businessIdentifiers),

    customerCategory:
      source.customerCategory ?? null,

    customerAssetId:
      source.customerAssetId ?? null,

    factualTitle:
      source.factualTitle ?? null,

    value:
      source.value ?? null,

    currency:
      clean(source.currency) || "USD",

    fields:
      safeObject(source.fields),

    identities:
      safeArray(source.identities),

    media:
      safeArray(source.media),

    cardTemplateSlug:
      clean(source.cardTemplateSlug) || null,

    cardTemplateVersion:
      source.cardTemplateVersion ?? null,

    source:
      clean(source.source) || "manual",

    sourceReference:
      clean(source.sourceReference),

    actorId:
      clean(source.actorId) || null,

    draftId:
      clean(source.draftId),

    metadata:
      safeObject(source.metadata)
  };
}

export function validateAosProvisioningInput(input = {}) {
  const normalized =
    normalizeAosProvisioningInput(input);

  const errors = [];

  if (!normalized.entityId) {
    errors.push({
      code: "AOS_ENTITY_REQUIRED",
      field: "entityId",
      message: "AOS Entity is required."
    });
  }

  if (!normalized.displayName) {
    errors.push({
      code: "AOS_OBJECT_NAME_REQUIRED",
      field: "displayName",
      message: "Object name is required before permanent creation."
    });
  }

  const provisioningKey =
    createAosProvisioningKey(normalized);

  if (!provisioningKey) {
    errors.push({
      code: "AOS_PROVISIONING_KEY_REQUIRED",
      field: "draftId",
      message: "A durable provisioning key is required."
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    input: normalized,
    provisioningKey
  };
}

export function hasAosPassportIdentity(object = {}) {
  const source = safeObject(object);

  if (
    clean(source.passportId) ||
    clean(source.ixiPassportId) ||
    clean(source.passport?.passportId) ||
    clean(source.passport?.id)
  ) {
    return true;
  }

  return safeArray(source.identities)
    .some(identity => {
      const item = safeObject(identity);
      const type = clean(
        item.type ||
        item.identityType ||
        item.kind
      );

      const passportId = clean(
        item.passportId ||
        item.value ||
        item.id
      );

      return (
        type === IXI_AOS_OBJECT_IDENTITY_TYPES.PASSPORT &&
        Boolean(passportId)
      );
    });
}

export function getAosPassportId(object = {}) {
  const source = safeObject(object);

  const direct = clean(
    source.passportId ||
    source.ixiPassportId ||
    source.passport?.passportId ||
    source.passport?.id
  );

  if (direct) {
    return direct;
  }

  const identity =
    safeArray(source.identities)
      .find(item => {
        const value = safeObject(item);
        return clean(
          value.type ||
          value.identityType ||
          value.kind
        ) === IXI_AOS_OBJECT_IDENTITY_TYPES.PASSPORT;
      });

  return clean(
    identity?.passportId ||
    identity?.value ||
    identity?.id
  );
}

export function assertProvisionedAosObject(object = {}) {
  const objectId = clean(
    object?.objectId
  );

  const passportId =
    getAosPassportId(object);

  if (!objectId) {
    const error = new Error(
      "Provisioning returned no permanent objectId."
    );
    error.code = "AOS_OBJECT_ID_MISSING";
    throw error;
  }

  if (!passportId) {
    const error = new Error(
      "Provisioning returned an object without IXI Passport identity."
    );
    error.code = "AOS_PASSPORT_IDENTITY_MISSING";
    throw error;
  }

  return {
    objectId,
    passportId
  };
}
