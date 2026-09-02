import { useCallback, useEffect, useMemo, useState } from "react";
import IXITransactObjectConsole from "../../ixi-aos/transact/IXITransactObjectConsole";
import { getIXIFinancialDocument, getIXITransactInput, loadIXIAosFinancialAccessContext, loadIXIAosPassportFinancialDocuments } from "../../ixi-aos/financial-runtime/IXIAosFinancialReadClient";
import { createOwnedPrivateTransactObject } from "./IXIOwnedPrivateTransactAdapter";

const clean = value => String(value ?? "").trim();
const newestFirst = records => [...records].sort((a, b) => (Date.parse(getIXIFinancialDocument(b)?.occurredAt || b?.server?.updatedAt || 0) || 0) - (Date.parse(getIXIFinancialDocument(a)?.occurredAt || a?.server?.updatedAt || 0) || 0));

function domainRecords(records = [], key = "") {
  return newestFirst(records).map(record => {
    const document = getIXIFinancialDocument(record);
    const value = document?.[key] || getIXITransactInput(record)?.[key];
    if (!value || typeof value !== "object") return null;
    return { ...value, financialBinding: { financialDocumentId: clean(document?.financialDocumentId), revision: Number(record?.server?.revision || record?.revision || 0) } };
  }).filter(Boolean);
}

function findActiveWorkOrder(records = []) {
  for (const record of newestFirst(records)) {
    const document = getIXIFinancialDocument(record);
    if (clean(document?.documentType) !== "work-order") continue;
    const source = document?.workOrder || getIXITransactInput(record)?.workOrder;
    if (!source || typeof source !== "object") continue;
    if (["complete", "completed", "closed", "canceled", "cancelled"].includes(clean(source?.work?.status).toLowerCase())) continue;
    return { ...source, identity: { ...(source.identity || {}), workOrderId: clean(source?.identity?.workOrderId) || clean(document?.financialDocumentId), number: clean(source?.identity?.number) || clean(document?.documentNumber) || clean(document?.financialDocumentId) }, financialBinding: { financialDocumentId: clean(document?.financialDocumentId), revision: Number(record?.server?.revision || record?.revision || 0) } };
  }
  return null;
}

function RuntimeState({ title, detail, onRetry, onClose }) {
  return <div className="tx-runtime-state"><strong>{title}</strong><span>{detail}</span><div>{onRetry ? <button onClick={onRetry}>RETRY</button> : null}{onClose ? <button onClick={onClose}>CLOSE</button> : null}</div><style jsx>{`.tx-runtime-state{width:298px;height:471px;box-sizing:border-box;padding:32px 22px;display:flex;flex-direction:column;justify-content:center;gap:12px;border:1px solid #303030;background:#080808;color:#f4f4f4;font:800 11px/1.4 Arial,sans-serif;letter-spacing:.08em;text-align:center}strong{color:#ffc400;font-size:15px}span{color:#bdbdbd}div{display:flex;justify-content:center;gap:8px}button{border:1px solid #555;background:#151515;color:#fff;padding:7px 12px;font:900 10px Arial;cursor:pointer}`}</style></div>;
}

export default function IXIOwnedPrivateTransactRuntime({ listing = {}, onClose, ixiState = {}, onIxiStateChange, onSendFront, onSendBack, armedDestination, onSendToArmedDestination }) {
  const baseObject = useMemo(() => createOwnedPrivateTransactObject(listing), [listing]);
  const [state, setState] = useState({ loading: true, error: "", access: null, records: [] });
  const refresh = useCallback(async signal => {
    if (!baseObject.passportId) { setState({ loading: false, error: "THIS OBJECT NEEDS AN IXI PASSPORT BEFORE IT CAN TRANSACT.", access: null, records: [] }); return; }
    setState(current => ({ ...current, loading: true, error: "" }));
    try {
      const [access, records] = await Promise.all([loadIXIAosFinancialAccessContext({ signal }), loadIXIAosPassportFinancialDocuments({ passportId: baseObject.passportId, signal })]);
      setState({ loading: false, error: "", access, records });
    } catch (error) {
      if (error?.name === "AbortError") return;
      setState(current => ({ ...current, loading: false, error: clean(error?.message) || "TRAN$ACT COULD NOT LOAD." }));
    }
  }, [baseObject.passportId]);
  useEffect(() => { const controller = new AbortController(); refresh(controller.signal); return () => controller.abort(); }, [refresh]);
  const records = state.records;
  const object = useMemo(() => ({ ...baseObject, financialRecords: records, relatedFinancialRecords: records, assetFinancialTransactions: records, technologyWorkOrders: domainRecords(records, "techWorkOrder"), workOrders: domainRecords(records, "workOrder"), serviceQuotes: domainRecords(records, "serviceQuote"), serviceInvoices: domainRecords(records, "serviceInvoice"), assetAcquisitions: domainRecords(records, "acquisition"), assetSales: domainRecords(records, "assetSale"), settlements: domainRecords(records, "settlement") }), [baseObject, records]);
  const activeWorkOrder = useMemo(() => findActiveWorkOrder(records), [records]);
  const actor = state.access?.actor || {};
  const entityId = clean(state.access?.defaults?.entityPassportId);
  const entity = state.access?.entities?.find(item => clean(item?.passportId) === entityId) || state.access?.entities?.[0] || {};
  if (state.loading) return <RuntimeState title="OPENING TRAN$ACT" detail="VERIFYING AUTHORITY · LOADING PASSPORT LEDGER" />;
  if (state.error) return <RuntimeState title="TRAN$ACT NOT OPEN" detail={state.error} onRetry={() => refresh()} onClose={onClose} />;
  return <IXITransactObjectConsole object={object} actor={actor} entity={entity} activeWorkOrder={activeWorkOrder} permissions={state.access?.permissions || []} financialRecords={records} onFinancialRecordsChange={() => refresh()} ixiState={ixiState} onIxiStateChange={onIxiStateChange} onClose={onClose} onSendFront={onSendFront} onSendBack={onSendBack} armedDestination={armedDestination} onSendToArmedDestination={onSendToArmedDestination} />;
}
