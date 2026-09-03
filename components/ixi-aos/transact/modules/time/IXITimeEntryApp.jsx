import { useMemo, useRef, useState } from "react";
import {
  createIXITimeEntryDraft,
  validateIXITimeEntry,
} from "./IXITimeEntryContract";
import { createIXITimeEntry } from "./IXITimeEntryCommands";
import { startIXITimeSession } from "./IXITimeSessionRuntime";
import IXITimeEntryStyles from "./IXITimeEntryStyles";
const clean = (v) => String(v ?? "").trim();
const COPY = {
  en: {
    title: "ADD TIME",
    type: "TIME ENTRY TYPE",
    live: "START TIMER (LIVE)",
    liveSub: "Track time as I work",
    manual: "MANUAL ENTRY",
    manualSub: "Enter hours worked",
    employee: "EMPLOYEE",
    workType: "WORK TYPE / LABOR CODE",
    date: "DATE",
    start: "START TIME",
    duration: "DURATION / HOURS",
    end: "END TIME",
    billable: "BILLABLE",
    billableYes: "Billable",
    billableNo: "Not Billable",
    overtime: "OVERTIME",
    yes: "Yes",
    no: "No",
    performed: "WORK PERFORMED / DESCRIPTION",
    photo: "ATTACH PHOTO (OPTIONAL)",
    addPhoto: "ADD PHOTO",
    notes: "NOTES (OPTIONAL)",
    cancel: "CANCEL",
    cancelSub: "Discard changes",
    save: "SAVE TIME",
    saveSub: "Return to Work Order",
    startTimer: "START TIMER",
    startTimerSub: "Return to Work Order",
    foot: "This time will be added to the work order and update labor actuals.",
    liveFoot:
      "Timer runs from timestamps and keeps running after you leave this screen.",
    required:
      "Employee, work type, date, hours and work description are required.",
    activeError: "You already have a timer running on another work order.",
  },
  es: {
    title: "AGREGAR TIEMPO",
    type: "TIPO DE REGISTRO",
    live: "INICIAR TEMPORIZADOR",
    liveSub: "Registrar tiempo mientras trabajo",
    manual: "ENTRADA MANUAL",
    manualSub: "Ingresar horas trabajadas",
    employee: "EMPLEADO",
    workType: "TIPO DE TRABAJO / CÓDIGO LABORAL",
    date: "FECHA",
    start: "HORA DE INICIO",
    duration: "DURACIÓN / HORAS",
    end: "HORA DE FIN",
    billable: "FACTURABLE",
    billableYes: "Facturable",
    billableNo: "No facturable",
    overtime: "TIEMPO EXTRA",
    yes: "Sí",
    no: "No",
    performed: "TRABAJO REALIZADO / DESCRIPCIÓN",
    photo: "AGREGAR FOTO (OPCIONAL)",
    addPhoto: "AGREGAR FOTO",
    notes: "NOTAS (OPCIONAL)",
    cancel: "CANCELAR",
    cancelSub: "Descartar cambios",
    save: "GUARDAR TIEMPO",
    saveSub: "Regresar a la orden",
    startTimer: "INICIAR TEMPORIZADOR",
    startTimerSub: "Regresar a la orden",
    foot: "Este tiempo se agregará a la orden y actualizará los costos de mano de obra.",
    liveFoot:
      "El temporizador usa las horas registradas y sigue corriendo al salir de esta pantalla.",
    required:
      "Empleado, tipo de trabajo, fecha, horas y descripción son obligatorios.",
    activeError: "Ya tienes un temporizador activo en otra orden.",
  },
};
export default function IXITimeEntryApp({
  context = {},
  workOrder = {},
  language = "en",
  onLanguageChange = null,
  onCancel = null,
  onSave = null,
  onLiveStart = null,
}) {
  const [lang, setLang] = useState(language),
    t = COPY[lang];
  const requestIdRef = useRef(
    globalThis.crypto?.randomUUID?.() ||
      `TIME-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  );
  const [mode, setMode] = useState("manual"),
    [employee, setEmployee] = useState(clean(context.actor?.label) || ""),
    [workType, setWorkType] = useState("Hydraulic Repair"),
    [date, setDate] = useState(new Date().toISOString().slice(0, 10)),
    [startTime, setStartTime] = useState(""),
    [endTime, setEndTime] = useState(""),
    [hours, setHours] = useState(""),
    [billable, setBillable] = useState(true),
    [overtime, setOvertime] = useState(false),
    [description, setDescription] = useState(""),
    [notes, setNotes] = useState(""),
    [hasPhoto, setHasPhoto] = useState(false),
    [errors, setErrors] = useState({}),
    [saving, setSaving] = useState(false);
  const primary = context.primary || {},
    loc = context.location || {},
    wo =
      clean(
        workOrder.identity?.number ||
          workOrder.workOrderNumber ||
          workOrder.number,
      ) || "WORK ORDER";
  function setLanguage(next) {
    setLang(next);
    onLanguageChange?.(next);
  }
  const input = useMemo(
    () => ({
      clientRequestId: requestIdRef.current,
      mode,
      employeePassportId: context.actor?.passportId,
      employeeId: context.actor?.employeeId,
      workType,
      date,
      startTime,
      endTime,
      hours: Number(hours || 0),
      billable,
      overtime,
      description,
      notes,
      attachments: hasPhoto
        ? [{ type: "work-photo", status: "local-pending-upload" }]
        : [],
    }),
    [
      mode,
      workType,
      date,
      startTime,
      endTime,
      hours,
      billable,
      overtime,
      description,
      notes,
      hasPhoto,
      context,
    ],
  );
  async function save() {
    if (mode === "live") {
      setErrors({});
      setSaving(true);
      try {
        const session = startIXITimeSession({
          context,
          workOrder,
          workType,
          description:
            clean(description) ||
            clean(workOrder.work?.description) ||
            workType,
        });
        await onLiveStart?.(session);
      } catch (error) {
        setErrors({ timer: error?.code || "active" });
      } finally {
        setSaving(false);
      }
      return;
    }
    const draft = createIXITimeEntryDraft({ context, workOrder, input }),
      check = validateIXITimeEntry(draft);
    setErrors(check.errors);
    if (!check.valid) return;
    setSaving(true);
    try {
      let persisted = null;
      if (clean(primary.passportId) && clean(workOrder.identity?.workOrderId)) {
        persisted = await createIXITimeEntry({
          object: {
            passportId: primary.passportId,
            objectType: primary.objectType,
            label: primary.label,
          },
          context,
          workOrder,
          input,
          metadata: { source: "ixi-transact-work-order-time" },
        });
      }
      await onSave?.(
        persisted?.draft || draft,
        input,
        persisted?.response || null,
      );
    } finally {
      setSaving(false);
    }
  }
  const hasTimerError = Boolean(errors.timer);
  return (
    <div className="tx-time">
      <div className="tm-lang">
        <button
          className={lang === "en" ? "on" : ""}
          onClick={() => setLanguage("en")}
        >
          ENG
        </button>
        <button
          className={lang === "es" ? "on" : ""}
          onClick={() => setLanguage("es")}
        >
          ESP
        </button>
      </div>
      <div className="tm-head">
        <div className="tm-icon">◷</div>
        <div className="tm-title">
          <strong>{t.title}</strong>
          <div className="tm-context">
            <div>
              <b>{primary.label || "—"}</b>
              <small>{primary.objectType || "Object"}</small>
            </div>
            <div>
              <b>{wo}</b>
              <small>Work Order</small>
            </div>
            <div>
              <b>{loc.label || "—"}</b>
              <small>Location</small>
            </div>
            <div>
              <b>{employee || "—"}</b>
              <small>Employee</small>
            </div>
          </div>
        </div>
      </div>
      <div className="tm-section">{t.type}</div>
      <div className="tm-modes">
        <button
          className={mode === "live" ? "on" : ""}
          onClick={() => setMode("live")}
        >
          {t.live}
          <small>{t.liveSub}</small>
        </button>
        <button
          className={mode === "manual" ? "on" : ""}
          onClick={() => setMode("manual")}
        >
          {t.manual}
          <small>{t.manualSub}</small>
        </button>
      </div>
      <label>{t.employee} *</label>
      <div className="tm-field">
        <input
          value={employee}
          onChange={(e) => setEmployee(e.target.value)}
          disabled={Boolean(context.actor?.label)}
        />
      </div>
      <label>{t.workType} *</label>
      <div className="tm-field">
        <select value={workType} onChange={(e) => setWorkType(e.target.value)}>
          <option>Hydraulic Repair</option>
          <option>PM</option>
          <option>Diagnostics</option>
          <option>Welding</option>
          <option>Travel</option>
          <option>Inspection</option>
          <option>Other</option>
        </select>
      </div>
      {mode === "manual" ? (
        <>
          <div className="tm-two">
            <div>
              <label>{t.date} *</label>
              <div className="tm-field">
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label>{t.start} *</label>
              <div className="tm-field">
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
            </div>
          </div>
          <div className="tm-two">
            <div>
              <label>{t.duration} *</label>
              <div className="tm-field">
                <input
                  inputMode="decimal"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>
            <div>
              <label>{t.end}</label>
              <div className="tm-field">
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>
          </div>
        </>
      ) : null}
      <div className="tm-two">
        <div>
          <label>{t.billable}</label>
          <div className="tm-toggle">
            <button
              className={billable ? "on" : ""}
              onClick={() => setBillable(true)}
            >
              {t.billableYes}
            </button>
            <button
              className={!billable ? "on" : ""}
              onClick={() => setBillable(false)}
            >
              {t.billableNo}
            </button>
          </div>
        </div>
        <div>
          <label>{t.overtime}</label>
          <div className="tm-toggle">
            <button
              className={overtime ? "on" : ""}
              onClick={() => setOvertime(true)}
            >
              {t.yes}
            </button>
            <button
              className={!overtime ? "on" : ""}
              onClick={() => setOvertime(false)}
            >
              {t.no}
            </button>
          </div>
        </div>
      </div>
      <label>
        {t.performed}
        {mode === "manual" ? " *" : ""}
      </label>
      <textarea
        className="tm-desc"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <label>{t.photo}</label>
      <div className="tm-photo">
        <button onClick={() => setHasPhoto((v) => !v)}>
          ▣ {hasPhoto ? "PHOTO ATTACHED" : t.addPhoto}
          <small>{hasPhoto ? "Tap to remove" : "Camera / upload"}</small>
        </button>
      </div>
      <label>{t.notes}</label>
      <textarea
        className="tm-notes"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />
      {Object.keys(errors).length ? (
        <div className="tm-errors">
          {hasTimerError ? t.activeError : t.required}
        </div>
      ) : null}
      <div className="tm-actions">
        <button onClick={() => onCancel?.()} disabled={saving}>
          {t.cancel}
          <small>{t.cancelSub}</small>
        </button>
        <button className="save" onClick={save} disabled={saving}>
          {mode === "live" ? t.startTimer : t.save}
          <small>{mode === "live" ? t.startTimerSub : t.saveSub}</small>
        </button>
      </div>
      <div className="tm-foot">{mode === "live" ? t.liveFoot : t.foot}</div>
      <IXITimeEntryStyles />
    </div>
  );
}
