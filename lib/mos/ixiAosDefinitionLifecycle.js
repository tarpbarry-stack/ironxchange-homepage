import {
  createMosObjectDefinition,
  fetchMosObjectDefinition,
  fetchMosObjectDefinitions,
  updateMosObjectDefinition
} from "./ixiMosClient";

export const IXI_AOS_DEFINITION_LIFECYCLE_VERSION =
  "ixi-aos-definition-lifecycle-v1";

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

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeKey(value) {
  return clean(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function normalizeStudioFieldSchema(
  fieldDefinitions = []
) {
  return safeArray(fieldDefinitions)
    .map((field, index) => {
      const source = safeObject(field);
      const fieldId = clean(
        source.fieldId ||
        source.field ||
        source.key
      );

      if (!fieldId) return null;

      return {
        field: fieldId,
        label:
          clean(source.label) || fieldId,
        type:
          clean(
            source.fieldType ||
            source.type
          ).toLowerCase() || "text",
        required:
          source.required === true,
        editable:
          source.editable !== false,
        importable:
          source.importable !== false,
        exportable:
          source.exportable !== false,
        apiAddressable:
          source.apiAddressable !== false,
        searchable:
          source.searchable !== false,
        presentationOrder:
          Number(
            source.presentationOrder ?? index
          ),
        metadata:
          clone(safeObject(source.metadata))
      };
    })
    .filter(Boolean);
}

export function normalizeDefinitionIntent(
  launchPayload = {}
) {
  const object = safeObject(
    launchPayload?.object
  );
  const metadata = safeObject(
    object.metadata
  );
  const resolution = safeObject(
    metadata.definitionResolution
  );
  const raw = safeObject(
    object.definitionDraft ||
    metadata.definitionDraft
  );

  if (raw.enabled !== true) {
    return {
      enabled: false
    };
  }

  const existingDefinitionId = clean(
    object.definitionId ||
    metadata.definitionId ||
    resolution.definitionId ||
    raw.definitionId
  );

  const hydratedDefinitionKey = clean(
    object.definitionKey ||
    metadata.definitionKey ||
    resolution.definitionKey
  );

  const label = clean(raw.label);
  const definitionKey =
    clean(raw.definitionKey) ||
    hydratedDefinitionKey ||
    normalizeKey(label);

  if (!existingDefinitionId && !label) {
    const error = new Error(
      "A reusable Object Definition requires an explicit customer-defined label."
    );
    error.code =
      "AOS_DEFINITION_LABEL_REQUIRED";
    throw error;
  }

  if (!existingDefinitionId && !definitionKey) {
    const error = new Error(
      "A reusable Object Definition requires a stable definition key."
    );
    error.code =
      "AOS_DEFINITION_KEY_REQUIRED";
    throw error;
  }

  return {
    enabled: true,
    existingDefinitionId:
      existingDefinitionId || null,
    label: label || null,
    definitionKey:
      definitionKey || null,
    syncFieldSchema:
      raw.syncFieldSchema !== false,
    capabilities:
      clone(safeObject(raw.capabilities)),
    businessIdentifierSchema:
      raw.businessIdentifierSchema === null
        ? null
        : clone(
            safeObject(
              raw.businessIdentifierSchema
            )
          ),
    metadata:
      clone(safeObject(raw.metadata))
  };
}

function extractDefinition(payload) {
  return (
    payload?.definition ||
    payload?.record ||
    payload?.data?.definition ||
    null
  );
}

async function findDefinitionByKey({
  entityId,
  definitionKey
}) {
  const response =
    await fetchMosObjectDefinitions({
      entityId,
      status: "active"
    });

  return safeArray(response?.definitions)
    .find(
      definition =>
        clean(definition?.definitionKey) ===
          clean(definitionKey)
    ) || null;
}

export async function ensureStudioDefinition({
  launchPayload,
  entityId,
  actorId = null
} = {}) {
  const intent =
    normalizeDefinitionIntent(
      launchPayload
    );

  if (!intent.enabled) {
    return {
      changed: false,
      created: false,
      updated: false,
      definition: null,
      launchPayload
    };
  }

  const object = safeObject(
    launchPayload?.object
  );

  const fieldSchema =
    intent.syncFieldSchema
      ? normalizeStudioFieldSchema(
          object.fieldDefinitions
        )
      : undefined;

  let definition = null;
  let created = false;
  let updated = false;

  if (intent.existingDefinitionId) {
    const currentPayload =
      await fetchMosObjectDefinition({
        entityId,
        definitionId:
          intent.existingDefinitionId
      });

    const current =
      extractDefinition(currentPayload);

    if (!current) {
      const error = new Error(
        "Object Studio could not resolve the existing Object Definition."
      );
      error.code =
        "AOS_DEFINITION_NOT_FOUND";
      throw error;
    }

    const patch = {
      actorId,
      metadata: {
        ...safeObject(current.metadata),
        ...intent.metadata,
        lifecycleVersion:
          IXI_AOS_DEFINITION_LIFECYCLE_VERSION,
        source: "object-studio"
      }
    };

    if (intent.label) {
      patch.label = intent.label;
    }
    if (intent.definitionKey) {
      patch.definitionKey =
        intent.definitionKey;
    }
    if (fieldSchema !== undefined) {
      patch.fieldSchema = fieldSchema;
    }
    if (Object.keys(intent.capabilities).length) {
      patch.capabilities =
        intent.capabilities;
    }
    if (
      intent.businessIdentifierSchema &&
      Object.keys(
        intent.businessIdentifierSchema
      ).length
    ) {
      patch.businessIdentifierSchema =
        intent.businessIdentifierSchema;
    }

    const updatedPayload =
      await updateMosObjectDefinition({
        entityId,
        definitionId:
          intent.existingDefinitionId,
        ...patch
      });

    definition =
      extractDefinition(updatedPayload) ||
      current;
    updated = true;
  } else {
    const existingByKey =
      await findDefinitionByKey({
        entityId,
        definitionKey:
          intent.definitionKey
      });

    if (existingByKey) {
      if (
        intent.label &&
        clean(existingByKey.label) !==
          intent.label
      ) {
        const error = new Error(
          "A different active Object Definition already owns this definition key."
        );
        error.code =
          "AOS_DEFINITION_KEY_CONFLICT";
        error.details = {
          definitionKey:
            intent.definitionKey,
          definitionId:
            existingByKey.definitionId,
          existingLabel:
            existingByKey.label,
          requestedLabel:
            intent.label
        };
        throw error;
      }

      definition = existingByKey;
    } else {
      const createdPayload =
        await createMosObjectDefinition({
          entityId,
          label: intent.label,
          definitionKey:
            intent.definitionKey,
          capabilities:
            intent.capabilities,
          fieldSchema:
            fieldSchema || [],
          businessIdentifierSchema:
            intent.businessIdentifierSchema,
          metadata: {
            ...intent.metadata,
            lifecycleVersion:
              IXI_AOS_DEFINITION_LIFECYCLE_VERSION,
            source: "object-studio"
          },
          actorId
        });

      definition =
        extractDefinition(createdPayload);
      created = true;
    }
  }

  const definitionId = clean(
    definition?.definitionId
  );

  if (!definitionId) {
    const error = new Error(
      "Object Definition persistence returned no definitionId."
    );
    error.code =
      "AOS_DEFINITION_ID_MISSING";
    throw error;
  }

  const definitionKey = clean(
    definition?.definitionKey ||
    intent.definitionKey
  );

  const next = clone(launchPayload);
  next.object = {
    ...safeObject(next.object),
    definitionId,
    definitionKey:
      definitionKey || null,
    metadata: {
      ...safeObject(next.object?.metadata),
      definitionId,
      definitionKey:
        definitionKey || null,
      definitionLifecycle: {
        contractVersion:
          IXI_AOS_DEFINITION_LIFECYCLE_VERSION,
        definitionId,
        definitionKey:
          definitionKey || null,
        created,
        updated
      }
    }
  };

  return {
    changed: true,
    created,
    updated,
    definition,
    launchPayload: next
  };
}

export default {
  IXI_AOS_DEFINITION_LIFECYCLE_VERSION,
  normalizeStudioFieldSchema,
  normalizeDefinitionIntent,
  ensureStudioDefinition
};
