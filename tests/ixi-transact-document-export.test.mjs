import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import crypto from "node:crypto";
import JSZip from "jszip";
import ExcelJS from "exceljs";
import { PDFDocument, PDFName, decodePDFRawStream } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { buildMachineLedger } from "../components/ixi-command-center/IXITransactMachineLedger.mjs";
import { createMachinePackage, createTransactionPdf, fetchTransactionEvidence } from "../components/ixi-command-center/IXITransactDocumentDownload.js";

const context = { title: "Example machine", passportId: "TEST-PASSPORT", sourceId: "test-object" };
const entity = { displayName: "Example Entity" };
const record = attachments => ({ server: { revision: 2 }, financialDocument: {
  financialDocumentId: "test-expense", documentNumber: "EXP-TEST", documentType: "expense", financialState: "incurred",
  currency: "USD", occurredAt: "2026-09-01", paymentMethod: "unpaid", totals: { total: 474.66 },
  expense: { vendor: "García, Inc." }, attachments
} });

test("PDF embedded glyph outlines preserve every printed English and Spanish character", async () => {
  const fontBytes = await fs.readFile(new URL("../public/fonts/IXI-Document-Sans.ttf", import.meta.url));
  const sourceFont = fontkit.create(fontBytes);
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789$.,-ÁÉÍÓÚÜÑáéíóúüñ¿¡&";
  const blob = await createTransactionPdf({
    rows: buildMachineLedger([record([])]).rows,
    context: { ...context, title: alphabet }, entity, fontBytes
  });
  const pdf = await PDFDocument.load(await blob.arrayBuffer());
  const fonts = pdf.getPages()[0].node.Resources().lookup(PDFName.of("Font"));
  const font = fonts.lookup(fonts.keys()[0]);
  const descendant = font.lookup(PDFName.of("DescendantFonts")).lookup(0);
  assert.equal(descendant.lookup(PDFName.of("CIDToGIDMap")).toString(), "/Identity");
  const descriptor = descendant.lookup(PDFName.of("FontDescriptor"));
  const embeddedBytes = decodePDFRawStream(descriptor.lookup(PDFName.of("FontFile2"))).decode();
  const embeddedFont = fontkit.create(embeddedBytes);
  const unicodeMap = new TextDecoder().decode(decodePDFRawStream(font.lookup(PDFName.of("ToUnicode"))).decode());
  const characterIds = new Map();
  for (const block of unicodeMap.matchAll(/beginbfchar([\s\S]*?)endbfchar/g)) {
    for (const [, cid, unicode] of block[1].matchAll(/<([0-9a-f]+)>\s*<([0-9a-f]{4})>/gi)) {
      characterIds.set(String.fromCharCode(parseInt(unicode, 16)), parseInt(cid, 16));
    }
  }
  for (const character of alphabet) {
    assert.ok(characterIds.has(character), `Missing character mapping: ${character}`);
    // Text extraction can pass even when the actual glyph data is corrupt.
    const outline = embeddedFont.getGlyph(characterIds.get(character)).path.commands;
    assert.ok(outline.length > 0, `Blank glyph: ${character}`);
    assert.deepEqual(outline, sourceFont.glyphForCodePoint(character.codePointAt(0)).path.commands,
      `Malformed printed glyph: ${character}`);
  }
});

test("a machine package contains reconciling PDFs, spreadsheets, records, history and checksummed contents", async t => {
  const original = global.fetch;
  t.after(() => { global.fetch = original; });
  global.fetch = async (url, options) => {
    if (url === "/fonts/IXI-Document-Sans.ttf") return new Response(await fs.readFile(new URL("../public/fonts/IXI-Document-Sans.ttf", import.meta.url)));
    assert.equal(url, "/api/ixi/financial/documents/test-expense/history");
    assert.equal(options.credentials, "include");
    return Response.json({ ok: true, data: { history: [{ revision: 2, operation: "replace", recordedAt: "2026-09-01" }] } });
  };
  const ledger = buildMachineLedger([record([])]);
  const { blob, manifest } = await createMachinePackage({ rows: ledger.rows, context, entity, ledger });
  assert.equal(manifest.complete, true);
  const zip = await JSZip.loadAsync(await blob.arrayBuffer());
  for (const item of manifest.entries) {
    const bytes = await zip.file(item.path).async("nodebuffer");
    assert.equal(bytes.length, item.sizeBytes);
    assert.equal(crypto.createHash("sha256").update(bytes).digest("hex"), item.sha256);
  }
  assert.deepEqual(Object.values(zip.files).filter(item => !item.dir && item.name !== "contents.json").map(item => item.name).sort(), manifest.entries.map(item => item.path).sort());
  const pdfName = manifest.entries.find(item => item.path.startsWith("records/")).path;
  const pdf = await PDFDocument.load(await zip.file(pdfName).async("uint8array"));
  assert.ok(pdf.getPageCount() >= 1);
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(await zip.file("transactions.xlsx").async("nodebuffer"));
  assert.equal(workbook.getWorksheet("Transactions").getCell("K2").value, 474.66);
  assert.equal(workbook.getWorksheet("Transactions").getCell("G2").value, "García, Inc.");
  const snapshot = JSON.parse(await zip.file("transactions.json").async("string"));
  assert.equal(snapshot.records[0].revision, 2);
  assert.equal(snapshot.records[0].financialDocument.totals.total, 474.66);
  const history = JSON.parse(await zip.file("history/test-expense.json").async("string"));
  assert.equal(history.history[0].revision, 2);
  assert.match(await zip.file("transactions.csv").async("string"), /474\.66/);
});

test("unavailable evidence is explicitly marked instead of producing a falsely complete package", async t => {
  const original = global.fetch;
  t.after(() => { global.fetch = original; });
  global.fetch = async () => Response.json({ ok: false, errors: [{ message: "History unavailable" }] }, { status: 503 });
  const ledger = buildMachineLedger([record([{ fileName: "legacy-receipt.pdf", status: "recorded" }])]);
  const { blob, manifest } = await createMachinePackage({ rows: ledger.rows, context, entity, ledger });
  assert.equal(manifest.complete, false);
  assert.equal(manifest.missingEvidence.length, 2);
  const zip = await JSZip.loadAsync(await blob.arrayBuffer());
  assert.match(await zip.file("README.txt").async("string"), /INCOMPLETE EVIDENCE/);
});

test("evidence download checks the authorized response, file size and SHA-256 before returning bytes", async t => {
  const original = global.fetch;
  t.after(() => { global.fetch = original; });
  const bytes = new TextEncoder().encode("test evidence");
  const checksum = crypto.createHash("sha256").update(bytes).digest("base64");
  const attachment = { attachmentId: "attachment-1", sizeBytes: bytes.length };
  let corrupt = false;
  global.fetch = async (url, options) => {
    if (String(url).startsWith("/api/")) {
      assert.equal(options.credentials, "include");
      return Response.json({ ok: true, data: { downloadUrl: "https://files.invalid/signed", checksumSha256: checksum, sizeBytes: bytes.length } });
    }
    assert.equal(options.credentials, "omit");
    assert.equal(options.referrerPolicy, "no-referrer");
    return new Response(corrupt ? "changed bytes" : bytes);
  };
  assert.equal((await fetchTransactionEvidence("test-expense", attachment)).size, bytes.length);
  corrupt = true;
  await assert.rejects(fetchTransactionEvidence("test-expense", attachment), /checksum does not match/);
});
