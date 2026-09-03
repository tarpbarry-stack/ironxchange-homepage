const { reconcileMarketplace } = require("../../../lib/admin-daddy/AdminDaddyMarketplaceReconciliation");

function clean(value) { return String(value ?? "").trim(); }

function getOrigin(req) {
  const proto = clean(req.headers["x-forwarded-proto"]).split(",")[0] || "https";
  const host = clean(req.headers["x-forwarded-host"]).split(",")[0] || clean(req.headers.host);
  return host ? `${proto}://${host}` : "";
}

function normalizeListing(listing = {}) {
  const publicData = listing.publicData || {};
  const metadata = listing.metadata || {};
  return {
    id: listing.id,
    listingId: listing.id,
    objectId: publicData.objectId || metadata.objectId || "",
    passportId: publicData.passportId || metadata.passportId || "",
    ixiState: listing.listingStatus || publicData.listingStatus || metadata.listingStatus || "live",
    sharetribeState: "published",
    requiresPassport: Boolean(publicData.objectId || metadata.objectId || publicData.passportId || metadata.passportId),
    requiresMedia: true,
    heroImage: listing.imageUrl || listing.image || ""
  };
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ ok:false, error:{ code:"METHOD_NOT_ALLOWED", message:"GET required." } });
  }

  const origin = getOrigin(req);
  if (!origin) return res.status(500).json({ ok:false, error:{ code:"ADMIN_DADDY_ORIGIN_UNAVAILABLE", message:"Marketplace projection could not determine request origin." } });

  try {
    const response = await fetch(`${origin}/api/listings`, { headers:{ Accept:"application/json", Cookie:req.headers.cookie || "" } });
    const payload = await response.json().catch(() => null);
    if (!response.ok || !Array.isArray(payload)) throw new Error(payload?.error || "Marketplace listings projection failed.");
    const records = payload.map(normalizeListing);
    const reconciliation = reconcileMarketplace(records);
    return res.status(200).json({ ok:true, live:true, listings:payload.length, ...reconciliation });
  } catch (error) {
    return res.status(502).json({ ok:false, error:{ code:"ADMIN_DADDY_MARKETPLACE_FAILED", message:error?.message || "Admin Daddy could not load marketplace projection." } });
  }
}
