/* =========================================================
   IXI AOS — GENERIC SEMANTIC OBJECT PRESENTATION

   Doctrine:
   - persisted object/schema truth owns meaning
   - customer labels are authoritative
   - renderers never infer business meaning from field names
   - objectType is not a business-rule switch
   - capabilities decide available actions
   ========================================================= */

export function clean(value) {
  return String(value ?? "").trim();
}

export function asArray(value) {
  return Array.isArray(value) ? value : [];
}

export function safeObject(value) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value
    : {};
}

export function getObjectFields(object = {}) {
  return safeObject(object?.fields);
}

export function getObjectMetadata(object = {}) {
  return safeObject(object?.metadata);
}

export function getObjectDefinition(object = {}) {
  const fields = getObjectFields(object);
  const metadata = getObjectMetadata(object);
  return safeObject(
    object?.definition ||
    fields?.definition ||
    metadata?.definition
  );
}

export function getObjectPresentation(object = {}) {
  const fields = getObjectFields(object);
  const metadata = getObjectMetadata(object);
  const definition = getObjectDefinition(object);

  return {
    ...safeObject(definition?.presentation),
    ...safeObject(metadata?.presentation),
    ...safeObject(fields?.presentation),
    ...safeObject(object?.presentation)
  };
}

export function getObjectId(object = {}) {
  return clean(object?.objectId || object?.id?.uuid || object?.id);
}

export function getObjectDisplayName(object = {}) {
  const fields = getObjectFields(object);
  return clean(
    object?.displayName ||
    object?.label ||
    object?.name ||
    fields?.displayName ||
    fields?.name ||
    fields?.title
  ) || "OBJECT";
}

export function getObjectLabel(object = {}) {
  const fields = getObjectFields(object);
  const metadata = getObjectMetadata(object);
  const definition = getObjectDefinition(object);
  return clean(
    object?.singularLabel ||
    fields?.singularLabel ||
    definition?.singularLabel ||
    definition?.nomenclature?.singular ||
    metadata?.singularLabel ||
    metadata?.nomenclature?.singular ||
    getObjectPresentation(object)?.objectLabel
  ) || "OBJECT";
}

export function getObjectPluralLabel(object = {}) {
  const fields = getObjectFields(object);
  const metadata = getObjectMetadata(object);
  const definition = getObjectDefinition(object);
  return clean(
    object?.pluralLabel ||
    fields?.pluralLabel ||
    definition?.pluralLabel ||
    definition?.nomenclature?.plural ||
    metadata?.pluralLabel ||
    metadata?.nomenclature?.plural ||
    getObjectPresentation(object)?.pluralLabel
  ) || "OBJECTS";
}

function normalizeFieldDefinition(definition = {}, index = 0) {
  const fieldId = clean(
    definition?.fieldId ||
    definition?.field ||
    definition?.key ||
    definition?.slug
  );

  if (!fieldId) return null;

  const presentation = safeObject(definition?.presentation);
  const aggregateSource = definition?.aggregate;
  const aggregate = typeof aggregateSource === "string"
    ? { mode: clean(aggregateSource) }
    : safeObject(aggregateSource);

  return {
    ...definition,
    fieldId,
    label: clean(definition?.label || definition?.displayLabel || fieldId),
    fieldType: clean(definition?.fieldType || definition?.type || "text").toLowerCase(),
    presentationRole: clean(
      definition?.presentationRole ||
      definition?.semanticRole ||
      definition?.role ||
      presentation?.role
    ).toLowerCase(),
    presentationOrder: Number(
      definition?.presentationOrder ?? presentation?.order ?? index
    ),
    editable: definition?.editable !== false && definition?.readOnly !== true,
    aggregate: {
      mode: clean(
        aggregate?.mode ||
        aggregate?.type ||
        definition?.aggregateMode
      ).toLowerCase(),
      groupId: clean(
        aggregate?.groupId ||
        aggregate?.group ||
        definition?.aggregateGroup
      ),
      label: clean(
        aggregate?.label ||
        definition?.aggregateLabel ||
        definition?.label ||
        definition?.displayLabel
      ),
      order: Number(
        aggregate?.order ??
        definition?.aggregateOrder ??
        index
      ),
      hero: aggregate?.hero === true || definition?.aggregateHero === true,
      visible: aggregate?.visible !== false
    }
  };
}

export function getFieldDefinitions(object = {}) {
  const metadata = getObjectMetadata(object);
  const definition = getObjectDefinition(object);

  const sources = [
    object?.fieldDefinitions,
    object?.fieldSchema,
    definition?.fieldDefinitions,
    definition?.fieldSchema,
    metadata?.fieldDefinitions,
    metadata?.fieldSchema
  ];

  for (const source of sources) {
    if (!Array.isArray(source) || !source.length) continue;
    return source
      .map(normalizeFieldDefinition)
      .filter(Boolean)
      .sort((a, b) => a.presentationOrder - b.presentationOrder);
  }

  /*
   * Compatibility fallback: expose persisted fields without assigning
   * business meaning. Their order is persisted object order only.
   */
  return Object.keys(getObjectFields(object))
    .filter(fieldId => !["definition", "presentation", "capabilities"].includes(fieldId))
    .map((fieldId, index) => normalizeFieldDefinition({ fieldId, label: fieldId }, index))
    .filter(Boolean);
}

export function getFieldValue(object = {}, fieldId = "") {
  return getObjectFields(object)?.[clean(fieldId)];
}

export function getFieldsByRole(object = {}, role = "") {
  const target = clean(role).toLowerCase();
  return getFieldDefinitions(object).filter(definition => definition.presentationRole === target);
}

export function getFirstFieldByRole(object = {}, role = "") {
  return getFieldsByRole(object, role)[0] || null;
}

export function getFieldDisplayValue(object = {}, definition = null) {
  if (!definition) return "";
  const value = getFieldValue(object, definition.fieldId);

  if (Array.isArray(value)) {
    return value
      .map(item => typeof item === "string" ? clean(item) : clean(item?.label || item?.name || item?.value))
      .filter(Boolean)
      .join(" · ");
  }

  if (value && typeof value === "object") {
    return clean(value?.displayName || value?.label || value?.name || value?.value);
  }

  return clean(value);
}

export function getObjectRelationships(object = {}) {
  return asArray(object?.relationships)
    .map((relationship, index) => ({
      id: clean(relationship?.id || relationship?.relationshipId || `relationship-${index}`),
      label: clean(
        relationship?.displayLabel ||
        relationship?.label ||
        relationship?.relationshipLabel ||
        relationship?.name
      ) || "RELATIONSHIP",
      value: clean(
        relationship?.displayName ||
        relationship?.value ||
        relationship?.targetDisplayName ||
        relationship?.targetLabel
      ) || "—",
      secondary: clean(relationship?.secondary || relationship?.subtitle),
      raw: relationship
    }));
}

export function getObjectCapabilities(object = {}) {
  const fields = getObjectFields(object);
  const metadata = getObjectMetadata(object);
  const definition = getObjectDefinition(object);

  return {
    ...safeObject(definition?.capabilities),
    ...safeObject(metadata?.capabilities),
    ...safeObject(fields?.capabilities),
    ...safeObject(object?.capabilities)
  };
}

export function getObjectActionCapabilities(object = {}) {
  const capabilities = getObjectCapabilities(object);

  const canCreate = Boolean(
    capabilities?.canCreate ||
    capabilities?.canCreateChild ||
    capabilities?.canAdd ||
    capabilities?.canContain
  );

  const canEdit = capabilities?.editable !== false && capabilities?.canEdit !== false;

  const canTransact = Boolean(
    capabilities?.canTransact ||
    capabilities?.transact ||
    capabilities?.hasTransact
  );

  const canOpenConsole = capabilities?.hasConsole !== false && capabilities?.canOpenConsole !== false;

  return {
    canCreate,
    canEdit,
    canTransact,
    canOpenConsole
  };
}

export function getPrimaryImage(object = {}) {
  const fields = getObjectFields(object);
  const metadata = getObjectMetadata(object);
  const media = asArray(object?.media);

  for (const item of media) {
    const url = typeof item === "string"
      ? clean(item)
      : clean(item?.url || item?.src || item?.imageUrl);
    if (url) return url;
  }

  return clean(
    object?.primaryImageUrl ||
    fields?.primaryImageUrl ||
    metadata?.primaryImageUrl ||
    getObjectPresentation(object)?.primaryImageUrl
  );
}

function normalizedAggregateValues(value, mode) {
  if (mode === "count-each-value" || mode === "counteachvalue" || mode === "count_each_value") {
    return asArray(value).map(item => {
      if (typeof item === "string") return clean(item);
      return clean(item?.label || item?.name || item?.value);
    }).filter(Boolean);
  }

  if (mode === "count-by-value" || mode === "countbyvalue" || mode === "count_by_value") {
    const resolved = value && typeof value === "object" && !Array.isArray(value)
      ? clean(value?.label || value?.name || value?.value)
      : clean(value);
    return resolved ? [resolved] : [];
  }

  return [];
}

export function buildChildAggregateGroups(children = []) {
  const resolvedChildren = asArray(children).filter(Boolean);
  const groupMap = new Map();

  resolvedChildren.forEach(child => {
    getFieldDefinitions(child).forEach(definition => {
      const aggregate = safeObject(definition?.aggregate);
      const mode = clean(aggregate?.mode).toLowerCase();
      if (!mode || aggregate?.visible === false) return;

      const values = normalizedAggregateValues(
        getFieldValue(child, definition.fieldId),
        mode
      );
      if (!values.length) return;

      const groupId = clean(aggregate?.groupId || definition.fieldId) || definition.fieldId;
      if (!groupMap.has(groupId)) {
        groupMap.set(groupId, {
          groupId,
          label: clean(aggregate?.label || definition.label) || "SUMMARY",
          order: Number(aggregate?.order ?? definition.presentationOrder ?? 0),
          hero: aggregate?.hero === true,
          fieldId: definition.fieldId,
          counts: new Map()
        });
      }

      const group = groupMap.get(groupId);
      values.forEach(value => {
        const exactLabel = clean(value);
        if (!exactLabel) return;
        const key = exactLabel.toLocaleLowerCase();
        const current = group.counts.get(key) || { label: exactLabel, value: 0 };
        current.value += 1;
        group.counts.set(key, current);
      });
    });
  });

  return Array.from(groupMap.values())
    .sort((a, b) => a.order - b.order)
    .map(group => ({
      groupId: group.groupId,
      label: group.label,
      hero: group.hero,
      fieldId: group.fieldId,
      entries: Array.from(group.counts.values()).sort((a, b) => b.value - a.value || a.label.localeCompare(b.label))
    }));
}
