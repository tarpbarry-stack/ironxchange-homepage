import { createInstance, types } from "sharetribe-flex-integration-sdk";
import { normalizeSharetribeListings } from "../../listings/normalizeSharetribeListings";
import { listingPassportId } from "../../listings/IXISoldInventory.mjs";

// Only IDs supplied by the authorized financial projection are eligible.
// A listing must also match the sale's canonical Passport before it is used.
export async function completeSoldListingSources(sales, existing) {
  const present = new Set(existing.map(listingPassportId));
  const wanted = [...new Map(sales.filter(sale => sale.listingId && !present.has(sale.passportId))
    .map(sale => [sale.listingId, sale])).values()];
  if (!wanted.length) return { listings: existing, issues: [] };
  const sdk = createInstance({ clientId: process.env.SHARETRIBE_CLIENT_ID, clientSecret: process.env.SHARETRIBE_CLIENT_SECRET });
  const added = [], issues = [];
  for (let index = 0; index < wanted.length; index += 4) {
    await Promise.all(wanted.slice(index, index + 4).map(async sale => {
      try {
        const response = await sdk.listings.show({ id: new types.UUID(sale.listingId), include: ["images", "author", "author.profileImage"] });
        const [listing] = normalizeSharetribeListings({ data: [response.data.data], included: response.data.included || [] });
        if (listingPassportId(listing) !== sale.passportId) throw new Error("Listing identity mismatch");
        added.push(listing);
      } catch {
        issues.push({ documentId: sale.saleId, passportId: sale.passportId, code: "SALE_LISTING_UNAVAILABLE", message: "The original listing photo and machine details could not be verified. The recorded sale remains available." });
      }
    }));
  }
  return { listings: [...existing, ...added], issues };
}
