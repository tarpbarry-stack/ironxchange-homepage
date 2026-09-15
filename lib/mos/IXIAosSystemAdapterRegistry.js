/*
 * IXI AOS — SYSTEM ADAPTER REGISTRY
 *
 * This registry is the ONLY place where IXI-owned AOS universes
 * receive fixed technical identity.
 *
 * It is deliberately NOT a customer taxonomy.
 * Customer-created Objects and Containers never enter this registry.
 * Their names, definitions and capabilities remain AWS/customer owned.
 *
 * An adapter belongs here only when IronXchange itself owns the
 * canonical source universe and the integration contract.
 */

export const IXI_AOS_SYSTEM_ADAPTERS =
  Object.freeze({
    EQUIPMENT: Object.freeze({
      adapterId:
        "ixi-owned-equipment",

      indexId:
        "equipment",

      objectId:
        "system-index:equipment",

      displayName:
        "EQUIPMENT",

      objectFamily:
        "equipment",

      source:
        "owned-ironxchange-listings",

      canonicalMembership:
        "owned-ironxchange-listings",

      workspaceSurfaceId:
        "indexEquipment",

      acceptedObjectTypes:
        Object.freeze([
          "machine"
        ]),

      acceptedDefinitionIds:
        Object.freeze([]),

      defaultWorkspaceHome:
        true,

      canOperationalDrop:
        true,

      canCreateChild:
        false,

      supportsCollectionWorkspaceCommands:
        true
    })
  });


const ADAPTER_LIST =
  Object.freeze(
    Object.values(
      IXI_AOS_SYSTEM_ADAPTERS
    )
  );


function clean(value) {
  return String(value ?? "").trim();
}


export function listIXIAosSystemAdapters() {
  return [
    ...ADAPTER_LIST
  ];
}


export function getIXIAosSystemAdapter(
  value
) {
  if (!value) {
    return null;
  }

  if (
    typeof value === "object"
  ) {
    const metadataAdapterId =
      clean(
        value?.metadata?.adapterId
      );

    const objectId =
      clean(
        value?.objectId
      );

    const indexId =
      clean(
        value?.indexId
      );

    return (
      ADAPTER_LIST.find(
        adapter =>
          (
            metadataAdapterId &&
            (
              adapter.adapterId === metadataAdapterId ||
              adapter.legacyAdapterIds?.includes(metadataAdapterId)
            )
          ) ||
          (
            objectId &&
            adapter.objectId ===
              objectId
          ) ||
          (
            value?.metadata?.systemAdapter ===
              true &&
            indexId &&
            adapter.indexId ===
              indexId
          )
      ) ||
      null
    );
  }

  const key =
    clean(value);

  if (!key) {
    return null;
  }

  return (
    ADAPTER_LIST.find(
      adapter =>
        adapter.adapterId === key ||
        adapter.legacyAdapterIds?.includes(key) ||
        adapter.indexId === key ||
        adapter.objectId === key
    ) ||
    null
  );
}


export function isIXIAosSystemAdapter(
  value
) {
  return Boolean(
    getIXIAosSystemAdapter(
      value
    )
  );
}


export function isIXIAosWorkspaceVisibleAdapter(value) {
  const adapter = getIXIAosSystemAdapter(value);
  const metadata = value?.metadata && typeof value.metadata === "object"
    ? value.metadata
    : {};
  const isUnregisteredTechnicalAdapter =
    metadata.systemAdapter === true ||
    (
      clean(metadata.adapterId) &&
      (
        metadata.systemIndex === true ||
        metadata.isSystemIndex === true ||
        clean(value?.objectType).toLowerCase() === "system-index"
      )
    );

  if (
    !adapter &&
    isUnregisteredTechnicalAdapter
  ) {
    return false;
  }

  return !adapter ||
    adapter.supportsCollectionWorkspaceCommands === true;
}


export function getIXIAosEquipmentAdapter() {
  return IXI_AOS_SYSTEM_ADAPTERS
    .EQUIPMENT;
}


export default IXI_AOS_SYSTEM_ADAPTERS;
