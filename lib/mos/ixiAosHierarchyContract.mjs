function clean(value) {
  return String(value ?? "").trim();
}


export function getAosHierarchyObjectId(object = {}) {
  return clean(
    object?.objectId ||
    object?.id?.uuid ||
    object?.id
  );
}


export function getAosHierarchyDisplayName(object = {}) {
  return clean(
    object?.displayName ||
    object?.name ||
    object?.label ||
    object?.title
  );
}


export function getAosDirectParentId(object = {}) {
  return clean(
    object?.directContainerId ||
    object?.parentObjectId ||
    object?.parent?.objectId ||
    object?.parent?.id?.uuid ||
    object?.parent?.id ||
    object?.metadata?.parentObjectId ||
    object?.metadata?.createdInsideContainerId ||
    object?.metadata?.destinationContainerId
  );
}


/*
 * IXI AOS RECURSIVE IDENTITY LAW
 *
 * Parent labels are presentation data only. The platform does not supply a
 * business noun for root objects or infer one from object type.
 *
 * The live parent object always wins over any stored display snapshot. A
 * rename or move therefore changes the child's displayed parent without
 * rewriting every descendant. The snapshot exists only as a temporary
 * recovery value while the referenced parent is unavailable.
 */
export function resolveAosWorkspaceParentName({
  object = {},
  parentObject = null,
  explicitParentLabel = ""
} = {}) {
  const parentId =
    getAosDirectParentId(object);

  const liveParentName =
    parentId ? getAosHierarchyDisplayName(
      parentObject || {}
    ) : "";

  if (liveParentName) {
    return liveParentName;
  }

  const embeddedParentName =
    getAosHierarchyDisplayName(
      object?.parent || {}
    );

  return (
    clean(explicitParentLabel) ||
    embeddedParentName ||
    clean(
      object?.parentDisplayName ||
      object?.metadata?.parentDisplayName
    )
  );
}
