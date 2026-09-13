import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const coreRoot = process.env.IXI_CORE_CONTRACT_ROOT;

test("payment date typing, calendar navigation and focus agree before a payment is saved", {
  skip: coreRoot ? false : "Run the required paired gate with IXI_CORE_CONTRACT_ROOT."
}, async t => {
  const require = createRequire(import.meta.url);
  const coreRequire = createRequire(path.join(path.resolve(coreRoot), "package.json"));
  const { JSDOM } = coreRequire("jsdom");
  const dom = new JSDOM('<div id="root"></div>', { url: "https://payment-date-test.invalid/" });
  const w = dom.window, d = w.document;
  const previous = new Map();
  for (const [key, value] of Object.entries({ window: w, document: d, navigator: w.navigator, IS_REACT_ACT_ENVIRONMENT: true })) {
    previous.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, { value, configurable: true, writable: true });
  }
  const React = require("react");
  const { createRoot } = require("react-dom/client");
  const { transformSync } = require("next/dist/build/swc");
  const source = fileURLToPath(new URL("../components/ixi-aos/transact/payments/IXIPaymentDateInput.jsx", import.meta.url));
  const compiled = transformSync(fs.readFileSync(source, "utf8"), {
    filename: source,
    jsc: { parser: { syntax: "ecmascript", jsx: true }, target: "es2022", transform: { react: { runtime: "automatic" } } },
    module: { type: "commonjs" }
  });
  const module = { exports: {} }, sourceRequire = createRequire(source);
  // Only CSS is stubbed. Render the actual component and date parser with React.
  new Function("require", "module", "exports", compiled.code)(
    name => name.endsWith(".module.css") ? {} : sourceRequire(name), module, module.exports
  );
  const DateInput = module.exports.default;
  let paidDate = "2026-03-05", submits = 0;
  function Harness() {
    const [value, setValue] = React.useState(paidDate);
    const [dirty, setDirty] = React.useState(false);
    return React.createElement("form", {
      "data-dirty": dirty,
      onInputCapture: () => setDirty(true),
      onSubmit: event => { event.preventDefault(); submits++; }
    }, React.createElement(DateInput, {
      value, label: "PAYMENT DATE", onValueChange: next => { paidDate = next; setValue(next); }
    }));
  }
  const root = createRoot(d.getElementById("root"));
  t.after(async () => {
    await React.act(() => root.unmount());
    dom.window.close();
    for (const [key, descriptor] of previous) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  });
  const act = action => React.act(action);
  const input = () => d.querySelector('[aria-label="PAYMENT DATE"]');
  const setInput = (element, value) => act(() => {
    Object.getOwnPropertyDescriptor(w.HTMLInputElement.prototype, "value").set.call(element, value);
    element.dispatchEvent(new w.InputEvent("input", { bubbles: true, inputType: "insertText" }));
  });
  async function typeDate(text) {
    const element = input();
    await act(() => element.focus());
    await setInput(element, "");
    for (const character of text) {
      await setInput(element, element.value + character);
      assert.equal(d.activeElement, element, "Every keystroke must retain focus");
    }
    assert.equal(element.value, text, "The complete typed text must remain intact");
  }
  await act(() => root.render(React.createElement(Harness)));
  await act(() => d.querySelector('[aria-label="Open payment date calendar"]').click());
  await typeDate("2/4/2026");
  assert.equal(paidDate, "2026-02-04");
  assert.ok(d.querySelector('[aria-label="February 4, 2026"]'), "Typing while the calendar is open must move its month");
  await act(() => input().blur());
  assert.equal(input().value, "02/04/2026");

  await act(() => {
    const month = d.querySelector('[aria-label="Calendar month"]');
    month.value = "1";
    month.dispatchEvent(new w.Event("change", { bubbles: true }));
  });
  await setInput(d.querySelector('[aria-label="Calendar year"]'), "2024");
  await act(() => d.querySelector('[aria-label="February 29, 2024"]').click());
  assert.equal(paidDate, "2024-02-29");
  assert.equal(input().value, "02/29/2024");
  assert.equal(d.activeElement, input(), "Calendar selection must restore input focus without restoring the old date");

  await typeDate("03052026");
  await act(() => input().dispatchEvent(new w.KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true })));
  assert.equal(input().value, "03/05/2026");
  assert.equal(paidDate, "2026-03-05");
  assert.equal(submits, 0, "Enter in the date field must not submit a payment");
  await typeDate("2/30/2026");
  await act(() => input().blur());
  assert.equal(input().getAttribute("aria-invalid"), "true");
  assert.equal(input().validity.valid, false);
  assert.match(d.body.textContent, /complete, valid date/);
  await typeDate("2/4/2026");
  await act(() => input().blur());
  assert.equal(input().validity.valid, true);
  await act(() => d.querySelector('[aria-label="Open payment date calendar"]').click());
  assert.equal(d.querySelector('[aria-label="February 4, 2026"]').getAttribute("aria-pressed"), "true");
  await act(() => d.querySelector('[aria-label="February 4, 2026"]').click());
  assert.equal(input().value, "02/04/2026", "Reselecting the same date must also work");
});
