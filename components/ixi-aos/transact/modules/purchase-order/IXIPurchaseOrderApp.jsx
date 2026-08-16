import { useMemo, useState } from "react";

import {
  IXI_PO_ACTIONS,
  evaluateIXIPurchaseOrderRuntime,
  resolveIXIPurchaseOrderPolicy
} from "./IXIPurchaseOrderPolicyEngine";
import {
  createIXIPurchaseOrderRecord,
  applyIXIPurchaseOrderAction,
  addIXIPurchaseOrderRelated,
  getIXIPurchaseOrderDisplayNumber
} from "./IXIPurchaseOrderRecordEngine";
import {
  issueIXIPurchaseOrder,
  matchIXIPurchaseOrderBill
} from "./IXIPurchaseOrderCommands";
import IXIPurchaseOrderStyles from "./IXIPurchaseOrderStyles";

const clean = value => String(value ?? "").trim();
const money = value => `$${Number(value || 0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}`;
const fmtDate = (value, lang) => {
  const date = new Date(value || Date.now());
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString(lang === "es" ? "es-MX" : "en-US");
};

const COPY = {
  en: {
    face1:"ORDER / APPROVAL", face2:"RECEIVE / COST", face3:"HISTORY / RELATED",
    vendor:"VENDOR", needed:"NEEDED BY", shipTo:"SHIP TO", requestedBy:"REQUESTED BY", sourceRequest:"SOURCE REQUEST",
    what:"ORDER", reason:"BUSINESS REASON", items:"ITEMS", approval:"APPROVAL", status:"STATUS", amount:"AMOUNT", authority:"REQUIRED AUTHORITY",
    approve:"APPROVE", returned:"RETURN", deny:"DENY", issue:"ISSUE PO", send:"SEND PO", receive:"RECEIVE", closeRemainder:"CLOSE REMAINDER",
    receiving:"RECEIVING", ordered:"ORDERED", received:"RECEIVED", remaining:"REMAINING", costs:"COST CONTROL", estimated:"ESTIMATED", committed:"COMMITTED",
    billed:"BILLED", paid:"PAID", variance:"VARIANCE", matchBill:"MATCH BILL", approveVariance:"APPROVE VARIANCE", history:"ACTIVITY TIMELINE",
    related:"RELATED", invoiceNumber:"INVOICE NUMBER", invoiceDate:"INVOICE DATE", billAmount:"BILL AMOUNT", saveBill:"CREATE / MATCH BILL",
    note:"NOTE / REASON", addNote:"ADD NOTE", direct:"DIRECT PO", back:"TRAN$ACT", noRelated:"No related records yet."
  },
  es: {
    face1:"PEDIDO / APROBACIÓN", face2:"RECIBO / COSTO", face3:"HISTORIAL / RELACIONADO",
    vendor:"PROVEEDOR", needed:"FECHA NECESARIA", shipTo:"ENVIAR A", requestedBy:"SOLICITADO POR", sourceRequest:"SOLICITUD ORIGEN",
    what:"PEDIDO", reason:"MOTIVO COMERCIAL", items:"ARTÍCULOS", approval:"APROBACIÓN", status:"ESTADO", amount:"IMPORTE", authority:"AUTORIDAD REQUERIDA",
    approve:"APROBAR", returned:"DEVOLVER", deny:"RECHAZAR", issue:"EMITIR OC", send:"ENVIAR OC", receive:"RECIBIR", closeRemainder:"CERRAR RESTANTE",
    receiving:"RECIBO", ordered:"PEDIDO", received:"RECIBIDO", remaining:"RESTANTE", costs:"CONTROL DE COSTO", estimated:"ESTIMADO", committed:"COMPROMETIDO",
    billed:"FACTURADO", paid:"PAGADO", variance:"VARIACIÓN", matchBill:"CONCILIAR FACTURA", approveVariance:"APROBAR VARIACIÓN", history:"HISTORIAL DE ACTIVIDAD",
    related:"RELACIONADO", invoiceNumber:"NÚMERO DE FACTURA", invoiceDate:"FECHA DE FACTURA", billAmount:"IMPORTE DE FACTURA", saveBill:"CREAR / CONCILIAR FACTURA",
    note:"NOTA / MOTIVO", addNote:"AGREGAR NOTA", direct:"OC DIRECTA", back:"TRAN$ACT", noRelated:"Aún no hay registros relacionados."
  }
};

function buildDirectDraft(context = {}) {
  return {
    purchaseOrderRecordId: "",
    vendorLabel: "",
    neededByDate: "",
    description: "",
    businessReason: "",
    currency: "USD",
    lines: [{ lineId:"LINE-1", description:"", quantity:1, unit:"EA", estimatedUnitCost:0 }],
    shipToLabel: clean(context.location?.label)
  };
}

function statusLabel(status, lang) {
  const map = lang === "es" ? {
    draft:"BORRADOR", "pending-approval":"PENDIENTE DE APROBACIÓN", approved:"APROBADO", returned:"DEVUELTO", denied:"RECHAZADO",
    "po-issued":"OC EMITIDA", sent:"ENVIADA", "partially-received":"PARCIAL", received:"RECIBIDO", "bill-match":"CONCILIACIÓN", closed:"CERRADO", cancelled:"CANCELADO"
  } : {
    draft:"DRAFT", "pending-approval":"PENDING APPROVAL", approved:"APPROVED", returned:"RETURNED", denied:"DENIED",
    "po-issued":"PO ISSUED", sent:"SENT", "partially-received":"PARTIAL RECEIPT", received:"RECEIVED", "bill-match":"BILL MATCH", closed:"CLOSED", cancelled:"CANCELLED"
  };
  return map[status] || String(status || "").toUpperCase();
}

export default function IXIPurchaseOrderApp({
  context = {},
  sourceRequest = null,
  initialPurchaseOrder = null,
  policy = null,
  authority = null,
  language = "en",
  onLanguageChange = null,
  onBack = null,
  onRecordChange = null
}) {
  const [lang, setLangLocal] = useState(language === "es" ? "es" : "en");
  const [face, setFace] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [billForm, setBillForm] = useState({ invoiceNumber:"", invoiceDate:"", amount:"" });
  const [receiveDraft, setReceiveDraft] = useState({});
  const [directDraft, setDirectDraft] = useState(() => buildDirectDraft(context));
  const [record, setRecord] = useState(() => {
    if (initialPurchaseOrder) return initialPurchaseOrder;
    if (sourceRequest) return createIXIPurchaseOrderRecord({ sourceRequest, context, actor:context.actor });
    return createIXIPurchaseOrderRecord({ directDraft:buildDirectDraft(context), context, actor:context.actor });
  });

  const t = COPY[lang];
  const resolvedPolicy = useMemo(() => resolveIXIPurchaseOrderPolicy(context, policy), [context, policy]);
  const runtime = useMemo(() => evaluateIXIPurchaseOrderRuntime({ context, record, policy:resolvedPolicy, authority }), [context, record, resolvedPolicy, authority]);
  const actions = new Set(runtime.actions);
  const actor = context.actor || {};
  const originObject = {
    objectId: context.primary?.objectId || context.primary?.id,
    passportId: context.primary?.passportId,
    objectType: context.primary?.objectType,
    label: context.primary?.label
  };

  function setLang(next) {
    setLangLocal(next);
    onLanguageChange?.(next);
  }

  async function commit(nextRecord, change) {
    await onRecordChange?.(nextRecord, change);
    setRecord(nextRecord);
  }

  async function runAction(action, payload = {}) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      let working = record;

      if (action === IXI_PO_ACTIONS.ISSUE_PO) {
        const issued = await issueIXIPurchaseOrder({ object:originObject, context, record, metadata:{source:"ixi-transact-standalone-po"} });
        working = issued.record;
        const next = applyIXIPurchaseOrderAction({ record:working, action, context, policy:resolvedPolicy, authority, actor, payload:{committedAmount:working.costs?.estimated} });
        await commit(next, { action, financialResponse:issued.response, previous:record });
        return;
      }

      if (action === IXI_PO_ACTIONS.MATCH_BILL) {
        const matched = await matchIXIPurchaseOrderBill({ object:originObject, context, record, input:billForm, metadata:{source:"ixi-transact-standalone-po"} });
        const next = applyIXIPurchaseOrderAction({ record, action, context, policy:resolvedPolicy, authority, actor, payload:matched.bill });
        await commit(next, { action, financialResponse:matched.response, previous:record });
        setBillForm({ invoiceNumber:"", invoiceDate:"", amount:"" });
        return;
      }

      const next = applyIXIPurchaseOrderAction({ record, action, context, policy:resolvedPolicy, authority, actor, payload:{...payload,note} });
      await commit(next, { action, previous:record, payload });
      setNote("");
    } catch (err) {
      setError(clean(err?.message) || "Purchase Order action failed.");
    } finally {
      setBusy(false);
    }
  }

  function patchDirectLine(key, value) {
    setDirectDraft(current => ({ ...current, lines:[{ ...current.lines[0], [key]:value }] }));
  }

  function rebuildDirectRecord() {
    const directSource = {
      vendorLabel: directDraft.vendorLabel,
      neededByDate: directDraft.neededByDate,
      description: directDraft.description,
      businessReason: directDraft.businessReason,
      shipToLabel: directDraft.shipToLabel,
      currency:"USD",
      items: directDraft.lines
    };
    const next = createIXIPurchaseOrderRecord({ directDraft:directSource, context, actor });
    setRecord(next);
  }

  const displayNumber = getIXIPurchaseOrderDisplayNumber(record);
  const status = clean(record.status || "draft");
  const statusClass = ["closed","received","approved"].includes(status) ? "good" : ["denied","cancelled"].includes(status) ? "bad" : "";

  function FaceOne() {
    if (status === "draft" && !sourceRequest && !initialPurchaseOrder) {
      return <>
        <div className="ixi-po-section">{t.direct}</div>
        <div className="ixi-po-inline">
          <label>{t.vendor}</label><input value={directDraft.vendorLabel} onChange={e=>setDirectDraft(c=>({...c,vendorLabel:e.target.value}))}/>
          <label>{t.needed}</label><input type="date" value={directDraft.neededByDate} onChange={e=>setDirectDraft(c=>({...c,neededByDate:e.target.value}))}/>
          <label>{t.what}</label><textarea value={directDraft.description} onChange={e=>setDirectDraft(c=>({...c,description:e.target.value}))}/>
          <label>{t.reason}</label><textarea value={directDraft.businessReason} onChange={e=>setDirectDraft(c=>({...c,businessReason:e.target.value}))}/>
          <label>ITEM</label><input value={directDraft.lines[0].description} onChange={e=>patchDirectLine("description",e.target.value)}/>
          <div className="ixi-po-grid2"><div><label>QTY</label><input value={directDraft.lines[0].quantity} onChange={e=>patchDirectLine("quantity",e.target.value)}/></div><div><label>UNIT COST</label><input value={directDraft.lines[0].estimatedUnitCost} onChange={e=>patchDirectLine("estimatedUnitCost",e.target.value)}/></div></div>
        </div>
        <button className="ixi-po-wide" type="button" onClick={rebuildDirectRecord}>CALCULATE AUTHORITY</button>
        <div className="ixi-po-section">{t.approval}</div>
        <div className="ixi-po-approval">
          <div className="ixi-po-approval-row"><span>{t.authority}</span><strong>{runtime.directPoLimit >= Number.MAX_SAFE_INTEGER ? "UNLIMITED" : money(runtime.directPoLimit)}</strong></div>
          <div className="ixi-po-approval-row"><span>{t.amount}</span><strong>{money(record.costs?.estimated)}</strong></div>
        </div>
        {actions.has(IXI_PO_ACTIONS.ISSUE_PO) ? <div className="ixi-po-actions one"><button className="good" disabled={busy} onClick={()=>runAction(IXI_PO_ACTIONS.ISSUE_PO)}>{t.issue}</button></div> : null}
      </>;
    }

    return <>
      <div className="ixi-po-grid2">
        <div className="ixi-po-box"><span>{t.vendor}</span><strong>{record.order?.vendorLabel || "—"}</strong></div>
        <div className="ixi-po-box"><span>{t.needed}</span><strong>{record.order?.neededByDate || "—"}</strong></div>
        <div className="ixi-po-box"><span>{t.shipTo}</span><strong>{record.order?.shipToLabel || record.context?.locationLabel || "—"}</strong></div>
        <div className="ixi-po-box"><span>{t.sourceRequest}</span><strong>{record.identity?.sourceRequestNumber || "DIRECT"}</strong></div>
      </div>
      <div className="ixi-po-section">{t.what}</div><div className="ixi-po-copy">{record.order?.description || record.order?.lines?.map(line=>line.description).join(", ") || "—"}</div>
      <div className="ixi-po-section">{t.reason}</div><div className="ixi-po-copy">{record.order?.businessReason || "—"}</div>
      <div className="ixi-po-section">{t.items}</div>
      <table className="ixi-po-table"><thead><tr><th>ITEM</th><th className="num">QTY</th><th className="num">COST</th></tr></thead><tbody>{(record.order?.lines||[]).map(line=><tr key={line.lineId}><td>{line.description}</td><td className="num">{line.orderedQuantity} {line.unit}</td><td className="num">{runtime.canSeeCosts ? money(line.extendedAmount) : "—"}</td></tr>)}</tbody></table>
      <div className="ixi-po-section">{t.approval}</div>
      <div className="ixi-po-approval">
        <div className="ixi-po-approval-row"><span>{t.status}</span><strong>{statusLabel(status,lang)}</strong></div>
        <div className="ixi-po-approval-row"><span>{t.amount}</span><strong>{money(record.costs?.estimated)}</strong></div>
        <div className="ixi-po-approval-row"><span>{t.authority}</span><strong>{runtime.approval.requiredRoleLabel || "DIRECT PO"}</strong></div>
      </div>
      {status === "pending-approval" && (actions.has(IXI_PO_ACTIONS.APPROVE_REQUEST)||actions.has(IXI_PO_ACTIONS.RETURN_REQUEST)||actions.has(IXI_PO_ACTIONS.DENY_REQUEST)) ? <>
        <div className="ixi-po-inline"><label>{t.note}</label><textarea value={note} onChange={e=>setNote(e.target.value)} /></div>
        <div className="ixi-po-actions">
          {actions.has(IXI_PO_ACTIONS.DENY_REQUEST)?<button className="bad" disabled={busy} onClick={()=>runAction(IXI_PO_ACTIONS.DENY_REQUEST)}>{t.deny}</button>:null}
          {actions.has(IXI_PO_ACTIONS.RETURN_REQUEST)?<button disabled={busy} onClick={()=>runAction(IXI_PO_ACTIONS.RETURN_REQUEST)}>{t.returned}</button>:null}
          {actions.has(IXI_PO_ACTIONS.APPROVE_REQUEST)?<button className="good" disabled={busy} onClick={()=>runAction(IXI_PO_ACTIONS.APPROVE_REQUEST)}>{t.approve}</button>:null}
        </div>
      </> : null}
      {actions.has(IXI_PO_ACTIONS.ISSUE_PO) ? <div className="ixi-po-actions one"><button className="good" disabled={busy} onClick={()=>runAction(IXI_PO_ACTIONS.ISSUE_PO)}>{t.issue}</button></div> : null}
      {actions.has(IXI_PO_ACTIONS.SEND_PO) ? <div className="ixi-po-actions one"><button disabled={busy} onClick={()=>runAction(IXI_PO_ACTIONS.SEND_PO)}>{t.send}</button></div> : null}
    </>;
  }

  function FaceTwo() {
    const lines = record.receiving?.lines || [];
    return <>
      <div className="ixi-po-section">{t.receiving}</div>
      <div className="ixi-po-grid2">
        <div className="ixi-po-box"><span>{t.ordered}</span><strong>{record.receiving?.orderedQuantity || 0}</strong></div>
        <div className="ixi-po-box"><span>{t.received}</span><strong>{record.receiving?.receivedQuantity || 0}</strong></div>
        <div className="ixi-po-box"><span>{t.remaining}</span><strong>{record.receiving?.remainingQuantity || 0}</strong></div>
        <div className="ixi-po-box"><span>PROGRESS</span><strong>{record.receiving?.percentReceived || 0}%</strong></div>
      </div>
      {lines.map(line=><div className="ixi-po-receive-row" key={line.lineId}><span>{line.description}</span><b>{line.orderedQuantity}</b><b>{line.receivedQuantity}</b>{actions.has(IXI_PO_ACTIONS.RECEIVE)?<input value={receiveDraft[line.lineId]||""} onChange={e=>setReceiveDraft(c=>({...c,[line.lineId]:e.target.value}))}/>:<b>{line.remainingQuantity}</b>}</div>)}
      {actions.has(IXI_PO_ACTIONS.RECEIVE)?<button className="ixi-po-wide" disabled={busy} onClick={()=>runAction(IXI_PO_ACTIONS.RECEIVE,{lines:lines.map(line=>({lineId:line.lineId,quantity:Number(receiveDraft[line.lineId]||0)}))})}>{t.receive}</button>:null}
      {actions.has(IXI_PO_ACTIONS.CLOSE_REMAINDER)?<button className="ixi-po-wide" disabled={busy} onClick={()=>runAction(IXI_PO_ACTIONS.CLOSE_REMAINDER)}>{t.closeRemainder}</button>:null}

      <div className="ixi-po-section">{t.costs}</div>
      {runtime.canSeeCosts ? <>
        <div className="ixi-po-cost"><span>{t.estimated}</span><strong>{money(record.costs?.estimated)}</strong></div>
        <div className="ixi-po-cost"><span>{t.committed}</span><strong>{money(record.costs?.committed)}</strong></div>
        <div className="ixi-po-cost"><span>{t.billed}</span><strong>{money(record.costs?.billed)}</strong></div>
        <div className="ixi-po-cost"><span>{t.paid}</span><strong>{money(record.costs?.paid)}</strong></div>
        <div className={`ixi-po-cost ${Math.abs(Number(record.costs?.variance||0))>.009?"bad":""}`}><span>{t.variance}</span><strong>{money(record.costs?.variance)}</strong></div>
      </> : <div className="ixi-po-empty">COST VISIBILITY IS RESTRICTED BY COMPANY POLICY.</div>}

      {actions.has(IXI_PO_ACTIONS.MATCH_BILL)?<div className="ixi-po-inline">
        <label>{t.invoiceNumber}</label><input value={billForm.invoiceNumber} onChange={e=>setBillForm(c=>({...c,invoiceNumber:e.target.value}))}/>
        <label>{t.invoiceDate}</label><input type="date" value={billForm.invoiceDate} onChange={e=>setBillForm(c=>({...c,invoiceDate:e.target.value}))}/>
        <label>{t.billAmount}</label><input value={billForm.amount} onChange={e=>setBillForm(c=>({...c,amount:e.target.value}))}/>
        <button className="ixi-po-wide" disabled={busy} onClick={()=>runAction(IXI_PO_ACTIONS.MATCH_BILL)}>{t.saveBill}</button>
      </div>:null}
      {actions.has(IXI_PO_ACTIONS.APPROVE_VARIANCE)?<button className="ixi-po-wide" disabled={busy} onClick={()=>runAction(IXI_PO_ACTIONS.APPROVE_VARIANCE)}>{t.approveVariance}</button>:null}
    </>;
  }

  function FaceThree() {
    return <>
      <div className="ixi-po-section">{t.history}</div>
      <div className="ixi-po-timeline">{(record.timeline||[]).slice().reverse().map(item=><div className="ixi-po-event" key={item.activityId}><time>{fmtDate(item.occurredAt,lang)} · {item.actorLabel}</time><strong>{item.label}</strong>{item.note?<small>{item.note}</small>:null}</div>)}</div>
      <div className="ixi-po-section">{t.related}</div>
      {(record.related||[]).length ? (record.related||[]).map(item=><div className="ixi-po-related" key={item.id}><strong>{item.label||item.id}</strong><span>{item.type||item.objectType||"RELATED"}</span><b>›</b></div>) : <div className="ixi-po-empty">{t.noRelated}</div>}
      <div className="ixi-po-inline"><label>{t.note}</label><textarea value={note} onChange={e=>setNote(e.target.value)}/><button className="ixi-po-wide" disabled={busy||!clean(note)} onClick={()=>runAction(IXI_PO_ACTIONS.ADD_NOTE)}>{t.addNote}</button></div>
    </>;
  }

  return <div className="ixi-po-card">
    <div className="ixi-po-top"><div className="ixi-po-id"><strong>{displayNumber}</strong><small>IXI TRAN$ACT · PURCHASE ORDER</small></div><div className={`ixi-po-status ${statusClass}`}>{statusLabel(status,lang)}</div></div>
    <div className="ixi-po-tabs"><button className={face===1?"on":""} onClick={()=>setFace(1)}>{t.face1}</button><button className={face===2?"on":""} onClick={()=>setFace(2)}>{t.face2}</button><button className={face===3?"on":""} onClick={()=>setFace(3)}>{t.face3}</button></div>
    <div className="ixi-po-body">{face===1?<FaceOne/>:face===2?<FaceTwo/>:<FaceThree/>}{error?<div className="ixi-po-error">{error}</div>:null}</div>
    <div className="ixi-po-foot"><button type="button" className="ixi-po-wide" style={{minHeight:20,padding:"2px 6px"}} onClick={()=>onBack?.()}>{t.back}</button><div className="ixi-po-lang"><button className={lang==="en"?"on":""} onClick={()=>setLang("en")}>ENG</button><span>/</span><button className={lang==="es"?"on":""} onClick={()=>setLang("es")}>ESP</button></div></div>
    <IXIPurchaseOrderStyles/>
  </div>;
}
