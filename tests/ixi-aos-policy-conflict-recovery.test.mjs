import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const coreRoot = process.env.IXI_CORE_CONTRACT_ROOT;
test("the production edit session preserves a conflicting policy draft until explicit rebase and review", {
  skip: coreRoot ? false : "Run the required paired gate with IXI_CORE_CONTRACT_ROOT."
}, async t => {
  const require = createRequire(import.meta.url);
  const coreRequire = createRequire(path.join(path.resolve(coreRoot), "package.json"));
  const { JSDOM } = coreRequire("jsdom");
  const dom = new JSDOM('<div id="root"></div>');
  const previous = new Map();
  for (const [key, value] of Object.entries({ window: dom.window, document: dom.window.document,
    navigator: dom.window.navigator, IS_REACT_ACT_ENVIRONMENT: true })) {
    previous.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, { value, configurable: true, writable: true });
  }
  const React = require("react");
  const { createRoot } = require("react-dom/client");
  const root = createRoot(document.getElementById("root"));
  t.after(async () => {
    await React.act(() => root.unmount());
    dom.window.close();
    for (const [key, descriptor] of previous) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  });
  const policy = { schema: "aos.system-index-membership.v1", enabled: true,
    defaultWorkspaceHome: false, allowedObjectTypes: ["location"], allowedDefinitionIds: [] };
  const original = { objectId: "customer-root", entityId: "customer-entity", passportId: "IXITEST001",
    objectType: "system-index", revision: 7, displayName: "Customer index", metadata: {} };
  let latest = { ...original, revision: 9, metadata: { systemIndexMembershipPolicy: {
    ...policy, allowedObjectTypes: ["person"]
  } } };
  const source = fileURLToPath(new URL("../components/ixi-aos/card-runtime/modules/useIXIAosObjectEditSession.js", import.meta.url));
  const { code } = require("next/dist/build/swc").transformSync(fs.readFileSync(source, "utf8"), {
    filename: source, jsc: { parser: { syntax: "ecmascript" }, target: "es2022" }, module: { type: "commonjs" }
  });
  const module = { exports: {} }, sourceRequire = createRequire(source);
  // Control transport timing only. React, the edit hook, command construction,
  // policy validation, retry state and rebase logic are the production modules.
  new Function("require", "module", "exports", code)(name => name.endsWith("ixiMosClient")
    ? { fetchMosObject: async () => ({ object: latest }) }
    : sourceRequire(name), module, module.exports);
  const useEdit = module.exports.default;
  const commands = [];
  let publishConfirmedReadback = false;
  const adapter = async payload => {
    commands.push(payload.command);
    // The workspace save adapter publishes confirmed readback to the parent.
    if (publishConfirmedReadback) root.render(React.createElement(View, { object: latest }));
    return { object: latest };
  };
  let edit;
  function View({ object = original }) {
    edit = useEdit({ object, persistenceAdapter: adapter });
    return React.createElement("output", { "data-editing": edit.editing, "data-conflict": edit.conflict?.code || "" });
  }
  await React.act(() => root.render(React.createElement(View)));
  await React.act(() => edit.begin());
  const draft = { ...edit.editorObject, metadata: { systemIndexMembershipPolicy: policy } };
  await React.act(async () => {
    await assert.rejects(edit.save(draft), { code: "IXI_AOS_MEMBERSHIP_POLICY_READBACK_MISMATCH", status: 409 });
  });
  assert.equal(document.querySelector("output").dataset.editing, "true");
  assert.equal(document.querySelector("output").dataset.conflict, "IXI_AOS_MEMBERSHIP_POLICY_READBACK_MISMATCH");
  assert.deepEqual(edit.editorObject.metadata.systemIndexMembershipPolicy, policy);
  await React.act(async () => {
    await assert.rejects(edit.retry(), { code: "IXI_AOS_MEMBERSHIP_POLICY_READBACK_MISMATCH" });
  });
  assert.equal(commands[1].commandId, commands[0].commandId);
  assert.equal(commands[1].expectedRevision, 7);
  await React.act(() => edit.reloadLatest());
  assert.equal(edit.session.baseRevision, 9);
  assert.deepEqual(edit.editorObject.metadata.systemIndexMembershipPolicy, policy);
  assert.deepEqual(edit.runtimeObject.metadata.systemIndexMembershipPolicy.allowedObjectTypes, ["person"]);
  latest = { ...latest, revision: 10, metadata: { systemIndexMembershipPolicy: policy } };
  publishConfirmedReadback = true;
  await React.act(() => edit.save(edit.editorObject));
  assert.equal(commands[2].expectedRevision, 9);
  assert.notEqual(commands[2].commandId, commands[0].commandId);
  assert.equal(edit.editing, false);
  assert.equal(edit.conflict, null);
  assert.equal(edit.runtimeObject.objectId, original.objectId);
  assert.equal(edit.runtimeObject.passportId, original.passportId);
  assert.equal(edit.runtimeObject.revision, 10);
  assert.deepEqual(edit.runtimeObject.metadata.systemIndexMembershipPolicy, policy);
});
