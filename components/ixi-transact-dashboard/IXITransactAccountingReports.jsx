import { useState } from "react";
import { downloadBlob } from "../ixi-command-center/IXITransactDocumentDownload";
import styles from "../ixi-command-center/IXIAosCommandCenter.module.css";

export function accountingReportRows(key, report = {}) {
  const data = report.data || {};
  if (key === "profitAndLoss") return [["Revenue", data.revenue], ["Cost of goods sold", data.cogs], ["Gross profit", data.grossProfit], ["Operating expense", data.operatingExpense], ["Net income", data.netIncome]];
  if (key === "balanceSheet") return [["Assets", data.assets], ["Liabilities", data.liabilities], ["Contributed equity", data.contributedEquity], ["Cumulative earnings", data.currentEarnings], ["Total equity", data.equity], ["Liabilities + equity", data.liabilitiesAndEquity], ["Difference", data.difference]];
  if (key === "trialBalance") return (data.rows || []).map(row => [`${row.accountCode || row.code} · ${row.accountName || row.name}`, row.balance]);
  return (data.exceptions || []).map(item => [item.code?.replaceAll("_", " "), item.amount ?? null, item.financialDocumentId]);
}

export default function IXITransactAccountingReports({ reports = {}, initialReport = "profitAndLoss", currency = "USD", period = "", entity = {}, onOpenRecord }) {
  const [key, setKey] = useState(initialReport);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const report = reports[key];
  const rows = accountingReportRows(key, report);
  const format = value => value == null ? "—" : new Intl.NumberFormat("en-US", { style: "currency", currency }).format(value);

  async function download(type) {
    setBusy(true); setError("");
    try {
      const name = `TRANSACT-${key}-${period}`;
      const title = `${entity?.displayName || "IXI TRAN$ACT"} · ${report.title} · ${period}`;
      if (type === "csv") {
        const cell = value => `"${(typeof value === "number" ? String(value) : String(value ?? "").replace(/^[=+@\t\r-]/, "'$&")).replaceAll('"', '""')}"`;
        const content = [[title], ["Account / control", `Amount (${currency})`, "Source transaction"], ...rows].map(row => row.map(cell).join(",")).join("\r\n");
        downloadBlob(new Blob(["\uFEFF", content], { type: "text/csv;charset=utf-8" }), `${name}.csv`);
      } else {
        const [{ PDFDocument, rgb }, { default: fontkit }] = await Promise.all([import("pdf-lib"), import("@pdf-lib/fontkit")]);
        const response = await fetch("/fonts/IXI-Document-Sans.ttf");
        if (!response.ok) throw new Error("Document font could not be loaded. Retry the download.");
        const pdf = await PDFDocument.create(); pdf.registerFontkit(fontkit);
        const font = await pdf.embedFont(await response.arrayBuffer(), { subset: false });
        let page, y;
        const wrap = (text, width, size = 9) => {
          const lines = []; let line = "";
          for (const character of String(text || "")) {
            if (line && font.widthOfTextAtSize(line + character, size) > width) { lines.push(line); line = ""; }
            line += character;
          }
          if (line) lines.push(line);
          return lines;
        };
        const pageStart = () => {
          page = pdf.addPage([612, 792]);
          page.drawText("IXI TRAN$ACT", { x: 40, y: 752, size: 15, font });
          page.drawText(report.title, { x: 40, y: 730, size: 12, font });
          y = 711;
          for (const line of wrap(entity?.displayName || "", 530)) { page.drawText(line, { x: 40, y, size: 9, font }); y -= 13; }
          page.drawText(`${period} · ${currency} · Posted general ledger`, { x: 40, y, size: 9, font });
          y -= 16;
        };
        pageStart();
        for (const [label, value, id] of rows) {
          const lines = wrap(label || "Control", 390);
          const height = Math.max(24, lines.length * 13 + 10) + (id ? 12 : 0);
          if (y - height < 65) pageStart();
          y -= 18;
          const amount = format(value); page.drawText(amount, { x: 572 - font.widthOfTextAtSize(amount, 9), y, size: 9, font });
          for (const line of lines) { page.drawText(line, { x: 40, y, size: 9, font }); y -= 13; }
          if (id) { page.drawText(id, { x: 40, y, size: 7, font, color: rgb(.35, .35, .35) }); y -= 12; }
          y -= 3;
        }
        pdf.getPages().forEach((sheet, index, pages) => sheet.drawText(`IXI TRAN$ACT · ${index + 1} / ${pages.length}`, { x: 40, y: 30, size: 8, font }));
        pdf.setTitle(title);
        downloadBlob(new Blob([await pdf.save()], { type: "application/pdf" }), `${name}.pdf`);
      }
    } catch (cause) { setError(cause.message || "Report download failed. Please retry."); }
    finally { setBusy(false); }
  }

  return <section className={styles.workPanel} aria-label="Accounting reports">
    <div className={styles.workspaceHeader}><div><h2>{report?.title || "ACCOUNTING REPORTS"}</h2><p>{entity?.displayName} · {period} · Posted general ledger</p></div><div className={styles.workspaceHeaderActions}><button type="button" disabled={!report || busy} onClick={() => download("pdf")}>DOWNLOAD PDF</button><button type="button" disabled={!report || busy} onClick={() => download("csv")}>EXPORT CSV</button></div></div>
    <div className={styles.workspaceHeaderActions}>{Object.entries(reports).map(([id, item]) => <button type="button" aria-pressed={key === id} key={id} onClick={() => setKey(id)}>{item.title}</button>)}</div>
    {error ? <p role="alert">{error}</p> : null}
    {!report ? <p>Accounting reports have not been returned for this scope. Select the company and refresh.</p> : <div className={styles.tableWrap}><table className={styles.dataTable}><thead><tr><th>ACCOUNT / CONTROL</th><th>AMOUNT ({currency})</th><th>SOURCE</th></tr></thead><tbody>{rows.map(([label, value, id], index) => <tr key={`${label}:${id || index}`}><td>{label}</td><td>{format(value)}</td><td>{id && onOpenRecord ? <button type="button" onClick={() => onOpenRecord({ title: id, document: { financialDocumentId: id } })}>VIEW TRANSACTION</button> : id || "—"}</td></tr>)}</tbody></table>{!rows.length ? <p>{key === "closeReview" ? "No accounting exceptions returned." : "No posted account activity returned."}</p> : null}</div>}
  </section>;
}
