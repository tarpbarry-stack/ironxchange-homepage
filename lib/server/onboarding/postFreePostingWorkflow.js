const fail = message => { throw Object.assign(new Error(message), { status: 409 }); };
const markerMatches = (listing, operationId) => listing?.attributes?.privateData?.ixiPostFree?.operationId === operationId;
export async function recoverPostFreeListing(sdk, operationId) {
  let page = 1, pages = 1;
  const matches = [];
  do {
    const response = await sdk.ownListings.query({ page, perPage: 100 });
    const data = response?.data;
    if (!Array.isArray(data?.data) || !Number.isInteger(data?.meta?.totalPages)) fail("Cannot verify saved postings. Retry this same posting.");
    matches.push(...data.data.filter(listing => markerMatches(listing, operationId)));
    pages = data.meta.totalPages;
    page++;
  } while (page <= pages);
  if (matches.length > 1) fail("More than one listing has this posting reference. Resolve that conflict before continuing.");
  return matches[0] || null;
}
export async function startPostFreePosting({ sdk, types, core, normalizeListing, input }) {
  const { row, createGranted } = await core("reserve", input);
  let listing;
  if (row.listingId) listing = (await sdk.ownListings.show({ id: new types.UUID(row.listingId) }))?.data?.data;
  else if (createGranted) {
    try {
      listing = (await sdk.ownListings.createDraft({
        title: row.payload.title, description: row.payload.description || "",
        price: new types.Money(row.payload.priceCents, "USD"),
        publicData: { ...row.payload.publicData, listingType: "free-listing", listingStatus: "draft",
          ownershipRole: "owner", ownershipStatus: "owned", machineOrigin: "owner-created",
          transactionProcessAlias: "default-inquiry/release-1", unitType: "inquiry" },
        privateData: { ixiPostFree: { operationId: row.operationId } }
      }, { expand: true }))?.data?.data;
    } catch (error) {
      const statusCode = Number(error.status ?? error.statusCode);
      if ([400,401,403,422,429].includes(statusCode)) await core("create-rejected", { operationId: row.operationId, attemptId: row.attemptId, statusCode });
      throw error;
    }
  } else listing = await recoverPostFreeListing(sdk, row.operationId);
  if (!listing?.id || !markerMatches(listing, row.operationId)) fail("The machine save is still being verified. Resume this same posting; do not create another machine.");
  return core("bind", { operationId: row.operationId, listing: normalizeListing(listing) });
}
export async function finalizePostFreePosting({ sdk, types, core, input }) {
  const { row, manifest, ready } = await core("state", { operationId: input.operationId });
  if (!ready) fail("All selected photos must be durably processed before posting.");
  const id = new types.UUID(row.listingId);
  let listing = (await sdk.ownListings.show({ id }))?.data?.data;
  if (!markerMatches(listing, row.operationId)) fail("Listing does not belong to this posting.");
  const heroImageId = row.heroImageId || listing.attributes?.privateData?.ixiPostFree?.heroImageId || input.heroImageId;
  if (!heroImageId) fail("The compatibility hero is not ready.");
  const ixiMedia = { machineKey: row.passportId, passportId: row.passportId,
    mediaVersion: manifest.mediaVersion, heroMediaId: manifest.heroMediaId,
    manifest: `/api/media/machines/${encodeURIComponent(row.passportId)}` };
  const isPrivate = row.payload.publicData.machineAccess === "private" || row.payload.publicData.machineChannel === "private";
  await sdk.ownListings.update({ id, images: [new types.UUID(heroImageId)],
    publicData: { passportId: row.passportId, passportUrl: `/p/${row.passportId}`, ixiMedia,
      listingStatus: isPrivate ? "private" : "live" },
    privateData: { ixiPostFree: { operationId: row.operationId, heroImageId } } });
  if (!isPrivate && listing.attributes.state === "draft") await sdk.ownListings.publishDraft({ id });
  listing = (await sdk.ownListings.show({ id, include: ["images"] }))?.data?.data;
  const actual = listing?.attributes?.publicData;
  const images = listing?.relationships?.images?.data || [];
  if (!markerMatches(listing, row.operationId) || actual?.passportId !== row.passportId ||
      actual?.ixiMedia?.machineKey !== row.passportId || actual?.ixiMedia?.heroMediaId !== manifest.heroMediaId ||
      images.length !== 1 || images[0]?.id?.uuid !== heroImageId ||
      (!isPrivate && !["published", "pendingApproval"].includes(listing.attributes.state)) ||
      (isPrivate && listing.attributes.state !== "draft")) fail("Saved listing readback is incomplete. Resume the same posting.");
  const result = await core("finish", { operationId: row.operationId, listingId: row.listingId, heroImageId });
  return { ...result, listingState: listing.attributes.state };
}
