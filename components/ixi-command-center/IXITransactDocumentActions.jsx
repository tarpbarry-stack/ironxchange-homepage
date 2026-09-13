import { useEffect, useRef, useState } from "react";
import {
  machineCsv,
  safeFileName,
  transactionLink,
} from "./IXITransactExportModel.mjs";
import { moneyLabel } from "./IXITransactMachineLedger.mjs";
import styles from "./IXITransactWorkspace.module.css";

export default function IXITransactDocumentActions({
  rows = [],
  allRows = rows,
  selectedRows = [],
  context = {},
  entity = {},
  ledger,
  single = false,
  disabled = false,
}) {
  const [scope, setScope] = useState("view");
  const [format, setFormat] = useState("pdf");
  const [busy, setBusy] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [sharing, setSharing] = useState(false);
  const [recipient, setRecipient] = useState("");
  const [channel, setChannel] = useState("email");
  const dialog = useRef(null);
  const controller = useRef(null);
  const selectionCount = useRef(0);
  useEffect(() => {
    if (selectionCount.current !== selectedRows.length) {
      setScope(selectedRows.length ? "selected" : "view");
      selectionCount.current = selectedRows.length;
    }
  }, [selectedRows.length]);
  const chosen =
    scope === "all" ? allRows : scope === "selected" ? selectedRows : rows;
  useEffect(() => () => controller.current?.abort(), []);
  useEffect(() => {
    if (sharing) dialog.current?.showModal();
  }, [sharing]);
  const stem =
    single && chosen[0]
      ? safeFileName(chosen[0].title)
      : safeFileName(context.title || context.passportId || "TRANSACT");

  async function prepare(mode = format) {
    const engine = await import("./IXITransactDocumentDownload");
    const args = {
      rows: chosen,
      context,
      entity,
      ledger: single ? undefined : ledger,
    };
    if (mode === "csv")
      return {
        blob: new Blob([machineCsv(chosen, context, entity)], {
          type: "text/csv;charset=utf-8",
        }),
        name: `${stem}.csv`,
      };
    if (mode === "xlsx")
      return {
        blob: await engine.createTransactionWorkbook(
          chosen,
          context,
          entity,
          ledger,
        ),
        name: `${stem}.xlsx`,
      };
    if (mode === "zip") {
      controller.current = new AbortController();
      const result = await engine.createMachinePackage({
        ...args,
        ledger,
        signal: controller.current.signal,
        onProgress: setBusy,
      });
      return {
        ...result,
        name: `${stem}${result.manifest.complete ? "" : "-INCOMPLETE-EVIDENCE"}.zip`,
      };
    }
    return {
      blob: await engine.createTransactionPdf(args),
      name: `${stem}.pdf`,
    };
  }

  async function download() {
    if (!chosen.length || busy) return;
    setBusy("Preparing download…");
    setError("");
    setStatus("");
    try {
      const result = await prepare();
      const { downloadBlob } = await import("./IXITransactDocumentDownload");
      downloadBlob(result.blob, result.name);
      setStatus(
        result.manifest?.complete === false
          ? `Package downloaded with ${result.manifest.missingEvidence.length} unavailable supporting file(s). The filename and contents manifest mark the missing evidence.`
          : `Download prepared: ${result.name} · ${chosen.length} transaction(s).`,
      );
    } catch (problem) {
      if (problem.name !== "AbortError")
        setError(problem.message || "Download failed. Please retry.");
      else setStatus("Download cancelled.");
    } finally {
      setBusy("");
    }
  }

  async function shareFile() {
    setBusy("Preparing PDF to share…");
    setError("");
    setStatus("");
    try {
      const result = await prepare("pdf");
      const file = new File([result.blob], result.name, {
        type: "application/pdf",
      });
      if (!navigator.canShare?.({ files: [file] }))
        throw new Error(
          "File sharing is unavailable in this browser. Download the PDF and attach it in your email or messaging app.",
        );
      await navigator.share({
        files: [file],
        title: context.title || "IXI TRAN$ACT",
      });
      setStatus(
        "Share handoff completed. Recipient delivery is not confirmed by TRAN$ACT.",
      );
    } catch (problem) {
      if (problem.name === "AbortError") setStatus("Sharing cancelled.");
      else setError(problem.message);
    } finally {
      setBusy("");
    }
  }

  function handoff() {
    setError("");
    const target = recipient.trim();
    const links = chosen.map((row) =>
      transactionLink(context, row, window.location.origin),
    );
    const body = `IXI TRAN$ACT · ${context.title}\n${chosen.length} transaction(s)\n${chosen.map((row, index) => `${row.title}\n${links[index]}`).join("\n\n")}\n\nSign in with authorized access to view these private financial records.`;
    if (body.length > 7000) {
      setError(
        "This selection is too large for a message link. Share a PDF or download the machine package.",
      );
      return;
    }
    let href;
    if (channel === "email") {
      if (!/^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/.test(target)) {
        setError("Enter one valid email address.");
        return;
      }
      href = `mailto:${encodeURIComponent(target)}?subject=${encodeURIComponent(`IXI TRAN$ACT · ${context.title}`)}&body=${encodeURIComponent(body)}`;
    } else {
      const phone = target.replace(/[ ()-]/g, "");
      if (!/^\+[1-9]\d{7,14}$/.test(phone)) {
        setError(
          "Enter a phone number including its country code, such as +1…",
        );
        return;
      }
      href =
        channel === "sms"
          ? `sms:${phone}?body=${encodeURIComponent(body)}`
          : `https://wa.me/${phone.slice(1)}?text=${encodeURIComponent(body)}`;
    }
    if (channel === "whatsapp")
      window.open(href, "_blank", "noopener,noreferrer");
    else window.location.href = href;
    setStatus(
      "Message handoff opened. Review and send it in your messaging app. Delivery is not confirmed by TRAN$ACT.",
    );
  }

  return (
    <div className={styles.documentActions} data-transact-read-only-controls>
      <div className={styles.actions}>
        {!single ? (
          <label>
            EXPORT SCOPE
            <select
              aria-label="Export scope"
              value={scope}
              disabled={Boolean(busy)}
              onChange={(event) => setScope(event.target.value)}
            >
              <option value="view">Filtered view ({rows.length})</option>
              <option value="selected" disabled={!selectedRows.length}>
                Selected ({selectedRows.length})
              </option>
              <option value="all">Whole history ({allRows.length})</option>
            </select>
          </label>
        ) : null}
        <label>
          FORMAT
          <select
            aria-label="Download format"
            value={format}
            disabled={Boolean(busy)}
            onChange={(event) => setFormat(event.target.value)}
          >
            <option value="pdf">PDF / Print</option>
            <option value="csv">CSV</option>
            <option value="xlsx">Excel</option>
            <option value="zip">Package + evidence</option>
          </select>
        </label>
        <button
          type="button"
          disabled={disabled || !chosen.length || Boolean(busy)}
          onClick={download}
        >
          DOWNLOAD
        </button>
        <button
          type="button"
          disabled={disabled || !chosen.length || Boolean(busy)}
          onClick={() => {
            setSharing(true);
            setError("");
            setStatus("");
          }}
        >
          SEND
        </button>
        {busy && format === "zip" ? (
          <button type="button" onClick={() => controller.current?.abort()}>
            CANCEL DOWNLOAD
          </button>
        ) : null}
      </div>
      {busy ? (
        <p role="status">{busy}</p>
      ) : status ? (
        <p role="status">{status}</p>
      ) : null}
      {error ? (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      ) : null}
      {sharing ? (
        <dialog
          ref={dialog}
          className={styles.dialog}
          aria-labelledby="send-transactions-title"
          onCancel={() => setSharing(false)}
        >
          <h2 id="send-transactions-title">Send transactions</h2>
          <p>
            {context.title} · {chosen.length} selected
          </p>
          <ul className={styles.sharePreview}>
            {chosen.map((row) => (
              <li key={row.id}>
                <strong>{row.title}</strong>
                <span>
                  {row.party} · {moneyLabel(row.amountCents, row.currency)}
                </span>
              </li>
            ))}
          </ul>
          <p>
            Share a PDF, or send links that require the recipient to sign in
            with permission to view these records.
          </p>
          <div className={styles.actions}>
            <button type="button" disabled={Boolean(busy)} onClick={shareFile}>
              SHARE PDF FILE
            </button>
            <button
              type="button"
              disabled={Boolean(busy)}
              onClick={async () => {
                setFormat("pdf");
                setBusy("Preparing PDF…");
                try {
                  const result = await prepare("pdf");
                  const engine = await import("./IXITransactDocumentDownload");
                  engine.downloadBlob(result.blob, result.name);
                  setStatus("PDF downloaded. Attach it in your messaging app.");
                } catch (problem) {
                  setError(problem.message);
                } finally {
                  setBusy("");
                }
              }}
            >
              DOWNLOAD PDF TO ATTACH
            </button>
          </div>
          <label>
            CHANNEL
            <select
              value={channel}
              onChange={(event) => {
                setChannel(event.target.value);
                setRecipient("");
              }}
            >
              <option value="email">Email</option>
              <option value="sms">Text message</option>
              <option value="whatsapp">WhatsApp</option>
            </select>
          </label>
          <label>
            {channel === "email" ? "RECIPIENT EMAIL" : "RECIPIENT PHONE"}
            <input
              type={channel === "email" ? "email" : "tel"}
              value={recipient}
              onChange={(event) => setRecipient(event.target.value)}
            />
          </label>
          {error ? (
            <p role="alert" className={styles.error}>
              {error}
            </p>
          ) : null}
          {status || busy ? <p role="status">{busy || status}</p> : null}
          <div className={styles.actions}>
            <button type="button" disabled={Boolean(busy)} onClick={handoff}>
              OPEN{" "}
              {channel === "email"
                ? "EMAIL"
                : channel === "sms"
                  ? "TEXT MESSAGE"
                  : "WHATSAPP"}
            </button>
            <button type="button" autoFocus onClick={() => setSharing(false)}>
              CLOSE
            </button>
          </div>
        </dialog>
      ) : null}
    </div>
  );
}
