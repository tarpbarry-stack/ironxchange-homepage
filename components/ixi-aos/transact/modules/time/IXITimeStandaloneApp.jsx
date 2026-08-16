import { useEffect, useMemo, useRef, useState } from "react";

import { createIXITimeEntry } from "./IXITimeEntryCommands";
import {
  clearIXITimeSession,
  formatIXITimeDuration,
  getIXIActiveTimeSession,
  getIXITimeSessionElapsedMs,
  getIXITimeTargetKey,
  pauseIXITimeSession,
  resumeIXITimeSession,
  startIXITimeSession,
  stopIXITimeSession,
  subscribeIXITimeSession
} from "./IXITimeSessionRuntime";
import IXITimeStandaloneStyles from "./IXITimeStandaloneStyles";

const clean = value => String(value ?? "").trim();
const WORK_TYPES = ["general", "shop", "yard", "travel", "inspection", "admin", "other"];

const COPY = {
  en: {
    title: "TIME",
    sub: "Standalone Time Entry",
    employee: "EMPLOYEE",
    origin: "ORIGINATING OBJECT",
    workType: "WORK TYPE",
    working: "WHAT ARE YOU WORKING ON?",
    start: "▶ START TIMER",
    manual: "MANUAL ENTRY",
    running: "RUNNING",
    paused: "PAUSED",
    finish: "FINISH",
    pause: "Ⅱ PAUSE",
    resume: "▶ RESUME",
    finishBtn: "■ FINISH",
    started: "STARTED",
    pausedAt: "PAUSED",
    total: "TOTAL TIME WORKED",
    performed: "WORK PERFORMED",
    note: "ADD NOTE (OPTIONAL)",
    photo: "ADD PHOTO (OPTIONAL)",
    save: "SAVE TIME",
    saving: "SAVING…",
    saved: "TIME SAVED",
    view: "VIEW TIME RECORD",
    newTime: "START NEW TIME",
    duration: "DURATION",
    range: "START / END",
    date: "DATE",
    hours: "HOURS",
    minutes: "MINUTES",
    startTime: "START TIME",
    endTime: "END TIME",
    ready: "READY",
    timer: "TIMER",
    history: "HISTORY",
    conflict: "You already have an active timer on another object or work record.",
    required: "Enter what you are working on before starting or saving time.",
    failed: "TIME COULD NOT BE SAVED",
    general: "GENERAL",
    shop: "SHOP",
    yard: "YARD",
    travel: "TRAVEL",
    inspection: "INSPECTION",
    admin: "ADMIN",
    other: "OTHER"
  },
  es: {
    title: "TIEMPO",
    sub: "Registro de Tiempo Independiente",
    employee: "EMPLEADO",
    origin: "OBJETO DE ORIGEN",
    workType: "TIPO DE TRABAJO",
    working: "¿EN QUÉ ESTÁS TRABAJANDO?",
    start: "▶ INICIAR TEMPORIZADOR",
    manual: "ENTRADA MANUAL",
    running: "EN CURSO",
    paused: "PAUSADO",
    finish: "TERMINAR",
    pause: "Ⅱ PAUSAR",
    resume: "▶ REANUDAR",
    finishBtn: "■ TERMINAR",
    started: "INICIADO",
    pausedAt: "PAUSADO",
    total: "TIEMPO TOTAL TRABAJADO",
    performed: "TRABAJO REALIZADO",
    note: "AGREGAR NOTA (OPCIONAL)",
    photo: "AGREGAR FOTO (OPCIONAL)",
    save: "GUARDAR TIEMPO",
    saving: "GUARDANDO…",
    saved: "TIEMPO GUARDADO",
    view: "VER REGISTRO",
    newTime: "NUEVO TIEMPO",
    duration: "DURACIÓN",
    range: "INICIO / FIN",
    date: "FECHA",
    hours: "HORAS",
    minutes: "MINUTOS",
    startTime: "HORA DE INICIO",
    endTime: "HORA DE FIN",
    ready: "LISTO",
    timer: "TEMPORIZADOR",
    history: "HISTORIAL",
    conflict: "Ya tienes un temporizador activo en otro objeto u orden.",
    required: "Describe el trabajo antes de iniciar o guardar tiempo.",
    failed: "NO SE PUDO GUARDAR EL TIEMPO",
    general: "GENERAL",
    shop: "TALLER",
    yard: "PATIO",
    travel: "VIAJE",
    inspection: "INSPECCIÓN",
    admin: "ADMIN",
    other: "OTRO"
  }
};

function clientId() {
  if (typeof globalThis !== "undefined" && globalThis.crypto?.randomUUID) {
    return `TIME-${globalThis.crypto.randomUUID()}`;
  }
  return `TIME-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function localDate() {
  const d = new Date();
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d - offset).toISOString().slice(0, 10);
}

function clock(iso = "") {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function calculateRangeHours(start, end) {
  if (!start || !end) return 0;
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  if (![sh, sm, eh, em].every(Number.isFinite)) return 0;
  let minutes = (eh * 60 + em) - (sh * 60 + sm);
  if (minutes < 0) minutes += 24 * 60;
  return minutes / 60;
}

export default function IXITimeStandaloneApp({
  context = {},
  object = {},
  onBack = null,
  onRecordChange = null
}) {
  const [lang, setLang] = useState("en");
  const [screen, setScreen] = useState("ready");
  const [workType, setWorkType] = useState("general");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [session, setSession] = useState(null);
  const [tick, setTick] = useState(Date.now());
  const [finishedSession, setFinishedSession] = useState(null);
  const [savedRecord, setSavedRecord] = useState(null);
  const [manualMode, setManualMode] = useState("duration");
  const [manualDate, setManualDate] = useState(localDate());
  const [manualHours, setManualHours] = useState("0");
  const [manualMinutes, setManualMinutes] = useState("0");
  const [manualStart, setManualStart] = useState("");
  const [manualEnd, setManualEnd] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const requestIdRef = useRef(clientId());

  const t = COPY[lang];
  const primary = context.primary || {};
  const actor = context.actor || {};
  const employeeLabel = clean(actor.displayName || actor.name || actor.label) || "EMPLOYEE";
  const originLabel = clean(primary.label) || "AOS OBJECT";
  const originType = clean(primary.objectType) || "AOS OBJECT";
  const targetKey = useMemo(() => getIXITimeTargetKey(context, {}), [context]);

  function refreshSession() {
    const active = getIXIActiveTimeSession(context);
    setSession(active);
    if (active?.status === "running" && clean(active.targetKey) === targetKey) setScreen("timer");
    if (active?.status === "paused" && clean(active.targetKey) === targetKey) setScreen("timer");
  }

  useEffect(() => {
    refreshSession();
    const unsubscribe = subscribeIXITimeSession(refreshSession);
    const interval = setInterval(() => setTick(Date.now()), 1000);
    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [targetKey]);

  const activeElsewhere = Boolean(
    session &&
    ["running", "paused"].includes(session.status) &&
    clean(session.targetKey) !== targetKey
  );

  const elapsedMs = session && clean(session.targetKey) === targetKey
    ? getIXITimeSessionElapsedMs(session, tick)
    : finishedSession?.accumulatedMs || 0;

  async function startTimer() {
    setError("");
    if (!clean(description)) {
      setError(t.required);
      return;
    }
    try {
      const next = startIXITimeSession({
        context,
        workOrder: {},
        workType,
        description
      });
      setSession(next);
      setScreen("timer");
    } catch (err) {
      setError(err?.code === "IXI_ACTIVE_TIMER_EXISTS" ? t.conflict : clean(err?.message));
    }
  }

  function pause() {
    const next = pauseIXITimeSession(context);
    setSession(next);
  }

  function resume() {
    const next = resumeIXITimeSession(context);
    setSession(next);
  }

  function finish() {
    const stopped = stopIXITimeSession(context, { clear: false });
    if (!stopped) return;
    setFinishedSession(stopped);
    setDescription(clean(stopped.description) || description);
    setScreen("finish");
  }

  function reset() {
    clearIXITimeSession(context);
    requestIdRef.current = clientId();
    setScreen("ready");
    setSession(null);
    setFinishedSession(null);
    setSavedRecord(null);
    setDescription("");
    setNotes("");
    setAttachment(null);
    setError("");
  }

  async function persist(input, source) {
    setSaving(true);
    setError("");
    try {
      const result = await createIXITimeEntry({
        object: {
          passportId: clean(primary.passportId || object.passportId),
          objectId: clean(primary.objectId || object.objectId || object.id),
          objectType: clean(primary.objectType || object.objectType || object.type),
          label: originLabel
        },
        context,
        workOrder: {},
        input: {
          clientRequestId: requestIdRef.current,
          employeePassportId: actor.passportId,
          employeeId: actor.employeeId || actor.userId,
          workType,
          billable: true,
          overtime: false,
          notes,
          source,
          attachments: attachment ? [{
            fileName: attachment.name,
            mimeType: attachment.type,
            size: attachment.size,
            status: "local-pending-upload"
          }] : [],
          ...input
        },
        metadata: {
          source: "ixi-transact-standalone-time",
          originatingTargetKey: targetKey
        }
      });

      const record = result?.draft || null;
      if (!record) throw new Error("Time persistence did not return a record.");
      setSavedRecord(record);
      clearIXITimeSession(context);
      setSession(null);
      setScreen("saved");
      await onRecordChange?.(record, {
        action: "time-save",
        response: result?.response || null,
        originatingObject: primary
      }, context);
    } catch (err) {
      setError(clean(err?.message) || t.failed);
    } finally {
      setSaving(false);
    }
  }

  async function saveFinished() {
    if (!clean(description)) {
      setError(t.required);
      return;
    }
    const sourceSession = finishedSession || session;
    const milliseconds = Number(sourceSession?.accumulatedMs || elapsedMs || 0);
    const hours = milliseconds / 3600000;
    await persist({
      mode: "live",
      date: sourceSession?.startedAt ? new Date(sourceSession.startedAt).toISOString().slice(0, 10) : localDate(),
      startTime: sourceSession?.startedAt ? new Date(sourceSession.startedAt).toTimeString().slice(0, 5) : "",
      endTime: sourceSession?.endedAt ? new Date(sourceSession.endedAt).toTimeString().slice(0, 5) : new Date().toTimeString().slice(0, 5),
      hours,
      description
    }, "standalone-live-timer");
  }

  async function saveManual() {
    if (!clean(description)) {
      setError(t.required);
      return;
    }
    const hours = manualMode === "range"
      ? calculateRangeHours(manualStart, manualEnd)
      : Math.max(0, Number(manualHours || 0)) + Math.max(0, Number(manualMinutes || 0)) / 60;
    if (!(hours > 0)) {
      setError(t.required);
      return;
    }
    await persist({
      mode: "manual",
      date: manualDate,
      startTime: manualMode === "range" ? manualStart : "",
      endTime: manualMode === "range" ? manualEnd : "",
      hours,
      description
    }, "standalone-manual");
  }

  const Nav = ({ current }) => (
    <div className="ts-nav">
      <button className={current === "ready" ? "on" : ""} onClick={() => !session && setScreen("ready")}>▣<br/>{t.ready}</button>
      <button className={current === "timer" ? "on" : ""} onClick={() => session && clean(session.targetKey) === targetKey && setScreen("timer")}>◷<br/>{t.timer}</button>
      <button className={`finish ${current === "finish" ? "on" : ""}`} onClick={() => finishedSession && setScreen("finish")}>☑<br/>{t.finish}</button>
      <button className={`history ${current === "saved" ? "on" : ""}`} onClick={() => savedRecord && setScreen("saved")}>▤<br/>{t.history}</button>
    </div>
  );

  const Header = ({ status = "", statusClass = "" }) => (
    <>
      <div className="ts-top">
        <button className="ts-back" onClick={() => onBack?.()}>‹ IXI TRAN$ACT</button>
        <div className="ts-lang"><button className={lang === "en" ? "on" : ""} onClick={() => setLang("en")}>ENG</button><button className={lang === "es" ? "on" : ""} onClick={() => setLang("es")}>ESP</button></div>
      </div>
      <div className="ts-head">
        <div className="ts-clock">◷</div>
        <div className="ts-head-copy"><strong>{t.title}</strong><small>{originLabel} · {employeeLabel}</small></div>
        {status ? <span className={`ts-status ${statusClass}`}>{status}</span> : null}
      </div>
    </>
  );

  const Context = () => (
    <div className="ts-context">
      <div><small>{t.origin}</small><b>{originLabel}</b><small>{originType}</small></div>
      <div><small>{t.employee}</small><b>{employeeLabel}</b><small>{clean(actor.employeeId || actor.userId || actor.passportId) || "CURRENT USER"}</small></div>
    </div>
  );

  return (
    <div className="tx-time-standalone">
      {screen === "ready" ? (
        <>
          <Header />
          <Context />
          <span className="ts-section">{t.workType}</span>
          <div className="ts-work-types">
            {WORK_TYPES.map(type => <button key={type} className={workType === type ? "on" : ""} onClick={() => setWorkType(type)}>{t[type]}</button>)}
          </div>
          <span className="ts-section">{t.working}</span>
          <textarea className="ts-area" value={description} onChange={event => setDescription(event.target.value)} maxLength={240} placeholder="Loading CAT 336 and Deere 650K for transport." />
          {activeElsewhere ? <div className="ts-error">{t.conflict}<br/>{session?.primaryLabel || session?.workOrderNumber || "ACTIVE WORK"} · {formatIXITimeDuration(getIXITimeSessionElapsedMs(session, tick))}</div> : null}
          {error ? <div className="ts-error">{error}</div> : null}
          <button className="ts-start" onClick={startTimer} disabled={activeElsewhere}>▶ {t.start.replace("▶ ", "")}</button>
          <button className="ts-secondary" onClick={() => { setError(""); setScreen("manual"); }}>{t.manual}</button>
          <Nav current="ready" />
        </>
      ) : null}

      {screen === "timer" ? (
        <>
          <Header status={session?.status === "paused" ? t.paused : t.running} statusClass={session?.status === "paused" ? "paused" : ""} />
          <Context />
          <div className="ts-working"><small>{t.working}</small><p>{clean(session?.description) || description}</p></div>
          <div className={`ts-timer ${session?.status === "paused" ? "paused" : ""}`}><strong>{formatIXITimeDuration(elapsedMs)}</strong><small>HRS MINS SECS</small></div>
          <div className="ts-live-actions">
            <button className={session?.status === "paused" ? "ts-resume" : "ts-pause"} onClick={session?.status === "paused" ? resume : pause}>{session?.status === "paused" ? t.resume : t.pause}</button>
            <button className="ts-finish-btn" onClick={finish}>{t.finishBtn}</button>
          </div>
          <div className="ts-started"><div><small>{t.started}</small><b>{clock(session?.startedAt)}</b></div><div><small>{t.pausedAt}</small><b>{session?.status === "paused" ? clock(session?.pausedAt) : "—"}</b></div></div>
          {error ? <div className="ts-error">{error}</div> : null}
          <Nav current="timer" />
        </>
      ) : null}

      {screen === "finish" ? (
        <>
          <Header status={t.finish} statusClass="finish" />
          <Context />
          <div className="ts-total"><small>{t.total}</small><strong>{formatIXITimeDuration(finishedSession?.accumulatedMs || elapsedMs)}</strong></div>
          <span className="ts-section">{t.performed}</span>
          <textarea className="ts-area" value={description} onChange={event => setDescription(event.target.value)} maxLength={300} />
          <span className="ts-section">{t.note}</span>
          <textarea className="ts-area" value={notes} onChange={event => setNotes(event.target.value)} maxLength={300} />
          <button className="ts-file">▣ {attachment ? attachment.name : t.photo}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={event => setAttachment(event.target.files?.[0] || null)} /></button>
          {error ? <div className="ts-error">{error}</div> : null}
          <button className="ts-save" onClick={saveFinished} disabled={saving}>{saving ? t.saving : `▣ ${t.save}`}</button>
          <Nav current="finish" />
        </>
      ) : null}

      {screen === "manual" ? (
        <>
          <Header status={t.manual} statusClass="manual" />
          <Context />
          <div className="ts-manual-tabs"><button className={manualMode === "duration" ? "on" : ""} onClick={() => setManualMode("duration")}>{t.duration}</button><button className={manualMode === "range" ? "on" : ""} onClick={() => setManualMode("range")}>{t.range}</button></div>
          <span className="ts-label">{t.date}</span><input className="ts-field" type="date" value={manualDate} onChange={event => setManualDate(event.target.value)} />
          {manualMode === "duration" ? <div className="ts-two"><label><span className="ts-label">{t.hours}</span><input className="ts-field" inputMode="numeric" value={manualHours} onChange={event => setManualHours(event.target.value)} /></label><label><span className="ts-label">{t.minutes}</span><input className="ts-field" inputMode="numeric" value={manualMinutes} onChange={event => setManualMinutes(event.target.value)} /></label></div> : <div className="ts-two"><label><span className="ts-label">{t.startTime}</span><input className="ts-field" type="time" value={manualStart} onChange={event => setManualStart(event.target.value)} /></label><label><span className="ts-label">{t.endTime}</span><input className="ts-field" type="time" value={manualEnd} onChange={event => setManualEnd(event.target.value)} /></label></div>}
          <span className="ts-section">{t.workType}</span><div className="ts-work-types">{WORK_TYPES.map(type => <button key={type} className={workType === type ? "on" : ""} onClick={() => setWorkType(type)}>{t[type]}</button>)}</div>
          <span className="ts-section">{t.performed}</span><textarea className="ts-area" value={description} onChange={event => setDescription(event.target.value)} maxLength={300} />
          <span className="ts-section">{t.note}</span><textarea className="ts-area" value={notes} onChange={event => setNotes(event.target.value)} maxLength={300} />
          <button className="ts-file">▣ {attachment ? attachment.name : t.photo}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={event => setAttachment(event.target.files?.[0] || null)} /></button>
          {error ? <div className="ts-error">{error}</div> : null}
          <button className="ts-save blue" onClick={saveManual} disabled={saving}>{saving ? t.saving : `▣ ${t.save}`}</button>
          <Nav current="ready" />
        </>
      ) : null}

      {screen === "saved" && savedRecord ? (
        <>
          <Header />
          <div className="ts-saved"><div className="ts-check">✓</div><span>{t.saved}</span><strong>{clean(savedRecord.identity?.timeEntryId || savedRecord.identity?.clientRequestId) || "TIME RECORD"}</strong><b>{Number(savedRecord.time?.hours || 0).toFixed(2)} HRS</b></div>
          <div className="ts-record">
            <div><small>{t.origin}</small><b>{originLabel}</b></div>
            <div><small>{t.employee}</small><b>{employeeLabel}</b></div>
            <div><small>{t.workType}</small><b>{clean(savedRecord.time?.workType).toUpperCase()}</b></div>
            <div><small>{t.performed}</small><b>{clean(savedRecord.time?.description)}</b></div>
            <div><small>{t.date}</small><b>{savedRecord.time?.date}</b></div>
          </div>
          <button className="ts-start" onClick={() => onRecordChange?.(savedRecord, { action: "view-time-record" }, context)}>{t.view}</button>
          <button className="ts-new" onClick={reset}>{t.newTime}</button>
          <Nav current="saved" />
        </>
      ) : null}
      <IXITimeStandaloneStyles />
    </div>
  );
}