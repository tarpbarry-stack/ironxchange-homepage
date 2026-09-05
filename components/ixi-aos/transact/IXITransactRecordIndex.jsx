import { useMemo, useState } from "react";

import { getIXITransactModule } from "./IXITransactModuleRegistry";
import { resolveIXITransactRecordModuleId } from "./IXITransactRecordRouting";

const clean = value => String(value ?? "").trim();
const finite = value =>
  value !== "" &&
  value !== null &&
  value !== undefined &&
  Number.isFinite(Number(value));
const money = value =>
  Math.round((Number(value) || 0) * 100) / 100;
const upper = value => clean(value).toUpperCase();

const CATEGORY_ORDER = Object.freeze([
  "work",
  "freight",
  "purchase",
  "bill",
  "expense",
  "time",
  "material",
  "acquisition",
  "rental",
  "service",
  "sales",
  "cash",
  "ledger",
  "settlement",
  "other"
]);

const CATEGORY_META = Object.freeze({
  work: { label: "WORK ORDERS", moduleId: "work-order" },
  freight: { label: "FREIGHT ORDERS", moduleId: "freight" },
  purchase: { label: "PURCHASE ORDERS", moduleId: "purchase-order" },
  bill: { label: "BILLS / INVOICES", moduleId: "bill" },
  expense: { label: "EXPENSES", moduleId: "expense" },
  time: { label: "TIME", moduleId: "time" },
  material: { label: "PARTS / MATERIAL", moduleId: "material" },
  acquisition: { label: "ACQUISITION", moduleId: "asset-acquisition" },
  rental: { label: "RENTAL", moduleId: "rental-expense" },
  service: { label: "SERVICE", moduleId: "service-quote" },
  sales: { label: "SALES", moduleId: "sales-order" },
  cash: { label: "COLLECTIONS / PAYMENTS", moduleId: "collections" },
  ledger: { label: "GENERAL LEDGER", moduleId: "general-ledger" },
  settlement: { label: "SETTLEMENT", moduleId: "settlement" },
  other: { label: "OTHER RECORDS", moduleId: "" }
});

const TYPE_META = Object.freeze({
  "work-order": { category: "work", moduleId: "work-order" },
  freight: { category: "freight", moduleId: "freight" },
  "freight-order": { category: "freight", moduleId: "freight" },
  purchase: { category: "purchase", moduleId: "purchase-order" },
  "purchase-order": { category: "purchase", moduleId: "purchase-order" },
  bill: { category: "bill", moduleId: "bill" },
  invoice: { category: "bill", moduleId: "invoice" },
  expense: { category: "expense", moduleId: "expense" },
  "time-entry": { category: "time", moduleId: "time" },
  "material-usage": { category: "material", moduleId: "material" },
  "asset-acquisition": { category: "acquisition", moduleId: "asset-acquisition" },
  "rental-expense": { category: "rental", moduleId: "rental-expense" },
  "rental-income": { category: "rental", moduleId: "rental-income" },
  "service-quote": { category: "service", moduleId: "service-quote" },
  "service-order": { category: "service", moduleId: "work-order" },
  quote: { category: "sales", moduleId: "quote" },
  "sales-order": { category: "sales", moduleId: "sales-order" },
  collection: { category: "cash", moduleId: "collections" },
  payment: { category: "cash", moduleId: "treasury" },
  "journal-entry": { category: "ledger", moduleId: "general-ledger" },
  settlement: { category: "settlement", moduleId: "settlement" }
});

const RECORD_KEYS = Object.freeze([
  "workOrder",
  "techWorkOrder",
  "freightOrder",
  "purchaseOrder",
  "purchaseOrderRecord",
  "billRecord",
  "bill",
  "expense",
  "timeEntry",
  "timeRecord",
  "materialUsage",
  "materialRecord",
  "assetAcquisition",
  "rentalExpense",
  "rentalIncome",
  "serviceQuote",
  "quote",
  "salesOrder",
  "assetSale",
  "collectionCase",
  "payableCase",
  "treasuryAccount",
  "generalLedgerRecord",
  "assetSettlement"
]);

function financialDocumentOf(item = {}) {
  const record = item?.record || item || {};
  return (
    record?.financialDocument ||
    record?.document?.financialDocument ||
    record?.document ||
    record
  );
}

function embeddedRecordOf(document = {}) {
  for (const key of RECORD_KEYS) {
    const value = document?.[key];
    if (value && typeof value === "object" && !Array.isArray(value)) {
      return value;
    }
  }
  const stored = document?.metadata?.assetSaleRecord;
  return stored && typeof stored === "object" ? stored : {};
}

function firstMoney(values = []) {
  for (const value of values) {
    if (finite(value)) return money(value);
  }
  return 0;
}

function amountOf(document = {}, embedded = {}) {
  const lineAmount = Array.isArray(document?.lines)
    ? document.lines.reduce(
        (sum, line) =>
          sum +
          firstMoney([
            line?.amount,
            line?.extendedAmount,
            line?.debit,
            line?.credit
          ]),
        0
      )
    : 0;

  return firstMoney([
    document?.amount,
    document?.totalAmount,
    document?.grandTotal,
    embedded?.expense?.amount,
    embedded?.bill?.amount,
    embedded?.economics?.actualTotal,
    embedded?.economics?.agreedAmount,
    embedded?.economics?.expectedTotal,
    embedded?.costs?.billed,
    embedded?.costs?.committed,
    embedded?.costs?.estimated,
    embedded?.costAttribution?.amount,
    embedded?.totals?.grandTotal,
    embedded?.totals?.total,
    embedded?.waterfall?.netProceeds,
    lineAmount
  ]);
}

function numberOf(document = {}, embedded = {}) {
  const identity = embedded?.identity || {};
  return clean(
    document?.documentNumber ||
      identity?.number ||
      identity?.workOrderNumber ||
      identity?.purchaseOrderNumber ||
      identity?.poNumber ||
      identity?.invoiceNumber ||
      identity?.expenseNumber ||
      identity?.freightOrderNumber ||
      identity?.settlementNumber ||
      document?.financialDocumentId
  );
}

function statusOf(document = {}, embedded = {}) {
  return clean(
    embedded?.work?.status ||
      embedded?.approval?.status ||
      embedded?.payment?.status ||
      embedded?.financial?.status ||
      embedded?.status ||
      document?.financialState ||
      document?.status ||
      "recorded"
  ).toLowerCase();
}

function titleOf(document = {}, embedded = {}) {
  return clean(
    embedded?.title ||
      embedded?.description ||
      embedded?.expense?.description ||
      embedded?.bill?.description ||
      embedded?.order?.description ||
      embedded?.material?.description ||
      embedded?.route?.destination?.label ||
      embedded?.vendor?.label ||
      embedded?.vendorLabel ||
      document?.memo ||
      document?.description ||
      document?.documentType
  );
}

function dateOf(item = {}, document = {}, embedded = {}) {
  return clean(
    document?.occurredAt ||
      document?.updatedAt ||
      embedded?.audit?.updatedAt ||
      embedded?.audit?.createdAt ||
      embedded?.createdAt ||
      item?.server?.updatedAt ||
      item?.record?.server?.updatedAt
  );
}

function formatDate(value = "") {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(parsed)).toUpperCase();
}

function formatMoney(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(money(value));
}

function isOpenStatus(status = "") {
  return ![
    "closed",
    "complete",
    "completed",
    "cancelled",
    "canceled",
    "void",
    "paid",
    "settled",
    "reconciled"
  ].includes(clean(status).toLowerCase());
}

export function getIXITransactRecordIndex(records = []) {
  const sourceRecords = Array.isArray(records) ? records : [];
  const packageAllocationByPassport = new Map();
  for (const item of sourceRecords) {
    const document = financialDocumentOf(item);
    const event = document?.packageNormalization || document?.metadata?.packageNormalization;
    if (clean(event?.type) !== "package-normalization") continue;
    const occurredAt = clean(event?.occurredAt || document?.occurredAt);
    for (const allocation of Array.isArray(event?.allocations) ? event.allocations : []) {
      const passportId = clean(allocation?.passportId);
      const current = packageAllocationByPassport.get(passportId);
      if (passportId && (!current || occurredAt >= current.occurredAt)) {
        packageAllocationByPassport.set(passportId, { amount: money(allocation?.amount), occurredAt });
      }
    }
  }
  const normalized = sourceRecords
    .map((item, index) => {
      const document = financialDocumentOf(item);
      const embedded = embeddedRecordOf(document);
      const documentType = clean(
        document?.documentType || document?.type || "record"
      ).toLowerCase();
      const expenseCorrection = documentType === "adjustment" && document?.metadata?.expenseCorrection === true;
      const mapped = (expenseCorrection ? TYPE_META.expense : TYPE_META[documentType]) || {
        category: "other",
        moduleId: clean(document?.metadata?.transactModule)
      };
      const moduleId = resolveIXITransactRecordModuleId({
        documentType,
        document,
        embedded,
        fallbackModuleId: mapped.moduleId
      });
      const occurredAt = dateOf(item, document, embedded);
      const record = {
        id:
          clean(document?.financialDocumentId) ||
          clean(item?.id) ||
          `financial-record-${index + 1}`,
        number: numberOf(document, embedded) || `RECORD ${index + 1}`,
        documentType,
        category: mapped.category,
        moduleId,
        status: statusOf(document, embedded),
        amount: documentType === "asset-acquisition" && packageAllocationByPassport.has(clean(embedded?.context?.primaryPassportId))
          ? packageAllocationByPassport.get(clean(embedded?.context?.primaryPassportId)).amount
          : amountOf(document, embedded),
        title: titleOf(document, embedded),
        occurredAt,
        revision: Number(
          item?.server?.revision || item?.record?.server?.revision || 0
        ),
        source: item,
        document,
        embedded
      };
      return { ...record, open: isOpenStatus(record.status) };
    })
    .sort(
      (left, right) =>
        (Date.parse(right.occurredAt) || 0) -
        (Date.parse(left.occurredAt) || 0)
    );

  const grouped = new Map();
  for (const record of normalized) {
    if (!grouped.has(record.category)) grouped.set(record.category, []);
    grouped.get(record.category).push(record);
  }

  const categories = CATEGORY_ORDER
    .filter(id => grouped.has(id))
    .map(id => {
      const recordsForCategory = grouped.get(id);
      const configured = CATEGORY_META[id];
      return {
        id,
        label: configured.label,
        moduleId: configured.moduleId,
        count: recordsForCategory.length,
        openCount: recordsForCategory.filter(record => record.open).length,
        amount: money(
          recordsForCategory.reduce((sum, record) => sum + record.amount, 0)
        ),
        records: recordsForCategory
      };
    });

  return {
    records: normalized,
    categories,
    totalCount: normalized.length,
    totalAmount: money(
      normalized.reduce((sum, record) => sum + record.amount, 0)
    )
  };
}

export default function IXITransactRecordIndex({
  context = {},
  financialRecords = [],
  onOpenModule = null,
  onOpenWorksheet = null,
  onClose = null
}) {
  const index = useMemo(
    () => getIXITransactRecordIndex(financialRecords),
    [financialRecords]
  );
  const [categoryId, setCategoryId] = useState("");
  const [recordId, setRecordId] = useState("");

  const category =
    index.categories.find(item => item.id === categoryId) || null;
  const record =
    category?.records.find(item => item.id === recordId) || null;

  function reset() {
    setRecordId("");
    setCategoryId("");
  }

  function goBack() {
    if (recordId) setRecordId("");
    else setCategoryId("");
  }

  function navigateBack() {
    if (categoryId) goBack();
    else onClose?.();
  }

  function openRecord(target, presentation = "console") {
    const moduleId =
      clean(target?.moduleId) ||
      clean(category?.moduleId);
    const module =
      getIXITransactModule(moduleId) || {
        id: moduleId || "financial-reporting",
        label: upper(target?.documentType || "TRAN$ACT RECORD"),
        group: "record",
        documentType: target?.documentType || "record"
      };
    const payload = {
      financialRecord: target?.source,
      financialDocument: target?.document,
      financialDocumentId: target?.id,
      presentation,
      source: "machine-financial-face-f1"
    };
    if (presentation === "worksheet" && onOpenWorksheet) {
      onOpenWorksheet(module, context, payload);
      return;
    }
    onOpenModule?.(module, context, payload);
  }

  return (
    <div className="tx-record-index">
      <header className="txri-header">
        <div>
          <span>IXI MACHINE · F$1</span>
          <strong>
            {record ? record.number : category ? category.label : "RECORD INDEX"}
          </strong>
          <small>{clean(context?.primary?.label) || "AOS OBJECT"}</small>
        </div>
        {category || onClose ? (
          <button type="button" onClick={navigateBack} aria-label="Back">
            ‹
          </button>
        ) : null}
      </header>

      <main className="txri-body">
        {!category ? (
          <>
            <section className="txri-summary">
              <div className="txri-record-kpi">
                <span>RECORDS</span>
                <strong>{index.totalCount}</strong>
              </div>
              <div className="txri-total-kpi">
                <span>TOTAL IN MACHINE</span>
                <strong>{formatMoney(index.totalAmount)}</strong>
              </div>
            </section>

            {index.categories.length ? (
              <div className="txri-categories">
                {index.categories.map(item => (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => setCategoryId(item.id)}
                  >
                    <span className="txri-name">{item.label}</span>
                    <span className="txri-count">{item.count}</span>
                    <span className="txri-total">
                      {item.amount ? formatMoney(item.amount) : "—"}
                    </span>
                    <b>›</b>
                  </button>
                ))}
              </div>
            ) : (
              <div className="txri-empty">
                <strong>NO MACHINE RECORDS</strong>
                <span>
                  Records created for this machine will appear here automatically.
                </span>
              </div>
            )}
          </>
        ) : record ? (
          <article className="txri-detail">
            <div className="txri-state">
              <span className={record.open ? "open" : "closed"} />
              {upper(record.status)}
            </div>
            <dl>
              <div>
                <dt>RECORD NUMBER</dt>
                <dd>{record.number}</dd>
              </div>
              <div>
                <dt>TYPE</dt>
                <dd>{upper(record.documentType).replaceAll("-", " ")}</dd>
              </div>
              <div>
                <dt>DATE</dt>
                <dd>{formatDate(record.occurredAt)}</dd>
              </div>
              <div>
                <dt>AMOUNT</dt>
                <dd>{record.amount ? formatMoney(record.amount) : "—"}</dd>
              </div>
              <div className="wide">
                <dt>DETAIL</dt>
                <dd>{record.title || "TRAN$ACT RECORD"}</dd>
              </div>
            </dl>
            <div className="txri-actions">
              <button type="button" onClick={() => openRecord(record)}>
                OPEN APP
              </button>
              {onOpenWorksheet ? (
                <button
                  type="button"
                  onClick={() => openRecord(record, "worksheet")}
                >
                  WORKSHEET
                </button>
              ) : null}
            </div>
          </article>
        ) : (
          <div className="txri-records">
            <div className="txri-section-bar">
              <span>{category.count} RECORDS</span>
              <strong>
                {category.amount ? formatMoney(category.amount) : "—"}
              </strong>
            </div>
            {category.records.map(item => (
              <button
                type="button"
                key={item.id}
                onClick={() => setRecordId(item.id)}
              >
                <span className={item.open ? "open" : "closed"} />
                <div>
                  <strong>{item.number}</strong>
                  <small>
                    {upper(item.status)} · {formatDate(item.occurredAt)}
                  </small>
                </div>
                <b>{item.amount ? formatMoney(item.amount) : "—"}</b>
              </button>
            ))}
          </div>
        )}
      </main>

      <style jsx>{`
        .tx-record-index,.tx-record-index *{box-sizing:border-box}
        .tx-record-index{position:relative;width:298px;height:471px;overflow:hidden;border:1px solid rgba(255,196,0,.18);border-radius:14px;background:linear-gradient(180deg,rgba(255,196,0,.035),transparent 31%),#0b0c0c;color:#f4f4f4;font-family:Inter,Arial,sans-serif;box-shadow:0 18px 34px rgba(0,0,0,.42)}
        .txri-header{height:61px;padding:10px 11px;border-bottom:1px solid rgba(255,255,255,.09);display:flex;align-items:flex-start;justify-content:space-between}
        .txri-header span{display:block;color:#ffc400;font-size:8px;font-weight:900;letter-spacing:.075em}
        .txri-header strong{display:block;max-width:244px;margin-top:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:15px;line-height:1.08;font-weight:900}
        .txri-header small{display:block;max-width:244px;margin-top:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#858b88;font-size:7px;font-weight:800;text-transform:uppercase}
        .txri-header button{width:30px;height:30px;margin:-1px -1px 0 6px;border:1px solid rgba(255,255,255,.14);border-radius:7px;background:#111313;color:#ffc400;font-size:21px;font-weight:900;cursor:pointer}
        .txri-body{position:absolute;inset:61px 0 9px;overflow-x:hidden;overflow-y:auto;padding:9px;scrollbar-width:thin;scrollbar-color:rgba(255,255,255,.18) transparent}
        .txri-summary{display:grid;grid-template-columns:82px minmax(0,1fr);gap:7px;margin-bottom:8px}
        .txri-summary div{height:56px;padding:8px 10px;border:1px solid rgba(255,255,255,.09);border-radius:7px;background:#101313;display:flex;flex-direction:column;align-items:flex-start;justify-content:center}
        .txri-summary span{color:#969c99;font-size:8px;font-weight:900;letter-spacing:.045em}
        .txri-summary strong{margin-top:5px;color:#ffc400;font-size:18px;line-height:1;font-weight:950}
        .txri-summary .txri-record-kpi{align-items:center;padding-inline:7px}
        .txri-summary .txri-record-kpi strong{font-size:20px}
        .txri-summary .txri-total-kpi{border-color:rgba(255,196,0,.68);background:linear-gradient(135deg,rgba(255,196,0,.11),rgba(255,196,0,.025) 62%),#101313;box-shadow:inset 0 0 0 1px rgba(255,196,0,.08),0 0 14px rgba(255,196,0,.06)}
        .txri-summary .txri-total-kpi span{color:#ffc400}
        .txri-summary .txri-total-kpi strong{width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#f4f4f4;font-size:19px}
        .txri-categories{display:flex;flex-direction:column;border:1px solid rgba(255,255,255,.09);border-radius:8px;overflow:hidden}
        .txri-categories button{position:relative;min-height:43px;padding:7px 23px 7px 10px;border:0;border-bottom:1px solid rgba(255,255,255,.07);background:#0e1110;color:#f1f1f1;display:grid;grid-template-columns:minmax(0,1fr) 28px 64px;align-items:center;text-align:left;cursor:pointer}
        .txri-categories button:last-child{border-bottom:0}
        .txri-categories button:hover,.txri-categories button:focus-visible{outline:none;background:#151918}
        .txri-name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:10px;font-weight:900}
        .txri-count{color:#ffc400;font-size:12px;font-weight:950;text-align:center}
        .txri-total{color:#aeb3b0;font-size:9px;font-weight:850;text-align:right}
        .txri-categories b{position:absolute;right:9px;color:#ffc400;font-size:15px}
        .txri-empty{min-height:180px;padding:42px 22px;border:1px solid rgba(255,255,255,.08);border-radius:8px;background:#0e1110;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}
        .txri-empty strong{color:#ffc400;font-size:12px;font-weight:950}
        .txri-empty span{margin-top:8px;color:#969c99;font-size:9px;line-height:1.45;font-weight:700}
        .txri-section-bar{height:43px;padding:0 10px;border:1px solid rgba(255,255,255,.09);border-radius:7px 7px 0 0;background:#121514;display:flex;align-items:center;justify-content:space-between}
        .txri-section-bar span{color:#969c99;font-size:8px;font-weight:900}
        .txri-section-bar strong{color:#ffc400;font-size:11px;font-weight:950}
        .txri-records>button{position:relative;width:100%;min-height:58px;padding:8px 8px 8px 20px;border:0;border-bottom:1px solid rgba(255,255,255,.07);background:#0e1110;color:#eee;display:grid;grid-template-columns:minmax(0,1fr) 72px;align-items:center;text-align:left;cursor:pointer}
        .txri-records>button:hover,.txri-records>button:focus-visible{outline:none;background:#151918}
        .txri-records>button>span,.txri-state>span{position:absolute;left:8px;width:6px;height:6px;border-radius:50%}
        .txri-records .open,.txri-state .open{background:#ffc400;box-shadow:0 0 7px rgba(255,196,0,.42)}
        .txri-records .closed,.txri-state .closed{background:#69706c}
        .txri-records div{min-width:0}
        .txri-records strong{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:10px;font-weight:950}
        .txri-records small{display:block;margin-top:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#858b88;font-size:7px;font-weight:800}
        .txri-records b{color:#c3c7c5;font-size:9px;font-weight:900;text-align:right}
        .txri-detail{padding:1px}
        .txri-state{position:relative;height:35px;padding-left:19px;border-bottom:1px solid rgba(255,255,255,.08);color:#aeb3b0;display:flex;align-items:center;font-size:8px;font-weight:950;letter-spacing:.055em}
        .txri-state>span{left:5px}
        .txri-detail dl{margin:0}
        .txri-detail dl>div{min-height:50px;padding:9px 7px;border-bottom:1px solid rgba(255,255,255,.07);display:grid;grid-template-columns:92px minmax(0,1fr);gap:8px;align-items:center}
        .txri-detail dt{color:#858b88;font-size:8px;font-weight:900}
        .txri-detail dd{min-width:0;margin:0;overflow-wrap:anywhere;color:#f4f4f4;font-size:10px;line-height:1.25;font-weight:900;text-align:right}
        .txri-detail .wide{display:block}
        .txri-detail .wide dd{margin-top:7px;text-align:left}
        .txri-actions{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:10px}
        .txri-actions button{min-height:37px;border:1px solid rgba(255,196,0,.48);border-radius:6px;background:#151711;color:#ffc400;font-size:8px;font-weight:950;letter-spacing:.04em;cursor:pointer}
        .txri-actions button:only-child{grid-column:1/-1}
      `}</style>
    </div>
  );
}
