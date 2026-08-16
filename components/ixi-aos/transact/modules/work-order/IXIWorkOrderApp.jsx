import {
  useEffect,
  useMemo,
  useState
} from "react";

import {
  createIXIWorkOrderDraft
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
    timerPaused: "TIMER PAUSED"
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
    timerPaused: "TEMPORIZADOR PAUSADO"
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

function uniqueIds(values = []) {
  return [...new Set((Array.isArray(values) ? values : []).map(clean).filter(Boolean))];
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
  onBack = null,
  onCreate = null,
  onAction = null
}) {
  const [lang, setLang] = useState("en");
  const [workOrder, setWorkOrder] = useState(initialWorkOrder || null);
  const [description, setDescription] = useState("");
  const [type, setType] = useState("repair");
  const [priority, setPriority] = useState("normal");
  const [condition, setCondition] = useState("operable");
  const [submodule, setSubmodule] = useState("");
  const [timerSession, setTimerSession] = useState(null);
  const [timerTick, setTimerTick] = useState(0);
  const [notice, setNotice] = useState("");

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

  function emitAction(actionId, nextWorkOrder, payload = {}) {
    onAction?.(actionId, nextWorkOrder, context, payload);
  }

  function act(actionId) {
    if ([
      "expense",
      "material",
      "time",
      "service",
      "purchase-order",
      "documents"
    ].includes(actionId)) {
      setSubmodule(actionId);
      return;
    }

    emitAction(actionId, workOrder);
  }

  function create() {
    const draft = createIXIWorkOrderDraft({
      context,
      input: {
        title: clean(description).slice(0, 80) || "Work order",
        description,
        type,
        priority,
        machineCondition: condition,
        assignedTo: [context.actor || {}]
      }
    });

    // Demo/preview number until the canonical Work Order command supplies identity.
    draft.identity.number = "WO-1058";
    draft.work.status = "in-progress";
    setWorkOrder(draft);
    onCreate?.(draft, context);
  }

  function saveExpense(draft, input, response) {
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

    setWorkOrder(next);
    emitAction("expense-save", next, {
      expense: {
        ...draft,
        identity: {
          ...(draft?.identity || {}),
          expenseId: id
        }
      },
      response
    });
    setSubmodule("");
  }

  function saveMaterial(draft, input, response) {
    const id =
      clean(draft?.identity?.materialUsageId) ||
      clean(draft?.identity?.clientRequestId) ||
      `MAT-${Date.now()}`;

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

    setWorkOrder(next);
    emitAction("material-save", next, {
      material: {
        ...draft,
        identity: {
          ...(draft?.identity || {}),
          materialUsageId: id
        }
      },
      response
    });
    setSubmodule("");
  }

  function saveTime(draft, input, response) {
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

    setWorkOrder(next);
    emitAction("time-save", next, {
      timeEntry: {
        ...draft,
        identity: {
          ...(draft?.identity || {}),
          timeEntryId: id
        }
      },
      response
    });
    setSubmodule("");
  }

  function saveService(draft, input, response) {
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

    setWorkOrder(next);
    emitAction("service-save", next, {
      service: {
        ...draft,
        identity: {
          ...(draft?.identity || {}),
          serviceRecordId: id
        }
      },
      response
    });
    setSubmodule("");
  }

  function savePurchase(draft, input, response) {
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

    setWorkOrder(next);
    emitAction("purchase-save", next, {
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
    setSubmodule("");
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
    const next = {
      ...base,
      work: {
        ...(base.work || {}),
        status: "paused"
      }
    };

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

    emitAction("work-paused", next, {
      session: activeSession,
      recorded
    });
  }

  function handleResumeWork() {
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

    const next = {
      ...(workOrder || {}),
      work: {
        ...(workOrder?.work || {}),
        status: "in-progress"
      }
    };

    setWorkOrder(next);
    refreshTimer();
    setNotice(t.workResumed);
    emitAction("work-resumed", next, { session });
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

  const Lang = () => (
    <div className="wo-lang">
      <button className={lang === "en" ? "on" : ""} onClick={() => setLang("en")}>ENG</button>
      <i>/</i>
      <button className={lang === "es" ? "on" : ""} onClick={() => setLang("es")}>ESP</button>
    </div>
  );

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

  if (!workOrder) {
    return (
      <div className="wo-app wo-v13">
        <Lang />

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

        <div className="wo-duo">
          <button onClick={() => act("photo")}><CameraIcon size={15} /><b>{t.photo}</b></button>
          <button onClick={() => act("voice")}><MicIcon size={15} /><b>{t.voice}</b></button>
        </div>

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

        <label>{t.assign}</label>
        <div className="wo-assign">
          <PersonIcon size={16} />
          <b>{actorName === "—" ? t.me : actorName}</b>
          <span>⌄</span>
        </div>

        <button className="wo-create" onClick={create}>
          <CreateIcon size={19} />
          <span><b>{t.create}</b><small>{t.createSub}</small></span>
        </button>

        <IXIWorkOrderStyles />
      </div>
    );
  }

  const workDescription = clean(workOrder.work?.description);
  const number = workOrder.identity?.number || "WO-1058";
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

  return (
    <div className={`wo-app wo-v13 wo-work ${isPaused ? "paused" : ""}`}>
      <Lang />
      {notice ? <div className="wo-notice">{notice}</div> : null}

      <div className="wo-work-identity">
        <div className="wo-work-icon"><WorkOrderIcon size={23} /></div>
        <div className="wo-work-copy">
          <div className="wo-number-row">
            <strong>{number}</strong>
            <span>{isPaused ? t.paused : t.inProgress}</span>
          </div>
          <h3>{label}</h3>
          <small>{t.repair}<i>•</i>{t.normal}<i>•</i>{t.operable}</small>
        </div>
        <button className="wo-edit" onClick={() => act("edit-work-order")}><EditIcon size={13} /></button>
      </div>

      <div className="wo-tabs">
        <button className="active">{t.work}</button>
        <button onClick={() => act("cost")}>{t.cost}</button>
        <button onClick={() => act("activity")}>{t.activity}</button>
        <button onClick={() => act("related")}>{t.related}</button>
      </div>

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
        <div><PersonIcon size={18} /><span><b>{actorName}</b><small>{t.technician}</small></span><button onClick={() => act("assign")}><EditIcon size={13} /></button></div>
      </section>

      <section className="wo-person-card">
        <label>{t.crew}</label>
        <div><TeamIcon size={18} /><span><b>—</b><small>—</small></span><button onClick={() => act("crew")}><EditIcon size={13} /></button></div>
      </section>

      <section className="wo-status-card">
        <label>{t.status}</label>
        <div className="wo-status-line"><span className="done" /><span className={!isPaused ? "active" : "done"} /><span className={isPaused ? "active" : ""} /><span /></div>
        <div className="wo-status-labels"><b>{t.created}</b><b>{t.inProgress}</b><b>{t.hold}</b><b>{t.completed}</b></div>
      </section>

      <section className="wo-timer-card">
        <label>{t.timer}</label>
        <strong>{formatIXITimeDuration(elapsedMs)}</strong>
        <small>{timerLabel}</small>
        {timerSession?.status === "running" ? <button onClick={handleStopTimer}><StopIcon size={12} />{t.stop}</button> : null}
        <div>{t.totalWo}<b>{(recordedMs / 3600000).toFixed(2)} hr</b><i>|</i><b><Money value={actuals.totalActual} /></b></div>
      </section>

      <section className="wo-add-card">
        <label>{t.add}</label>
        <div className="wo-six">
          <button onClick={() => act("time")}><ClockIcon size={18} />{t.time}</button>
          <button onClick={() => act("material")}><MaterialIcon size={18} />{t.material}</button>
          <button onClick={() => act("service")}><ServiceIcon size={18} />{t.service}</button>
          <button onClick={() => act("expense")}><ExpenseIcon size={18} />{t.expense}</button>
          <button onClick={() => act("purchase-order")}><PurchaseIcon size={18} />{t.purchase}</button>
          <button onClick={() => act("documents")}><DocumentIcon size={18} />{t.document}</button>
        </div>
      </section>

      <section className="wo-note-card">
        <div className="head">{t.notes}<button>{t.viewAll}</button></div>
        <div className="empty-note">—</div>
        <button className="wide" onClick={() => act("note")}>{t.addNote}</button>
      </section>

      <section className="wo-photos-card">
        <div className="head">{t.photos} ({photoMedia.length})<button>{t.viewAll}</button></div>
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
        <button className="wide" onClick={() => act("photo")}>{t.addPhoto}</button>
      </section>

      <div className="wo-bottom">
        <button onClick={isPaused ? handleResumeWork : handlePauseWork}><PauseIcon size={16} />{isPaused ? t.resume : t.pause}</button>
        <button className="finish" onClick={() => act("complete")}><OperableIcon size={16} />{t.complete}</button>
      </div>

      <div className="wo-audit">
        <span>{t.created}: —</span>
        <i>•</i>
        <span>Updated: —</span>
        <RefreshIcon size={11} />
      </div>

      <IXIWorkOrderStyles />
    </div>
  );
}
