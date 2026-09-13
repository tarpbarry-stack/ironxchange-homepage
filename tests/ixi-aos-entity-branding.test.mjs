import test from "node:test";
import assert from "node:assert/strict";
import { getIXIEntityLogoUrl } from "../lib/mos/ixiEntityBranding.mjs";
import { buildIXIAosCommandContexts } from "../components/ixi-command-center/IXIAosCommandCenterModel.js";

const image = (id, variants) => ({ type: "image", id, attributes: { variants } });
const user = { relationships: { profileImage: { data: { id: { uuid: "company-image" } } } } };
const logoUrl = "https://images.invalid/company-logo.png";

test("Entity branding resolves the linked image from the authenticated listings response", () => {
  const environment = { currentUser: { ...user, included: [
    image({ uuid: "machine-image" }, { default: { url: "https://images.invalid/machine.png" } }),
    image({ uuid: "company-image" }, { "scaled-large": { url: logoUrl } })
  ] } };
  assert.equal(getIXIEntityLogoUrl(environment), logoUrl);
  const entity = { entityId: "company-one", passportId: "company-passport", displayName: "Example Company", logoUrl: getIXIEntityLogoUrl(environment) };
  const context = buildIXIAosCommandContexts({ entity, entityPassportId: entity.passportId }).find(item => item.kind === "company");
  assert.equal(context.imageUrl, logoUrl);
});

test("Entity branding preserves an explicit Entity logo and accepts flat included image IDs", () => {
  const environment = { currentUser: user, included: [image("company-image", { default: { url: logoUrl } })] };
  assert.equal(getIXIEntityLogoUrl(environment), logoUrl);
  assert.equal(getIXIEntityLogoUrl(environment, { logoUrl: "/saved-entity-logo.png" }), "/saved-entity-logo.png");
  assert.equal(getIXIEntityLogoUrl(environment, { imageUrl: "/saved-entity-image.png" }), "/saved-entity-image.png");
});

test("missing company images never substitute unrelated included images", () => {
  const included = [image("other-user", { default: { url: logoUrl } })];
  assert.equal(getIXIEntityLogoUrl({ currentUser: { ...user, included } }), "");
  assert.equal(getIXIEntityLogoUrl({ currentUser: { included } }), "");
  assert.equal(getIXIEntityLogoUrl({ currentUser: { ...user, included: [image("company-image", {})] } }), "");
});
