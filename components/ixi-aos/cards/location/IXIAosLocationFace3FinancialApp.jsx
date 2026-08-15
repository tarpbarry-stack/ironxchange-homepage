import { useMemo } from "react";

import IXIAosLocationFace3Financial from "./IXIAosLocationFace3Financial";
import { createIXILocationFinancialViewModel } from "../../financial-runtime/IXIAosLocationFinancialRuntime";

const STATIC_LOCATION_FINANCIAL_FIELDS = new Set([
  "ownershipStatus",
  "ownershipType",
  "acquiredDate",
  "leaseType",
  "leaseStartDate",
  "leaseEndDate",
  "rentEscalation",
  "renewalOption",
  "landlord",
  "landlordContact",
  "landlordPhone",
  "propertyOwner",
  "ownerContact",
  "ownerPhone",
  "propertyManager",
  "managerPhone",
  "managerEmail",
  "landValue",
  "improvementValue",
  "currentValue",
  "lastAppraised",
  "taxAuthority",
  "taxYear",
  "taxRate",
  "financialNotes"
]);

function filterStaticFields(fields = {}) {
  const next = {};
  Object.entries(fields || {}).forEach(([key, value]) => {
    if (STATIC_LOCATION_FINANCIAL_FIELDS.has(key)) next[key] = value;
  });
  return next;
}

export default function IXIAosLocationFace3FinancialApp({
  object = {},
  ixiState = {},
  financialSnapshot = {},
  onIxiStateChange = null,
  onSaveObject = null,
  ...props
}) {
  const view = useMemo(
    () => createIXILocationFinancialViewModel({ object, financialSnapshot }),
    [object, financialSnapshot]
  );

  const authoritativeFields = view.hasFinancialSnapshot
    ? {
        revenueYtd: view.financialTotals.revenueYtd,
        expensesYtd: view.financialTotals.expensesYtd,
        netIncomeYtd: view.financialTotals.netIncomeYtd
      }
    : {};

  const runtimeObject = useMemo(
    () => ({
      ...object,
      fields: {
        ...(object.fields || {}),
        ...authoritativeFields
      }
    }),
    [object, authoritativeFields.revenueYtd, authoritativeFields.expensesYtd, authoritativeFields.netIncomeYtd]
  );

  const runtimeState = useMemo(() => {
    if (!ixiState?.face3SavedFields) return ixiState;
    return {
      ...ixiState,
      face3SavedFields: {
        ...filterStaticFields(ixiState.face3SavedFields),
        ...authoritativeFields
      }
    };
  }, [ixiState, authoritativeFields.revenueYtd, authoritativeFields.expensesYtd, authoritativeFields.netIncomeYtd]);

  function updateState(objectId, patch = {}) {
    if (patch?.face3SavedFields) {
      onIxiStateChange?.(objectId, {
        ...patch,
        face3SavedFields: {
          ...filterStaticFields(patch.face3SavedFields),
          ...authoritativeFields
        }
      });
      return;
    }
    onIxiStateChange?.(objectId, patch);
  }

  async function saveObject(payload = {}) {
    const staticFields = filterStaticFields(payload.fields || {});
    await onSaveObject?.({
      ...payload,
      object: {
        ...(payload.object || runtimeObject),
        fields: {
          ...((payload.object || runtimeObject)?.fields || {}),
          ...staticFields,
          ...authoritativeFields
        }
      },
      fields: staticFields,
      financialSnapshotAuthoritative: view.hasFinancialSnapshot,
      financialPassportId: view.passportId
    });
  }

  return (
    <IXIAosLocationFace3Financial
      {...props}
      object={runtimeObject}
      ixiState={runtimeState}
      onIxiStateChange={updateState}
      onSaveObject={saveObject}
    />
  );
}
