import assert from "node:assert/strict";
import test from "node:test";
import { uploadPostFreePhotos } from "../lib/post-free/postFreePhotoUpload.mjs";

const file = name => ({ name, size: 1024 });
const response = name => ({ data: { data: { id: { uuid: name } } } });
const tick = () => new Promise(resolve => setImmediate(resolve));

test("uploads two at a time, reports progress, and preserves hero/order despite reverse completion", async () => {
  const files = [file("hero"), file("second"), file("third")];
  const pending = new Map(), reports = [];
  const sdk = { images: { upload: ({ image }, query, options) => {
    options.onUploadProgress({ loaded: 512 });
    return new Promise(resolve => pending.set(image.name, () => resolve(response(image.name))));
  } } };
  const promise = uploadPostFreePhotos({ sdk, files, cache: new Map(), onProgress: p => reports.push(p) });
  await tick();
  assert.deepEqual([...pending.keys()], ["hero", "second"]);
  pending.get("second")();
  await tick();
  assert.ok(pending.has("third"));
  pending.get("third")();
  pending.get("hero")();
  assert.deepEqual((await promise).map(id => id.uuid), ["hero", "second", "third"]);
  assert.equal(reports.at(-1).completed, 3);
  assert.equal(reports.at(-1).loaded, 3072);
});

test("a partial failure stops the queue and retry reuses completed photos", async () => {
  const files = [file("hero"), file("retry"), file("last")];
  const cache = new Map(), calls = [];
  let fail = true;
  const sdk = { images: { upload: async ({ image }) => {
    calls.push(image.name);
    if (image.name === "retry" && fail) throw new Error("offline");
    return response(image.name);
  } } };
  await assert.rejects(uploadPostFreePhotos({ sdk, files, cache }), /offline/);
  fail = false;
  const ids = await uploadPostFreePhotos({ sdk, files, cache });
  assert.equal(calls.filter(name => name === "hero").length, 1);
  assert.deepEqual(ids.map(id => id.uuid), ["hero", "retry", "last"]);
});

test("a timed out upload cannot hang the UI and retry waits for the same pending request", async () => {
  const files = [file("slow")], cache = new Map();
  let resolveUpload, calls = 0;
  const sdk = { images: { upload: () => {
    calls++;
    return new Promise(resolve => { resolveUpload = resolve; });
  } } };
  await assert.rejects(uploadPostFreePhotos({ sdk, files, cache, timeoutMs: 10 }),
    { code: "POST_FREE_PHOTO_UPLOAD_TIMEOUT" });
  const retry = uploadPostFreePhotos({ sdk, files, cache });
  resolveUpload(response("slow"));
  assert.equal((await retry)[0].uuid, "slow");
  assert.equal(calls, 1);
});

test("a replaced treatment uploads new bytes; missing IDs never pass as success", async () => {
  const cache = new Map();
  const sdk = { images: { upload: async () => ({}) } };
  const original = file("same-name"), edited = file("same-name");
  await assert.rejects(uploadPostFreePhotos({ sdk, files: [original], cache }), /no image ID/);
  assert.equal(cache.size, 0);
  let calls = 0;
  sdk.images.upload = async () => response(String(++calls));
  await uploadPostFreePhotos({ sdk, files: [original], cache });
  await uploadPostFreePhotos({ sdk, files: [edited], cache });
  assert.equal(calls, 2);
});

// Execute the real photo pipeline with browser primitives replaced by tiny
// deterministic images; count renders to enforce the preparation budget.
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { transformSync } = require("next/dist/build/swc");
function loadPipeline(filename, modules = new Map()) {
  if (modules.has(filename)) return modules.get(filename).exports;
  const module = { exports: {} };
  modules.set(filename, module);
  const compiled = transformSync(fs.readFileSync(filename, "utf8"), {
    filename, jsc: { parser: { syntax: "ecmascript" }, target: "es2022" }, module: { type: "commonjs" }
  });
  new Function("require", "module", "exports", compiled.code)(name =>
    name.startsWith(".") ? loadPipeline(path.resolve(path.dirname(filename), `${name}.js`), modules) : require(name),
  module, module.exports);
  return module.exports;
}

test("Original preserves exact bytes without decoding or rendering; Clean and POP render only once", async () => {
  const saved = new Map(["Image", "document"].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  let decodes = 0, renders = 0;
  globalThis.Image = class {
    width = 2; height = 2;
    set src(value) { decodes++; queueMicrotask(() => this.onload()); }
  };
  globalThis.document = { createElement: () => {
    const canvas = { toBlob: done => { renders++; done(new Blob(["edited"], { type: "image/jpeg" })); } };
    canvas.getContext = () => ({ canvas, drawImage() {}, save() {}, restore() {},
      getImageData: () => ({ data: new Uint8ClampedArray(16) }), putImageData() {} });
    return canvas;
  } };
  const urls = new Set();
  try {
    const { prepareIXPhoto } = loadPipeline(new URL("../lib/ixvision/pipeline/processIXPhoto.js", import.meta.url).pathname);
    const original = new File(["original bytes"], "machine.jpg", { type: "image/jpeg" });
    for (const mode of ["original", "clean", "dealerPop"]) {
      const before = renders;
      const item = await prepareIXPhoto(original, { mode, companyName: "IronXchange", make: "CATERPILLAR" });
      urls.add(item.url); urls.add(item.originalUrl);
      assert.equal(item.activeMode, mode);
      assert.equal(item.originalFile, original);
      assert.equal(renders - before, mode === "original" ? 0 : 1);
      if (mode === "original") {
        assert.equal(item.file, original);
        assert.equal(decodes, 0);
      } else {
        assert.equal(item.file, item[`${mode}File`]);
        assert.equal(await item.file.text(), "edited");
      }
    }
    assert.equal(decodes, 2);
  } finally {
    for (const url of urls) URL.revokeObjectURL(url);
    for (const [key, descriptor] of saved) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  }
});
