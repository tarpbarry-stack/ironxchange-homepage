import { useEffect, useId, useRef, useState } from "react";
import { formatPaymentDate, parsePaymentDate, paymentCalendarDays } from "./IXIPaymentDate";
import styles from "./IXIPayments.module.css";

export default function IXIPaymentDateInput({ value = "", onValueChange, label, language = "en", disabled = false }) {
  const id = useId(), input = useRef(null), editing = useRef(false), restoreFocus = useRef(false);
  // One display value: focusing or choosing a day must never replace an edit
  // with the previous parent value. Format only when the user finishes typing.
  const [text, setText] = useState(() => formatPaymentDate(value));
  const [touched, setTouched] = useState(false);
  const [open, setOpen] = useState(false), [month, setMonth] = useState(0), [year, setYear] = useState(new Date().getFullYear());
  const [yearText, setYearText] = useState(String(year));
  const es = language.startsWith("es"), locale = es ? "es-MX" : "en-US";
  const selected = parsePaymentDate(text);
  const dateError = es ? "Escriba una fecha completa y válida, por ejemplo 2/4/2026 (MM/DD/AAAA)." : "Enter a complete, valid date, for example 2/4/2026 (MM/DD/YYYY).";
  const validYear = /^\d{4}$/.test(yearText) && Number(yearText) >= 1000;
  const days = paymentCalendarDays(year, month);
  const monthNames = Array.from({ length: 12 }, (_, index) => new Date(Date.UTC(2026, index, 1)).toLocaleDateString(locale, { month: "long", timeZone: "UTC" }));
  const weekdays = Array.from({ length: 7 }, (_, index) => new Date(Date.UTC(2026, 2, 1 + index)).toLocaleDateString(locale, { weekday: "narrow", timeZone: "UTC" }));

  useEffect(() => {
    if (!editing.current) setText(formatPaymentDate(value));
  }, [value]);
  useEffect(() => {
    input.current?.setCustomValidity(text && !selected ? dateError : "");
  }, [text, selected, dateError]);
  useEffect(() => {
    if (!open && restoreFocus.current) {
      restoreFocus.current = false;
      input.current?.focus({ preventScroll: true });
    }
  }, [open]);

  function showDate(iso) {
    const nextYear = Number(iso.slice(0, 4));
    setYear(nextYear); setYearText(String(nextYear)); setMonth(Number(iso.slice(5, 7)) - 1);
  }
  function close() { restoreFocus.current = true; setOpen(false); }
  function finishTyping() {
    setTouched(true);
    const iso = parsePaymentDate(text);
    if (iso) { setText(formatPaymentDate(iso)); onValueChange(iso); }
  }
  function toggle() {
    if (open) { close(); return; }
    if (selected) showDate(selected);
    else {
      const today = new Date();
      setMonth(today.getMonth()); setYear(today.getFullYear()); setYearText(String(today.getFullYear()));
    }
    setOpen(true);
  }
  function moveMonth(delta) {
    const date = new Date(Date.UTC(year, month + delta, 1));
    if (date.getUTCFullYear() < 1000 || date.getUTCFullYear() > 9999) return;
    setYear(date.getUTCFullYear()); setYearText(String(date.getUTCFullYear())); setMonth(date.getUTCMonth());
  }
  function chooseDate(date) {
    setText(formatPaymentDate(date)); setTouched(false); onValueChange(date); close();
  }
  return <div className={styles.dateField} onKeyDown={event => {
    if (event.key === "Escape" && open) { event.preventDefault(); event.stopPropagation(); close(); }
  }}>
    <label htmlFor={id}>{label}</label>
    <div className={styles.dateEntry}>
      <input ref={input} id={id} aria-label={label} type="text" inputMode="text" autoComplete="off" placeholder="MM/DD/YYYY" required disabled={disabled}
        aria-describedby={`${id}-hint${touched && !selected ? ` ${id}-error` : ""}`} aria-invalid={touched && !selected || undefined} value={text}
        onFocus={() => { editing.current = true; }}
        onBlur={() => { editing.current = false; finishTyping(); }}
        onInvalid={() => setTouched(true)}
        onKeyDown={event => {
          if (event.key === "Enter") { event.preventDefault(); event.stopPropagation(); finishTyping(); }
        }}
        onChange={event => {
          const next = event.target.value, iso = parsePaymentDate(next);
          setText(next); setTouched(false); onValueChange(iso || next);
          if (iso && open) showDate(iso);
        }} />
      <button type="button" className={styles.calendarToggle} disabled={disabled} aria-expanded={open} aria-controls={`${id}-calendar`}
        aria-label={es ? "Abrir calendario de fecha de pago" : "Open payment date calendar"} onClick={toggle}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M7 3v4M17 3v4M3 10h18M7 14h3M14 14h3M7 17h3" /></svg>
      </button>
    </div>
    <small id={`${id}-hint`} className={styles.hint}>{es ? "Escriba la fecha aquí (2/4/2026) o use el calendario." : "Type the date here (2/4/2026) or use the calendar."}</small>
    {touched && !selected ? <small id={`${id}-error`} role="status" className={styles.dateError}>{dateError}</small> : null}
    {open && !disabled ? <div id={`${id}-calendar`} role="group" aria-label={es ? "Calendario de fecha de pago" : "Payment date calendar"} className={styles.calendar}>
      <div className={styles.calendarControls}>
        <button type="button" aria-label={es ? "Mes anterior" : "Previous month"} onClick={() => moveMonth(-1)}>‹</button>
        <select aria-label={es ? "Mes del calendario" : "Calendar month"} value={month} onChange={event => setMonth(Number(event.target.value))}>{monthNames.map((name, index) => <option key={name} value={index}>{name}</option>)}</select>
        <button type="button" aria-label={es ? "Mes siguiente" : "Next month"} onClick={() => moveMonth(1)}>›</button>
      </div>
      <label className={styles.calendarYear}>{es ? "AÑO" : "YEAR"}<input aria-label={es ? "Año del calendario" : "Calendar year"} type="text" inputMode="numeric" autoComplete="off" maxLength={4} placeholder="YYYY" value={yearText}
        aria-invalid={!validYear || undefined} aria-describedby={!validYear ? `${id}-year-hint` : undefined}
        onKeyDown={event => { if (event.key === "Enter") { event.preventDefault(); event.stopPropagation(); } }}
        onChange={event => { const next = event.target.value; setYearText(next); if (/^\d{4}$/.test(next) && Number(next) >= 1000) setYear(Number(next)); }} /></label>
      {!validYear ? <small id={`${id}-year-hint`} className={styles.dateError}>{es ? "Escriba el año con cuatro dígitos." : "Type the four-digit year."}</small> : null}
      <div className={styles.calendarDays}>
        {weekdays.map((name, index) => <span aria-hidden="true" key={`weekday-${index}`}>{name}</span>)}
        {days.map((date, index) => date ? <button type="button" key={date} disabled={!validYear} aria-label={new Date(`${date}T12:00:00Z`).toLocaleDateString(locale, { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" })}
          aria-pressed={selected === date} onClick={() => chooseDate(date)}>{Number(date.slice(8))}</button> : <span key={`blank-${index}`} />)}
      </div>
      <button type="button" className={styles.calendarClose} onClick={close}>{es ? "CERRAR CALENDARIO" : "CLOSE CALENDAR"}</button>
    </div> : null}
  </div>;
}
