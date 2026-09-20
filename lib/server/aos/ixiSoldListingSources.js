import { createInstance, types } from "sharetribe-flex-integration-sdk";
import { normalizeSharetribeListings } from "../../listings/normalizeSharetribeListings";
import { listingPassportId } from "../../listings/IXISoldInventory.mjs";

// Only IDs supplied by the authorized financial projection are eligible.
// Every source must match both the listing ID and the canonical Passport.
export async function completeSoldListingSources(sales, existing = []) {
  const present = new Set(existing.map(listingPassportId));
  const wanted = sales.filter(sale => sale.listingId && !present.has(sale.passportId));
  const ids = [...new Set(wanted.map(sale => sale.listingId))];
  if (!ids.length) return { listings: existing, issues: [] };
  const sdk = createInstance({ clientId: process.env.SHARETRIBE_CLIENT_ID, clientSecret: process.env.SHARETRIBE_CLIENT_SECRET });
  const sources = new Map();
  const add = response => {
    for (const listing of normalizeSharetribeListings(response)) {
      sources.set(String(listing.id?.uuid || listing.id), listing);
    }
  };
  // Sharetribe accepts up to 100 IDs. Query once instead of fetching the
  // seller's entire catalogue followed by individual missing listings.
  for (let index = 0; index < ids.length; index += 100) {
    const batch = ids.slice(index, index + 100);
    try {
      const response = await sdk.listings.query({ ids: batch.map(id => new types.UUID(id)), perPage: 100, include: ["images", "author", "author.profileImage"] });
      add(response.data);
    } catch {
      // An unavailable/deleted source must never hide the recorded sale.
      // Retain individual lookups as recovery if a batch is rejected.
      for (let offset = 0; offset < batch.length; offset += 4) {
        await Promise.all(batch.slice(offset, offset + 4).map(async id => {
          try {
            const response = await sdk.listings.show({ id: new types.UUID(id), include: ["images", "author", "author.profileImage"] });
            add({ data: [response.data.data], included: response.data.included || [] });
          } catch { /* Report unavailable sources below. */ }
        }));
      }
    }
  }
  const added = new Map(), issues = [];
  for (const sale of wanted) {
    const listing = sources.get(sale.listingId);
    if (listing && listingPassportId(listing) === sale.passportId) {
      added.set(sale.passportId, listing);
    } else {
      issues.push({ documentId: sale.saleId, passportId: sale.passportId, code: "SALE_LISTING_UNAVAILABLE", message: "The original listing photo and machine details could not be verified. The recorded sale remains available." });
    }
  }
  return { listings: [...existing, ...added.values()], issues };
}
