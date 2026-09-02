/*
 * IXI AOS FINANCIAL RUNTIME ADAPTER
 *
 * PURPOSE
 * -------
 *
 * Connect an AOS Object to the canonical
 * Financial Command Client.
 *
 *
 * FLOW
 * ----
 *
 * AOS Object / AOF2
 *      ↓
 * Runtime Adapter
 *      ↓
 * resolve Object Passport
 *      ↓
 * build Financial references
 *      ↓
 * build snapshot target
 *      ↓
 * Financial Command Client
 *      ↓
 * IX-Core
 *      ↓
 * DynamoDB
 *      ↓
 * refreshed AOF2 snapshot
 *
 *
 * IMPORTANT
 * ---------
 *
 * Financial Faces should NOT manually build
 * Passport reference plumbing.
 *
 * They provide financial input.
 *
 * This adapter provides AOS context.
 */


import {
  getAosPassportId
} from "../../../lib/mos/ixiAosProvisioningContract";

import {
  createIXIFinancialDocument
} from "./IXIAosFinancialCommandClient";


/* =========================================================
   HELPERS
   ========================================================= */

function clean(
  value
) {
  return String(
    value ??
    ""
  ).trim();
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


function safeObject(
  value
) {
  return (
    value &&
    typeof value ===
      "object" &&
    !Array.isArray(value)
  )
    ? value
    : {};
}


/* =========================================================
   PASSPORT RESOLUTION
   ========================================================= */

/*
 * Canonical AOS Passport identity wins.
 *
 * The compatibility fallbacks below remain
 * intentionally because legacy listing and
 * pre-provisioning records may still expose
 * Passport identity through older shapes.
 *
 * New durable AOS Objects, Object Studio,
 * Bulk, Chat/API, TRAN$ACT and Authority all
 * converge on getAosPassportId().
 */

export function getIXIAosFinancialPassportId(
  object = {}
) {
  const source =
    safeObject(
      object
    );


  const canonicalPassportId =
    clean(
      getAosPassportId(
        source
      )
    );


  if (
    canonicalPassportId
  ) {
    return canonicalPassportId;
  }


  const legacyCandidates = [
    source.identity
      ?.passportId,

    source.publicData
      ?.passportId,

    source.attributes
      ?.publicData
      ?.passportId,

    source.attributes
      ?.metadata
      ?.passportId,

    source.metadata
      ?.passportId
  ];


  for (
    const candidate of
      legacyCandidates
  ) {

    const value =
      clean(
        candidate
      );


    if (
      value
    ) {
      return value;
    }
  }


  return "";
}


/* =========================================================
   OBJECT TYPE
   ========================================================= */

export function getIXIAosFinancialObjectType(
  object = {}
) {
  const source =
    safeObject(
      object
    );


  return clean(
    source.objectType ||
    source.type ||
    source.objectClass ||
    source.className ||
    source.cardFamily ||
    source.metadata
      ?.objectType
  ).toLowerCase();
}


/* =========================================================
   OBJECT LABEL
   ========================================================= */

export function getIXIAosFinancialObjectLabel(
  object = {}
) {
  const source =
    safeObject(
      object
    );


  return clean(
    source.label ||
    source.name ||
    source.title ||
    source.displayName ||
    source.attributes
      ?.title ||
    source.metadata
      ?.label
  );
}


/* =========================================================
   DEFAULT FINANCIAL ROLE
   ========================================================= */

export function getIXIAosFinancialReferenceRole(
  object = {}
) {
  const objectType =
    getIXIAosFinancialObjectType(
      object
    );


  const roleMap = {
    machine:
      "asset",

    equipment:
      "asset",

    vehicle:
      "asset",

    truck:
      "asset",

    trailer:
      "asset",

    attachment:
      "asset",

    tool:
      "asset",

    job:
      "job",

    project:
      "job",

    employee:
      "employee",

    person:
      "employee",

    technician:
      "technician",

    mechanic:
      "technician",

    vendor:
      "vendor",

    supplier:
      "vendor",

    customer:
      "customer",

    location:
      "location",

    yard:
      "location",

    entity:
      "entity",

    company:
      "entity",

    organization:
      "entity"
  };


  return (
    roleMap[
      objectType
    ] ||
    "object"
  );
}


/* =========================================================
   OBJECT REFERENCE
   ========================================================= */

export function createIXIAosFinancialObjectReference({
  object = {},
  role = ""
} = {}) {
  const passportId =
    getIXIAosFinancialPassportId(
      object
    );


  if (
    !passportId
  ) {
    return null;
  }


  const objectType =
    getIXIAosFinancialObjectType(
      object
    );


  const label =
    getIXIAosFinancialObjectLabel(
      object
    );


  return {
    passportId,

    role:
      clean(
        role
      ) ||
      getIXIAosFinancialReferenceRole(
        object
      ),

    label,

    objectType
  };
}


/* =========================================================
   REFERENCE MERGE
   ========================================================= */

export function mergeIXIAosFinancialReferences(
  ...referenceGroups
) {
  const map =
    new Map();


  referenceGroups
    .flatMap(
      group =>
        safeArray(
          group
        )
    )
    .filter(
      Boolean
    )
    .forEach(
      reference => {

        const passportId =
          clean(
            reference
              ?.passportId
          );


        const role =
          clean(
            reference
              ?.role
          );


        if (
          !passportId ||
          !role
        ) {
          return;
        }


        const key =
          `${passportId}|${role}`;


        if (
          !map.has(
            key
          )
        ) {

          map.set(
            key,
            {
              ...safeObject(
                reference
              ),

              passportId,

              role
            }
          );
        }
      }
    );


  return Array.from(
    map.values()
  );
}


/* =========================================================
   FINANCIAL INPUT
   ========================================================= */

export function createIXIAosFinancialInput({
  object = {},
  input = {},
  objectRole = "",
  additionalReferences = []
} = {}) {
  const sourceInput =
    safeObject(
      input
    );


  const objectReference =
    createIXIAosFinancialObjectReference({
      object,

      role:
        objectRole
    });


  const references =
    mergeIXIAosFinancialReferences(
      objectReference
        ? [
            objectReference
          ]
        : [],

      sourceInput.references,

      additionalReferences
    );


  return {
    ...sourceInput,

    references
  };
}


/* =========================================================
   PASSPORT SNAPSHOT TARGET
   ========================================================= */

export function createIXIAosPassportFinancialSnapshotTarget({
  object = {},
  currency = "USD",
  includeFacts = true,
  recentActivityLimit = 5
} = {}) {
  const passportId =
    getIXIAosFinancialPassportId(
      object
    );


  if (
    !passportId
  ) {
    return {
      mode:
        "none"
    };
  }


  return {
    mode:
      "passport",

    passportId,

    currency:
      clean(
        currency ||
        "USD"
      ).toUpperCase(),

    includeFacts:
      Boolean(
        includeFacts
      ),

    recentActivityLimit:
      Number(
        recentActivityLimit ||
        5
      )
  };
}


/* =========================================================
   RECURSIVE SCOPE TARGET
   ========================================================= */

/*
 * AOS owns hierarchy discovery.
 *
 * Financial does NOT crawl containers.
 *
 * Once AOS knows the current recursive scope,
 * it passes those Passport IDs here.
 */

export function createIXIAosScopeFinancialSnapshotTarget({
  object = {},
  rootPassportId = "",
  scopePassportIds = [],
  currency = "USD",
  includeFacts = true,
  recentActivityLimit = 5
} = {}) {
  const objectPassportId =
    getIXIAosFinancialPassportId(
      object
    );


  const resolvedRoot =
    clean(
      rootPassportId
    ) ||
    objectPassportId;


  const resolvedScope =
    Array.from(
      new Set(
        [
          ...safeArray(
            scopePassportIds
          ),

          objectPassportId
        ]
          .map(
            clean
          )
          .filter(
            Boolean
          )
      )
    );


  if (
    !resolvedRoot &&
    resolvedScope.length ===
      0
  ) {
    return {
      mode:
        "none"
    };
  }


  return {
    mode:
      "scope",

    rootPassportId:
      resolvedRoot,

    scopePassportIds:
      resolvedScope,

    currency:
      clean(
        currency ||
        "USD"
      ).toUpperCase(),

    includeFacts:
      Boolean(
        includeFacts
      ),

    recentActivityLimit:
      Number(
        recentActivityLimit ||
        5
      )
  };
}


/* =========================================================
   EXECUTE OBJECT FINANCIAL COMMAND
   ========================================================= */

export async function createIXIAosObjectFinancialDocument({
  object = {},

  documentType = "",

  input = {},

  objectRole = "",

  additionalReferences = [],

  snapshot = null,

  recursiveScopePassportIds = [],

  recursiveRootPassportId = "",

  commandId = "",

  idempotencyKey = "",

  metadata = {},

  apiBaseUrl = "",

  headers = {},

  signal = undefined
} = {}) {
  const financialInput =
    createIXIAosFinancialInput({
      object,

      input,

      objectRole,

      additionalReferences
    });


  const currency =
    clean(
      financialInput.currency ||
      "USD"
    ).toUpperCase();


  let resolvedSnapshot =
    safeObject(
      snapshot
    );


  /*
   * Explicit snapshot wins.
   */
  if (
    !Object.keys(
      resolvedSnapshot
    ).length
  ) {

    /*
     * If AOS already supplied recursive
     * membership, request the recursive
     * Financial snapshot immediately.
     */
    if (
      safeArray(
        recursiveScopePassportIds
      ).length ||
      clean(
        recursiveRootPassportId
      )
    ) {

      resolvedSnapshot =
        createIXIAosScopeFinancialSnapshotTarget({
          object,

          rootPassportId:
            recursiveRootPassportId,

          scopePassportIds:
            recursiveScopePassportIds,

          currency,

          includeFacts:
            true,

          recentActivityLimit:
            5
        });

    } else {

      /*
       * Otherwise refresh the Object's own
       * AOF2 snapshot.
       */
      resolvedSnapshot =
        createIXIAosPassportFinancialSnapshotTarget({
          object,

          currency,

          includeFacts:
            true,

          recentActivityLimit:
            5
        });
    }
  }


  return createIXIFinancialDocument({
    documentType,

    input:
      financialInput,

    commandId,

    idempotencyKey,

    snapshot:
      resolvedSnapshot,

    metadata: {
      ...safeObject(
        metadata
      ),

      transactContractVersion: "1.0.0",
      transactDocumentType: clean(documentType).toLowerCase(),
      transactInput: { ...financialInput },

      aosObjectPassportId:
        getIXIAosFinancialPassportId(
          object
        ),

      aosObjectType:
        getIXIAosFinancialObjectType(
          object
        ),

      aosObjectLabel:
        getIXIAosFinancialObjectLabel(
          object
        ),

      adapter:
        "IXIAosFinancialRuntimeAdapter"
    },

    apiBaseUrl,

    headers,

    signal
  });
}


/* =========================================================
   CONVENIENCE OBJECT COMMANDS
   ========================================================= */

export async function createIXIAosExpense(
  options = {}
) {
  return createIXIAosObjectFinancialDocument({
    ...safeObject(
      options
    ),

    documentType:
      "expense"
  });
}


export async function createIXIAosPurchaseOrder(
  options = {}
) {
  return createIXIAosObjectFinancialDocument({
    ...safeObject(
      options
    ),

    documentType:
      "purchase-order"
  });
}


export async function createIXIAosBill(
  options = {}
) {
  return createIXIAosObjectFinancialDocument({
    ...safeObject(
      options
    ),

    documentType:
      "bill"
  });
}


export async function createIXIAosPayment(
  options = {}
) {
  return createIXIAosObjectFinancialDocument({
    ...safeObject(
      options
    ),

    documentType:
      "payment"
  });
}


export async function createIXIAosInvoice(
  options = {}
) {
  return createIXIAosObjectFinancialDocument({
    ...safeObject(
      options
    ),

    documentType:
      "invoice"
  });
}


export async function createIXIAosWorkOrder(
  options = {}
) {
  return createIXIAosObjectFinancialDocument({
    ...safeObject(
      options
    ),

    documentType:
      "work-order"
  });
}


export async function createIXIAosTimeEntry(
  options = {}
) {
  return createIXIAosObjectFinancialDocument({
    ...safeObject(
      options
    ),

    documentType:
      "time-entry"
  });
}


export async function createIXIAosCredit(
  options = {}
) {
  return createIXIAosObjectFinancialDocument({
    ...safeObject(
      options
    ),

    documentType:
      "credit"
  });
}


/* =========================================================
   DEFAULT EXPORT
   ========================================================= */

export default {
  getIXIAosFinancialPassportId,

  getIXIAosFinancialObjectType,

  getIXIAosFinancialObjectLabel,

  getIXIAosFinancialReferenceRole,

  createIXIAosFinancialObjectReference,

  mergeIXIAosFinancialReferences,

  createIXIAosFinancialInput,

  createIXIAosPassportFinancialSnapshotTarget,

  createIXIAosScopeFinancialSnapshotTarget,

  createIXIAosObjectFinancialDocument,

  createIXIAosExpense,

  createIXIAosPurchaseOrder,

  createIXIAosBill,

  createIXIAosPayment,

  createIXIAosInvoice,

  createIXIAosWorkOrder,

  createIXIAosTimeEntry,

  createIXIAosCredit
};
