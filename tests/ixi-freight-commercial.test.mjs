import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = path => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const contractSource = await read("components/ixi-aos/transact/modules/freight/IXIFreightContract.js");
const contract = await import(`data:text/javascript;base64,${Buffer.from(contractSource).toString("base64")}`);

const context = { primary:{ objectId:"machine-1", passportId:"pass-1", objectType:"machine", label:"2017 Deere 544K II" }, location:{ label:"Wichita Falls, TX" } };

test("Freight Order contract binds one machine Passport to route, carrier, purpose, and expected economics", () => {
  const payload = contract.createIXIFreightOrderInput({
    context,
    input:{ purpose:"acquisition-inbound", carrierName:"ABC Transport", originLabel:"Fort Worth, TX", destinationLabel:"Wichita Falls, TX", routeMiles:121, agreedAmount:2000, permitEstimate:150, fuelSurchargeEstimate:100 }
  });
  assert.equal(contract.validateIXIFreightOrderInput(payload).valid, true);
  assert.equal(payload.asset.passportId, "pass-1");
  assert.equal(payload.economics.agreedAmount, 2000);
  assert.equal(payload.metadata.acquisitionCost, true);
});

test("Freight invoice reconciliation calculates accessorial total and variance tolerance", () => {
  const invoice = contract.invoiceCharges({ freight:2000, fuelSurcharge:100, permits:150, detention:75 });
  assert.equal(invoice.amount, 2325);
  const variance = contract.freightVariance({ economics:{ expectedTotal:2250, actualTotal:2325 } });
  assert.equal(variance.variance, 75);
  assert.equal(variance.approvalRequired, false);
});

test("Freight accepts one actual-cost total without inventing an expected-cost variance", () => {
  const payload = contract.createIXIFreightOrderInput({
    context,
    input:{ purpose:"acquisition-inbound", carrierName:"ABC Transport", originLabel:"Fort Worth, TX", destinationLabel:"Wichita Falls, TX" }
  });
  const invoice = contract.invoiceCharges({ actualCostTotal:"2750" });
  const variance = contract.freightVariance({ economics:{ ...payload.economics, actualTotal:invoice.amount } });

  assert.equal(payload.economics.expectedProvided, false);
  assert.equal(invoice.amount, 2750);
  assert.equal(invoice.charges.freight, 2750);
  assert.equal(variance.hasExpected, false);
  assert.equal(variance.variance, 0);
  assert.equal(variance.approvalRequired, false);
});

test("a stated actual total must reconcile to any optional itemized charges", () => {
  const invoice = contract.invoiceCharges({ actualCostTotal:"2750", freight:"2500", permits:"100" });
  assert.equal(invoice.totalMismatch, true);
  assert.equal(invoice.itemizedAmount, 2600);
});

test("Freight is a native operational TRANSACT tile backed by authenticated IX Core routes", async () => {
  const [registrySource, shell, app, commands, proxy, route, acquisition] = await Promise.all([
    read("components/ixi-aos/transact/IXITransactModuleRegistry.js"), read("components/ixi-aos/transact/IXITransactApp.jsx"),
    read("components/ixi-aos/transact/modules/freight/IXIFreightApp.jsx"), read("components/ixi-aos/transact/modules/freight/IXIFreightCommands.js"),
    read("lib/ixi-freight/ixiFreightProxy.js"), read("pages/api/ixi/freight/[...path].js"),
    read("components/ixi-aos/transact/modules/asset-acquisition/IXIAssetAcquisitionRecordEngine.js")
  ]);
  const registry = await import(`data:text/javascript;base64,${Buffer.from(registrySource).toString("base64")}`);
  const freight = registry.getIXITransactModules({ objectType:"machine" }).find(item=>item.id==="freight");
  assert.equal(freight?.documentType, "freight");
  assert.equal(freight?.readiness, "operational");
  assert.match(shell, /moduleId === "freight"/u);
  assert.match(app, /RECORD ACTUAL \+ CREATE BILL/u);
  assert.match(app, /TOTAL ACTUAL COST/u);
  assert.match(app, /RECONCILE FREIGHT/u);
  assert.match(commands, /createIXIBill/u);
  assert.match(commands, /acquisitionCost/u);
  assert.match(proxy, /requestIxCoreFreight/u);
  assert.match(route, /proxyIXIFreightRequest/u);
  assert.match(acquisition, /financialDocument/u);
  assert.match(acquisition, /billRecord\?\.bill\?\.amount/u);
});

test("Freight detail rows contain long operational values inside the native card", async () => {
  const styles = await read("components/ixi-aos/transact/modules/freight/IXIFreightStyles.jsx");
  assert.match(styles, /\.fr-body\{[^}]*overflow-x:hidden/u);
  assert.match(styles, /\.fr-row\{[^}]*grid-template-columns:minmax\(82px,34%\) minmax\(0,1fr\)/u);
  assert.match(styles, /\.fr-row b\{[^}]*overflow-wrap:anywhere/u);
  assert.match(styles, /\.fr-kpis\{[^}]*minmax\(0,1fr\) minmax\(0,1fr\)/u);
  assert.match(styles, /\.fr-invoice div\{[^}]*grid-template-columns:minmax\(0,1fr\) auto/u);
});
