import { useEffect, useMemo, useState } from "react";
import { hydrateIXIAssetAcquisitionRecord } from "../asset-acquisition/IXIAssetAcquisitionContract";
import { updateIXIAssetAcquisition } from "../asset-acquisition/IXIAssetAcquisitionCommands";
import { addIXIOwnershipCapitalEvent } from "../asset-acquisition/IXIAssetAcquisitionRecordEngine";

const clean = (value) => String(value ?? "").trim();
const num = (value) => (Number.isFinite(Number(value)) ? Number(value) : 0);
const today = () => new Date().toISOString().slice(0, 10);
const COPY = {
  en: {
    title: "OWNERSHIP & CAPITAL",
    current: "CURRENT ECONOMIC OWNERSHIP",
    history: "EFFECTIVE-DATED HISTORY",
    change: "RECORD CHANGE",
    owner: "OWNER / ENTITY",
    counterparty: "TRANSFER FROM",
    legal: "LEGAL %",
    settlement: "SETTLEMENT %",
    profit: "PROFIT %",
    loss: "LOSS %",
    capital: "CAPITAL",
    type: "CHANGE TYPE",
    date: "EFFECTIVE DATE",
    amount: "CAPITAL AMOUNT",
    reference: "REFERENCE",
    notes: "REASON / NOTES",
    add: "SAVE OWNERSHIP EVENT",
    back: "‹ TRAN$ACT",
    noRecord: "Create the Asset Acquisition record before changing ownership.",
    totals:
      "All four share columns must total 100%. Capital is maintained independently.",
    saved: "OWNERSHIP EVENT SAVED",
    working: "SAVING…",
    passport: "PASSPORT / ID",
    eventTypes: {
      "ownership-transfer": "OWNERSHIP TRANSFER",
      "ownership-adjustment": "OWNERSHIP ADJUSTMENT",
      "capital-contribution": "CAPITAL CONTRIBUTION",
      "capital-return": "CAPITAL RETURN",
      "partner-added": "PARTNER ADDED",
      "partner-buyout": "PARTNER BUYOUT",
    },
  },
  es: {
    title: "PROPIEDAD Y CAPITAL",
    current: "PROPIEDAD ECONÓMICA ACTUAL",
    history: "HISTORIAL CON FECHA EFECTIVA",
    change: "REGISTRAR CAMBIO",
    owner: "PROPIETARIO / ENTIDAD",
    counterparty: "TRANSFERIR DE",
    legal: "LEGAL %",
    settlement: "LIQUIDACIÓN %",
    profit: "GANANCIA %",
    loss: "PÉRDIDA %",
    capital: "CAPITAL",
    type: "TIPO DE CAMBIO",
    date: "FECHA EFECTIVA",
    amount: "MONTO DE CAPITAL",
    reference: "REFERENCIA",
    notes: "MOTIVO / NOTAS",
    add: "GUARDAR EVENTO",
    back: "‹ TRAN$ACT",
    noRecord: "Cree la adquisición del activo antes de cambiar la propiedad.",
    totals:
      "Las cuatro columnas de participación deben sumar 100%. El capital se mantiene por separado.",
    saved: "EVENTO DE PROPIEDAD GUARDADO",
    working: "GUARDANDO…",
    passport: "PASAPORTE / ID",
    eventTypes: {
      "ownership-transfer": "TRANSFERENCIA DE PROPIEDAD",
      "ownership-adjustment": "AJUSTE DE PROPIEDAD",
      "capital-contribution": "APORTE DE CAPITAL",
      "capital-return": "DEVOLUCIÓN DE CAPITAL",
      "partner-added": "SOCIO AGREGADO",
      "partner-buyout": "COMPRA DE PARTICIPACIÓN",
    },
  },
};
function Field({ label, children }) {
  return (
    <label className="own-field">
      <span>{label}</span>
      {children}
    </label>
  );
}
export default function IXIOwnershipCapitalApp({
  context = {},
  initialRecord = null,
  language = "en",
  onBack,
  onRecordChange,
}) {
  const [lang, setLang] = useState(language === "es" ? "es" : "en");
  const t = COPY[lang];
  const [record, setRecord] = useState(
    initialRecord ? hydrateIXIAssetAcquisitionRecord(initialRecord) : null,
  );
  const [form, setForm] = useState({
    type: "ownership-transfer",
    partyLabel: "",
    partyId: "",
    counterpartyLabel: "",
    legal: "",
    settlement: "",
    profit: "",
    loss: "",
    amount: "",
    effectiveDate: today(),
    reference: "",
    notes: "",
  });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(
    () =>
      setRecord(
        initialRecord ? hydrateIXIAssetAcquisitionRecord(initialRecord) : null,
      ),
    [initialRecord],
  );
  const owners = record?.ownership?.owners || [];
  const totals = useMemo(
    () => ({
      legal: owners.reduce((s, x) => s + num(x.legalOwnershipPercent), 0),
      settlement: owners.reduce((s, x) => s + num(x.settlementSharePercent), 0),
      profit: owners.reduce(
        (s, x) => s + num(x.profitSharePercent ?? x.settlementSharePercent),
        0,
      ),
      loss: owners.reduce(
        (s, x) => s + num(x.lossSharePercent ?? x.settlementSharePercent),
        0,
      ),
    }),
    [owners],
  );
  const patch = (key, value) =>
    setForm((current) => ({ ...current, [key]: value }));
  async function save() {
    setBusy(true);
    setMessage("");
    try {
      if (
        !clean(form.partyLabel) ||
        !clean(form.reference) ||
        !/^\d{4}-\d{2}-\d{2}$/.test(form.effectiveDate)
      )
        throw new Error("Owner, effective date and reference are required.");
      const candidate = addIXIOwnershipCapitalEvent(
        record,
        {
          type: form.type,
          partyId: form.partyId,
          partyLabel: form.partyLabel,
          counterpartyLabel: form.counterpartyLabel,
          amount: form.amount,
          ownershipPercentChange: form.legal,
          settlementSharePercentChange: form.settlement,
          profitSharePercentChange: form.profit,
          lossSharePercentChange: form.loss,
          effectiveDate: form.effectiveDate,
          reference: form.reference,
          notes: form.notes,
        },
        context.actor || {},
      );
      const sums = candidate.ownership || {};
      for (const value of [
        sums.legalOwnershipTotal,
        sums.settlementShareTotal,
        sums.profitShareTotal,
        sums.lossShareTotal,
      ])
        if (Math.abs(num(value) - 100) > 0.01) throw new Error(t.totals);
      const result = await updateIXIAssetAcquisition({
        record: candidate,
        action: "ownership-capital-change",
        metadata: { ownershipCapitalEvent: candidate.ownership.events.at(-1) },
      });
      setRecord(result.record);
      setMessage(t.saved);
      setForm((current) => ({
        ...current,
        legal: "",
        settlement: "",
        profit: "",
        loss: "",
        amount: "",
        reference: "",
        notes: "",
      }));
      await onRecordChange?.(
        result.record,
        {
          action: "ownership-capital-change",
          event: result.record.ownership?.events?.at(-1),
        },
        context,
      );
    } catch (error) {
      setMessage(error?.message || "Unable to save ownership event.");
    } finally {
      setBusy(false);
    }
  }
  if (!record)
    return (
      <div className="ixi-own">
        <Header t={t} lang={lang} setLang={setLang} />
        <div className="own-alert">{t.noRecord}</div>
        <button onClick={onBack}>{t.back}</button>
        <Styles />
      </div>
    );
  return (
    <div className="ixi-own" lang={lang === "es" ? "es-MX" : "en-US"}>
      <Header t={t} lang={lang} setLang={setLang} />
      <div className="own-help">{t.totals}</div>
      <h3>{t.current}</h3>
      {owners.map((owner) => (
        <div className="own-card" key={owner.ownerId}>
          <strong>{owner.partyLabel}</strong>
          <div className="own-grid four">
            <Metric
              label={t.legal}
              value={`${num(owner.legalOwnershipPercent)}%`}
            />
            <Metric
              label={t.settlement}
              value={`${num(owner.settlementSharePercent)}%`}
            />
            <Metric
              label={t.profit}
              value={`${num(owner.profitSharePercent ?? owner.settlementSharePercent)}%`}
            />
            <Metric
              label={t.loss}
              value={`${num(owner.lossSharePercent ?? owner.settlementSharePercent)}%`}
            />
          </div>
          <Metric
            label={t.capital}
            value={new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: "USD",
            }).format(num(owner.initialContribution))}
          />
        </div>
      ))}
      <div className="own-totals">
        <Metric label={t.legal} value={`${totals.legal}%`} />
        <Metric label={t.settlement} value={`${totals.settlement}%`} />
        <Metric label={t.profit} value={`${totals.profit}%`} />
        <Metric label={t.loss} value={`${totals.loss}%`} />
      </div>
      <h3>{t.change}</h3>
      <Field label={t.type}>
        <select
          value={form.type}
          onChange={(e) => patch("type", e.target.value)}
        >
          {Object.entries(t.eventTypes).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </Field>
      <div className="own-grid">
        <Field label={t.owner}>
          <input
            value={form.partyLabel}
            onChange={(e) => patch("partyLabel", e.target.value)}
          />
        </Field>
        <Field label={t.passport}>
          <input
            value={form.partyId}
            onChange={(e) => patch("partyId", e.target.value)}
          />
        </Field>
      </div>
      <Field label={t.counterparty}>
        <select
          value={form.counterpartyLabel}
          onChange={(e) => patch("counterpartyLabel", e.target.value)}
        >
          <option value="">—</option>
          {owners.map((owner) => (
            <option key={owner.ownerId} value={owner.partyLabel}>
              {owner.partyLabel}
            </option>
          ))}
        </select>
      </Field>
      <div className="own-grid four">
        {[
          ["legal", t.legal],
          ["settlement", t.settlement],
          ["profit", t.profit],
          ["loss", t.loss],
        ].map(([key, label]) => (
          <Field key={key} label={label}>
            <input
              inputMode="decimal"
              value={form[key]}
              onChange={(e) => patch(key, e.target.value)}
            />
          </Field>
        ))}
      </div>
      <div className="own-grid">
        <Field label={t.amount}>
          <input
            inputMode="decimal"
            value={form.amount}
            onChange={(e) => patch("amount", e.target.value)}
          />
        </Field>
        <Field label={t.date}>
          <input
            type="date"
            value={form.effectiveDate}
            onChange={(e) => patch("effectiveDate", e.target.value)}
          />
        </Field>
      </div>
      <Field label={t.reference}>
        <input
          value={form.reference}
          onChange={(e) => patch("reference", e.target.value)}
        />
      </Field>
      <Field label={t.notes}>
        <textarea
          value={form.notes}
          onChange={(e) => patch("notes", e.target.value)}
        />
      </Field>
      {message ? <div className="own-alert">{message}</div> : null}
      <button className="primary" disabled={busy} onClick={save}>
        {busy ? t.working : t.add}
      </button>
      <h3>{t.history}</h3>
      {[...(record.ownership?.events || [])].reverse().map((event) => (
        <div className="own-event" key={event.eventId}>
          <strong>
            {event.partyLabel} ·{" "}
            {clean(event.type).replaceAll("-", " ").toUpperCase()}
          </strong>
          <span>
            {event.effectiveDate || event.occurredAt?.slice(0, 10)} ·{" "}
            {event.reference}
          </span>
          <span>
            L {num(event.ownershipPercentChange)} · S{" "}
            {num(event.settlementSharePercentChange)} · P{" "}
            {num(event.profitSharePercentChange)} · LOSS{" "}
            {num(event.lossSharePercentChange)}
          </span>
        </div>
      ))}
      <button onClick={onBack}>{t.back}</button>
      <Styles />
    </div>
  );
}
function Header({ t, lang, setLang }) {
  return (
    <header>
      <div>
        <small>IXI TRAN$ACT</small>
        <h2>{t.title}</h2>
      </div>
      <nav>
        <button
          className={lang === "en" ? "on" : ""}
          onClick={() => setLang("en")}
        >
          ENG
        </button>
        <button
          className={lang === "es" ? "on" : ""}
          onClick={() => setLang("es")}
        >
          ESP
        </button>
      </nav>
    </header>
  );
}
function Metric({ label, value }) {
  return (
    <div className="own-metric">
      <span>{label}</span>
      <b>{value}</b>
    </div>
  );
}
function Styles() {
  return (
    <style jsx global>{`
      .ixi-own {
        color: #f4f4ef;
        font-family: Arial, sans-serif;
        padding: 4px;
      }
      .ixi-own header {
        display: flex;
        justify-content: space-between;
        border-bottom: 1px solid #343834;
      }
      .ixi-own header small,
      .ixi-own h3 {
        color: #ffc400;
        font-weight: 900;
        letter-spacing: 0.1em;
      }
      .ixi-own h2 {
        margin: 2px 0 8px;
        font-size: 24px;
      }
      .ixi-own h3 {
        font-size: 12px;
        border-bottom: 1px solid #5d4a08;
        padding-bottom: 5px;
        margin-top: 22px;
      }
      .ixi-own button {
        width: 100%;
        min-height: 44px;
        margin: 8px 0;
        border: 1px solid #394039;
        border-radius: 5px;
        background: #0d100e;
        color: #fff;
        font-weight: 900;
      }
      .ixi-own button.primary {
        background: #ffc400;
        color: #080808;
        border-color: #ffc400;
      }
      .ixi-own nav {
        display: flex;
        gap: 4px;
      }
      .ixi-own nav button {
        width: auto;
        border: 0;
        color: #777;
      }
      .ixi-own nav button.on {
        color: #ffc400;
      }
      .own-help,
      .own-alert {
        padding: 12px;
        margin: 10px 0;
        border: 1px solid #5d4a08;
        border-radius: 5px;
        font-size: 13px;
        line-height: 1.4;
      }
      .own-grid,
      .own-totals {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
      }
      .own-grid.four,
      .own-totals {
        grid-template-columns: repeat(4, 1fr);
      }
      .own-card,
      .own-event {
        padding: 12px;
        margin: 8px 0;
        border: 1px solid #282d29;
        border-radius: 6px;
        background: #0d100e;
      }
      .own-event span {
        display: block;
        color: #aaa;
        font-size: 12px;
        margin-top: 5px;
      }
      .own-field {
        display: block;
        margin: 8px 0;
      }
      .own-field span,
      .own-metric span {
        display: block;
        color: #999;
        font-size: 11px;
        font-weight: 800;
        margin-bottom: 4px;
      }
      .own-field input,
      .own-field select,
      .own-field textarea {
        width: 100%;
        min-height: 42px;
        padding: 9px;
        border: 1px solid #394039;
        border-radius: 5px;
        background: #070908;
        color: #fff;
        font-size: 15px;
      }
      .own-field textarea {
        min-height: 72px;
      }
      .own-metric {
        padding: 8px;
      }
      .own-metric b {
        font-size: 14px;
      }
      @media (max-width: 560px) {
        .own-grid.four,
        .own-totals {
          grid-template-columns: 1fr 1fr;
        }
      }
    `}</style>
  );
}
