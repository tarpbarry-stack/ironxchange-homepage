import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { mutationOriginIsValid } = require("../lib/ixi-authority/ixiAuthorityProxy.js");
const read = file => fs.readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
const gatewaySource = read("pages/api/ixi/workforce-access/[...path].js")
  .replace(/^import .*;\n/gm, "")
  .replace(/export const config[^\n]+\n?/g, "")
  .replace("export function createWorkforceAccessHandler", "function createWorkforceAccessHandler")
  .replace("export default createWorkforceAccessHandler();", "return createWorkforceAccessHandler;");
const gatewayFactory = new Function("mutationOriginIsValid", gatewaySource)(mutationOriginIsValid);
const response = () => ({ headers: {}, setHeader(key, value) { this.headers[key] = value; }, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } });
const request = (method = "GET", path = ["people", "person-one"]) => ({ method, query: { path }, headers: { host: "ixi.test", origin: "https://ixi.test" }, body: {} });

test("Person cards open the governed System Access face while other Objects retain Passport policy", () => {
  const app = read("components/ixi-aos/transact/modules/access-policy/IXIAccessPolicyApp.jsx");
  const face = read("components/ixi-aos/transact/modules/access-policy/IXIWorkforceAccessFace.jsx");
  assert.match(app, /objectType === "person"/u);
  assert.match(app, /IXIWorkforceAccessFace/u);
  assert.match(app, /IXIGenericAccessPolicyApp/u);
  assert.match(face, /MACHINES THIS PERSON CAN SEE/u);
  assert.match(face, /SELECT ALL/u);
  assert.match(face, /SAVE SYSTEM ACCESS/u);
  assert.match(face, /CREATE 7-DAY INVITATION LINK/u);
  assert.match(face, /financial-accounting/u);
});

test("access templates are presentation defaults and never name users, Entities, or Workforce containers", () => {
  const face = read("components/ixi-aos/transact/modules/access-policy/IXIWorkforceAccessFace.jsx");
  const gateway = read("pages/api/ixi/workforce-access/[...path].js");
  for (const source of [face, gateway]) {
    assert.doesNotMatch(source, /Bryce|Star\s*&\s*Sons|["']WORKFORCE["']/iu);
    assert.doesNotMatch(source, /ownerUserId\s*:/u);
  }
  assert.match(face, /personObjectId/u);
  assert.match(face, /passportId/u);
});

test("browser gateway derives principal and Entity from the authenticated session", async () => {
  let upstream;
  const handler = gatewayFactory({
    sessionFor: async () => ({ userId: "verified-owner", currentUser: { attributes: {} } }),
    contextFor: async () => ({ entityId: "verified-entity" }),
    request: async input => { upstream = input; return { ok: true, profile: {} }; }
  });
  const req = request();
  req.query.entityId = "forged-entity";
  req.query.principalId = "forged-owner";
  const res = response();
  await handler(req, res);
  assert.equal(res.code, 200);
  assert.equal(upstream.principalId, "verified-owner");
  assert.equal(upstream.entityId, "verified-entity");
  assert.equal(upstream.path, "/workforce-access/people/person-one");
});

test("invitation acceptance forwards only the verified session email and no browser authority", async () => {
  let upstream;
  const handler = gatewayFactory({
    sessionFor: async () => ({ userId: "verified-user", currentUser: { attributes: { email: "actual@example.test", emailVerified: false } } }),
    contextFor: async () => { throw new Error("Acceptance must not resolve an owner context"); },
    request: async input => { upstream = input; return { ok: true }; }
  });
  const req = request("POST", ["invitations", "accept"]);
  req.body = { entityId: "entity", id: "invite", token: "secret", email: "spoof@example.test", verifiedEmail: true, financialRole: "financial-admin" };
  const res = response();
  await handler(req, res);
  assert.equal(res.code, 200);
  assert.equal(upstream.entityId, "");
  assert.equal(upstream.body.email, "actual@example.test");
  assert.equal(upstream.body.verifiedEmail, false);
  assert.equal(upstream.body.financialRole, undefined);
});

test("mutations are same-origin and the browser route allowlist is closed", async () => {
  let calls = 0;
  const handler = gatewayFactory({
    sessionFor: async () => { calls += 1; return { userId: "owner" }; },
    contextFor: async () => ({ entityId: "entity" }),
    request: async () => { calls += 1; return { ok: true }; }
  });
  const crossOrigin = request("PUT");
  crossOrigin.headers.origin = "https://other.test";
  const denied = response();
  await handler(crossOrigin, denied);
  assert.equal(denied.code, 403);
  assert.equal(calls, 0);

  for (const path of [["people"], ["memberships"], ["people", "person", "delete"], ["invitations", "invite", "accept", "extra"]]) {
    const res = response();
    await handler(request("POST", path), res);
    assert.equal(res.code, 405);
  }
  assert.equal(calls, 0);
});

test("the invitation landing route bypasses only the soft-launch cover and still requires authenticated API acceptance", () => {
  const middleware = read("middleware.js");
  const page = read("pages/system-access.js");
  assert.match(middleware, /"\/system-access"/u);
  assert.match(page, /\/api\/ixi\/workforce-access\/invitations\/accept/u);
  assert.match(page, /SIGN IN WITH THE INVITED EMAIL/u);
  assert.doesNotMatch(page, /emailVerified\s*:\s*true/u);
});

test("the legacy Passport policy face uses the registered Authority vocabulary", () => {
  const source = read("components/ixi-aos/transact/modules/access-policy/IXIAccessPolicyApp.jsx");
  assert.match(source, /all-authenticated/u);
  assert.match(source, /transact\.work-order\.view/u);
  assert.match(source, /transact\.time\.create/u);
  assert.doesNotMatch(source, /value="authenticated"/u);
  assert.doesNotMatch(source, /"work-order\.view"/u);
});
