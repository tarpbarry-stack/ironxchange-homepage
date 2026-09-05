import {
  useEffect,
  useMemo,
  useState
} from "react";

import { createIXIWorkOrder } from "./IXIWorkOrderCommands";
import {
  amendIXIWorkPerformedDate,
  validateIXIWorkPerformedDate
} from "./IXIWorkOrderContract";

import {
  getIXIWorkOrderActuals
} from "./IXIWorkOrderSelectors";

import IXIWorkOrderStyles from "./IXIWorkOrderStyles";
import IXIExpenseApp from "../expense/IXIExpenseApp";
import IXIMaterialApp from "../material/IXIMaterialApp";
import IXITimeEntryApp from "../time/IXITimeEntryApp";
import IXIServiceApp from "../service/IXIServiceApp";
import IXIPurchaseApp from "../purchase/IXIPurchaseApp";
import IXIWorkOrderDocumentsApp from "../documents/IXIWorkOrderDocumentsApp";
import IXINoteApp from "../note/IXINoteApp";
import {
  IXIWorkOrderActivityView,
  IXIWorkOrderCostView,
  IXIWorkOrderRelatedView
} from "./IXIWorkOrderTabViews";
import {
  addIXIWorkOrderNote,
  assignIXIWorkOrderTechnician,
  changeIXIWorkOrderStatus,
  completeIXIWorkOrderRecord,
  updateIXIWorkOrderCrew,
  updateIXIWorkOrderDetails
} from "./IXIWorkOrderRecordEngine";

import {
  createIXITimeEntry
} from "../time/IXITimeEntryCommands";

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
  CameraIcon,
  MicIcon,
  RepairIcon,
  PMIcon,
  InspectIcon,
  ReadyIcon,
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
  StopIcon,
  RefreshIcon
} from "../../IXITransactIcons";

const clean = value => String(value ?? "").trim();

const COPY = {
  en: {
    new: "NEW WORK ORDER",
    sub: "Create a new work order",
    back: "TRAN$ACT",
    location: "LOCATION",
    problem: "WHAT NEEDS WORK?",
    placeholder: "Describe the work or problem...",
    photo: "ADD PHOTO",
    voice: "VOICE NOTE",
    type: "TYPE",
    repair: "REPAIR",
    pm: "PM",
    inspection: "INSPECTION",
    makeReady: "MAKE READY",
    priority: "PRIORITY",
    normal: "NORMAL",
    high: "HIGH",
    critical: "CRITICAL",
    condition: "MACHINE CONDITION",
    performedOn: "WORK PERFORMED DATE",
    performedOnHelp: "Actual date the work was performed",
    recordedOn: "RECORDED ON",
    editDate: "EDIT DATE",
    saveDate: "SAVE DATE",
    cancel: "CANCEL",
    changeReason: "REASON FOR CHANGE",
    changeReasonPlaceholder: "Why is the performed date changing?",
    dateSaved: "WORK PERFORMED DATE UPDATED",
    invalidDate: "ENTER A VALID WORK DATE—NOT IN THE FUTURE",
    operable: "OPERABLE",
    limited: "LIMITED",
    down: "DOWN",
    assign: "ASSIGN TO",
    me: "ME",
    create: "CREATE WORK ORDER",
    createSub: "CREATE AND START WORK",
    work: "WORK",
    cost: "COST",
    activity: "ACTIVITY",
    related: "RELATED",
    assigned: "ASSIGNED TO",
    crew: "CREW / TEAM",
    status: "WORK STATUS",
    description: "WORK DESCRIPTION",
    add: "ADD TO WORK ORDER",
    time: "+ TIME",
    material: "+ MATERIAL",
    service: "+ SERVICE",
    expense: "+ EXPENSE",
    purchase: "+ PURCHASE",
    document: "DOCUMENTS",
    notes: "NOTES",
    photos: "PHOTOS",
    pause: "PAUSE WORK",
    resume: "RESUME WORK",
    complete: "COMPLETE WORK",
    inProgress: "IN PROGRESS",
    paused: "PAUSED",
    created: "CREATED",
    hold: "ON HOLD",
    completed: "COMPLETED",
    timer: "TIMER",
    running: "RUNNING",
    stop: "STOP",
    totalWo: "TOTAL ON WO",
    viewAll: "VIEW ALL",
    addNote: "+ ADD NOTE",
    addPhoto: "+ ADD PHOTO",
    technician: "TECHNICIAN",
    locked: "LOCKED",
    workPaused: "WORK PAUSED",
    timeRecorded: "TIME RECORDED",
    workResumed: "WORK RESUMED",
    timerStarted: "TIMER STARTED",
    timerPaused: "TIMER PAUSED",
    saveChanges: "SAVE CHANGES",
    reason: "REASON FOR CHANGE",
    passport: "IXI PASSPORT",
    technicianName: "TECHNICIAN NAME",
    crewName: "CREW MEMBER NAME",
    addCrew: "ADD CREW MEMBER",
    remove: "REMOVE",
    editWork: "EDIT WORK ORDER",
    editTechnician: "ASSIGN TECHNICIAN",
    editCrew: "EDIT CREW",
    completeTitle: "COMPLETE WORK ORDER",
    workPerformed: "WORK PERFORMED",
    result: "RESULT",
    finalCondition: "FINAL MACHINE CONDITION",
    recommendations: "RECOMMENDATIONS",
    fullyFunctioning: "FULLY FUNCTIONING",
    functionalNotes: "FUNCTIONAL WITH NOTES",
    furtherWork: "FURTHER WORK REQUIRED",
    unresolved: "UNRESOLVED",
    confirmComplete: "CONFIRM COMPLETION",
    backToWork: "BACK TO WORK",
    saved: "WORK ORDER UPDATED",
    passportInvalid: "IXI PASSPORT COULD NOT BE VERIFIED",
    completionSummary: "COMPLETION RECORD"
  },
  es: {
    new: "NUEVA ORDEN DE TRABAJO",
    sub: "Crea una nueva orden de trabajo",
    back: "TRAN$ACT",
    location: "UBICACIÓN",
    problem: "¿QUÉ NECESITA TRABAJO?",
    placeholder: "Describe el trabajo o problema...",
    photo: "AGREGAR FOTO",
    voice: "NOTA DE VOZ",
    type: "TIPO",
    repair: "REPARACIÓN",
    pm: "MANTENIMIENTO",
    inspection: "INSPECCIÓN",
    makeReady: "PREPARACIÓN",
    priority: "PRIORIDAD",
    normal: "NORMAL",
    high: "ALTA",
    critical: "CRÍTICA",
    condition: "CONDICIÓN DEL EQUIPO",
    performedOn: "FECHA DEL TRABAJO REALIZADO",
    performedOnHelp: "Fecha real en que se realizó el trabajo",
    recordedOn: "REGISTRADO EL",
    editDate: "EDITAR FECHA",
    saveDate: "GUARDAR FECHA",
    cancel: "CANCELAR",
    changeReason: "MOTIVO DEL CAMBIO",
    changeReasonPlaceholder: "¿Por qué cambia la fecha del trabajo?",
    dateSaved: "FECHA DEL TRABAJO ACTUALIZADA",
    invalidDate: "INGRESE UNA FECHA VÁLIDA, NO FUTURA",
    operable: "OPERABLE",
    limited: "LIMITADA",
    down: "FUERA DE SERVICIO",
    assign: "ASIGNAR A",
    me: "YO",
    create: "CREAR ORDEN DE TRABAJO",
    createSub: "CREAR Y COMENZAR EL TRABAJO",
    work: "TRABAJO",
    cost: "COSTO",
    activity: "ACTIVIDAD",
    related: "RELACIONADO",
    assigned: "ASIGNADO A",
    crew: "CUADRILLA / EQUIPO",
    status: "ESTADO DEL TRABAJO",
    description: "DESCRIPCIÓN DEL TRABAJO",
    add: "AGREGAR A LA ORDEN",
    time: "+ TIEMPO",
    material: "+ MATERIAL",
    service: "+ SERVICIO",
    expense: "+ GASTO",
    purchase: "+ COMPRA",
    document: "DOCUMENTOS",
    notes: "NOTAS",
    photos: "FOTOS",
    pause: "PAUSAR TRABAJO",
    resume: "REANUDAR TRABAJO",
    complete: "TERMINAR TRABAJO",
    inProgress: "EN PROGRESO",
    paused: "PAUSADO",
    created: "CREADA",
    hold: "EN ESPERA",
    completed: "TERMINADA",
    timer: "TEMPORIZADOR",
    running: "EN CURSO",
    stop: "DETENER",
    totalWo: "TOTAL EN ESTA OT",
    viewAll: "VER TODO",
    addNote: "+ AGREGAR NOTA",
    addPhoto: "+ AGREGAR FOTO",
    technician: "TÉCNICO",
    locked: "BLOQUEADO",
    workPaused: "TRABAJO PAUSADO",
    timeRecorded: "TIEMPO REGISTRADO",
    workResumed: "TRABAJO REANUDADO",
    timerStarted: "TEMPORIZADOR INICIADO",
    timerPaused: "TEMPORIZADOR PAUSADO",
    saveChanges: "GUARDAR CAMBIOS",
    reason: "MOTIVO DEL CAMBIO",
    passport: "PASAPORTE IXI",
    technicianName: "NOMBRE DEL TÉCNICO",
    crewName: "NOMBRE DEL MIEMBRO",
    addCrew: "AGREGAR MIEMBRO",
    remove: "QUITAR",
    editWork: "EDITAR ORDEN DE TRABAJO",
    editTechnician: "ASIGNAR TÉCNICO",
    editCrew: "EDITAR CUADRILLA",
    completeTitle: "TERMINAR ORDEN DE TRABAJO",
    workPerformed: "TRABAJO REALIZADO",
    result: "RESULTADO",
    finalCondition: "CONDICIÓN FINAL DEL EQUIPO",
    recommendations: "RECOMENDACIONES",
    fullyFunctioning: "FUNCIONA COMPLETAMENTE",
    functionalNotes: "FUNCIONA CON OBSERVACIONES",
    furtherWork: "REQUIERE MÁS TRABAJO",
    unresolved: "NO RESUELTO",
    confirmComplete: "CONFIRMAR TERMINACIÓN",
    backToWork: "VOLVER AL TRABAJO",
    saved: "ORDEN DE TRABAJO ACTUALIZADA",
    passportInvalid: "NO SE PUDO VERIFICAR EL PASAPORTE IXI",
    completionSummary: "REGISTRO DE TERMINACIÓN"
  }
};

function Money({ value = 0 }) {
  return <>{`$${Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`}</>;
}

function timeOf(iso = "") {
  if (!iso) return "";
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "" : date.toTimeString().slice(0, 5);
}

function dateOf(iso = "") {
  if (!iso) return new Date().toISOString().slice(0, 10);
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? new Date().toISOString().slice(0, 10)
    : date.toISOString().slice(0, 10);
}

function displayDate(value = "", lang = "en") {
  const dateOnly = clean(value).slice(0, 10);
  if (!dateOnly) return "—";
  const date = new Date(`${dateOnly}T12:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(lang === "es" ? "es-MX" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC"
  }).format(date);
}

function uniqueIds(values = []) {
  return [...new Set((Array.isArray(values) ? values : []).map(clean).filter(Boolean))];
}

function LanguageToggle({ language, onChange }) {
  return (
    <div className="wo-lang">
      <button type="button" className={language === "en" ? "on" : ""} onClick={() => onChange("en")}>ENG</button>
      <i>/</i>
      <button type="button" className={language === "es" ? "on" : ""} onClick={() => onChange("es")}>ESP</button>
    </div>
  );
}

function addReferenceToWorkOrder(current = {}, {
  key,
  id,
  financialKey = "",
  amount = 0
} = {}) {
  const referenceId = clean(id);
  if (!referenceId || !key) return current;

  const existing = uniqueIds(current?.references?.[key]);
  if (existing.includes(referenceId)) return current;

  const financial = financialKey
    ? {
        ...(current.financial || {}),
        [financialKey]:
          Number(current?.financial?.[financialKey] || 0) + Number(amount || 0)
      }
    : current.financial || {};

  return {
    ...current,
    references: {
      ...(current.references || {}),
      [key]: [...existing, referenceId]
    },
    financial
  };
}

function addDocumentsToWorkOrder(current = {}, {
  attachments = [],
  sourceType = "general",
  sourceId = "",
  issuer = "",
  actorName = ""
} = {}) {
  const list = Array.isArray(attachments) ? attachments : [];
  if (!list.length) return current;

  const existing = Array.isArray(current.documentProjection)
    ? current.documentProjection
    : [];
  const next = [...existing];

  for (const item of list) {
    const fileName = clean(item?.fileName || item?.name || item?.title) || `${sourceType} document`;
    const key =
      clean(item?.documentId || item?.id || item?.clientRequestId) ||
      `${sourceType}:${sourceId}:${fileName}`;

    if (next.some(document => clean(document?.documentId || document?.id) === key)) {
      continue;
    }

    next.push({
      documentId: key,
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
      size: Number(item?.size || 0),
      persistenceState: item?.status || "source-record"
    });
  }

  return {
    ...current,
    documentProjection: next
  };
}

export default function IXIWorkOrderApp({
  context = {},
  initialWorkOrder = null,
  financialRecords = [],
  workflowIntent = null,
  onBack = null,
  onCreate = null,
  onAction = null
}) {
  const [lang, setLang] = useState("en");
  const [workOrder, setWorkOrder] = useState(initialWorkOrder || null);
  const [description, setDescription] = useState(() => workflowIntent?.workflow === "receiving-inspection" ? `Receiving inspection for ${clean(workflowIntent?.acquisition?.context?.primaryLabel)}` : workflowIntent?.workflow === "make-ready" ? `Make-ready for ${clean(workflowIntent?.acquisition?.context?.primaryLabel)}` : "");
  const [type, setType] = useState(() => workflowIntent?.workflow === "receiving-inspection" ? "inspection" : workflowIntent?.workflow === "make-ready" ? "make-ready" : "repair");
  const [priority, setPriority] = useState("normal");
  const [condition, setCondition] = useState("operable");
  const [performedOn, setPerformedOn] = useState(() => dateOf(context.launchedAt));
  const [editingPerformedOn, setEditingPerformedOn] = useState(false);
  const [performedOnDraft, setPerformedOnDraft] = useState("");
  const [performedOnReason, setPerformedOnReason] = useState("");
  const [submodule, setSubmodule] = useState("");
  const [activeTab, setActiveTab] = useState("work");
  const [timerSession, setTimerSession] = useState(null);
  const [timerTick, setTimerTick] = useState(0);
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const [editor, setEditor] = useState("");
  const [editDraft, setEditDraft] = useState({});

  const t = COPY[lang];
  const actuals = useMemo(
    () => getIXIWorkOrderActuals(workOrder || {}),
    [workOrder]
  );
  const label = context.primary?.label || "AOS OBJECT";
  const actorName = clean(
    context.actor?.displayName ||
      context.actor?.name ||
      context.actor?.label
  ) || "—";

  function refreshTimer() {
    setTimerSession(getIXIActiveTimeSession(context));
    setTimerTick(Date.now());
  }

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
    const timeout = setTimeout(() => setNotice(""), 3200);
    return () => clearTimeout(timeout);
  }, [notice]);

  useEffect(() => {
    setWorkOrder(initialWorkOrder || null);
    setEditingPerformedOn(false);
    setPerformedOnDraft("");
    setPerformedOnReason("");
    setActiveTab("work");
    setEditor("");
    setEditDraft({});
  }, [initialWorkOrder]);

  async function emitAction(actionId, nextWorkOrder, payload = {}) {
    try {
      const persisted = await onAction?.(actionId, nextWorkOrder, context, payload);
      return persisted || nextWorkOrder;
    } catch (error) {
      setNotice(clean(error?.message) || "WORK ORDER NOT SAVED");
      return null;
    }
  }

  function act(actionId) {
    if ([
      "expense",
      "material",
      "time",
      "service",
      "purchase-order",
      "documents",
      "note"
    ].includes(actionId)) {
      setSubmodule(actionId);
      return;
    }
    if (actionId === "voice") {
      setSubmodule("note");
      return;
    }
    if (actionId === "photo") {
      setSubmodule("documents");
      return;
    }
    if (["work", "cost", "activity", "related"].includes(actionId)) {
      setActiveTab(actionId);
      return;
    }
    if (["edit-work-order", "assign", "crew", "complete"].includes(actionId)) {
      openEditor(actionId);
      return;
    }
    setNotice("ACTION NOT AVAILABLE");
  }

  function openEditor(nextEditor) {
    if (nextEditor === "edit-work-order") {
      setEditDraft({
        title: clean(workOrder?.work?.title),
        description: clean(workOrder?.work?.description),
        type: clean(workOrder?.work?.type || "repair"),
        priority: clean(workOrder?.work?.priority || "normal"),
        machineCondition: clean(workOrder?.work?.machineCondition || "operable"),
        reason: ""
      });
    } else if (nextEditor === "assign") {
      const assigned = workOrder?.people?.assignedTo?.[0] || {};
      setEditDraft({
        passportId: clean(assigned.passportId || context.actor?.passportId),
        label: clean(assigned.label || context.actor?.label),
        reason: ""
      });
    } else if (nextEditor === "crew") {
      setEditDraft({ crew: [...(workOrder?.people?.crew || [])], passportId: "", label: "", reason: "" });
    } else if (nextEditor === "complete") {
      setEditDraft({ workPerformed: "", disposition: "fully-functioning", finalMachineCondition: "operable", recommendations: "" });
    }
    setEditor(nextEditor);
  }

  async function persistWorkOrder(actionId, next, payload = {}) {
    if (saving) return null;
    const previous = workOrder;
    setSaving(true);
    setNotice("");
    try {
      const persisted = await emitAction(actionId, next, payload);
      if (!persisted) return null;
      setWorkOrder(persisted);
      setEditor("");
      setEditDraft({});
      setNotice(t.saved);
      return persisted;
    } catch (error) {
      setWorkOrder(previous);
      setNotice(clean(error?.message) || "WORK ORDER NOT SAVED");
      return null;
    } finally {
      setSaving(false);
    }
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
    if (!response.ok || !payload?.passport) {
      throw new Error(payload?.error || t.passportInvalid);
    }
    return normalized;
  }

  async function saveEditor() {
    try {
      if (editor === "edit-work-order") {
        return persistWorkOrder("work-details-update", updateIXIWorkOrderDetails(workOrder, { ...editDraft, actor: context.actor }));
      }
      if (editor === "assign") {
        const passportId = await verifyIXIPassport(editDraft.passportId);
        return persistWorkOrder("work-technician-assign", assignIXIWorkOrderTechnician(workOrder, {
          technician: { passportId, label: editDraft.label },
          reason: editDraft.reason,
          actor: context.actor
        }));
      }
      if (editor === "crew") {
        return persistWorkOrder("work-crew-update", updateIXIWorkOrderCrew(workOrder, {
          crew: editDraft.crew,
          reason: editDraft.reason,
          actor: context.actor
        }));
      }
      if (editor === "complete") {
        return persistWorkOrder("complete", completeIXIWorkOrderRecord(workOrder, { ...editDraft, actor: context.actor }));
      }
    } catch (error) {
      setNotice(clean(error?.message) || "WORK ORDER NOT SAVED");
    }
    return null;
  }

  async function addCrewMember() {
    let passportId = clean(editDraft.passportId).toUpperCase();
    const label = clean(editDraft.label);
    if (!passportId || !label) {
      setNotice("CREW NAME AND IXI PASSPORT ARE REQUIRED");
      return;
    }
    try {
      passportId = await verifyIXIPassport(passportId);
    } catch (error) {
      setNotice(clean(error?.message) || t.passportInvalid);
      return;
    }
    const crew = [...(editDraft.crew || [])];
    if (!crew.some(person => clean(person.passportId) === passportId)) crew.push({ passportId, label });
    setEditDraft({ ...editDraft, crew, passportId: "", label: "" });
  }

  async function create() {
    if (saving) return;
    setSaving(true);
    setNotice("");
    const requestId = globalThis.crypto?.randomUUID?.()
      || `wo-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    try {
      const { draft } = await createIXIWorkOrder({
        object: context.primary,
        context,
        commandId: requestId,
        idempotencyKey: requestId,
        metadata: {
          acquisitionWorkflow: clean(workflowIntent?.workflow),
          acquisitionId: clean(workflowIntent?.acquisition?.identity?.acquisitionId),
          acquisitionNumber: clean(workflowIntent?.acquisition?.identity?.number),
          acquisitionCost: workflowIntent?.workflow === "make-ready",
          acquisitionCategory: workflowIntent?.workflow === "make-ready" ? "make-ready" : "inspection",
          costPhase: "acquisition",
        },
        input: {
          clientRequestId: requestId,
          title: clean(description).slice(0, 80) || "Work order",
          description,
          type,
          priority,
          machineCondition: condition,
          performedOn,
          status: "in-progress",
          assignedTo: [context.actor || {}]
        }
      });
      await onCreate?.(draft, context);
      setWorkOrder(draft);
    } catch (error) {
      setNotice(clean(error?.message) || "WORK ORDER NOT CREATED");
    } finally {
      setSaving(false);
    }
  }

  function beginPerformedDateEdit() {
    setPerformedOnDraft(
      clean(workOrder?.dates?.performedOn) || dateOf(workOrder?.dates?.requestedAt)
    );
    setPerformedOnReason("");
    setEditingPerformedOn(true);
  }

  async function savePerformedDate() {
    if (saving) return;
    const validation = validateIXIWorkPerformedDate(performedOnDraft);
    if (!validation.ok) {
      setNotice(t.invalidDate);
      return;
    }
    setSaving(true);
    try {
      const next = amendIXIWorkPerformedDate(workOrder, {
        performedOn: performedOnDraft,
        reason: performedOnReason,
        actor: context.actor
      });
      const persisted = await emitAction("work-date-amend", next, {
        amendment: next.amendments?.at(-1) || null
      });
      if (!persisted) return;
      setWorkOrder(persisted);
      setEditingPerformedOn(false);
      setPerformedOnReason("");
      setNotice(t.dateSaved);
    } catch (error) {
      setNotice(clean(error?.message) || t.invalidDate);
    } finally {
      setSaving(false);
    }
  }

  async function saveExpense(draft, input, response) {
    const id =
      clean(draft?.identity?.expenseId) ||
      clean(draft?.identity?.clientRequestId) ||
      `EXP-${Date.now()}`;

    let next = addReferenceToWorkOrder(workOrder || {}, {
      key: "expenseIds",
      id,
      financialKey: "otherActual",
      amount: input?.amount ?? draft?.expense?.amount
    });

    next = addDocumentsToWorkOrder(next, {
      attachments: input?.attachments || draft?.attachments,
      sourceType: "receipt",
      sourceId: id,
      issuer: clean(input?.vendor || input?.vendorLabel || draft?.expense?.vendor),
      actorName
    });

    const persisted = await emitAction("expense-save", next, {
      expense: {
        ...draft,
        identity: {
          ...(draft?.identity || {}),
          expenseId: id
        }
      },
      response
    });
    if (persisted) {
      setWorkOrder(persisted);
      setSubmodule("");
    }
  }

  async function saveNote(draft, input, response) {
    const next = addIXIWorkOrderNote(workOrder, draft, { actor: context.actor });
    const persisted = await persistWorkOrder("work-note-add", next, {
      note: draft,
      input,
      response
    });
    if (persisted) setSubmodule("");
  }

  async function saveMaterial(draft, input, response) {
    const id =
      clean(draft?.identity?.materialUsageId);

    if (!id || !draft?.financialBinding?.financialDocumentId) {
      throw new Error("MATERIAL IS NOT BOUND TO IXI FINANCIAL");
    }

    let next = addReferenceToWorkOrder(workOrder || {}, {
      key: "materialRecordIds",
      id,
      financialKey: "materialActual",
      amount: draft?.material?.extendedCost
    });

    next = addDocumentsToWorkOrder(next, {
      attachments: input?.attachments || draft?.attachments,
      sourceType: "material",
      sourceId: id,
      issuer: clean(input?.vendorLabel || draft?.material?.vendorLabel),
      actorName
    });

    const persisted = await emitAction("material-save", next, {
      material: {
        ...draft,
        identity: {
          ...(draft?.identity || {}),
          materialUsageId: id
        }
      },
      response
    });
    if (persisted) {
      setWorkOrder(persisted);
      setSubmodule("");
    }
  }

  async function saveTime(draft, input, response) {
    const id =
      clean(draft?.identity?.timeEntryId) ||
      clean(draft?.identity?.clientRequestId) ||
      `TIME-${Date.now()}`;

    let next = addReferenceToWorkOrder(workOrder || {}, {
      key: "timeEntryIds",
      id
    });

    next = addDocumentsToWorkOrder(next, {
      attachments: input?.attachments || draft?.attachments,
      sourceType: "time",
      sourceId: id,
      issuer: actorName,
      actorName
    });

    const persisted = await emitAction("time-save", next, {
      timeEntry: {
        ...draft,
        identity: {
          ...(draft?.identity || {}),
          timeEntryId: id
        }
      },
      response
    });
    if (persisted) {
      setWorkOrder(persisted);
      setSubmodule("");
    }
  }

  async function saveService(draft, input, response) {
    const id =
      clean(draft?.identity?.serviceRecordId) ||
      clean(draft?.identity?.clientRequestId) ||
      `SVC-${Date.now()}`;

    let next = addReferenceToWorkOrder(workOrder || {}, {
      key: "serviceRecordIds",
      id,
      financialKey: "serviceActual",
      amount: draft?.service?.amount
    });

    next = addDocumentsToWorkOrder(next, {
      attachments: input?.attachments || draft?.attachments,
      sourceType: "invoice",
      sourceId: id,
      issuer: clean(input?.vendorLabel || draft?.service?.vendorLabel),
      actorName
    });

    const persisted = await emitAction("service-save", next, {
      service: {
        ...draft,
        identity: {
          ...(draft?.identity || {}),
          serviceRecordId: id
        }
      },
      response
    });
    if (persisted) {
      setWorkOrder(persisted);
      setSubmodule("");
    }
  }

  async function savePurchase(draft, input, response) {
    const requestType =
      clean(draft?.purchase?.requestType) === "purchase-order"
        ? "purchase-order"
        : "purchase-request";
    const id =
      clean(draft?.identity?.purchaseId) ||
      clean(draft?.identity?.clientRequestId) ||
      `PUR-${Date.now()}`;
    const isOrder = requestType === "purchase-order";
    const referenceKey = isOrder ? "purchaseOrderIds" : "purchaseRequestIds";
    const financialKey = isOrder ? "committed" : "requested";
    const amount = isOrder
      ? Number(draft?.financial?.committedAmount || draft?.purchase?.estimatedTotal || 0)
      : Number(draft?.financial?.requestedAmount || draft?.purchase?.estimatedTotal || 0);

    let next = addReferenceToWorkOrder(workOrder || {}, {
      key: referenceKey,
      id,
      financialKey,
      amount
    });

    next = addDocumentsToWorkOrder(next, {
      attachments: input?.attachments || draft?.purchase?.attachments,
      sourceType: "quote",
      sourceId: id,
      issuer: clean(input?.vendorLabel || draft?.purchase?.vendorLabel),
      actorName
    });

    const persisted = await emitAction("purchase-save", next, {
      purchase: {
        ...draft,
        identity: {
          ...(draft?.identity || {}),
          purchaseId: id
        }
      },
      response,
      requestType
    });
    if (persisted) {
      setWorkOrder(persisted);
      setSubmodule("");
    }
  }

  async function addGeneralDocument(input) {
    const id =
      clean(input?.documentId) ||
      clean(input?.clientRequestId) ||
      `DOC-${Date.now()}`;
    const workOrderId =
      clean(workOrder?.identity?.workOrderId) ||
      clean(workOrder?.identity?.number);
    const existing = Array.isArray(workOrder?.documentProjection)
      ? workOrder.documentProjection
      : [];

    const document = {
      ...input,
      documentId: id,
      type: "other",
      relatedType: "general",
      relatedId: workOrderId,
      relatedLabel: clean(workOrder?.identity?.number),
      persistenceState: input?.status || "pending-parent-command"
    };

    const alreadyExists = existing.some(item =>
      clean(item?.documentId || item?.id) === id
    );

    const next = {
      ...(workOrder || {}),
      documentProjection: alreadyExists ? existing : [...existing, document],
      references: {
        ...(workOrder?.references || {}),
        attachmentIds: uniqueIds([
          ...(workOrder?.references?.attachmentIds || []),
          id
        ])
      }
    };

    setWorkOrder(next);
    await onAction?.("document-general-add", next, context, {
      document,
      input
    });
    // Stay inside DOCUMENTS so the newly-added item can be reviewed immediately.
  }

  async function documentAction(actionId, row) {
    return onAction?.(`document-${actionId}`, workOrder, context, {
      document: row
    });
  }

  function handleLiveStart(session) {
    setTimerSession(session);
    setSubmodule("");
    setNotice(t.timerStarted);
    emitAction("time-start", workOrder, { session });
  }

  async function recordTimerDelta(session, action) {
    if (!session) return null;

    const milliseconds = getIXITimeSessionUnrecordedMs(session);
    if (milliseconds < 1000) return null;

    const hours = milliseconds / 3600000;
    const input = {
      clientRequestId: `${session.sessionId}:${action}:${Math.round(getIXITimeSessionElapsedMs(session))}`,
      mode: "live",
      employeePassportId: context.actor?.passportId,
      employeeId: context.actor?.employeeId,
      workType: clean(session.workType) || "Work",
      date: dateOf(session.lastStartedAt || session.startedAt),
      startTime: timeOf(session.lastStartedAt || session.startedAt),
      endTime: timeOf(new Date().toISOString()),
      hours,
      billable: true,
      overtime: false,
      description:
        clean(session.description) ||
        clean(workOrder?.work?.description) ||
        clean(session.workType) ||
        "Work performed",
      notes: "",
      attachments: []
    };

    let draft = {
      identity: {
        timeEntryId: `TIME-${Date.now()}`
      },
      time: {
        hours
      },
      context: {
        workOrderNumber: session.workOrderNumber
      }
    };
    let response = null;

    if (
      clean(context.primary?.passportId) &&
      clean(workOrder?.identity?.workOrderId)
    ) {
      const persisted = await createIXITimeEntry({
        object: {
          passportId: context.primary.passportId,
          objectType: context.primary.objectType,
          label: context.primary.label
        },
        context,
        workOrder,
        input,
        metadata: {
          source: "ixi-transact-live-timer",
          timerSessionId: session.sessionId,
          action
        }
      });

      draft = persisted?.draft || draft;
      response = persisted?.response || null;
    }

    const id =
      clean(draft?.identity?.timeEntryId) ||
      clean(draft?.identity?.clientRequestId) ||
      `TIME-${Date.now()}`;

    const next = addReferenceToWorkOrder(workOrder || {}, {
      key: "timeEntryIds",
      id
    });

    setWorkOrder(next);
    markIXITimeSessionRecorded(
      context,
      getIXITimeSessionElapsedMs(session)
    );

    emitAction("time-save", next, {
      timeEntry: {
        ...draft,
        identity: {
          ...(draft?.identity || {}),
          timeEntryId: id
        }
      },
      response,
      session,
      action
    });

    return {
      hours,
      timeEntryId: id,
      workOrder: next
    };
  }

  async function handlePauseWork() {
    const currentSession = getIXIActiveTimeSession(context);
    let recorded = null;

    if (currentSession?.status === "running") {
      const pausedSession = pauseIXITimeSession(context);

      try {
        recorded = await recordTimerDelta(pausedSession, "pause-work");
      } catch (error) {
        emitAction("time-record-error", workOrder, {
          error,
          session: pausedSession
        });
      }
    }

    const base = recorded?.workOrder || workOrder || {};
    const next = changeIXIWorkOrderStatus(base, { status: "paused", actor: context.actor });

    const previous = workOrder;
    setWorkOrder(next);
    refreshTimer();

    const activeSession = getIXIActiveTimeSession(context);
    const duration = currentSession
      ? formatIXITimeDuration(
          getIXITimeSessionElapsedMs(activeSession || currentSession)
        )
      : "";

    setNotice(
      `${t.workPaused}${duration ? ` · ${t.timeRecorded} — ${duration}` : ""}`
    );

    const saved = await emitAction("work-paused", next, {
      session: activeSession,
      recorded
    });
    if (!saved) setWorkOrder(previous);
  }

  async function handleResumeWork() {
    let session = getIXIActiveTimeSession(context);

    if (session?.status === "paused") {
      session = resumeIXITimeSession(context);
    } else if (!session || session.status === "stopped") {
      session = startIXITimeSession({
        context,
        workOrder,
        workType: clean(workOrder?.work?.type) || "Work",
        description: clean(workOrder?.work?.description) || "Work performed"
      });
    }

    const next = changeIXIWorkOrderStatus(workOrder, { status: "in-progress", actor: context.actor });

    const previous = workOrder;
    setWorkOrder(next);
    refreshTimer();
    setNotice(t.workResumed);
    const saved = await emitAction("work-resumed", next, { session });
    if (!saved) setWorkOrder(previous);
  }

  async function handleStopTimer() {
    const currentSession = getIXIActiveTimeSession(context);
    if (!currentSession || currentSession.status !== "running") return;

    const pausedSession = pauseIXITimeSession(context);

    try {
      await recordTimerDelta(pausedSession, "stop-timer");
    } catch (error) {
      emitAction("time-record-error", workOrder, {
        error,
        session: pausedSession
      });
    }

    refreshTimer();
    setNotice(t.timerPaused);
    emitAction("time-paused", workOrder, {
      session: getIXIActiveTimeSession(context)
    });
  }

  if (workOrder && submodule === "expense") {
    return (
      <IXIExpenseApp
        context={context}
        workOrder={workOrder}
        language={lang}
        onLanguageChange={setLang}
        onCancel={() => setSubmodule("")}
        onSave={saveExpense}
      />
    );
  }

  if (workOrder && submodule === "material") {
    return (
      <IXIMaterialApp
        context={context}
        workOrder={workOrder}
        language={lang}
        onLanguageChange={setLang}
        onCancel={() => setSubmodule("")}
        onSave={saveMaterial}
      />
    );
  }

  if (workOrder && submodule === "time") {
    return (
      <IXITimeEntryApp
        context={context}
        workOrder={workOrder}
        language={lang}
        onLanguageChange={setLang}
        onCancel={() => setSubmodule("")}
        onSave={saveTime}
        onLiveStart={handleLiveStart}
      />
    );
  }

  if (workOrder && submodule === "service") {
    return (
      <IXIServiceApp
        context={context}
        workOrder={workOrder}
        language={lang}
        onLanguageChange={setLang}
        onCancel={() => setSubmodule("")}
        onSave={saveService}
      />
    );
  }

  if (workOrder && submodule === "purchase-order") {
    return (
      <IXIPurchaseApp
        context={context}
        workOrder={workOrder}
        language={lang}
        onLanguageChange={setLang}
        onCancel={() => setSubmodule("")}
        onSave={savePurchase}
      />
    );
  }

  if (workOrder && submodule === "documents") {
    return (
      <IXIWorkOrderDocumentsApp
        context={context}
        workOrder={workOrder}
        documents={workOrder.documentProjection || context.documents || []}
        language={lang}
        onLanguageChange={setLang}
        onBack={() => setSubmodule("")}
        onDocumentAction={documentAction}
        onAddGeneralDocument={addGeneralDocument}
      />
    );
  }

  if (workOrder && submodule === "note") {
    return (
      <IXINoteApp
        context={context}
        workOrder={workOrder}
        language={lang}
        onLanguageChange={setLang}
        onCancel={() => setSubmodule("")}
        onSave={saveNote}
      />
    );
  }

  if (!workOrder) {
    return (
      <div className="wo-app wo-v13">
        <LanguageToggle language={lang} onChange={setLang} />

        <div className="wo-title">
          <div className="wo-icon"><WorkOrderIcon size={23} /></div>
          <div><strong>{t.new}</strong><small>{t.sub}</small></div>
        </div>

        <button className="wo-back" onClick={() => onBack?.()}>‹ {t.back}</button>

        <label>{t.location}</label>
        <div className="wo-location">
          <LocationIcon size={15} />
          <b>{label}</b>
          <span className="locked">{t.locked}</span>
        </div>

        <label>{t.problem}</label>
        <textarea value={description} onChange={event => setDescription(event.target.value)} placeholder={t.placeholder} />

        <label>{t.type}</label>
        <div className="wo-four">
          <button className={type === "repair" ? "sel" : ""} onClick={() => setType("repair")}><RepairIcon size={18} /><span>{t.repair}</span></button>
          <button className={type === "pm" ? "sel" : ""} onClick={() => setType("pm")}><PMIcon size={18} /><span>{t.pm}</span></button>
          <button className={type === "inspection" ? "sel" : ""} onClick={() => setType("inspection")}><InspectIcon size={18} /><span>{t.inspection}</span></button>
          <button className={type === "make-ready" ? "sel" : ""} onClick={() => setType("make-ready")}><ReadyIcon size={18} /><span>{t.makeReady}</span></button>
        </div>

        <label>{t.priority}</label>
        <div className="wo-three priority">
          <button className={priority === "normal" ? "sel" : ""} onClick={() => setPriority("normal")}><FlagIcon size={15} />{t.normal}</button>
          <button className={priority === "high" ? "sel high" : "high"} onClick={() => setPriority("high")}><FlagIcon size={15} />{t.high}</button>
          <button className={priority === "critical" ? "sel critical" : "critical"} onClick={() => setPriority("critical")}><FlagIcon size={15} />{t.critical}</button>
        </div>

        <label>{t.condition}</label>
        <div className="wo-three condition">
          <button className={condition === "operable" ? "sel" : ""} onClick={() => setCondition("operable")}><OperableIcon size={15} />{t.operable}</button>
          <button className={condition === "limited" ? "sel" : ""} onClick={() => setCondition("limited")}><LimitedIcon size={15} />{t.limited}</button>
          <button className={condition === "down" ? "sel down" : "down"} onClick={() => setCondition("down")}><DownIcon size={15} />{t.down}</button>
        </div>

        <label htmlFor="ixi-work-performed-on">{t.performedOn}</label>
        <div className="wo-date-entry">
          <input
            id="ixi-work-performed-on"
            type="date"
            max={dateOf(context.launchedAt)}
            value={performedOn}
            onChange={event => setPerformedOn(event.target.value)}
          />
          <small>{t.performedOnHelp}</small>
        </div>

        <label>{t.assign}</label>
        <div className="wo-assign">
          <PersonIcon size={16} />
          <b>{actorName === "—" ? t.me : actorName}</b>
          <span>⌄</span>
        </div>

        <button className="wo-create" onClick={create} disabled={saving}>
          <CreateIcon size={19} />
          <span><b>{saving ? "CREATING..." : t.create}</b><small>{t.createSub}</small></span>
        </button>

        {notice ? <div className="wo-notice">{notice}</div> : null}

        <IXIWorkOrderStyles />
      </div>
    );
  }

  const workDescription = clean(workOrder.work?.description);
  const number = workOrder.identity?.number || workOrder.identity?.workOrderId || "WORK ORDER";
  const isPaused =
    clean(workOrder.work?.status) === "paused" ||
    timerSession?.status === "paused";
  const elapsedMs = timerSession
    ? getIXITimeSessionElapsedMs(timerSession, timerTick)
    : 0;
  const recordedMs = Number(timerSession?.recordedMs || 0);
  const timerLabel =
    timerSession?.status === "running"
      ? t.running
      : timerSession?.status === "paused"
        ? t.paused
        : "—";
  const photoRecords = Array.isArray(workOrder.photoProjection)
    ? workOrder.photoProjection
    : [];
  const photoMedia = photoRecords.flatMap(record =>
    Array.isArray(record?.photo?.media) ? record.photo.media : []
  );
  const workPerformedOn =
    clean(workOrder.dates?.performedOn) || dateOf(workOrder.dates?.requestedAt);
  const recordedOn = clean(workOrder.audit?.createdAt || workOrder.dates?.requestedAt);
  const workStatus = clean(workOrder.work?.status).toLowerCase();
  const performedDateLocked =
    ["complete", "closed", "canceled"].includes(workStatus) ||
    workOrder.recordStatus === "closed";
  const assignedTechnician = workOrder.people?.assignedTo?.[0] || {};
  const crew = Array.isArray(workOrder.people?.crew) ? workOrder.people.crew : [];
  const isComplete = performedDateLocked && ["complete", "completed", "closed"].includes(workStatus);

  if (editor) {
    return (
      <div className="wo-app wo-v13 wo-editor">
        <LanguageToggle language={lang} onChange={setLang} />
        {notice ? <div className="wo-notice">{notice}</div> : null}
        <div className="wo-editor-head">
          <button onClick={() => setEditor("")}>‹ {t.backToWork}</button>
          <strong>{editor === "edit-work-order" ? t.editWork : editor === "assign" ? t.editTechnician : editor === "crew" ? t.editCrew : t.completeTitle}</strong>
          <small>{number} · {label}</small>
        </div>

        {editor === "edit-work-order" ? <div className="wo-editor-form">
          <label>{t.description}</label><textarea value={editDraft.description || ""} onChange={event => setEditDraft({ ...editDraft, description: event.target.value })} />
          <div className="wo-form-grid">
            <div><label>{t.type}</label><select value={editDraft.type || "repair"} onChange={event => setEditDraft({ ...editDraft, type: event.target.value })}><option value="repair">{t.repair}</option><option value="pm">{t.pm}</option><option value="inspection">{t.inspection}</option><option value="make-ready">{t.makeReady}</option></select></div>
            <div><label>{t.priority}</label><select value={editDraft.priority || "normal"} onChange={event => setEditDraft({ ...editDraft, priority: event.target.value })}><option value="normal">{t.normal}</option><option value="high">{t.high}</option><option value="critical">{t.critical}</option></select></div>
            <div><label>{t.condition}</label><select value={editDraft.machineCondition || "operable"} onChange={event => setEditDraft({ ...editDraft, machineCondition: event.target.value })}><option value="operable">{t.operable}</option><option value="limited">{t.limited}</option><option value="down">{t.down}</option></select></div>
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
          <label>{t.result}</label><select value={editDraft.disposition || "fully-functioning"} onChange={event => setEditDraft({ ...editDraft, disposition: event.target.value })}><option value="fully-functioning">{t.fullyFunctioning}</option><option value="functional-with-notes">{t.functionalNotes}</option><option value="further-work-required">{t.furtherWork}</option><option value="unresolved">{t.unresolved}</option></select>
          <label>{t.finalCondition}</label><select value={editDraft.finalMachineCondition || "operable"} onChange={event => setEditDraft({ ...editDraft, finalMachineCondition: event.target.value })}><option value="operable">{t.operable}</option><option value="limited">{t.limited}</option><option value="down">{t.down}</option></select>
          <label>{t.recommendations}</label><textarea value={editDraft.recommendations || ""} onChange={event => setEditDraft({ ...editDraft, recommendations: event.target.value })} />
        </div> : null}

        <div className="wo-editor-actions"><button onClick={() => setEditor("")}>{t.cancel}</button><button className="primary" onClick={saveEditor} disabled={saving}>{saving ? "SAVING…" : editor === "complete" ? t.confirmComplete : t.saveChanges}</button></div>
        <IXIWorkOrderStyles />
      </div>
    );
  }

  return (
    <div className={`wo-app wo-v13 wo-work ${isPaused ? "paused" : ""} ${isComplete ? "completed" : ""}`}>
      <LanguageToggle language={lang} onChange={setLang} />
      {notice ? <div className="wo-notice">{notice}</div> : null}

      <div className="wo-work-identity">
        <div className="wo-work-icon"><WorkOrderIcon size={23} /></div>
        <div className="wo-work-copy">
          <div className="wo-number-row">
            <strong>{number}</strong>
            <span>{workStatus.replaceAll("-", " ").toUpperCase()}</span>
          </div>
          <h3>{label}</h3>
          <small>{clean(workOrder.work?.type).replaceAll("-", " ").toUpperCase()}<i>•</i>{clean(workOrder.work?.priority).toUpperCase()}<i>•</i>{clean(workOrder.work?.machineCondition).toUpperCase()}</small>
        </div>
        {!performedDateLocked ? <button className="wo-edit" onClick={() => act("edit-work-order")}><EditIcon size={13} /></button> : null}
      </div>

      <div className="wo-tabs">
        <button className={activeTab === "work" ? "active" : ""} onClick={() => act("work")}>{t.work}</button>
        <button className={activeTab === "cost" ? "active" : ""} onClick={() => act("cost")}>{t.cost}</button>
        <button className={activeTab === "activity" ? "active" : ""} onClick={() => act("activity")}>{t.activity}</button>
        <button className={activeTab === "related" ? "active" : ""} onClick={() => act("related")}>{t.related}</button>
      </div>

      {activeTab === "cost" ? <IXIWorkOrderCostView workOrder={workOrder} financialRecords={financialRecords} language={lang} /> : null}
      {activeTab === "activity" ? <IXIWorkOrderActivityView workOrder={workOrder} financialRecords={financialRecords} language={lang} /> : null}
      {activeTab === "related" ? <IXIWorkOrderRelatedView workOrder={workOrder} financialRecords={financialRecords} language={lang} /> : null}
      {activeTab === "work" ? <>
      <section className="wo-business-date-card">
        {editingPerformedOn ? (
          <div className="wo-date-edit-form">
            <label htmlFor="ixi-work-performed-on-edit">{t.performedOn}</label>
            <input
              id="ixi-work-performed-on-edit"
              type="date"
              max={dateOf()}
              value={performedOnDraft}
              onChange={event => setPerformedOnDraft(event.target.value)}
            />
            <label htmlFor="ixi-work-performed-reason">{t.changeReason}</label>
            <input
              id="ixi-work-performed-reason"
              type="text"
              value={performedOnReason}
              placeholder={t.changeReasonPlaceholder}
              onChange={event => setPerformedOnReason(event.target.value)}
            />
            <div className="wo-date-actions">
              <button onClick={() => setEditingPerformedOn(false)}>{t.cancel}</button>
              <button className="primary" onClick={savePerformedDate} disabled={saving || !clean(performedOnReason)}>{t.saveDate}</button>
            </div>
          </div>
        ) : (
          <div className="wo-date-summary">
            <div><small>{t.performedOn}</small><strong>{displayDate(workPerformedOn, lang)}</strong></div>
            <div><small>{t.recordedOn}</small><strong>{displayDate(recordedOn, lang)}</strong></div>
            {!performedDateLocked ? <button onClick={beginPerformedDateEdit}><EditIcon size={12} />{t.editDate}</button> : null}
          </div>
        )}
      </section>

      <section className="wo-description-card">
        <label>{t.description}</label>
        <div className="wo-description-body">
          <p>{workDescription || "—"}</p>
          <div className="wo-photo-preview"><CameraIcon size={18} /></div>
        </div>
        <div className="wo-duo compact">
          <button onClick={() => act("photo")}><CameraIcon size={15} /><b>{t.photo}</b></button>
          <button onClick={() => act("voice")}><MicIcon size={15} /><b>{t.voice}</b></button>
        </div>
      </section>

      <section className="wo-person-card">
        <label>{t.assigned}</label>
        <div><PersonIcon size={18} /><span><b>{clean(assignedTechnician.label) || "—"}</b><small>{clean(assignedTechnician.passportId) || t.technician}</small></span>{!performedDateLocked ? <button onClick={() => act("assign")}><EditIcon size={13} /></button> : null}</div>
      </section>

      <section className="wo-person-card">
        <label>{t.crew}</label>
        <div><TeamIcon size={18} /><span><b>{crew.length ? crew.map(person => person.label).join(", ") : "—"}</b><small>{crew.length ? `${crew.length} ${t.crew}` : "—"}</small></span>{!performedDateLocked ? <button onClick={() => act("crew")}><EditIcon size={13} /></button> : null}</div>
      </section>

      <section className="wo-status-card">
        <label>{t.status}</label>
        <div className="wo-status-line"><span className="done" /><span className={isComplete || isPaused ? "done" : "active"} /><span className={isComplete ? "done" : isPaused ? "active" : ""} /><span className={isComplete ? "active" : ""} /></div>
        <div className="wo-status-labels"><b>{t.created}</b><b>{t.inProgress}</b><b>{t.hold}</b><b>{t.completed}</b></div>
      </section>

      {isComplete ? <section className="wo-completion-card">
        <label>{t.completionSummary}</label>
        <strong>{clean(workOrder.result?.workPerformed) || "—"}</strong>
        <p>{clean(workOrder.result?.disposition).replaceAll("-", " ").toUpperCase()} · {clean(workOrder.result?.finalMachineCondition).toUpperCase()}</p>
        {clean(workOrder.result?.recommendations) ? <small>{workOrder.result.recommendations}</small> : null}
      </section> : null}

      <section className="wo-timer-card">
        <label>{t.timer}</label>
        <strong>{formatIXITimeDuration(elapsedMs)}</strong>
        <small>{timerLabel}</small>
        {timerSession?.status === "running" ? <button onClick={handleStopTimer}><StopIcon size={12} />{t.stop}</button> : null}
        <div>{t.totalWo}<b>{(recordedMs / 3600000).toFixed(2)} hr</b><i>|</i><b><Money value={actuals.totalActual} /></b></div>
      </section>

      {!performedDateLocked ? <section className="wo-add-card">
        <label>{t.add}</label>
        <div className="wo-six">
          <button onClick={() => act("time")}><ClockIcon size={18} />{t.time}</button>
          <button onClick={() => act("material")}><MaterialIcon size={18} />{t.material}</button>
          <button onClick={() => act("service")}><ServiceIcon size={18} />{t.service}</button>
          <button onClick={() => act("expense")}><ExpenseIcon size={18} />{t.expense}</button>
          <button onClick={() => act("purchase-order")}><PurchaseIcon size={18} />{t.purchase}</button>
          <button onClick={() => act("documents")}><DocumentIcon size={18} />{t.document}</button>
        </div>
      </section> : null}

      <section className="wo-note-card">
        <div className="head">{t.notes}<button onClick={() => setActiveTab("related")}>{t.viewAll}</button></div>
        <div className="empty-note">{workOrder.noteProjection?.at(-1)?.note?.body || "—"}</div>
        {!performedDateLocked ? <button className="wide" onClick={() => act("note")}>{t.addNote}</button> : null}
      </section>

      <section className="wo-photos-card">
        <div className="head">{t.photos} ({photoMedia.length})<button onClick={() => setActiveTab("related")}>{t.viewAll}</button></div>
        <div className="thumb-row">
          {photoMedia.slice(0, 3).map((item, index) => (
            <i
              key={item.mediaId || index}
              style={item.previewUrl ? {
                backgroundImage: `url(${item.previewUrl})`,
                backgroundSize: "cover",
                backgroundPosition: "center"
              } : undefined}
            />
          ))}
          {Array.from({ length: Math.max(0, 3 - Math.min(photoMedia.length, 3)) }).map((_, index) => (
            <i key={`empty-${index}`} />
          ))}
        </div>
        {!performedDateLocked ? <button className="wide" onClick={() => act("photo")}>{t.addPhoto}</button> : null}
      </section>

      {!performedDateLocked ? <div className="wo-bottom">
        <button onClick={isPaused ? handleResumeWork : handlePauseWork}><PauseIcon size={16} />{isPaused ? t.resume : t.pause}</button>
        <button className="finish" onClick={() => act("complete")}><OperableIcon size={16} />{t.complete}</button>
      </div> : null}
      </> : null}

      <div className="wo-audit">
        <span>{t.created}: {displayDate(workOrder.audit?.createdAt, lang)}</span>
        <i>•</i>
        <span>{lang === "es" ? "ACTUALIZADA" : "UPDATED"}: {displayDate(workOrder.audit?.updatedAt, lang)}</span>
        <RefreshIcon size={11} />
      </div>

      <IXIWorkOrderStyles />
    </div>
  );
}
