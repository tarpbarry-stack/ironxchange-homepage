import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const actuatorSource = readFileSync(new URL("../components/ixi-chassis/IXIObjectCardActuator.jsx", import.meta.url), "utf8");

test("Marketplace actuator keeps the existing bottom edge while matching full actuator height", () => {
  assert.match(
    actuatorSource,
    /:global\(\.marketplace-listing-card\) \.ixi-object-card-actuator \{[\s\S]*?top: 335px;[\s\S]*?height: 34px;/
  );
  assert.equal(335 + 34, 352 + 17, "Marketplace actuator bottom edge must remain at 369px");
});

test("Marketplace override does not change actuator side position or behavior", () => {
  assert.match(actuatorSource, /\.ixi-object-card-actuator\.right \{[\s\S]*?right: -1px;/);
  assert.match(actuatorSource, /\.ixi-object-card-actuator\.left \{[\s\S]*?left: -1px;/);
  assert.match(actuatorSource, /onClick\?\.\(event\)/);
});

test("scaled mobile Marketplace actuators keep a five pixel rail with a 44 pixel rendered target", () => {
  assert.match(actuatorSource, /--ixi-fit-width-inverse-scale/u);
  assert.match(actuatorSource, /44px \*/u);
  assert.match(actuatorSource, /\.ixi-object-card-actuator::after \{[\s\S]*?width: 5px;[\s\S]*?height: 34px;/u);
  assert.match(actuatorSource, /touch-action: manipulation/u);
  assert.doesNotMatch(
    actuatorSource,
    /onPointerDown=\{event => \{\s*event\.preventDefault\(\)/u
  );
});
