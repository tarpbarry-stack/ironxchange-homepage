import test from "node:test";
import assert from "node:assert/strict";
import { runPostFreePosting, describePostingFile } from "../lib/post-free/postFreeDurableClient.mjs";
import fs from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { transformSync } = require("next/dist/build/swc");
const module = { exports: {} };
const filename = new URL("../lib/server/onboarding/postFreePostingWorkflow.js", import.meta.url).pathname;
new Function("module", "exports", transformSync(fs.readFileSync(filename, "utf8"), { filename, jsc: { parser: { syntax: "ecmascript" }, target: "es2022" }, module: { type: "commonjs" } }).code)(module, module.exports);
const { startPostFreePosting, finalizePostFreePosting } = module.exports;
const types = { UUID: class { constructor(uuid) { this.uuid = uuid; } }, Money: class { constructor(amount, currency) { Object.assign(this, { amount, currency }); } } };

test("lost listing-create response is recovered by owner marker without another create", async () => {
  let creates = 0, listing;
  const row = { operationId: "operation-one", payload: { title: "Machine", priceCents: 12300, publicData: {} } };
  const sdk = { ownListings: {
    createDraft: async data => { creates++; listing = { id: { uuid: "saved-listing" }, attributes: data }; throw new Error("lost response"); },
    query: async () => ({ data: { data: [listing], meta: { totalPages: 1 } } })
  } };
  const core = async (action, input) => action === "reserve" ? { row, createGranted: creates === 0 } : { row: { ...row, listingId: input.listing.listingId } };
  const options = { sdk, types, core, input: {}, normalizeListing: listing => ({ listingId: listing.id.uuid }) };
  await assert.rejects(startPostFreePosting(options), /lost response/);
  assert.equal((await startPostFreePosting(options)).row.listingId, "saved-listing");
  assert.equal(creates, 1);
});

test("refresh and second-session recovery skip saved originals and never publish until all media is ready", async () => {
  const originals = [new File(["photo-a"], "a.jpg", { type: "image/jpeg" }), new File(["photo-b"], "b.jpg", { type: "image/jpeg" })];
  const files = await Promise.all(originals.map(describePostingFile));
  const row = { operationId: "operation-two", listingId: "listing-two", passportId: "PASS2", files };
  const cache = new Map();
  const filesStore = async (id, value) => { if (value === undefined) return cache.get(id); if (value === null) cache.delete(id); else cache.set(id, value); };
  const uploaded = new Set(), transferred = [], actions = [];
  let ready = false, fail = true;
  const request = async (action, input) => {
    actions.push(action);
    if (action === "start" || action === "resume") return { row };
    if (action === "state") return { row: { ...row, heroImageId: "hero-receipt" }, ready,
      job: ready ? { status: "complete" } : null,
      manifest: ready ? { heroMediaId: "hero", media: [{ mediaId: "hero", hero: { url: "https://media.example/hero.webp" } }] } : null };
    if (action === "prepare") return { uploaded: uploaded.has(input.photoId), upload: { photoId: input.photoId } };
    if (action === "process") { assert.equal(uploaded.size, 2); ready = true; return {}; }
    if (action === "finalize") { assert.equal(ready, true); return { row: { ...row, status: "complete" } }; }
    throw new Error(action);
  };
  const put = async (upload, file, progress) => {
    transferred.push(file.name);
    if (file.name === "b.jpg" && fail) throw new Error("network failed");
    progress(file.size); uploaded.add(upload.photoId);
  };
  const options = { operationId: row.operationId, storageScope: "entity:owner", payload: {}, photos: originals.map(file => ({ file })), request, filesStore, put, sdk: { images: { upload: () => assert.fail("A saved hero must not upload again") } } };
  await assert.rejects(runPostFreePosting(options), /network failed/);
  assert.equal(actions.includes("finalize"), false);
  cache.clear(); // Another device has no local file cache.
  await assert.rejects(runPostFreePosting({ ...options, photos: [], resume: true }), /Reselect b.jpg/);
  fail = false;
  const result = await runPostFreePosting({ ...options, photos: [{ file: originals[1] }], resume: true });
  assert.equal(result.listingId, "listing-two");
  assert.equal(transferred.filter(name => name === "a.jpg").length, 1);
  assert.equal(result.status, "complete");
});

test("finalization preserves private visibility, sends one hero and verifies persisted references", async () => {
  const row = { operationId: "op3", listingId: "listing3", passportId: "PASS3", files: [{}, {}], payload: { publicData: { machineAccess: "private" } } };
  const manifest = { heroMediaId: "media3", mediaVersion: 1 };
  let listing = { id: { uuid: row.listingId }, attributes: { state: "draft", privateData: { ixiPostFree: { operationId: row.operationId } } } };
  let finished = false;
  const sdk = { ownListings: {
    show: async () => ({ data: { data: listing } }),
    update: async input => { listing = { ...listing, attributes: { ...listing.attributes, publicData: input.publicData, privateData: input.privateData }, relationships: { images: { data: input.images.map(id => ({ id })) } } }; },
    publishDraft: async () => assert.fail("Private machine must not publish")
  } };
  const core = async action => action === "state" ? { row, manifest, ready: true } : (finished = true, { row });
  await finalizePostFreePosting({ sdk, types, core, input: { operationId: row.operationId, heroImageId: "hero3" } });
  assert.equal(finished, true);
  assert.equal(listing.relationships.images.data.length, 1);
  assert.equal(listing.attributes.publicData.ixiMedia.machineKey, "PASS3");
});
