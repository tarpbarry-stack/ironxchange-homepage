import test from "node:test";
import assert from "node:assert/strict";
import { dashboardKey, uniqueMachines, collectRelationships, relationshipIds, restoreDashboard, viewPatch, relationshipPatch, reconcileOpenKeys, filterMachineSearch, verifiedInquiryCount } from "../components/ixi-dashboard/dashboardContract.mjs";
import { filterAosOwnedMachines } from "../lib/listings/IXIAosOwnedInventoryPolicy.mjs";
import { preserveOpenInventoryTransactions, releaseClosedInventoryTransactions } from "../lib/listings/IXIInventorySession.mjs";

const owned = { id: "listing-owner", passportId: "IXI-OWNER", title: "2017 DEERE 544K II", ownershipRole: "owner", serialNumber: "DEERE-123" };
const research = { id: "listing-research", passportId: "IXI-RESEARCH", title: "2018 VOLVO A25G", ownershipRole: "non-owner" };
const saved = { id: "listing-saved", passportId: "IXI-SAVED", title: "2020 CAT 320" };

test("owned and relationship rails remain disjoint across listing aliases", () => {
  const authored = [owned, research];
  const ownerAlias = { ...owned, id: "legacy-owner-alias" };
  assert.deepEqual(collectRelationships({ authored, owned: filterAosOwnedMachines(authored), publicListings: [ownerAlias, saved], ids: [ownerAlias.id, saved.id] }), [research, saved]);
  assert.deepEqual(uniqueMachines([owned, ownerAlias, { title: "no identity" }]), [owned]);
});
test("relationship membership uses explicit saved or marked machines", () => {
  assert.deepEqual(new Set(relationshipIds([saved.id], { marked: { color: "yellow" }, outlined: { outline: 2 }, plain: { color: "none", outline: 1 }, __workspace: { pinned: true }, onlyViewed: { face: 2 } })), new Set([saved.id, "marked", "outlined"]));
});
test("sold and archived equipment never returns through the relationship rail", () => {
  const sold = { ...owned, inventoryLifecycle: { state: "sold" } };
  assert.deepEqual(filterAosOwnedMachines([sold]), []);
  assert.deepEqual(collectRelationships({ authored: [sold, { ...research, listingStatus: "archived" }] }), []);
});
test("dashboard movement and persisted layout cannot write ownership, identity or money", () => {
  const dangerous = { face: 2, transactOpen: true, amount: 82000, ownershipRole: "owner", containerId: "owned", objectId: "other", color: "yellow", actionNotice: "SAVED" };
  assert.deepEqual(viewPatch(dangerous), { face: 2, transactOpen: true });
  assert.deepEqual(relationshipPatch(dangerous), { color: "yellow" });
  const restored = restoreDashboard({ version: 1, open: [dashboardKey(owned), dashboardKey(owned), null], states: { [owned.id]: dangerous }, size: "huge", ownedFilter: "sold", scroll: -3 });
  assert.deepEqual(restored.open, [dashboardKey(owned)]);
  assert.deepEqual(restored.states[owned.id], { face: 2, transactOpen: true });
  assert.equal(restored.size, "fit"); assert.equal(restored.ownedFilter, "all"); assert.equal(restored.scroll, 0);
  assert.equal(restoreDashboard({ version: 999 }), null);
});
test("incomplete hydration preserves the board; complete hydration removes missing machines", () => {
  const keys = [dashboardKey(owned), dashboardKey(saved), dashboardKey(owned)];
  assert.deepEqual(reconcileOpenKeys(keys, [owned], { complete: false }), keys.slice(0, 2));
  assert.deepEqual(reconcileOpenKeys(keys, [owned]), [dashboardKey(owned)]);
});
test("a sold machine can finish its open transaction without remaining owned inventory", () => {
  const state = { [owned.id]: { transactOpen: true } };
  const retained = preserveOpenInventoryTransactions([owned], [], state);
  assert.equal(retained[0].inventorySessionOnly, true);
  assert.deepEqual(retained.filter(item => !item.inventorySessionOnly), []);
  assert.deepEqual(releaseClosedInventoryTransactions(retained, { [owned.id]: { transactOpen: false } }), []);
});
test("machine search supports model, serial and passport; inquiries require a measured total", () => {
  assert.deepEqual(filterMachineSearch([owned, research], "deere 123"), [owned]);
  assert.deepEqual(filterMachineSearch([owned, research], "IXI-RESEARCH"), [research]);
  assert.equal(verifiedInquiryCount({ data: { data: [{ id: "sample" }] } }), null);
  assert.equal(verifiedInquiryCount({ data: { meta: { totalItems: 0 } } }), 0);
  assert.equal(verifiedInquiryCount({ data: { meta: { totalItems: 39 } } }), 39);
});
