import { useId, useRef, useState } from "react";
import { formatPaymentDate, parsePaymentDate, paymentCalendarDays } from "./IXIPaymentDate";
import styles from "./IXIPayments.module.css";

export default function IXIPaymentDateInput({ value = "", onValueChange, label, language = "en", disabled = false }) {
  const id = useId(), input = useRef(null);
  const [focused, setFocused] = useState(false), [draft, setDraft] = useState("");
  const [open, setOpen] = useState(false), [month, setMonth] = useState(0), [year, setYear] = useState(2026);
  const es = language.startsWith("es"), locale = es ? "es-MX" : "en-US";
  const selected = parsePaymentDate(value);
  const days = paymentCalendarDays(year, month);
  const monthNames = Array.from({ length: 12 }, (_, index) => new Date(Date.UTC(2026, index, 1)).toLocaleDateString(locale, { month: "long", timeZone: "UTC" }));
  const weekdays = Array.from({ length: 7 }, (_, index) => new Date(Date.UTC(2026, 2, 1 + index)).toLocaleDateString(locale, { weekday: "narrow", timeZone: "UTC" }));
  const currentYear = new Date().getFullYear();
  const years = [...new Set([year, ...Array.from({ length: 111 }, (_, index) => currentYear - 100 + index)])].sort((a, b) => b - a);
  const close = () => { setOpen(false); input.current?.focus(); };
  function toggle() {
    if (open) { close(); return; }
    const date = selected ? new Date(`${selected}T12:00:00Z`) : new Date();
    setMonth(selected ? date.getUTCMonth() : date.getMonth());
    setYear(selected ? date.getUTCFullYear() : date.getFullYear());
    setOpen(true);
  }
  function moveMonth(delta) {
    const date = new Date(Date.UTC(year, month + delta, 1));
    if (date.getUTCFullYear() < 1000 || date.getUTCFullYear() > 9999) return;
    setYear(date.getUTCFullYear()); setMonth(date.getUTCMonth());
  }
  return <div className={styles.dateField} onKeyDown={event => {
    if (event.key === "Escape" && open) { event.preventDefault(); event.stopPropagation(); close(); }
  }}>
    <label htmlFor={id}>{label}</label>
    <div className={styles.dateEntry}>
      <input ref={input} id={id} aria-label={label} type="text" inputMode="text" autoComplete="off" placeholder="MM/DD/YYYY" required disabled={disabled}
        aria-describedby={`${id}-hint`} value={focused ? draft : formatPaymentDate(value)}
        onFocus={event => { setDraft(event.currentTarget.value); setFocused(true); }}
        onBlur={() => setFocused(false)}
        onChange={event => { const text = event.target.value; setDraft(text); onValueChange(parsePaymentDate(text) || text); }} />
      <button type="button" className={styles.calendarToggle} disabled={disabled} aria-expanded={open} aria-controls={`${id}-calendar`}
        aria-label={es ? "Abrir calendario de fecha de pago" : "Open payment date calendar"} onClick={toggle}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M7 3v4M17 3v4M3 10h18M7 14h3M14 14h3M7 17h3" /></svg>
      </button>
    </div>
    <small id={`${id}-hint`} className={styles.hint}>{es ? "Escriba MM/DD/AAAA o elija en el calendario." : "Type MM/DD/YYYY or choose from the calendar."}</small>
    {open && !disabled ? <div id={`${id}-calendar`} role="group" aria-label={es ? "Calendario de fecha de pago" : "Payment date calendar"} className={styles.calendar}>
      <div className={styles.calendarControls}>
        <button type="button" aria-label={es ? "Mes anterior" : "Previous month"} onClick={() => moveMonth(-1)}>‹</button>
        <select aria-label={es ? "Mes del calendario" : "Calendar month"} value={month} onChange={event => setMonth(Number(event.target.value))}>{monthNames.map((name, index) => <option key={name} value={index}>{name}</option>)}</select>
        <button type="button" aria-label={es ? "Mes siguiente" : "Next month"} onClick={() => moveMonth(1)}>›</button>
      </div>
      <label className={styles.calendarYear}>{es ? "AÑO" : "YEAR"}<select aria-label={es ? "Año del calendario" : "Calendar year"} value={year} onChange={event => setYear(Number(event.target.value))}>{years.map(item => <option key={item} value={item}>{item}</option>)}</select></label>
      <div className={styles.calendarDays}>
        {weekdays.map((name, index) => <span aria-hidden="true" key={`weekday-${index}`}>{name}</span>)}
        {days.map((date, index) => date ? <button type="button" key={date} aria-label={new Date(`${date}T12:00:00Z`).toLocaleDateString(locale, { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" })}
          aria-pressed={selected === date} onClick={() => { onValueChange(date); close(); setDraft(formatPaymentDate(date)); }}>{Number(date.slice(8))}</button> : <span key={`blank-${index}`} />)}
      </div>
      <button type="button" className={styles.calendarClose} onClick={close}>{es ? "CERRAR CALENDARIO" : "CLOSE CALENDAR"}</button>
    </div> : null}
  </div>;
}
