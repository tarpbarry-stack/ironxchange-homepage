import { useMemo, useState } from "react";

import IXIMachineRail from "../../IXIMachineRail";
import { createIXITransactContext } from "./IXITransactContext";
import { getIXITransactModules } from "./IXITransactModuleRegistry";
import IXIWorkOrderApp from "./modules/work-order/IXIWorkOrderApp";
import IXITechWorkOrderApp from "./modules/tech-work-order/IXITechWorkOrderApp";
import IXINoteApp from "./modules/note/IXINoteApp";
import IXIPhotoApp from "./modules/photo/IXIPhotoApp";
import IXIExpenseApp from "./modules/expense/IXIExpenseApp";
import IXIPurchaseOrderApp from "./modules/purchase-order/IXIPurchaseOrderApp";
import IXIBillStandaloneApp from "./modules/bill/IXIBillStandaloneApp";
import IXITimeStandaloneApp from "./modules/time/IXITimeStandaloneApp";
import IXIMaterialStandaloneApp from "./modules/material/IXIMaterialStandaloneApp";
import IXITransactStyles from "./IXITransactStyles";

const clean = value => String(value ?? "").trim();

function addUnique(values = [], id = "") {
  const key = clean(id);
  if (!key) return Array.isArray(values) ? values : [];
  return [...new Set([...(Array.isArray(values) ? values : []), key])];
}

function appendUniqueRecord(records = [], record = {}, identityGetter = () => "") {
  const list = Array.isArray(records) ? records : [];
  const identity = clean(identityGetter(record));
  if (!identity) return [...list, record];
  const existingIndex = list.findIndex(item => clean(identityGetter(item)) === identity);
  if (existingIndex < 0) return [...list, record];
  return list.map((item, index) => index === existingIndex ? record : item);
}

export default function IXITransactApp({
  object = {},
  actor = {},
  entity = {},
  activeWorkOrder = null,
  permissions = [],
  onClose = null,
  onOpenModule = null,
  onSendFront = null,
  onSendBack = null,
  onCycleColor = null,
  onCycleOutline = null,
  armedDestination = "",
  onSendToArmedDestination = null
}) {
  const context = useMemo(
    () => createIXITransactContext({ object, actor, entity, activeWorkOrder, permissions }),
    [object, actor, entity, activeWorkOrder, permissions]
  );

  const modules = useMemo(
    () => getIXITransactModules({ objectType: context.primary.objectType, permissions: context.permissions }),
    [context]
  );

  const [moduleId, setModuleId] = useState("");
  const [workOrderSnapshot, setWorkOrderSnapshot] = useState(null);
  const active = modules.find(item => item.id === moduleId) || null;
  const noteOpen = moduleId === "work-order-note";
  const photoOpen = moduleId === "work-order-photo";
  const expenseOpen = moduleId === "expense";
  const purchaseOrderOpen = moduleId === "purchase-order";
  const billOpen = moduleId === "bill";
  const timeOpen = moduleId === "time";
  const materialOpen = moduleId === "material";
  const compactHeader = Boolean(active) || noteOpen || photoOpen || expenseOpen || purchaseOrderOpen || timeOpen || materialOpen;
  const resolvedWorkOrder = workOrderSnapshot || context.activeWorkOrder || null;

  async function open(item) {
    if (!item?.id) return;
    setModuleId(item.id);
    await onOpenModule?.(item, context, {});
  }

  async function workOrderAction(actionId, workOrder, workContext, payload = {}) {
    const nextWorkOrder = workOrder || resolvedWorkOrder || null;
    if (nextWorkOrder) setWorkOrderSnapshot(nextWorkOrder);

    if (actionId === "note") {
      setModuleId("work-order-note");
      return;
    }
    if (actionId === "photo") {
      setModuleId("work-order-photo");
      return;
    }

    await onOpenModule?.(
      { id: actionId, label: String(actionId || "").toUpperCase(), group: "work-order-action", documentType: actionId },
      workContext,
      { workOrder: nextWorkOrder, ...payload }
    );
  }

  async function saveDirectExpense(expense, input, response) {
    const expenseId = clean(expense?.identity?.expenseId || expense?.identity?.number || expense?.identity?.clientRequestId);
    if (!expenseId) throw new Error("Saved Expense did not return a stable identity.");

    const activity = {
      activityId: `ACT-${expenseId}`,
      type: "expense-recorded",
      expenseId,
      amount: Number(expense?.expense?.amount || 0),
      vendor: clean(expense?.expense?.vendor),
      paymentMethod: clean(expense?.expense?.paymentMethod),
      reimbursementRequired: Boolean(expense?.reimbursement?.required),
      occurredAt: new Date().toISOString(),
      actorLabel: clean(context.actor?.displayName || context.actor?.name || context.actor?.label)
    };

    await onOpenModule?.(
      { id: "expense-save", label: "SAVE EXPENSE", group: "spend", documentType: "expense" },
      context,
      {
        expense: { ...expense, identity: { ...(expense?.identity || {}), expenseId } },
        input,
        response,
        activity,
        reimbursement: expense?.reimbursement || null,
        returnTo: "transact-origin"
      }
    );
    setModuleId("");
  }

  async function purchaseOrderChanged(nextRecord, change = {}) {
    await onOpenModule?.(
      {
        id: `purchase-order-${change.action || "change"}`,
        label: "PURCHASE ORDER UPDATE",
        group: "buy",
        documentType: "purchase-order"
      },
      context,
      { purchaseOrderRecord: nextRecord, change, returnTo: "purchase-order" }
    );
  }

  async function billChanged(nextRecord, change = {}) {
    await onOpenModule?.(
      {
        id: `bill-${change.action || "change"}`,
        label: "BILL / INVOICE UPDATE",
        group: "spend",
        documentType: change.action === "record-payment" ? "payment" : "bill"
      },
      context,
      { billRecord: nextRecord, change, returnTo: "bill" }
    );
  }

  async function timeChanged(nextRecord, change = {}, timeContext = context) {
    await onOpenModule?.(
      {
        id: `time-${change.action || "change"}`,
        label: "TIME UPDATE",
        group: "work",
        documentType: "time-entry"
      },
      timeContext,
      {
        timeRecord: nextRecord,
        change,
        originatingObject: timeContext.primary,
        returnTo: "time"
      }
    );
  }

  async function materialChanged(nextRecord, change = {}, materialContext = context) {
    await onOpenModule?.(
      {
        id: `material-${change.action || "change"}`,
        label: "PART / MATERIAL UPDATE",
        group: "work",
        documentType: "material-usage"
      },
      materialContext,
      {
        materialRecord: nextRecord,
        change,
        originatingObject: materialContext.primary,
        inventoryAdjustment: nextRecord?.inventoryAdjustment || null,
        receivingConsumption: nextRecord?.receivingConsumption || null,
        returnTo: "material"
      }
    );
  }

  async function techWorkOrderCreated(record, techContext) {
    await onOpenModule?.(
      { id: "tech-work-order-create", label: "CREATE TECH WORK ORDER", group: "work", documentType: "technology-work-order" },
      techContext,
      { techWorkOrder: record, returnTo: "tech-work-order" }
    );
  }

  async function techWorkOrderChanged(nextRecord, change = {}, techContext = context) {
    await onOpenModule?.(
      {
        id: `tech-work-order-${change.action || "change"}`,
        label: "TECH WORK ORDER UPDATE",
        group: "work",
        documentType: "technology-work-order"
      },
      techContext,
      { techWorkOrder: nextRecord, change, returnTo: "tech-work-order" }
    );
  }

  async function saveNote(note, input, response) {
    const noteId = clean(note?.identity?.noteId || note?.identity?.clientRequestId);
    if (!noteId) throw new Error("Saved Note did not return a stable identity.");

    const attachment = note?.note?.attachments?.[0] || null;
    const current = resolvedWorkOrder || {};
    const storedNote = { ...note, identity: { ...(note.identity || {}), noteId } };
    const activity = {
      activityId: `ACT-${noteId}`,
      type: "note-added",
      noteId,
      noteType: note?.note?.type || "work-note",
      title: note?.note?.title || "",
      body: note?.note?.body || "",
      occurredAt: note?.audit?.createdAt || new Date().toISOString(),
      actorLabel: note?.audit?.createdByLabel || clean(context.actor?.displayName || context.actor?.name || context.actor?.label)
    };

    let documentProjection = Array.isArray(current.documentProjection) ? current.documentProjection : [];
    if (attachment) {
      const attachmentIdentity = clean(attachment.documentId || attachment.id) || `NOTE-ATTACH:${noteId}:${attachment.fileName || "attachment"}`;
      const document = {
        documentId: attachmentIdentity,
        title: attachment.fileName || "Note attachment",
        fileName: attachment.fileName || "",
        type: attachment.mimeType?.startsWith("image/") ? "photo" : "other",
        issuer: note?.audit?.createdByLabel || "",
        relatedType: "note",
        relatedId: noteId,
        relatedLabel: note?.note?.title || noteId,
        date: note?.audit?.createdAt || new Date().toISOString(),
        addedBy: note?.audit?.createdByLabel || "",
        mimeType: attachment.mimeType || "",
        size: Number(attachment.size || 0),
        persistenceState: attachment.status || "local-pending-upload"
      };
      documentProjection = appendUniqueRecord(documentProjection, document, item => item?.documentId || item?.id);
    }

    const next = {
      ...current,
      references: { ...(current.references || {}), noteIds: addUnique(current.references?.noteIds, noteId) },
      notesProjection: appendUniqueRecord(current.notesProjection, storedNote, item => item?.identity?.noteId || item?.identity?.clientRequestId),
      activityProjection: appendUniqueRecord(current.activityProjection, activity, item => item?.activityId),
      documentProjection
    };

    setWorkOrderSnapshot(next);
    await onOpenModule?.(
      { id: "note-save", label: "SAVE NOTE", group: "work-order-action", documentType: "note" },
      context,
      { workOrder: next, note: storedNote, input, response, activity }
    );
    setModuleId("work-order");
  }

  async function savePhoto(photo, input, response) {
    const photoId = clean(photo?.identity?.photoId || photo?.identity?.clientRequestId);
    if (!photoId) throw new Error("Saved Photo entry did not return a stable identity.");

    const current = resolvedWorkOrder || {};
    const media = Array.isArray(photo?.photo?.media) ? photo.photo.media : [];
    const attachmentIds = media.reduce((ids, item) => addUnique(ids, item.mediaId), current.references?.attachmentIds || []);
    const documents = media.map((item, index) => ({
      documentId: item.mediaId || `${photoId}-MEDIA-${index + 1}`,
      title: photo?.photo?.title || item.fileName || `Photo ${index + 1}`,
      fileName: item.fileName || "",
      type: "photo",
      typeLabel: photo?.photo?.type === "damage" ? "DAMAGE" : photo?.photo?.type === "before-after" ? "BEFORE / AFTER" : photo?.photo?.type === "reference" ? "REFERENCE" : "WORK PHOTO",
      issuer: photo?.audit?.createdByLabel || "",
      relatedType: "photo",
      relatedId: photoId,
      relatedLabel: photo?.photo?.title || photoId,
      date: photo?.photo?.occurredAt || photo?.audit?.createdAt || new Date().toISOString(),
      addedBy: photo?.audit?.createdByLabel || "",
      mimeType: item.mimeType || "image/jpeg",
      size: Number(item.size || 0),
      previewUrl: item.previewUrl || "",
      persistenceState: item.status || "local-pending-upload"
    }));

    let documentProjection = Array.isArray(current.documentProjection) ? current.documentProjection : [];
    for (const document of documents) {
      documentProjection = appendUniqueRecord(documentProjection, document, item => item?.documentId || item?.id);
    }

    const storedPhoto = { ...photo, identity: { ...(photo.identity || {}), photoId } };
    const activity = {
      activityId: `ACT-${photoId}`,
      type: "photo-added",
      photoId,
      photoType: photo?.photo?.type || "work-photo",
      title: photo?.photo?.title || "",
      count: media.length,
      occurredAt: photo?.photo?.occurredAt || new Date().toISOString(),
      actorLabel: photo?.audit?.createdByLabel || clean(context.actor?.displayName || context.actor?.name || context.actor?.label)
    };

    const next = {
      ...current,
      references: { ...(current.references || {}), photoIds: addUnique(current.references?.photoIds, photoId), attachmentIds },
      photoProjection: appendUniqueRecord(current.photoProjection, storedPhoto, item => item?.identity?.photoId || item?.identity?.clientRequestId),
      documentProjection,
      activityProjection: appendUniqueRecord(current.activityProjection, activity, item => item?.activityId)
    };

    setWorkOrderSnapshot(next);
    await onOpenModule?.(
      { id: "photo-save", label: "SAVE PHOTO", group: "work-order-action", documentType: "photo" },
      context,
      { workOrder: next, photo: storedPhoto, input, response, activity, documents }
    );
    setModuleId("work-order");
  }

  if (billOpen) {
    return (
      <IXIBillStandaloneApp
        context={context}
        object={object}
        authority={actor?.billAuthority || actor?.financialAuthority || actor?.purchasingAuthority || {}}
        onBack={() => setModuleId("")}
        onRecordChange={billChanged}
      />
    );
  }

  return (
    <div className={`ixi-transact-app ixi-transact-v13 board-color-none board-outline-1 ${compactHeader ? "module-open" : "home-open"}`}>
      <header className="tx-header">
        <div className="tx-brand">
          <span>IXI TRAN$ACT</span>
          {!compactHeader ? <><strong>{context.primary.label}</strong><small>{context.primary.objectType || "AOS OBJECT"}</small></> : null}
        </div>
        <button className="tx-close" type="button" onClick={() => onClose?.()} aria-label="Close TRAN$ACT">×</button>
      </header>

      <main className="tx-body">
        {noteOpen ? (
          <IXINoteApp context={context} workOrder={resolvedWorkOrder || {}} onCancel={() => setModuleId("work-order")} onSave={saveNote} />
        ) : photoOpen ? (
          <IXIPhotoApp context={context} workOrder={resolvedWorkOrder || {}} onCancel={() => setModuleId("work-order")} onSave={savePhoto} />
        ) : expenseOpen ? (
          <IXIExpenseApp context={context} workOrder={resolvedWorkOrder} onCancel={() => setModuleId("")} onSave={saveDirectExpense} />
        ) : purchaseOrderOpen ? (
          <IXIPurchaseOrderApp context={context} onBack={() => setModuleId("")} onRecordChange={purchaseOrderChanged} />
        ) : timeOpen ? (
          <IXITimeStandaloneApp context={context} object={object} onBack={() => setModuleId("")} onRecordChange={timeChanged} />
        ) : materialOpen ? (
          <IXIMaterialStandaloneApp context={context} object={object} onBack={() => setModuleId("")} onRecordChange={materialChanged} />
        ) : active?.id === "work-order" ? (
          <IXIWorkOrderApp
            context={context}
            initialWorkOrder={resolvedWorkOrder}
            onBack={() => setModuleId("")}
            onCreate={async (draft, workContext) => {
              setWorkOrderSnapshot(draft);
              await onOpenModule?.(
                { id: "work-order-create", label: "CREATE WORK ORDER", group: "work", documentType: "work-order" },
                workContext,
                { workOrder: draft }
              );
            }}
            onAction={workOrderAction}
          />
        ) : active?.id === "technology-work" ? (
          <IXITechWorkOrderApp
            context={context}
            onBack={() => setModuleId("")}
            onCreate={techWorkOrderCreated}
            onRecordChange={techWorkOrderChanged}
          />
        ) : active ? (
          <div className="tx-module">
            <button className="tx-back" onClick={() => setModuleId("")}>‹ TRAN$ACT</button>
            <div className="tx-module-title"><span>{active.group.toUpperCase()}</span><strong>{active.label}</strong></div>
            <div className="tx-module-placeholder"><b>{active.label}</b><span>MODULE CHASSIS READY</span><small>{active.documentType} · {context.primary.label}</small></div>
          </div>
        ) : (
          <>
            {context.activeWorkOrder ? (
              <button className="tx-open-work" onClick={() => {
                setWorkOrderSnapshot(context.activeWorkOrder);
                open({ id: "work-order", label: "CONTINUE WORK", group: "work", documentType: "work-order" });
              }}>
                <span>OPEN WORK</span>
                <strong>{clean(context.activeWorkOrder.workOrderNumber || context.activeWorkOrder.number || context.activeWorkOrder.id) || "WORK ORDER"}</strong>
                <small>{clean(context.activeWorkOrder.title || context.activeWorkOrder.description) || "IN PROGRESS"}</small>
                <b>CONTINUE ›</b>
              </button>
            ) : null}
            <div className="tx-label">CREATE / OPEN</div>
            <div className="tx-grid">
              {modules.map(item => <button key={item.id} onClick={() => open(item)}><span>{item.group.toUpperCase()}</span><strong>{item.label}</strong><small>{item.documentType}</small></button>)}
            </div>
          </>
        )}
      </main>

      <IXIMachineRail
        listing={object}
        saved={false}
        boardColor="none"
        boardOutline={1}
        machineFace={0}
        onSendFront={onSendFront}
        onSendBack={onSendBack}
        onCycleColor={onCycleColor}
        onCycleOutline={onCycleOutline}
        armedDestination={armedDestination}
        onSendToArmedDestination={onSendToArmedDestination}
      />
      <IXITransactStyles />
    </div>
  );
}
