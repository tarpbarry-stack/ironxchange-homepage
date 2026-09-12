import { getIXIAosEquipmentAdapter } from "../../lib/mos/IXIAosSystemAdapterRegistry.js";

const clean = value => String(value ?? "").trim();

const safeArray = value => Array.isArray(value) ? value : [];

const IXI_OWNED_EQUIPMENT_ADAPTER_ID = getIXIAosEquipmentAdapter().adapterId;

function compactKey(value) {
  return clean(value).toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

function firstText(...values) {
  return values.map(clean).find(Boolean) || "";
}

function getPublicData(record = {}) {
  return record?.publicData || record?.attributes?.publicData || {};
}

function getObjectId(record = {}) {
  return firstText(record?.objectId, record?.id?.uuid, record?.id);
}

function relationshipRecord(value = {}) {
  return value?.relationship || value?.edge || value;
}

function isActiveRelationship(value = {}) {
  const relationship = relationshipRecord(value);
  return clean(relationship?.status || "active").toLowerCase() === "active";
}

function getRelationshipIdentity(value = {}) {
  const relationship = relationshipRecord(value);
  const relationshipId = firstText(relationship?.relationshipId, relationship?.id);
  if (relationshipId) return relationshipId;

  return [
    clean(relationship?.sourceObjectId),
    clean(relationship?.targetObjectId),
    clean(relationship?.behaviorId),
    clean(relationship?.definitionId)
  ].join(":");
}

function normalizeRelationships(relationships = []) {
  const unique = new Map();

  safeArray(relationships)
    .map(relationshipRecord)
    .filter(isActiveRelationship)
    .forEach(relationship => {
      const sourceObjectId = clean(relationship?.sourceObjectId);
      const targetObjectId = clean(relationship?.targetObjectId);
      if (!sourceObjectId || !targetObjectId) return;

      const identity = getRelationshipIdentity(relationship);
      if (!unique.has(identity)) unique.set(identity, relationship);
    });

  return [...unique.values()];
}

function getOwnedEquipmentIndex(systemIndexes = []) {
  return safeArray(systemIndexes).find(index =>
    clean(index?.metadata?.adapterId) === IXI_OWNED_EQUIPMENT_ADAPTER_ID
  ) || null;
}

function getProjectedItemObjectId(item = {}) {
  return firstText(
    item?.objectId,
    item?.sourceObjectId,
    item?.identity?.objectId,
    typeof item === "string" ? item : ""
  );
}

export function getIXITransactOwnedEquipmentObjectIds(systemIndexes = []) {
  const equipmentIndex = getOwnedEquipmentIndex(systemIndexes);
  if (!equipmentIndex) return [];

  return [...new Set(
    safeArray(equipmentIndex?.items)
      .map(getProjectedItemObjectId)
      .filter(Boolean)
  )];
}

function getPassportId(record = {}) {
  const publicData = getPublicData(record);

  return firstText(
    record?.passportId,
    record?.ixiPassportId,
    record?.passport?.passportId,
    record?.metadata?.passportId,
    publicData?.passportId,
    publicData?.ixiPassportId,
    publicData?.ixiMedia?.passportId
  );
}

function getObjectName(record = {}, fallback = "AOS OBJECT") {
  const publicData = getPublicData(record);

  return firstText(
    record?.displayName,
    record?.label,
    record?.name,
    record?.title,
    record?.attributes?.title,
    publicData?.displayName,
    fallback
  );
}

function getObjectStatus(record = {}) {
  const publicData = getPublicData(record);

  return firstText(
    record?.status,
    record?.listingStatus,
    record?.attributes?.state,
    publicData?.status,
    publicData?.listingStatus,
    "active"
  ).toUpperCase();
}

function getMachineLocation(record = {}) {
  const publicData = getPublicData(record);

  return firstText(
    record?.location,
    publicData?.location,
    publicData?.machineLocation,
    publicData?.cityState
  );
}

function getMachineHours(record = {}) {
  const publicData = getPublicData(record);
  const value = record?.hours ?? publicData?.hours ?? publicData?.machineHours;
  const number = Number(String(value ?? "").replace(/[^0-9.-]/g, ""));

  return Number.isFinite(number) ? number : null;
}

function getMoneyValue(record = {}) {
  const publicData = getPublicData(record);
  const raw = record?.price ?? record?.attributes?.price ?? record?.value ??
    record?.estimatedValue ?? record?.marketValue ?? publicData?.price ?? 0;

  if (raw && typeof raw === "object" && Number.isFinite(Number(raw.amount))) {
    return Number(raw.amount) / 100;
  }

  const number = Number(String(raw ?? "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(number) ? number : 0;
}

function getImageUrl(record = {}) {
  const publicData = getPublicData(record);
  const candidates = [
    record?.logoUrl,
    record?.imageUrl,
    typeof record?.image === "string" ? record.image : "",
    record?.image?.url,
    record?.image?.attributes?.variants?.default?.url,
    safeArray(record?.imageUrls)[0],
    publicData?.imageUrl,
    safeArray(publicData?.imageUrls)[0],
    record?.media?.[0]?.url,
    record?.media?.[0]?.imageUrl,
    record?.media?.[0]?.attributes?.variants?.default?.url,
    record?.images?.[0]?.url,
    record?.images?.[0]?.attributes?.variants?.default?.url
  ];

  return candidates.map(clean).find(Boolean) || "";
}

function getDateValue(record = {}) {
  const raw = record?.updatedAt || record?.createdAt || record?.attributes?.updatedAt ||
    record?.attributes?.createdAt || record?.metadata?.updatedAt || "";
  const date = new Date(raw);
  return Number.isFinite(date.getTime()) ? date : null;
}

function getObjectKind(record = {}) {
  const metadata = record?.metadata || {};
  const objectType = compactKey(record?.objectType);

  if (
    objectType === "system-index" ||
    metadata?.systemIndex === true ||
    metadata?.isSystemIndex === true ||
    metadata?.systemIndexPresentation === true
  ) {
    return "object";
  }

  const identity = compactKey([
    record?.objectFamily,
    record?.objectType,
    record?.definitionKey,
    record?.definition?.definitionKey,
    record?.singularLabel,
    record?.cardTemplateSlug,
    record?.templateId,
    record?.presentation?.kind,
    record?.presentation?.sourceAdapterId,
    record?.presentation?.renderer,
    record?.presentation?.templateSlug,
    record?.presentation?.templateId,
    record?.selectedPresentation?.kind,
    record?.selectedPresentation?.sourceAdapterId,
    record?.selectedPresentation?.templateSlug,
    record?.selectedPresentation?.templateId,
    record?.selectedCardTemplate?.templateSlug,
    record?.selectedCardTemplate?.templateId,
    record?.definition?.cardTemplateSlug,
    record?.definition?.templateSlug,
    record?.metadata?.cardTemplateSlug,
    record?.metadata?.templateSlug,
    record?.metadata?.cardDefinition?.templateSlug
  ].filter(Boolean).join(" "));

  if (/work-order|workorder|service-order|repair-order/.test(identity)) return "work";
  if (/person|employee|technician|operator|driver/.test(identity)) return "person";
  if (/location|yard|facility|branch|site/.test(identity)) return "location";
  if (/machine|equipment|vehicle|asset|excavator|loader|dozer|truck|pump/.test(identity)) return "machine";
  return "object";
}

function buildEntityContext(entity = {}) {
  const id = firstText(entity?.entityId, entity?.id, "ixi-entity");

  return {
    id: `company:${id}`,
    sourceId: id,
    kind: "company",
    title: getObjectName(entity, "IXI ENTITY"),
    subtitle: firstText(entity?.officeLocation, "Enterprise operating context"),
    status: getObjectStatus(entity),
    passportId: getPassportId(entity),
    parentId: "",
    location: firstText(entity?.officeLocation),
    hours: null,
    value: 0,
    imageUrl: getImageUrl(entity),
    source: entity,
    updatedAt: getDateValue(entity)
  };
}

function buildMosContext(object = {}) {
  const id = getObjectId(object);
  if (!id) return null;

  const kind = getObjectKind(object);
  const definitionLabel = firstText(
    object?.singularLabel,
    object?.definition?.singularLabel,
    object?.objectFamily,
    object?.objectType,
    "AOS object"
  );

  return {
    id: `mos:${id}`,
    sourceId: id,
    kind,
    title: getObjectName(object),
    subtitle: firstText(object?.secondary, object?.description, definitionLabel),
    status: getObjectStatus(object),
    passportId: getPassportId(object),
    parentId: firstText(object?.directContainerId, object?.parentObjectId),
    location: firstText(object?.location, object?.fields?.location),
    hours: null,
    value: getMoneyValue(object),
    imageUrl: getImageUrl(object),
    source: object,
    updatedAt: getDateValue(object)
  };
}

function buildMachineContext(listing = {}) {
  const id = firstText(listing?.objectId, listing?.canonicalObjectId);
  if (!id) return null;

  const location = getMachineLocation(listing);
  const hours = getMachineHours(listing);

  return {
    id: `machine:${id}`,
    sourceId: id,
    kind: "machine",
    title: getObjectName(listing, "MACHINE"),
    subtitle: [hours !== null ? `${hours.toLocaleString("en-US")} Hrs` : "", location]
      .filter(Boolean)
      .join(" · ") || "Owned machine",
    status: getObjectStatus(listing),
    passportId: getPassportId(listing),
    parentId: "",
    location,
    hours,
    value: getMoneyValue(listing),
    imageUrl: getImageUrl(listing),
    source: listing,
    updatedAt: getDateValue(listing)
  };
}

function getProjectedKindOverrides(systemIndexes = []) {
  const overrides = new Map();

  safeArray(systemIndexes).forEach(index => {
    if (clean(index?.metadata?.adapterId) === IXI_OWNED_EQUIPMENT_ADAPTER_ID) {
      return;
    }

    const projectedItems = safeArray(index?.items);
    const kindCounts = new Map();

    projectedItems.forEach(item => {
      const kind = getObjectKind(item);
      if (kind === "object") return;
      kindCounts.set(kind, (kindCounts.get(kind) || 0) + 1);
    });

    const rankedKinds = [...kindCounts.entries()]
      .sort((left, right) => right[1] - left[1]);
    const [dominantKind, dominantCount] = rankedKinds[0] || [];
    const runnerUpCount = rankedKinds[1]?.[1] || 0;

    /*
     * A persisted System Index is governed projection evidence. When legacy
     * members have only the neutral Object presentation, inherit the unique
     * dominant canonical member kind from that projection. Never overwrite an
     * explicit kind: a machine related to Locations remains a machine.
     */
    if (!dominantKind || dominantCount < 2 || dominantCount <= runnerUpCount) {
      return;
    }

    projectedItems.forEach(item => {
      if (getObjectKind(item) !== "object") return;
      const objectId = getObjectId(item);
      if (objectId) overrides.set(objectId, dominantKind);
    });
  });

  return overrides;
}

export function buildIXIAosCommandContexts({
  entity = {},
  aosObjects = [],
  ownedListings = [],
  systemIndexes = []
} = {}) {
  const company = buildEntityContext(entity);
  const byObjectId = new Map();
  /*
   * The Entity environment is an authority envelope, not an ownership list.
   * Machine admission therefore fails closed against the IX-Core-derived
   * Equipment projection. Sharetribe records may enrich an admitted machine,
   * but they can neither create nor admit a TRAN$ACT context.
   */
  const ownedEquipmentIds = new Set(
    getIXITransactOwnedEquipmentObjectIds(systemIndexes)
  );
  const projectedKindOverrides = getProjectedKindOverrides(systemIndexes);

  safeArray(aosObjects)
    .map(buildMosContext)
    .filter(Boolean)
    .map(context => context.kind === "object" && projectedKindOverrides.has(context.sourceId)
      ? { ...context, kind: projectedKindOverrides.get(context.sourceId) }
      : context)
    .filter(context =>
      context.kind !== "machine" || ownedEquipmentIds.has(context.sourceId)
    )
    .forEach(context => byObjectId.set(context.sourceId, context));

  safeArray(ownedListings)
    .map(buildMachineContext)
    .filter(Boolean)
    .filter(machine => ownedEquipmentIds.has(machine.sourceId))
    .forEach(machine => {
      const canonical = byObjectId.get(machine.sourceId);
      if (!canonical) return;

      byObjectId.set(machine.sourceId, {
        ...canonical,
        ...machine,
        parentId: canonical.parentId || machine.parentId,
        passportId: canonical.passportId || machine.passportId,
        imageUrl: machine.imageUrl || canonical.imageUrl,
        source: { canonical: canonical.source, presentation: machine.source }
      });
    });

  return [company, ...byObjectId.values()];
}

export function getIXIAosRelationshipEvidence(
  context,
  contexts = [],
  relationships = []
) {
  if (!context) return [];
  const all = safeArray(contexts);
  const admittedObjectIds = new Set(
    all.map(item => clean(item?.sourceId)).filter(Boolean)
  );
  const activeRelationships = normalizeRelationships(relationships)
    /* Never turn broad environment visibility into a relationship. */
    .filter(relationship =>
      admittedObjectIds.has(clean(relationship?.sourceObjectId)) &&
      admittedObjectIds.has(clean(relationship?.targetObjectId))
    );

  if (context.kind === "company") {
    return activeRelationships;
  }

  const sourceId = clean(context.sourceId);
  return activeRelationships.filter(relationship =>
    clean(relationship?.sourceObjectId) === sourceId ||
    clean(relationship?.targetObjectId) === sourceId
  );
}

export function getIXIAosRelatedContexts(
  context,
  contexts = [],
  relationships = []
) {
  if (!context) return [];
  const all = safeArray(contexts);
  const contextsByObjectId = new Map(
    all.map(item => [clean(item?.sourceId), item]).filter(([objectId]) => objectId)
  );
  const evidence = getIXIAosRelationshipEvidence(context, all, relationships);
  const relatedIds = new Set();

  evidence.forEach(relationship => {
    const sourceObjectId = clean(relationship?.sourceObjectId);
    const targetObjectId = clean(relationship?.targetObjectId);

    if (context.kind === "company") {
      relatedIds.add(sourceObjectId);
      relatedIds.add(targetObjectId);
      return;
    }

    if (sourceObjectId === context.sourceId) relatedIds.add(targetObjectId);
    if (targetObjectId === context.sourceId) relatedIds.add(sourceObjectId);
  });

  relatedIds.delete(clean(context.sourceId));
  return [...relatedIds]
    .map(objectId => contextsByObjectId.get(objectId))
    .filter(Boolean);
}

export function getIXIAosContextGroups(contexts = []) {
  const groups = {
    company: [],
    location: [],
    machine: [],
    person: [],
    work: [],
    object: []
  };

  safeArray(contexts).forEach(context => {
    const kind = groups[context.kind] ? context.kind : "object";
    groups[kind].push(context);
  });

  Object.values(groups).forEach(items => {
    items.sort((a, b) => a.title.localeCompare(b.title));
  });

  return groups;
}

export function getIXIFinancialQueryScope(context, entityPassportId = "") {
  const entityId = clean(entityPassportId);
  const passportId = clean(context?.passportId);
  const scope = {
    entityPassportIds: entityId ? [entityId] : [],
    locationPassportIds: [],
    assetPassportIds: [],
    customerPassportIds: [],
    vendorPassportIds: []
  };

  if (!context || context.kind === "company") return scope;
  if (!passportId) return null;

  if (context.kind === "location") {
    scope.locationPassportIds = [passportId];
    return scope;
  }

  if (context.kind === "machine") {
    scope.assetPassportIds = [passportId];
    return scope;
  }

  return null;
}

export function buildIXIAosRecentStory(
  context,
  contexts = [],
  relationships = [],
  limit = 6
) {
  const candidates = getIXIAosRelatedContexts(
    context,
    contexts,
    relationships
  );

  return candidates
    .filter(item => item.updatedAt)
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .slice(0, limit)
    .map(item => ({
      id: item.id,
      kind: item.kind,
      title: item.title,
      detail: `${item.kind.toUpperCase()} · ${item.status}`,
      updatedAt: item.updatedAt
    }));
}

export function formatIXIMoney(value, currency = "USD") {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) {
    return "—";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: clean(currency || "USD").toUpperCase(),
    maximumFractionDigits: 0
  }).format(Number(value));
}

const ATTENTION_BANDS = Object.freeze([
  "BLOCKED",
  "MONEY EXPOSED",
  "WAITING",
  "RECONCILE",
  "CLOSE",
  "REVIEW"
]);

function attentionText(item = {}) {
  return [
    item?.severity,
    item?.status,
    item?.state,
    item?.type,
    item?.title,
    item?.detail,
    item?.description,
    item?.message
  ].map(clean).join(" ").toUpperCase();
}

export function getIXITransactAttentionBand(item = {}) {
  const text = attentionText(item);

  if (/BLOCK|FAIL|DENY|CONFLICT|MISSING AUTH|IDENTITY|REVISION/.test(text)) {
    return "BLOCKED";
  }
  if (/OVERDUE|PAST DUE|EXPOS|DUPLICATE|UNAPPROVED|UNSETTLED|CASH RISK/.test(text)) {
    return "MONEY EXPOSED";
  }
  if (/RECONCIL|UNMATCH|BANK FEED|STATEMENT|VARIANCE/.test(text)) {
    return "RECONCILE";
  }
  if (/CLOSE|UNPOSTED|JOURNAL|PERIOD|TASK/.test(text)) {
    return "CLOSE";
  }
  if (/WAIT|PENDING|APPROVAL|RECEIPT|DOCUMENT|RESPONSE|DELIVERY/.test(text)) {
    return "WAITING";
  }
  return "REVIEW";
}

export function groupIXITransactAttention(items = []) {
  const groups = Object.fromEntries(ATTENTION_BANDS.map(band => [band, []]));

  safeArray(items).forEach((item, index) => {
    const band = getIXITransactAttentionBand(item);
    groups[band].push({
      ...item,
      attentionBand: band,
      attentionKey: firstText(item?.alertId, item?.id, `attention-${index}`)
    });
  });

  return groups;
}

export function getIXITransactControlCounts(items = []) {
  const groups = groupIXITransactAttention(items);

  return ATTENTION_BANDS.reduce((counts, band) => {
    counts[band] = groups[band].length;
    return counts;
  }, {});
}

export { ATTENTION_BANDS as IXI_TRANSACT_ATTENTION_BANDS };
