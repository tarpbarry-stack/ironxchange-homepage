import { useEffect, useMemo, useRef, useState } from "react";

import IXIMachineRail from "../../IXIMachineRail";
import { createIXITransactContext } from "./IXITransactContext";
import { getIXITransactModules } from "./IXITransactModuleRegistry";
import IXIWorkOrderApp from "./modules/work-order/IXIWorkOrderApp";
import IXITechWorkOrderApp from "./modules/tech-work-order/IXITechWorkOrderApp";
import IXIExpenseApp from "./modules/expense/IXIExpenseApp";
import { findIXIExpenseRecord } from "./modules/expense/IXIExpenseRecordEngine";
import IXIPurchaseOrderApp from "./modules/purchase-order/IXIPurchaseOrderApp";
import { hydrateIXIPurchaseOrderRecord } from "./modules/purchase-order/IXIPurchaseOrderRecordEngine";
import IXIBillStandaloneApp from "./modules/bill/IXIBillStandaloneApp";
import { hydrateIXIBillRecord } from "./modules/bill/IXIBillContract";
import IXITimeStandaloneApp from "./modules/time/IXITimeStandaloneApp";
import IXIMaterialStandaloneApp from "./modules/material/IXIMaterialStandaloneApp";
import IXIAssetAcquisitionApp from "./modules/asset-acquisition/IXIAssetAcquisitionApp";
import IXIFreightApp from "./modules/freight/IXIFreightApp";
import IXIRentalExpenseApp from "./modules/rental-expense/IXIRentalExpenseApp";
import IXIRentalIncomeApp from "./modules/rental-income/IXIRentalIncomeApp";
import IXIServiceQuoteApp from "./modules/service-quote/IXIServiceQuoteApp";
import IXIQuoteApp from "./modules/quote/IXIQuoteApp";
import IXIEquipmentSaleApp from "./modules/equipment-sale/IXIEquipmentSaleApp";
import IXIServiceInvoiceApp from "./modules/service-invoice/IXIServiceInvoiceApp";
import IXIAssetSaleApp from "./modules/sold/IXIAssetSaleApp";
import IXISettlementApp from "./modules/settlement/IXISettlementApp";
import IXICollectionsApp from "./modules/collections/IXICollectionsApp";
import IXIPayablesApp from "./modules/payables/IXIPayablesApp";
import IXITreasuryApp from "./modules/treasury/IXITreasuryApp";
import IXIGeneralLedgerApp from "./modules/general-ledger/IXIGeneralLedgerApp";
import IXIFinancialReportingApp from "./modules/financial-reporting/IXIFinancialReportingApp";
import IXIAccessPolicyApp from "./modules/access-policy/IXIAccessPolicyApp";
import IXISalesDealRegister, { IXISalesStageRail } from "./sales/IXISalesDealRegister";
import {
  buildIXISalesDealRegister,
  createIXISalesDealId,
  dealsForIXISalesModule,
  documentForIXISalesStage,
  findIXISalesDeal,
  quoteDraftForIXISalesDeal,
  recordForIXISalesStage,
  salesOrderDraftForIXISalesDeal,
  salesStageForIXIModule,
} from "./sales/IXISalesDealEngine";
import { closeIXISalesDeal } from "./sales/IXISalesDealCommands";
import IXISalesDealStyles from "./sales/IXISalesDealStyles";
import { createIXICustomerServiceWorkOrder } from "./modules/customer-service-work-order/IXICustomerServiceWorkOrderAdapter";
import IXITransactStyles from "./IXITransactStyles";
import IXITransactHomeTypography from "./IXITransactHomeTypography";
import IXITransactSortableLauncher from "./IXITransactSortableLauncher";
import {
  IXI_TRANSACT_LOCALES,
  IXI_TRANSACT_LOCALE_STORAGE_KEY,
  IXITransactLocaleProvider,
  translateIXITransact,
} from "./IXITransactLocale";
import { loadIXIAosFinancialDocument, patchIXIAosFinancialDocument } from "../financial-runtime/IXIAosFinancialReadClient";

const clean = (value) => String(value ?? "").trim();
const financialDocumentOf = (item) => {
  const record = item?.record || item || {};
  const document = record?.financialDocument || record?.document?.financialDocument || record?.document || record;
  return { ...document, metadata: { ...(record?.metadata || {}), ...(document?.metadata || {}) } };
};
const financialRevisionOf = (item) =>
  Number(item?.server?.revision || item?.record?.server?.revision || 1);
const SALES_MODULE_IDS = new Set(["quote", "sales-order", "invoice", "sold", "settlement"]);
const SALES_DOCUMENT_TYPES = new Set(["quote", "sales-order", "invoice", "settlement"]);
const financialDocumentIdOf = item => clean(financialDocumentOf(item)?.financialDocumentId || item?.id);
const linkedSalesDocumentIds = item => {
  const document = financialDocumentOf(item);
  if (!SALES_DOCUMENT_TYPES.has(clean(document?.documentType).toLowerCase())) return [];
  const embedded = document?.quote || document?.salesOrder || document?.assetSettlement || document?.metadata?.assetSaleRecord || {};
  return [
    document.sourceFinancialDocumentId,
    ...(Array.isArray(document.relatedFinancialDocumentIds) ? document.relatedFinancialDocumentIds : []),
    ...(Array.isArray(document.relationships) ? document.relationships.map(link => link?.financialDocumentId) : []),
    document?.metadata?.quoteId,
    document?.metadata?.salesOrderId,
    document?.metadata?.invoiceId,
    embedded?.related?.quoteId,
    embedded?.related?.salesOrderId,
    embedded?.related?.invoiceId,
    embedded?.related?.soldSheetId,
    embedded?.related?.settlementId,
    embedded?.references?.saleId,
    embedded?.identity?.financialInvoiceId,
  ].map(clean).filter(Boolean);
};

export default function IXITransactApp({
  object = {},
  initialModuleId = "",
  selectedFinancialDocumentId = "",
  returnToClose = false,
  actor = {},
  entity = {},
  activeWorkOrder = null,
  activeTechWorkOrder = null,
  permissions = [],
  financialRecords = [],
  onFinancialRecordsChange = null,
  onClose = null,
  onOpenModule = null,
  onSendFront = null,
  onSendBack = null,
  onCycleColor = null,
  onCycleOutline = null,
  armedDestination = "",
  onSendToArmedDestination = null,
  moduleOrder = null,
  onModuleOrderChange = null,
}) {
  const dialogRef = useRef(null);
  const [worksheetOpen, setWorksheetOpen] = useState(false);
  const [locale, setLocale] = useState(IXI_TRANSACT_LOCALES.ENGLISH);

  const expenseSnapshot = useMemo(() => {
    if (!clean(selectedFinancialDocumentId)) return null;
    const records = financialRecords.length
      ? financialRecords
      : object?.assetFinancialTransactions || object?.relatedFinancialRecords || object?.financialRecords || [];
    return findIXIExpenseRecord(records, selectedFinancialDocumentId);
  }, [financialRecords, object, selectedFinancialDocumentId]);

  useEffect(() => {
    try {
      const saved = globalThis.localStorage?.getItem(
        IXI_TRANSACT_LOCALE_STORAGE_KEY,
      );
      if (Object.values(IXI_TRANSACT_LOCALES).includes(saved)) setLocale(saved);
    } catch {
      // Private browsing and storage policies may deny persistence.
    }
  }, []);

  const context = useMemo(
    () =>
      createIXITransactContext({
        object,
        actor,
        entity,
        activeWorkOrder,
        permissions,
      }),
    [object, actor, entity, activeWorkOrder, permissions],
  );
  const modules = useMemo(
    () =>
      getIXITransactModules({
        objectType: context.primary.objectType,
        permissions: context.permissions,
      }).map((item) => ({
        ...item,
        label: translateIXITransact(locale, item.label),
      })),
    [context, locale],
  );
  const [moduleId, setModuleId] = useState(() => clean(initialModuleId));
  const [salesRoute, setSalesRoute] = useState(() => clean(selectedFinancialDocumentId)
    ? { documentId: clean(selectedFinancialDocumentId), dealId: "", stageId: clean(initialModuleId), detail: true }
    : null);
  const [salesLineageRecords, setSalesLineageRecords] = useState([]);
  const attemptedSalesLineageIds = useRef(new Set());
  const [acquisitionWorkflowIntent, setAcquisitionWorkflowIntent] = useState(null);
  const [workOrderSnapshot, setWorkOrderSnapshot] = useState(
    activeWorkOrder || null,
  );
  const [techWorkOrderSnapshot, setTechWorkOrderSnapshot] = useState(
    activeTechWorkOrder || null,
  );
  const [saleSnapshot, setSaleSnapshot] = useState(
    object.assetSale || object.saleRecord || null,
  );
  const [settlementSnapshot, setSettlementSnapshot] = useState(
    object.assetSettlement || object.settlementRecord || null,
  );
  const [collectionCases, setCollectionCases] = useState(
    Array.isArray(object.collectionCases) ? object.collectionCases : [],
  );
  const [payableCases, setPayableCases] = useState(
    Array.isArray(object.payableCases) ? object.payableCases : [],
  );
  const [treasuryAccounts, setTreasuryAccounts] = useState(
    Array.isArray(object.treasuryAccounts) ? object.treasuryAccounts : [],
  );
  const [treasuryReconciliations, setTreasuryReconciliations] = useState(
    Array.isArray(object.treasuryReconciliations)
      ? object.treasuryReconciliations
      : [],
  );
  const collectionCasesFromFinancial = useMemo(() => {
    const records = financialRecords.length
      ? financialRecords
      : object?.receivableFinancialRecords ||
        object?.assetFinancialTransactions ||
        object?.relatedFinancialRecords ||
        object?.financialRecords ||
        [];
    const durable = records
      .map((item) => {
        const document = financialDocumentOf(item);
        if (document.documentType !== "collection" || !document.collectionCase)
          return null;
        return {
          ...document.collectionCase,
          financialBinding: {
            financialDocumentId: document.financialDocumentId,
            revision: financialRevisionOf(item),
          },
        };
      })
      .filter(Boolean);
    return durable.length
      ? durable
      : Array.isArray(object.collectionCases)
        ? object.collectionCases
        : [];
  }, [object, financialRecords]);
  const settlementFromFinancial = useMemo(() => {
    const records = financialRecords.length
      ? financialRecords
      : object?.assetFinancialTransactions ||
        object?.relatedFinancialRecords ||
        object?.financialRecords ||
        [];
    for (const item of records) {
      const document = financialDocumentOf(item);
      if (document.documentType === "settlement" && document.assetSettlement)
        return {
          ...document.assetSettlement,
          financialBinding: {
            financialDocumentId: document.financialDocumentId,
            revision: financialRevisionOf(item),
          },
        };
    }
    return object.assetSettlement || object.settlementRecord || null;
  }, [object, financialRecords]);
  const saleFromFinancial = useMemo(() => {
    const records = financialRecords.length
      ? financialRecords
      : object?.assetFinancialTransactions ||
        object?.relatedFinancialRecords ||
        object?.financialRecords ||
        [];
    for (const item of records) {
      const document = financialDocumentOf(item);
      const stored = document?.metadata?.assetSaleRecord;
      if (document.documentType === "invoice" && document?.metadata?.assetSale === true && stored) {
        return {
          ...stored,
          identity: { ...stored.identity, saleId: document.financialDocumentId, financialInvoiceId: document.financialDocumentId },
          status: "sold",
          financialBinding: { financialDocumentId: document.financialDocumentId, revision: financialRevisionOf(item) },
        };
      }
    }
    return object.assetSale || object.saleRecord || null;
  }, [object, financialRecords]);
  const acquisitionSnapshot = useMemo(() => {
    if (object.assetAcquisition || object.acquisitionRecord)
      return object.assetAcquisition || object.acquisitionRecord;
    for (const item of financialRecords) {
      const document =
        item?.financialDocument || item?.record?.financialDocument || item;
      if (
        document?.documentType === "asset-acquisition" &&
        document?.assetAcquisition
      ) {
        return {
          ...document.assetAcquisition,
          financialBinding: {
            financialDocumentId: document.financialDocumentId,
            revision: Number(
              item?.server?.revision || item?.record?.server?.revision || 1,
            ),
            financialLineId: clean(document?.lines?.[0]?.financialLineId),
          },
        };
      }
    }
    return null;
  }, [object, financialRecords]);
  const rentalExpenseSnapshot = useMemo(() => {
    if (object.rentalExpense || object.rentalExpenseRecord)
      return object.rentalExpense || object.rentalExpenseRecord;
    for (const item of financialRecords) {
      const document =
        item?.financialDocument || item?.record?.financialDocument || item;
      if (
        document?.documentType === "rental-expense" &&
        document?.rentalExpense
      ) {
        return {
          ...document.rentalExpense,
          financialBinding: {
            financialDocumentId: document.financialDocumentId,
            revision: Number(
              item?.server?.revision || item?.record?.server?.revision || 1,
            ),
            financialLineId: clean(document?.lines?.[0]?.financialLineId),
            line: document?.lines?.[0] || null,
          },
        };
      }
    }
    return null;
  }, [object, financialRecords]);
  const rentalIncomeSnapshot = useMemo(() => {
    if (object.rentalIncome || object.rentalIncomeRecord)
      return object.rentalIncome || object.rentalIncomeRecord;
    for (const item of financialRecords) {
      const document =
        item?.financialDocument || item?.record?.financialDocument || item;
      if (
        document?.documentType === "rental-income" &&
        document?.rentalIncome
      ) {
        return {
          ...document.rentalIncome,
          financialBinding: {
            financialDocumentId: document.financialDocumentId,
            revision: Number(
              item?.server?.revision || item?.record?.server?.revision || 1,
            ),
            financialLineId: clean(document?.lines?.[0]?.financialLineId),
            line: document?.lines?.[0] || null,
          },
        };
      }
    }
    return null;
  }, [object, financialRecords]);
  const serviceQuoteSnapshot = useMemo(() => {
    if (object.serviceQuote || object.serviceQuoteRecord)
      return object.serviceQuote || object.serviceQuoteRecord;
    for (const item of financialRecords) {
      const document =
        item?.financialDocument || item?.record?.financialDocument || item;
      if (
        document?.documentType === "service-quote" &&
        document?.serviceQuote
      ) {
        return {
          ...document.serviceQuote,
          financialBinding: {
            financialDocumentId: document.financialDocumentId,
            revision: Number(
              item?.server?.revision || item?.record?.server?.revision || 1,
            ),
            financialLineId: clean(document?.lines?.[0]?.financialLineId),
            line: document?.lines?.[0] || null,
          },
        };
      }
    }
    return null;
  }, [object, financialRecords]);
  const quoteSnapshot = useMemo(() => {
    if (object.quote || object.quoteRecord) return object.quote || object.quoteRecord;
    const records = financialRecords.length
      ? financialRecords
      : object?.assetFinancialTransactions || object?.relatedFinancialRecords || object?.financialRecords || [];
    const durable = records.map((item) => {
      const document = financialDocumentOf(item);
      if (document?.documentType !== "quote" || !document?.quote) return null;
      return {
        ...document.quote,
        financialBinding: {
          financialDocumentId: document.financialDocumentId,
          revision: financialRevisionOf(item),
          financialLineId: clean(document?.lines?.[0]?.financialLineId),
          line: document?.lines?.[0] || null
        }
      };
    }).filter(Boolean);
    return durable.sort((left, right) => String(right?.audit?.updatedAt || "").localeCompare(String(left?.audit?.updatedAt || "")))[0] || null;
  }, [object, financialRecords]);
  const salesOrderSnapshot = useMemo(() => {
    if (object.salesOrder || object.salesOrderRecord)
      return object.salesOrder || object.salesOrderRecord;
    const records = financialRecords.length
      ? financialRecords
      : object?.assetFinancialTransactions || object?.relatedFinancialRecords || object?.financialRecords || [];
    const durable = records.map((item) => {
      const document = financialDocumentOf(item);
      if (document?.documentType !== "sales-order" || !document?.salesOrder) return null;
      return {
        ...document.salesOrder,
        financialBinding: {
          financialDocumentId: document.financialDocumentId,
          revision: financialRevisionOf(item),
          financialLineId: clean(document?.lines?.[0]?.financialLineId),
          line: document?.lines?.[0] || null,
        },
      };
    }).filter(Boolean);
    return durable.sort((left, right) =>
      String(right?.audit?.updatedAt || "").localeCompare(String(left?.audit?.updatedAt || ""))
    )[0] || null;
  }, [object, financialRecords]);
  const salesInvoiceSnapshot = useMemo(() => {
    if (object.salesInvoice || object.salesInvoiceRecord)
      return object.salesInvoice || object.salesInvoiceRecord;
    const records = financialRecords.length
      ? financialRecords
      : object?.assetFinancialTransactions || object?.relatedFinancialRecords || object?.financialRecords || [];
    const salesOrderId = clean(
      salesOrderSnapshot?.financialBinding?.financialDocumentId ||
        salesOrderSnapshot?.identity?.salesOrderId,
    );
    const durable = records.map((item) => {
      const document = financialDocumentOf(item);
      if (document?.documentType !== "invoice") return null;
      const metadata = document?.metadata || {};
      const belongsToEquipmentSale =
        clean(metadata.transactModule) === "equipment-sale" ||
        clean(metadata.invoiceType) === "asset-sale" ||
        (salesOrderId &&
          [document?.sourceFinancialDocumentId, metadata.salesOrderId]
            .map(clean)
            .includes(salesOrderId));
      if (!belongsToEquipmentSale) return null;
      return {
        ...document,
        financialBinding: {
          financialDocumentId: document.financialDocumentId,
          revision: financialRevisionOf(item),
          financialLineId: clean(document?.lines?.[0]?.financialLineId),
          line: document?.lines?.[0] || null,
        },
      };
    }).filter(Boolean);
    return durable.sort((left, right) =>
      String(right?.updatedAt || right?.occurredAt || "").localeCompare(
        String(left?.updatedAt || left?.occurredAt || ""),
      )
    )[0] || null;
  }, [object, financialRecords, salesOrderSnapshot]);
  const baseSalesFinancialRecords = useMemo(() => financialRecords.length
    ? financialRecords
    : object?.assetFinancialTransactions || object?.relatedFinancialRecords || object?.financialRecords || [], [financialRecords, object]);
  const salesFinancialRecords = useMemo(() => {
    const records = [...baseSalesFinancialRecords, ...salesLineageRecords];
    const seen = new Set();
    return records.filter(item => {
      const id = financialDocumentIdOf(item);
      if (!id || seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  }, [baseSalesFinancialRecords, salesLineageRecords]);
  useEffect(() => {
    attemptedSalesLineageIds.current.clear();
    setSalesLineageRecords([]);
  }, [context.primary.passportId]);
  useEffect(() => {
    if (!SALES_MODULE_IDS.has(moduleId)) return undefined;
    const existing = new Set(salesFinancialRecords.map(financialDocumentIdOf).filter(Boolean));
    const missing = [...new Set(salesFinancialRecords.flatMap(linkedSalesDocumentIds))]
      .filter(id => !existing.has(id) && !attemptedSalesLineageIds.current.has(id));
    if (!missing.length) return undefined;
    missing.forEach(id => attemptedSalesLineageIds.current.add(id));
    const controller = new AbortController();
    Promise.all(missing.map(financialDocumentId =>
      loadIXIAosFinancialDocument({ financialDocumentId, signal: controller.signal }).catch(() => null)
    )).then(records => {
      if (controller.signal.aborted) return;
      const loaded = records.filter(Boolean);
      if (loaded.length) setSalesLineageRecords(current => [...current, ...loaded]);
    });
    return () => controller.abort();
  }, [moduleId, salesFinancialRecords]);
  const salesDeals = useMemo(() => buildIXISalesDealRegister(salesFinancialRecords), [salesFinancialRecords]);
  const moduleSalesDeals = useMemo(() => dealsForIXISalesModule(salesDeals, moduleId), [salesDeals, moduleId]);
  const selectedSalesDeal = useMemo(() => findIXISalesDeal(salesDeals, salesRoute || {}), [salesDeals, salesRoute]);
  const activeSalesStageId = salesRoute?.detail
    ? clean(salesRoute.stageId) || salesStageForIXIModule(moduleId)
    : salesStageForIXIModule(moduleId);
  const selectedQuoteSnapshot = selectedSalesDeal
    ? recordForIXISalesStage(selectedSalesDeal, "quote") ||
      (activeSalesStageId === "quote" ? quoteDraftForIXISalesDeal(selectedSalesDeal) : null)
    : null;
  const selectedSalesOrderSnapshot = selectedSalesDeal
    ? recordForIXISalesStage(selectedSalesDeal, "sales-order") ||
      (activeSalesStageId === "sales-order" ? salesOrderDraftForIXISalesDeal(selectedSalesDeal) : null)
    : null;
  const selectedSalesInvoiceSnapshot = selectedSalesDeal ? documentForIXISalesStage(selectedSalesDeal, "invoice") : null;
  const selectedSaleSnapshot = selectedSalesDeal ? recordForIXISalesStage(selectedSalesDeal, "sold") : null;
  const selectedSettlementSnapshot = selectedSalesDeal ? recordForIXISalesStage(selectedSalesDeal, "settlement") : null;
  const billRecords = useMemo(() => {
    const candidates = financialRecords.length
      ? financialRecords
      : object?.billFinancialRecords ||
        object?.payableFinancialRecords ||
        object?.assetFinancialTransactions ||
        object?.relatedFinancialRecords ||
        object?.financialRecords ||
        [];
    return candidates.map(hydrateIXIBillRecord).filter(Boolean);
  }, [object, financialRecords]);
  const purchaseOrderSnapshot = useMemo(() => {
    const candidates = financialRecords.length
      ? financialRecords
      : object?.purchaseOrderFinancialRecords ||
        object?.assetFinancialTransactions ||
        object?.relatedFinancialRecords ||
        object?.financialRecords ||
        [];
    const records = candidates.map(hydrateIXIPurchaseOrderRecord).filter(Boolean);
    return records.sort((left, right) =>
      String(right?.updatedAt || "").localeCompare(String(left?.updatedAt || ""))
    )[0] || null;
  }, [object, financialRecords]);

  useEffect(() => {
    setModuleId(clean(initialModuleId));
  }, [initialModuleId]);
  useEffect(() => {
    const documentId = clean(selectedFinancialDocumentId);
    if (documentId && SALES_MODULE_IDS.has(clean(initialModuleId))) {
      setSalesRoute({ documentId, dealId: "", stageId: clean(initialModuleId), detail: true });
    } else if (!documentId && SALES_MODULE_IDS.has(clean(initialModuleId))) {
      setSalesRoute(null);
    }
  }, [initialModuleId, selectedFinancialDocumentId]);
  useEffect(() => {
    if (activeWorkOrder) setWorkOrderSnapshot(activeWorkOrder);
    else if (moduleId !== "work-order") setWorkOrderSnapshot(null);
  }, [activeWorkOrder, moduleId]);
  useEffect(() => {
    if (activeTechWorkOrder) setTechWorkOrderSnapshot(activeTechWorkOrder);
    else if (moduleId !== "technology-work") setTechWorkOrderSnapshot(null);
  }, [activeTechWorkOrder, moduleId]);
  useEffect(() => {
    setCollectionCases(collectionCasesFromFinancial);
  }, [collectionCasesFromFinancial]);
  useEffect(() => {
    setSettlementSnapshot(settlementFromFinancial);
  }, [settlementFromFinancial]);
  useEffect(() => {
    setSaleSnapshot(saleFromFinancial);
  }, [saleFromFinancial]);
  const active = modules.find((item) => item.id === moduleId) || null;
  const shellReturnLabel = worksheetOpen
    ? "CARD"
    : acquisitionWorkflowIntent && ["freight", "work-order"].includes(moduleId)
      ? "ACQUISITION"
      : returnToClose
        ? "RECORDS"
        : "APPS";
  const shellReturnTitle = worksheetOpen
    ? "RETURN TO CARD"
    : acquisitionWorkflowIntent && ["freight", "work-order"].includes(moduleId)
      ? "RETURN TO ACQUISITION"
      : returnToClose
        ? "RETURN TO RECORDS"
        : "RETURN TO TRAN$ACT APPS";
  const back = () => {
    if (worksheetOpen) {
      closeWorksheet();
      return;
    }
    if (returnToClose) {
      onClose?.();
      return;
    }
    if (SALES_MODULE_IDS.has(moduleId) && salesRoute?.detail) {
      setSalesRoute(null);
      return;
    }
    if (acquisitionWorkflowIntent && ["freight", "work-order"].includes(moduleId)) {
      setAcquisitionWorkflowIntent(null);
      setModuleId("asset-acquisition");
      return;
    }
    setModuleId("");
  };

  function selectLocale(nextLocale) {
    if (!Object.values(IXI_TRANSACT_LOCALES).includes(nextLocale)) return;
    setLocale(nextLocale);
    try {
      globalThis.localStorage?.setItem(
        IXI_TRANSACT_LOCALE_STORAGE_KEY,
        nextLocale,
      );
    } catch {
      // The active session still changes language when storage is unavailable.
    }
  }

  function openWorksheet() {
    const dialog = dialogRef.current;
    if (!dialog || worksheetOpen) return;
    const nativeWorksheetSelector = {
      quote: ".qt-card-actions .secondary",
      "sales-order": ".es-card-actions button:first-child",
      invoice: ".es-card-actions button:first-child",
    }[moduleId];
    const nativeWorksheetButton = nativeWorksheetSelector
      ? dialog.querySelector(nativeWorksheetSelector)
      : null;
    if (nativeWorksheetButton) {
      nativeWorksheetButton.click();
      return;
    }
    dialog.close?.();
    dialog.showModal?.();
    setWorksheetOpen(true);
  }

  function closeWorksheet() {
    const dialog = dialogRef.current;
    if (!dialog || !worksheetOpen) return;
    dialog.close?.();
    dialog.show?.();
    setWorksheetOpen(false);
  }

  async function open(item) {
    if (SALES_MODULE_IDS.has(item.id)) {
      setSalesRoute({
        documentId: "",
        dealId: "",
        stageId: salesStageForIXIModule(item.id),
        detail: false,
      });
    }
    setModuleId(item.id);
    await onOpenModule?.(item, context, {});
  }

  function openSalesStage(stage, entry, deal) {
    setSalesRoute({ dealId: deal.dealId, documentId: entry.documentId, stageId: stage.id, detail: true });
    setModuleId(stage.moduleId);
  }

  function startSalesStage(stage, deal) {
    const winningDeal = salesDeals.find(candidate => candidate.stageRecords?.sold && candidate.dealId !== deal.dealId);
    if (stage.id === "sold" && winningDeal) {
      globalThis.alert?.(`This Passport is already SOLD to ${winningDeal.customer}. Reverse or correct that controlled sale before recording another winner.`);
      return;
    }
    setSalesRoute({ dealId: deal.dealId, documentId: "", stageId: stage.id, detail: true, create: true });
    setModuleId(stage.moduleId);
  }

  function startSalesDeal() {
    const dealId = createIXISalesDealId();
    setSalesRoute({ dealId, documentId: "", stageId: "quote", detail: true, create: true });
    setModuleId("quote");
  }

  function startDirectInvoice() {
    const dealId = createIXISalesDealId();
    setSalesRoute({ dealId, documentId: "", stageId: "invoice", detail: true, create: true, directEntry: true });
    setModuleId("invoice");
  }

  async function closeSalesDeal(deal) {
    if (!globalThis.confirm?.(`Mark the ${deal.customer} deal as lost? The machine and other customer deals stay active.`)) return;
    try {
      await closeIXISalesDeal(deal);
      await onFinancialRecordsChange?.();
      setSalesRoute(null);
    } catch (error) {
      globalThis.alert?.(clean(error?.message) || "The deal could not be closed. No record was changed.");
    }
  }
  async function change(
    id,
    label,
    group,
    documentType,
    key,
    record,
    changePayload = {},
    sourceContext = context,
    extra = {},
  ) {
    await onOpenModule?.(
      {
        id: `${id}-${changePayload.action || "change"}`,
        label,
        group,
        documentType,
      },
      sourceContext,
      {
        [key]: record,
        change: changePayload,
        originatingObject: sourceContext.primary,
        returnTo: id,
        ...extra,
      },
    );
  }

  async function persistTechWorkOrder(
    record,
    changePayload = {},
    sourceContext = context,
  ) {
    const financialDocumentId = clean(
      record?.financialBinding?.financialDocumentId ||
        record?.identity?.techWorkOrderId,
    );
    if (!financialDocumentId)
      throw new Error("TECH WORK ORDER IS NOT BOUND TO IXI FINANCIAL");
    const action = clean(changePayload?.action || "update");
    const requestId =
      globalThis.crypto?.randomUUID?.() ||
      `techwo-update-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const result = await patchIXIAosFinancialDocument({
      financialDocumentId,
      expectedRevision: record?.financialBinding?.revision,
      commandId: requestId,
      idempotencyKey: requestId,
      patch: {
        techWorkOrder: record,
        financialState: ["complete", "close"].includes(action) ? "closed" : "incurred",
        ...(action === "complete"
          ? {
              completedAt:
                record?.dates?.completedAt || new Date().toISOString(),
            }
          : {}),
      },
      metadata: { transactModule: "tech-work-order", action },
    });
    const serverRecord = result?.data?.record || result?.record || {};
    const stored = serverRecord?.financialDocument?.techWorkOrder || record;
    const canonical = {
      ...stored,
      financialBinding: {
        financialDocumentId,
        revision: Number(
          serverRecord?.server?.revision ||
            record?.financialBinding?.revision ||
            0,
        ),
      },
    };
    setTechWorkOrderSnapshot(canonical);
    await onFinancialRecordsChange?.();
    await onOpenModule?.(
      {
        id: `tech-work-order-${action}`,
        label: "TECH WORK ORDER UPDATE",
        group: "work",
        documentType: "work-order",
      },
      sourceContext,
      {
        techWorkOrder: canonical,
        change: changePayload,
        originatingObject: sourceContext.primary,
        returnTo: "technology-work",
      },
    );
    return canonical;
  }

  let body = null;
  if (moduleId === "bill")
    body = (
      <IXIBillStandaloneApp
        context={context}
        object={object}
        initialRecords={billRecords}
        authority={
          actor?.billAuthority ||
          actor?.financialAuthority ||
          actor?.purchasingAuthority ||
          {}
        }
        onBack={back}
        onRecordChange={async (record, changePayload) => {
          await onFinancialRecordsChange?.();
          await change(
            "bill",
            "BILL / INVOICE UPDATE",
            "spend",
            "bill",
            "billRecord",
            record,
            changePayload,
          );
        }}
      />
    );
  else if (moduleId === "expense")
    body = (
      <IXIExpenseApp
        context={context}
        object={object}
        workOrder={workOrderSnapshot}
        initialRecord={expenseSnapshot}
        selectedFinancialDocumentId={selectedFinancialDocumentId}
        expensePolicy={entity?.expensePolicy || entity?.accountingPolicy?.expense || object?.expensePolicy || object?.fields?.expensePolicy || null}
        onCancel={back}
        onSave={async (record, input, response) => {
          await onOpenModule?.(
            {
              id: "expense-save",
              label: "SAVE EXPENSE",
              group: "spend",
              documentType: "expense",
            },
            context,
            { expense: record, input, response },
          );
          await onFinancialRecordsChange?.(); back();
        }}
      />
    );
  else if (moduleId === "purchase-order")
    body = (
      <IXIPurchaseOrderApp
        context={context}
        initialPurchaseOrder={purchaseOrderSnapshot}
        onBack={back}
        onRecordChange={(record, changePayload) =>
          change(
            "purchase-order",
            "PURCHASE ORDER UPDATE",
            "buy",
            "purchase-order",
            "purchaseOrderRecord",
            record,
            changePayload,
          )
        }
      />
    );
  else if (moduleId === "time")
    body = (
      <IXITimeStandaloneApp
        context={context}
        object={object}
        financialRecords={financialRecords}
        onBack={back}
        onRecordChange={async (record, changePayload, sourceContext) => {
          await onFinancialRecordsChange?.();
          await change(
            "time",
            "TIME UPDATE",
            "work",
            "time-entry",
            "timeRecord",
            record,
            changePayload,
            sourceContext || context,
          );
        }}
      />
    );
  else if (moduleId === "material")
    body = (
      <IXIMaterialStandaloneApp
        context={context}
        object={object}
        financialRecords={financialRecords}
        onBack={back}
        onRecordChange={async (record, changePayload, sourceContext) => {
          await onFinancialRecordsChange?.();
          await change(
            "material",
            "PART / MATERIAL UPDATE",
            "work",
            "material-usage",
            "materialRecord",
            record,
            changePayload,
            sourceContext || context,
          );
        }}
      />
    );
  else if (moduleId === "asset-acquisition")
    body = (
      <IXIAssetAcquisitionApp
        context={context}
        object={object}
        initialRecord={acquisitionSnapshot}
        onBack={back}
        onRecordChange={async (record, changePayload, sourceContext) => {
          await onFinancialRecordsChange?.();
          await change(
            "asset-acquisition",
            "ASSET ACQUISITION UPDATE",
            "asset",
            "asset-acquisition",
            "assetAcquisition",
            record,
            changePayload,
            sourceContext || context,
          );
        }}
      />
    );
  else if (moduleId === "freight")
    body = (
      <IXIFreightApp
        context={context}
        object={object}
        onBack={back}
        onFinancialRecordsChange={onFinancialRecordsChange}
        onRecordChange={async (record, changePayload) => {
          await change(
            "freight",
            "FREIGHT UPDATE",
            "move",
            "freight",
            "freightOrder",
            record,
            changePayload,
            context,
          );
        }}
      />
    );
  else if (moduleId === "rental-expense")
    body = (
      <IXIRentalExpenseApp
        context={context}
        object={object}
        initialRecord={rentalExpenseSnapshot}
        relatedTransactions={
          financialRecords.length
            ? financialRecords
            : object?.rentalFinancialTransactions ||
              object?.relatedFinancialRecords ||
              object?.financialRecords ||
              []
        }
        onBack={back}
        onRecordChange={async (record, changePayload, sourceContext) => {
          await onFinancialRecordsChange?.();
          await change(
            "rental-expense",
            "RENTAL EXPENSE UPDATE",
            "rent",
            "rental-expense",
            "rentalExpense",
            record,
            changePayload,
            sourceContext || context,
          );
        }}
      />
    );
  else if (moduleId === "rental-income")
    body = (
      <IXIRentalIncomeApp
        context={context}
        object={object}
        initialRecord={rentalIncomeSnapshot}
        relatedTransactions={
          financialRecords.length
            ? financialRecords
            : object?.rentalIncomeTransactions ||
              object?.relatedFinancialRecords ||
              object?.financialRecords ||
              []
        }
        onBack={back}
        onRecordChange={async (record, changePayload, sourceContext) => {
          await onFinancialRecordsChange?.();
          await change(
            "rental-income",
            "RENTAL INCOME UPDATE",
            "rent",
            "rental-income",
            "rentalIncome",
            record,
            changePayload,
            sourceContext || context,
          );
        }}
      />
    );
  else if (moduleId === "service-quote")
    body = (
      <IXIServiceQuoteApp
        context={context}
        object={object}
        initialRecord={serviceQuoteSnapshot}
        onBack={back}
        onRecordChange={async (record, changePayload, sourceContext) => {
          await onFinancialRecordsChange?.();
          await change(
            "service-quote",
            "SERVICE QUOTE UPDATE",
            "sell",
            "service-quote",
            "serviceQuote",
            record,
            changePayload,
            sourceContext || context,
            {
              customer: record?.customer || null,
              asset: record?.asset || null,
              economics: record?.economics || null,
              acceptance: record?.acceptance || null,
            },
          );
        }}
        onCreateServiceWorkOrder={async (quote) => {
          const workOrder = await createIXICustomerServiceWorkOrder({
            quote,
            context,
            object,
            actor: context.actor,
          });
          setWorkOrderSnapshot(workOrder);
          await onFinancialRecordsChange?.();
          return workOrder;
        }}
        onOpenServiceWorkOrder={async (workOrder, quote) => {
          await onOpenModule?.(
            {
              id: "customer-service-work-order-create",
              label: "CREATE CUSTOMER SERVICE WORK ORDER",
              group: "work",
              documentType: "work-order",
            },
            context,
            {
              customerServiceWorkOrder: workOrder,
              workOrder,
              serviceQuote: quote,
              commercial: workOrder.commercial,
              returnTo: "work-order",
            },
          );
          setModuleId("work-order");
        }}
      />
    );
  else if (SALES_MODULE_IDS.has(moduleId) && !salesRoute?.detail)
    body = (
      <IXISalesDealRegister
        deals={moduleSalesDeals}
        moduleLabel={active?.label || "SALES"}
        primaryStageId={moduleId}
        allowDirectInvoice={moduleId === "invoice"}
        onBack={() => setModuleId("")}
        onNewDeal={startSalesDeal}
        onNewDirectInvoice={startDirectInvoice}
        onOpenDeal={openSalesStage}
        onOpenStage={openSalesStage}
        onStartStage={startSalesStage}
        onCloseDeal={closeSalesDeal}
      />
    );
  else if (moduleId === "quote")
    body = (
      <div className="ixi-sales-detail">
      {selectedSalesDeal ? <IXISalesStageRail deal={selectedSalesDeal} activeStageId={activeSalesStageId} onOpenStage={openSalesStage} onStartStage={startSalesStage} /> : null}
      <IXIQuoteApp
        key={`quote:${salesRoute?.dealId || selectedSalesDeal?.dealId || "new"}:${salesRoute?.documentId || ""}`}
        context={context}
        object={object}
        dealId={salesRoute?.dealId || selectedSalesDeal?.dealId || ""}
        initialRecord={selectedQuoteSnapshot}
        onBack={back}
        onAdvance={(quote) => {
          setSalesRoute({ dealId: quote?.identity?.dealId || selectedSalesDeal?.dealId, documentId: "", stageId: "sales-order", detail: true, create: true });
          setModuleId("sales-order");
        }}
        onRecordChange={async (record, changePayload, sourceContext) => {
          await onFinancialRecordsChange?.();
          await change(
            "quote",
            "QUOTE UPDATE",
            "sell",
            "quote",
            "quote",
            record,
            changePayload,
            sourceContext || context,
            { customer: record?.customer || null, asset: record?.asset || null, totals: record?.totals || null }
          );
        }}
      />
      </div>
    );
  else if (moduleId === "sales-order" || moduleId === "invoice")
    body = (
      <IXIEquipmentSaleApp
        key={`${activeSalesStageId}:${salesRoute?.dealId || selectedSalesDeal?.dealId || "new"}:${salesRoute?.documentId || ""}`}
        context={context}
        object={object}
        deal={selectedSalesDeal}
        dealId={salesRoute?.dealId || selectedSalesDeal?.dealId || ""}
        quote={selectedQuoteSnapshot}
        initialRecord={selectedSalesOrderSnapshot}
        invoice={selectedSalesInvoiceSnapshot}
        activeStageId={activeSalesStageId}
        initialTab={activeSalesStageId === "invoice" ? "invoice" : "order"}
        entryMode={activeSalesStageId === "invoice" ? "invoice" : "sales-order"}
        onOpenStage={openSalesStage}
        onStartStage={startSalesStage}
        onOpenInvoice={() => {
          const entry = selectedSalesDeal?.stageRecords?.invoice;
          setSalesRoute(current => ({ ...(current || {}), dealId: selectedSalesDeal?.dealId || current?.dealId, documentId: entry?.documentId || "", stageId: "invoice", detail: true }));
          setModuleId("invoice");
        }}
        onBack={back}
        onRecordChange={async (record, changePayload, sourceContext) => {
          await onFinancialRecordsChange?.();
          await change(
            moduleId,
            moduleId === "invoice" ? "INVOICE UPDATE" : "SALES ORDER UPDATE",
            "sell",
            moduleId === "invoice" ? "invoice" : "sales-order",
            "salesOrder",
            record,
            changePayload,
            sourceContext || context,
            {
              invoice: changePayload?.invoice || selectedSalesInvoiceSnapshot,
              quote: selectedQuoteSnapshot,
            },
          );
        }}
      />
    );
  else if (moduleId === "service-invoice")
    body = (
      <IXIServiceInvoiceApp
        context={context}
        object={object}
        workOrder={workOrderSnapshot || activeWorkOrder}
        onBack={back}
        onRecordChange={(record, changePayload, sourceContext) =>
          change(
            "service-invoice",
            "SERVICE INVOICE UPDATE",
            "sell",
            "invoice",
            "serviceInvoice",
            record,
            changePayload,
            sourceContext || context,
            {
              customerServiceWorkOrder: workOrderSnapshot || activeWorkOrder,
              customer: record?.customer || null,
              ar: record?.ar || null,
            },
          )
        }
      />
    );
  else if (moduleId === "sold")
    body = (
      <div className="ixi-sales-detail">
      {selectedSalesDeal ? <IXISalesStageRail deal={selectedSalesDeal} activeStageId={activeSalesStageId} onOpenStage={openSalesStage} onStartStage={startSalesStage} /> : null}
      <IXIAssetSaleApp
        key={`sold:${salesRoute?.dealId || selectedSalesDeal?.dealId || "new"}:${salesRoute?.documentId || ""}`}
        context={context}
        object={object}
        dealId={salesRoute?.dealId || selectedSalesDeal?.dealId || ""}
        sourceInvoice={selectedSalesInvoiceSnapshot}
        initialRecord={selectedSaleSnapshot}
        onBack={back}
        onRecordChange={async (record, changePayload, sourceContext) => {
          setSaleSnapshot(record);
          await change(
            "sold",
            "SOLD UPDATE",
            "sell",
            changePayload?.action === "record-buyer-payment"
              ? "payment"
              : "invoice",
            "assetSale",
            record,
            changePayload,
            sourceContext || context,
            {
              passportState: record?.passportState || null,
              collection: record?.collection || null,
            },
          );
        }}
      />
      </div>
    );
  else if (moduleId === "collections")
    body = (
      <IXICollectionsApp
        context={context}
        object={object}
        financialRecords={
          financialRecords.length ? financialRecords :
          object?.receivableFinancialRecords ||
          object?.assetFinancialTransactions ||
          object?.relatedFinancialRecords ||
          object?.financialRecords ||
          []
        }
        initialCases={collectionCases}
        onBack={back}
        onRecordChange={async (record, changePayload, sourceContext) => {
          if (record?.receivable?.invoiceId)
            setCollectionCases((current) => [
              ...current.filter(
                (item) =>
                  item.receivable?.invoiceId !== record.receivable.invoiceId,
              ),
              record,
            ]);
          await change(
            "collections",
            "COLLECTIONS UPDATE",
            "collect",
            changePayload?.action === "record-payment"
              ? "payment"
              : changePayload?.action === "credit" ||
                  changePayload?.action === "write-off"
                ? "credit"
                : "collection",
            "collectionCase",
            record,
            changePayload,
            sourceContext || context,
            {
              receivable:
                changePayload?.receivable || record?.receivable || null,
              financialRecord: changePayload?.financialRecord || null,
            },
          );
        }}
      />
    );
  else if (moduleId === "payables")
    body = (
      <IXIPayablesApp
        context={context}
        object={object}
        financialRecords={
          financialRecords.length
            ? financialRecords
            : object?.payableFinancialRecords ||
              object?.assetFinancialTransactions ||
              object?.relatedFinancialRecords ||
              object?.financialRecords ||
              []
        }
        initialCases={payableCases}
        onBack={back}
        onFinancialRecordsChange={onFinancialRecordsChange}
        onRecordChange={async (record, changePayload, sourceContext) => {
          if (record?.payable?.billId)
            setPayableCases((current) => [
              ...current.filter(
                (item) => item.payable?.billId !== record.payable.billId,
              ),
              record,
            ]);
          await change(
            "payables",
            "PAYABLES UPDATE",
            "pay",
            changePayload?.action === "payment"
              ? "payment"
              : changePayload?.action === "credit"
                ? "credit"
                : "payables-control",
            "payableCase",
            record,
            changePayload,
            sourceContext || context,
            {
              payable: record?.payable || null,
              financialResponse: changePayload?.financialResponse || null,
            },
          );
        }}
      />
    );
  else if (moduleId === "treasury")
    body = (
      <IXITreasuryApp
        context={context}
        object={object}
        financialRecords={
          financialRecords.length
            ? financialRecords
            : object?.treasuryFinancialRecords ||
              object?.assetFinancialTransactions ||
              object?.relatedFinancialRecords ||
              object?.financialRecords ||
              []
        }
        initialAccounts={treasuryAccounts}
        initialReconciliations={treasuryReconciliations}
        expectedInflows={object?.treasuryExpectedInflows || []}
        scheduledOutflows={object?.treasuryScheduledOutflows || []}
        onBack={back}
        onFinancialRecordsChange={onFinancialRecordsChange}
        onRecordChange={async (record, changePayload, sourceContext) => {
          if (record?.identity?.accountId)
            setTreasuryAccounts((current) => [
              ...current.filter(
                (item) =>
                  item.identity?.accountId !== record.identity.accountId,
              ),
              record,
            ]);
          if (changePayload?.reconciliation?.identity?.reconciliationId)
            setTreasuryReconciliations((current) => [
              ...current,
              changePayload.reconciliation,
            ]);
          await change(
            "treasury",
            "CASH / TREASURY UPDATE",
            "cash",
            changePayload?.action === "reconciliation"
              ? "treasury-reconciliation"
              : changePayload?.action === "create-account"
                ? "treasury-account"
                : "payment",
            "treasuryAccount",
            record,
            changePayload,
            sourceContext || context,
            {
              reconciliation: changePayload?.reconciliation || null,
              financialResponse: changePayload?.financialResponse || null,
              adjustment: changePayload?.adjustment || null,
              transfer: changePayload?.transfer || null,
            },
          );
        }}
      />
    );
  else if (moduleId === "general-ledger")
    body = (
      <IXIGeneralLedgerApp
        context={context}
        object={object}
        financialRecords={
          object?.glFinancialRecords ||
          object?.assetFinancialTransactions ||
          object?.relatedFinancialRecords ||
          object?.financialRecords ||
          []
        }
        initialJournals={object?.generalLedgerJournals || []}
        initialRules={object?.generalLedgerRules || []}
        initialChart={object?.generalLedgerChart || null}
        initialPeriod={object?.generalLedgerPeriod || null}
        arSubledger={Number(
          object?.financialControl?.ar ?? object?.arSubledgerBalance ?? 0,
        )}
        apSubledger={Number(
          object?.financialControl?.ap ?? object?.apSubledgerBalance ?? 0,
        )}
        treasuryCash={Number(
          object?.financialControl?.cash ?? object?.treasuryCash ?? 0,
        )}
        bankReconciliations={treasuryReconciliations}
        onBack={back}
        onRecordChange={async (record, changePayload, sourceContext) => {
          const documentType =
            changePayload?.action === "period-closed"
              ? "period-close"
              : changePayload?.action === "posting-rule-added"
                ? "posting-rule"
                : "journal-entry";
          await change(
            "general-ledger",
            "GENERAL LEDGER UPDATE",
            "account",
            documentType,
            "generalLedgerRecord",
            record,
            changePayload,
            sourceContext || context,
            {
              financialResponse: changePayload?.financialResponse || null,
              review: changePayload?.review || null,
              reversal: changePayload?.reversal || null,
            },
          );
        }}
      />
    );
  else if (moduleId === "financial-reporting")
    body = (
      <IXIFinancialReportingApp
        context={context}
        object={object}
        journals={object?.generalLedgerJournals || object?.glJournals || []}
        chart={object?.generalLedgerChart || null}
        periods={
          object?.accountingPeriods ||
          (object?.generalLedgerPeriod ? [object.generalLedgerPeriod] : [])
        }
        onBack={back}
      />
    );
  else if (moduleId === "settlement")
    body = (
      <div className="ixi-sales-detail">
      {selectedSalesDeal ? <IXISalesStageRail deal={selectedSalesDeal} activeStageId={activeSalesStageId} onOpenStage={openSalesStage} onStartStage={startSalesStage} /> : null}
      <IXISettlementApp
        key={`settlement:${salesRoute?.dealId || selectedSalesDeal?.dealId || "new"}:${salesRoute?.documentId || ""}`}
        context={context}
        object={object}
        dealId={salesRoute?.dealId || selectedSalesDeal?.dealId || ""}
        sale={selectedSaleSnapshot || null}
        acquisition={
          object.assetAcquisition || object.acquisitionRecord || null
        }
        financialRecords={
          financialRecords.length ? financialRecords :
          object?.assetFinancialTransactions ||
          object?.relatedFinancialRecords ||
          object?.financialRecords ||
          []
        }
        initialRecord={selectedSettlementSnapshot}
        onBack={back}
        onRecordChange={async (record, changePayload, sourceContext) => {
          setSettlementSnapshot(record);
          await change(
            "settlement",
            "SETTLEMENT UPDATE",
            "settle",
            changePayload?.action === "owner-payment"
              ? "payment"
              : "settlement",
            "assetSettlement",
            record,
            changePayload,
            sourceContext || context,
            {
              sale: saleSnapshot,
              waterfall: record?.waterfall || null,
              paymentStatus: record?.paymentStatus || null,
            },
          );
        }}
      />
      </div>
    );
  else if (moduleId === "work-order")
    body = (
      <IXIWorkOrderApp
        context={context}
        initialWorkOrder={workOrderSnapshot || activeWorkOrder}
        financialRecords={financialRecords}
        onBack={back}
        onCreate={async (record, sourceContext) => {
          setWorkOrderSnapshot(record);
          await onOpenModule?.(
            {
              id: "work-order-create",
              label: "CREATE WORK ORDER",
              group: "work",
              documentType: "work-order",
            },
            sourceContext,
            { workOrder: record },
          );
          await onFinancialRecordsChange?.();
        }}
        onAction={async (id, workOrder, sourceContext, payload = {}) => {
          let nextWorkOrder = workOrder;
          if (id === "complete")
            nextWorkOrder = {
              ...(workOrder || {}),
              work: { ...(workOrder?.work || {}), status: "complete" },
              financial: {
                ...(workOrder?.financial || {}),
                status: "complete",
              },
            };
          const financialDocumentId = clean(
            nextWorkOrder?.financialBinding?.financialDocumentId ||
              nextWorkOrder?.identity?.workOrderId,
          );
          if (!financialDocumentId)
            throw new Error("WORK ORDER IS NOT BOUND TO IXI FINANCIAL");
          const requestId =
            globalThis.crypto?.randomUUID?.() ||
            `wo-update-${Date.now()}-${Math.random().toString(16).slice(2)}`;
          const result = await patchIXIAosFinancialDocument({
            financialDocumentId,
            expectedRevision: nextWorkOrder?.financialBinding?.revision,
            commandId: requestId,
            idempotencyKey: requestId,
            patch: {
              workOrder: nextWorkOrder,
              financialState: id === "complete" ? "closed" : "incurred",
              ...(id === "work-date-amend" && nextWorkOrder?.dates?.performedOn
                ? { occurredAt: `${nextWorkOrder.dates.performedOn}T12:00:00.000Z` }
                : {}),
              ...(id === "complete"
                ? { completedAt: new Date().toISOString() }
                : {}),
            },
            metadata: { transactModule: "work-order", action: id },
          });
          const revision = Number(
            result?.data?.record?.server?.revision ||
              result?.record?.server?.revision ||
              nextWorkOrder?.financialBinding?.revision ||
              0,
          );
          nextWorkOrder = {
            ...nextWorkOrder,
            financialBinding: { financialDocumentId, revision },
          };
          setWorkOrderSnapshot(nextWorkOrder);
          await onFinancialRecordsChange?.();
          await onOpenModule?.(
            {
              id,
              label: String(id).toUpperCase(),
              group: "work-order-action",
              documentType: id,
            },
            sourceContext,
            { workOrder: nextWorkOrder, ...payload },
          );
          // Service Invoice remains intentionally gated until the sales workflow
          // persists issue, payment, void, and canonical readback end to end.
          return nextWorkOrder;
        }}
      />
    );
  else if (moduleId === "technology-work")
    body = (
      <IXITechWorkOrderApp
        context={context}
        initialTechWorkOrder={techWorkOrderSnapshot || activeTechWorkOrder}
        financialRecords={financialRecords}
        onBack={back}
        onCreate={async (record, sourceContext, response) => {
          setTechWorkOrderSnapshot(record);
          await onOpenModule?.(
            {
              id: "tech-work-order-create",
              label: "CREATE TECH WORK ORDER",
              group: "work",
              documentType: "work-order",
            },
            sourceContext,
            { techWorkOrder: record, response },
          );
          await onFinancialRecordsChange?.();
        }}
        onRecordChange={persistTechWorkOrder}
      />
    );
  else if (moduleId === "access-policy")
    body = (
      <IXIAccessPolicyApp
        context={context}
        object={object}
        onBack={back}
        onRecordChange={(record, changePayload, sourceContext) =>
          change(
            "access-policy",
            "ACCESS / POLICY UPDATE",
            "security",
            "authority-policy",
            "authorityPolicy",
            record,
            changePayload,
            sourceContext || context,
          )
        }
      />
    );
  else if (active)
    body = (
      <div className="tx-module">
        <button className="tx-back" onClick={back}>
          ‹ TRAN$ACT
        </button>
        <div className="tx-module-title">
          <span>{active.group.toUpperCase()}</span>
          <strong>{active.label}</strong>
        </div>
        <div className="tx-module-placeholder">
          <b>{active.label}</b>
          <span>MODULE CHASSIS READY</span>
          <small>
            {active.documentType} · {context.primary.label}
          </small>
        </div>
      </div>
    );
  else
    body = (
      <>
        {context.activeWorkOrder ? (
          <button
            className="tx-open-work"
            onClick={() => {
              setWorkOrderSnapshot(context.activeWorkOrder);
              open({
                id: "work-order",
                label: "CONTINUE WORK",
                group: "work",
                documentType: "work-order",
              });
            }}
          >
            <span>OPEN WORK</span>
            <strong>
              {clean(
                context.activeWorkOrder.workOrderNumber ||
                  context.activeWorkOrder.number ||
                  context.activeWorkOrder.id,
              ) || "WORK ORDER"}
            </strong>
            <small>
              {clean(
                context.activeWorkOrder.title ||
                  context.activeWorkOrder.description,
              ) || "IN PROGRESS"}
            </small>
            <b>CONTINUE ›</b>
          </button>
        ) : null}
        <div className="tx-label">CREATE / OPEN</div>
        <IXITransactSortableLauncher
          modules={modules}
          moduleOrder={moduleOrder}
          onOpen={open}
          onOrderChange={onModuleOrderChange}
        />
      </>
    );

  const t = (message) => translateIXITransact(locale, message);

  return (
    <dialog
      ref={dialogRef}
      open
      className={`ixi-transact-dialog ${worksheetOpen ? "worksheet-open" : "card-open"}`}
      onCancel={(event) => {
        if (!worksheetOpen) return;
        event.preventDefault();
        closeWorksheet();
      }}
      aria-label={active?.label || "IXI TRAN$ACT"}
    >
      <IXITransactLocaleProvider locale={locale} onLocaleChange={selectLocale}>
        <div
          lang={locale}
          data-ixi-transact-locale={locale}
          data-ixi-transact-presentation={worksheetOpen ? "worksheet" : "card"}
          className={`ixi-transact-app ixi-transact-v13 board-color-none board-outline-1 ${active ? "module-open" : "home-open"}`}
        >
          <header className="tx-header">
            <div className="tx-brand">
              <span>{t("IXI TRAN$ACT")}</span>
              {!active ? (
                <>
                  <strong>{context.primary.label}</strong>
                  <small>{context.primary.objectType || "AOS OBJECT"}</small>
                </>
              ) : worksheetOpen ? (
                <strong className="tx-worksheet-title">
                  {active.label} · {t("WORKSHEET")}
                </strong>
              ) : null}
            </div>
            <div className="tx-header-actions">
              {active ? (
                <>
                  <button
                    type="button"
                    className="tx-shell-return"
                    onClick={back}
                    aria-label={t(shellReturnTitle)}
                    title={t(shellReturnTitle)}
                    data-ixi-transact-return={shellReturnLabel.toLowerCase()}
                  >
                    ‹ {t(shellReturnLabel)}
                  </button>
                  <button
                    type="button"
                    className="tx-expand"
                    onClick={worksheetOpen ? closeWorksheet : openWorksheet}
                    aria-label={
                      worksheetOpen
                        ? t("RETURN TO CARD")
                        : t("EXPAND WORKSHEET")
                    }
                    title={
                      worksheetOpen
                        ? t("RETURN TO CARD")
                        : t("EXPAND WORKSHEET")
                    }
                  >
                    {worksheetOpen ? "↙" : "↗"}
                  </button>
                </>
              ) : null}
              <button
                type="button"
                className="tx-close"
                onClick={worksheetOpen ? closeWorksheet : () => onClose?.()}
                aria-label={worksheetOpen ? t("RETURN TO CARD") : t("CLOSE")}
              >
                ×
              </button>
            </div>
          </header>
          <main
            className={`tx-body ${moduleId === "freight" ? "tx-body-edge-to-edge" : "tx-body-safe-area"}`}
            data-ixi-transact-module={moduleId || "home"}
          >
            {body}
          </main>
          {!worksheetOpen ? (
            <IXIMachineRail
              listing={object}
              saved={false}
              boardColor="none"
              boardOutline={1}
              machineFace={0}
              onSendFront={onSendFront}
              onSendBack={onSendBack}
              onCycleColor={onCycleColor}
              onCycleOutline={onCycleOutline}
              armedDestination={armedDestination}
              onSendToArmedDestination={onSendToArmedDestination}
            />
          ) : null}
          {!active ? <IXITransactHomeTypography /> : null}
          <IXITransactStyles />
          <IXISalesDealStyles />
        </div>
      </IXITransactLocaleProvider>
    </dialog>
  );
}
