/*
 * IXI AOS — FACE DATA TWO-SOURCE CONTRACT
 *
 * The Object is the truth.
 *
 * A Face may display factual information about that Object from only:
 *
 *   1. TRAN$ACT records / authorized projections attached to the Object.
 *   2. Customer-defined fields whose values are maintained by a
 *      permissioned user for the Object / Face experience.
 *
 * Relationships, media, capabilities, definitions, labels, geometry,
 * permissions and presentation metadata remain useful context, but they
 * are not additional factual Face-data origins.
 */

export const IXI_FACE_DATA_SOURCE_CONTRACT_VERSION =
  "ixi-face-data-two-source-v1";

export const IXI_FACE_DATA_SOURCE = Object.freeze({
  TRANSACT: "transact",
  USER_FIELD: "permissioned-user-field"
});

function clean(value) {
  return String(value ?? "").trim();
}

function asArray(value) {
  return Array.isArray(value)
    ? value
    : [];
}

function unique(values = []) {
  return [
    ...new Set(
      values
        .map(clean)
        .filter(Boolean)
    )
  ];
}

export function getIXIUserFaceFieldCapabilities(
  manifest = {}
) {
  return asArray(
    manifest?.data?.fields
  )
    .map(item => ({
      ...item,
      faceDataSource:
        IXI_FACE_DATA_SOURCE.USER_FIELD,
      factual: true
    }))
    .filter(item =>
      clean(item?.capabilityId)
        .startsWith("field:")
    );
}

export function getIXITransactFaceDataCapabilities(
  manifest = {}
) {
  const financial =
    asArray(
      manifest?.data?.financial
    );

  /*
   * The existing manifest parameter is named transactProjections.
   * Those authorized projections are therefore part of the TRAN$ACT
   * side of the two-source contract even when an upstream adapter has
   * supplied a more specific sourceId.
   */
  const projections =
    asArray(
      manifest?.data
        ?.externalProjections
    );

  return [
    ...financial,
    ...projections
  ]
    .map(item => ({
      ...item,
      faceDataSource:
        IXI_FACE_DATA_SOURCE.TRANSACT,
      factual: true,
      readOnly: true
    }))
    .filter(item =>
      clean(item?.capabilityId)
        .startsWith("projection:")
    );
}

export function getIXIFactualFaceDataCapabilities(
  manifest = {}
) {
  return [
    ...getIXIUserFaceFieldCapabilities(
      manifest
    ),
    ...getIXITransactFaceDataCapabilities(
      manifest
    )
  ];
}

export function getIXIFactualFaceDataCapabilityIds(
  manifest = {}
) {
  return unique(
    getIXIFactualFaceDataCapabilities(
      manifest
    ).map(
      item => item?.capabilityId
    )
  );
}

export function getIXIFaceDataSourceForCapability(
  manifest = {},
  capabilityId = ""
) {
  const target =
    clean(capabilityId);

  if (!target) {
    return null;
  }

  const item =
    getIXIFactualFaceDataCapabilities(
      manifest
    ).find(
      capability =>
        clean(
          capability?.capabilityId
        ) === target
    );

  return item?.faceDataSource || null;
}

export function canIXIActorEditUserFaceField({
  manifest = {},
  capabilityId = ""
} = {}) {
  if (
    manifest?.authorized !== true ||
    manifest?.permissions?.canEdit !== true
  ) {
    return false;
  }

  const target =
    clean(capabilityId);

  const field =
    getIXIUserFaceFieldCapabilities(
      manifest
    ).find(
      item =>
        clean(item?.capabilityId) ===
          target
    );

  return field?.editable === true;
}

export function createIXIFaceDataSourceView(
  manifest = {}
) {
  const userFields =
    getIXIUserFaceFieldCapabilities(
      manifest
    );

  const transact =
    getIXITransactFaceDataCapabilities(
      manifest
    );

  return {
    contractVersion:
      IXI_FACE_DATA_SOURCE_CONTRACT_VERSION,
    objectId:
      clean(
        manifest?.object?.objectId
      ),
    passportId:
      clean(
        manifest?.object?.passportId
      ),
    sources: {
      userFields,
      transact
    },
    capabilityIds:
      unique([
        ...userFields.map(
          item => item?.capabilityId
        ),
        ...transact.map(
          item => item?.capabilityId
        )
      ])
  };
}

export default {
  IXI_FACE_DATA_SOURCE_CONTRACT_VERSION,
  IXI_FACE_DATA_SOURCE,
  getIXIUserFaceFieldCapabilities,
  getIXITransactFaceDataCapabilities,
  getIXIFactualFaceDataCapabilities,
  getIXIFactualFaceDataCapabilityIds,
  getIXIFaceDataSourceForCapability,
  canIXIActorEditUserFaceField,
  createIXIFaceDataSourceView
};
