import { useMemo, useState } from "react";

import {
  getIXIWorkOrderActivity,
  getIXIWorkOrderCostProjection,
  getIXIWorkOrderRelationships
} from "./IXIWorkOrderProjectionEngine";

const clean = value => String(value ?? "").trim();

const COPY = {
  en: {
    actual: "ACTUAL COST",
    committed: "COMMITTED",
    requested: "REQUESTED",
    estimated: "ESTIMATED",
    labor: "LABOR",
    materials: "MATERIALS",
    services: "OUTSIDE SERVICE",
    expenses: "OTHER EXPENSES",
    costDetail: "COST DETAIL",
    noCosts: "No cost records have been linked to this Work Order.",
    activity: "IMMUTABLE ACTIVITY",
    noActivity: "No Work Order activity has been recorded.",
    relatedRecords: "RELATED RECORDS",
    notes: "NOTES",
    photos: "PHOTOS",
    documents: "DOCUMENTS",
    noRelated: "No related records have been linked.",
    details: "DETAILS",
    close: "CLOSE",
    type: "TYPE",
    status: "STATUS",
    date: "DATE",
    amount: "AMOUNT"
  },
  es: {
    actual: "COSTO REAL",
    committed: "COMPROMETIDO",
    requested: "SOLICITADO",
    estimated: "ESTIMADO",
    labor: "MANO DE OBRA",
    materials: "MATERIALES",
    services: "SERVICIO EXTERNO",
    expenses: "OTROS GASTOS",
    costDetail: "DETALLE DE COSTOS",
    noCosts: "No hay costos vinculados a esta Orden de Trabajo.",
    activity: "ACTIVIDAD INMUTABLE",
    noActivity: "No hay actividad registrada en esta Orden.",
    relatedRecords: "REGISTROS RELACIONADOS",
    notes: "NOTAS",
    photos: "FOTOS",
    documents: "DOCUMENTOS",
    noRelated: "No hay registros relacionados.",
    details: "DETALLES",
    close: "CERRAR",
    type: "TIPO",
    status: "ESTADO",
    date: "FECHA",
    amount: "IMPORTE"
  }
};

function Money({ value = 0 }) {
  return <>{Number(value || 0).toLocaleString(undefined, { style: "currency", currency: "USD" })}</>;
}

function formatDate(value, lang) {
  const date = new Date(value);
  if (!value || Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(lang === "es" ? "es-MX" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(date);
}

function RecordDetail({ row, lang, onClose }) {
  const t = COPY[lang];
  return (
    <section className="wo-record-detail">
      <div className="wo-panel-heading"><b>{t.details}</b><button onClick={onClose}>{t.close}</button></div>
      <strong>{row.number || row.id}</strong>
      <p>{row.label}</p>
      <dl>
        <div><dt>{t.type}</dt><dd>{row.type}</dd></div>
        <div><dt>{t.status}</dt><dd>{row.status || "—"}</dd></div>
        <div><dt>{t.date}</dt><dd>{formatDate(row.date, lang)}</dd></div>
        <div><dt>{t.amount}</dt><dd><Money value={row.amount} /></dd></div>
      </dl>
    </section>
  );
}

export function IXIWorkOrderCostView({ workOrder, financialRecords, language = "en" }) {
  const lang = language === "es" ? "es" : "en";
  const t = COPY[lang];
  const cost = useMemo(() => getIXIWorkOrderCostProjection(workOrder, financialRecords), [workOrder, financialRecords]);
  const [selected, setSelected] = useState(null);
  if (selected) return <RecordDetail row={selected} lang={lang} onClose={() => setSelected(null)} />;
  return (
    <div className="wo-tab-panel">
      <div className="wo-cost-hero"><small>{t.actual}</small><strong><Money value={cost.actual} /></strong></div>
      <div className="wo-metric-grid">
        <div><small>{t.committed}</small><b><Money value={cost.committed} /></b></div>
        <div><small>{t.requested}</small><b><Money value={cost.requested} /></b></div>
        <div><small>{t.estimated}</small><b><Money value={cost.estimated} /></b></div>
      </div>
      <section className="wo-cost-categories">
        {[["labor", t.labor], ["materials", t.materials], ["services", t.services], ["expenses", t.expenses]].map(([key, label]) => (
          <div key={key}><span>{label}</span><b><Money value={cost.totals[key]} /></b></div>
        ))}
      </section>
      <div className="wo-panel-heading"><b>{t.costDetail}</b><span>{cost.rows.length}</span></div>
      <div className="wo-record-list">
        {cost.rows.length ? cost.rows.map(row => (
          <button key={row.id} onClick={() => setSelected(row)}>
            <span><b>{row.label}</b><small>{row.type} · {row.number}</small></span>
            <strong><Money value={row.amount} /></strong><i>›</i>
          </button>
        )) : <p className="wo-empty-state">{t.noCosts}</p>}
      </div>
    </div>
  );
}

export function IXIWorkOrderActivityView({ workOrder, financialRecords, language = "en" }) {
  const lang = language === "es" ? "es" : "en";
  const t = COPY[lang];
  const events = useMemo(() => getIXIWorkOrderActivity(workOrder, financialRecords), [workOrder, financialRecords]);
  return (
    <div className="wo-tab-panel">
      <div className="wo-panel-heading"><b>{t.activity}</b><span>{events.length}</span></div>
      <div className="wo-timeline">
        {events.length ? events.map((event, index) => (
          <article key={event.id || index}>
            <i />
            <div><small>{formatDate(event.occurredAt, lang)}{event.actorLabel ? ` · ${event.actorLabel}` : ""}</small><b>{event.label || event.type}</b>{event.detail ? <p>{event.detail}</p> : null}</div>
          </article>
        )) : <p className="wo-empty-state">{t.noActivity}</p>}
      </div>
    </div>
  );
}

export function IXIWorkOrderRelatedView({ workOrder, financialRecords, language = "en" }) {
  const lang = language === "es" ? "es" : "en";
  const t = COPY[lang];
  const related = useMemo(() => getIXIWorkOrderRelationships(workOrder, financialRecords), [workOrder, financialRecords]);
  const [selected, setSelected] = useState(null);
  if (selected) return <RecordDetail row={selected} lang={lang} onClose={() => setSelected(null)} />;
  const groups = [
    [t.relatedRecords, related.records.length],
    [t.notes, related.notes.length],
    [t.photos, related.photos.length],
    [t.documents, related.documents.length]
  ];
  return (
    <div className="wo-tab-panel">
      <div className="wo-related-counts">{groups.map(([label, count]) => <div key={label}><small>{label}</small><strong>{count}</strong></div>)}</div>
      <div className="wo-panel-heading"><b>{t.relatedRecords}</b><span>{related.records.length}</span></div>
      <div className="wo-record-list">
        {related.records.length ? related.records.map(row => (
          <button key={row.id} onClick={() => setSelected(row)}>
            <span><b>{row.label}</b><small>{row.type} · {row.number}</small></span>
            <strong>{row.status || "—"}</strong><i>›</i>
          </button>
        )) : <p className="wo-empty-state">{t.noRelated}</p>}
      </div>
      {related.notes.length ? <section className="wo-related-notes"><div className="wo-panel-heading"><b>{t.notes}</b></div>{related.notes.map(note => <article key={note.identity?.noteId}><b>{clean(note.note?.title) || clean(note.note?.type)}</b><p>{note.note?.body}</p></article>)}</section> : null}
      {related.documents.length ? <section className="wo-related-assets"><div className="wo-panel-heading"><b>{t.documents}</b><span>{related.documents.length}</span></div>{related.documents.map((document, index) => <article key={clean(document.documentId || document.id) || index}><b>{clean(document.title || document.fileName || document.name) || t.documents}</b><small>{clean(document.type || document.mimeType) || "—"} · {formatDate(document.date || document.createdAt, lang)}</small></article>)}</section> : null}
      {related.photos.length ? <section className="wo-related-assets"><div className="wo-panel-heading"><b>{t.photos}</b><span>{related.photos.length}</span></div>{related.photos.map((photo, index) => <article key={clean(photo.identity?.photoId || photo.id) || index}><b>{clean(photo.photo?.title || photo.title) || t.photos}</b><small>{clean(photo.photo?.type || photo.type) || "—"} · {formatDate(photo.photo?.occurredAt || photo.createdAt, lang)}</small></article>)}</section> : null}
    </div>
  );
}

export default {
  IXIWorkOrderCostView,
  IXIWorkOrderActivityView,
  IXIWorkOrderRelatedView
};
