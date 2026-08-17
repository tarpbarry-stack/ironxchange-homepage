import {
  createAosDraftId,
  IXI_AOS_DRAFT_CONTRACT_VERSION
} from "../../../lib/mos/ixiAosProvisioningContract";

function clean(value) {
  return String(value ?? "").trim();
}

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

export function createIXIAosObjectDraft({
  entityId = "",
  definitionId = null,
  definitionKey = null,
  displayName = "",
  businessIdentifiers = [],
  fields = {},
  media = [],
  cardTemplateSlug = null,
  cardTemplateVersion = null,
  source = "manual",
  sourceReference = "",
  metadata = {}
} = {}) {
  const now =
    new Date().toISOString();

  return {
    contractVersion:
      IXI_AOS_DRAFT_CONTRACT_VERSION,

    draftId:
      createAosDraftId(),

    entityId:
      clean(entityId),

    definitionId:
      clean(definitionId) || null,

    definitionKey:
      clean(definitionKey) || null,

    displayName:
      clean(displayName),

    businessIdentifiers:
      safeArray(businessIdentifiers),

    fields:
      safeObject(fields),

    media:
      safeArray(media),

    cardTemplateSlug:
      clean(cardTemplateSlug) || null,

    cardTemplateVersion:
      cardTemplateVersion ?? null,

    source:
      clean(source) || "manual",

    sourceReference:
      clean(sourceReference),

    metadata:
      safeObject(metadata),

    state:
      "draft",

    createdAt:
      now,

    updatedAt:
      now
  };
}

export function updateIXIAosObjectDraft(
  draft,
  patch = {}
) {
  const current =
    safeObject(draft);

  const nextPatch =
    safeObject(patch);

  return {
    ...current,
    ...nextPatch,

    draftId:
      clean(current.draftId) ||
      createAosDraftId(),

    contractVersion:
      IXI_AOS_DRAFT_CONTRACT_VERSION,

    entityId:
      clean(
        nextPatch.entityId !== undefined
          ? nextPatch.entityId
          : current.entityId
      ),

    definitionId:
      clean(
        nextPatch.definitionId !== undefined
          ? nextPatch.definitionId
          : current.definitionId
      ) || null,

    definitionKey:
      clean(
        nextPatch.definitionKey !== undefined
          ? nextPatch.definitionKey
          : current.definitionKey
      ) || null,

    displayName:
      clean(
        nextPatch.displayName !== undefined
          ? nextPatch.displayName
          : current.displayName
      ),

    businessIdentifiers:
      nextPatch.businessIdentifiers !== undefined
        ? safeArray(nextPatch.businessIdentifiers)
        : safeArray(current.businessIdentifiers),

    fields:
      nextPatch.fields !== undefined
        ? safeObject(nextPatch.fields)
        : safeObject(current.fields),

    media:
      nextPatch.media !== undefined
        ? safeArray(nextPatch.media)
        : safeArray(current.media),

    metadata:
      nextPatch.metadata !== undefined
        ? safeObject(nextPatch.metadata)
        : safeObject(current.metadata),

    state:
      "draft",

    updatedAt:
      new Date().toISOString()
  };
}

export function isIXIAosDraftPersistable(
  draft
) {
  return Boolean(
    clean(draft?.entityId) &&
    clean(draft?.displayName) &&
    clean(draft?.draftId)
  );
}

export function buildIXIAosDraftProvisioningInput({
  draft,
  actorId = null,
  metadata = {}
} = {}) {
  const source =
    safeObject(draft);

  return {
    entityId:
      source.entityId,

    definitionId:
      source.definitionId,

    definitionKey:
      source.definitionKey,

    displayName:
      source.displayName,

    businessIdentifiers:
      source.businessIdentifiers,

    fields:
      source.fields,

    media:
      source.media,

    cardTemplateSlug:
      source.cardTemplateSlug,

    cardTemplateVersion:
      source.cardTemplateVersion,

    source:
      source.source,

    sourceReference:
      source.sourceReference,

    actorId,

    draftId:
      source.draftId,

    metadata: {
      ...safeObject(source.metadata),
      ...safeObject(metadata),
      draftContractVersion:
        source.contractVersion ||
        IXI_AOS_DRAFT_CONTRACT_VERSION
    }
  };
}

export default {
  createIXIAosObjectDraft,
  updateIXIAosObjectDraft,
  isIXIAosDraftPersistable,
  buildIXIAosDraftProvisioningInput
};
