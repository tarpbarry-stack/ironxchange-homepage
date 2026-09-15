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

import { isExplicitAosSystemIndexObject } from "../../lib/mos/IXIAosSystemIndexMembershipPolicy.js";

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


function normalizeIds(values) {
  if (!Array.isArray(values)) return [];
  return values.map(clean).filter(Boolean);
}


function isSystemIndexObject(
  value = {}
) {
  return isExplicitAosSystemIndexObject(value);
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


  /*
   * System Indexes are peer roots in AOS Work. Allowing one Index to
   * contain another can hide the entire workspace behind a single card and
   * create cycles. Ordinary customer containers remain universally
   * composable; this guard applies only to explicit System Index identity.
   */
  if (isSystemIndexObject(dragData)) {
    return {
      accepted: false,
      reason: "system-index-nesting"
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

  const acceptedDefinitionIds =
    normalizeIds(
      policy.acceptedDefinitionIds
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
    acceptedObjectTypes.length === 0 &&
    acceptedDefinitionIds.length === 0
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

  const sourceDefinitionId = clean(
    dragData.definitionId || dragData?.metadata?.definitionId
  );


  const accepted =
    acceptedObjectTypes.includes(sourceType) ||
    acceptedDefinitionIds.includes(sourceDefinitionId);


  return {
    accepted,

    reason:
      accepted
        ? "classification-accepted"
        : "classification-rejected"
  };
}


export default {
  getIXIDragObjectType,
  getIXIDropPolicy,
  canIXIObjectAcceptDrop
};
