import { useState } from "react";
import { recordEvidence, safeFileName } from "./IXITransactExportModel.mjs";
import styles from "./IXITransactWorkspace.module.css";

export default function IXITransactEvidence({ document }) {
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const evidence = recordEvidence(document);
  async function download(item) {
    setBusy(item.attachmentId);
    setError("");
    try {
      const { fetchTransactionEvidence, downloadBlob } =
        await import("./IXITransactDocumentDownload");
      downloadBlob(
        await fetchTransactionEvidence(document.financialDocumentId, item),
        safeFileName(item.fileName || item.title || "evidence"),
      );
    } catch (problem) {
      setError(problem.message || "Evidence download failed. Please retry.");
    } finally {
      setBusy("");
    }
  }
  return (
    <div data-transact-read-only-controls>
      {evidence.length ? (
        <ul className={styles.sharePreview}>
          {evidence.map((item, index) => (
            <li key={item.attachmentId || index}>
              <strong>{item.fileName || item.title || "Attachment"}</strong>
              <span>{item.status || "Recorded evidence"}</span>
              <div className={styles.actions}>
                <button
                  type="button"
                  disabled={Boolean(busy) || !item.attachmentId}
                  onClick={() => download(item)}
                >
                  {busy === item.attachmentId
                    ? "DOWNLOADING…"
                    : "DOWNLOAD EVIDENCE"}
                </button>
              </div>
              {!item.attachmentId ? (
                <span>
                  This legacy attachment has no verified download identity.
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p>No supporting attachments were returned for this transaction.</p>
      )}
      {error ? (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
