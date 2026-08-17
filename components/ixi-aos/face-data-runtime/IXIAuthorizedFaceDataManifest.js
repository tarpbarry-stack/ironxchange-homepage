import {
  asArray,
  clean,
  getFieldDefinitions,
  getFieldValue,
  getObjectActionCapabilities,
  getObjectCapabilities,
  getObjectDisplayName,
  getObjectId,
  getObjectLabel,
  getObjectPermissions,
  getObjectPluralLabel,
  getObjectRelationships,
  getPrimaryImage,
  buildChildAggregateGroups
} from "../card-runtime/IXIAosSemanticObjectPresentation";

import {
  getBusinessIdentifiers
} from "../card-runtime/IXIAosObjectDataContract";

import {
  createIXIAosFinancialViewModel,
  hasIXIAosFinancialActivity
} from "../financial-runtime/IXIAosFinancialSnapshotRuntime";

import {
  getIXITransactModules
} from "../transact/IXITransactModuleRegistry";

/*
 * =========================================================
 * IXI AOS — AUTHORIZED FACE DATA MANIFEST
 * =========================================================
 *
 * PURPOSE
 * -------
 *
 * Produce the one runtime manifest that Face Studio, IXI Chat,
 * future customer Face Library tooling, and trusted hard-coded
 * Face Apps may inspect when deciding what data can be used for
 * a specific object in a specific authorization context.
 *
 * This runtime DOES NOT grant access.
 *
 * IX-Core / AWS remains the authority for actor/entity policy.
 * This file only consumes effective permissions already resolved
 * onto the object/definitions/relationships/projections and then
 * removes data that is not authorized for Face consumption.
 *
 * CRITICAL DOCTRINE
 * -----------------
 *
 * - customer labels are presentation truth
 * - stable field / relationship / capability IDs are machine truth
 * - never infer business meaning from labels or object names
 * - financial truth comes from the Financial Engine snapshot
 * - Faces may read authorized TRAN$ACT projections
 * - Faces do not mutate financial truth directly
 * - arbitrary external projections are denied unless upstream marks
 *   them explicitly authorized for the current actor/context
 * =========================================================
 */

export const IXI_AUTHORIZED_FACE_DATA_MANIFEST_SCHEMA =
  "ixi-authorized-face-data-manifest-v1";

const FINANCIAL_PROJECTION_KEYS = Object.freeze([
  "commitment",
  "remainingCommitment",
  "incurredCost",
  "paid",
  "unpaid",
  "projectedOutflow",
  "revenue",
  "collected",
  "receivable",
  "operatingNet",
  "inflow",
  "outflow",
  "neutral",
  "net",
  "factCount",
  "documentCount",
  "byFinancialState",
  "byLineType",
  "byDocumentType",
  "recentActivity"
]);

function safeObject(value) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value
    : {};
}

function normalizedSet(value) {
  return new Set(
    asArray(value)
      .map(item => clean(item).toLowerCase())
      .filter(Boolean)
  );
}

function getPermissionDecision(
  permissions = {},
  aliases = [],
  fallback = false
) {
  const denied = normalizedSet(
    permissions?.deniedActions ||
    permissions?.deny ||
    permissions?.denied
  );

  const allowed = normalizedSet(
    permissions?.allowedActions ||
    permissions?.allow ||
    permissions?.allowed
  );

  const normalizedAliases = aliases
    .map(alias => clean(alias).toLowerCase())
    .filter(Boolean);

  if (normalizedAliases.some(alias => denied.has(alias))) {
    return false;
  }

  for (const alias of aliases) {
    if (permissions?.[alias] === false) return false;
  }

  for (const alias of aliases) {
    if (permissions?.[alias] === true) return true;
  }

  if (normalizedAliases.some(alias => allowed.has(alias))) {
    return true;
  }

  return Boolean(fallback);
}

function getObjectType(object = {}) {
  return clean(
    object?.objectType ||
    object?.type ||
    object?.templateType ||
    object?.definition?.objectType ||
    object?.definition?.type
  );
}

function getPassportId(object = {}) {
  return clean(
    object?.passportId ||
    object?.ixiPassportId ||
    object?.passport?.passportId ||
    object?.passport?.id ||
    object?.metadata?.passportId
  );
}

function normalizeFieldCapability(object = {}, definition = {}) {
  const value = getFieldValue(object, definition?.fieldId);

  return {
    capabilityId: `field:${definition.fieldId}`,
    sourceId: "aos-object-contract",
    kind: "field",
    fieldId: definition.fieldId,
    label: definition.label,
    fieldType: definition.fieldType || "text",
    presentationRole: definition.presentationRole || "",
    presentationOrder: Number(definition.presentationOrder || 0),
    editable: definition.editable === true,
    importable: definition.importable !== false,
    exportable: definition.exportable !== false,
    apiAddressable: definition.apiAddressable !== false,
    aggregate: safeObject(definition.aggregate),
    value,
    exposure: "face-safe-now"
  };
}

function normalizeRelationshipCapability(relationship = {}, index = 0) {
  const raw = safeObject(relationship?.raw || relationship);

  return {
    capabilityId: `relationship:${clean(
      raw?.relationshipRole ||
      raw?.role ||
      raw?.type ||
      raw?.relationshipType ||
      relationship?.id ||
      `relationship-${index + 1}`
    )}`,
    sourceId: "aos-object-contract",
    kind: "relationship",
    relationshipId: relationship?.id || "",
    relationshipRole: clean(
      raw?.relationshipRole ||
      raw?.role ||
      raw?.type ||
      raw?.relationshipType
    ),
    label: relationship?.label || "RELATIONSHIP",
    value: relationship?.value || "",
    secondary: relationship?.secondary || "",
    targetObjectId: clean(
      raw?.targetObjectId ||
      raw?.targetId ||
      raw?.objectId
    ),
    targetPassportId: clean(
      raw?.targetPassportId ||
      raw?.passportId
    ),
    exposure: "face-safe-now"
  };
}

function normalizeExternalProjection(projection = {}, index = 0) {
  const projectionId = clean(
    projection?.projectionId ||
    projection?.id ||
    projection?.key ||
    `projection-${index + 1}`
  );

  if (!projectionId || projection?.authorized !== true) {
    return null;
  }

  return {
    capabilityId: `projection:${projectionId}`,
    sourceId: clean(projection?.sourceId || "external-projection"),
    kind: "projection",
    projectionId,
    label: clean(projection?.label || projectionId),
    valueType: clean(projection?.valueType || projection?.type || "unknown"),
    value: projection?.value,
    unit: clean(projection?.unit),
    currency: clean(projection?.currency),
    readOnly: projection?.readOnly !== false,
    permissionScope: clean(projection?.permissionScope),
    exposure: clean(projection?.exposure || "face-safe-with-policy")
  };
}

function getFinancialReadAuthorized(object = {}) {
  const permissions = getObjectPermissions(object);
  const actions = getObjectActionCapabilities(object);

  return getPermissionDecision(
    permissions,
    [
      "financialRead",
      "readFinancial",
      "canReadFinancial",
      "financial",
      "canFinancial",
      "transact",
      "canTransact"
    ],
    actions.canTransact === true
  );
}

function createFinancialProjectionManifest({
  object = {},
  financialSource = null,
  currency = "USD"
} = {}) {
  if (!financialSource || !getFinancialReadAuthorized(object)) {
    return {
      authorized: false,
      hasActivity: false,
      sourceId: "ixi-transact-financial-snapshot",
      projections: []
    };
  }

  const viewModel = createIXIAosFinancialViewModel({
    source: financialSource,
    currency
  });

  const projections = FINANCIAL_PROJECTION_KEYS.map(key => ({
    capabilityId: `projection:transact.financial.${key}`,
    sourceId: "ixi-transact-financial-snapshot",
    kind: "projection",
    projectionId: `transact.financial.${key}`,
    label: key,
    value: viewModel?.[key],
    currency: viewModel?.currency || currency,
    readOnly: true,
    exposure: "face-safe-with-policy"
  }));

  return {
    authorized: true,
    hasActivity: hasIXIAosFinancialActivity(financialSource, currency),
    sourceId: "ixi-transact-financial-snapshot",
    currency: viewModel?.currency || currency,
    scope: {
      passportId: viewModel?.passportId || "",
      rootPassportId: viewModel?.rootPassportId || "",
      scopePassportIds: asArray(viewModel?.scopePassportIds)
    },
    projections
  };
}

function createMediaManifest(object = {}) {
  const primaryImage = getPrimaryImage(object);
  const media = asArray(object?.media)
    .filter(item => {
      if (!item || typeof item === "string") return Boolean(item);

      const permissions = {
        ...safeObject(item?.access),
        ...safeObject(item?.permissions),
        ...safeObject(item?.effectivePermissions)
      };

      return getPermissionDecision(
        permissions,
        ["view", "read", "canView", "canRead"],
        true
      );
    })
    .map((item, index) => {
      if (typeof item === "string") {
        return {
          mediaId: `media-${index + 1}`,
          url: item,
          kind: "media"
        };
      }

      return {
        mediaId: clean(item?.mediaId || item?.id || `media-${index + 1}`),
        url: clean(item?.url || item?.src || item?.imageUrl),
        kind: clean(item?.kind || item?.type || "media"),
        label: clean(item?.label || item?.name || item?.filename),
        mimeType: clean(item?.mimeType || item?.contentType)
      };
    });

  return {
    sourceId: "aos-object-media",
    exposure: "face-safe-now",
    primaryImage,
    items: media
  };
}

export function createIXIAuthorizedFaceDataManifest({
  object = {},
  children = [],
  actor = {},
  entity = {},
  financialSource = null,
  transactProjections = [],
  platformCapabilities = [],
  currency = "USD"
} = {}) {
  const actions = getObjectActionCapabilities(object);
  const permissions = getObjectPermissions(object);

  if (actions.canView === false) {
    return {
      schema: IXI_AUTHORIZED_FACE_DATA_MANIFEST_SCHEMA,
      generatedAt: new Date().toISOString(),
      authorized: false,
      reason: "object-view-denied",
      object: {
        objectId: getObjectId(object),
        passportId: getPassportId(object)
      },
      capabilities: []
    };
  }

  const fields = getFieldDefinitions(object)
    .map(definition => normalizeFieldCapability(object, definition));

  const relationships = getObjectRelationships(object)
    .map(normalizeRelationshipCapability);

  const financial = createFinancialProjectionManifest({
    object,
    financialSource,
    currency
  });

  const externalProjections = asArray(transactProjections)
    .map(normalizeExternalProjection)
    .filter(Boolean);

  const aggregates = buildChildAggregateGroups(children);
  const media = createMediaManifest(object);
  const objectType = getObjectType(object);

  const transactPermissionTokens = asArray(
    permissions?.transactPermissions ||
    object?.transactPermissions ||
    object?.authorization?.transactPermissions
  );

  const transactModules = actions.canTransact
    ? getIXITransactModules({
        objectType,
        permissions: transactPermissionTokens
      })
    : [];

  const declaredPlatformCapabilities = asArray(platformCapabilities)
    .filter(capability => capability?.authorized === true)
    .map(capability => ({
      ...capability,
      capabilityId: clean(
        capability?.capabilityId ||
        capability?.id ||
        capability?.key
      ),
      sourceId: clean(capability?.sourceId || "ixi-platform"),
      exposure: clean(capability?.exposure || "face-safe-with-policy")
    }))
    .filter(capability => capability.capabilityId);

  return {
    schema: IXI_AUTHORIZED_FACE_DATA_MANIFEST_SCHEMA,
    generatedAt: new Date().toISOString(),
    authorized: true,

    subject: {
      actorId: clean(actor?.userId || actor?.id),
      actorPassportId: clean(actor?.passportId || actor?.ixiPassportId),
      entityId: clean(entity?.entityId || entity?.id),
      entityPassportId: clean(entity?.passportId || entity?.ixiPassportId)
    },

    object: {
      objectId: getObjectId(object),
      passportId: getPassportId(object),
      objectType,
      label: getObjectLabel(object),
      pluralLabel: getObjectPluralLabel(object),
      displayName: getObjectDisplayName(object),
      businessIdentifiers: getBusinessIdentifiers(object)
    },

    permissions: {
      canView: actions.canView,
      canEdit: actions.canEdit,
      canCreate: actions.canCreate,
      canDelete: actions.canDelete,
      canHide: actions.canHide,
      canOpenConsole: actions.canOpenConsole,
      canTransact: actions.canTransact,
      canReadFinancial: financial.authorized
    },

    objectCapabilities: getObjectCapabilities(object),

    data: {
      fields,
      relationships,
      aggregates,
      media,
      financial: financial.projections,
      externalProjections,
      platformCapabilities: declaredPlatformCapabilities
    },

    transact: {
      available: actions.canTransact === true,
      financialReadAuthorized: financial.authorized,
      hasFinancialActivity: financial.hasActivity,
      financialScope: financial.scope || null,
      modules: transactModules.map(module => ({
        id: module.id,
        label: module.label,
        group: module.group,
        documentType: module.documentType
      }))
    },

    faceAuthoring: {
      mayUseFields: fields.map(field => field.fieldId),
      mayUseRelationshipRoles: relationships
        .map(relationship => relationship.relationshipRole)
        .filter(Boolean),
      mayUseFinancialProjections: financial.projections
        .map(projection => projection.projectionId),
      mayUseExternalProjections: externalProjections
        .map(projection => projection.projectionId),
      mayUsePlatformCapabilities: declaredPlatformCapabilities
        .map(capability => capability.capabilityId),
      mayUseAggregates: aggregates
        .map(group => group.groupId)
        .filter(Boolean)
    }
  };
}

export function getIXIAuthorizedFaceCapabilityIds(manifest = {}) {
  const data = safeObject(manifest?.data);

  return [
    ...asArray(data?.fields).map(item => item?.capabilityId),
    ...asArray(data?.relationships).map(item => item?.capabilityId),
    ...asArray(data?.financial).map(item => item?.capabilityId),
    ...asArray(data?.externalProjections).map(item => item?.capabilityId),
    ...asArray(data?.platformCapabilities).map(item => item?.capabilityId)
  ]
    .map(clean)
    .filter(Boolean);
}

export function hasIXIAuthorizedFaceCapability(
  manifest = {},
  capabilityId = ""
) {
  const target = clean(capabilityId);
  if (!target) return false;

  return getIXIAuthorizedFaceCapabilityIds(manifest)
    .includes(target);
}

export default {
  createIXIAuthorizedFaceDataManifest,
  getIXIAuthorizedFaceCapabilityIds,
  hasIXIAuthorizedFaceCapability
};
