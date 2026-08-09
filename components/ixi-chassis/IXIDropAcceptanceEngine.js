/*
 * IXI UNIVERSAL DROP ACCEPTANCE ENGINE
 *
 * This answers one question:
 *
 * MAY source be dropped ON target?
 *
 * It does not execute the resulting
 * business operation.
 */

function clean(value) {
  return String(
    value || ""
  ).trim();
}


function normalizeTypes(
  values
) {
  if (!Array.isArray(values)) {
    return [];
  }

  return values
    .map(clean)
    .filter(Boolean);
}


export function getIXIDragObjectType(
  dragData = {}
) {
  return clean(
    dragData.objectType ||
    dragData.sourceObjectType ||
    dragData.type
  );
}


export function getIXIDropPolicy(
  target = {}
) {
  return (
    target.workspaceDropPolicy ||
    target.dropPolicy ||
    target.capabilities
      ?.workspaceDropPolicy ||
    {}
  );
}


export function canIXIObjectAcceptDrop({
  dragData = {},
  target = {},
  targetObjectId = ""
} = {}) {
  const sourceObjectId =
    clean(
      dragData.objectId
    );

  const resolvedTargetObjectId =
    clean(
      targetObjectId ||
      target.objectId
    );

  /*
   * Never allow self-drop.
   */
  if (
    sourceObjectId &&
    resolvedTargetObjectId &&
    sourceObjectId ===
      resolvedTargetObjectId
  ) {
    return {
      accepted: false,
      reason: "self-drop"
    };
  }


  const policy =
    getIXIDropPolicy(
      target
    );


  /*
   * Explicitly disabled.
   */
  if (
    policy.enabled === false
  ) {
    return {
      accepted: false,
      reason:
        "target-disabled"
    };
  }


  /*
   * Custom acceptance predicate.
   *
   * This is the strongest contract.
   */
  if (
    typeof policy.accepts ===
    "function"
  ) {
    const accepted =
      Boolean(
        policy.accepts({
          dragData,
          target
        })
      );

    return {
      accepted,
      reason:
        accepted
          ? "policy-predicate"
          : "policy-rejected"
    };
  }


  const acceptedObjectTypes =
    normalizeTypes(
      policy.acceptedObjectTypes
    );


  /*
   * No type restriction means:
   * accept any IXI object.
   *
   * This is deliberate. Customer-defined
   * containers should not require engine
   * rewrites merely because a new object
   * family exists.
   */
  if (
    acceptedObjectTypes.length === 0
  ) {
    return {
      accepted:
        policy.enabled === true,

      reason:
        policy.enabled === true
          ? "open-policy"
          : "no-drop-policy"
    };
  }


  const sourceType =
    getIXIDragObjectType(
      dragData
    );


  const accepted =
    acceptedObjectTypes.includes(
      sourceType
    );


  return {
    accepted,

    reason:
      accepted
        ? "type-accepted"
        : "type-rejected"
  };
}


export default {
  getIXIDragObjectType,
  getIXIDropPolicy,
  canIXIObjectAcceptDrop
};
