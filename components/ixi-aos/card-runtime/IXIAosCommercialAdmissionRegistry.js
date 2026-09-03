/*
 * IXI AOS — FACELAB COMMERCIAL ADMISSION REGISTRY
 *
 * This registry is deliberately conservative. A card is not production-ready
 * because it renders. It must prove the full commercial editing contract first.
 *
 * Status meanings:
 * - ready-for-runtime-qa: source contract is complete enough for real runtime QA.
 * - repair-required: known source-level commercial contract gaps remain.
 * - unverified: not present/verified in the active numbered-card runtime path.
 *
 * This file does not alter rendering. It is the admission/audit source of truth
 * used by tests and the repair program.
 */

export const IXI_AOS_COMMERCIAL_ADMISSION = Object.freeze({
  "001": Object.freeze({ status: "ready-for-runtime-qa", blockers: [] }),
  "002": Object.freeze({ status: "ready-for-runtime-qa", blockers: [] }),
  "003": Object.freeze({ status: "ready-for-runtime-qa", blockers: [] }),
  "004": Object.freeze({ status: "ready-for-runtime-qa", blockers: [] }),
  "005": Object.freeze({ status: "ready-for-runtime-qa", blockers: [] }),
  "006": Object.freeze({ status: "ready-for-runtime-qa", blockers: [] }),
  "007": Object.freeze({ status: "ready-for-runtime-qa", blockers: [] }),
  "008": Object.freeze({ status: "ready-for-runtime-qa", blockers: [] }),
  "009": Object.freeze({ status: "ready-for-runtime-qa", blockers: [] }),
  "009B": Object.freeze({
    status: "unverified",
    blockers: ["active-runtime-registration"]
  }),
  "010": Object.freeze({
    status: "repair-required",
    blockers: ["field-label-edit", "field-add", "field-delete", "media-editor"]
  }),
  "011": Object.freeze({
    status: "repair-required",
    blockers: ["field-label-edit", "field-add", "field-delete", "media-editor"]
  }),
  "012": Object.freeze({
    status: "repair-required",
    blockers: ["field-label-edit", "field-add", "field-delete", "media-editor"]
  }),
  "013": Object.freeze({
    status: "repair-required",
    blockers: ["field-label-edit", "field-add", "field-delete"]
  }),
  "014": Object.freeze({
    status: "repair-required",
    blockers: ["field-label-edit", "field-add", "field-delete"]
  }),
  "015": Object.freeze({
    status: "repair-required",
    blockers: ["field-label-edit", "field-add", "field-delete", "media-editor"]
  }),
  "016": Object.freeze({
    status: "repair-required",
    blockers: ["field-label-edit", "field-add", "field-delete", "media-editor"]
  }),
  "017": Object.freeze({
    status: "repair-required",
    blockers: ["field-label-edit", "field-add", "field-delete", "media-editor"]
  })
});

export function getAosCommercialAdmission(cardNumber) {
  return IXI_AOS_COMMERCIAL_ADMISSION[String(cardNumber || "").toUpperCase()] || null;
}

export function isAosCardReadyForRuntimeQa(cardNumber) {
  return getAosCommercialAdmission(cardNumber)?.status === "ready-for-runtime-qa";
}

export default IXI_AOS_COMMERCIAL_ADMISSION;