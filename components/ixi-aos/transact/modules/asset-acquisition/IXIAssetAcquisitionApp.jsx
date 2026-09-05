import { useEffect, useMemo, useState } from "react";
import { createIXIAssetAcquisition, recordIXIAssetAcquisitionPackageNormalization, updateIXIAssetAcquisition } from "./IXIAssetAcquisitionCommands";
import { createIXIAssetAcquisitionDraft, hydrateIXIAssetAcquisitionRecord, validateIXIAssetAcquisition } from "./IXIAssetAcquisitionContract";
import { amendIXIAssetAcquisition, applyIXIAcquisitionActuals, addIXIOwnershipCapitalEvent, getIXIAcquisitionOperations, normalizeIXIPackageAllocation, putIXIAssetInService } from "./IXIAssetAcquisitionRecordEngine";
import IXIAssetAcquisitionStyles from "./IXIAssetAcquisitionStyles";
import { loadIXIFreightOrders } from "../freight/IXIFreightClient";

const clean = (v) => String(v ?? "").trim();
const money = (v) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(v || 0));
const today = () => new Date().toISOString().slice(0, 10);
const emptyPayment = () => ({
  date: today(),
  amount: "",
  method: "wire",
  payerLabel: "",
  reference: "",
  documentId: "",
  notes: "",
});
const emptyOwner = () => ({
  partyLabel: "",
  legalOwnershipPercent: "",
  settlementSharePercent: "",
  initialContribution: "",
  contributionDate: today(),
  contributionReference: "",
  settlementPriority: "pro-rata",
  notes: "",
});
const emptyAllocation = () => ({ passportId: "", label: "", amount: "" });
const startingValue = (object) => {
  const candidates = [object?.financial?.acquisitionValue, object?.lifecycle?.acquisitionCost, object?.acquisitionCost, object?.assetValue, object?.value];
  for (const candidate of candidates) {
    const value = Number(candidate);
    if (Number.isFinite(value) && value > 0) return String(value);
  }
  return "";
};

const COPY = {
  en: {
    title: "ASSET ACQUISITION",
    deal: "ACQUISITION",
    seller: "SELLER / ACQUIRED FROM",
    purchaseDate: "PURCHASE DATE",
    type: "ACQUISITION TYPE",
    source: "SOURCE",
    sourceRef: "SOURCE / AUCTION REF",
    invoice: "SELLER / AUCTION INVOICE #",
    invoiceDate: "INVOICE DATE",
    agreement: "BILL OF SALE / AGREEMENT #",
    price: "PURCHASE PRICE",
    premium: "BUYER PREMIUM / AUCTION FEE",
    tax: "NONRECOVERABLE SALES / USE TAX",
    titleFees: "TITLE / REGISTRATION FEES",
    broker: "BROKER / FINDER FEE",
    otherFees: "OTHER PURCHASE-DOCUMENT CHARGES",
    direct: "INITIAL ACQUISITION BASIS",
    owners: "OWNERSHIP / PARTNERS",
    addOwner: "+ ADD OWNER / PARTNER",
    legal: "LEGAL OWNERSHIP %",
    settle: "SETTLEMENT SHARE %",
    capital: "INITIAL CAPITAL",
    funding: "PAYMENTS / FUNDING",
    addPayment: "+ ADD PAYMENT / WIRE",
    paymentDate: "WIRE / PAYMENT DATE",
    amount: "AMOUNT",
    method: "METHOD",
    payer: "PAID BY",
    reference: "REFERENCE",
    titleLien: "TITLE / LIEN",
    titleRequired: "TITLE REQUIRED",
    titleStatus: "TITLE STATUS",
    lien: "LIEN STATUS",
    clearTitle: "SELLER REPRESENTS CLEAR TITLE",
    condition: "CONDITION AT ACQUISITION",
    hours: "HOURS AT ACQUISITION",
    issues: "KNOWN ISSUES",
    logistics: "LOGISTICS",
    purchaseLocation: "PURCHASE LOCATION",
    deliver: "DELIVER TO",
    freightResp: "FREIGHT RESPONSIBILITY",
    pickup: "PICKUP DATE",
    expected: "EXPECTED DELIVERY",
    documents: "DOCUMENTS / EVIDENCE",
    settlement: "SETTLEMENT TERMS",
    returnCapital: "RETURN CAPITAL BEFORE PROFIT DISTRIBUTION",
    notes: "NOTES",
    save: "RECORD ACQUISITION",
    saveSub: "Create authoritative purchase intake record",
    ownershipErr: "Ownership and settlement shares must each total 100%.",
    record: "ACQUISITION RECORD",
    actuals: "MAKE-READY ACTUALS",
    inService: "ACQUISITION / MAKE-READY",
    putService: "PUT ASSET IN SERVICE",
    serviceDate: "IN SERVICE DATE",
    complete: "ACQUISITION COMPLETE",
    completeSub: "Acquisition / Make-Ready closed as of this date.",
    correctService: "CORRECT IN-SERVICE DATE",
    readyCost: "ACTUAL READY COST",
    routingNote: "Costs after this date route to normal Asset Economics. Source TRAN$ACT records are not changed.",
    ownershipHistory: "OWNERSHIP & CAPITAL HISTORY",
    addEvent: "+ OWNERSHIP / CAPITAL CHANGE",
    eventType: "CHANGE TYPE",
    eventParty: "PARTY",
    eventAmount: "MONEY IN / OUT",
    eventPct: "OWNERSHIP % CHANGE",
    eventSettle: "SETTLEMENT % CHANGE",
    eventRef: "REFERENCE",
    saveEvent: "SAVE CHANGE",
    back: "‹ TRAN$ACT",
  },
  es: {
    title: "ADQUISICIÓN DE ACTIVO",
    deal: "ADQUISICIÓN",
    seller: "VENDEDOR / ADQUIRIDO DE",
    purchaseDate: "FECHA DE COMPRA",
    type: "TIPO DE ADQUISICIÓN",
    source: "FUENTE",
    sourceRef: "REFERENCIA / SUBASTA",
    invoice: "FACTURA DEL VENDEDOR / SUBASTA #",
    invoiceDate: "FECHA DE FACTURA",
    agreement: "CONTRATO DE COMPRAVENTA #",
    price: "PRECIO DE COMPRA",
    premium: "PRIMA / CARGO DE SUBASTA",
    tax: "IMPUESTO DE VENTA / USO NO RECUPERABLE",
    titleFees: "CARGOS DE TÍTULO / REGISTRO",
    broker: "CARGO DE CORREDOR",
    otherFees: "OTROS CARGOS DEL DOCUMENTO DE COMPRA",
    direct: "BASE INICIAL DE ADQUISICIÓN",
    owners: "PROPIEDAD / SOCIOS",
    addOwner: "+ AGREGAR SOCIO",
    legal: "PROPIEDAD LEGAL %",
    settle: "PARTICIPACIÓN DE LIQUIDACIÓN %",
    capital: "CAPITAL INICIAL",
    funding: "PAGOS / FONDOS",
    addPayment: "+ AGREGAR PAGO / TRANSFERENCIA",
    paymentDate: "FECHA DE PAGO",
    amount: "MONTO",
    method: "MÉTODO",
    payer: "PAGADO POR",
    reference: "REFERENCIA",
    titleLien: "TÍTULO / GRAVAMEN",
    titleRequired: "REQUIERE TÍTULO",
    titleStatus: "ESTADO DEL TÍTULO",
    lien: "ESTADO DEL GRAVAMEN",
    clearTitle: "VENDEDOR DECLARA TÍTULO LIBRE",
    condition: "CONDICIÓN AL ADQUIRIR",
    hours: "HORAS AL ADQUIRIR",
    issues: "PROBLEMAS CONOCIDOS",
    logistics: "LOGÍSTICA",
    purchaseLocation: "UBICACIÓN DE COMPRA",
    deliver: "ENTREGAR A",
    freightResp: "RESPONSABLE DEL FLETE",
    pickup: "FECHA DE RECOGIDA",
    expected: "ENTREGA ESPERADA",
    documents: "DOCUMENTOS / EVIDENCIA",
    settlement: "TÉRMINOS DE LIQUIDACIÓN",
    returnCapital: "DEVOLVER CAPITAL ANTES DE DISTRIBUIR GANANCIAS",
    notes: "NOTAS",
    save: "REGISTRAR ADQUISICIÓN",
    saveSub: "Crear registro autoritativo de compra",
    ownershipErr: "Propiedad y participación de liquidación deben sumar 100%.",
    record: "REGISTRO DE ADQUISICIÓN",
    actuals: "COSTOS REALES DE PREPARACIÓN",
    inService: "ADQUISICIÓN / PREPARACIÓN",
    putService: "PONER ACTIVO EN SERVICIO",
    serviceDate: "FECHA EN SERVICIO",
    complete: "ADQUISICIÓN COMPLETA",
    completeSub: "Adquisición / preparación cerrada a partir de esta fecha.",
    correctService: "CORREGIR FECHA EN SERVICIO",
    readyCost: "COSTO REAL LISTO",
    routingNote: "Los costos posteriores a esta fecha pasan a la economía normal del activo. Los registros TRAN$ACT originales no cambian.",
    ownershipHistory: "HISTORIAL DE PROPIEDAD Y CAPITAL",
    addEvent: "+ CAMBIO DE PROPIEDAD / CAPITAL",
    eventType: "TIPO DE CAMBIO",
    eventParty: "PARTE",
    eventAmount: "DINERO ENTRANTE / SALIENTE",
    eventPct: "CAMBIO % PROPIEDAD",
    eventSettle: "CAMBIO % LIQUIDACIÓN",
    eventRef: "REFERENCIA",
    saveEvent: "GUARDAR CAMBIO",
    back: "‹ TRAN$ACT",
  },
};

const ES_TEXT = Object.freeze({
  "ASSET": "ACTIVO",
  "AOS ASSET": "ACTIVO AOS",
  "NO LOCATION": "SIN UBICACIÓN",
  "SELECT ASSET": "SELECCIONAR ACTIVO",
  "OWNERSHIP": "PROPIEDAD",
  "ALLOCATED": "ASIGNADO",
  "PAYMENT": "PAGO",
  "DUE": "PENDIENTE",
  "PAID / FUNDED": "PAGADO / FINANCIADO",
  "TITLE": "TÍTULO",
  "ACQUISITION": "ADQUISICIÓN",
  "COMPLETE": "COMPLETA",
  "MAKE-READY OPEN": "PREPARACIÓN ABIERTA",
  "PURCHASE PRICE": "PRECIO DE COMPRA",
  "BUYER PREMIUM / FEES": "PRIMA DEL COMPRADOR / CARGOS",
  "EST": "EST.",
  "VAR": "VAR.",
  "LANDED / MAKE-READY ACTUAL": "COSTO REAL ENTREGADO / PREPARADO",
  "SETTLEMENT": "LIQUIDACIÓN",
  "INITIAL CAPITAL": "CAPITAL INICIAL",
  "ORIGINAL OWNERSHIP ONLY. NO LATER CAPITAL OR OWNERSHIP CHANGES.": "SOLO PROPIEDAD ORIGINAL. SIN CAMBIOS POSTERIORES DE CAPITAL O PROPIEDAD.",
  "CAPITAL CONTRIBUTION": "APORTACIÓN DE CAPITAL",
  "REIMBURSEMENT": "REEMBOLSO",
  "DISTRIBUTION": "DISTRIBUCIÓN",
  "PARTNER BUYOUT": "COMPRA DE PARTICIPACIÓN",
  "OWNERSHIP TRANSFER": "TRANSFERENCIA DE PROPIEDAD",
  "OWNERSHIP ADJUSTMENT": "AJUSTE DE PROPIEDAD",
  "TRANSFER FROM EXISTING OWNER": "TRANSFERIR DE PROPIETARIO EXISTENTE",
  "SELECT OWNER": "SELECCIONAR PROPIETARIO",
  "SAVING...": "GUARDANDO...",
  "CLOSE ACQUISITION / MAKE-READY": "CERRAR ADQUISICIÓN / PREPARACIÓN",
  "SET THE REAL DATE THIS ASSET BECAME OPERATIONAL / SALE-READY / RENTAL-READY. THIS DATE CLOSES THE ACQUISITION / MAKE-READY CHAPTER.": "INDIQUE LA FECHA REAL EN QUE EL ACTIVO QUEDÓ OPERATIVO, LISTO PARA VENTA O LISTO PARA RENTA. ESTA FECHA CIERRA LA ETAPA DE ADQUISICIÓN / PREPARACIÓN.",
  "ACQ IS THE OPENING OWNERSHIP/CAPITAL CHAPTER. SOURCE TRANSACTIONS REMAIN CANONICAL AND SETTLEMENT CONSUMES THIS HISTORY LATER.": "ACQ ES LA ETAPA INICIAL DE PROPIEDAD Y CAPITAL. LAS TRANSACCIONES DE ORIGEN CONSERVAN SU AUTORIDAD Y LA LIQUIDACIÓN UTILIZA POSTERIORMENTE ESTE HISTORIAL.",
  "DIRECT PURCHASE": "COMPRA DIRECTA",
  "AUCTION": "SUBASTA",
  "TRADE-IN": "TOMA A CUENTA",
  "DEALER": "DISTRIBUIDOR",
  "PRIVATE SELLER": "VENDEDOR PARTICULAR",
  "ENTITY TRANSFER": "TRANSFERENCIA ENTRE ENTIDADES",
  "OTHER": "OTRO",
  "PAYMENT DUE DATE": "FECHA DE VENCIMIENTO",
  "PURCHASE ECONOMICS": "ECONOMÍA DE COMPRA",
  "OWNER / PARTNER": "PROPIETARIO / SOCIO",
  "CONTRIBUTION DATE": "FECHA DE APORTACIÓN",
  "CONTRIBUTION / WIRE REF": "REFERENCIA DE APORTACIÓN / TRANSFERENCIA",
  "REMOVE OWNER": "ELIMINAR PROPIETARIO",
  "LEGAL OWNERSHIP TOTAL": "TOTAL DE PROPIEDAD LEGAL",
  "SETTLEMENT SHARE TOTAL": "TOTAL DE PARTICIPACIÓN EN LIQUIDACIÓN",
  "WIRE": "TRANSFERENCIA",
  "CHECK": "CHEQUE",
  "CASH": "EFECTIVO",
  "FINANCING": "FINANCIAMIENTO",
  "REMOVE PAYMENT": "ELIMINAR PAGO",
  "AMOUNT PAID / FUNDED": "MONTO PAGADO / FINANCIADO",
  "BALANCE DUE": "SALDO PENDIENTE",
  "FUNDING HERE DOCUMENTS THE DEAL. BANK PAYMENTS AND VENDOR BILLS REMAIN SEPARATE TRAN$ACT RECORDS, SO THE OBLIGATION IS NEVER COUNTED TWICE.": "EL FINANCIAMIENTO AQUÍ DOCUMENTA LA OPERACIÓN. LOS PAGOS BANCARIOS Y LAS FACTURAS DEL PROVEEDOR CONSERVAN REGISTROS TRAN$ACT SEPARADOS PARA EVITAR DUPLICAR LA OBLIGACIÓN.",
  "FINANCED / LENDER INVOLVED": "FINANCIADO / PARTICIPA UN PRESTAMISTA",
  "LENDER": "PRESTAMISTA",
  "CATEGORY": "CATEGORÍA",
  "FREIGHT": "FLETE",
  "FREIGHT ACTUAL": "FLETE REAL",
  "FREIGHT / HAULING": "FLETE / TRANSPORTE",
  "INSPECTION": "INSPECCIÓN",
  "INITIAL REPAIRS": "REPARACIONES INICIALES",
  "INITIAL REPAIRS / MAKE-READY": "REPARACIONES INICIALES / PREPARACIÓN",
  "INITIAL PARTS": "REFACCIONES INICIALES",
  "TECHNOLOGY": "TECNOLOGÍA",
  "CLEANING / DETAIL": "LIMPIEZA / DETALLADO",
  "ESTIMATED": "ESTIMADO",
  "LABEL": "ETIQUETA",
  "YES": "SÍ",
  "NO": "NO",
  "PENDING": "PENDIENTE",
  "RECEIVED": "RECIBIDO",
  "NOT REQUIRED": "NO REQUERIDO",
  "ISSUE": "INCIDENCIA",
  "NONE KNOWN": "NINGUNO CONOCIDO",
  "DISCLOSED": "DECLARADO",
  "RELEASE PENDING": "LIBERACIÓN PENDIENTE",
  "RELEASED": "LIBERADO",
  "DISPUTED": "EN DISPUTA",
  "UNKNOWN": "DESCONOCIDO",
  "TITLE / DOCUMENT #": "TÍTULO / DOCUMENTO #",
  "CONDITION": "CONDICIÓN",
  "RUNNING": "OPERATIVO",
  "NEEDS REPAIR": "REQUIERE REPARACIÓN",
  "SALVAGE": "SALVAMENTO",
  "BUYER": "COMPRADOR",
  "SELLER": "VENDEDOR",
  "THIRD PARTY": "TERCERO",
  "+ BILL OF SALE / INVOICE": "+ CONTRATO DE COMPRAVENTA / FACTURA",
  "+ TITLE / LIEN RELEASE": "+ TÍTULO / LIBERACIÓN DE GRAVAMEN",
  "+ WIRE / PAYMENT PROOF": "+ COMPROBANTE DE TRANSFERENCIA / PAGO",
  "+ OTHER DOCUMENT": "+ OTRO DOCUMENTO",
  "CLEAR SELECTED FILES": "BORRAR ARCHIVOS SELECCIONADOS",
  "ADVANCED SETTLEMENT TERMS": "TÉRMINOS AVANZADOS DE LIQUIDACIÓN",
  "SECURE DOCUMENT UPLOAD IS REQUIRED BEFORE SAVE.": "LA CARGA SEGURA DE DOCUMENTOS DEBE FINALIZAR ANTES DE GUARDAR.",
  "ASSET PASSPORT, ENTITY, ACTOR, SELLER, PURCHASE DATE AND A POSITIVE VALUE ARE REQUIRED.": "SE REQUIEREN EL PASAPORTE DEL ACTIVO, LA ENTIDAD, EL USUARIO, EL VENDEDOR, LA FECHA DE COMPRA Y UN VALOR POSITIVO.",
  "RECORDING...": "REGISTRANDO...",
  "ASSET ACQUISITION COULD NOT BE RECORDED.": "NO SE PUDO REGISTRAR LA ADQUISICIÓN DEL ACTIVO.",
  "OWNERSHIP CHANGE MUST PRESERVE VALID 100% ALLOCATIONS.": "EL CAMBIO DE PROPIEDAD DEBE CONSERVAR ASIGNACIONES VÁLIDAS DEL 100%.",
  "OWNERSHIP CHANGE COULD NOT BE SAVED.": "NO SE PUDO GUARDAR EL CAMBIO DE PROPIEDAD.",
  "OWNERSHIP TRANSFER REQUIRES TWO DIFFERENT PARTIES.": "LA TRANSFERENCIA DE PROPIEDAD REQUIERE DOS PARTES DISTINTAS.",
  "OWNERSHIP TRANSFER COUNTERPARTY MUST BE AN EXISTING OWNER.": "LA CONTRAPARTE DE LA TRANSFERENCIA DEBE SER UN PROPIETARIO EXISTENTE.",
  "VALID IN-SERVICE DATE IS REQUIRED": "SE REQUIERE UNA FECHA VÁLIDA DE PUESTA EN SERVICIO.",
  "IN-SERVICE DATE CANNOT BE BEFORE THE PURCHASE DATE.": "LA FECHA DE PUESTA EN SERVICIO NO PUEDE SER ANTERIOR A LA FECHA DE COMPRA.",
  "THIS RECORD ESTABLISHES THE ASSET'S USER-ENTERED OPENING BASIS. IXI DOES NOT PRICE THE ASSET. ACTUAL FREIGHT, REPAIRS, PARTS, LABOR AND TECHNOLOGY REMAIN CANONICAL TRAN$ACT RECORDS AND PROJECT HERE UNTIL THE IN SERVICE CUTOFF.": "ESTE REGISTRO ESTABLECE LA BASE INICIAL CAPTURADA POR EL USUARIO. IXI NO VALÚA EL ACTIVO. LOS COSTOS REALES DE FLETE, REPARACIONES, REFACCIONES, MANO DE OBRA Y TECNOLOGÍA CONSERVAN SUS REGISTROS TRAN$ACT Y SE REFLEJAN AQUÍ HASTA LA FECHA DE PUESTA EN SERVICIO.",
  "+ ADD MACHINE": "+ AGREGAR MÁQUINA",
  "ACTUAL LANDED COST": "COSTO REAL PUESTO EN DESTINO",
  "ALLOCATION": "ASIGNACIÓN",
  "ALLOCATION METHOD": "MÉTODO DE ASIGNACIÓN",
  "AMEND ACQUISITION": "MODIFICAR ADQUISICIÓN",
  "APPRAISAL": "AVALÚO",
  "AUCTION / DOCUMENT FEES": "CARGOS DE SUBASTA / DOCUMENTOS",
  "AUCTION LOT / SOURCE ITEM #": "LOTE DE SUBASTA / ARTÍCULO DE ORIGEN #",
  "AUTHORITATIVE PACKAGE TOTAL": "TOTAL AUTORITATIVO DEL PAQUETE",
  "BASIS AUDIT TRAIL": "HISTORIAL DE AUDITORÍA DE BASE",
  "BROKER / FINDER FEE": "HONORARIO DE CORREDOR",
  "BUYER PREMIUM": "PRIMA DEL COMPRADOR",
  "CREATE FREIGHT ORDER": "CREAR ORDEN DE FLETE",
  "CREATE RECEIVING INSPECTION": "CREAR INSPECCIÓN DE RECEPCIÓN",
  "CURRENT ACQUISITION BASIS": "BASE ACTUAL DE ADQUISICIÓN",
  "EFFECTIVE DATE": "FECHA EFECTIVA",
  "FIELD TO CORRECT": "CAMPO A CORREGIR",
  "INTAKE EXCEPTIONS / UNDISCLOSED PROBLEMS": "EXCEPCIONES DE RECEPCIÓN / PROBLEMAS NO REVELADOS",
  "INTAKE OPEN": "RECEPCIÓN ABIERTA",
  "INVOICE / DOCUMENT / APPROVAL REF": "REF. DE FACTURA / DOCUMENTO / APROBACIÓN",
  "IXI PASSPORT": "PASAPORTE IXI",
  "LEGACY PLANNING ESTIMATES ARE PRESERVED READ-ONLY IN AUDIT HISTORY AND ARE NOT INCLUDED IN AUTHORITATIVE ACTUALS.": "LAS ESTIMACIONES HISTÓRICAS SE CONSERVAN SOLO PARA LECTURA EN LA AUDITORÍA Y NO SE INCLUYEN EN LOS REALES AUTORITATIVOS.",
  "LEGACY PLAN SNAPSHOT": "INSTANTÁNEA DEL PLAN HISTÓRICO",
  "LINKED INTAKE WORKFLOWS": "FLUJOS DE RECEPCIÓN VINCULADOS",
  "MACHINE": "MÁQUINA",
  "MAKE-READY": "PREPARACIÓN",
  "MAKE-READY ACTUAL": "PREPARACIÓN REAL",
  "MANUAL NORMALIZED": "NORMALIZACIÓN MANUAL",
  "NEGOTIATED VALUES": "VALORES NEGOCIADOS",
  "NONRECOVERABLE TAX": "IMPUESTO NO RECUPERABLE",
  "NORMALIZE PACKAGE COST": "NORMALIZAR COSTO DEL PAQUETE",
  "ONLY COSTS ON THE SELLER OR AUCTION PURCHASE DOCUMENT BELONG HERE. SEPARATE FREIGHT, REPAIR, PARTS AND LABOR TRANSACTIONS BELONG IN THEIR OPERATIONAL MODULES.": "SOLO LOS COSTOS DEL DOCUMENTO DE COMPRA DEL VENDEDOR O SUBASTA PERTENECEN AQUÍ. EL FLETE, LAS REPARACIONES, LAS REFACCIONES Y LA MANO DE OBRA SEPARADOS PERTENECEN A SUS MÓDULOS OPERATIVOS.",
  "OPEN FREIGHT": "ABRIR FLETE",
  "OPEN ITEMS": "PARTIDAS ABIERTAS",
  "OPEN MAKE-READY WORK ORDER": "ABRIR ORDEN DE PREPARACIÓN",
  "ORIGINAL PURCHASE ALLOCATION": "ASIGNACIÓN ORIGINAL DE COMPRA",
  "OTHER PURCHASE-DOCUMENT CHARGES": "OTROS CARGOS DEL DOCUMENTO DE COMPRA",
  "PACKAGE ID": "ID DEL PAQUETE",
  "PACKAGE NORMALIZATION": "NORMALIZACIÓN DEL PAQUETE",
  "PAYMENT TERMS": "TÉRMINOS DE PAGO",
  "PERCENTAGE": "PORCENTAJE",
  "PURCHASE AMENDMENTS": "MODIFICACIONES DE COMPRA",
  "PURCHASE DOCUMENT REF": "REF. DEL DOCUMENTO DE COMPRA",
  "REASON": "MOTIVO",
  "RECEIVED DATE": "FECHA DE RECEPCIÓN",
  "RECEIVING INSPECTION": "INSPECCIÓN DE RECEPCIÓN",
  "RELATED ACTUALS": "REALES RELACIONADOS",
  "RELATIVE MARKET VALUE": "VALOR RELATIVO DE MERCADO",
  "RESPONSIBLE EMPLOYEE": "EMPLEADO RESPONSABLE",
  "REVISED VALUE": "VALOR REVISADO",
  "SAVE IMMUTABLE AMENDMENT": "GUARDAR MODIFICACIÓN INMUTABLE",
  "SAVE ZERO-SUM NORMALIZATION": "GUARDAR NORMALIZACIÓN DE SUMA CERO",
  "SELLER CREDIT / DISCOUNT": "CRÉDITO / DESCUENTO DEL VENDEDOR",
  "SOURCE TRANSACTIONS": "TRANSACCIONES DE ORIGEN",
  "TITLE / REGISTRATION FEES": "CARGOS DE TÍTULO / REGISTRO",
  "TRADE ALLOWANCE": "CRÉDITO POR INTERCAMBIO",
});

function Field({ label, children }) {
  return (
    <div className="acq-field">
      <label>{label}</label>
      {children}
    </div>
  );
}
function Input({ value, onChange, ...props }) {
  return <input value={value} onChange={(e) => onChange(e.target.value)} {...props} />;
}

export default function IXIAssetAcquisitionApp({ context = {}, object = {}, initialRecord = null, relatedTransactions = [], language = "en", onLanguageChange = null, onBack = null, onRecordChange = null, onLaunchWorkflow = null }) {
  const primary = context.primary || {};
  const entity = context.entity || {};
  const location = context.location || {};
  const actor = context.actor || {};
  const [lang, setLang] = useState(String(language).toLowerCase().startsWith("es") ? "es" : "en");
  const t = COPY[lang];
  const tx = (text) => lang === "es" ? (ES_TEXT[String(text).toUpperCase()] || text) : text;
  const [record, setRecord] = useState(initialRecord);
  const [linkedFreightOrders, setLinkedFreightOrders] = useState([]);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [clientRequestId] = useState(() => globalThis.crypto?.randomUUID?.() || `ACQ-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  const [acquisitionType, setAcquisitionType] = useState("direct-purchase"),
    [sellerLabel, setSellerLabel] = useState(""),
    [sourceLabel, setSourceLabel] = useState(""),
    [sourceReference, setSourceReference] = useState(""),
    [auctionLotNumber, setAuctionLotNumber] = useState(""),
    [purchaseDate, setPurchaseDate] = useState(today()),
    [invoiceNumber, setInvoiceNumber] = useState(""),
    [invoiceDate, setInvoiceDate] = useState(today()),
    [agreementNumber, setAgreementNumber] = useState(""),
    [dueDate, setDueDate] = useState(""),
    [paymentTerms, setPaymentTerms] = useState("");
  const [purchasePrice, setPurchasePrice] = useState(() => startingValue(object)),
    [buyerPremium, setBuyerPremium] = useState(""),
    [auctionDocumentFees, setAuctionDocumentFees] = useState(""),
    [tax, setTax] = useState(""),
    [titleFees, setTitleFees] = useState(""),
    [brokerFees, setBrokerFees] = useState(""),
    [otherFees, setOtherFees] = useState(""),
    [tradeAllowance, setTradeAllowance] = useState(""),
    [sellerCredits, setSellerCredits] = useState("");
  const [owners, setOwners] = useState([
    {
      ...emptyOwner(),
      partyLabel: clean(entity.label) || "COMPANY",
      legalOwnershipPercent: "100",
      settlementSharePercent: "100",
    },
  ]);
  const [payments, setPayments] = useState([]);
  const [titleRequired, setTitleRequired] = useState(true),
    [titleStatus, setTitleStatus] = useState("pending"),
    [lienStatus, setLienStatus] = useState("none-known"),
    [clearTitle, setClearTitle] = useState("unknown"),
    [titleNumber, setTitleNumber] = useState("");
  const [condition, setCondition] = useState("running"),
    [hours, setHours] = useState(""),
    [knownIssues, setKnownIssues] = useState("");
  const [purchaseLocation, setPurchaseLocation] = useState(""),
    [deliverTo, setDeliverTo] = useState(clean(location.label)),
    [freightResponsibility, setFreightResponsibility] = useState("buyer"),
    [pickupDate, setPickupDate] = useState(""),
    [expectedDeliveryDate, setExpectedDeliveryDate] = useState(""),
    [receivedDate, setReceivedDate] = useState("");
  const [financed, setFinanced] = useState(false),
    [lenderLabel, setLenderLabel] = useState(""),
    [responsibleEmployee, setResponsibleEmployee] = useState(clean(actor.displayName || actor.name || actor.label)),
    [intakeExceptions, setIntakeExceptions] = useState(""),
    [settlementNotes, setSettlementNotes] = useState(""),
    [notes, setNotes] = useState("");
  const [documents, setDocuments] = useState([]);
  const [inServiceDate, setInServiceDate] = useState("");
  const [eventOpen, setEventOpen] = useState(false);
  const [eventType, setEventType] = useState("capital-contribution"),
    [eventParty, setEventParty] = useState(""),
    [eventCounterparty, setEventCounterparty] = useState(""),
    [eventAmount, setEventAmount] = useState(""),
    [eventPct, setEventPct] = useState(""),
    [eventSettlePct, setEventSettlePct] = useState(""),
    [eventRef, setEventRef] = useState("");
  const [amendmentOpen, setAmendmentOpen] = useState(false),
    [amendmentField, setAmendmentField] = useState("purchasePrice"),
    [amendmentValue, setAmendmentValue] = useState(""),
    [amendmentDate, setAmendmentDate] = useState(today()),
    [amendmentReason, setAmendmentReason] = useState(""),
    [amendmentReference, setAmendmentReference] = useState("");
  const [packageOpen, setPackageOpen] = useState(false),
    [packageId, setPackageId] = useState(""),
    [packageReference, setPackageReference] = useState(""),
    [packageTotal, setPackageTotal] = useState(""),
    [allocationMethod, setAllocationMethod] = useState("negotiated-values"),
    [normalizationDate, setNormalizationDate] = useState(today()),
    [normalizationReason, setNormalizationReason] = useState(""),
    [allocations, setAllocations] = useState(() => [{ passportId: clean(primary.passportId), label: clean(primary.label), amount: "" }, emptyAllocation()]);

  const input = useMemo(
    () => ({
      clientRequestId,
      acquisitionType,
      sellerLabel,
      sourceLabel,
      sourceChannel: sourceLabel,
      sourceReference,
      auctionLotNumber,
      purchaseDate,
      invoiceNumber,
      invoiceDate,
      invoiceAmount: purchasePrice,
      agreementNumber,
      dueDate,
      paymentTerms,
      purchasePrice,
      buyerPremium,
      auctionDocumentFees,
      nonrecoverableTax: tax,
      tax,
      titleFees,
      brokerFees,
      otherAcquisitionFees: otherFees,
      tradeAllowance,
      sellerCredits,
      owners,
      payments,
      titleRequired,
      titleStatus,
      lienStatus,
      sellerRepresentsClearTitle: clearTitle,
      titleNumber,
      condition,
      hoursAtAcquisition: hours,
      knownIssues,
      purchaseLocation,
      deliverToLabel: deliverTo,
      freightResponsibility,
      pickupDate,
      expectedDeliveryDate,
      receivedDate,
      financed,
      lenderLabel,
      responsibleEmployeeLabel: responsibleEmployee,
      intakeExceptions,
      documents,
      settlementTermsNotes: settlementNotes,
      notes,
    }),
    [clientRequestId, acquisitionType, sellerLabel, sourceLabel, sourceReference, auctionLotNumber, purchaseDate, invoiceNumber, invoiceDate, agreementNumber, dueDate, paymentTerms, purchasePrice, buyerPremium, auctionDocumentFees, tax, titleFees, brokerFees, otherFees, tradeAllowance, sellerCredits, owners, payments, titleRequired, titleStatus, lienStatus, clearTitle, titleNumber, condition, hours, knownIssues, intakeExceptions, purchaseLocation, deliverTo, freightResponsibility, pickupDate, expectedDeliveryDate, receivedDate, financed, lenderLabel, responsibleEmployee, documents, settlementNotes, notes],
  );
  const preview = useMemo(() => createIXIAssetAcquisitionDraft({ context, input }), [context, input]);
  const liveRecord = useMemo(() => (record ? applyIXIAcquisitionActuals(hydrateIXIAssetAcquisitionRecord(record), relatedTransactions) : null), [record, relatedTransactions]);
  const operations = useMemo(() => (liveRecord ? getIXIAcquisitionOperations(liveRecord, [
    ...relatedTransactions,
    ...linkedFreightOrders.map((freightOrder) => ({
      documentType: "freight",
      freightOrder,
      status: freightOrder?.status,
      references: [{ passportId: liveRecord?.context?.primaryPassportId }],
    })),
  ]) : null), [liveRecord, relatedTransactions, linkedFreightOrders]);
  useEffect(() => {
    setRecord(initialRecord || null);
  }, [initialRecord]);
  useEffect(() => {
    const passportId = clean(liveRecord?.context?.primaryPassportId);
    if (!passportId) {
      setLinkedFreightOrders([]);
      return undefined;
    }
    const controller = new AbortController();
    loadIXIFreightOrders(passportId, { signal: controller.signal }).then(setLinkedFreightOrders).catch((error) => {
      if (error?.name !== "AbortError") setLinkedFreightOrders([]);
    });
    return () => controller.abort();
  }, [liveRecord?.context?.primaryPassportId]);
  function changeLang(next) {
    setLang(next);
    onLanguageChange?.(next);
  }
  function updateOwner(i, key, value) {
    setOwners((list) => list.map((item, index) => (index === i ? { ...item, [key]: value } : item)));
  }
  function updatePayment(i, key, value) {
    setPayments((list) => list.map((item, index) => (index === i ? { ...item, [key]: value } : item)));
  }
  function updateAllocation(i, key, value) {
    setAllocations((list) => list.map((item, index) => (index === i ? { ...item, [key]: value } : item)));
  }
  async function save() {
    const check = validateIXIAssetAcquisition(preview);
    setErrors(check.errors);
    if (!check.valid) return;
    setSaving(true);
    try {
      const result = await createIXIAssetAcquisition({
        object: {
          ...object,
          passportId: primary.passportId,
          objectId: primary.objectId,
          objectType: primary.objectType,
          label: primary.label,
        },
        context,
        input,
        metadata: { source: "ixi-transact-asset-acquisition" },
      });
      setRecord(result.record);
      setInServiceDate(result.record.makeReady?.inServiceDate || "");
      setErrors({});
      await onRecordChange?.(result.record, { action: "create", response: result.response }, context);
    } catch (error) {
      setErrors({
        ...error?.validation?.errors,
        save: tx(clean(error?.message) || "Asset Acquisition could not be recorded."),
      });
    } finally {
      setSaving(false);
    }
  }
  async function putService() {
    if (!record) return;
    setSaving(true);
    try {
      const wasClosed = record.makeReady?.status === "closed";
      const candidate = applyIXIAcquisitionActuals(putIXIAssetInService(record, inServiceDate, actor), relatedTransactions);
      const result = await updateIXIAssetAcquisition({
        record: candidate,
        action: wasClosed ? "correct-in-service-date" : "put-in-service",
      });
      setRecord(result.record);
      setErrors({});
      await onRecordChange?.(
        result.record,
        {
          action: wasClosed ? "correct-in-service-date" : "put-in-service",
          inServiceDate,
          previousInServiceDate: record.makeReady?.inServiceDate || "",
          response: result.response,
        },
        context,
      );
    } catch (error) {
      setErrors({ inService: tx(error.message) });
    } finally {
      setSaving(false);
    }
  }
  async function saveEvent() {
    if (!record || !clean(eventParty)) return;
    setSaving(true);
    try {
      const candidate = addIXIOwnershipCapitalEvent(
        record,
        {
          type: eventType,
          partyLabel: eventParty,
          counterpartyLabel: eventCounterparty,
          amount: eventAmount,
          ownershipPercentChange: eventPct,
          settlementSharePercentChange: eventSettlePct,
          reference: eventRef,
        },
        actor,
      );
      const validation = validateIXIAssetAcquisition(candidate);
      if (!validation.valid) {
        const error = new Error("Ownership change must preserve valid 100% allocations.");
        error.validation = validation;
        throw error;
      }
      const result = await updateIXIAssetAcquisition({
        record: candidate,
        action: "ownership-capital-change",
      });
      setRecord(result.record);
      setEventOpen(false);
      setEventAmount("");
      setEventCounterparty("");
      setEventPct("");
      setEventSettlePct("");
      setEventRef("");
      setErrors({});
      await onRecordChange?.(
        result.record,
        {
          action: "ownership-capital-change",
          event: result.record.ownership?.events?.at(-1),
          response: result.response,
        },
        context,
      );
    } catch (error) {
      setErrors({
        event: tx(clean(error?.message) || "Ownership change could not be saved."),
      });
    } finally {
      setSaving(false);
    }
  }
  async function saveAmendment() {
    if (!record || saving) return;
    setSaving(true);
    try {
      const candidate = amendIXIAssetAcquisition(hydrateIXIAssetAcquisitionRecord(record), {
        field: amendmentField,
        newValue: amendmentValue,
        effectiveDate: amendmentDate,
        reason: amendmentReason,
        reference: amendmentReference,
      }, actor);
      const result = await updateIXIAssetAcquisition({ record: candidate, action: "acquisition-amendment" });
      setRecord(result.record);
      setAmendmentOpen(false);
      setAmendmentValue("");
      setAmendmentReason("");
      setAmendmentReference("");
      setErrors({});
      await onRecordChange?.(result.record, { action: "acquisition-amendment", adjustment: result.record.adjustments?.at(-1), response: result.response }, context);
    } catch (error) {
      setErrors({ amendment: tx(clean(error?.message) || "Acquisition amendment could not be saved.") });
    } finally {
      setSaving(false);
    }
  }
  async function savePackageNormalization() {
    if (!record || saving) return;
    setSaving(true);
    try {
      const candidate = normalizeIXIPackageAllocation(hydrateIXIAssetAcquisitionRecord(record), {
        packageId,
        packageReference,
        packageTotal,
        allocationMethod,
        effectiveDate: normalizationDate,
        reason: normalizationReason,
        allocations,
      }, actor);
      const result = await recordIXIAssetAcquisitionPackageNormalization({ record: candidate, context, object });
      setRecord(result.record);
      setPackageOpen(false);
      setErrors({});
      await onRecordChange?.(result.record, { action: "package-normalization", adjustment: result.record.adjustments?.at(-1), response: result.response }, context);
    } catch (error) {
      setErrors({ package: tx(clean(error?.message) || "Package normalization could not be saved.") });
    } finally {
      setSaving(false);
    }
  }
  function addDocs(files) {
    const next = Array.from(files || []).map((file, index) => ({
      documentId: `ACQ-DOC-${Date.now()}-${index}`,
      fileName: file.name,
      mimeType: file.type,
      size: file.size,
      status: "local-pending-upload",
      type: file.type?.startsWith("image/") ? "photo" : "document",
    }));
    setDocuments((current) => [...current, ...next]);
  }

  if (liveRecord) {
    const r = liveRecord;
    const ownerEvents = r.ownership?.events || [];
    const direct = r.acquisition?.currentAcquisitionBasis ?? r.acquisition?.directAcquisitionCost ?? 0;
    const originalBasis = r.acquisition?.originalAcquisitionBasis ?? direct;
    const actual = r.makeReady?.actualTotal || 0;
    const freightActual = (r.makeReady?.actuals || []).filter((item) => clean(item?.category).includes("freight")).reduce((sum, item) => sum + Number(item?.actualAmount || 0), 0);
    const makeReadyActual = actual - freightActual;
    const acquisitionClosed = r.makeReady?.status === "closed" && clean(r.makeReady?.inServiceDate);
    const readyCost = direct + actual;
    return (
      <div className="ixi-acq" lang={lang === "es" ? "es-MX" : "en-US"}>
        <div className="acq-top">
          <div>
            <div className="acq-kicker">IXI TRAN$ACT</div>
            <div className="acq-title">{t.record}</div>
            <div className="acq-id">{r.identity?.number || r.identity?.acquisitionId}</div>
          </div>
          <div className="acq-lang">
            <button type="button" onClick={() => changeLang("en")} className={lang === "en" ? "on" : ""} aria-pressed={lang === "en"}>
              ENG
            </button>
            <button type="button" onClick={() => changeLang("es")} className={lang === "es" ? "on" : ""} aria-pressed={lang === "es"}>
              ESP
            </button>
          </div>
        </div>
        <div className="acq-context">
          <strong>{r.context?.primaryLabel}</strong>
          <small>
            {tx(r.context?.primaryObjectType || "ASSET")} · {r.context?.locationLabel || tx("NO LOCATION")}
          </small>
        </div>
        <div className="acq-status-grid">
          <div className="acq-status">
            <span>{tx("OWNERSHIP")}</span>
            <b className="ok">{r.ownership?.legalOwnershipTotal?.toFixed?.(2) || r.ownership?.legalOwnershipTotal}% {tx("ALLOCATED")}</b>
          </div>
          <div className="acq-status">
            <span>{tx("PAYMENT")}</span>
            <b className={r.funding?.balanceDue > 0 ? "warn" : "ok"}>{r.funding?.balanceDue > 0 ? `${money(r.funding.balanceDue)} ${tx("DUE")}` : tx("PAID / FUNDED")}</b>
          </div>
          <div className="acq-status">
            <span>{tx("TITLE")}</span>
            <b className={r.title?.titleStatus === "received" ? "ok" : "warn"}>{tx(clean(r.title?.titleStatus).replace(/-/g, " ").toUpperCase())}</b>
          </div>
          <div className="acq-status">
            <span>{tx("ACQUISITION")}</span>
            <b className={clean(r.logistics?.receivedDate) ? "ok" : "warn"}>{clean(r.logistics?.receivedDate) ? tx("RECEIVED") : tx("INTAKE OPEN")}</b>
          </div>
        </div>
        <div className="acq-money"><span>{tx("FREIGHT ACTUAL")}</span><b>{money(freightActual)}</b></div>
        <div className="acq-money"><span>{tx("MAKE-READY ACTUAL")}</span><b>{money(makeReadyActual)}</b></div>
        <div className="acq-section">{t.deal}</div>
        <div className="acq-money"><span>{tx("ORIGINAL PURCHASE ALLOCATION")}</span><b>{money(originalBasis)}</b></div>
        <div className="acq-money"><span>{tx("PURCHASE AMENDMENTS")}</span><b>{money(r.acquisition?.amendmentTotal)}</b></div>
        <div className="acq-money"><span>{tx("PACKAGE NORMALIZATION")}</span><b>{money(r.acquisition?.packageNormalizationTotal)}</b></div>
        <div className="acq-total">
          <span>{tx("CURRENT ACQUISITION BASIS")}</span>
          <strong>{money(direct)}</strong>
        </div>
        <div className="acq-inline-actions">
          <button type="button" onClick={() => setAmendmentOpen((value) => !value)}>{tx("AMEND ACQUISITION")}</button>
          <button type="button" onClick={() => setPackageOpen((value) => !value)}>{tx("NORMALIZE PACKAGE COST")}</button>
        </div>
        {amendmentOpen ? (
          <div className="acq-event-edit">
            <Field label={tx("FIELD TO CORRECT")}>
              <select value={amendmentField} onChange={(event) => setAmendmentField(event.target.value)}>
                <option value="purchasePrice">{tx("PURCHASE PRICE")}</option>
                <option value="buyerPremium">{tx("BUYER PREMIUM")}</option>
                <option value="auctionDocumentFees">{tx("AUCTION / DOCUMENT FEES")}</option>
                <option value="nonrecoverableTax">{tx("NONRECOVERABLE TAX")}</option>
                <option value="titleFees">{tx("TITLE / REGISTRATION FEES")}</option>
                <option value="brokerFees">{tx("BROKER / FINDER FEE")}</option>
                <option value="otherAcquisitionFees">{tx("OTHER PURCHASE-DOCUMENT CHARGES")}</option>
                <option value="tradeAllowance">{tx("TRADE ALLOWANCE")}</option>
                <option value="sellerCredits">{tx("SELLER CREDIT / DISCOUNT")}</option>
              </select>
            </Field>
            <div className="acq-grid2">
              <Field label={tx("REVISED VALUE")}><Input value={amendmentValue} onChange={setAmendmentValue} inputMode="decimal" /></Field>
              <Field label={tx("EFFECTIVE DATE")}><input type="date" value={amendmentDate} onChange={(event) => setAmendmentDate(event.target.value)} /></Field>
            </div>
            <Field label={tx("REASON")}><Input value={amendmentReason} onChange={setAmendmentReason} /></Field>
            <Field label={tx("INVOICE / DOCUMENT / APPROVAL REF")}><Input value={amendmentReference} onChange={setAmendmentReference} /></Field>
            <button className="acq-primary" type="button" onClick={saveAmendment} disabled={saving}>{saving ? tx("SAVING...") : tx("SAVE IMMUTABLE AMENDMENT")}</button>
            {errors.amendment ? <div className="acq-error">{errors.amendment}</div> : null}
          </div>
        ) : null}
        {packageOpen ? (
          <div className="acq-event-edit">
            <div className="acq-grid2">
              <Field label={tx("PACKAGE ID")}><Input value={packageId} onChange={setPackageId} /></Field>
              <Field label={tx("PURCHASE DOCUMENT REF")}><Input value={packageReference} onChange={setPackageReference} /></Field>
              <Field label={tx("AUTHORITATIVE PACKAGE TOTAL")}><Input value={packageTotal} onChange={setPackageTotal} inputMode="decimal" /></Field>
              <Field label={tx("ALLOCATION METHOD")}>
                <select value={allocationMethod} onChange={(event) => setAllocationMethod(event.target.value)}>
                  <option value="negotiated-values">{tx("NEGOTIATED VALUES")}</option>
                  <option value="relative-market">{tx("RELATIVE MARKET VALUE")}</option>
                  <option value="appraisal">{tx("APPRAISAL")}</option>
                  <option value="percentage">{tx("PERCENTAGE")}</option>
                  <option value="manual-normalized">{tx("MANUAL NORMALIZED")}</option>
                </select>
              </Field>
            </div>
            {allocations.map((allocation, index) => (
              <div className="acq-allocation" key={`${index}-${allocation.passportId}`}>
                <Field label={tx("IXI PASSPORT")}><Input value={allocation.passportId} onChange={(value) => updateAllocation(index, "passportId", value)} /></Field>
                <div className="acq-grid2">
                  <Field label={tx("MACHINE")}><Input value={allocation.label} onChange={(value) => updateAllocation(index, "label", value)} /></Field>
                  <Field label={tx("ALLOCATION")}><Input value={allocation.amount} onChange={(value) => updateAllocation(index, "amount", value)} inputMode="decimal" /></Field>
                </div>
              </div>
            ))}
            <button className="acq-secondary" type="button" onClick={() => setAllocations((list) => [...list, emptyAllocation()])}>{tx("+ ADD MACHINE")}</button>
            <div className="acq-grid2">
              <Field label={tx("EFFECTIVE DATE")}><input type="date" value={normalizationDate} onChange={(event) => setNormalizationDate(event.target.value)} /></Field>
              <Field label={tx("REASON")}><Input value={normalizationReason} onChange={setNormalizationReason} /></Field>
            </div>
            <button className="acq-primary" type="button" onClick={savePackageNormalization} disabled={saving}>{saving ? tx("SAVING...") : tx("SAVE ZERO-SUM NORMALIZATION")}</button>
            {errors.package ? <div className="acq-error">{errors.package}</div> : null}
          </div>
        ) : null}
        {(r.adjustments || []).length ? <div className="acq-section">{tx("BASIS AUDIT TRAIL")}</div> : null}
        {(r.adjustments || []).slice().reverse().map((item) => (
          <div className="acq-row" key={item.adjustmentId}>
            <div className="acq-row-top"><strong>{tx(clean(item.type).replace(/-/g, " ").toUpperCase())}</strong><b className={Number(item.basisDelta) < 0 ? "" : "yellow"}>{money(item.basisDelta)}</b></div>
            <small>{item.effectiveDate} · {item.reason} · {item.reference || item.packageReference} · {money(item.basisBefore)} → {money(item.basisAfter)}</small>
          </div>
        ))}
        <div className="acq-section">{tx("LINKED INTAKE WORKFLOWS")}</div>
        <div className="acq-status-grid">
          <div className="acq-status"><span>{tx("FREIGHT")}</span><b className={operations?.freightOrderCount ? "ok" : "warn"}>{tx(clean(operations?.freightStatus || "not-created").replace(/-/g, " ").toUpperCase())}</b></div>
          <div className="acq-status"><span>{tx("RECEIVING INSPECTION")}</span><b className={operations?.inspectionStatus === "complete" ? "ok" : "warn"}>{tx(clean(operations?.inspectionStatus || "not-created").replace(/-/g, " ").toUpperCase())}</b></div>
          <div className="acq-status"><span>{tx("MAKE-READY")}</span><b className={operations?.makeReadyOpenCount ? "warn" : "ok"}>{operations?.makeReadyOpenCount || 0} {tx("OPEN ITEMS")}</b></div>
          <div className="acq-status"><span>{tx("RELATED ACTUALS")}</span><b>{money(actual)}</b></div>
        </div>
        <div className="acq-workflow-actions">
          <button type="button" onClick={() => onLaunchWorkflow?.("freight", { acquisition: r, workflow: "acquisition-inbound", action: operations?.freightOrderCount ? "open" : "new" })}>{operations?.freightOrderCount ? tx("OPEN FREIGHT") : tx("CREATE FREIGHT ORDER")}</button>
          <button type="button" onClick={() => onLaunchWorkflow?.("work-order", { acquisition: r, workflow: "receiving-inspection" })}>{tx("CREATE RECEIVING INSPECTION")}</button>
          <button type="button" onClick={() => onLaunchWorkflow?.("work-order", { acquisition: r, workflow: "make-ready" })}>{tx("OPEN MAKE-READY WORK ORDER")}</button>
        </div>
        {(r.makeReady?.actuals || []).map((item) => (
          <div className="acq-row" key={item.category}>
            <div className="acq-row-top"><strong>{tx(item.label || clean(item.category).replace(/-/g, " ").toUpperCase())}</strong><b>{money(item.actualAmount)}</b></div>
            <small>{item.records?.length || 0} {tx("SOURCE TRANSACTIONS")}</small>
          </div>
        ))}
        {r.makeReady?.legacyPlanningSnapshot ? (
          <>
            <div className="acq-section">{tx("LEGACY PLAN SNAPSHOT")}</div>
            {(r.makeReady?.estimates || []).map((item) => (
              <div className="acq-money" key={item.costId}><span>{tx(item.label || clean(item.category).replace(/-/g, " ").toUpperCase())}</span><b>{money(item.estimatedAmount)}</b></div>
            ))}
            <div className="acq-row"><small>{tx("LEGACY PLANNING ESTIMATES ARE PRESERVED READ-ONLY IN AUDIT HISTORY AND ARE NOT INCLUDED IN AUTHORITATIVE ACTUALS.")}</small></div>
          </>
        ) : null}
        <div className="acq-total">
          <span>{tx("ACTUAL LANDED COST")}</span>
          <strong>{money(readyCost)}</strong>
        </div>
        <div className="acq-section">{t.owners}</div>
        <div className="acq-list">
          {(r.ownership?.owners || []).map((owner) => (
            <div className="acq-row" key={owner.ownerId}>
              <div className="acq-row-top">
                <strong>{owner.partyLabel}</strong>
                <b className="yellow">{owner.legalOwnershipPercent}%</b>
              </div>
              <small>
                {tx("SETTLEMENT")} {owner.settlementSharePercent}% · {tx("INITIAL CAPITAL")} {money(owner.initialContribution)}
              </small>
            </div>
          ))}
        </div>
        <div className="acq-section">{t.ownershipHistory}</div>
        {ownerEvents.length ? (
          ownerEvents
            .slice()
            .reverse()
            .map((event) => (
              <div className="acq-row" key={event.eventId}>
                <div className="acq-row-top">
                  <strong>{tx(clean(event.type).replace(/-/g, " ").toUpperCase())}</strong>
                  <b>{money(event.amount)}</b>
                </div>
                <small>
                  {event.partyLabel} · {tx("OWNERSHIP")} {event.ownershipPercentChange >= 0 ? "+" : ""}
                  {event.ownershipPercentChange}% · {event.reference || event.occurredAt}
                </small>
              </div>
            ))
        ) : (
          <div className="acq-row">
            <small>{tx("ORIGINAL OWNERSHIP ONLY. NO LATER CAPITAL OR OWNERSHIP CHANGES.")}</small>
          </div>
        )}
        <button className="acq-secondary" onClick={() => setEventOpen((v) => !v)}>
          {t.addEvent}
        </button>
        {eventOpen ? (
          <div className="acq-event-edit">
            <Field label={t.eventType}>
              <select value={eventType} onChange={(e) => setEventType(e.target.value)}>
                <option value="capital-contribution">{tx("CAPITAL CONTRIBUTION")}</option>
                <option value="reimbursement">{tx("REIMBURSEMENT")}</option>
                <option value="distribution">{tx("DISTRIBUTION")}</option>
                <option value="partner-buyout">{tx("PARTNER BUYOUT")}</option>
                <option value="ownership-transfer">{tx("OWNERSHIP TRANSFER")}</option>
                <option value="ownership-adjustment">{tx("OWNERSHIP ADJUSTMENT")}</option>
              </select>
            </Field>
            <Field label={t.eventParty}>
              <Input value={eventParty} onChange={setEventParty} />
            </Field>
            {Number(eventPct) !== 0 || Number(eventSettlePct) !== 0 ? (
              <Field label={tx("TRANSFER FROM EXISTING OWNER")}>
                <select value={eventCounterparty} onChange={(e) => setEventCounterparty(e.target.value)}>
                  <option value="">{tx("SELECT OWNER")}</option>
                  {(record.ownership?.owners || []).map((owner) => (
                    <option key={owner.ownerId} value={owner.partyLabel}>
                      {owner.partyLabel}
                    </option>
                  ))}
                </select>
              </Field>
            ) : null}
            <div className="acq-grid2">
              <Field label={t.eventAmount}>
                <Input value={eventAmount} onChange={setEventAmount} inputMode="decimal" />
              </Field>
              <Field label={t.eventPct}>
                <Input value={eventPct} onChange={setEventPct} inputMode="decimal" />
              </Field>
            </div>
            <Field label={t.eventSettle}>
              <Input value={eventSettlePct} onChange={setEventSettlePct} inputMode="decimal" />
            </Field>
            <Field label={t.eventRef}>
              <Input value={eventRef} onChange={setEventRef} />
            </Field>
            <button className="acq-primary" onClick={saveEvent} disabled={saving}>
              {saving ? tx("SAVING...") : t.saveEvent}
            </button>
            {errors.event ? <div className="acq-error">{errors.event}</div> : null}
          </div>
        ) : null}
        <div className="acq-section">{t.inService}</div>
        <div className={`acq-service ${acquisitionClosed ? "" : "open"}`}>
          {acquisitionClosed ? (
            <>
              <div className="acq-service-head">
                <strong>✓ {t.complete}</strong>
                <b>{r.makeReady.inServiceDate}</b>
              </div>
              <div className="acq-total">
                <span>{t.readyCost}</span>
                <strong>{money(readyCost)}</strong>
              </div>
              <small>{t.completeSub}</small>
              <Field label={t.serviceDate}>
                <input type="date" value={inServiceDate} onChange={(e) => setInServiceDate(e.target.value)} />
              </Field>
              <button className="acq-secondary" onClick={putService} disabled={saving}>
                {saving ? tx("SAVING...") : t.correctService}
              </button>
              <small>{t.routingNote}</small>
            </>
          ) : (
            <>
              <div className="acq-service-head">
                <strong>{tx("MAKE-READY OPEN")}</strong>
                <b>{money(readyCost)}</b>
              </div>
              <small>{tx("SET THE REAL DATE THIS ASSET BECAME OPERATIONAL / SALE-READY / RENTAL-READY. THIS DATE CLOSES THE ACQUISITION / MAKE-READY CHAPTER.")}</small>
              <Field label={t.serviceDate}>
                <input type="date" value={inServiceDate} onChange={(e) => setInServiceDate(e.target.value)} />
              </Field>
              <button className="acq-primary" onClick={putService} disabled={saving}>
                {saving ? tx("SAVING...") : t.putService}
                <small style={{ display: "block", fontSize: 5 }}>{tx("CLOSE ACQUISITION / MAKE-READY")}</small>
              </button>
              <small>{t.routingNote}</small>
            </>
          )}
          {errors.inService ? <div className="acq-error">{errors.inService}</div> : null}
        </div>
        <button className="acq-secondary" onClick={() => onBack?.()}>
          {t.back}
        </button>
        <div className="acq-foot">{tx("ACQ IS THE OPENING OWNERSHIP/CAPITAL CHAPTER. SOURCE TRANSACTIONS REMAIN CANONICAL AND SETTLEMENT CONSUMES THIS HISTORY LATER.")}</div>
        <IXIAssetAcquisitionStyles />
      </div>
    );
  }

  return (
    <div className="ixi-acq" lang={lang === "es" ? "es-MX" : "en-US"}>
      <div className="acq-top">
        <div>
          <div className="acq-kicker">IXI TRAN$ACT</div>
          <div className="acq-title">{t.title}</div>
        </div>
        <div className="acq-lang">
          <button type="button" onClick={() => changeLang("en")} className={lang === "en" ? "on" : ""} aria-pressed={lang === "en"}>
            ENG
          </button>
          <button type="button" onClick={() => changeLang("es")} className={lang === "es" ? "on" : ""} aria-pressed={lang === "es"}>
            ESP
          </button>
        </div>
      </div>
      <div className="acq-context">
        <strong>{primary.label || tx("SELECT ASSET")}</strong>
        <small>
          {tx(primary.objectType || "AOS ASSET")} · {location.label || tx("NO LOCATION")}
        </small>
      </div>
      <div className="acq-section">{t.deal}</div>
      <div className="acq-grid2">
        <Field label={t.type}>
          <select value={acquisitionType} onChange={(e) => setAcquisitionType(e.target.value)}>
            <option value="direct-purchase">{tx("DIRECT PURCHASE")}</option>
            <option value="auction">{tx("AUCTION")}</option>
            <option value="trade-in">{tx("TRADE-IN")}</option>
            <option value="dealer">{tx("DEALER")}</option>
            <option value="private-seller">{tx("PRIVATE SELLER")}</option>
            <option value="entity-transfer">{tx("ENTITY TRANSFER")}</option>
            <option value="other">{tx("OTHER")}</option>
          </select>
        </Field>
        <Field label={t.purchaseDate}>
          <input type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} />
        </Field>
      </div>
      <Field label={t.seller}>
        <Input value={sellerLabel} onChange={setSellerLabel} />
      </Field>
      <div className="acq-grid2">
        <Field label={t.source}>
          <Input value={sourceLabel} onChange={setSourceLabel} />
        </Field>
        <Field label={t.sourceRef}>
          <Input value={sourceReference} onChange={setSourceReference} />
        </Field>
      </div>
      <Field label={tx("AUCTION LOT / SOURCE ITEM #")}>
        <Input value={auctionLotNumber} onChange={setAuctionLotNumber} />
      </Field>
      <div className="acq-grid2">
        <Field label={t.invoice}>
          <Input value={invoiceNumber} onChange={setInvoiceNumber} />
        </Field>
        <Field label={t.invoiceDate}>
          <input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} />
        </Field>
      </div>
      <div className="acq-grid2">
        <Field label={t.agreement}>
          <Input value={agreementNumber} onChange={setAgreementNumber} />
        </Field>
        <Field label={tx("PAYMENT DUE DATE")}>
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </Field>
      </div>
      <Field label={tx("PAYMENT TERMS")}><Input value={paymentTerms} onChange={setPaymentTerms} /></Field>
      <div className="acq-section">{tx("PURCHASE ECONOMICS")}</div>
      <Field label={t.price}>
        <Input value={purchasePrice} onChange={setPurchasePrice} inputMode="decimal" />
      </Field>
      <div className="acq-grid2">
        <Field label={t.premium}>
          <Input value={buyerPremium} onChange={setBuyerPremium} inputMode="decimal" />
        </Field>
        <Field label={tx("AUCTION / DOCUMENT FEES")}>
          <Input value={auctionDocumentFees} onChange={setAuctionDocumentFees} inputMode="decimal" />
        </Field>
        <Field label={t.tax}>
          <Input value={tax} onChange={setTax} inputMode="decimal" />
        </Field>
        <Field label={t.titleFees}>
          <Input value={titleFees} onChange={setTitleFees} inputMode="decimal" />
        </Field>
        <Field label={t.broker}>
          <Input value={brokerFees} onChange={setBrokerFees} inputMode="decimal" />
        </Field>
      </div>
      <Field label={t.otherFees}>
        <Input value={otherFees} onChange={setOtherFees} inputMode="decimal" />
      </Field>
      <div className="acq-grid2">
        <Field label={tx("TRADE ALLOWANCE")}><Input value={tradeAllowance} onChange={setTradeAllowance} inputMode="decimal" /></Field>
        <Field label={tx("SELLER CREDIT / DISCOUNT")}><Input value={sellerCredits} onChange={setSellerCredits} inputMode="decimal" /></Field>
      </div>
      <div className="acq-row"><small>{tx("ONLY COSTS ON THE SELLER OR AUCTION PURCHASE DOCUMENT BELONG HERE. SEPARATE FREIGHT, REPAIR, PARTS AND LABOR TRANSACTIONS BELONG IN THEIR OPERATIONAL MODULES.")}</small></div>
      <div className="acq-total">
        <span>{t.direct}</span>
        <strong>{money(preview.acquisition.directAcquisitionCost)}</strong>
      </div>
      <div className="acq-section">{t.owners}</div>
      {owners.map((owner, i) => (
        <div className="acq-owner-edit" key={i}>
          <Field label={tx("OWNER / PARTNER")}>
            <Input value={owner.partyLabel} onChange={(v) => updateOwner(i, "partyLabel", v)} />
          </Field>
          <div className="acq-grid2">
            <Field label={t.legal}>
              <Input value={owner.legalOwnershipPercent} onChange={(v) => updateOwner(i, "legalOwnershipPercent", v)} inputMode="decimal" />
            </Field>
            <Field label={t.settle}>
              <Input value={owner.settlementSharePercent} onChange={(v) => updateOwner(i, "settlementSharePercent", v)} inputMode="decimal" />
            </Field>
          </div>
          <div className="acq-grid2">
            <Field label={t.capital}>
              <Input value={owner.initialContribution} onChange={(v) => updateOwner(i, "initialContribution", v)} inputMode="decimal" />
            </Field>
            <Field label={tx("CONTRIBUTION DATE")}>
              <input type="date" value={owner.contributionDate} onChange={(e) => updateOwner(i, "contributionDate", e.target.value)} />
            </Field>
          </div>
          <Field label={tx("CONTRIBUTION / WIRE REF")}>
            <Input value={owner.contributionReference} onChange={(v) => updateOwner(i, "contributionReference", v)} />
          </Field>
          {owners.length > 1 ? (
            <button className="acq-secondary" onClick={() => setOwners((list) => list.filter((_, index) => index !== i))}>
              {tx("REMOVE OWNER")}
            </button>
          ) : null}
        </div>
      ))}
      <button className="acq-secondary" onClick={() => setOwners((list) => [...list, emptyOwner()])}>
        {t.addOwner}
      </button>
      <div className="acq-money">
        <span>{tx("LEGAL OWNERSHIP TOTAL")}</span>
        <b>{preview.ownership.legalOwnershipTotal.toFixed(2)}%</b>
      </div>
      <div className="acq-money">
        <span>{tx("SETTLEMENT SHARE TOTAL")}</span>
        <b>{preview.ownership.settlementShareTotal.toFixed(2)}%</b>
      </div>
      <div className="acq-section">{t.funding}</div>
      {payments.map((payment, i) => (
        <div className="acq-payment-edit" key={i}>
          <div className="acq-grid2">
            <Field label={t.paymentDate}>
              <input type="date" value={payment.date} onChange={(e) => updatePayment(i, "date", e.target.value)} />
            </Field>
            <Field label={t.amount}>
              <Input value={payment.amount} onChange={(v) => updatePayment(i, "amount", v)} inputMode="decimal" />
            </Field>
          </div>
          <div className="acq-grid2">
            <Field label={t.method}>
              <select value={payment.method} onChange={(e) => updatePayment(i, "method", e.target.value)}>
                <option value="wire">{tx("WIRE")}</option>
                <option value="ach">ACH</option>
                <option value="check">{tx("CHECK")}</option>
                <option value="cash">{tx("CASH")}</option>
                <option value="financing">{tx("FINANCING")}</option>
                <option value="other">{tx("OTHER")}</option>
              </select>
            </Field>
            <Field label={t.payer}>
              <Input value={payment.payerLabel} onChange={(v) => updatePayment(i, "payerLabel", v)} />
            </Field>
          </div>
          <Field label={t.reference}>
            <Input value={payment.reference} onChange={(v) => updatePayment(i, "reference", v)} />
          </Field>
          <button className="acq-secondary" onClick={() => setPayments((list) => list.filter((_, index) => index !== i))}>
            {tx("REMOVE PAYMENT")}
          </button>
        </div>
      ))}
      <button className="acq-secondary" onClick={() => setPayments((list) => [...list, emptyPayment()])}>
        {t.addPayment}
      </button>
      <div className="acq-money">
        <span>{tx("AMOUNT PAID / FUNDED")}</span>
        <b>{money(preview.funding.amountPaid)}</b>
      </div>
      <div className="acq-money">
        <span>{tx("BALANCE DUE")}</span>
        <b>{money(preview.funding.balanceDue)}</b>
      </div>
      <div className="acq-row">
        <small>{tx("FUNDING HERE DOCUMENTS THE DEAL. BANK PAYMENTS AND VENDOR BILLS REMAIN SEPARATE TRAN$ACT RECORDS, SO THE OBLIGATION IS NEVER COUNTED TWICE.")}</small>
      </div>
      <label className="acq-row">
        <input type="checkbox" checked={financed} onChange={(e) => setFinanced(e.target.checked)} /> {tx("FINANCED / LENDER INVOLVED")}
      </label>
      {financed ? (
        <Field label={tx("LENDER")}>
          <Input value={lenderLabel} onChange={setLenderLabel} />
        </Field>
      ) : null}
      <div className="acq-section">{t.titleLien}</div>
      <div className="acq-grid2">
        <Field label={t.titleRequired}>
          <select value={titleRequired ? "yes" : "no"} onChange={(e) => setTitleRequired(e.target.value === "yes")}>
            <option value="yes">{tx("YES")}</option>
            <option value="no">{tx("NO")}</option>
          </select>
        </Field>
        <Field label={t.titleStatus}>
          <select value={titleStatus} onChange={(e) => setTitleStatus(e.target.value)}>
            <option value="pending">{tx("PENDING")}</option>
            <option value="received">{tx("RECEIVED")}</option>
            <option value="not-required">{tx("NOT REQUIRED")}</option>
            <option value="issue">{tx("ISSUE")}</option>
          </select>
        </Field>
      </div>
      <div className="acq-grid2">
        <Field label={t.lien}>
          <select value={lienStatus} onChange={(e) => setLienStatus(e.target.value)}>
            <option value="none-known">{tx("NONE KNOWN")}</option>
            <option value="disclosed">{tx("DISCLOSED")}</option>
            <option value="release-pending">{tx("RELEASE PENDING")}</option>
            <option value="released">{tx("RELEASED")}</option>
            <option value="disputed">{tx("DISPUTED")}</option>
          </select>
        </Field>
        <Field label={t.clearTitle}>
          <select value={clearTitle} onChange={(e) => setClearTitle(e.target.value)}>
            <option value="yes">{tx("YES")}</option>
            <option value="no">{tx("NO")}</option>
            <option value="unknown">{tx("UNKNOWN")}</option>
          </select>
        </Field>
      </div>
      <Field label={tx("TITLE / DOCUMENT #")}>
        <Input value={titleNumber} onChange={setTitleNumber} />
      </Field>
      <div className="acq-section">{t.condition}</div>
      <div className="acq-grid2">
        <Field label={tx("CONDITION")}>
          <select value={condition} onChange={(e) => setCondition(e.target.value)}>
            <option value="running">{tx("RUNNING")}</option>
            <option value="needs-repair">{tx("NEEDS REPAIR")}</option>
            <option value="salvage">{tx("SALVAGE")}</option>
            <option value="unknown">{tx("UNKNOWN")}</option>
          </select>
        </Field>
        <Field label={t.hours}>
          <Input value={hours} onChange={setHours} inputMode="decimal" />
        </Field>
      </div>
      <Field label={t.issues}>
        <textarea value={knownIssues} onChange={(e) => setKnownIssues(e.target.value)} />
      </Field>
      <Field label={tx("INTAKE EXCEPTIONS / UNDISCLOSED PROBLEMS")}>
        <textarea value={intakeExceptions} onChange={(e) => setIntakeExceptions(e.target.value)} />
      </Field>
      <div className="acq-section">{t.logistics}</div>
      <div className="acq-grid2">
        <Field label={t.purchaseLocation}>
          <Input value={purchaseLocation} onChange={setPurchaseLocation} />
        </Field>
        <Field label={t.deliver}>
          <Input value={deliverTo} onChange={setDeliverTo} />
        </Field>
      </div>
      <div className="acq-grid2">
        <Field label={t.freightResp}>
          <select value={freightResponsibility} onChange={(e) => setFreightResponsibility(e.target.value)}>
            <option value="buyer">{tx("BUYER")}</option>
            <option value="seller">{tx("SELLER")}</option>
            <option value="third-party">{tx("THIRD PARTY")}</option>
          </select>
        </Field>
        <Field label={t.pickup}>
          <input type="date" value={pickupDate} onChange={(e) => setPickupDate(e.target.value)} />
        </Field>
      </div>
      <Field label={t.expected}>
        <input type="date" value={expectedDeliveryDate} onChange={(e) => setExpectedDeliveryDate(e.target.value)} />
      </Field>
      <div className="acq-grid2">
        <Field label={tx("RECEIVED DATE")}><input type="date" value={receivedDate} onChange={(e) => setReceivedDate(e.target.value)} /></Field>
        <Field label={tx("RESPONSIBLE EMPLOYEE")}><Input value={responsibleEmployee} onChange={setResponsibleEmployee} /></Field>
      </div>
      <div className="acq-section">{t.documents}</div>
      <div className="acq-docs">
        <label>
          <input type="file" accept="application/pdf,image/*" multiple hidden onChange={(e) => addDocs(e.target.files)} />
          <button type="button" onClick={(e) => e.currentTarget.parentElement.querySelector("input").click()}>
            {tx("+ BILL OF SALE / INVOICE")}
          </button>
        </label>
        <label>
          <input type="file" accept="application/pdf,image/*" multiple hidden onChange={(e) => addDocs(e.target.files)} />
          <button type="button" onClick={(e) => e.currentTarget.parentElement.querySelector("input").click()}>
            {tx("+ TITLE / LIEN RELEASE")}
          </button>
        </label>
        <label>
          <input type="file" accept="application/pdf,image/*" multiple hidden onChange={(e) => addDocs(e.target.files)} />
          <button type="button" onClick={(e) => e.currentTarget.parentElement.querySelector("input").click()}>
            {tx("+ WIRE / PAYMENT PROOF")}
          </button>
        </label>
        <label>
          <input type="file" accept="application/pdf,image/*" multiple hidden onChange={(e) => addDocs(e.target.files)} />
          <button type="button" onClick={(e) => e.currentTarget.parentElement.querySelector("input").click()}>
            {tx("+ OTHER DOCUMENT")}
          </button>
        </label>
      </div>
      {documents.length ? (
        <div className="acq-row">
          <small>{lang === "es" ? `${documents.length} archivo(s) seleccionado(s). La carga segura debe finalizar antes de registrar esta adquisición.` : `${documents.length} file(s) selected. Secure upload must finish before this acquisition can be recorded.`}</small>
          <button className="acq-secondary" onClick={() => setDocuments([])}>
            {tx("CLEAR SELECTED FILES")}
          </button>
        </div>
      ) : null}
      <div className="acq-section">{t.settlement}</div>
      <label className="acq-row">
        <input type="checkbox" defaultChecked /> {t.returnCapital}
      </label>
      <Field label={tx("ADVANCED SETTLEMENT TERMS")}>
        <textarea value={settlementNotes} onChange={(e) => setSettlementNotes(e.target.value)} />
      </Field>
      <Field label={t.notes}>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
      </Field>
      {Object.keys(errors).length ? <div className="acq-error">{errors.save || (errors.documents && tx("SECURE DOCUMENT UPLOAD IS REQUIRED BEFORE SAVE.")) || (errors.ownership || errors.settlement ? t.ownershipErr : tx("ASSET PASSPORT, ENTITY, ACTOR, SELLER, PURCHASE DATE AND A POSITIVE VALUE ARE REQUIRED."))}</div> : null}
      <button className="acq-primary" onClick={save} disabled={saving}>
        {saving ? tx("RECORDING...") : t.save}
        <small style={{ display: "block", fontSize: 5 }}>{t.saveSub}</small>
      </button>
      <button className="acq-secondary" onClick={() => onBack?.()}>
        {t.back}
      </button>
      <div className="acq-foot">{tx("THIS RECORD ESTABLISHES THE ASSET'S USER-ENTERED OPENING BASIS. IXI DOES NOT PRICE THE ASSET. ACTUAL FREIGHT, REPAIRS, PARTS, LABOR AND TECHNOLOGY REMAIN CANONICAL TRAN$ACT RECORDS AND PROJECT HERE UNTIL THE IN SERVICE CUTOFF.")}</div>
      <IXIAssetAcquisitionStyles />
    </div>
  );
}
