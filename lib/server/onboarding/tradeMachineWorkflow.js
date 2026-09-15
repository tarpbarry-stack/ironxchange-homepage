const clean = (value) => String(value ?? "").trim();
const fail = (message) => {
  throw Object.assign(new Error(message), { status: 409 });
};
const markerMatches = (listing, row) =>
  listing?.attributes?.privateData?.ixiTrade?.tradeId === row.tradeId &&
  listing?.attributes?.privateData?.ixiTrade?.dealId === row.dealId;

// A reserved create is never blindly replayed: Sharetribe does not provide a
// creation idempotency key. Search the authenticated owner's persisted marker.
async function findOwnListings(sdk, predicate) {
  const matches = [];
  let page = 1,
    pages = 1;
  do {
    const response = await sdk.ownListings.query({ page, perPage: 100 });
    const data = response?.data;
    if (!Array.isArray(data?.data) || !Number.isInteger(data?.meta?.totalPages))
      fail("Could not verify the complete machine list. Retry recovery.");
    matches.push(...data.data.filter(predicate));
    pages = data.meta.totalPages;
    page += 1;
  } while (page <= pages);
  return matches;
}

export async function recoverTradeListing(sdk, row) {
  const matches = await findOwnListings(sdk, (item) =>
    markerMatches(item, row),
  );
  if (matches.length > 1)
    fail(
      "More than one listing has this trade reference. Resolve the duplicate before proceeding.",
    );
  return matches[0] || null;
}

export async function saveTradeMachine({
  sdk,
  types,
  core,
  normalizeListing,
  input,
}) {
  // Detect an existing physical machine before reserving a new create.
  if (!input.existingListingId && input.machine?.serialNumber) {
    const serial = clean(input.machine.serialNumber).toUpperCase();
    const existing = await findOwnListings(
      sdk,
      (item) =>
        clean(item.attributes?.publicData?.serialNumber).toUpperCase() ===
          serial && !markerMatches(item, input),
    );
    if (existing.length)
      fail(
        "This serial is already in your machines. Use Select Existing to link its current card and Passport.",
      );
  }
  const reserved = await core("reserve", input);
  const row = reserved.row;
  let resource;
  if (row.listingId) {
    resource = (
      await sdk.ownListings.show({ id: new types.UUID(row.listingId) })
    )?.data?.data;
  } else if (reserved.createGranted) {
    const machine = row.machine;
    // Draft state is a Sharetribe access boundary, not merely a UI filter.
    let response;
    try {
      response = await sdk.ownListings.createDraft(
        {
          title: `${machine.year} ${machine.make} ${machine.model}`,
          publicData: {
            ...machine,
            city: machine.location,
            hours: Number(machine.hours),
            listingType: "free-listing",
            listingStatus: "draft",
            machineAccess: "private",
            machineChannel: "private",
            machineOrigin: "trade-in",
            ownershipRole: "prospective-owner",
            ownershipStatus: "pending",
            workflowStatus: "pending-trade",
            transactionProcessAlias: "default-inquiry/release-1",
            unitType: "inquiry",
          },
          privateData: {
            ixiTrade: { tradeId: row.tradeId, dealId: row.dealId },
          },
        },
        { expand: true },
      );
    } catch (error) {
      // A definite SDK rejection is safe to retry; a lost response is not.
      const statusCode = Number(error.status ?? error.statusCode);
      if ([400, 401, 403, 422, 429].includes(statusCode))
        await core("create-rejected", {
          ...input,
          attemptId: row.attemptId,
          statusCode,
        });
      throw error;
    }
    resource = response?.data?.data;
  } else {
    resource = await recoverTradeListing(sdk, row);
    if (!resource)
      fail(
        "The trade save is still being verified. Retry this same trade; do not create another machine.",
      );
  }
  if (!resource?.id)
    fail(
      "Sharetribe did not return a saved machine. Retry this trade to recover it.",
    );
  if (!row.existingListingId && !markerMatches(resource, row))
    fail("The saved listing does not match this trade.");
  if (resource.attributes?.publicData?.passportId === input.outgoingPassportId)
    fail("A machine cannot be traded for itself.");
  const listing = normalizeListing(resource);
  const completed = await core("complete", { ...input, listing });
  await sdk.ownListings.update({
    id: new types.UUID(listing.listingId),
    publicData: {
      passportId: completed.row.passportId,
      passportUrl: `/p/${completed.row.passportId}`,
    },
  });
  return completed;
}

export async function finalizeTradeInventory({
  sdk,
  types,
  core,
  normalizeListing,
  input,
}) {
  // The server verifies the actual financial document before ownership changes.
  const verified = await core("acquired", input);
  const row = verified.row;
  await sdk.ownListings.update({
    id: new types.UUID(row.listingId),
    publicData: {
      ownershipRole: "owner",
      ownershipStatus: "owned",
      workflowStatus: "private",
      machineAccess: "private",
      machineChannel: "private",
    },
  });
  const resource = (
    await sdk.ownListings.show({ id: new types.UUID(row.listingId) })
  )?.data?.data;
  return core("complete", { ...input, listing: normalizeListing(resource) });
}
