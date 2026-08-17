import {
  createIXIAosObjectFinancialDocument
} from "../../ixi-aos/financial-runtime/IXIAosFinancialRuntimeAdapter";
import {
  invalidateIXITransactDashboardCache
} from "./IXITransactDashboardCache";

const clean = value => String(value ?? "").trim();
const safeObject = value => value && typeof value === "object" && !Array.isArray(value) ? value : {};
const safeArray = value => Array.isArray(value) ? value : [];

export function createIXITransactDesktopCommandContext({
  object = {},
  record = {},
  entityPassportId = "",
  scopePassportIds = []
} = {}) {
  const sourceObject = safeObject(object);
  const sourceRecord = safeObject(record);
  const references = safeArray(sourceRecord.references || sourceRecord.input?.references);

  return {
    object: sourceObject,
    entityPassportId: clean(entityPassportId),
    scopePassportIds: Array.from(new Set([
      ...safeArray(scopePassportIds),
      ...references.map(item => item?.passportId)
    ].map(clean).filter(Boolean)))
  };
}

export async function executeIXITransactDesktopFinancialCommand({
  object = {},
  documentType = "",
  input = {},
  additionalReferences = [],
  entityPassportId = "",
  scopePassportIds = [],
  rootPassportId = "",
  commandId = "",
  idempotencyKey = "",
  metadata = {},
  apiBaseUrl = "/api/ixi-financial",
  signal = undefined
} = {}) {
  if (!clean(documentType)) {
    throw new Error("IXI TRAN$ACT desktop command requires documentType.");
  }

  const result = await createIXIAosObjectFinancialDocument({
    object,
    documentType,
    input,
    additionalReferences,
    recursiveScopePassportIds: safeArray(scopePassportIds),
    recursiveRootPassportId: clean(rootPassportId || entityPassportId),
    commandId,
    idempotencyKey,
    metadata: {
      ...safeObject(metadata),
      sourceSurface: "ixi-transact-dashboard",
      entityPassportId: clean(entityPassportId)
    },
    apiBaseUrl,
    signal
  });

  invalidateIXITransactDashboardCache();
  return result;
}

export default {
  createIXITransactDesktopCommandContext,
  executeIXITransactDesktopFinancialCommand
};
