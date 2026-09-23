import assert from "node:assert/strict";
import test from "node:test";
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
