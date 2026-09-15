import { resolveAosBrowserSession } from "../../lib/server/aos/resolveAosBrowserSession";
import { resolveExistingIxCoreAosContext, requestIxCoreFinancial } from "../../lib/server/aos/ixiMosInternalClient";
import { fetchSharetribeListingsByAuthor } from "../../lib/listings/fetchSharetribeListingsByAuthor";
import { normalizeSharetribeListings } from "../../lib/listings/normalizeSharetribeListings";
import { soldListingsFromProjection, querySoldListings } from "../../lib/listings/IXISoldInventory.mjs";
import { completeSoldListingSources } from "../../lib/server/aos/ixiSoldListingSources";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "private, no-store");
  if (req.method !== "GET") return res.status(405).json({ ok: false, error: "GET required." });
  try {
    const session = await resolveAosBrowserSession(req, res);
    const context = await resolveExistingIxCoreAosContext({ session });
    const [inventory, raw] = await Promise.all([
      requestIxCoreFinancial({ path: "/financial/inventory?all=1", principalId: session.userId, entityId: context.entityId }),
      fetchSharetribeListingsByAuthor(session.userId)
    ]);
    if (!inventory?.ok) return res.status(502).json(inventory);
    const sources = await completeSoldListingSources(inventory.data.sales, normalizeSharetribeListings(raw));
    const listings = soldListingsFromProjection(inventory.data.sales, sources.listings);
    return res.json({ ok: true, ...querySoldListings(listings, req.query), issues: [...inventory.data.issues, ...sources.issues],
      entityPassportId: inventory.data.entityPassportId, entityLabel: context.entity?.displayName || "" });
  } catch (error) { return res.status(error.status || 502).json({ ok: false, error: error.message || "SOLD inventory could not be loaded." }); }
}
