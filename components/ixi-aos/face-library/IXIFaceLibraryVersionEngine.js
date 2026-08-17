import {
  createFaceVersion,
  getFaceVersion
} from "./IXIFaceLibraryContract";

const clean = value => String(value ?? "").trim();
const safeArray = value => Array.isArray(value) ? value : [];

export function assertDraftMutable(record = {}) {
  const version = getFaceVersion(record, record?.currentDraftVersion);
  if (!version || version.status !== "draft" || version.immutable === true) {
    throw new Error("FACE_DRAFT_NOT_MUTABLE");
  }
  return version;
}

export function createNextDraftVersion({
  record = {},
  actorId = "",
  changeReason = ""
} = {}) {
  const source = getFaceVersion(
    record,
    record?.currentPublishedVersion || record?.currentDraftVersion || record?.latestVersion
  );

  if (!source) throw new Error("FACE_SOURCE_VERSION_NOT_FOUND");

  const nextVersion = Math.max(
    Number(record?.latestVersion || 0),
    ...safeArray(record?.versions).map(item => Number(item?.version || 0))
  ) + 1;

  const draft = createFaceVersion({
    ...source,
    version: nextVersion,
    status: "draft",
    createdBy: clean(actorId),
    changeReason
  });

  return {
    ...record,
    status: record?.currentPublishedVersion ? "active" : "draft",
    currentDraftVersion: nextVersion,
    latestVersion: nextVersion,
    versions: [...safeArray(record?.versions), draft],
    audit: {
      ...(record?.audit || {}),
      modifiedBy: clean(actorId),
      modifiedAt: new Date().toISOString()
    }
  };
}

export function replaceDraftVersion({
  record = {},
  nextDefinition = {},
  actorId = "",
  changeReason = ""
} = {}) {
  const draft = assertDraftMutable(record);
  const versions = safeArray(record?.versions).map(version => {
    if (Number(version?.version) !== Number(draft.version)) return version;

    const next = createFaceVersion({
      ...draft,
      ...nextDefinition,
      faceAppId: record?.faceAppId || draft?.faceAppId,
      version: draft.version,
      status: "draft",
      createdBy: draft?.audit?.createdBy || actorId,
      changeReason: clean(changeReason || draft?.audit?.changeReason)
    });

    return {
      ...next,
      audit: {
        ...next.audit,
        createdAt: draft?.audit?.createdAt || next.audit.createdAt,
        modifiedBy: clean(actorId),
        modifiedAt: new Date().toISOString()
      }
    };
  });

  return {
    ...record,
    versions,
    audit: {
      ...(record?.audit || {}),
      modifiedBy: clean(actorId),
      modifiedAt: new Date().toISOString()
    }
  };
}

export function publishDraftVersion({
  record = {},
  actorId = "",
  checksum = "",
  validation = null
} = {}) {
  const draft = assertDraftMutable(record);

  if (!validation || validation.authorized !== true || validation.publishable !== true) {
    throw new Error("FACE_PUBLISH_VALIDATION_REQUIRED");
  }

  const now = new Date().toISOString();
  const versions = safeArray(record?.versions).map(version => {
    if (Number(version?.version) !== Number(draft.version)) return version;

    return {
      ...version,
      status: "active",
      immutable: true,
      checksum: clean(checksum),
      validation,
      audit: {
        ...(version?.audit || {}),
        publishedBy: clean(actorId),
        publishedAt: now
      }
    };
  });

  return {
    ...record,
    status: "active",
    currentPublishedVersion: draft.version,
    currentDraftVersion: null,
    versions,
    audit: {
      ...(record?.audit || {}),
      modifiedBy: clean(actorId),
      modifiedAt: now,
      publishedBy: clean(actorId),
      publishedAt: now
    }
  };
}

export function retirePublishedFace({
  record = {},
  actorId = "",
  reason = ""
} = {}) {
  const published = getFaceVersion(record, record?.currentPublishedVersion);
  if (!published || published.status !== "active") {
    throw new Error("FACE_ACTIVE_VERSION_NOT_FOUND");
  }

  const now = new Date().toISOString();
  const versions = safeArray(record?.versions).map(version =>
    Number(version?.version) === Number(published.version)
      ? {
          ...version,
          status: "retired",
          immutable: true,
          audit: {
            ...(version?.audit || {}),
            retiredBy: clean(actorId),
            retiredAt: now,
            retireReason: clean(reason)
          }
        }
      : version
  );

  return {
    ...record,
    status: "retired",
    currentPublishedVersion: null,
    versions,
    audit: {
      ...(record?.audit || {}),
      modifiedBy: clean(actorId),
      modifiedAt: now,
      retiredBy: clean(actorId),
      retiredAt: now,
      retireReason: clean(reason)
    }
  };
}

export default {
  assertDraftMutable,
  createNextDraftVersion,
  replaceDraftVersion,
  publishDraftVersion,
  retirePublishedFace
};
