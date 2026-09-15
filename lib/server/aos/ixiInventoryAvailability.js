import { requestIxCoreMos } from "./ixiMosInternalClient";
import { listingPassportId } from "../../listings/IXISoldInventory.mjs";

export async function loadInventoryAvailability(authorId) {
  try {
    const result = await requestIxCoreMos({ path: "/aos/inventory-availability", principalId: String(authorId) });
    if (!result?.ok) throw new Error("Inventory availability could not be verified.");
    return result.current || {};
  } catch (error) {
    // An author who has never opened AOS has no AOS financial disposition.
    if (Number(error.status) === 404) return {};
    throw error;
  }
}
export async function filterPublicInventory(listings) {
  const byAuthor = new Map();
  for (const listing of listings) {
    const author = String(listing.authorId || listing.author?.id?.uuid || listing.author?.id || "");
    if (!byAuthor.has(author)) byAuthor.set(author, []);
    byAuthor.get(author).push(listing);
  }
  const availability = new Map();
  const authors = [...byAuthor.keys()].filter(Boolean);
  // Bound concurrent upstream requests; never request financial details per card.
  for (let index = 0; index < authors.length; index += 4) {
    await Promise.all(authors.slice(index, index + 4).map(async author => availability.set(author, await loadInventoryAvailability(author))));
  }
  return listings.filter(listing => {
    const author = String(listing.authorId || listing.author?.id?.uuid || listing.author?.id || "");
    const state = availability.get(author)?.[listingPassportId(listing)];
    return state?.state !== "sold" && state?.forcePrivate !== true;
  });
}
