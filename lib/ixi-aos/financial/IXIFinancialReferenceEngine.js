/*
 * IXI FINANCIAL REFERENCE ENGINE
 *
 * PURPOSE
 * -------
 *
 * Connect financial records to the AOS
 * Passport ecosystem without duplicating
 * financial records.
 *
 *
 * CORE RULE
 * ---------
 *
 * One financial fact may touch many
 * Passport-bearing Objects / Containers.
 *
 * Example:
 *
 * $680 fuel expense
 *
 * touches:
 *
 * - Entity Passport
 * - Location Passport
 * - Job Passport
 * - Machine Passport
 * - Employee Passport
 *
 * BUT:
 *
 * the $680 expense exists ONCE.
 *
 * These references allow AOS to retrieve
 * that one record from any legitimate
 * operating scope.
 *
 *
 * IMPORTANT
 * ---------
 *
 * This engine does NOT:
 *
 * - invent the user's hierarchy
 * - rename their Objects
 * - create Passports
 * - calculate rollups
 * - infer accounting mappings
 * - persist to AWS
 *
 * It only preserves stable references
 * between financial records and existing
 * Passport-bearing AOS things.
 */


import {
  getAosPassportId
} from "../../mos/ixiAosProvisioningContract";

import {
  IXI_FINANCIAL_REFERENCE_ROLES,
  normalizeIXIFinancialReferenceRole
} from "./IXIFinancialTypes";


/* =========================================================
   BASIC HELPERS
   ========================================================= */

function clean(
  value
) {
  return String(
    value ??
    ""
  ).trim();
}


function safeObject(
  value
) {
  return (
    value &&
    typeof value === "object" &&
    !Array.isArray(value)
  )
    ? value
    : {};
}


function safeArray(
  value
) {
  return Array.isArray(
    value
  )
    ? value
    : [];
}


/* =========================================================
   REFERENCE IDENTITY
   ========================================================= */

/*
 * Reference identity is deterministic
 * within a financial record.
 *
 * We do NOT need a globally independent
 * random ID merely to say:
 *
 * this record touches this Passport
 * in this role.
 */
export function createIXIFinancialReferenceKey({
  passportId = "",
  role = ""
} = {}) {

  const resolvedPassportId =
    clean(
      passportId
    );


  const resolvedRole =
    normalizeIXIFinancialReferenceRole(
      role
    );


  if (
    !resolvedPassportId
  ) {
    return "";
  }


  return [
    resolvedRole,
    resolvedPassportId
  ].join(":");
}


/* =========================================================
   CREATE REFERENCE
   ========================================================= */

export function createIXIFinancialReference({
  passportId = "",

  role =
    IXI_FINANCIAL_REFERENCE_ROLES
      .OTHER,

  label = "",

  objectType = "",

  objectClass = "",

  relationshipId = "",

  relationshipType = "",

  path = [],

  snapshot = {},

  metadata = {}
} = {}) {

  const resolvedPassportId =
    clean(
      passportId
    );


  const resolvedRole =
    normalizeIXIFinancialReferenceRole(
      role
    );


  const referenceKey =
    createIXIFinancialReferenceKey({
      passportId:
        resolvedPassportId,

      role:
        resolvedRole
    });


  return {
    referenceKey,

    passportId:
      resolvedPassportId,

    role:
      resolvedRole,

    label:
      clean(
        label
      ),

    objectType:
      clean(
        objectType
      ),

    objectClass:
      clean(
        objectClass
      ),

    relationshipId:
      clean(
        relationshipId
      ),

    relationshipType:
      clean(
        relationshipType
      ),

    /*
     * Optional historical path snapshot.
     *
     * Example:
     *
     * [
     *   "STAR & SONS",
     *   "EQUIPMENT",
     *   "DOZERS",
     *   "CAT D6"
     * ]
     *
     * This is descriptive history only.
     *
     * Financial identity depends on the
     * Passport IDs, NOT on these names.
     */
    path:
      safeArray(
        path
      )
        .map(
          value =>
            clean(
              value
            )
        )
        .filter(
          Boolean
        ),

    /*
     * Historical context may be frozen here.
     *
     * Example:
     *
     * {
     *   displayName: "CAT D6",
     *   serialNumber: "ABC123",
     *   customerAssetId: "EQ-1042"
     * }
     *
     * This prevents future renames from
     * destroying the historical description
     * of what the transaction touched.
     */
    snapshot: {
      ...safeObject(
        snapshot
      )
    },

    metadata: {
      ...safeObject(
        metadata
      )
    }
  };
}


/* =========================================================
   NORMALIZE REFERENCE
   ========================================================= */

export function normalizeIXIFinancialReference(
  reference = {}
) {

  const source =
    safeObject(
      reference
    );


  return createIXIFinancialReference({
    passportId:
      source.passportId,

    role:
      source.role,

    label:
      source.label,

    objectType:
      source.objectType,

    objectClass:
      source.objectClass,

    relationshipId:
      source.relationshipId,

    relationshipType:
      source.relationshipType,

    path:
      source.path,

    snapshot:
      source.snapshot,

    metadata:
      source.metadata
  });
}


/* =========================================================
   VALID REFERENCE?
   ========================================================= */

export function isIXIFinancialReference(
  reference
) {

  const normalized =
    normalizeIXIFinancialReference(
      reference
    );


  return Boolean(
    normalized.passportId &&
    normalized.referenceKey
  );
}


/* =========================================================
   DEDUPE REFERENCES
   ========================================================= */

/*
 * Same Passport + same role
 * appears once.
 *
 * Example:
 *
 * Machine Passport as ASSET
 *
 * can coexist with same Passport
 * under another legitimate role if
 * the caller deliberately creates it.
 */
export function dedupeIXIFinancialReferences(
  references = []
) {

  const map =
    new Map();


  safeArray(
    references
  )
    .map(
      normalizeIXIFinancialReference
    )
    .filter(
      isIXIFinancialReference
    )
    .forEach(
      reference => {

        map.set(
          reference.referenceKey,
          reference
        );
      }
    );


  return Array.from(
    map.values()
  );
}


/* =========================================================
   ADD REFERENCE
   ========================================================= */

export function addIXIFinancialReference(
  references = [],
  reference = {}
) {

  return dedupeIXIFinancialReferences([
    ...safeArray(
      references
    ),

    normalizeIXIFinancialReference(
      reference
    )
  ]);
}


/* =========================================================
   REMOVE REFERENCE
   ========================================================= */

export function removeIXIFinancialReference(
  references = [],
  {
    passportId = "",
    role = ""
  } = {}
) {

  const targetPassportId =
    clean(
      passportId
    );


  const targetRole =
    role
      ? normalizeIXIFinancialReferenceRole(
          role
        )
      : "";


  return dedupeIXIFinancialReferences(
    references
  ).filter(
    reference => {

      if (
        targetPassportId &&
        reference.passportId !==
          targetPassportId
      ) {
        return true;
      }


      if (
        targetRole &&
        reference.role !==
          targetRole
      ) {
        return true;
      }


      return false;
    }
  );
}


/* =========================================================
   GET REFERENCES FOR PASSPORT
   ========================================================= */

export function getIXIFinancialReferencesForPassport(
  references = [],
  passportId = ""
) {

  const target =
    clean(
      passportId
    );


  if (
    !target
  ) {
    return [];
  }


  return dedupeIXIFinancialReferences(
    references
  ).filter(
    reference =>
      reference.passportId ===
      target
  );
}


/* =========================================================
   GET REFERENCES BY ROLE
   ========================================================= */

export function getIXIFinancialReferencesByRole(
  references = [],
  role =
    IXI_FINANCIAL_REFERENCE_ROLES
      .OTHER
) {

  const resolvedRole =
    normalizeIXIFinancialReferenceRole(
      role
    );


  return dedupeIXIFinancialReferences(
    references
  ).filter(
    reference =>
      reference.role ===
      resolvedRole
  );
}


/* =========================================================
   HAS PASSPORT REFERENCE?
   ========================================================= */

export function hasIXIFinancialPassportReference(
  references = [],
  passportId = ""
) {

  return (
    getIXIFinancialReferencesForPassport(
      references,
      passportId
    ).length >
    0
  );
}


/* =========================================================
   PRIMARY REFERENCES
   ========================================================= */

/*
 * Financial records may touch many
 * Passports, but sometimes there is one
 * primary operating subject.
 *
 * Example:
 *
 * Work order:
 * primary = machine Passport
 *
 * Time entry:
 * primary = employee Passport OR the
 * object being worked on depending on
 * caller intent.
 *
 * We preserve the role chosen by the
 * record creator. This engine does not
 * guess.
 */
export function getPrimaryIXIFinancialReference(
  references = [],
  preferredRoles = [
    IXI_FINANCIAL_REFERENCE_ROLES
      .ASSET,

    IXI_FINANCIAL_REFERENCE_ROLES
      .OBJECT,

    IXI_FINANCIAL_REFERENCE_ROLES
      .JOB,

    IXI_FINANCIAL_REFERENCE_ROLES
      .PROJECT,

    IXI_FINANCIAL_REFERENCE_ROLES
      .CONTAINER,

    IXI_FINANCIAL_REFERENCE_ROLES
      .ENTITY
  ]
) {

  const normalized =
    dedupeIXIFinancialReferences(
      references
    );


  for (
    const role of
    safeArray(
      preferredRoles
    )
  ) {

    const resolvedRole =
      normalizeIXIFinancialReferenceRole(
        role
      );


    const match =
      normalized.find(
        reference =>
          reference.role ===
          resolvedRole
      );


    if (
      match
    ) {
      return match;
    }
  }


  return (
    normalized[0] ||
    null
  );
}


/* =========================================================
   SNAPSHOT HELPERS
   ========================================================= */

/*
 * Snapshot an existing AOS Passport-bearing
 * Object into a financial reference.
 *
 * Canonical AOS provisioning identity is the
 * first source. Explicit caller passportId
 * still wins when the caller intentionally
 * targets another Passport role.
 */
export function createIXIFinancialReferenceFromObject({
  object = {},

  passportId = "",

  role =
    IXI_FINANCIAL_REFERENCE_ROLES
      .OBJECT,

  relationshipId = "",

  relationshipType = "",

  path = [],

  metadata = {}
} = {}) {

  const source =
    safeObject(
      object
    );


  const resolvedPassportId =
    clean(
      passportId ||
      getAosPassportId(
        source
      )
    );


  const label =
    clean(
      source.displayName ||

      source.name ||

      source.title ||

      source.label
    );


  const objectType =
    clean(
      source.objectType ||

      source.type ||

      source.cardFamily
    );


  const objectClass =
    clean(
      source.objectClass ||

      source.class ||

      source.category
    );


  return createIXIFinancialReference({
    passportId:
      resolvedPassportId,

    role,

    label,

    objectType,

    objectClass,

    relationshipId,

    relationshipType,

    path,

    snapshot: {
      displayName:
        label,

      objectId:
        clean(
          source.objectId ||
          source.id
        ),

      serialNumber:
        clean(
          source.serialNumber ||

          source.serial ||

          source.fields
            ?.serialNumber ||

          source.fields
            ?.serial
        ),

      stockNumber:
        clean(
          source.stockNumber ||

          source.stock ||

          source.fields
            ?.stockNumber ||

          source.fields
            ?.stock
        ),

      customerObjectId:
        clean(
          source.customerObjectId ||

          source.assetId ||

          source.externalId ||

          source.fields
            ?.assetId
        )
    },

    metadata
  });
}


/* =========================================================
   FINANCIAL SCOPE KEY
   ========================================================= */

/*
 * Used later by indexing / rollup engines.
 *
 * A financial scope is simply a Passport.
 *
 * Example:
 *
 * scope key:
 * passport:IXP-...
 */
export function createIXIFinancialScopeKey(
  passportId
) {

  const resolvedPassportId =
    clean(
      passportId
    );


  return resolvedPassportId
    ? `passport:${resolvedPassportId}`
    : "";
}


/* =========================================================
   GET ALL SCOPE KEYS
   ========================================================= */

export function getIXIFinancialScopeKeys(
  references = []
) {

  return Array.from(
    new Set(
      dedupeIXIFinancialReferences(
        references
      )
        .map(
          reference =>
            createIXIFinancialScopeKey(
              reference.passportId
            )
        )
        .filter(
          Boolean
        )
    )
  );
}


/* =========================================================
   DEFAULT EXPORT
   ========================================================= */

export default {
  createIXIFinancialReferenceKey,

  createIXIFinancialReference,
  normalizeIXIFinancialReference,
  isIXIFinancialReference,

  dedupeIXIFinancialReferences,
  addIXIFinancialReference,
  removeIXIFinancialReference,

  getIXIFinancialReferencesForPassport,
  getIXIFinancialReferencesByRole,
  hasIXIFinancialPassportReference,

  getPrimaryIXIFinancialReference,

  createIXIFinancialReferenceFromObject,

  createIXIFinancialScopeKey,
  getIXIFinancialScopeKeys
};
