/*
 * IXI FINANCIAL PERMISSION ENGINE
 *
 * PURPOSE
 * -------
 *
 * Controls access to financial capability,
 * data visibility and financial actions.
 *
 *
 * CORE RULE
 * ---------
 *
 * FINANCIAL CAPABILITY
 * may exist on every Passport.
 *
 * FINANCIAL VISIBILITY
 * is permissioned.
 *
 *
 * Example:
 *
 * Employee:
 *   may submit time / expense
 *
 * Supervisor:
 *   may review team / job costs
 *
 * Manager:
 *   may see broader operating cost
 *
 * Accounting:
 *   may see accounting mappings,
 *   vendor details and posting status
 *
 * Admin:
 *   may manage financial configuration
 *
 *
 * IMPORTANT
 * ---------
 *
 * This engine does NOT:
 *
 * - authenticate users
 * - fetch permissions from AWS
 * - decide organization structure
 * - persist anything
 * - post accounting entries
 *
 * It evaluates permission inputs supplied
 * by the application / policy layer.
 */


/* =========================================================
   PERMISSION NAMES
   ========================================================= */

export const IXI_FINANCIAL_PERMISSIONS = {

  /* -------------------------
     GENERAL VISIBILITY
     ------------------------- */

  VIEW_FACE:
    "financial.view-face",

  VIEW_SUMMARY:
    "financial.view-summary",

  VIEW_DETAILS:
    "financial.view-details",

  VIEW_DOCUMENTS:
    "financial.view-documents",

  VIEW_ATTACHMENTS:
    "financial.view-attachments",

  VIEW_HISTORY:
    "financial.view-history",


  /* -------------------------
     SENSITIVE VALUES
     ------------------------- */

  VIEW_AMOUNTS:
    "financial.view-amounts",

  VIEW_LABOR_RATES:
    "financial.view-labor-rates",

  VIEW_BILLABLE_RATES:
    "financial.view-billable-rates",

  VIEW_VENDOR_DETAILS:
    "financial.view-vendor-details",

  VIEW_CUSTOMER_DETAILS:
    "financial.view-customer-details",

  VIEW_ACCOUNTING:
    "financial.view-accounting",

  VIEW_EXTERNAL_MAPPINGS:
    "financial.view-external-mappings",


  /* -------------------------
     CREATE
     ------------------------- */

  CREATE_EXPENSE:
    "financial.create-expense",

  CREATE_PURCHASE_ORDER:
    "financial.create-purchase-order",

  CREATE_WORK_ORDER:
    "financial.create-work-order",

  CREATE_TIME_ENTRY:
    "financial.create-time-entry",

  CREATE_BILL:
    "financial.create-bill",

  CREATE_INVOICE:
    "financial.create-invoice",

  CREATE_PAYMENT:
    "financial.create-payment",


  /* -------------------------
     EDIT
     ------------------------- */

  EDIT_DOCUMENT:
    "financial.edit-document",

  EDIT_LINE:
    "financial.edit-line",

  EDIT_ACCOUNTING:
    "financial.edit-accounting",

  EDIT_EXTERNAL_MAPPINGS:
    "financial.edit-external-mappings",


  /* -------------------------
     APPROVAL / CONTROL
     ------------------------- */

  SUBMIT:
    "financial.submit",

  APPROVE:
    "financial.approve",

  REJECT:
    "financial.reject",

  VOID:
    "financial.void",

  REVERSE:
    "financial.reverse",

  RECONCILE:
    "financial.reconcile",


  /* -------------------------
     ACCOUNTING / SYNC
     ------------------------- */

  POST:
    "financial.post",

  SYNC:
    "financial.sync",

  EXPORT:
    "financial.export",

  IMPORT:
    "financial.import",


  /* -------------------------
     ADMIN
     ------------------------- */

  MANAGE_PERMISSIONS:
    "financial.manage-permissions",

  MANAGE_CONFIG:
    "financial.manage-config"
};


/* =========================================================
   COMMON ROLE PROFILES
   ========================================================= */

/*
 * These are defaults / helpers only.
 *
 * Enterprises may supply their own policy
 * system later.
 */

export const IXI_FINANCIAL_ROLE_PROFILES = {

  EMPLOYEE: {
    role:
      "employee",

    permissions: [
      IXI_FINANCIAL_PERMISSIONS
        .VIEW_FACE,

      IXI_FINANCIAL_PERMISSIONS
        .VIEW_SUMMARY,

      IXI_FINANCIAL_PERMISSIONS
        .CREATE_EXPENSE,

      IXI_FINANCIAL_PERMISSIONS
        .CREATE_TIME_ENTRY,

      IXI_FINANCIAL_PERMISSIONS
        .CREATE_WORK_ORDER,

      IXI_FINANCIAL_PERMISSIONS
        .SUBMIT
    ]
  },


  SUPERVISOR: {
    role:
      "supervisor",

    permissions: [
      IXI_FINANCIAL_PERMISSIONS
        .VIEW_FACE,

      IXI_FINANCIAL_PERMISSIONS
        .VIEW_SUMMARY,

      IXI_FINANCIAL_PERMISSIONS
        .VIEW_DETAILS,

      IXI_FINANCIAL_PERMISSIONS
        .VIEW_DOCUMENTS,

      IXI_FINANCIAL_PERMISSIONS
        .VIEW_AMOUNTS,

      IXI_FINANCIAL_PERMISSIONS
        .CREATE_EXPENSE,

      IXI_FINANCIAL_PERMISSIONS
        .CREATE_PURCHASE_ORDER,

      IXI_FINANCIAL_PERMISSIONS
        .CREATE_WORK_ORDER,

      IXI_FINANCIAL_PERMISSIONS
        .CREATE_TIME_ENTRY,

      IXI_FINANCIAL_PERMISSIONS
        .EDIT_DOCUMENT,

      IXI_FINANCIAL_PERMISSIONS
        .SUBMIT,

      IXI_FINANCIAL_PERMISSIONS
        .APPROVE,

      IXI_FINANCIAL_PERMISSIONS
        .REJECT
    ]
  },


  MANAGER: {
    role:
      "manager",

    permissions: [
      IXI_FINANCIAL_PERMISSIONS
        .VIEW_FACE,

      IXI_FINANCIAL_PERMISSIONS
        .VIEW_SUMMARY,

      IXI_FINANCIAL_PERMISSIONS
        .VIEW_DETAILS,

      IXI_FINANCIAL_PERMISSIONS
        .VIEW_DOCUMENTS,

      IXI_FINANCIAL_PERMISSIONS
        .VIEW_ATTACHMENTS,

      IXI_FINANCIAL_PERMISSIONS
        .VIEW_HISTORY,

      IXI_FINANCIAL_PERMISSIONS
        .VIEW_AMOUNTS,

      IXI_FINANCIAL_PERMISSIONS
        .VIEW_VENDOR_DETAILS,

      IXI_FINANCIAL_PERMISSIONS
        .VIEW_CUSTOMER_DETAILS,

      IXI_FINANCIAL_PERMISSIONS
        .CREATE_EXPENSE,

      IXI_FINANCIAL_PERMISSIONS
        .CREATE_PURCHASE_ORDER,

      IXI_FINANCIAL_PERMISSIONS
        .CREATE_WORK_ORDER,

      IXI_FINANCIAL_PERMISSIONS
        .CREATE_TIME_ENTRY,

      IXI_FINANCIAL_PERMISSIONS
        .CREATE_BILL,

      IXI_FINANCIAL_PERMISSIONS
        .CREATE_INVOICE,

      IXI_FINANCIAL_PERMISSIONS
        .EDIT_DOCUMENT,

      IXI_FINANCIAL_PERMISSIONS
        .EDIT_LINE,

      IXI_FINANCIAL_PERMISSIONS
        .SUBMIT,

      IXI_FINANCIAL_PERMISSIONS
        .APPROVE,

      IXI_FINANCIAL_PERMISSIONS
        .REJECT,

      IXI_FINANCIAL_PERMISSIONS
        .EXPORT
    ]
  },


  ACCOUNTING: {
    role:
      "accounting",

    permissions:
      Object.values(
        IXI_FINANCIAL_PERMISSIONS
      ).filter(
        permission =>
          permission !==
          IXI_FINANCIAL_PERMISSIONS
            .MANAGE_PERMISSIONS
      )
  },


  ADMIN: {
    role:
      "admin",

    permissions:
      Object.values(
        IXI_FINANCIAL_PERMISSIONS
      )
  }
};


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
    typeof value === "object" &&
    !Array.isArray(value)
  )
    ? value
    : {};
}


/* =========================================================
   NORMALIZE PERMISSION
   ========================================================= */

export function normalizeIXIFinancialPermission(
  value
) {

  return clean(
    value
  )
    .toLowerCase();
}


/* =========================================================
   NORMALIZE PERMISSION SET
   ========================================================= */

export function normalizeIXIFinancialPermissions(
  permissions = []
) {

  return Array.from(
    new Set(
      safeArray(
        permissions
      )
        .map(
          normalizeIXIFinancialPermission
        )
        .filter(
          Boolean
        )
    )
  );
}


/* =========================================================
   CREATE POLICY
   ========================================================= */

export function createIXIFinancialPermissionPolicy({
  policyId = "",

  role = "",

  permissions = [],

  passportIds = [],

  entityPassportIds = [],

  containerPassportIds = [],

  allowAllScopes = false,

  metadata = {}
} = {}) {

  return {
    policyId:
      clean(
        policyId
      ),

    role:
      clean(
        role
      )
        .toLowerCase(),

    permissions:
      normalizeIXIFinancialPermissions(
        permissions
      ),

    passportIds:
      Array.from(
        new Set(
          safeArray(
            passportIds
          )
            .map(
              clean
            )
            .filter(
              Boolean
            )
        )
      ),

    entityPassportIds:
      Array.from(
        new Set(
          safeArray(
            entityPassportIds
          )
            .map(
              clean
            )
            .filter(
              Boolean
            )
        )
      ),

    containerPassportIds:
      Array.from(
        new Set(
          safeArray(
            containerPassportIds
          )
            .map(
              clean
            )
            .filter(
              Boolean
            )
        )
      ),

    allowAllScopes:
      Boolean(
        allowAllScopes
      ),

    metadata: {
      ...safeObject(
        metadata
      )
    }
  };
}


/* =========================================================
   ROLE PROFILE → POLICY
   ========================================================= */

export function createIXIFinancialPolicyFromRole(
  role,
  overrides = {}
) {

  const resolvedRole =
    clean(
      role
    )
      .toUpperCase();


  const profile =
    IXI_FINANCIAL_ROLE_PROFILES[
      resolvedRole
    ] ||
    {
      role:
        clean(
          role
        )
          .toLowerCase(),

      permissions:
        []
    };


  return createIXIFinancialPermissionPolicy({
    role:
      profile.role,

    permissions:
      profile.permissions,

    ...safeObject(
      overrides
    )
  });
}


/* =========================================================
   HAS PERMISSION
   ========================================================= */

export function hasIXIFinancialPermission(
  policy = {},
  permission = ""
) {

  const normalizedPolicy =
    createIXIFinancialPermissionPolicy(
      policy
    );


  const target =
    normalizeIXIFinancialPermission(
      permission
    );


  if (
    !target
  ) {
    return false;
  }


  return normalizedPolicy
    .permissions
    .includes(
      target
    );
}


/* =========================================================
   SCOPE ACCESS
   ========================================================= */

/*
 * Scope is Passport-based.
 *
 * This does NOT infer graph ancestry.
 *
 * Caller may supply the resolved root/entity/
 * container IDs relevant to the requested
 * Passport.
 */

export function hasIXIFinancialScopeAccess(
  policy = {},
  {
    passportId = "",
    entityPassportId = "",
    containerPassportIds = []
  } = {}
) {

  const normalizedPolicy =
    createIXIFinancialPermissionPolicy(
      policy
    );


  if (
    normalizedPolicy
      .allowAllScopes
  ) {
    return true;
  }


  const targetPassport =
    clean(
      passportId
    );


  const targetEntity =
    clean(
      entityPassportId
    );


  const targetContainers =
    safeArray(
      containerPassportIds
    )
      .map(
        clean
      )
      .filter(
        Boolean
      );


  if (
    targetPassport &&
    normalizedPolicy
      .passportIds
      .includes(
        targetPassport
      )
  ) {
    return true;
  }


  if (
    targetEntity &&
    normalizedPolicy
      .entityPassportIds
      .includes(
        targetEntity
      )
  ) {
    return true;
  }


  if (
    targetContainers.some(
      passportId =>
        normalizedPolicy
          .containerPassportIds
          .includes(
            passportId
          )
    )
  ) {
    return true;
  }


  return false;
}


/* =========================================================
   CAN PERFORM
   ========================================================= */

export function canPerformIXIFinancialAction({
  policy = {},
  permission = "",
  scope = {}
} = {}) {

  return (
    hasIXIFinancialPermission(
      policy,
      permission
    ) &&
    hasIXIFinancialScopeAccess(
      policy,
      scope
    )
  );
}


/* =========================================================
   FACE VISIBILITY
   ========================================================= */

export function canViewIXIFinancialFace({
  policy = {},
  scope = {}
} = {}) {

  return canPerformIXIFinancialAction({
    policy,

    permission:
      IXI_FINANCIAL_PERMISSIONS
        .VIEW_FACE,

    scope
  });
}


/* =========================================================
   AMOUNT VISIBILITY
   ========================================================= */

export function canViewIXIFinancialAmounts({
  policy = {},
  scope = {}
} = {}) {

  return canPerformIXIFinancialAction({
    policy,

    permission:
      IXI_FINANCIAL_PERMISSIONS
        .VIEW_AMOUNTS,

    scope
  });
}


/* =========================================================
   CREATE HELPERS
   ========================================================= */

export function canCreateIXIFinancialExpense({
  policy = {},
  scope = {}
} = {}) {

  return canPerformIXIFinancialAction({
    policy,

    permission:
      IXI_FINANCIAL_PERMISSIONS
        .CREATE_EXPENSE,

    scope
  });
}


export function canCreateIXIFinancialPurchaseOrder({
  policy = {},
  scope = {}
} = {}) {

  return canPerformIXIFinancialAction({
    policy,

    permission:
      IXI_FINANCIAL_PERMISSIONS
        .CREATE_PURCHASE_ORDER,

    scope
  });
}


export function canCreateIXIFinancialWorkOrder({
  policy = {},
  scope = {}
} = {}) {

  return canPerformIXIFinancialAction({
    policy,

    permission:
      IXI_FINANCIAL_PERMISSIONS
        .CREATE_WORK_ORDER,

    scope
  });
}


export function canCreateIXIFinancialTimeEntry({
  policy = {},
  scope = {}
} = {}) {

  return canPerformIXIFinancialAction({
    policy,

    permission:
      IXI_FINANCIAL_PERMISSIONS
        .CREATE_TIME_ENTRY,

    scope
  });
}


/* =========================================================
   REDACTION
   ========================================================= */

/*
 * Redacts sensitive financial information
 * before it reaches Face 2 / Workbook UI.
 *
 * IMPORTANT:
 *
 * This is presentation / application-level
 * redaction.
 *
 * AWS/API authorization must still enforce
 * access server-side later.
 */

export function redactIXIFinancialDocument({
  document = {},
  policy = {},
  scope = {}
} = {}) {

  const source = {
    ...safeObject(
      document
    )
  };


  if (
    !canViewIXIFinancialFace({
      policy,
      scope
    })
  ) {
    return null;
  }


  const canViewAmounts =
    canViewIXIFinancialAmounts({
      policy,
      scope
    });


  const canViewAccounting =
    canPerformIXIFinancialAction({
      policy,

      permission:
        IXI_FINANCIAL_PERMISSIONS
          .VIEW_ACCOUNTING,

      scope
    });


  const canViewVendor =
    canPerformIXIFinancialAction({
      policy,

      permission:
        IXI_FINANCIAL_PERMISSIONS
          .VIEW_VENDOR_DETAILS,

      scope
    });


  const redacted = {
    ...source,

    lines:
      safeArray(
        source.lines
      ).map(
        line => {

          const nextLine = {
            ...safeObject(
              line
            )
          };


          if (
            !canViewAmounts
          ) {
            nextLine.rate =
              null;

            nextLine.subtotal =
              null;

            nextLine.discountAmount =
              null;

            nextLine.netBeforeTax =
              null;

            nextLine.amount =
              null;


            if (
              nextLine.tax
            ) {
              nextLine.tax = {
                ...nextLine.tax,
                amount:
                  null
              };
            }
          }


          if (
            !canViewAccounting
          ) {
            delete nextLine.accounting;
          }


          return nextLine;
        }
      )
  };


  if (
    !canViewAmounts
  ) {
    redacted.totals =
      null;
  }


  if (
    !canViewAccounting
  ) {
    delete redacted.accountingState;
  }


  if (
    !canViewVendor
  ) {

    redacted.references =
      safeArray(
        redacted.references
      ).filter(
        reference => {

          const role =
            clean(
              reference
                ?.role
            )
              .toLowerCase();


          return (
            role !== "vendor" &&
            role !== "supplier"
          );
        }
      );
  }


  return redacted;
}


/* =========================================================
   SNAPSHOT REDACTION
   ========================================================= */

export function redactIXIFinancialSnapshot({
  snapshot = {},
  policy = {},
  scope = {}
} = {}) {

  if (
    !canViewIXIFinancialFace({
      policy,
      scope
    })
  ) {
    return null;
  }


  const canViewAmounts =
    canViewIXIFinancialAmounts({
      policy,
      scope
    });


  if (
    canViewAmounts
  ) {
    return {
      ...safeObject(
        snapshot
      )
    };
  }


  const source =
    safeObject(
      snapshot
    );


  return {
    ...source,

    snapshots:
      Object.keys(
        safeObject(
          source.snapshots
        )
      )
        .reduce(
          (
            result,
            currency
          ) => {

            result[
              currency
            ] = {
              currency,

              restricted:
                true
            };


            return result;
          },
          {}
        ),

    facts:
      []
  };
}


/* =========================================================
   DEFAULT EXPORT
   ========================================================= */

export default {
  IXI_FINANCIAL_PERMISSIONS,
  IXI_FINANCIAL_ROLE_PROFILES,

  normalizeIXIFinancialPermission,
  normalizeIXIFinancialPermissions,

  createIXIFinancialPermissionPolicy,
  createIXIFinancialPolicyFromRole,

  hasIXIFinancialPermission,
  hasIXIFinancialScopeAccess,
  canPerformIXIFinancialAction,

  canViewIXIFinancialFace,
  canViewIXIFinancialAmounts,

  canCreateIXIFinancialExpense,
  canCreateIXIFinancialPurchaseOrder,
  canCreateIXIFinancialWorkOrder,
  canCreateIXIFinancialTimeEntry,

  redactIXIFinancialDocument,
  redactIXIFinancialSnapshot
};
