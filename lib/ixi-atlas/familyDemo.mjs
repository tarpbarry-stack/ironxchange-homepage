export const SAMPLE_OBJECT_ID = "atlas-family-machine";
export const SAMPLE_PASSPORT_ID = "DEMO-ATLAS-475";
export const FAMILY_SCALE_MODES = ["focus", "work", "xl", "large", "medium", "compact", "micro"];

export function createFamilySample(family = "private") {
  const reference = family === "reference";
  const auction = family === "auction";
  const publicData = {
    objectId: SAMPLE_OBJECT_ID, passportId: SAMPLE_PASSPORT_ID,
    machineAccess: auction ? "public" : "private", machineChannel: auction ? "auction" : "none",
    ownershipRole: reference || auction ? "non-owner" : "owner", ownershipStatus: reference || auction ? "reference" : "owned",
    machineOrigin: reference ? "url-import" : "atlas-sample",
    sourceUrl: reference || auction ? "https://example.com/atlas/sample-wa475" : "",
    year: 2023, make: "Komatsu", model: "WA475-10", hours: 4812, location: "Abilene, TX",
    description: reference ? "Source notes: sample URL-imported wheel loader. Verify hours, condition and availability with the original source. This reference does not establish ownership." : "Sample wheel loader for Atlas practice. Quick coupler and 4,812 hours. This fictional machine is not offered for sale.",
  };
  return {
    ...publicData, id: { uuid: SAMPLE_OBJECT_ID }, publicData,
    canonicalIdentity: { objectId: SAMPLE_OBJECT_ID, passportId: SAMPLE_PASSPORT_ID },
    title: "2023 Komatsu WA475-10", category: "Wheel Loader", price: "$315,000",
    serialNumber: "DEMO-WA475-001", stockNumber: "DEMO-1047", sellerCompany: "ATLAS SAMPLE",
    imageUrls: ["/images/2023-komatsu-wa475-10.jpg", "/images/ixi-homepage-komatsu-wa475-cutout.png"], imageCount: 2,
    keywords: ["Wheel loader", "Sample machine"], lotNumber: "1047",
    auctionObject: auction ? {
      company: { name: "ATLAS SAMPLE AUCTION" },
      event: { id: "DEMO-EVENT-01", name: "Sample equipment sale", location: { city: "Abilene", state: "TX" }, format: "Online", date: "2030-01-15", timeText: "10:00 AM CT" },
      lot: { lotNumber: "1047", openingBid: 125000, sourceUrl: "https://example.com/atlas/sample-wa475" },
      machine: { serialNumber: "DEMO-WA475-001", hours: 4812 },
      auctionRules: {
        buyerPremium: { purchaseTiers: [{ minAmount: 0, maxAmount: null, cashCheckWireRatePercent: 10 }] },
        paymentDue: { relativeBusinessDays: 3 }, removal: { relativeDays: 14 },
      },
    } : undefined,
  };
}

// Explicit local capability: identity, access and ownership are never editable facts.
export function patchSampleFacts(sample, changes = {}) {
  const facts = {};
  for (const key of ["price", "hours", "location", "description", "lotNumber"]) {
    if (Object.hasOwn(changes, key) && ["string", "number"].includes(typeof changes[key])) facts[key] = changes[key];
  }
  return { ...sample, ...facts, publicData: { ...sample.publicData, ...facts } };
}

export function sampleDisposition(action) {
  return ({
    "move-private": "BOUGHT simulated. In the live workflow, confirm the acquisition and owned-inventory result. The sample Passport is unchanged.",
    archive: "ARCHIVE simulated. The sample remains available for practice and its Passport is unchanged.",
    "hard-delete": "LISTING REMOVAL simulated. No record or media was deleted. The permanent Passport is preserved.",
  })[action] || "No disposition recorded.";
}
