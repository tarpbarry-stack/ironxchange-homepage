import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const load = async path => import(`data:text/javascript;base64,${Buffer.from(await readFile(new URL(`../components/ixi-aos/transact/${path}`, import.meta.url))).toString("base64")}`);
const { parseIXIMoneyInput: parse, formatIXIMoneyInput: format } = await load("IXIMoney.js");
const { withIXIBillBalance } = await load("modules/bill/IXIBillBalance.js");

test("accounting input accepts ordinary and pasted currency and preserves cents", () => {
  for (const [input, value, shown] of [["2500", "2500", "2,500.00"], ["$2,500.07", "2500.07", "2,500.07"], [".07", ".07", "0.07"], ["", "", ""], ["0", "0", "0.00"]]) {
    assert.deepEqual(parse(input), { valid: true, value }); assert.equal(format(value), shown);
  }
});
test("invalid grouping, extra decimal places, nonnumeric and unsafe amounts are rejected", () => {
  for (const input of ["2,50", "20.007", "hello", "1e6", "NaN", "Infinity", "1,000,000,000,000.00", "-1"]) assert.equal(parse(input).valid, false, input);
  assert.equal(parse("-500.07", { allowNegative: true }).value, "-500.07");
});
test("Bill and Freight views preserve paid cash and show the late carrier credit", () => {
  const bill = { financialBinding: { financialDocumentId: "bill-1" }, bill: { amount: 2500 }, payment: { amountPaid: 0 } };
  const payment = { financialDocumentId: "payment-1", sourceFinancialDocumentId: "bill-1", documentType: "payment", paymentDirection: "outflow", totals: { total: 2500 } };
  const credit = { financialDocumentId: "credit-1", sourceFinancialDocumentId: "bill-1", documentType: "credit", totals: { total: 500 } };
  const next = withIXIBillBalance(bill, [payment, payment, credit]);
  assert.equal(next.payment.amountPaid, 2500); assert.equal(next.payment.openBalance, 0); assert.equal(next.payment.carrierCredit, 500);
  assert.equal(withIXIBillBalance({ ...bill, bill: { amount: 2800 } }, [payment]).payment.openBalance, 300);
});
