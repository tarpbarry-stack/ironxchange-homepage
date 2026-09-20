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
    const startedAt = Date.now();
    const session = await resolveAosBrowserSession(req, res);
    const sessionAt = Date.now();
    const context = await resolveExistingIxCoreAosContext({ session });
    const contextAt = Date.now();
    // Start independent reads together. Waiting for sale IDs before starting
    // source loading adds the full catalogue round trip to the first paint.
    // This runs once per snapshot, never for date/sort/page changes.
    const [inventory, raw] = await Promise.all([
      requestIxCoreFinancial({ path: "/financial/inventory?all=1", principalId: session.userId, entityId: context.entityId }),
      fetchSharetribeListingsByAuthor(session.userId).catch(() => null)
    ]);
    if (!inventory?.ok) return res.status(502).json(inventory);
    const inventoryAt = Date.now();
    const existing = raw ? normalizeSharetribeListings(raw) : [];
    const sources = await completeSoldListingSources(inventory.data.sales, existing);
    const listings = soldListingsFromProjection(inventory.data.sales, sources.listings);
    console.info("SOLD inventory timing", { sessionMs: sessionAt - startedAt, contextMs: contextAt - sessionAt,
      inventoryMs: inventoryAt - contextAt, sourcesMs: Date.now() - inventoryAt, totalMs: Date.now() - startedAt, sales: listings.length });
    return res.json({ ok: true, ...(req.query.snapshot === "1" ? { listings } : querySoldListings(listings, req.query)), issues: [...inventory.data.issues, ...sources.issues],
      entityPassportId: inventory.data.entityPassportId, entityLabel: context.entity?.displayName || "" });
  } catch (error) { return res.status(error.status || 502).json({ ok: false, error: error.message || "SOLD inventory could not be loaded." }); }
}
