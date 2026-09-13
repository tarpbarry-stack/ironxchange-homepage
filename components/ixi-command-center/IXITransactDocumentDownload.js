import {
  exportColumns,
  exportValues,
  machineCsv,
  safeFileName,
  documentPrintFields,
  exportDocumentSnapshot,
  recordEvidence,
} from "./IXITransactExportModel.mjs";
import { moneyLabel } from "./IXITransactMachineLedger.mjs";
import { loadIXIAosFinancialHistory } from "../ixi-aos/financial-runtime/IXIAosFinancialReadClient.js";

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}

let fontBytesPromise;
async function documentFont() {
  if (!fontBytesPromise)
    fontBytesPromise = fetch("/fonts/IXI-Document-Sans.ttf")
      .then((response) => {
        if (!response.ok)
          throw new Error("Document font could not be loaded. Please retry.");
        return response.arrayBuffer();
      })
      .catch((error) => {
        fontBytesPromise = null;
        throw error;
      });
  return fontBytesPromise;
}

export async function createTransactionPdf({
  rows,
  context = {},
  entity = {},
  ledger,
  generatedAt = new Date().toISOString(),
  fontBytes,
}) {
  const [{ PDFDocument, rgb }, { default: fontkit }] = await Promise.all([
    import("pdf-lib"),
    import("@pdf-lib/fontkit"),
  ]);
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const font = await pdf.embedFont(fontBytes || (await documentFont()), {
    // Preserve the validated glyph offsets. Fontkit's subset encoder corrupts
    // short loca offsets for this unhinted font, leaving readable text maps
    // but missing or malformed letters in the rendered document.
    subset: false,
  });
  const supported = new Set(font.getCharacterSet());
  const printable = (text) =>
    Array.from(String(text ?? ""))
      .map((char) => {
        if (
          char === "\n" ||
          char === "\r" ||
          supported.has(char.codePointAt(0))
        )
          return char;
        throw new Error(
          "This record contains a character the PDF font cannot render. Use the Excel or data export to preserve the original text.",
        );
      })
      .join("");
  pdf.setTitle(`${context.title || "TRAN$ACT"} · Transaction records`);
  pdf.setAuthor(entity.displayName || "IXI TRAN$ACT");
  pdf.setCreationDate(new Date(generatedAt));
  let page, y;
  const margin = 44,
    width = 524,
    bottom = 52;
  function newPage() {
    page = pdf.addPage([612, 792]);
    y = 724;
    page.drawRectangle({
      x: margin,
      y: 751,
      width,
      height: 3,
      color: rgb(0.94, 0.72, 0),
    });
    page.drawText("IXI TRAN$ACT", {
      x: margin,
      y: 762,
      size: 12,
      font,
      color: rgb(0.1, 0.13, 0.11),
    });
  }
  function wrap(value, size = 9, availableWidth = width) {
    const lines = [];
    for (const paragraph of printable(value).split(/\r?\n/)) {
      let line = "";
      for (const word of paragraph.split(/\s+/)) {
        const candidate = line ? `${line} ${word}` : word;
        if (font.widthOfTextAtSize(candidate, size) <= availableWidth) {
          line = candidate;
          continue;
        }
        if (line) {
          lines.push(line);
          line = "";
        }
        for (const char of word) {
          if (font.widthOfTextAtSize(line + char, size) > availableWidth) {
            lines.push(line);
            line = char;
          } else line += char;
        }
      }
      lines.push(line);
    }
    return lines;
  }
  function write(value, size = 9, color = rgb(0.13, 0.16, 0.14)) {
    for (const line of wrap(value, size)) {
      if (y < bottom + size * 1.5) newPage();
      page.drawText(line, { x: margin, y, size, font, color });
      y -= size * 1.55;
    }
  }
  function space() {
    y -= 9;
  }
  function identity() {
    write(context.title || "Transaction records", 15);
    space();
    write(entity.displayName || entity.name || "");
    write(
      `Passport: ${context.passportId || "—"}    Object: ${context.sourceId || context.objectId || context.id || "—"}`,
    );
    if (context.stockNumber) write(`Stock: ${context.stockNumber}`);
    if (context.serialNumber || context.serial)
      write(`Serial: ${context.serialNumber || context.serial}`);
    write(`Exported: ${generatedAt}`);
    space();
  }
  newPage();
  identity();
  if (ledger) {
    write("LIFETIME MACHINE FINANCIAL SUMMARY", 12);
    space();
    for (const [currency, total] of Object.entries(ledger.totals)) {
      write(
        `${currency} · Recorded machine cost ${moneyLabel(total.costCents, currency)}`,
      );
      write(
        `Invoiced revenue ${moneyLabel(total.revenueCents, currency)} · Money received ${moneyLabel(total.receivedCents, currency)}`,
      );
      write(
        `Customer balance ${moneyLabel(total.receivableCents, currency)} · Unpaid costs ${moneyLabel(total.payableCents, currency)}`,
      );
      write(
        `Pending cost ${moneyLabel(total.pendingCents, currency)} · Recorded margin ${moneyLabel(total.marginCents, currency)} · Labor ${total.hours} h`,
      );
      space();
    }
    write(
      "Recorded margin is invoiced revenue less recorded machine costs. Ledger profit may differ. Pending costs and commitments are separate.",
    );
    for (const warning of ledger.warnings) write(warning);
    write(
      `${rows.length} transaction(s) included in this export. Running costs retain lifetime context.`,
    );
  }
  for (const [index, row] of rows.entries()) {
    if (ledger || index > 0) {
      newPage();
      identity();
    }
    write(row.title, 14);
    space();
    const fields = documentPrintFields(row);
    for (let fieldIndex = 0; fieldIndex < fields.length;) {
      const first = fields[fieldIndex];
      const compact = (field) =>
        field && String(field[1]).length < 95 && String(field[0]).length < 35;
      const paired = compact(first) && compact(fields[fieldIndex + 1]);
      const group = paired ? fields.slice(fieldIndex, fieldIndex + 2) : [first];
      const cellWidth = paired ? (width - 20) / 2 : width;
      const cells = group.map(([name, value]) => ({
        labels: wrap(name.toUpperCase(), 8, cellWidth),
        values: wrap(value, 10, cellWidth),
      }));
      const height = Math.max(
        ...cells.map(
          (cell) => cell.labels.length * 12 + cell.values.length * 15 + 14,
        ),
      );
      if (y - Math.min(height, 620) < bottom) newPage();
      if (height > 620) {
        write(first[0].toUpperCase(), 8, rgb(0.36, 0.4, 0.37));
        write(first[1], 10);
        space();
        fieldIndex++;
        continue;
      }
      cells.forEach((cell, column) => {
        let baseline = y;
        const x = margin + column * (cellWidth + 20);
        for (const label of cell.labels) {
          page.drawText(label, {
            x,
            y: baseline,
            size: 8,
            font,
            color: rgb(0.36, 0.4, 0.37),
          });
          baseline -= 12;
        }
        for (const value of cell.values) {
          page.drawText(value, {
            x,
            y: baseline,
            size: 10,
            font,
            color: rgb(0.13, 0.16, 0.14),
          });
          baseline -= 15;
        }
      });
      y -= height;
      fieldIndex += group.length;
    }
  }
  const pages = pdf.getPages();
  pages.forEach((item, index) =>
    item.drawText(
      printable(
        `PRIVATE FINANCIAL RECORD · ${context.passportId || "IXI"} · Page ${index + 1} of ${pages.length}`,
      ),
      { x: margin, y: 25, size: 7, font, color: rgb(0.4, 0.43, 0.41) },
    ),
  );
  return new Blob([await pdf.save()], { type: "application/pdf" });
}

export async function createTransactionWorkbook(rows, context, entity, ledger) {
  const { default: ExcelJS } = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "IXI TRAN$ACT";
  workbook.created = new Date();
  const sheet = workbook.addWorksheet("Transactions");
  sheet.addRow(exportColumns);
  rows.forEach((row) => sheet.addRow(exportValues(row, context, entity)));
  sheet.views = [{ state: "frozen", ySplit: 1 }];
  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: Math.max(1, rows.length + 1), column: exportColumns.length },
  };
  sheet.columns.forEach((column, index) => {
    column.width = [0, 19, 20, 21].includes(index)
      ? 32
      : index > 9 && index < 19
        ? 20
        : 24;
  });
  for (let column = 11; column <= 19; column++)
    sheet.getColumn(column).numFmt =
      column === 18 ? "0.####" : "#,##0.00;[Red](#,##0.00)";
  sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  sheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF172019" },
  };
  sheet.getRow(1).height = 30;
  const about = workbook.addWorksheet("Scope and totals");
  about.columns = [{ width: 36 }, { width: 95 }];
  about.addRows([
    ["Machine", context.title],
    ["Passport ID", context.passportId],
    ["Entity", entity?.displayName],
    ["Exported at", new Date().toISOString()],
    ["Rows exported", rows.length],
    [
      "Running cost",
      "Lifetime running cost; a filtered export does not reset it.",
    ],
    [
      "Recorded margin",
      "Invoiced revenue less recorded machine costs; ledger profit may differ.",
    ],
  ]);
  if (ledger) {
    for (const [currency, total] of Object.entries(ledger.totals))
      for (const [key, value] of Object.entries(total))
        about.addRow([
          `${currency} ${key.replace(/Cents$/, "")}`,
          key.endsWith("Cents") ? value / 100 : value,
        ]);
    for (const warning of ledger.warnings) about.addRow(["Review", warning]);
  }
  return new Blob([await workbook.xlsx.writeBuffer()], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

export async function fetchTransactionEvidence(documentId, attachment, signal) {
  if (!attachment.attachmentId)
    throw new Error(
      "This legacy attachment has no verified download identity.",
    );
  const response = await fetch(
    `/api/ixi/financial/documents/${encodeURIComponent(documentId)}/attachments/${encodeURIComponent(attachment.attachmentId)}`,
    { credentials: "include", signal },
  );
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(
      data?.errors?.[0]?.message ||
        "Supporting evidence could not be downloaded.",
    );
  }
  const payload = await response.json();
  if (!payload?.ok || !payload.data?.downloadUrl)
    throw new Error("Verified download link was not returned.");
  const fileResponse = await fetch(payload.data.downloadUrl, {
    credentials: "omit",
    referrerPolicy: "no-referrer",
    signal,
  });
  if (!fileResponse.ok)
    throw new Error("Evidence download expired or failed. Please retry.");
  const blob = await fileResponse.blob();
  const checksum = payload.data.checksumSha256;
  if (checksum) {
    const hash = new Uint8Array(
      await crypto.subtle.digest("SHA-256", await blob.arrayBuffer()),
    );
    if (btoa(String.fromCharCode(...hash)) !== checksum)
      throw new Error("Evidence checksum does not match the verified record.");
  }
  if (blob.size !== Number(payload.data.sizeBytes))
    throw new Error("Evidence size does not match the verified download.");
  if (attachment.sizeBytes && blob.size !== Number(attachment.sizeBytes))
    throw new Error("Evidence size does not match the verified record.");
  return blob;
}

async function sha256(blob) {
  const bytes = new Uint8Array(
    await crypto.subtle.digest("SHA-256", await blob.arrayBuffer()),
  );
  return [...bytes]
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}

export async function createMachinePackage({
  rows,
  context,
  entity,
  ledger,
  onProgress = () => {},
  signal,
}) {
  const { default: JSZip } = await import("jszip");
  const zip = new JSZip();
  const generatedAt = new Date().toISOString();
  const manifest = {
    schema: "ixi-transact-machine-package.v1",
    generatedAt,
    passportId: context.passportId,
    objectId: context.sourceId || context.id,
    recordCount: rows.length,
    complete: true,
    entries: [],
    missingEvidence: [],
  };
  let totalBytes = 0;
  async function add(name, blob) {
    totalBytes += blob.size;
    if (totalBytes > 200 * 1024 * 1024)
      throw new Error(
        "This package exceeds 200 MB. Export fewer selected records at a time.",
      );
    zip.file(name, await blob.arrayBuffer());
    manifest.entries.push({
      path: name,
      sizeBytes: blob.size,
      sha256: await sha256(blob),
    });
  }
  await add(
    "machine-summary.pdf",
    await createTransactionPdf({
      rows: [],
      context,
      entity,
      ledger,
      generatedAt,
    }),
  );
  await add(
    "transactions.csv",
    new Blob([machineCsv(rows, context, entity)], { type: "text/csv" }),
  );
  await add(
    "transactions.xlsx",
    await createTransactionWorkbook(rows, context, entity, ledger),
  );
  await add(
    "transactions.json",
    new Blob(
      [
        JSON.stringify(
          {
            schema: "ixi-transact-record-export.v1",
            generatedAt,
            passportId: context.passportId,
            records: rows.map((row) => ({
              revision: row.revision,
              financialDocument: exportDocumentSnapshot(row.document),
            })),
          },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    ),
  );
  for (const [index, row] of rows.entries()) {
    signal?.throwIfAborted();
    onProgress(`Preparing transaction ${index + 1} of ${rows.length}…`);
    const stem = `${safeFileName(row.title)}-${safeFileName(row.id)}`;
    await add(
      `records/${stem}.pdf`,
      await createTransactionPdf({ rows: [row], context, entity, generatedAt }),
    );
    try {
      const history = await loadIXIAosFinancialHistory(row.id, { signal });
      await add(
        `history/${safeFileName(row.id)}.json`,
        new Blob(
          [
            JSON.stringify(
              exportDocumentSnapshot({
                financialDocumentId: row.id,
                exportedRevision: row.revision,
                history,
              }),
              null,
              2,
            ),
          ],
          { type: "application/json" },
        ),
      );
    } catch (error) {
      if (error.name === "AbortError" || /exceeds 200 MB/.test(error.message))
        throw error;
      manifest.complete = false;
      manifest.missingEvidence.push({
        financialDocumentId: row.id,
        fileName: "revision-history.json",
        reason: error.message,
      });
    }
    for (const attachment of recordEvidence(row.document)) {
      signal?.throwIfAborted();
      try {
        const blob = await fetchTransactionEvidence(row.id, attachment, signal);
        await add(
          `evidence/${safeFileName(row.id)}/${safeFileName(attachment.attachmentId)}-${safeFileName(attachment.fileName || attachment.title)}`,
          blob,
        );
      } catch (error) {
        if (error.name === "AbortError" || /exceeds 200 MB/.test(error.message))
          throw error;
        manifest.complete = false;
        manifest.missingEvidence.push({
          financialDocumentId: row.id,
          attachmentId: attachment.attachmentId || "",
          fileName: attachment.fileName || "",
          reason: error.message,
        });
      }
    }
  }
  await add(
    "README.txt",
    new Blob(
      [
        `IXI TRAN$ACT machine package\nPassport: ${context.passportId}\nGenerated: ${generatedAt}\n${manifest.complete ? "All referenced evidence was included." : "INCOMPLETE EVIDENCE: inspect missingEvidence in contents.json."}\nData files and this README are listed with SHA-256 checksums in contents.json. The manifest excludes itself.\nFinancial documents and revisions are snapshots from the current view. Later changes may exist.\n`,
      ],
      { type: "text/plain" },
    ),
  );
  zip.file("contents.json", JSON.stringify(manifest, null, 2));
  return {
    blob: await zip.generateAsync({ type: "blob", compression: "DEFLATE" }),
    manifest,
  };
}
