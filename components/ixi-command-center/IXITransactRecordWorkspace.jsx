import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { loadIXIAosFinancialDocument, loadIXIAosFinancialHistory } from "../ixi-aos/financial-runtime/IXIAosFinancialReadClient";
import { getIXITransactModules } from "../ixi-aos/transact/IXITransactModuleRegistry";
import { normalizeIXITransactPassportRecords } from "../ixi-transact-dashboard/data/IXITransactPassportRecordProjection.mjs";
import { buildIXITransactRecordView, linkedIXITransactRecordIds, recordDocument, verifyIXITransactSelectedRecord } from "./IXITransactRecordViewModel";
import { formatIXIMoney } from "./IXIAosCommandCenterModel";
import styles from "./IXIAosCommandCenter.module.css";

const IXITransactApp = dynamic(() => import("../ixi-aos/transact/IXITransactApp"), {
  ssr: false,
  loading: () => <p role="status">Opening the saved worksheet…</p>
});
const clean = value => String(value ?? "").trim();
const array = value => Array.isArray(value) ? value : [];
const label = value => clean(value).replace(/[-_]/g, " ").toUpperCase();
const date = value => {
  const raw = clean(value);
  if (!raw) return "—";
  return /^\d{4}-\d{2}-\d{2}/.test(raw) ? raw.slice(0, 10) : raw;
};

export default function IXITransactRecordWorkspace({ financialDocumentId, object, actor, entity, permissions = [], financialRecords = [], onBack, onOpenRecord, onFinancialRecordsChange }) {
  const [record, setRecord] = useState(null);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [details, setDetails] = useState(false);
  const [history, setHistory] = useState(null);
  const [historyError, setHistoryError] = useState("");
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyAttempt, setHistoryAttempt] = useState(0);
  const heading = useRef(null);

  useEffect(() => {
    const controller = new AbortController();
    setRecord(null);
    setError("");
    setHistory(null);
    setHistoryError("");
    heading.current?.focus();
    loadIXIAosFinancialDocument({ financialDocumentId, signal: controller.signal })
      .then(result => {
        verifyIXITransactSelectedRecord(result, financialDocumentId);
        if (!controller.signal.aborted) setRecord(result);
      })
      .catch(problem => {
        if (!controller.signal.aborted) setError(problem?.message || "The saved transaction could not be loaded.");
      });
    return () => controller.abort();
  }, [financialDocumentId, refresh]);

  const view = useMemo(() => record ? buildIXITransactRecordView({ record, financialDocumentId, object, financialRecords }) : null, [record, financialDocumentId, object, financialRecords]);
  const modules = getIXITransactModules({ objectType: object?.objectType || object?.kind || "object", permissions });
  const module = modules.find(item => item.id === view?.moduleId);
  const showDetails = !module || details;
  const document = view?.document || {};
  const summary = normalizeIXITransactPassportRecords(record ? [record] : [])[0];
  const currency = document.currency || "USD";
  const links = linkedIXITransactRecordIds(document);

  useEffect(() => {
    if (!record || !showDetails) return undefined;
    const controller = new AbortController();
    setHistoryLoading(true);
    setHistoryError("");
    loadIXIAosFinancialHistory(financialDocumentId, { signal: controller.signal })
      .then(result => { if (!controller.signal.aborted) setHistory(array(result)); })
      .catch(problem => { if (!controller.signal.aborted) setHistoryError(problem?.message || "Revision history could not be loaded."); })
      .finally(() => { if (!controller.signal.aborted) setHistoryLoading(false); });
    return () => controller.abort();
  }, [record, financialDocumentId, showDetails, historyAttempt]);

  const field = (name, value) => <div><dt>{name}</dt><dd>{clean(value) || "—"}</dd></div>;
  return <section className={styles.workPanel} aria-label="Selected transaction record">
    <div className={styles.workspaceHeader}>
      <div><span>SAVED TRANSACTION</span><h2 ref={heading} tabIndex={-1}>{summary?.title || "OPENING RECORD"}</h2><p>{document.description || document.memo || financialDocumentId}</p></div>
      <div className={styles.workspaceHeaderActions}>
        <button type="button" className={styles.rowAction} onClick={onBack}>‹ HISTORY</button>
        {module ? <button type="button" className={styles.rowAction} onClick={() => setDetails(value => !value)}>{details ? "OPEN WORKSHEET" : "RECORD DETAILS"}</button> : null}
      </div>
    </div>
    {error ? <div className={styles.errorBanner} role="alert"><strong>RECORD UNAVAILABLE</strong><span>{error}</span><button type="button" className={styles.rowAction} onClick={() => setRefresh(value => value + 1)}>RETRY</button></div> : !record ? <div className={styles.loadingState} role="status">Loading the selected saved transaction…</div> : <>
      <div className={styles.recordIdentity}><span>{summary.status}</span><span>REVISION {view.server.revision || "—"}</span><code>{financialDocumentId}</code></div>
      {module && !details ? <div className={styles.embeddedWorkspace}>
        <IXITransactApp
          {...view.props}
          key={`${financialDocumentId}:${refresh}`}
          workspaceEmbedded
          initialModuleId={module.id}
          actor={actor}
          entity={entity}
          permissions={permissions}
          onClose={onBack}
          onFinancialRecordsChange={() => { setRefresh(value => value + 1); return onFinancialRecordsChange?.(); }}
        />
      </div> : <div className={styles.recordDetails}>
        <dl className={styles.recordFields}>
          {field("TYPE", label(document.documentType))}
          {field("STATUS", summary.status)}
          {field("AMOUNT", summary.amount == null ? "—" : formatIXIMoney(summary.amount, currency))}
          {field("TRANSACTION DATE", date(document.occurredAt))}
          {field("PARTY / SOURCE", summary.party)}
          {field("DUE DATE", date(document.dueDate || document.dueAt))}
          {document.paymentMethod ? field("PAYMENT METHOD", label(document.paymentMethod)) : null}
          {document.transactionReference ? field("PAYMENT REFERENCE", document.transactionReference) : null}
          {field("CREATED", date(view.server.createdAt))}
          {field("UPDATED", date(view.server.updatedAt))}
        </dl>
        <h3>LINE ITEMS</h3>
        {array(document.lines).length ? <div className={styles.tableWrap}><table className={styles.dataTable}><thead><tr><th>DESCRIPTION</th><th>TYPE</th><th>QUANTITY</th><th>DIRECTION</th><th>AMOUNT</th></tr></thead><tbody>{document.lines.map((line, index) => <tr key={line.financialLineId || index}><td>{line.description || "—"}</td><td>{label(line.lineType)}</td><td>{line.quantity ?? "—"}</td><td>{label(line.direction) || "—"}</td><td>{line.amount == null ? "—" : formatIXIMoney(line.amount, line.currency || currency)}</td></tr>)}</tbody></table></div> : <p>No line items were returned for this record.</p>}
        {document.memo ? <><h3>NOTES</h3><p>{document.memo}</p></> : null}
        {array(document.references).length ? <><h3>CONNECTED RECORDS</h3><dl className={styles.recordFields}>{document.references.map((reference, index) => <div key={`${reference.passportId}:${reference.role}:${index}`}><dt>{label(reference.role)}</dt><dd>{reference.label || reference.passportId || "—"}{reference.label && reference.passportId ? <small>{reference.passportId}</small> : null}</dd></div>)}</dl></> : null}
        {links.length ? <><h3>RELATED TRANSACTIONS</h3><div className={styles.recordLinks}>{links.map(id => {
          const linked = financialRecords.find(item => recordDocument(item)?.financialDocumentId === id);
          const title = recordDocument(linked)?.documentNumber || id;
          return <button type="button" className={styles.rowAction} key={id} onClick={() => onOpenRecord?.({ id, title, document: { financialDocumentId: id } })}>VIEW {title}</button>;
        })}</div></> : null}
        <h3>EVIDENCE</h3>
        {array(document.attachments).length ? <ul>{document.attachments.map((attachment, index) => <li key={attachment.attachmentId || index}>{attachment.fileName || attachment.name || "Attachment"} · {label(attachment.status || attachment.type)}</li>)}</ul> : <p>No attachments were returned for this record.</p>}
        <h3>REVISION HISTORY</h3>
        {historyError ? <div role="alert"><p>{historyError}</p><button type="button" className={styles.rowAction} onClick={() => setHistoryAttempt(value => value + 1)}>RETRY HISTORY</button></div> : historyLoading ? <p role="status">Loading revision history…</p> : history?.length ? <ol className={styles.recordHistory}>{history.map((entry, index) => <li key={`${entry.revision}:${index}`}><strong>REVISION {entry.revision || "—"} · {label(entry.operation)}</strong><span>{date(entry.recordedAt)}{entry.actorPassportId ? ` · ${entry.actorPassportId}` : ""}</span></li>)}</ol> : <p>No revision history was returned.</p>}
      </div>}
    </>}
  </section>;
}
