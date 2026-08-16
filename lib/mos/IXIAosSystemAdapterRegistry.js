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

      canOperationalDrop:
        true,

      canCreateChild:
        false,

      supportsCollectionWorkspaceCommands:
        true
    }),

    FOR_SALE: Object.freeze({
      adapterId:
        "ixi-owned-for-sale",

      indexId:
        "for-sale",

      objectId:
        "system-index:for-sale",

      displayName:
        "FOR SALE",

      objectFamily:
        "publication",

      source:
        "owned-ironxchange-listings",

      canonicalMembership:
        "public-owned-listings",

      workspaceSurfaceId:
        "index:for-sale",

      acceptedObjectTypes:
        Object.freeze([]),

      canOperationalDrop:
        false,

      canCreateChild:
        false,

      supportsCollectionWorkspaceCommands:
        false
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
            adapter.adapterId ===
              metadataAdapterId
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


export function getIXIAosEquipmentAdapter() {
  return IXI_AOS_SYSTEM_ADAPTERS
    .EQUIPMENT;
}


export default IXI_AOS_SYSTEM_ADAPTERS;
