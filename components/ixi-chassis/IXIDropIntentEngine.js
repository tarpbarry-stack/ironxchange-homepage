/*
 * IXI UNIVERSAL DROP INTENT ENGINE
 *
 * Drag physics and business meaning
 * are deliberately separate.
 *
 * This layer answers:
 *
 * ROOT
 * BEFORE
 * AFTER
 * ON
 *
 * It does NOT decide:
 *
 * ASSIGN
 * TRANSFER
 * RETURN
 * CHECKOUT
 * INSTALL
 * etc.
 */

export const IXI_DROP_INTENTS =
  Object.freeze({
    ROOT: "root",
    BEFORE: "before",
    AFTER: "after",
    ON: "on"
  });


export const IXI_DROP_TARGET_ROLES =
  Object.freeze({
    WORKSPACE:
      "workspace",

    SORTABLE_OBJECT:
      "sortable-object",

    CONTAINER:
      "container"
  });


const IXI_DROP_ON_PREFIX =
  "ixi-drop-on:";


function clean(value) {
  return String(
    value || ""
  ).trim();
}


export function createIXIDropOnTargetId(
  objectId
) {
  const id =
    clean(objectId);

  if (!id) {
    return "";
  }

  return (
    IXI_DROP_ON_PREFIX +
    id
  );
}


export function isIXIDropOnTargetId(
  value
) {
  return clean(value)
    .startsWith(
      IXI_DROP_ON_PREFIX
    );
}


export function getIXIDropOnObjectId(
  value
) {
  const id =
    clean(value);

  if (
    !isIXIDropOnTargetId(id)
  ) {
    return "";
  }

  return id.slice(
    IXI_DROP_ON_PREFIX.length
  );
}


export function createIXIDropIntent({
  intent,
  sourceObjectId = "",
  targetObjectId = "",
  targetRole = "",
  targetSurface = "",
  metadata = {}
} = {}) {
  return {
    intent:
      intent ||
      IXI_DROP_INTENTS.ROOT,

    sourceObjectId:
      clean(sourceObjectId),

    targetObjectId:
      clean(targetObjectId),

    targetRole:
      clean(targetRole),

    targetSurface:
      clean(targetSurface),

    metadata:
      metadata &&
      typeof metadata === "object"
        ? metadata
        : {}
  };
}


export function resolveIXIDropIntent({
  active,
  over
} = {}) {
  const sourceObjectId =
    clean(
      active?.data?.current
        ?.objectId ||
      active?.id
    );

  const overId =
    clean(
      over?.id
    );

  const overData =
    over?.data?.current ||
    {};

  /*
   * Explicit ON target wins.
   */
  if (
    isIXIDropOnTargetId(
      overId
    ) ||
    overData.dropIntent ===
      IXI_DROP_INTENTS.ON
  ) {
    return createIXIDropIntent({
      intent:
        IXI_DROP_INTENTS.ON,

      sourceObjectId,

      targetObjectId:
        overData.targetObjectId ||
        getIXIDropOnObjectId(
          overId
        ),

      targetRole:
        overData.targetRole ||
        IXI_DROP_TARGET_ROLES
          .CONTAINER,

      targetSurface:
        overData.targetSurface ||
        "",

      metadata:
        overData
    });
  }

  /*
   * Workspace root target.
   */
  if (
    overData.targetRole ===
      IXI_DROP_TARGET_ROLES
        .WORKSPACE
  ) {
    return createIXIDropIntent({
      intent:
        IXI_DROP_INTENTS.ROOT,

      sourceObjectId,

      targetSurface:
        overData.targetSurface ||
        overId,

      targetRole:
        IXI_DROP_TARGET_ROLES
          .WORKSPACE,

      metadata:
        overData
    });
  }

  /*
   * Ordinary sortable object.
   *
   * BEFORE/AFTER is resolved by the
   * Board ordering engine using indexes.
   */
  return createIXIDropIntent({
    intent:
      overId
        ? IXI_DROP_INTENTS.BEFORE
        : IXI_DROP_INTENTS.ROOT,

    sourceObjectId,

    targetObjectId:
      overId,

    targetRole:
      IXI_DROP_TARGET_ROLES
        .SORTABLE_OBJECT,

    metadata:
      overData
  });
}


export default {
  IXI_DROP_INTENTS,
  IXI_DROP_TARGET_ROLES,

  createIXIDropOnTargetId,
  isIXIDropOnTargetId,
  getIXIDropOnObjectId,

  createIXIDropIntent,
  resolveIXIDropIntent
};
