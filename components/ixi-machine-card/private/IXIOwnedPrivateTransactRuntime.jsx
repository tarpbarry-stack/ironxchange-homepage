import { useCallback, useEffect, useMemo, useState } from "react";

import IXITransactObjectConsole from "../../ixi-aos/transact/IXITransactObjectConsole";
import {
  getIXIFinancialDocument,
  loadIXIAosFinancialAccessContext,
  loadIXIAosPassportFinancialDocuments
} from "../../ixi-aos/financial-runtime/IXIAosFinancialReadClient";

const clean = value => String(value ?? "").trim();

function findActiveWorkOrder(records = []) {
  const ordered = [...records].sort((a, b) => {
    const right = Date.parse(getIXIFinancialDocument(b)?.occurredAt || b?.server?.updatedAt || 0) || 0;
    const left = Date.parse(getIXIFinancialDocument(a)?.occurredAt || a?.server?.updatedAt || 0) || 0;
    return right - left;
  });

  for (const record of ordered) {
    const document = getIXIFinancialDocument(record);
    if (clean(document?.documentType).toLowerCase() !== "work-order") continue;
    const workOrder = document?.workOrder;
    if (!workOrder || typeof workOrder !== "object") continue;
    const status = clean(workOrder?.work?.status).toLowerCase();
    if (["complete", "completed", "closed", "canceled", "cancelled"].includes(status)) continue;
    return {
      ...workOrder,
      identity: {
        ...(workOrder.identity || {}),
        workOrderId: clean(workOrder?.identity?.workOrderId) || clean(document?.financialDocumentId),
        number: clean(workOrder?.identity?.number) || clean(document?.documentNumber) || clean(document?.financialDocumentId)
      },
      financialBinding: {
        financialDocumentId: clean(document?.financialDocumentId),
        revision: Number(record?.server?.revision || record?.revision || 0)
      }
    };
  }
  return null;
}

function findActiveTechWorkOrder(records = []) {
  const ordered = [...records].sort((a, b) => {
    const right = Date.parse(getIXIFinancialDocument(b)?.occurredAt || b?.server?.updatedAt || 0) || 0;
    const left = Date.parse(getIXIFinancialDocument(a)?.occurredAt || a?.server?.updatedAt || 0) || 0;
    return right - left;
  });

  for (const record of ordered) {
    const document = getIXIFinancialDocument(record);
    if (clean(document?.documentType).toLowerCase() !== "work-order") continue;
    if (clean(document?.workOrderType).toLowerCase() !== "technology") continue;
    const techWorkOrder = document?.techWorkOrder;
    if (!techWorkOrder || typeof techWorkOrder !== "object") continue;
    const status = clean(techWorkOrder?.work?.status).toLowerCase();
    if (["complete", "completed", "closed", "canceled", "cancelled"].includes(status)) continue;
    const financialDocumentId = clean(document?.financialDocumentId);
    return {
      ...techWorkOrder,
      identity: {
        ...(techWorkOrder.identity || {}),
        techWorkOrderId: clean(techWorkOrder?.identity?.techWorkOrderId) || financialDocumentId,
        workOrderId: clean(techWorkOrder?.identity?.workOrderId) || financialDocumentId,
        number: clean(techWorkOrder?.identity?.number) || clean(document?.documentNumber) || financialDocumentId
      },
      financialBinding: {
        financialDocumentId,
        revision: Number(record?.server?.revision || record?.revision || 0)
      }
    };
  }
  return null;
}

function RuntimeState({ title, detail, onRetry, onClose }) {
  return (
    <div className="tx-runtime-state">
      <strong>{title}</strong>
      <span>{detail}</span>
      <div>
        {onRetry ? <button type="button" onClick={onRetry}>RETRY</button> : null}
        {onClose ? <button type="button" onClick={onClose}>CLOSE</button> : null}
      </div>
      <style jsx>{`
        .tx-runtime-state{width:298px;height:471px;box-sizing:border-box;padding:32px 22px;display:flex;flex-direction:column;justify-content:center;gap:12px;border:1px solid #303030;background:#080808;color:#f4f4f4;font:800 11px/1.4 Arial,sans-serif;letter-spacing:.08em;text-align:center}
        strong{color:#ffc400;font-size:15px}span{color:#bdbdbd}div{display:flex;justify-content:center;gap:8px}button{border:1px solid #555;background:#151515;color:#fff;padding:7px 12px;font:900 10px Arial;cursor:pointer}
      `}</style>
    </div>
  );
}

export default function IXIOwnedPrivateTransactRuntime({
  object,
  layoutObjectId = "",
  onClose,
  ixiState = {},
  onIxiStateChange,
  onSendFront,
  onSendBack,
  armedDestination,
  onSendToArmedDestination
}) {
  const passportId = clean(object?.passportId);
  const [state, setState] = useState({ loading: true, refreshing: false, error: "", access: null, records: [] });

  const refresh = useCallback(async signal => {
    if (!passportId) {
      setState({ loading: false, refreshing: false, error: "THIS OBJECT NEEDS AN IXI PASSPORT BEFORE IT CAN TRANSACT.", access: null, records: [] });
      return;
    }
    setState(current => current.access
      ? { ...current, refreshing: true, error: "" }
      : { ...current, loading: true, refreshing: false, error: "" });
    try {
      const [access, records] = await Promise.all([
        loadIXIAosFinancialAccessContext({ signal }),
        loadIXIAosPassportFinancialDocuments({ passportId, signal })
      ]);
      setState({ loading: false, refreshing: false, error: "", access, records });
    } catch (error) {
      if (error?.name === "AbortError") return;
      setState(current => ({
        ...current,
        loading: false,
        refreshing: false,
        error: clean(error?.message) || "TRAN$ACT COULD NOT LOAD."
      }));
    }
  }, [passportId]);

  useEffect(() => {
    const controller = new AbortController();
    refresh(controller.signal);
    return () => controller.abort();
  }, [refresh]);

  const activeWorkOrder = useMemo(() => findActiveWorkOrder(state.records), [state.records]);
  const activeTechWorkOrder = useMemo(() => findActiveTechWorkOrder(state.records), [state.records]);
  const hydratedObject = useMemo(() => ({
    ...object,
    financialRecords: state.records,
    relatedFinancialRecords: state.records,
    assetFinancialTransactions: state.records
  }), [object, state.records]);
  const actor = state.access?.actor || {};
  const entityId = clean(state.access?.defaults?.entityPassportId);
  const entity = state.access?.entities?.find(item => clean(item?.passportId) === entityId)
    || state.access?.entities?.[0]
    || {};

  if (state.loading) {
    return <RuntimeState title="OPENING TRAN$ACT" detail="VERIFYING AUTHORITY · LOADING PASSPORT RECORDS" />;
  }
  if (state.error && !state.access) {
    return <RuntimeState title="TRAN$ACT NOT OPEN" detail={state.error} onRetry={() => refresh()} onClose={onClose} />;
  }

  return (
    <IXITransactObjectConsole
      object={hydratedObject}
      layoutObjectId={layoutObjectId}
      actor={actor}
      entity={entity}
      activeWorkOrder={activeWorkOrder}
      activeTechWorkOrder={activeTechWorkOrder}
      permissions={state.access?.permissions || []}
      financialRecords={state.records}
      onFinancialRecordsChange={() => refresh()}
      ixiState={ixiState}
      onIxiStateChange={onIxiStateChange}
      onClose={onClose}
      onSendFront={onSendFront}
      onSendBack={onSendBack}
      armedDestination={armedDestination}
      onSendToArmedDestination={onSendToArmedDestination}
    />
  );
}
