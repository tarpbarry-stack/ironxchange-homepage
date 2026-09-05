const clean = value => String(value ?? "").trim();

const TECH_WORK_MODULE_MARKERS = new Set([
  "tech-work-order",
  "technology-work",
  "technology-work-order"
]);

export function isIXITechWorkOrderDocument(document = {}, embedded = {}) {
  const transactModule = clean(document?.metadata?.transactModule).toLowerCase();
  const schema = clean(embedded?.schema || document?.schema).toLowerCase();
  const recordNumber = clean(
    embedded?.identity?.techWorkOrderNumber ||
      embedded?.identity?.techWorkOrderId ||
      embedded?.techWorkOrderNumber ||
      document?.documentNumber
  ).toUpperCase();

  return Boolean(
    document?.techWorkOrder ||
      TECH_WORK_MODULE_MARKERS.has(transactModule) ||
      schema.startsWith("ixi-tech-work-order") ||
      recordNumber.startsWith("TECHWO-") ||
      recordNumber.startsWith("TECHWO#")
  );
}

export function resolveIXITransactRecordModuleId({
  documentType = "",
  document = {},
  embedded = {},
  fallbackModuleId = ""
} = {}) {
  if (
    clean(documentType).toLowerCase() === "work-order" &&
    isIXITechWorkOrderDocument(document, embedded)
  ) {
    return "technology-work";
  }

  return clean(fallbackModuleId);
}

export default resolveIXITransactRecordModuleId;
