import { useMemo, useState } from "react";

import {
  IXI_PURCHASE_ACTIONS,
  evaluateIXIPurchaseRuntime
} from "./IXIPurchasePolicyEngine";

import {
  getIXIPurchaseDisplayNumber
} from "./IXIPurchaseRecordEngine";

import IXIPurchaseCardStyles from "./IXIPurchaseCardStyles";

const clean = value => String(value ?? "").trim();
const money = value => `$${Number(value || 0).toLocaleString(undefined, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
})}`;

const COPY = {
  en: {
    face1: "ORDER",
    face2: "RECEIVE / COST",
    face3: "HISTORY / RELATED",
    requestedBy: "REQUESTED BY",
    date: "DATE",
    vendor: "VENDOR",
    neededBy: "NEEDED BY",
    shipTo: "SHIP TO",
    what: "WHAT DO YOU NEED?",
    why: "WHY DO YOU NEED IT?",
    items: "ITEMS",
    estTotal: "EST. TOTAL",
    approval: "APPROVAL",
    status: "STATUS",
    amount: "AMOUNT",
    authority: "REQUIRED AUTHORITY",
    currentApprover: "CURRENT APPROVER",
    deny: "DENY",
    returned: "RETURN",
    approve: "APPROVE",
    recommend: "RECOMMEND APPROVAL",
    issue: "ISSUE PO",
    send: "SEND PO",
    cancel: "CANCEL REQUEST",
    edit: "EDIT REQUEST",
    receiving: "RECEIVING STATUS",
    ordered: "ORDERED",
    received: "RECEIVED",
    remaining: "REMAINING",
    receive: "+ ADD RECEIPT",
    closeShort: "CLOSE REMAINDER",
    costs: "COST SUMMARY",
    estimated: "ESTIMATED (REQUEST)",
    committed: "COMMITTED (PO)",
    billed: "BILLED (INVOICE)",
    paid: "PAID",
    variance: "VARIANCE (BILLED VS COMM.)",
    varianceApproval: "VARIANCE APPROVAL",
    varianceRequired: "APPROVAL REQUIRED",
    varianceApproved: "APPROVED",
    approveVariance: "APPROVE VARIANCE",
    bills: "BILLS / INVOICES",
    matchBill: "VIEW BILL / MATCH",
    history: "ACTIVITY TIMELINE",
    related: "RELATED",
    addNote: "+ ADD NOTE",
    saveReceipt: "RECORD RECEIPT",
    saveBill: "MATCH BILL",
    saveNote: "SAVE NOTE",
    invoiceNumber: "INVOICE NUMBER",
    invoiceAmount: "INVOICE AMOUNT",
    note: "NOTE / REASON",
    receiveQty: "RECEIVE QTY",
    noBills: "NO BILLS MATCHED",
    noRelated: "NO RELATED RECORDS",
    costRestricted: "COST VISIBILITY RESTRICTED BY COMPANY POLICY",
    cancelWord: "CANCEL",
    confirm: "CONFIRM"
  },
  es: {
    face1: "PEDIDO",
    face2: "RECIBO / COSTO",
    face3: "HISTORIAL / RELACIONADO",
    requestedBy: "SOLICITADO POR",
    date: "FECHA",
    vendor: "PROVEEDOR",
    neededBy: "FECHA NECESARIA",
    shipTo: "ENVIAR A",
    what: "¿QUÉ NECESITA?",
    why: "¿POR QUÉ LO NECESITA?",
    items: "ARTÍCULOS",
    estTotal: "TOTAL EST.",
    approval: "APROBACIÓN",
    status: "ESTADO",
    amount: "IMPORTE",
    authority: "AUTORIDAD REQUERIDA",
    currentApprover: "APROBADOR ACTUAL",
    deny: "RECHAZAR",
    returned: "DEVOLVER",
    approve: "APROBAR",
    recommend: "RECOMENDAR APROBACIÓN",
    issue: "EMITIR OC",
    send: "ENVIAR OC",
    cancel: "CANCELAR SOLICITUD",
    edit: "EDITAR SOLICITUD",
    receiving: "ESTADO DE RECEPCIÓN",
    ordered: "PEDIDO",
    received: "RECIBIDO",
    remaining: "RESTANTE",
    receive: "+ AGREGAR RECEPCIÓN",
    closeShort: "CERRAR RESTANTE",
    costs: "RESUMEN DE COSTOS",
    estimated: "ESTIMADO (SOLICITUD)",
    committed: "COMPROMETIDO (OC)",
    billed: "FACTURADO (FACTURA)",
    paid: "PAGADO",
    variance: "VARIACIÓN (FACTURADO VS COMP.)",
    varianceApproval: "APROBACIÓN DE VARIACIÓN",
    varianceRequired: "APROBACIÓN REQUERIDA",
    varianceApproved: "APROBADA",
    approveVariance: "APROBAR VARIACIÓN",
    bills: "FACTURAS",
    matchBill: "VER FACTURA / CONCILIAR",
    history: "LÍNEA DE TIEMPO DE ACTIVIDADES",
    related: "RELACIONADO",
    addNote: "+ AGREGAR NOTA",
    saveReceipt: "REGISTRAR RECEPCIÓN",
    saveBill: "CONCILIAR FACTURA",
    saveNote: "GUARDAR NOTA",
    invoiceNumber: "NÚMERO DE FACTURA",
    invoiceAmount: "IMPORTE DE FACTURA",
    note: "NOTA / MOTIVO",
    receiveQty: "CANT. RECIBIDA",
    noBills: "SIN FACTURAS CONCILIADAS",
    noRelated: "SIN REGISTROS RELACIONADOS",
    costRestricted: "VISIBILIDAD DE COSTOS RESTRINGIDA POR POLÍTICA",
    cancelWord: "CANCELAR",
    confirm: "CONFIRMAR"
  }
};

const STATUS_LABELS = {
  en: {
    draft: "DRAFT",
    "pending-approval": "PENDING APPROVAL",
    returned: "RETURNED",
    denied: "DENIED",
    approved: "APPROVED",
    "po-issued": "OPEN",
    sent: "SENT",
    "partially-received": "PARTIALLY RECEIVED",
    received: "RECEIVED",
    "bill-match": "BILL MATCH",
    closed: "CLOSED",
    cancelled: "CANCELLED"
  },
  es: {
    draft: "BORRADOR",
    "pending-approval": "PENDIENTE DE APROBACIÓN",
    returned: "DEVUELTO",
    denied: "RECHAZADO",
    approved: "APROBADO",
    "po-issued": "ABIERTO",
    sent: "ENVIADO",
    "partially-received": "PARCIALMENTE RECIBIDO",
    received: "RECIBIDO",
    "bill-match": "CONCILIACIÓN",
    closed: "CERRADO",
    cancelled: "CANCELADO"
  }
};

function statusTone(status) {
  if (["approved", "po-issued", "received", "closed"].includes(status)) {
    return "green";
  }
  if (["denied", "cancelled"].includes(status)) return "red";
  return "";
}

function shortDate(value, lang) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return clean(value) || "—";
  return new Intl.DateTimeFormat(lang === "es" ? "es-MX" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric"
  }).format(date);
}

function FaceOne({ record, runtime, t, lang, onAction, busy }) {
  const items = Array.isArray(record?.purchase?.items)
    ? record.purchase.items
    : [];
  const actions = new Set(runtime.actions || []);
  const [reason, setReason] = useState("");
  const [reasonMode, setReasonMode] = useState("");

  function act(action, payload = {}) {
    return onAction?.(action, payload);
  }

  return (
    <>
      <div className="po-grid2">
        <div className="po-box">
          <span>{t.requestedBy}</span>
          <strong>{record?.purchase?.requestedByLabel || record?.context?.employeeLabel || "—"}</strong>
        </div>
        <div className="po-box">
          <span>{t.date}</span>
          <strong>{shortDate(record?.purchase?.requestedAt, lang)}</strong>
        </div>
      </div>

      <div className="po-kv">
        <span>{t.vendor}</span>
        <strong>{record?.purchase?.vendorLabel || "—"}</strong>
      </div>

      <div className="po-grid2" style={{ marginTop: 4 }}>
        <div className="po-box">
          <span>{t.neededBy}</span>
          <strong>{shortDate(record?.purchase?.neededByDate, lang)}</strong>
        </div>
        <div className="po-box">
          <span>{t.shipTo}</span>
          <strong>{record?.purchase?.shipToLabel || record?.context?.locationLabel || "—"}</strong>
        </div>
      </div>

      <div className="po-section-title">{t.what}</div>
      <div className="po-copy-block">
        {record?.purchase?.whatNeeded || items.map(item => item.description).join(", ") || "—"}
      </div>

      <div className="po-section-title">{t.why}</div>
      <div className="po-copy-block">
        {record?.purchase?.businessReason || record?.purchase?.notes || "—"}
      </div>

      <div className="po-section-title">
        {t.items} ({items.length})
        <span style={{ float: "right", color: "rgba(255,255,255,.38)" }}>
          {t.estTotal} <b className="po-money-good">{money(record?.costs?.estimated)}</b>
        </span>
      </div>

      <table className="po-lines-table">
        <tbody>
          {items.map((item, index) => (
            <tr key={item.lineId || index}>
              <td style={{ width: 14 }}>{index + 1}</td>
              <td>{item.description}</td>
              <td className="num">{item.quantity}</td>
              <td className="num">{money(item.estimatedUnitCost)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="po-section-title">{t.approval}</div>
      <div className="po-approval-box">
        <div className="po-approval-row">
          <span>{t.status}</span>
          <strong>{STATUS_LABELS[lang]?.[record.status] || record.status}</strong>
        </div>
        <div className="po-approval-row">
          <span>{t.amount}</span>
          <strong>{money(runtime.amount)}</strong>
        </div>
        <div className="po-approval-row">
          <span>{t.authority}</span>
          <strong>{record?.approval?.requiredRoleLabel || runtime.approval?.label || "—"}</strong>
        </div>
        <div className="po-approval-row">
          <span>{t.currentApprover}</span>
          <strong>{record?.approval?.currentApproverLabel || "—"}</strong>
        </div>
      </div>

      {reasonMode ? (
        <div className="po-inline-form">
          <label>{t.note}</label>
          <textarea value={reason} onChange={event => setReason(event.target.value)} />
          <div className="po-actions">
            <button type="button" onClick={() => { setReasonMode(""); setReason(""); }}>
              {t.cancelWord}
            </button>
            <button
              type="button"
              onClick={() => {
                act(reasonMode, { reason });
                setReasonMode("");
                setReason("");
              }}
              disabled={busy}
            >
              {t.confirm}
            </button>
          </div>
        </div>
      ) : null}

      <div className="po-actions">
        {actions.has(IXI_PURCHASE_ACTIONS.DENY) ? (
          <button className="deny" type="button" disabled={busy} onClick={() => setReasonMode(IXI_PURCHASE_ACTIONS.DENY)}>{t.deny}</button>
        ) : null}
        {actions.has(IXI_PURCHASE_ACTIONS.RETURN) ? (
          <button type="button" disabled={busy} onClick={() => setReasonMode(IXI_PURCHASE_ACTIONS.RETURN)}>{t.returned}</button>
        ) : null}
        {actions.has(IXI_PURCHASE_ACTIONS.RECOMMEND) ? (
          <button className="approve" type="button" disabled={busy} onClick={() => act(IXI_PURCHASE_ACTIONS.RECOMMEND)}>{t.recommend}</button>
        ) : null}
        {actions.has(IXI_PURCHASE_ACTIONS.APPROVE) ? (
          <button className="approve" type="button" disabled={busy} onClick={() => act(IXI_PURCHASE_ACTIONS.APPROVE)}>{t.approve}</button>
        ) : null}
        {actions.has(IXI_PURCHASE_ACTIONS.ISSUE_PO) ? (
          <button className="approve" type="button" disabled={busy} onClick={() => act(IXI_PURCHASE_ACTIONS.ISSUE_PO)}>{t.issue}</button>
        ) : null}
        {actions.has(IXI_PURCHASE_ACTIONS.SEND_PO) ? (
          <button className="approve" type="button" disabled={busy} onClick={() => act(IXI_PURCHASE_ACTIONS.SEND_PO)}>{t.send}</button>
        ) : null}
        {actions.has(IXI_PURCHASE_ACTIONS.EDIT_REQUEST) ? (
          <button type="button" disabled={busy} onClick={() => act(IXI_PURCHASE_ACTIONS.EDIT_REQUEST)}>{t.edit}</button>
        ) : null}
        {actions.has(IXI_PURCHASE_ACTIONS.CANCEL_REQUEST) ? (
          <button className="deny" type="button" disabled={busy} onClick={() => setReasonMode(IXI_PURCHASE_ACTIONS.CANCEL_REQUEST)}>{t.cancel}</button>
        ) : null}
      </div>
    </>
  );
}

function FaceTwo({ record, runtime, t, onAction, busy }) {
  const lines = Array.isArray(record?.receiving?.lines)
    ? record.receiving.lines
    : [];
  const actions = new Set(runtime.actions || []);
  const [mode, setMode] = useState("");
  const [receipts, setReceipts] = useState(() =>
    Object.fromEntries(lines.map(line => [line.lineId, ""]))
  );
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceAmount, setInvoiceAmount] = useState("");

  function submitReceipt() {
    const payloadLines = lines.map(line => ({
      lineId: line.lineId,
      quantity: Number(receipts[line.lineId] || 0)
    }));

    onAction?.(IXI_PURCHASE_ACTIONS.RECEIVE, { lines: payloadLines });
    setReceipts(Object.fromEntries(lines.map(line => [line.lineId, ""])));
    setMode("");
  }

  function submitBill() {
    onAction?.(IXI_PURCHASE_ACTIONS.MATCH_BILL, {
      invoiceNumber,
      amount: Number(invoiceAmount || 0),
      invoiceDate: new Date().toISOString().slice(0, 10)
    });
    setInvoiceNumber("");
    setInvoiceAmount("");
    setMode("");
  }

  return (
    <>
      <div className="po-section-title">{t.receiving}</div>
      <div className="po-grid2">
        <div className="po-box">
          <span>{t.received}</span>
          <strong>{record?.receiving?.receivedQuantity || 0} / {record?.receiving?.orderedQuantity || 0}</strong>
        </div>
        <div className="po-box">
          <span>STATUS</span>
          <strong>{record?.receiving?.percentReceived || 0}%</strong>
        </div>
      </div>

      <div style={{ marginTop: 4 }}>
        {lines.map(line => (
          <div className="po-receive-row" key={line.lineId}>
            <span>{line.description}</span>
            <b>{line.quantity}</b>
            <b className="po-money-good">{line.receivedQuantity}</b>
            <b className={line.remainingQuantity ? "po-money-warn" : "po-money-good"}>{line.remainingQuantity}</b>
          </div>
        ))}
      </div>

      {mode === "receive" ? (
        <div className="po-inline-form">
          <label>{t.receiveQty}</label>
          {lines.map(line => (
            <div className="po-receive-row" key={line.lineId}>
              <span>{line.description}</span>
              <b>{line.remainingQuantity}</b>
              <b />
              <input
                inputMode="decimal"
                value={receipts[line.lineId] || ""}
                onChange={event => setReceipts(current => ({
                  ...current,
                  [line.lineId]: event.target.value
                }))}
              />
            </div>
          ))}
          <div className="po-actions">
            <button type="button" onClick={() => setMode("")}>{t.cancelWord}</button>
            <button type="button" disabled={busy} onClick={submitReceipt}>{t.saveReceipt}</button>
          </div>
        </div>
      ) : null}

      <div className="po-section-title">{t.costs}</div>
      {runtime.canSeeCosts ? (
        <>
          <div className="po-cost-row"><span>{t.estimated}</span><strong>{money(record?.costs?.estimated)}</strong></div>
          <div className="po-cost-row"><span>{t.committed}</span><strong>{money(record?.costs?.committed)}</strong></div>
          <div className="po-cost-row"><span>{t.billed}</span><strong>{money(record?.costs?.billed)}</strong></div>
          <div className="po-cost-row"><span>{t.paid}</span><strong>{money(record?.costs?.paid)}</strong></div>
          <div className="po-cost-row">
            <span>{t.variance}</span>
            <strong className={Number(record?.costs?.variance || 0) > 0 ? "po-money-bad" : ""}>{money(record?.costs?.variance)}</strong>
          </div>

          {Math.abs(Number(record?.costs?.variance || 0)) > 0 ? (
            <div className="po-approval-box" style={{ marginTop: 6 }}>
              <div className="po-approval-row">
                <span>{t.varianceApproval}</span>
                <strong className={record?.financialControl?.varianceApproved ? "po-money-good" : "po-money-warn"}>
                  {record?.financialControl?.varianceApproved ? t.varianceApproved : t.varianceRequired}
                </strong>
              </div>
              <div className="po-approval-row">
                <span>{t.authority}</span>
                <strong>{runtime?.varianceRequirement?.label || "—"}</strong>
              </div>
            </div>
          ) : null}
        </>
      ) : (
        <div className="po-empty">{t.costRestricted}</div>
      )}

      <div className="po-section-title">{t.bills}</div>
      {(record?.bills || []).length ? (
        record.bills.map(bill => (
          <div className="po-kv" key={bill.billId}>
            <span>{bill.invoiceNumber || bill.billId}</span>
            <strong>{money(bill.amount)}</strong>
          </div>
        ))
      ) : (
        <div className="po-empty">{t.noBills}</div>
      )}

      {mode === "bill" ? (
        <div className="po-inline-form">
          <label>{t.invoiceNumber}</label>
          <input value={invoiceNumber} onChange={event => setInvoiceNumber(event.target.value)} />
          <label>{t.invoiceAmount}</label>
          <input inputMode="decimal" value={invoiceAmount} onChange={event => setInvoiceAmount(event.target.value)} />
          <div className="po-actions">
            <button type="button" onClick={() => setMode("")}>{t.cancelWord}</button>
            <button type="button" disabled={busy || !invoiceAmount} onClick={submitBill}>{t.saveBill}</button>
          </div>
        </div>
      ) : null}

      <div className="po-actions one">
        {actions.has(IXI_PURCHASE_ACTIONS.RECEIVE) ? (
          <button type="button" disabled={busy} onClick={() => setMode("receive")}>{t.receive}</button>
        ) : null}
        {actions.has(IXI_PURCHASE_ACTIONS.MATCH_BILL) ? (
          <button type="button" disabled={busy} onClick={() => setMode("bill")}>{t.matchBill}</button>
        ) : null}
        {actions.has(IXI_PURCHASE_ACTIONS.APPROVE_VARIANCE) ? (
          <button
            className="approve"
            type="button"
            disabled={busy || record?.financialControl?.varianceApproved}
            onClick={() => onAction?.(IXI_PURCHASE_ACTIONS.APPROVE_VARIANCE)}
          >
            {t.approveVariance}
          </button>
        ) : null}
        {actions.has(IXI_PURCHASE_ACTIONS.CLOSE_SHORT) ? (
          <button type="button" disabled={busy} onClick={() => onAction?.(IXI_PURCHASE_ACTIONS.CLOSE_SHORT)}>{t.closeShort}</button>
        ) : null}
      </div>
    </>
  );
}

function FaceThree({ record, t, lang, onAction, busy }) {
  const [noteOpen, setNoteOpen] = useState(false);
  const [note, setNote] = useState("");
  const related = Array.isArray(record?.related) ? record.related : [];

  return (
    <>
      <div className="po-section-title">{t.history}</div>
      <div className="po-timeline">
        {(record?.timeline || []).slice().reverse().map(event => {
          const occurred = new Date(event.occurredAt);
          const time = Number.isNaN(occurred.getTime())
            ? ""
            : occurred.toLocaleTimeString(lang === "es" ? "es-MX" : "en-US", {
                hour: "numeric",
                minute: "2-digit"
              });

          return (
            <div className="po-event" key={event.activityId}>
              <time>{shortDate(event.occurredAt, lang)}{time ? ` · ${time}` : ""}</time>
              <strong>{event.label}</strong>
              <small>{event.actorLabel}{event.note ? ` · ${event.note}` : ""}</small>
            </div>
          );
        })}
      </div>

      <div className="po-section-title">{t.related}</div>
      {related.length ? (
        related.map(item => (
          <div className="po-related-row" key={item.id}>
            <strong>{item.label || item.id}</strong>
            <span>{item.type || item.role || "Object"}</span>
            <b>›</b>
          </div>
        ))
      ) : (
        <div className="po-empty">{t.noRelated}</div>
      )}

      {noteOpen ? (
        <div className="po-inline-form">
          <label>{t.note}</label>
          <textarea value={note} onChange={event => setNote(event.target.value)} />
          <div className="po-actions">
            <button type="button" onClick={() => setNoteOpen(false)}>{t.cancelWord}</button>
            <button
              type="button"
              disabled={busy || !clean(note)}
              onClick={() => {
                onAction?.(IXI_PURCHASE_ACTIONS.ADD_NOTE, { body: note });
                setNote("");
                setNoteOpen(false);
              }}
            >
              {t.saveNote}
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className="po-wide-action"
          style={{ width: "100%", marginTop: 8 }}
          onClick={() => setNoteOpen(true)}
        >
          {t.addNote}
        </button>
      )}
    </>
  );
}

export default function IXIPurchaseCard({
  record = {},
  context = {},
  policy = null,
  authority = null,
  language = "en",
  onLanguageChange = null,
  onAction = null,
  busy = false,
  error = ""
}) {
  const [face, setFace] = useState(1);
  const lang = language === "es" ? "es" : "en";
  const t = COPY[lang];
  const runtime = useMemo(
    () => evaluateIXIPurchaseRuntime({
      context,
      purchase: record,
      policy,
      authority
    }),
    [context, record, policy, authority]
  );
  const displayNumber = getIXIPurchaseDisplayNumber(record);
  const status = clean(record.status || "draft");

  return (
    <div className="ixi-purchase-card">
      <header className="po-card-top">
        <div className="po-card-number">
          <strong>{displayNumber}</strong>
          <small>IXI TRAN$ACT · PURCHASE</small>
        </div>
        <div className={`po-status ${statusTone(status)}`}>
          {STATUS_LABELS[lang]?.[status] || status}
        </div>
      </header>

      <div className="po-face-tabs">
        <button className={face === 1 ? "active" : ""} onClick={() => setFace(1)}>F1 · {t.face1}</button>
        <button className={face === 2 ? "active" : ""} onClick={() => setFace(2)}>F2 · {t.face2}</button>
        <button className={face === 3 ? "active" : ""} onClick={() => setFace(3)}>F3 · {t.face3}</button>
      </div>

      <main className="po-card-body">
        {face === 1 ? <FaceOne record={record} runtime={runtime} t={t} lang={lang} onAction={onAction} busy={busy} /> : null}
        {face === 2 ? <FaceTwo record={record} runtime={runtime} t={t} onAction={onAction} busy={busy} /> : null}
        {face === 3 ? <FaceThree record={record} t={t} lang={lang} onAction={onAction} busy={busy} /> : null}
        {error ? <div className="po-card-error">{error}</div> : null}
      </main>

      <footer className="po-card-foot">
        <span>{record?.context?.primaryObjectLabel || record?.context?.workOrderNumber || "AOS OBJECT"}</span>
        <div className="po-lang-mini">
          <button className={lang === "en" ? "active" : ""} onClick={() => onLanguageChange?.("en")}>ENG</button>
          <span>/</span>
          <button className={lang === "es" ? "active" : ""} onClick={() => onLanguageChange?.("es")}>ESP</button>
        </div>
      </footer>

      <IXIPurchaseCardStyles />
    </div>
  );
}
