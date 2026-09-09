import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import { buildIXITransactFastEnvironment } from "../components/ixi-transact-dashboard/data/IXITransactFastBootstrap.mjs";
import financialProxy from "../lib/ixi-financial/ixiFinancialProxy.js";

const { attachFinancialOperatingContext } = financialProxy;

test("TRAN$ACT fast bootstrap requires a canonical Entity and permanent Passport", () => {
  assert.equal(buildIXITransactFastEnvironment({ data: {} }), null);
  assert.equal(buildIXITransactFastEnvironment({
    data: {
      defaults: { entityPassportId: "IXI-ENTITY" },
      operatingContext: { entity: { displayName: "Star & Sons Unlimited LLC" } }
    }
  }), null);
});

test("TRAN$ACT fast bootstrap creates a company-only environment without asset fabrication", () => {
  const environment = buildIXITransactFastEnvironment({
    data: {
      defaults: { entityPassportId: "IXIUJ68R3A" },
      operatingContext: {
        entity: {
          entityId: "entity-star-and-sons",
          displayName: "Star & Sons Unlimited LLC",
          officeLocation: "Abilene, TX"
        }
      }
    }
  });

  assert.deepEqual(environment.entity, {
    entityId: "entity-star-and-sons",
    passportId: "IXIUJ68R3A",
    displayName: "Star & Sons Unlimited LLC",
    status: "active",
    officeLocation: "Abilene, TX"
  });
  assert.deepEqual(environment.objects, []);
  assert.deepEqual(environment.ownedListings, []);
  assert.equal(environment.hydration.canonicalObjects, "deferred");
});

test("financial access route requests minimal authenticated operating context", () => {
  const route = fs.readFileSync(new URL("../pages/api/ixi/financial/access-context.js", import.meta.url), "utf8");
  const proxy = fs.readFileSync(new URL("../lib/ixi-financial/ixiFinancialProxy.js", import.meta.url), "utf8");

  assert.match(route, /includeOperatingContext:\s*true/u);
  assert.match(proxy, /attachFinancialOperatingContext/u);
  assert.match(proxy, /payload\?\.data\?\.defaults\?\.entityPassportId/u);
});

test("financial proxy attaches only minimal canonical company context", () => {
  const result = attachFinancialOperatingContext({
    payload: {
      ok: true,
      data: {
        defaults: { entityPassportId: "IXIUJ68R3A" },
        permissions: ["financial.dashboard.read"]
      }
    },
    context: {
      entity: {
        entityId: "entity-star-and-sons",
        displayName: "Star & Sons Unlimited LLC",
        metadata: { secret: "must-not-leak" }
      },
      principal: { secret: "must-not-leak" }
    }
  });

  assert.deepEqual(result.data.operatingContext, {
    entity: {
      entityId: "entity-star-and-sons",
      displayName: "Star & Sons Unlimited LLC",
      passportId: "IXIUJ68R3A",
      status: "active",
      officeLocation: ""
    }
  });
  assert.deepEqual(result.data.permissions, ["financial.dashboard.read"]);
  assert.equal(JSON.stringify(result).includes("must-not-leak"), false);
});

test("TRAN$ACT financial projection precedes full AOS hydration", () => {
  const source = fs.readFileSync(new URL("../components/ixi-command-center/IXITransactCommandCenter.jsx", import.meta.url), "utf8");
  const accessIndex = source.indexOf("await loadIXIFinancialAccessContext");
  const aosIndex = source.indexOf("await loadIXIMosEnvironment");

  assert.ok(accessIndex >= 0);
  assert.ok(aosIndex > accessIndex);
  assert.match(source, /financialLoading \|\| \(!projectionPayload && !financialError\)/u);
  assert.doesNotMatch(source.slice(accessIndex, aosIndex), /loadIXIMosEnvironment/u);
});
