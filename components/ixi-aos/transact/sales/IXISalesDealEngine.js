const clean = value => String(value ?? "").trim();
const object = value => value && typeof value === "object" && !Array.isArray(value) ? value : {};
const array = value => Array.isArray(value) ? value : [];
const money = value => Number.isFinite(Number(value)) ? Math.round(Number(value) * 100) / 100 : 0;

export const IXI_SALES_STAGES = Object.freeze([
  { id: "quote", number: 1, label: "QUOTE", moduleId: "quote" },
  { id: "sales-order", number: 2, label: "SALES ORDER", moduleId: "sales-order" },
  { id: "signed", number: 3, label: "SIGNED", moduleId: "sales-order" },
  { id: "invoice", number: 4, label: "INVOICE", moduleId: "invoice" },
  { id: "sold", number: 5, label: "SOLD", moduleId: "sold" },
  { id: "settlement", number: 6, label: "SETTLEMENT", moduleId: "settlement" },
]);

export const IXI_DEAL_TERMINAL_STATES = Object.freeze(["won", "sold", "lost", "declined", "expired", "withdrawn", "cancelled", "canceled", "voided", "settled"]);

export function createIXISalesDealId() {
  const raw = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `DEAL-${clean(raw).replace(/[^a-z0-9]/gi, "").slice(-12).toUpperCase()}`;
}

export function financialDocumentOf(item = {}) {
  const record = item?.record || item;
  const document = record?.financialDocument || record?.document?.financialDocument || record?.document || record;
  return { ...object(document), metadata: { ...object(record?.metadata), ...object(document?.metadata) } };
}

function embeddedOf(document = {}) {
  if (document?.quote) return document.quote;
  if (document?.salesOrder) return document.salesOrder;
  if (document?.assetSettlement) return document.assetSettlement;
  if (document?.metadata?.assetSaleRecord) return document.metadata.assetSaleRecord;
  return document;
}

function stagesOf(document = {}) {
  const type = clean(document.documentType).toLowerCase();
  const metadata = object(document.metadata);
  if (type === "quote") return ["quote"];
  if (type === "sales-order") {
    const stored = object(document.salesOrder);
    const signed = Boolean(clean(stored?.signing?.signedAt) && clean(stored?.signing?.signedPackageHash)) || ["signed", "signed-invoice-pending"].includes(clean(stored.status).toLowerCase());
    return signed ? ["sales-order", "signed"] : ["sales-order"];
  }
  if (type === "invoice") return metadata.assetSale === true || clean(metadata.transactModule) === "sold" ? ["invoice", "sold"] : ["invoice"];
  if (type === "settlement") return ["settlement"];
  return [];
}

function documentIdOf(document = {}, item = {}, index = 0) {
  return clean(document.financialDocumentId || item?.id || `sales-record-${index + 1}`);
}

function explicitDealId(document = {}, embedded = {}) {
  return clean(
    embedded?.identity?.dealId || embedded?.context?.dealId || embedded?.dealId ||
    document?.metadata?.dealId || document?.dealId,
  );
}

function linksOf(document = {}, embedded = {}) {
  return [
    document.sourceFinancialDocumentId,
    document.metadata?.quoteId,
    document.metadata?.salesOrderId,
    document.metadata?.invoiceId,
    document.metadata?.saleId,
    embedded?.related?.quoteId,
    embedded?.related?.salesOrderId,
    embedded?.related?.invoiceId,
    embedded?.related?.soldSheetId,
    embedded?.related?.settlementId,
    embedded?.references?.saleId,
    embedded?.identity?.financialInvoiceId,
  ].map(clean).filter(Boolean);
}

function dateOf(document = {}, embedded = {}) {
  return clean(document.updatedAt || embedded?.audit?.updatedAt || document.occurredAt || embedded?.audit?.createdAt);
}

function customerOf(document = {}, embedded = {}) {
  return clean(embedded?.customer?.name || embedded?.sale?.buyerLabel || document?.metadata?.customer?.name || document?.metadata?.customerLabel || document?.metadata?.buyerLabel || "CUSTOMER NOT SET");
}

function statusOf(document = {}, embedded = {}, stages = []) {
  const explicit = clean(document?.metadata?.dealStatus || embedded?.dealStatus).toLowerCase();
  if (explicit) return explicit;
  if (stages.includes("settlement")) return clean(embedded?.status || "settlement").toLowerCase();
  if (stages.includes("sold")) return "sold";
  return clean(embedded?.status || document?.financialState || document?.status || "draft").toLowerCase();
}

function amountOf(document = {}, embedded = {}) {
  return money(embedded?.totals?.customerTotal ?? embedded?.totals?.total ?? embedded?.sale?.salePrice ?? document?.totals?.customerTotal ?? document?.totals?.total ?? document?.amount);
}

function numberOf(document = {}, embedded = {}, id = "") {
  return clean(document.documentNumber || embedded?.identity?.number || (clean(document.documentType) === "invoice" && id ? `DRAFT INV-${id.slice(-8).toUpperCase()}` : id));
}

export function buildIXISalesDealRegister(records = []) {
  const entries = array(records).flatMap((item, index) => {
    const document = financialDocumentOf(item);
    const stages = stagesOf(document);
    if (!stages.length) return [];
    const embedded = embeddedOf(document);
    const documentId = documentIdOf(document, item, index);
    return [{ item, document, embedded, documentId, stages, explicitDealId: explicitDealId(document, embedded), links: linksOf(document, embedded), updatedAt: dateOf(document, embedded), customer: customerOf(document, embedded), amount: amountOf(document, embedded), status: statusOf(document, embedded, stages), number: numberOf(document, embedded, documentId) }];
  });
  const parent = new Map(entries.map(entry => [entry.documentId, entry.documentId]));
  const find = id => { let root = id; while (parent.get(root) && parent.get(root) !== root) root = parent.get(root); return root; };
  const union = (left, right) => { const a = find(left), b = find(right); if (a && b && a !== b) parent.set(b, a); };
  const byExplicit = new Map();
  entries.forEach(entry => {
    entry.links.forEach(link => { if (parent.has(link)) union(entry.documentId, link); });
    if (entry.explicitDealId) {
      if (byExplicit.has(entry.explicitDealId)) union(entry.documentId, byExplicit.get(entry.explicitDealId));
      else byExplicit.set(entry.explicitDealId, entry.documentId);
    }
  });
  const groups = new Map();
  entries.forEach(entry => {
    const root = find(entry.documentId);
    if (!groups.has(root)) groups.set(root, []);
    groups.get(root).push(entry);
  });
  return [...groups.values()].map(group => {
    const sorted = [...group].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    const dealId = group.map(entry => entry.explicitDealId).find(Boolean) || `DEAL-${find(group[0].documentId).replace(/[^a-z0-9]/gi, "").slice(-12).toUpperCase()}`;
    const stageRecords = {};
    group.forEach(entry => entry.stages.forEach(stage => {
      if (!stageRecords[stage] || entry.updatedAt > stageRecords[stage].updatedAt) stageRecords[stage] = entry;
    }));
    const currentStage = [...IXI_SALES_STAGES].reverse().find(stage => stageRecords[stage.id])?.id || "quote";
    const latest = sorted[0];
    const status = latest.status;
    return {
      dealId,
      passportId: clean(latest?.embedded?.asset?.passportId || latest?.embedded?.context?.primaryPassportId || latest?.embedded?.context?.assetPassportId),
      customer: sorted.map(entry => entry.customer).find(value => value !== "CUSTOMER NOT SET") || "CUSTOMER NOT SET",
      amount: [...IXI_SALES_STAGES].reverse().map(stage => stageRecords[stage.id]?.amount).find(value => Number.isFinite(value) && value !== 0) || 0,
      status,
      terminal: IXI_DEAL_TERMINAL_STATES.includes(status),
      currentStage,
      updatedAt: latest.updatedAt,
      stageRecords,
      records: sorted,
    };
  }).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function findIXISalesDeal(deals = [], { dealId = "", documentId = "" } = {}) {
  const wantedDeal = clean(dealId);
  const wantedDocument = clean(documentId);
  return array(deals).find(deal => deal.dealId === wantedDeal || deal.records.some(record => record.documentId === wantedDocument)) || null;
}

export function recordForIXISalesStage(deal = null, stageId = "") {
  const entry = deal?.stageRecords?.[stageId];
  if (!entry) return null;
  const record = {
    ...object(entry.embedded),
    financialBinding: {
      financialDocumentId: entry.documentId,
      revision: Number(entry.item?.server?.revision || entry.item?.record?.server?.revision || 1),
      financialLineId: clean(entry.document?.lines?.[0]?.financialLineId),
      line: entry.document?.lines?.[0] || null,
    },
  };
  if (stageId === "sold") {
    record.identity = {
      ...object(record.identity),
      dealId: clean(record?.identity?.dealId || deal?.dealId),
      saleId: entry.documentId,
      financialInvoiceId: entry.documentId,
    };
    record.status = "sold";
  }
  return record;
}

export function documentForIXISalesStage(deal = null, stageId = "") {
  const entry = deal?.stageRecords?.[stageId];
  if (!entry) return null;
  return {
    ...entry.document,
    financialBinding: {
      financialDocumentId: entry.documentId,
      revision: Number(entry.item?.server?.revision || entry.item?.record?.server?.revision || 1),
      financialLineId: clean(entry.document?.lines?.[0]?.financialLineId),
      line: entry.document?.lines?.[0] || null,
    },
  };
}

export default { IXI_SALES_STAGES, IXI_DEAL_TERMINAL_STATES, createIXISalesDealId, buildIXISalesDealRegister, findIXISalesDeal, recordForIXISalesStage, documentForIXISalesStage };
