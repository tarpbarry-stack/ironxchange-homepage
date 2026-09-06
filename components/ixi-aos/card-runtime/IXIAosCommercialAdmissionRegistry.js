/*
 * IXI AOS — FACELAB COMMERCIAL ADMISSION REGISTRY
 *
 * A card is not production-ready because it renders. It must prove the source
 * contract first, then pass real AOS/Work runtime persistence QA.
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
  "009B": Object.freeze({ status: "unverified", blockers: ["active-runtime-registration"] }),
  "010": Object.freeze({ status: "ready-for-runtime-qa", blockers: [] }),
  "011": Object.freeze({ status: "ready-for-runtime-qa", blockers: [] }),
  "012": Object.freeze({ status: "ready-for-runtime-qa", blockers: [] }),
  "013": Object.freeze({ status: "ready-for-runtime-qa", blockers: [] }),
  "014": Object.freeze({ status: "ready-for-runtime-qa", blockers: [] }),
  "015": Object.freeze({ status: "ready-for-runtime-qa", blockers: [] }),
  "016": Object.freeze({ status: "ready-for-runtime-qa", blockers: [] }),
  "017": Object.freeze({ status: "ready-for-runtime-qa", blockers: [] }),
  "018": Object.freeze({ status: "ready-for-runtime-qa", blockers: [] }),
  "019": Object.freeze({ status: "ready-for-runtime-qa", blockers: [] })
});

export function getAosCommercialAdmission(cardNumber) {
  return IXI_AOS_COMMERCIAL_ADMISSION[String(cardNumber || "").toUpperCase()] || null;
}

export function isAosCardReadyForRuntimeQa(cardNumber) {
  return getAosCommercialAdmission(cardNumber)?.status === "ready-for-runtime-qa";
}

export default IXI_AOS_COMMERCIAL_ADMISSION;
