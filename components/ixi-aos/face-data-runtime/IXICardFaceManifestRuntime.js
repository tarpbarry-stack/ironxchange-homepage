import {
  createIXIAuthorizedFaceDataManifest
} from "./IXIAuthorizedFaceDataManifest";

import {
  getIXIAuthorizedFaceDataCapabilityIds
} from "./IXIFaceDataSourceContract";

/*
 * IXI AOS — CARD / FACE MANIFEST RUNTIME
 *
 * The Object is truth.
 *
 * This module does not create another data store and does not infer business
 * meaning from a card number, object name, field label or container.
 *
 * Factual Face values have exactly two origins:
 *   1. permissioned user-maintained fields;
 *   2. authorized TRAN$ACT records/projections attached to the Object.
 *
 * Everything else in the authorized manifest is context/configuration used by
 * Cards/Faces to render or operate the Object. Card geometry remains untouched.
 */

export const IXI_CARD_FACE_MANIFEST_SCHEMA =
  "ixi-card-face-manifest-v1";

function clean(value) {
  return String(value ?? "").trim();
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function safeObject(value) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value
    : {};
}

export function createIXICardFaceManifest(options = {}) {
  const authorizedManifest =
    createIXIAuthorizedFaceDataManifest(options);

  const objectId = clean(authorizedManifest?.object?.objectId);
  const passportId = clean(authorizedManifest?.object?.passportId);

  if (authorizedManifest?.authorized !== true) {
    return {
      schema: IXI_CARD_FACE_MANIFEST_SCHEMA,
      generatedAt: new Date().toISOString(),
      authorized: false,
      reason: clean(authorizedManifest?.reason || "face-data-not-authorized"),
      object: { objectId, passportId },
      factualData: {
        userFields: [],
        transact: []
      },
      context: {},
      permissions: safeObject(authorizedManifest?.permissions)
    };
  }

  const data = safeObject(authorizedManifest?.data);
  const userFields = asArray(data?.fields);
  const transact = [
    ...asArray(data?.financial),
    ...asArray(data?.externalProjections)
  ];

  return {
    schema: IXI_CARD_FACE_MANIFEST_SCHEMA,
    generatedAt: new Date().toISOString(),
    authorized: true,

    object: safeObject(authorizedManifest?.object),
    subject: safeObject(authorizedManifest?.subject),
    permissions: safeObject(authorizedManifest?.permissions),

    factualData: {
      userFields,
      transact
    },

    factualCapabilityIds:
      getIXIAuthorizedFaceDataCapabilityIds(authorizedManifest),

    context: {
      relationships: asArray(data?.relationships),
      aggregates: asArray(data?.aggregates),
      media: safeObject(data?.media),
      platformCapabilities: asArray(data?.platformCapabilities),
      objectCapabilities: safeObject(authorizedManifest?.objectCapabilities),
      transact: safeObject(authorizedManifest?.transact),
      faceAuthoring: safeObject(authorizedManifest?.faceAuthoring)
    },

    sourceContract: {
      factualSourceCount: 2,
      factualSources: [
        "permissioned-user-field",
        "transact"
      ],
      objectIsTruth: true
    }
  };
}

export function assertIXICardFaceManifest(manifest = {}) {
  if (manifest?.authorized !== true) {
    const error = new Error(
      "Card/Face manifest is not authorized for this Object/context."
    );
    error.code = "IXI_CARD_FACE_MANIFEST_NOT_AUTHORIZED";
    throw error;
  }

  const objectId = clean(manifest?.object?.objectId);
  if (!objectId) {
    const error = new Error("Card/Face manifest requires permanent Object identity.");
    error.code = "IXI_CARD_FACE_OBJECT_ID_REQUIRED";
    throw error;
  }

  return manifest;
}

export default {
  createIXICardFaceManifest,
  assertIXICardFaceManifest
};
