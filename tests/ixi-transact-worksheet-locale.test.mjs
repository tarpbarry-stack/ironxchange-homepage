import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = path => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("one shared TRANSACT shell expands every operational module without remounting it", async () => {
  const [shell, styles] = await Promise.all([
    read("components/ixi-aos/transact/IXITransactApp.jsx"),
    read("components/ixi-aos/transact/IXITransactStyles.jsx"),
  ]);
  assert.match(shell, /<dialog/u);
  assert.match(shell, /dialog\.showModal\?\.\(\)/u);
  assert.match(shell, /dialog\.show\?\.\(\)/u);
  assert.match(shell, /data-ixi-transact-presentation/u);
  assert.match(styles, /\.ixi-transact-dialog\.worksheet-open/u);
  assert.match(styles, /width:\s*min\(1180px,\s*calc\(100vw - 32px\)\)/u);
  assert.match(styles, /height:\s*min\(820px,\s*calc\(100dvh - 32px\)\)/u);
  assert.match(styles, /\.module-open \.tx-body > \*\s*\{[^}]*width:\s*100%\s*!important[^}]*min-width:\s*0\s*!important[^}]*max-width:\s*100%\s*!important/u);
  assert.match(styles, /\.module-open \.tx-body > \* \*\s*\{[^}]*min-width:\s*0\s*!important[^}]*max-width:\s*100%\s*!important/u);
  assert.match(styles, /contain:\s*inline-size/u);
  assert.match(styles, /:where\(p, span, strong, b, small, time, dd, dt, td, th\)[^}]*overflow-wrap:\s*anywhere/u);
});

test("TRANSACT locale is persisted and Freight supports en-US and es-MX", async () => {
  const [shell, locale, freight, freightContract, freightStyles] = await Promise.all([
    read("components/ixi-aos/transact/IXITransactApp.jsx"),
    read("components/ixi-aos/transact/IXITransactLocale.jsx"),
    read("components/ixi-aos/transact/modules/freight/IXIFreightApp.jsx"),
    read("components/ixi-aos/transact/modules/freight/IXIFreightContract.js"),
    read("components/ixi-aos/transact/modules/freight/IXIFreightStyles.jsx"),
  ]);
  assert.match(locale, /ENGLISH:\s*"en-US"/u);
  assert.match(locale, /SPANISH_MEXICO:\s*"es-MX"/u);
  assert.match(locale, /ixi\.transact\.locale\.v1/u);
  assert.match(locale, /"TOTAL ACTUAL COST":\s*"COSTO REAL TOTAL"/u);
  assert.match(shell, /localStorage\?\.setItem/u);
  assert.match(shell, /IXITransactLocaleProvider/u);
  assert.match(shell, /data-ixi-transact-locale/u);
  assert.match(freight, /useIXITransactLocale/u);
  assert.match(freight, /t\("EDIT ORDER"\)/u);
  assert.match(freight, /errorMessage\(err,"FREIGHT ACTION FAILED\."\)/u);

  const spanishKeys = new Set(
    [...locale.matchAll(/^\s*"([^"]+)":/gmu)].map(match => match[1]),
  );
  const directFreightKeys = [
    ...freight.matchAll(/\bt\("([^"]+)"\)/gu),
  ].map(match => match[1]);
  const validationMessages = [
    ...freightContract.matchAll(/errors\.[a-zA-Z]+\s*=\s*"([^"]+)"/gu),
  ].map(match => match[1]);
  const dynamicLabels = [
    "SALE PREPARATION", "YARD TRANSFER", "SERVICE OUTBOUND", "SERVICE RETURN",
    "AUCTION MOVE", "RENTAL DELIVERY", "RENTAL RETURN", "DEMO",
    "INTERNAL REPOSITION", "PAID", "CLOSED", "CARRIER INVOICE",
    "CARRIER CREDIT", "FREIGHT.AMENDED", "FREIGHT.CREATED",
  ];
  for (const key of [...directFreightKeys, ...validationMessages, ...dynamicLabels]) {
    assert.equal(spanishKeys.has(key), true, `Missing es-MX Freight translation: ${key}`);
  }

  const freightFontSizes = [
    ...freightStyles.matchAll(/font(?:-size|):[^;}]*?([0-9]+(?:\.[0-9]+)?)px/gu),
  ].map(match => Number(match[1]));
  assert.equal(Math.min(...freightFontSizes) >= 9, true, "Freight typography must remain readable at card size");
});
