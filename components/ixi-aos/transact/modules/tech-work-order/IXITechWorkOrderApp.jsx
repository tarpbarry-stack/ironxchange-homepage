import { useEffect, useState } from "react";

import {
  createIXITechWorkOrderDraft,
  normalizeIXITechWorkOrder
} from "./IXITechWorkOrderContract";
import { createIXITechWorkOrder } from "./IXITechWorkOrderCommands";
import {
  applyIXITechWorkOrderAction
} from "./IXITechWorkOrderEngine";
import IXITechWorkOrderStyles from "./IXITechWorkOrderStyles";
import IXITechWorkOrderEvidenceSections from "./IXITechWorkOrderEvidenceSections";
import IXIWorkOrderStyles from "../work-order/IXIWorkOrderStyles";
import {
  IXIWorkOrderActivityView,
  IXIWorkOrderCostView,
  IXIWorkOrderRelatedView
} from "../work-order/IXIWorkOrderTabViews";
import IXIExpenseApp from "../expense/IXIExpenseApp";
import IXIMaterialApp from "../material/IXIMaterialApp";
import IXITimeEntryApp from "../time/IXITimeEntryApp";
import IXIServiceApp from "../service/IXIServiceApp";
import IXIPurchaseApp from "../purchase/IXIPurchaseApp";
import IXINoteApp from "../note/IXINoteApp";
import IXIPhotoApp from "../photo/IXIPhotoApp";
import IXIWorkOrderDocumentsApp from "../documents/IXIWorkOrderDocumentsApp";
import { createIXITimeEntry } from "../time/IXITimeEntryCommands";
import {
  getIXIActiveTimeSession,
  getIXITimeSessionElapsedMs,
  getIXITimeSessionUnrecordedMs,
  formatIXITimeDuration,
  pauseIXITimeSession,
  resumeIXITimeSession,
  startIXITimeSession,
  markIXITimeSessionRecorded,
  subscribeIXITimeSession
} from "../time/IXITimeSessionRuntime";
import {
  WorkOrderIcon,
  LocationIcon,
  FlagIcon,
  OperableIcon,
  LimitedIcon,
  DownIcon,
  PersonIcon,
  TeamIcon,
  CreateIcon,
  EditIcon,
  ClockIcon,
  MaterialIcon,
  ServiceIcon,
  ExpenseIcon,
  PurchaseIcon,
  DocumentIcon,
  PauseIcon,
  RefreshIcon
} from "../../IXITransactIcons";

const clean = value => String(value ?? "").trim();
const number = value => Number.isFinite(Number(value)) ? Number(value) : 0;
const unique = values => [...new Set((Array.isArray(values) ? values : []).map(clean).filter(Boolean))];

const COPY = {
  en: {
    new: "NEW TECH WORK ORDER",
    sub: "Create and start technology work",
    back: "TRAN$ACT",
    location: "ORIGINATING OBJECT",
    problem: "WHAT NEEDS TECH WORK?",
    placeholder: "Describe the technology issue, request, change, or failure...",
    photo: "ADD PHOTO",
    voice: "VOICE NOTE",
    type: "TECH WORK TYPE",
    incident: "INCIDENT",
    request: "SERVICE REQUEST",
    diagnostic: "DIAGNOSTIC",
    change: "CHANGE / DEPLOY",
    priority: "PRIORITY",
    normal: "NORMAL",
    high: "HIGH",
    critical: "CRITICAL",
    impact: "SYSTEM IMPACT",
    healthy: "OPERATING",
    degraded: "DEGRADED",
    down: "DOWN / BLOCKED",
    environment: "ENVIRONMENT",
    system: "SYSTEM / APPLICATION",
    version: "VERSION / DEVICE",
    assign: "ASSIGN TO",
    me: "ME",
    create: "CREATE TECH WORK ORDER",
    createSub: "CREATE TECHWO AND START WORK",
    work: "WORK",
    cost: "COST",
    activity: "ACTIVITY",
    related: "RELATED",
    status: "WORK STATUS",
    description: "TECH WORK DESCRIPTION",
    add: "ADD TO TECHWO",
    time: "+ TIME",
    material: "+ MATERIAL",
    service: "+ SERVICE",
    expense: "+ EXPENSE",
    purchase: "+ PURCHASE",
    document: "DOCUMENTS",
    note: "+ ADD NOTE",
    photoAction: "+ ADD PHOTO",
    pause: "PAUSE WORK",
    resume: "RESUME WORK",
    complete: "COMPLETE WORK",
    reopen: "REOPEN TECHWO",
    inProgress: "IN PROGRESS",
    paused: "PAUSED",
    completeState: "COMPLETE",
    waiting: "WAITING",
    timer: "TIMER",
    running: "RUNNING",
    total: "TOTAL ON TECHWO",
    locked: "LOCKED",
    workPaused: "WORK PAUSED",
    timeRecorded: "TIME RECORDED",
    workResumed: "WORK RESUMED",
    timerStarted: "TIMER STARTED",
    timerPaused: "TIMER PAUSED",
    rootCause: "ROOT CAUSE / RESOLUTION",
    resolutionPlaceholder: "Describe root cause, repair/change performed, validation, and any follow-up...",
    finish: "COMPLETE TECH WORK",
    noActivity: "No activity yet.",
    assigned: "ASSIGNED TECHNICIAN",
    crew: "CREW / TEAM",
    editWork: "EDIT TECHNOLOGY WORK",
    editTechnician: "CHANGE TECHNICIAN",
    editCrew: "EDIT CREW / TEAM",
    completeTitle: "COMPLETE TECHNOLOGY WORK",
    reopenTitle: "REOPEN TECHNOLOGY WORK",
    backToWork: "BACK TO TECHWO",
    reason: "CHANGE REASON",
    passport: "IXI PASSPORT",
    technicianName: "TECHNICIAN NAME",
    crewName: "CREW MEMBER NAME",
    addCrew: "+ ADD CREW MEMBER",
    remove: "REMOVE",
    saveChanges: "SAVE CHANGES",
    cancel: "CANCEL",
    saving: "SAVING…",
    workPerformed: "WORK PERFORMED",
    rootCauseField: "ROOT CAUSE",
    resolution: "RESOLUTION / CHANGE APPLIED",
    validation: "VALIDATION PERFORMED",
    result: "FINAL RESULT",
    finalImpact: "FINAL SYSTEM IMPACT",
    recommendations: "RECOMMENDATIONS / FOLLOW-UP",
    fullyFunctioning: "FULLY FUNCTIONING",
    functionalNotes: "FUNCTIONAL WITH NOTES",
    furtherWork: "FURTHER WORK REQUIRED",
    unresolved: "UNRESOLVED",
    confirmComplete: "CONFIRM COMPLETION",
    confirmReopen: "REOPEN TECHWO",
    saved: "TECHWO SAVED",
    passportInvalid: "VALID IXI PASSPORT REQUIRED",
    completionSummary: "COMPLETION RECORD",
    performedOn: "WORK PERFORMED DATE",
    recordedOn: "RECORDED ON"
  },
  es: {
    new: "NUEVA ORDEN DE TRABAJO TÉCNICO",
    sub: "Crear y comenzar trabajo de tecnología",
    back: "TRAN$ACT",
    location: "OBJETO DE ORIGEN",
    problem: "¿QUÉ NECESITA TRABAJO TÉCNICO?",
    placeholder: "Describe el problema, solicitud, cambio o falla de tecnología...",
    photo: "AGREGAR FOTO",
    voice: "NOTA DE VOZ",
    type: "TIPO DE TRABAJO TÉCNICO",
    incident: "INCIDENTE",
    request: "SOLICITUD",
    diagnostic: "DIAGNÓSTICO",
    change: "CAMBIO / DESPLIEGUE",
    priority: "PRIORIDAD",
    normal: "NORMAL",
    high: "ALTA",
    critical: "CRÍTICA",
    impact: "IMPACTO DEL SISTEMA",
    healthy: "OPERANDO",
    degraded: "DEGRADADO",
    down: "CAÍDO / BLOQUEADO",
    environment: "ENTORNO",
    system: "SISTEMA / APLICACIÓN",
    version: "VERSIÓN / DISPOSITIVO",
    assign: "ASIGNAR A",
    me: "YO",
    create: "CREAR ORDEN TÉCNICA",
    createSub: "CREAR TECHWO Y COMENZAR",
    work: "TRABAJO",
    cost: "COSTO",
    activity: "ACTIVIDAD",
    related: "RELACIONADO",
    status: "ESTADO DEL TRABAJO",
    description: "DESCRIPCIÓN DEL TRABAJO TÉCNICO",
    add: "AGREGAR A TECHWO",
    time: "+ TIEMPO",
    material: "+ MATERIAL",
    service: "+ SERVICIO",
    expense: "+ GASTO",
    purchase: "+ COMPRA",
    document: "DOCUMENTOS",
    note: "+ AGREGAR NOTA",
    photoAction: "+ AGREGAR FOTO",
    pause: "PAUSAR TRABAJO",
    resume: "REANUDAR TRABAJO",
    complete: "TERMINAR TRABAJO",
    reopen: "REABRIR TECHWO",
    inProgress: "EN PROGRESO",
    paused: "PAUSADO",
    completeState: "TERMINADO",
    waiting: "EN ESPERA",
    timer: "TEMPORIZADOR",
    running: "EN CURSO",
    total: "TOTAL EN TECHWO",
    locked: "BLOQUEADO",
    workPaused: "TRABAJO PAUSADO",
    timeRecorded: "TIEMPO REGISTRADO",
    workResumed: "TRABAJO REANUDADO",
    timerStarted: "TEMPORIZADOR INICIADO",
    timerPaused: "TEMPORIZADOR PAUSADO",
    rootCause: "CAUSA RAÍZ / RESOLUCIÓN",
    resolutionPlaceholder: "Describe la causa, reparación/cambio, validación y seguimiento...",
    finish: "TERMINAR TRABAJO TÉCNICO",
    noActivity: "Sin actividad todavía.",
    assigned: "TÉCNICO ASIGNADO",
    crew: "CUADRILLA / EQUIPO",
    editWork: "EDITAR TRABAJO TECNOLÓGICO",
    editTechnician: "CAMBIAR TÉCNICO",
    editCrew: "EDITAR CUADRILLA / EQUIPO",
    completeTitle: "TERMINAR TRABAJO TECNOLÓGICO",
    reopenTitle: "REABRIR TRABAJO TECNOLÓGICO",
    backToWork: "VOLVER A TECHWO",
    reason: "MOTIVO DEL CAMBIO",
    passport: "PASAPORTE IXI",
    technicianName: "NOMBRE DEL TÉCNICO",
    crewName: "NOMBRE DEL MIEMBRO",
    addCrew: "+ AGREGAR MIEMBRO",
    remove: "QUITAR",
    saveChanges: "GUARDAR CAMBIOS",
    cancel: "CANCELAR",
    saving: "GUARDANDO…",
    workPerformed: "TRABAJO REALIZADO",
    rootCauseField: "CAUSA RAÍZ",
    resolution: "SOLUCIÓN / CAMBIO APLICADO",
    validation: "VALIDACIÓN REALIZADA",
    result: "RESULTADO FINAL",
    finalImpact: "IMPACTO FINAL DEL SISTEMA",
    recommendations: "RECOMENDACIONES / SEGUIMIENTO",
    fullyFunctioning: "FUNCIONANDO COMPLETAMENTE",
    functionalNotes: "FUNCIONAL CON NOTAS",
    furtherWork: "REQUIERE MÁS TRABAJO",
    unresolved: "SIN RESOLVER",
    confirmComplete: "CONFIRMAR FINALIZACIÓN",
    confirmReopen: "REABRIR TECHWO",
    saved: "TECHWO GUARDADA",
    passportInvalid: "SE REQUIERE PASAPORTE IXI VÁLIDO",
    completionSummary: "REGISTRO DE FINALIZACIÓN",
    performedOn: "FECHA DEL TRABAJO REALIZADO",
    recordedOn: "REGISTRADO EL"
  }
};

function dateOf(iso = "") {
  const date = iso ? new Date(iso) : new Date();
  return Number.isNaN(date.getTime())
    ? new Date().toISOString().slice(0, 10)
    : date.toISOString().slice(0, 10);
}

function timeOf(iso = "") {
  const date = iso ? new Date(iso) : new Date();
  return Number.isNaN(date.getTime()) ? "" : date.toTimeString().slice(0, 5);
}

function LanguageToggle({ language, onChange }) {
  return (
    <div className="wo-lang">
      <button className={language === "en" ? "on" : ""} onClick={() => onChange("en")}>ENG</button>
      <i>/</i>
      <button className={language === "es" ? "on" : ""} onClick={() => onChange("es")}>ESP</button>
    </div>
  );
}

function addReference(record, key, id, financialKey = "", amount = 0) {
  const referenceId = clean(id);
  if (!referenceId) return record;
  const current = unique(record?.references?.[key]);
  if (current.includes(referenceId)) return record;

  return {
    ...record,
    references: {
      ...(record.references || {}),
      [key]: [...current, referenceId]
    },
    financial: financialKey
      ? {
          ...(record.financial || {}),
          [financialKey]: number(record?.financial?.[financialKey]) + number(amount)
        }
      : record.financial
  };
}

function addDocuments(record, attachments = [], sourceType = "general", sourceId = "", issuer = "", actorName = "") {
  const existing = Array.isArray(record?.documentProjection) ? record.documentProjection : [];
  const next = [...existing];

  for (const item of Array.isArray(attachments) ? attachments : []) {
    const fileName = clean(item?.fileName || item?.name || item?.title) || `${sourceType} document`;
    const id = clean(item?.documentId || item?.id || item?.clientRequestId) || `${sourceType}:${sourceId}:${fileName}`;
    if (next.some(doc => clean(doc?.documentId || doc?.id) === id)) continue;

    next.push({
      documentId: id,
      title: fileName,
      fileName,
      type: item?.type || sourceType,
      issuer,
      relatedType: sourceType,
      relatedId: sourceId,
      relatedLabel: sourceId,
      date: new Date().toISOString(),
      addedBy: actorName,
      mimeType: item?.mimeType || item?.type || "",
      size: number(item?.size),
      persistenceState: item?.status || "source-record"
    });
  }

  return {
    ...record,
    documentProjection: next
  };
}

export default function IXITechWorkOrderApp({
  context = {},
  initialTechWorkOrder = null,
  financialRecords = [],
  onBack = null,
  onCreate = null,
  onRecordChange = null
}) {
  const [lang, setLang] = useState("en");
  const [record, setRecord] = useState(
    initialTechWorkOrder ? normalizeIXITechWorkOrder(initialTechWorkOrder) : null
  );
  const [description, setDescription] = useState("");
  const [type, setType] = useState("incident");
  const [priority, setPriority] = useState("normal");
  const [impact, setImpact] = useState("normal");
  const [environment, setEnvironment] = useState("production");
  const [systemName, setSystemName] = useState("");
  const [version, setVersion] = useState("");
  const [performedOn, setPerformedOn] = useState(dateOf());
  const [submodule, setSubmodule] = useState("");
  const [tab, setTab] = useState("work");
  const [timerSession, setTimerSession] = useState(null);
  const [timerTick, setTimerTick] = useState(Date.now());
  const [notice, setNotice] = useState("");
  const [editor, setEditor] = useState("");
  const [editDraft, setEditDraft] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const t = COPY[lang];
  const actorName = clean(
    context.actor?.displayName ||
    context.actor?.name ||
    context.actor?.label
  ) || "—";
  const objectLabel = clean(context.primary?.label) || "AOS OBJECT";
  function refreshTimer() {
    setTimerSession(getIXIActiveTimeSession(context));
    setTimerTick(Date.now());
  }

  useEffect(() => {
    setRecord(initialTechWorkOrder ? normalizeIXITechWorkOrder(initialTechWorkOrder) : null);
    setEditor("");
    setEditDraft({});
  }, [initialTechWorkOrder]);

  useEffect(() => {
    refreshTimer();
    const unsubscribe = subscribeIXITimeSession(refreshTimer);
    const interval = setInterval(() => setTimerTick(Date.now()), 1000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [
    context.actor?.passportId,
    context.actor?.employeeId,
    context.actor?.userId
  ]);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(() => setNotice(""), 3200);
    return () => clearTimeout(timer);
  }, [notice]);

  async function commit(next, change = {}) {
    const normalized = normalizeIXITechWorkOrder(next);
    const persisted = await onRecordChange?.(normalized, change, context);
    const canonical = normalizeIXITechWorkOrder(persisted || normalized);
    setRecord(canonical);
    return canonical;
  }

  async function create() {
    if (busy) return;

    const now = Date.now();
    const commandId = globalThis.crypto?.randomUUID?.() || `techwo-create-${now}-${Math.random().toString(16).slice(2)}`;
    const resolvedDescription = clean(description) || "Technology work order";
    const draft = createIXITechWorkOrderDraft({
      context,
      input: {
        title: resolvedDescription.slice(0, 80),
        description: resolvedDescription,
        type,
        priority,
        impact,
        environment,
        systemName,
        version,
        performedOn,
        assignedTo: [context.actor || {}],
        status: "in-progress"
      }
    });

    draft.dates.startedAt = new Date().toISOString();
    draft.activityProjection = [{
      activityId: `TECHACT-${now}`,
      type: "tech-work-created",
      actorLabel: actorName,
      occurredAt: new Date().toISOString(),
      note: resolvedDescription
    }];

    setError("");

    setBusy(true);
    try {
      const persisted = await createIXITechWorkOrder({
        object: context.primary || {},
        context,
        input: {
          title: draft.work.title,
          description: draft.work.description,
          type: draft.work.type,
          priority: draft.work.priority,
          impact: draft.work.impact,
          environment: draft.technology.environment,
          systemName: draft.technology.systemName,
          version: draft.technology.version,
          performedOn: draft.dates.performedOn,
          assignedTo: draft.people.assignedTo,
          status: draft.work.status,
          startedAt: draft.dates.startedAt,
          activityProjection: draft.activityProjection
        },
        commandId,
        idempotencyKey: commandId
      });
      const canonical = persisted.draft;
      setTab("work");
      setSubmodule("");
      await onCreate?.(canonical, context, persisted.response);
      setRecord(canonical);
      setNotice(`TECHWO ${canonical.identity.number} CREATED`);
    } catch (err) {
      setError(clean(err?.message) || "TECHWO CREATE PERSISTENCE FAILED");
    } finally {
      setBusy(false);
    }
  }

  async function lifecycle(action, payload = {}) {
    if (!record || busy) return;
    setBusy(true);
    setError("");

    try {
      const next = applyIXITechWorkOrderAction({
        record,
        action,
        actor: context.actor || {},
        payload
      });
      await commit(next, { action, payload });
      setNotice(
        action === "pause"
          ? t.workPaused
          : action === "resume"
            ? t.workResumed
            : action === "complete"
              ? t.completeState
              : action.toUpperCase()
      );
      setEditor("");
      setEditDraft({});
    } catch (err) {
      setError(clean(err?.message) || "TECHWO ACTION FAILED");
    } finally {
      setBusy(false);
    }
  }

  function openEditor(nextEditor) {
    if (nextEditor === "edit") {
      setEditDraft({
        description: clean(record?.work?.description),
        type: clean(record?.work?.type || "incident"),
        priority: clean(record?.work?.priority || "normal"),
        impact: clean(record?.work?.impact || "normal"),
        environment: clean(record?.technology?.environment || "production"),
        systemName: clean(record?.technology?.systemName),
        version: clean(record?.technology?.version),
        performedOn: clean(record?.dates?.performedOn) || dateOf(record?.dates?.requestedAt),
        reason: ""
      });
    } else if (nextEditor === "assign") {
      const assigned = record?.people?.assignedTo?.[0] || {};
      setEditDraft({
        passportId: clean(assigned.passportId || context.actor?.passportId),
        label: clean(assigned.label || context.actor?.displayName || context.actor?.label),
        reason: ""
      });
    } else if (nextEditor === "crew") {
      setEditDraft({ crew: [...(record?.people?.crew || [])], passportId: "", label: "", reason: "" });
    } else if (nextEditor === "complete") {
      setEditDraft({
        workPerformed: clean(record?.result?.workPerformed),
        rootCause: clean(record?.technology?.rootCause),
        resolution: clean(record?.technology?.resolution),
        validation: clean(record?.technology?.validation),
        disposition: clean(record?.result?.disposition || "fully-functioning"),
        finalImpact: clean(record?.result?.finalImpact || "normal"),
        recommendations: clean(record?.result?.recommendations)
      });
    } else if (nextEditor === "reopen") {
      setEditDraft({ reason: "" });
    }
    setEditor(nextEditor);
  }

  async function verifyIXIPassport(passportId) {
    const normalized = clean(passportId).toUpperCase();
    if (!normalized) throw new Error(t.passportInvalid);
    const response = await fetch(`/api/passport/${encodeURIComponent(normalized)}`, {
      method: "GET",
      credentials: "include",
      headers: { Accept: "application/json" }
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload?.passport) throw new Error(payload?.error || t.passportInvalid);
    return normalized;
  }

  async function saveEditor() {
    try {
      if (editor === "edit") return lifecycle("update", editDraft);
      if (editor === "assign") {
        const passportId = await verifyIXIPassport(editDraft.passportId);
        return lifecycle("assign", {
          technician: { passportId, label: clean(editDraft.label) },
          reason: editDraft.reason
        });
      }
      if (editor === "crew") return lifecycle("crew", { crew: editDraft.crew, reason: editDraft.reason });
      if (editor === "complete") return lifecycle("complete", editDraft);
      if (editor === "reopen") return lifecycle("reopen", { reason: editDraft.reason });
    } catch (err) {
      setError(clean(err?.message) || "TECHWO NOT SAVED");
    }
    return null;
  }

  async function addCrewMember() {
    const label = clean(editDraft.label);
    if (!label || !clean(editDraft.passportId)) {
      setError("CREW NAME AND IXI PASSPORT ARE REQUIRED");
      return;
    }
    try {
      const passportId = await verifyIXIPassport(editDraft.passportId);
      const crew = [...(editDraft.crew || [])];
      if (!crew.some(person => clean(person.passportId).toUpperCase() === passportId)) crew.push({ passportId, label });
      setEditDraft({ ...editDraft, crew, passportId: "", label: "" });
      setError("");
    } catch (err) {
      setError(clean(err?.message) || t.passportInvalid);
    }
  }

  async function saveExpense(draft, input, response) {
    const id = clean(draft?.identity?.expenseId || draft?.identity?.clientRequestId) || `EXP-${Date.now()}`;
    let next = addReference(record, "expenseIds", id, "otherActual", input?.amount ?? draft?.expense?.amount);
    next = addDocuments(next, input?.attachments || draft?.attachments, "receipt", id, clean(input?.vendor || draft?.expense?.vendor), actorName);
    await commit(next, { action: "expense-save", expense: draft, response });
    setSubmodule("");
  }

  async function saveMaterial(draft, input, response) {
    const id = clean(draft?.identity?.materialUsageId);
    if (!id || !draft?.financialBinding?.financialDocumentId) throw new Error("MATERIAL IS NOT BOUND TO IXI FINANCIAL");
    let next = addReference(record, "materialRecordIds", id, "materialActual", draft?.material?.extendedCost);
    next = addDocuments(next, input?.attachments || draft?.attachments, "material", id, clean(input?.vendorLabel || draft?.material?.vendorLabel), actorName);
    await commit(next, { action: "material-save", material: draft, response });
    setSubmodule("");
  }

  async function saveTime(draft, input, response) {
    const id = clean(draft?.identity?.timeEntryId || draft?.identity?.clientRequestId) || `TIME-${Date.now()}`;
    let next = addReference(record, "timeEntryIds", id);
    next = addDocuments(next, input?.attachments || draft?.attachments, "time", id, actorName, actorName);
    await commit(next, { action: "time-save", timeEntry: draft, response });
    setSubmodule("");
  }

  async function saveService(draft, input, response) {
    const id = clean(draft?.identity?.serviceRecordId || draft?.identity?.clientRequestId) || `SVC-${Date.now()}`;
    let next = addReference(record, "serviceRecordIds", id, "serviceActual", draft?.service?.amount);
    next = addDocuments(next, input?.attachments || draft?.attachments, "invoice", id, clean(input?.vendorLabel || draft?.service?.vendorLabel), actorName);
    await commit(next, { action: "service-save", service: draft, response });
    setSubmodule("");
  }

  async function savePurchase(draft, input, response) {
    const requestType = clean(draft?.purchase?.requestType) === "purchase-order"
      ? "purchase-order"
      : "purchase-request";
    const id = clean(draft?.identity?.purchaseId || draft?.identity?.clientRequestId) || `PUR-${Date.now()}`;
    const isOrder = requestType === "purchase-order";
    const amount = isOrder
      ? number(draft?.financial?.committedAmount || draft?.purchase?.estimatedTotal)
      : number(draft?.financial?.requestedAmount || draft?.purchase?.estimatedTotal);

    let next = addReference(
      record,
      isOrder ? "purchaseOrderIds" : "purchaseRequestIds",
      id,
      isOrder ? "committed" : "requested",
      amount
    );
    next = addDocuments(next, input?.attachments || draft?.purchase?.attachments, "quote", id, clean(input?.vendorLabel || draft?.purchase?.vendorLabel), actorName);
    await commit(next, { action: "purchase-save", purchase: draft, response, requestType });
    setSubmodule("");
  }

  async function saveNote(note) {
    const id = clean(note?.identity?.noteId || note?.identity?.clientRequestId) || `NOTE-${Date.now()}`;
    const stored = {
      ...note,
      identity: {
        ...(note.identity || {}),
        noteId: id
      }
    };

    const next = {
      ...record,
      references: {
        ...(record.references || {}),
        noteIds: unique([...(record.references?.noteIds || []), id])
      },
      noteProjection: [...(record.noteProjection || []), stored],
      activityProjection: [
        ...(record.activityProjection || []),
        {
          activityId: `TECHACT-${Date.now()}`,
          type: "note-added",
          actorLabel: actorName,
          occurredAt: new Date().toISOString(),
          note: clean(note?.note?.title || note?.note?.body)
        }
      ]
    };

    await commit(next, { action: "note-save", note: stored });
    setSubmodule("");
  }

  async function savePhoto(photo) {
    const id = clean(photo?.identity?.photoId || photo?.identity?.clientRequestId) || `PHOTO-${Date.now()}`;
    const stored = {
      ...photo,
      identity: {
        ...(photo.identity || {}),
        photoId: id
      }
    };
    const media = Array.isArray(photo?.photo?.media) ? photo.photo.media : [];
    const docs = media.map((item, index) => ({
      documentId: clean(item.mediaId) || `${id}-MEDIA-${index + 1}`,
      title: clean(photo?.photo?.title || item.fileName) || `Tech photo ${index + 1}`,
      fileName: clean(item.fileName),
      type: "photo",
      relatedType: "photo",
      relatedId: id,
      date: photo?.photo?.occurredAt || new Date().toISOString(),
      addedBy: actorName,
      previewUrl: item.previewUrl || "",
      persistenceState: item.status || "local-pending-upload"
    }));

    const next = {
      ...record,
      references: {
        ...(record.references || {}),
        photoIds: unique([...(record.references?.photoIds || []), id]),
        attachmentIds: unique([
          ...(record.references?.attachmentIds || []),
          ...docs.map(item => item.documentId)
        ])
      },
      photoProjection: [...(record.photoProjection || []), stored],
      documentProjection: [
        ...(record.documentProjection || []),
        ...docs.filter(doc => !(record.documentProjection || []).some(existing => existing.documentId === doc.documentId))
      ],
      activityProjection: [
        ...(record.activityProjection || []),
        {
          activityId: `TECHACT-${Date.now()}`,
          type: "photo-added",
          actorLabel: actorName,
          occurredAt: new Date().toISOString(),
          note: `${media.length} photo${media.length === 1 ? "" : "s"}`
        }
      ]
    };

    await commit(next, { action: "photo-save", photo: stored, documents: docs });
    setSubmodule("");
  }

  async function addGeneralDocument(input) {
    const id = clean(input?.documentId || input?.clientRequestId) || `DOC-${Date.now()}`;
    const document = {
      ...input,
      documentId: id,
      type: "other",
      relatedType: "tech-work-order",
      relatedId: clean(record?.identity?.techWorkOrderId),
      relatedLabel: clean(record?.identity?.number),
      persistenceState: input?.status || "pending-parent-command"
    };
    const existing = record.documentProjection || [];
    const next = {
      ...record,
      documentProjection: existing.some(item => clean(item.documentId) === id)
        ? existing
        : [...existing, document],
      references: {
        ...(record.references || {}),
        attachmentIds: unique([...(record.references?.attachmentIds || []), id])
      }
    };
    await commit(next, { action: "document-general-add", document });
  }

  async function recordTimerDelta(session, action) {
    if (!record || !session) return;

    const milliseconds = getIXITimeSessionUnrecordedMs(session);
    if (milliseconds < 1000) return;

    const hours = milliseconds / 3600000;
    const input = {
      clientRequestId: `${session.sessionId}:${action}:${Math.round(getIXITimeSessionElapsedMs(session))}`,
      mode: "live",
      employeePassportId: context.actor?.passportId,
      employeeId: context.actor?.employeeId,
      workType: clean(record?.work?.type) || "Technology Work",
      date: dateOf(session.lastStartedAt || session.startedAt),
      startTime: timeOf(session.lastStartedAt || session.startedAt),
      endTime: timeOf(new Date().toISOString()),
      hours,
      billable: true,
      overtime: false,
      description: clean(record?.work?.description) || "Technology work performed",
      notes: "",
      attachments: []
    };

    let draft = {
      identity: {
        timeEntryId: `TIME-${Date.now()}`
      },
      time: { hours }
    };
    let response = null;

    if (clean(context.primary?.passportId) && clean(record?.identity?.workOrderId)) {
      const persisted = await createIXITimeEntry({
        object: {
          passportId: context.primary.passportId,
          objectType: context.primary.objectType,
          label: context.primary.label
        },
        context,
        workOrder: record,
        input,
        metadata: {
          source: "ixi-transact-techwo-live-timer",
          techWorkOrderId: record.identity.techWorkOrderId,
          timerSessionId: session.sessionId,
          action
        }
      });
      draft = persisted?.draft || draft;
      response = persisted?.response || null;
    }

    const id = clean(draft?.identity?.timeEntryId || draft?.identity?.clientRequestId) || `TIME-${Date.now()}`;
    const next = addReference(record, "timeEntryIds", id);
    await commit(next, { action: "time-save", timeEntry: draft, response, session });
    markIXITimeSessionRecorded(context, getIXITimeSessionElapsedMs(session));
  }

  async function pauseWork() {
    const current = getIXIActiveTimeSession(context);
    if (current?.status === "running") {
      const paused = pauseIXITimeSession(context);
      await recordTimerDelta(paused, "pause-tech-work");
    }
    await lifecycle("pause");
    refreshTimer();
  }

  async function resumeWork() {
    let session = getIXIActiveTimeSession(context);
    if (session?.status === "paused") {
      session = resumeIXITimeSession(context);
    } else if (!session || session.status === "stopped") {
      session = startIXITimeSession({
        context,
        workOrder: record,
        workType: clean(record?.work?.type) || "Technology Work",
        description: clean(record?.work?.description) || "Technology work performed"
      });
    }
    await lifecycle("resume");
    refreshTimer();
  }

  function handleLiveStart(session) {
    setTimerSession(session);
    setSubmodule("");
    setNotice(t.timerStarted);
  }

  if (record && submodule === "expense") {
    return <IXIExpenseApp context={context} workOrder={record} language={lang} onLanguageChange={setLang} onCancel={() => setSubmodule("")} onSave={saveExpense} />;
  }
  if (record && submodule === "material") {
    return <IXIMaterialApp context={context} workOrder={record} language={lang} onLanguageChange={setLang} onCancel={() => setSubmodule("")} onSave={saveMaterial} />;
  }
  if (record && submodule === "time") {
    return <IXITimeEntryApp context={context} workOrder={record} language={lang} onLanguageChange={setLang} onCancel={() => setSubmodule("")} onSave={saveTime} onLiveStart={handleLiveStart} />;
  }
  if (record && submodule === "service") {
    return <IXIServiceApp context={context} workOrder={record} language={lang} onLanguageChange={setLang} onCancel={() => setSubmodule("")} onSave={saveService} />;
  }
  if (record && submodule === "purchase") {
    return <IXIPurchaseApp context={context} workOrder={record} language={lang} onLanguageChange={setLang} onCancel={() => setSubmodule("")} onSave={savePurchase} />;
  }
  if (record && submodule === "note") {
    return <IXINoteApp context={context} workOrder={record} onCancel={() => setSubmodule("")} onSave={saveNote} />;
  }
  if (record && submodule === "photo") {
    return <IXIPhotoApp context={context} workOrder={record} language={lang} onLanguageChange={setLang} onCancel={() => setSubmodule("")} onSave={savePhoto} />;
  }
  if (record && submodule === "documents") {
    return (
      <IXIWorkOrderDocumentsApp
        context={context}
        workOrder={record}
        documents={record.documentProjection || []}
        language={lang}
        onLanguageChange={setLang}
        onBack={() => setSubmodule("")}
        onDocumentAction={(actionId, row) => onRecordChange?.(record, { action: `document-${actionId}`, document: row }, context)}
        onAddGeneralDocument={addGeneralDocument}
      />
    );
  }

  if (!record) {
    return (
      <div className="wo-app wo-v13 techwo-v13">
        <LanguageToggle language={lang} onChange={setLang} />
        <div className="wo-title">
          <div className="wo-icon"><WorkOrderIcon size={23} /></div>
          <div>
            <span className="techwo-titlemark">TECHWO# XXXXXX</span>
            <strong>{t.new}</strong>
            <small>{t.sub}</small>
          </div>
        </div>
        <button className="wo-back" onClick={() => onBack?.()}>‹ {t.back}</button>
        <label>{t.location}</label>
        <div className="wo-location"><LocationIcon size={15} /><b>{objectLabel}</b><span className="locked">{t.locked}</span></div>
        <label>{t.problem}</label>
        <textarea value={description} onChange={event => setDescription(event.target.value)} placeholder={t.placeholder} />
        <label>{t.performedOn}</label>
        <input className="techwo-date-input" type="date" max={dateOf()} value={performedOn} onChange={event => setPerformedOn(event.target.value)} />
        <label>{t.type}</label>
        <div className="techwo-domain-grid">
          <button className={type === "incident" ? "sel" : ""} onClick={() => setType("incident")}>{t.incident}</button>
          <button className={type === "service-request" ? "sel" : ""} onClick={() => setType("service-request")}>{t.request}</button>
          <button className={type === "diagnostic" ? "sel" : ""} onClick={() => setType("diagnostic")}>{t.diagnostic}</button>
          <button className={type === "deployment-change" ? "sel" : ""} onClick={() => setType("deployment-change")}>{t.change}</button>
        </div>
        <label>{t.priority}</label>
        <div className="wo-three priority">
          <button className={priority === "normal" ? "sel" : ""} onClick={() => setPriority("normal")}><FlagIcon size={15} />{t.normal}</button>
          <button className={priority === "high" ? "sel high" : "high"} onClick={() => setPriority("high")}><FlagIcon size={15} />{t.high}</button>
          <button className={priority === "critical" ? "sel critical" : "critical"} onClick={() => setPriority("critical")}><FlagIcon size={15} />{t.critical}</button>
        </div>
        <label>{t.impact}</label>
        <div className="wo-three condition">
          <button className={impact === "normal" ? "sel" : ""} onClick={() => setImpact("normal")}><OperableIcon size={15} />{t.healthy}</button>
          <button className={impact === "degraded" ? "sel" : ""} onClick={() => setImpact("degraded")}><LimitedIcon size={15} />{t.degraded}</button>
          <button className={impact === "critical" ? "sel down" : "down"} onClick={() => setImpact("critical")}><DownIcon size={15} />{t.down}</button>
        </div>
        <div className="techwo-tech-fields">
          <select value={environment} onChange={event => setEnvironment(event.target.value)} aria-label={t.environment}>
            <option value="production">PRODUCTION</option>
            <option value="test">TEST</option>
            <option value="development">DEVELOPMENT</option>
            <option value="field">FIELD</option>
          </select>
          <input value={systemName} onChange={event => setSystemName(event.target.value)} placeholder={t.system} />
          <input value={version} onChange={event => setVersion(event.target.value)} placeholder={t.version} />
        </div>
        <label>{t.assign}</label>
        <div className="wo-assign"><PersonIcon size={16} /><b>{actorName === "—" ? t.me : actorName}</b><span>⌄</span></div>
        {error ? <div className="wo-notice">{error}</div> : null}
        <button className="wo-create" disabled={busy} onClick={create}><CreateIcon size={19} /><span><b>{t.create}</b><small>{t.createSub}</small></span></button>
        <IXIWorkOrderStyles />
        <IXITechWorkOrderStyles />
      </div>
    );
  }

  const status = clean(record.work?.status);
  const isPaused = status === "paused" || timerSession?.status === "paused";
  const isComplete = ["complete", "closed"].includes(status);
  const elapsed = timerSession ? getIXITimeSessionElapsedMs(timerSession, timerTick) : 0;
  const timerLabel = timerSession?.status === "running" ? t.running : timerSession?.status === "paused" ? t.paused : "—";
  const numberLabel = clean(record.identity?.number) || "TECHWO-XXXXXX";
  const assignedTechnician = record.people?.assignedTo?.[0] || {};
  const crew = Array.isArray(record.people?.crew) ? record.people.crew : [];

  if (editor) {
    const editorTitle = editor === "edit"
      ? t.editWork
      : editor === "assign"
        ? t.editTechnician
        : editor === "crew"
          ? t.editCrew
          : editor === "reopen"
            ? t.reopenTitle
            : t.completeTitle;
    return (
      <div className="wo-app wo-v13 wo-editor techwo-v13">
        <LanguageToggle language={lang} onChange={setLang} />
        {error ? <div className="wo-notice">{error}</div> : null}
        <div className="wo-editor-head">
          <button onClick={() => setEditor("")}>‹ {t.backToWork}</button>
          <strong>{editorTitle}</strong>
          <small>{numberLabel} · {objectLabel}</small>
        </div>

        {editor === "edit" ? <div className="wo-editor-form">
          <label>{t.description}</label><textarea value={editDraft.description || ""} onChange={event => setEditDraft({ ...editDraft, description: event.target.value })} />
          <div className="wo-form-grid">
            <div><label>{t.type}</label><select value={editDraft.type || "incident"} onChange={event => setEditDraft({ ...editDraft, type: event.target.value })}><option value="incident">{t.incident}</option><option value="service-request">{t.request}</option><option value="diagnostic">{t.diagnostic}</option><option value="deployment-change">{t.change}</option></select></div>
            <div><label>{t.priority}</label><select value={editDraft.priority || "normal"} onChange={event => setEditDraft({ ...editDraft, priority: event.target.value })}><option value="normal">{t.normal}</option><option value="high">{t.high}</option><option value="critical">{t.critical}</option></select></div>
            <div><label>{t.impact}</label><select value={editDraft.impact || "normal"} onChange={event => setEditDraft({ ...editDraft, impact: event.target.value })}><option value="normal">{t.healthy}</option><option value="degraded">{t.degraded}</option><option value="critical">{t.down}</option></select></div>
            <div><label>{t.environment}</label><select value={editDraft.environment || "production"} onChange={event => setEditDraft({ ...editDraft, environment: event.target.value })}><option value="production">PRODUCTION</option><option value="test">TEST</option><option value="development">DEVELOPMENT</option><option value="field">FIELD</option></select></div>
            <div><label>{t.system}</label><input value={editDraft.systemName || ""} onChange={event => setEditDraft({ ...editDraft, systemName: event.target.value })} /></div>
            <div><label>{t.version}</label><input value={editDraft.version || ""} onChange={event => setEditDraft({ ...editDraft, version: event.target.value })} /></div>
            <div><label>{t.performedOn}</label><input type="date" max={dateOf()} value={editDraft.performedOn || ""} onChange={event => setEditDraft({ ...editDraft, performedOn: event.target.value })} /></div>
          </div>
          <label>{t.reason}</label><input value={editDraft.reason || ""} onChange={event => setEditDraft({ ...editDraft, reason: event.target.value })} />
        </div> : null}

        {editor === "assign" ? <div className="wo-editor-form">
          <label>{t.technicianName}</label><input value={editDraft.label || ""} onChange={event => setEditDraft({ ...editDraft, label: event.target.value })} />
          <label>{t.passport}</label><input value={editDraft.passportId || ""} onChange={event => setEditDraft({ ...editDraft, passportId: event.target.value })} autoCapitalize="characters" />
          <label>{t.reason}</label><input value={editDraft.reason || ""} onChange={event => setEditDraft({ ...editDraft, reason: event.target.value })} />
        </div> : null}

        {editor === "crew" ? <div className="wo-editor-form">
          <div className="wo-crew-list">{(editDraft.crew || []).length ? editDraft.crew.map(person => <div key={person.passportId}><span><b>{person.label}</b><small>{person.passportId}</small></span><button onClick={() => setEditDraft({ ...editDraft, crew: editDraft.crew.filter(item => item.passportId !== person.passportId) })}>{t.remove}</button></div>) : <p>—</p>}</div>
          <label>{t.crewName}</label><input value={editDraft.label || ""} onChange={event => setEditDraft({ ...editDraft, label: event.target.value })} />
          <label>{t.passport}</label><input value={editDraft.passportId || ""} onChange={event => setEditDraft({ ...editDraft, passportId: event.target.value })} autoCapitalize="characters" />
          <button className="wo-add-crew" onClick={addCrewMember}>{t.addCrew}</button>
          <label>{t.reason}</label><input value={editDraft.reason || ""} onChange={event => setEditDraft({ ...editDraft, reason: event.target.value })} />
        </div> : null}

        {editor === "complete" ? <div className="wo-editor-form">
          <label>{t.workPerformed}</label><textarea value={editDraft.workPerformed || ""} onChange={event => setEditDraft({ ...editDraft, workPerformed: event.target.value })} />
          <label>{t.rootCauseField}</label><textarea value={editDraft.rootCause || ""} onChange={event => setEditDraft({ ...editDraft, rootCause: event.target.value })} />
          <label>{t.resolution}</label><textarea value={editDraft.resolution || ""} onChange={event => setEditDraft({ ...editDraft, resolution: event.target.value })} />
          <label>{t.validation}</label><textarea value={editDraft.validation || ""} onChange={event => setEditDraft({ ...editDraft, validation: event.target.value })} />
          <div className="wo-form-grid">
            <div><label>{t.result}</label><select value={editDraft.disposition || "fully-functioning"} onChange={event => setEditDraft({ ...editDraft, disposition: event.target.value })}><option value="fully-functioning">{t.fullyFunctioning}</option><option value="functional-with-notes">{t.functionalNotes}</option><option value="further-work-required">{t.furtherWork}</option><option value="unresolved">{t.unresolved}</option></select></div>
            <div><label>{t.finalImpact}</label><select value={editDraft.finalImpact || "normal"} onChange={event => setEditDraft({ ...editDraft, finalImpact: event.target.value })}><option value="normal">{t.healthy}</option><option value="degraded">{t.degraded}</option><option value="critical">{t.down}</option></select></div>
          </div>
          <label>{t.recommendations}</label><textarea value={editDraft.recommendations || ""} onChange={event => setEditDraft({ ...editDraft, recommendations: event.target.value })} />
        </div> : null}

        {editor === "reopen" ? <div className="wo-editor-form"><label>{t.reason}</label><textarea value={editDraft.reason || ""} onChange={event => setEditDraft({ ...editDraft, reason: event.target.value })} /></div> : null}

        <div className="wo-editor-actions"><button onClick={() => setEditor("")}>{t.cancel}</button><button className="primary" onClick={saveEditor} disabled={busy}>{busy ? t.saving : editor === "complete" ? t.confirmComplete : editor === "reopen" ? t.confirmReopen : t.saveChanges}</button></div>
        <IXIWorkOrderStyles />
        <IXITechWorkOrderStyles />
      </div>
    );
  }

  return (
    <div className={`wo-app wo-v13 wo-work techwo-v13 ${isPaused ? "paused" : ""} ${isComplete ? "completed" : ""}`}>
      <LanguageToggle language={lang} onChange={setLang} />
      {notice ? <div className="wo-notice">{notice}</div> : null}
      {error ? <div className="wo-notice">{error}</div> : null}

      <div className="wo-work-identity">
        <div className="wo-work-icon"><WorkOrderIcon size={23} /></div>
        <div className="wo-work-copy">
          <div className="wo-number-row">
            <strong>{numberLabel}</strong>
            <span>{isComplete ? t.completeState : isPaused ? t.paused : status === "waiting" ? t.waiting : t.inProgress}</span>
          </div>
          <h3>{objectLabel}</h3>
          <small>{clean(record.work?.type).toUpperCase()}<i>•</i>{clean(record.technology?.environment).toUpperCase()}<i>•</i>{clean(record.work?.impact).toUpperCase()}</small>
        </div>
        {!isComplete ? <button className="wo-edit" onClick={() => openEditor("edit")}><EditIcon size={13} /></button> : null}
      </div>

      <div className="wo-tabs">
        <button className={tab === "work" ? "active" : ""} onClick={() => setTab("work")}>{t.work}</button>
        <button className={tab === "cost" ? "active" : ""} onClick={() => setTab("cost")}>{t.cost}</button>
        <button className={tab === "activity" ? "active" : ""} onClick={() => setTab("activity")}>{t.activity}</button>
        <button className={tab === "related" ? "active" : ""} onClick={() => setTab("related")}>{t.related}</button>
      </div>

      <div className="wo-scroll">
        {tab === "cost" ? <IXIWorkOrderCostView workOrder={record} financialRecords={financialRecords} language={lang} /> : null}
        {tab === "activity" ? <IXIWorkOrderActivityView workOrder={record} financialRecords={financialRecords} language={lang} /> : null}
        {tab === "related" ? <IXIWorkOrderRelatedView workOrder={record} financialRecords={financialRecords} language={lang} /> : null}
        {tab === "work" ? (
          <>
            <div className="techwo-summary">
              <div><small>{t.environment}</small><strong>{clean(record.technology?.environment).toUpperCase()}</strong></div>
              <div><small>{t.system}</small><strong>{clean(record.technology?.systemName) || objectLabel}</strong></div>
              <div><small>{t.version}</small><strong>{clean(record.technology?.version) || "—"}</strong></div>
            </div>

            <section className="wo-business-date-card">
              <div className="wo-date-summary">
                <div><small>{t.performedOn}</small><strong>{dateOf(record.dates?.performedOn)}</strong></div>
                <div><small>{t.recordedOn}</small><strong>{dateOf(record.audit?.createdAt)}</strong></div>
                {!isComplete ? <button onClick={() => openEditor("edit")}><EditIcon size={12} /></button> : null}
              </div>
            </section>

            <label>{t.description}</label>
            <div className="wo-description">{clean(record.work?.description) || "—"}</div>

            <label>{t.status}</label>
            <div className="wo-status-row">
              <strong>{status.toUpperCase()}</strong>
              <span>{clean(assignedTechnician.label) || "—"}</span>
            </div>

            <section className="wo-person-card">
              <label>{t.assigned}</label>
              <div><PersonIcon size={18} /><span><b>{clean(assignedTechnician.label) || "—"}</b><small>{clean(assignedTechnician.passportId) || t.passport}</small></span>{!isComplete ? <button onClick={() => openEditor("assign")}><EditIcon size={13} /></button> : null}</div>
            </section>

            <section className="wo-person-card">
              <label>{t.crew}</label>
              <div><TeamIcon size={18} /><span><b>{crew.length ? crew.map(person => person.label).join(", ") : "—"}</b><small>{crew.length ? `${crew.length} · ${t.crew}` : "—"}</small></span>{!isComplete ? <button onClick={() => openEditor("crew")}><EditIcon size={13} /></button> : null}</div>
            </section>

            <div className="wo-timer">
              <div><ClockIcon size={16} /><span><small>{t.timer}</small><strong>{formatIXITimeDuration(elapsed)}</strong></span></div>
              <b>{timerLabel}</b>
            </div>

            {!isComplete ? <><label>{t.add}</label>
            <div className="wo-action-grid">
              <button onClick={() => setSubmodule("time")}><ClockIcon size={17} /><span>{t.time}</span></button>
              <button onClick={() => setSubmodule("material")}><MaterialIcon size={17} /><span>{t.material}</span></button>
              <button onClick={() => setSubmodule("service")}><ServiceIcon size={17} /><span>{t.service}</span></button>
              <button onClick={() => setSubmodule("expense")}><ExpenseIcon size={17} /><span>{t.expense}</span></button>
              <button onClick={() => setSubmodule("purchase")}><PurchaseIcon size={17} /><span>{t.purchase}</span></button>
              <button onClick={() => setSubmodule("documents")}><DocumentIcon size={17} /><span>{t.document}</span></button>
            </div></> : null}

            {!isComplete ? <IXITechWorkOrderEvidenceSections
              record={record}
              language={lang}
              onAddNote={() => setSubmodule("note")}
              onAddPhoto={() => setSubmodule("photo")}
              onViewNotes={() => setTab("activity")}
              onViewPhotos={() => setSubmodule("documents")}
            /> : null}

            {!isComplete ? (
              <div className="wo-bottom-actions">
                <button onClick={isPaused ? resumeWork : pauseWork}>
                  {isPaused ? <RefreshIcon size={15} /> : <PauseIcon size={15} />}
                  <span>{isPaused ? t.resume : t.pause}</span>
                </button>
                <button onClick={() => openEditor("complete")}>
                  <span>{t.complete}</span>
                </button>
              </div>
            ) : null}

            {isComplete ? (
              <>
                <section className="wo-completion-card">
                  <label>{t.completionSummary}</label>
                  <strong>{clean(record.result?.workPerformed) || "—"}</strong>
                  <p>{clean(record.result?.disposition).replaceAll("-", " ").toUpperCase()} · {clean(record.result?.finalImpact).toUpperCase()}</p>
                  <small>{clean(record.technology?.validation) || "—"}</small>
                </section>
                <button className="techwo-reopen" disabled={busy} onClick={() => openEditor("reopen")}>{t.reopen}</button>
              </>
            ) : null}
          </>
        ) : null}

      </div>

      <IXIWorkOrderStyles />
      <IXITechWorkOrderStyles />
    </div>
  );
}
