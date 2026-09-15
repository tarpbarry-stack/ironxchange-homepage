const clean = value => String(value ?? "").trim();
export function listingPassportId(listing = {}) {
  const data = listing.publicData || listing.attributes?.publicData || {};
  return clean(listing.canonicalIdentity?.passportId || listing.passportId || data.passportId || listing.ixiMedia?.passportId || data.ixiMedia?.passportId);
}
export function inventoryStateOf(listing = {}) {
  return clean(listing.inventoryLifecycle?.state || listing.publicData?.inventoryLifecycle?.state);
}
export function applyInventoryProjection(listings = [], current = {}, { includeSold = false } = {}) {
  return listings.map(listing => {
    const state = current[listingPassportId(listing)];
    if (!state) return listing;
    const publicData = listing.publicData || listing.attributes?.publicData || {};
    return { ...listing, inventoryLifecycle: state,
      ...(state.forcePrivate ? { machineAccess: "private", machineChannel: "marketplace" } : {}),
      publicData: { ...publicData, inventoryLifecycle: state, ...(state.forcePrivate ? { machineAccess: "private", machineChannel: "marketplace" } : {}) } };
  }).filter(listing => includeSold || inventoryStateOf(listing) !== "sold");
}
export function soldListingsFromProjection(sales = [], listings = []) {
  const byPassport = new Map(listings.map(listing => [listingPassportId(listing), listing]));
  return sales.map(sale => {
    const source = byPassport.get(sale.passportId) || {};
    const data = source.publicData || source.attributes?.publicData || {};
    return { ...source, id: `sold:${sale.saleId}`, sourceListingId: clean(source.id?.uuid || source.id || sale.listingId),
      passportId: sale.passportId, objectId: source.objectId || sale.objectId,
      title: source.title || sale.label, price: sale.salePrice == null ? "" : String(sale.salePrice),
      machineAccess: "private", machineChannel: "marketplace", soldSummary: sale,
      inventoryLifecycle: { state: "sold", passportId: sale.passportId, entityPassportId: sale.entityPassportId },
      publicData: { ...data, passportId: sale.passportId, machineAccess: "private", machineChannel: "marketplace" } };
  });
}
export function querySoldListings(listings, query = {}) {
  const search = clean(query.q).toLowerCase();
  const numeric = value => {
    const digits = clean(value).replace(/[^0-9.-]/g, "");
    return /[0-9]/.test(digits) ? Number(digits) : null;
  };
  const range = (value, min, max) => (!clean(min) && !clean(max)) || (numeric(value) !== null && Number.isFinite(numeric(value)) && (!clean(min) || numeric(value) >= Number(min)) && (!clean(max) || numeric(value) <= Number(max)));
  let filtered = listings.filter(listing => {
    const sale = listing.soldSummary, data = listing.publicData || {};
    return (!search || [listing.title, listing.make, listing.model, listing.serialNumber, listing.stockNumber,
      data.serialNumber, sale.passportId, sale.buyerLabel, sale.soldByLabel, sale.invoiceNumber].some(value => clean(value).toLowerCase().includes(search))) &&
      (!query.from || sale.saleDate >= query.from) && (!query.to || sale.saleDate <= query.to) &&
      (!query.settlement || query.settlement === "all" || sale.settlementStatus === query.settlement) &&
      (!query.status || query.status === "all" || sale.status === query.status) &&
      (!query.category || query.category === "ALL CATEGORIES" || clean(listing.type || listing.category || data.category).toLowerCase() === clean(query.category).toLowerCase()) &&
      (!query.make || query.make === "ALL MAKES" || clean(listing.make || data.make).toLowerCase() === clean(query.make).toLowerCase()) &&
      (!query.model || query.model === "ALL MODELS" || clean(listing.model || data.model).toLowerCase() === clean(query.model).toLowerCase()) &&
      range(listing.year || data.year, query.yearMin, query.yearMax) && range(sale.salePrice, query.priceMin, query.priceMax) &&
      range(listing.hours || data.hours, query.hoursMin, query.hoursMax);
  });
  const sort = clean(query.sort || "date-desc");
  filtered.sort((a, b) => {
    const sa = a.soldSummary, sb = b.soldSummary;
    const compare = sort.startsWith("price") ? (sa.salePrice ?? -Infinity) - (sb.salePrice ?? -Infinity)
      : sort.startsWith("buyer") ? sa.buyerLabel.localeCompare(sb.buyerLabel)
      : sort.startsWith("seller") ? sa.soldByLabel.localeCompare(sb.soldByLabel)
      : sort.startsWith("year") ? Number(a.year || a.publicData?.year || 0) - Number(b.year || b.publicData?.year || 0)
      : sort.startsWith("make") ? clean(a.make).localeCompare(clean(b.make)) || clean(a.model).localeCompare(clean(b.model))
      : sa.saleDate.localeCompare(sb.saleDate);
    return (sort.endsWith("-desc") ? -compare : compare) || sa.saleId.localeCompare(sb.saleId);
  });
  const total = filtered.length, pageSize = Math.min(100, Math.max(1, Number.parseInt(query.pageSize, 10) || 24));
  const page = Math.min(Math.max(1, Math.ceil(total / pageSize)), Math.max(1, Number.parseInt(query.page, 10) || 1));
  return { listings: filtered.slice((page - 1) * pageSize, page * pageSize), total, page, pageSize,
    filterListings: listings.map(item => ({ type: item.type || item.category || item.publicData?.category || "", make: item.make || item.publicData?.make || "", model: item.model || item.publicData?.model || "" })),
    makes: [...new Set(listings.map(item => clean(item.make || item.publicData?.make)).filter(Boolean))].sort() };
}

// A page/filter is only a view of the workspace. Moving visible cards must
// retain placements belonging to every other page.
export function mergeSoldWorkspacePage(saved = {}, visible = {}, visibleIds = []) {
  const replacing = new Set(visibleIds.map(String));
  const keys = [...new Set([...Object.keys(saved), ...Object.keys(visible)])];
  const seen = new Set();
  return Object.fromEntries(keys.map(key => [key, [
    ...(saved[key] || []).filter(id => !replacing.has(String(id))),
    ...(visible[key] || []).filter(id => replacing.has(String(id))),
  ].map(String).filter(id => !seen.has(id) && seen.add(id))]));
}
