import { isExplicitAosSystemIndexObject } from "./IXIAosSystemIndexMembershipPolicy.js";
import { getCanonicalAosPassportId } from "./ixiAosPassportPresentation.mjs";

export function canClassifyExistingAosObject(object = {}) {
  return Boolean(object.objectId && object.entityId && getCanonicalAosPassportId(object) &&
    object.metadata?.draftOnly !== true && object.objectType === "generic" &&
    !object.definitionId && !isExplicitAosSystemIndexObject(object));
}

// Technical classifications; customer labels remain customer-owned.
export const AOS_MEMBER_TYPES = Object.freeze([
  ["location", "LOCATION"],
  ["person", "PERSON"],
  ["machine", "MACHINE"],
  ["equipment", "EQUIPMENT"],
  ["vehicle", "VEHICLE"],
  ["trailer", "TRAILER"],
  ["tool", "TOOL"],
  ["real-estate", "REAL ESTATE"],
  ["job", "JOB"],
  ["building", "BUILDING"],
  ["room", "ROOM"],
  ["container", "CONTAINER"],
  ["work-order", "WORK ORDER"],
  ["job-ticket", "JOB TICKET"],
  ["expense", "EXPENSE"],
  ["movement", "MOVEMENT"],
  ["freight", "FREIGHT"]
]);
