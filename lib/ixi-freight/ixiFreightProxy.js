const { mutationOriginIsValid } = require("../ixi-authority/ixiAuthorityProxy");

const clean = value => String(value ?? "").trim();

function safeObject(value) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? { ...value }
    : {};
}

function isCanonicalMosObjectId(value) {
  return /^object_[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu
    .test(clean(value));
}

function listingIdOf(listing = {}) {
  return clean(listing?.id?.uuid || listing?.id);
}

function listingPassportIdOf(listing = {}) {
  const publicData = listing?.attributes?.publicData || listing?.publicData || {};
  return clean(
    publicData.passportId ||
    listing?.passportId ||
    listing?.ixiMedia?.passportId ||
    publicData?.ixiMedia?.passportId
  );
}

async function authorizePassportFirstAsset({ userId, body, loadListings = null }) {
  const next = safeObject(body);
  const asset = safeObject(next.asset);
  const passportId = clean(asset.passportId);

  if (!passportId) {
    const error = new Error("Machine IXI Passport is required for Freight.");
    error.code = "PASSPORT_REQUIRED";
    error.status = 400;
    throw error;
  }

  /*
   * A client may carry a genuine MOS Object ID as a compatibility hint.
   * Any other value (including a Sharetribe UUID) is discarded and can
   * never cross the trusted gateway as an Object ID.
   */
  if (isCanonicalMosObjectId(asset.objectId)) {
    return {
      ...next,
      asset: {
        ...asset,
        objectId: clean(asset.objectId),
        source: undefined
      }
    };
  }

  let listingsPayload;
  if (typeof loadListings === "function") {
    listingsPayload = await loadListings(userId);
  } else {
    const { fetchSharetribeListingsByAuthor } = await import(
      "../listings/fetchSharetribeListingsByAuthor"
    );
    listingsPayload = await fetchSharetribeListingsByAuthor(userId);
  }
  const listings = Array.isArray(listingsPayload?.data)
    ? listingsPayload.data
    : [];
  const ownedListing = listings.find(listing =>
    listingPassportIdOf(listing) === passportId
  );

  if (!ownedListing) {
    const error = new Error(
      "Authenticated user does not own a Sharetribe listing for this machine Passport."
    );
    error.code = "FREIGHT_ASSET_OWNERSHIP_UNVERIFIED";
    error.status = 403;
    error.details = { passportId };
    throw error;
  }

  const sourceId = listingIdOf(ownedListing);
  if (!sourceId) {
    const error = new Error("Owned machine listing returned without a source identity.");
    error.code = "FREIGHT_ASSET_SOURCE_UNAVAILABLE";
    error.status = 502;
    throw error;
  }

  return {
    ...next,
    asset: {
      ...asset,
      objectId: "",
      source: {
        sourceType: "sharetribe-listing",
        sourceId,
        verified: true
      }
    }
  };
}

async function proxyIXIFreightRequest({ req, res, path = "", method = "GET", body, timeoutMs = 20000 }) {
  if (!mutationOriginIsValid(req)) {
    return res.status(403).json({ ok:false, error:{ code:"IXI_FREIGHT_ORIGIN_DENIED", message:"Cross-origin IXI Freight mutation denied." } });
  }

  const suffix = clean(path).replace(/^\/+/, "");
  if (suffix.includes("..")) {
    return res.status(400).json({ ok:false, error:{ code:"IXI_FREIGHT_PATH_INVALID", message:"IXI Freight path is invalid." } });
  }

  try {
    const [sessionModule, clientModule] = await Promise.all([
      import("../server/aos/resolveAosBrowserSession"),
      import("../server/aos/ixiMosInternalClient")
    ]);
    const session = await sessionModule.resolveAosBrowserSession(req, res);
    const context = await clientModule.resolveIxCoreAosContext({ session });
    const trustedBody =
      clean(path).replace(/^\/+/, "") === "orders" && clean(method).toUpperCase() === "POST"
        ? await authorizePassportFirstAsset({ userId: session.userId, body })
        : body;
    const payload = await Promise.race([
      clientModule.requestIxCoreFreight({
        path: suffix,
        method,
        body: trustedBody === undefined ? null : trustedBody,
        principalId: session.userId,
        entityId: context.entityId
      }),
      new Promise((_, reject) => setTimeout(() => {
        const error = new Error("IXI Freight service timed out.");
        error.code = "IXI_FREIGHT_UPSTREAM_TIMEOUT";
        error.status = 502;
        reject(error);
      }, timeoutMs))
    ]);
    res.setHeader("Cache-Control", "no-store, private");
    return res.status(200).json(payload);
  } catch (error) {
    const status = Number(error?.status || 502);
    return res.status(status >= 400 && status <= 599 ? status : 502).json({
      ok:false,
      error:{ code:clean(error?.code)||"IXI_FREIGHT_UPSTREAM_UNAVAILABLE", message:clean(error?.message)||"IXI Freight service is unavailable.", details:error?.details||null }
    });
  }
}

module.exports = {
  proxyIXIFreightRequest,
  isCanonicalMosObjectId,
  listingPassportIdOf,
  authorizePassportFirstAsset
};
