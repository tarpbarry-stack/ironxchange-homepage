import { useMemo, useState } from "react";

import { createIXIRentalExpense } from "./IXIRentalExpenseCommands";
import { createIXIRentalExpenseDraft, validateIXIRentalExpense } from "./IXIRentalExpenseContract";
import {
  applyIXIRentalExpenseEconomics,
  extendIXIRentalExpense,
  offRentIXIRentalExpense,
  closeIXIRentalExpense
} from "./IXIRentalExpenseRecordEngine";
import IXIRentalExpenseStyles from "./IXIRentalExpenseStyles";

const clean = value => String(value ?? "").trim();
const money = value => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(value || 0));
const today = () => new Date().toISOString().slice(0, 10);
const emptyCharge = () => ({ type: "other", label: "", amount: "", recurrence: "one-time", notes: "" });

const COPY = {
  en: {
    title: "RENTAL EXPENSE",
    record: "RENTAL EXPENSE RECORD",
    vendor: "RENTED FROM",
    asset: "WHAT ARE WE RENTING?",
    assetType: "ASSET TYPE",
    serial: "SERIAL / UNIT #",
    agreement: "RENTAL AGREEMENT #",
    start: "ON RENT DATE",
    expected: "EXPECTED OFF-RENT",
    rate: "RENTAL RATE",
    rateUnit: "RATE BASIS",
    included: "INCLUDED USAGE",
    overage: "OVERAGE RATE",
    useLocation: "WHERE USED",
    purpose: "PURPOSE / JOB",
    responsible: "RESPONSIBLE EMPLOYEE",
    meter: "METER / CONDITION IN",
    meterType: "METER TYPE",
    startMeter: "START METER",
    fuelOut: "FUEL OUT",
    conditionIn: "CONDITION IN / EXISTING DAMAGE",
    terms: "RENTAL TERMS",
    delivery: "DELIVERY",
    pickup: "PICKUP",
    waiver: "DAMAGE WAIVER",
    insurance: "INSURANCE",
    deposit: "DEPOSIT",
    environmental: "ENVIRONMENTAL / OTHER FEES",
    tax: "EST. TAX",
    fuelRequirement: "FUEL RETURN REQUIREMENT",
    otherTerms: "OTHER TERMS",
    charges: "ADDITIONAL CHARGES",
    addCharge: "+ ADD CHARGE",
    docs: "AGREEMENT / EVIDENCE",
    notes: "NOTES",
    startRental: "START RENTAL",
    startSub: "Create RNTEXP record · custody + projected commitment",
    back: "‹ TRAN$ACT",
    economics: "RENTAL ECONOMICS",
    usage: "USAGE",
    extend: "EXTEND RENTAL",
    offRent: "OFF RENT",
    close: "CLOSE RENTAL",
    history: "ACTIVITY",
    expectedReturn: "EXPECTED RETURN",
    actualOffRent: "ACTUAL OFF-RENT DATE",
    endMeter: "ENDING METER",
    fuelIn: "FUEL IN",
    conditionOut: "CONDITION OUT / DAMAGE",
    returnRef: "RETURN / PICKUP REFERENCE",
    completeOffRent: "COMPLETE OFF-RENT",
    newExpected: "NEW EXPECTED RETURN",
    saveExtension: "SAVE EXTENSION"
  },
  es: {
    title: "GASTO DE RENTA",
    record: "REGISTRO DE GASTO DE RENTA",
    vendor: "RENTADO DE",
    asset: "¿QUÉ ESTAMOS RENTANDO?",
    assetType: "TIPO DE ACTIVO",
    serial: "SERIE / UNIDAD #",
    agreement: "CONTRATO DE RENTA #",
    start: "FECHA DE INICIO",
    expected: "DEVOLUCIÓN ESPERADA",
    rate: "TARIFA DE RENTA",
    rateUnit: "BASE DE TARIFA",
    included: "USO INCLUIDO",
    overage: "TARIFA DE EXCESO",
    useLocation: "DÓNDE SE USA",
    purpose: "PROPÓSITO / TRABAJO",
    responsible: "EMPLEADO RESPONSABLE",
    meter: "MEDIDOR / CONDICIÓN DE ENTRADA",
    meterType: "TIPO DE MEDIDOR",
    startMeter: "MEDIDOR INICIAL",
    fuelOut: "COMBUSTIBLE INICIAL",
    conditionIn: "CONDICIÓN INICIAL / DAÑO EXISTENTE",
    terms: "TÉRMINOS DE RENTA",
    delivery: "ENTREGA",
    pickup: "RECOGIDA",
    waiver: "PROTECCIÓN DE DAÑOS",
    insurance: "SEGURO",
    deposit: "DEPÓSITO",
    environmental: "CARGOS AMBIENTALES / OTROS",
    tax: "IMPUESTO EST.",
    fuelRequirement: "REQUISITO DE COMBUSTIBLE",
    otherTerms: "OTROS TÉRMINOS",
    charges: "CARGOS ADICIONALES",
    addCharge: "+ AGREGAR CARGO",
    docs: "CONTRATO / EVIDENCIA",
    notes: "NOTAS",
    startRental: "INICIAR RENTA",
    startSub: "Crear RNTEXP · custodia + compromiso proyectado",
    back: "‹ TRAN$ACT",
    economics: "ECONOMÍA DE RENTA",
    usage: "USO",
    extend: "EXTENDER RENTA",
    offRent: "TERMINAR RENTA",
    close: "CERRAR RENTA",
    history: "ACTIVIDAD",
    expectedReturn: "DEVOLUCIÓN ESPERADA",
    actualOffRent: "FECHA REAL DE DEVOLUCIÓN",
    endMeter: "MEDIDOR FINAL",
    fuelIn: "COMBUSTIBLE FINAL",
    conditionOut: "CONDICIÓN FINAL / DAÑO",
    returnRef: "REFERENCIA DE DEVOLUCIÓN / RECOGIDA",
    completeOffRent: "COMPLETAR DEVOLUCIÓN",
    newExpected: "NUEVA DEVOLUCIÓN ESPERADA",
    saveExtension: "GUARDAR EXTENSIÓN"
  }
};

function Field({ label, children }) {
  return <div className="rent-field"><label>{label}</label>{children}</div>;
}

function Input({ value, onChange, ...props }) {
  return <input value={value} onChange={event => onChange(event.target.value)} {...props} />;
}

function daysBetween(start, end) {
  if (!start) return 0;
  const a = new Date(`${start}T12:00:00`);
  const b = new Date(`${end || today()}T12:00:00`);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime()) || b < a) return 0;
  return Math.max(1, Math.ceil((b.getTime() - a.getTime()) / 86400000));
}

export default function IXIRentalExpenseApp({
  context = {},
  object = {},
  initialRecord = null,
  relatedTransactions = [],
  language = "en",
  onLanguageChange = null,
  onBack = null,
  onRecordChange = null
}) {
  const primary = context.primary || {};
  const actor = context.actor || {};
  const location = context.location || {};
  const [lang, setLang] = useState(language === "es" ? "es" : "en");
  const t = COPY[lang];
  const [record, setRecord] = useState(initialRecord);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const [vendorName, setVendorName] = useState("");
  const [agreementNumber, setAgreementNumber] = useState("");
  const [assetDescription, setAssetDescription] = useState("");
  const [assetType, setAssetType] = useState("equipment");
  const [serialNumber, setSerialNumber] = useState("");
  const [startDate, setStartDate] = useState(today());
  const [expectedReturnDate, setExpectedReturnDate] = useState("");
  const [baseRate, setBaseRate] = useState("");
  const [rateUnit, setRateUnit] = useState("month");
  const [includedUsage, setIncludedUsage] = useState("");
  const [includedUsageUnit, setIncludedUsageUnit] = useState("hours");
  const [overageRate, setOverageRate] = useState("");
  const [useLocationLabel, setUseLocationLabel] = useState(clean(location.label));
  const [purpose, setPurpose] = useState(clean(primary.label));
  const [responsibleEmployeeLabel, setResponsibleEmployeeLabel] = useState(clean(actor.displayName || actor.name || actor.label));
  const [meterType, setMeterType] = useState("hours");
  const [startMeter, setStartMeter] = useState("");
  const [fuelOut, setFuelOut] = useState("");
  const [conditionIn, setConditionIn] = useState("");
  const [deliveryCharge, setDeliveryCharge] = useState("");
  const [pickupCharge, setPickupCharge] = useState("");
  const [damageWaiver, setDamageWaiver] = useState("");
  const [insurance, setInsurance] = useState("");
  const [deposit, setDeposit] = useState("");
  const [environmentalFee, setEnvironmentalFee] = useState("");
  const [taxesEstimate, setTaxesEstimate] = useState("");
  const [fuelReturnRequirement, setFuelReturnRequirement] = useState("");
  const [otherTerms, setOtherTerms] = useState("");
  const [charges, setCharges] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [notes, setNotes] = useState("");

  const [extendOpen, setExtendOpen] = useState(false);
  const [newExpectedReturn, setNewExpectedReturn] = useState("");
  const [extensionNotes, setExtensionNotes] = useState("");
  const [offRentOpen, setOffRentOpen] = useState(false);
  const [actualOffRentDate, setActualOffRentDate] = useState(today());
  const [endMeter, setEndMeter] = useState("");
  const [fuelIn, setFuelIn] = useState("");
  const [conditionOut, setConditionOut] = useState("");
  const [returnReference, setReturnReference] = useState("");

  const input = useMemo(() => ({
    vendorName,
    agreementNumber,
    assetDescription,
    assetType,
    serialNumber,
    startDate,
    expectedReturnDate,
    baseRate,
    rateUnit,
    includedUsage,
    includedUsageUnit,
    overageRate,
    useLocationLabel,
    purpose,
    responsibleEmployeeLabel,
    meterType,
    startMeter,
    fuelOut,
    conditionIn,
    deliveryCharge,
    pickupCharge,
    damageWaiver,
    insurance,
    deposit,
    environmentalFee,
    taxesEstimate,
    fuelReturnRequirement,
    otherTerms,
    charges,
    documents,
    notes
  }), [vendorName, agreementNumber, assetDescription, assetType, serialNumber, startDate, expectedReturnDate, baseRate, rateUnit, includedUsage, includedUsageUnit, overageRate, useLocationLabel, purpose, responsibleEmployeeLabel, meterType, startMeter, fuelOut, conditionIn, deliveryCharge, pickupCharge, damageWaiver, insurance, deposit, environmentalFee, taxesEstimate, fuelReturnRequirement, otherTerms, charges, documents, notes]);

  const preview = useMemo(() => createIXIRentalExpenseDraft({ context, input }), [context, input]);
  const liveRecord = useMemo(() => record ? applyIXIRentalExpenseEconomics(record, relatedTransactions) : null, [record, relatedTransactions]);

  function changeLang(next) {
    setLang(next);
    onLanguageChange?.(next);
  }

  function updateCharge(index, key, value) {
    setCharges(list => list.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item));
  }

  function addDocs(files, type = "document") {
    const next = Array.from(files || []).map((file, index) => ({
      documentId: `RENT-DOC-${Date.now()}-${index}`,
      type,
      fileName: file.name,
      mimeType: file.type,
      size: file.size,
      status: "local-pending-upload"
    }));
    setDocuments(current => [...current, ...next]);
  }

  async function startRental() {
    const check = validateIXIRentalExpense(preview);
    setErrors(check.errors);
    if (!check.valid) return;
    setSaving(true);
    try {
      const result = await createIXIRentalExpense({
        object: {
          ...object,
          passportId: primary.passportId,
          objectId: primary.objectId,
          objectType: primary.objectType,
          label: primary.label
        },
        context,
        input,
        metadata: { source: "ixi-transact-rental-expense" }
      });
      const next = applyIXIRentalExpenseEconomics(result.record, relatedTransactions);
      setRecord(next);
      setNewExpectedReturn(next.period?.expectedReturnDate || "");
      await onRecordChange?.(next, { action: "create", response: result.response }, context);
    } finally {
      setSaving(false);
    }
  }

  async function saveExtension() {
    try {
      const next = applyIXIRentalExpenseEconomics(extendIXIRentalExpense(record, { expectedReturnDate: newExpectedReturn, notes: extensionNotes }, actor), relatedTransactions);
      setRecord(next);
      setExtendOpen(false);
      setExtensionNotes("");
      await onRecordChange?.(next, { action: "extend", expectedReturnDate: newExpectedReturn }, context);
    } catch (error) {
      setErrors({ extension: error.message });
    }
  }

  async function completeOffRent() {
    try {
      const next = applyIXIRentalExpenseEconomics(offRentIXIRentalExpense(record, { actualOffRentDate, endMeter, fuelIn, conditionOut, returnReference }, actor), relatedTransactions, actualOffRentDate);
      setRecord(next);
      setOffRentOpen(false);
      await onRecordChange?.(next, { action: "off-rent", actualOffRentDate }, context);
    } catch (error) {
      setErrors({ offRent: error.message });
    }
  }

  async function closeRental() {
    try {
      const next = applyIXIRentalExpenseEconomics(closeIXIRentalExpense(record, actor), relatedTransactions, record?.period?.actualOffRentDate);
      setRecord(next);
      await onRecordChange?.(next, { action: "close" }, context);
    } catch (error) {
      setErrors({ close: error.message });
    }
  }

  if (liveRecord) {
    const r = liveRecord;
    const isClosed = r.status === "closed";
    const isOffRent = r.status === "off-rent" || isClosed;
    const expected = clean(r.period?.expectedReturnDate);
    const currentDate = today();
    const overdue = !isOffRent && expected && currentDate > expected;
    const daysOnRent = daysBetween(r.period?.startDate, r.period?.actualOffRentDate || currentDate);
    const overage = Number(r.usage?.overageUsage || 0);

    return <div className="ixi-rentexp">
      <div className="rent-top">
        <div>
          <div className="rent-kicker">IXI TRAN$ACT</div>
          <div className="rent-title">{t.record}</div>
          <div className="rent-id">{r.identity?.number || r.identity?.rentalExpenseId}</div>
        </div>
        <div className="rent-lang"><button className={lang === "en" ? "on" : ""} onClick={() => changeLang("en")}>ENG</button><button className={lang === "es" ? "on" : ""} onClick={() => changeLang("es")}>ESP</button></div>
      </div>

      <div className="rent-context"><strong>{r.rentedAsset?.description}</strong><small>EXTERNAL OWNED · RENTED-IN · {r.custody?.useLocationLabel || r.context?.locationLabel || "NO LOCATION"}</small></div>

      <div className={`rent-status ${isClosed ? "closed" : overdue ? "overdue" : "active"}`}>
        <div className="rent-status-head"><strong className={isClosed ? "rent-ok" : overdue ? "rent-bad" : "rent-warn"}>{isClosed ? "CLOSED" : isOffRent ? "OFF RENT" : overdue ? "PAST EXPECTED RETURN" : "ACTIVE RENTAL"}</strong><b>{daysOnRent} DAYS</b></div>
        <div className="rent-metrics">
          <div className="rent-metric"><span>ON RENT</span><b>{r.period?.startDate || "—"}</b></div>
          <div className="rent-metric"><span>{isOffRent ? "OFF RENT" : "EXPECTED"}</span><b>{r.period?.actualOffRentDate || r.period?.expectedReturnDate || "—"}</b></div>
          <div className="rent-metric"><span>RATE</span><b>{money(r.rate?.baseRate)} / {clean(r.rate?.unit).toUpperCase()}</b></div>
        </div>
        {overdue ? <div className="rent-callout rent-bad">This rental is still active after the expected return date. Projected obligation continues until OFF RENT is recorded.</div> : null}
      </div>

      <div className="rent-section">{t.economics}</div>
      <div className="rent-money"><span>PROJECTED BASE</span><b>{money(r.economics?.projectedBaseCost)}</b></div>
      <div className="rent-money"><span>PROJECTED OVERAGE</span><b className={Number(r.economics?.projectedOverage || 0) > 0 ? "rent-overage" : ""}>{money(r.economics?.projectedOverage)}</b></div>
      <div className="rent-money"><span>PROJECTED ANCILLARY</span><b>{money(r.economics?.projectedAncillaryCost)}</b></div>
      <div className="rent-total"><span>PROJECTED RENTAL COST</span><strong>{money(r.economics?.projectedTotal)}</strong></div>
      <div className="rent-money"><span>ACTUAL BILLED</span><b>{money(r.economics?.billedTotal)}</b></div>
      <div className="rent-money"><span>PAID</span><b>{money(r.economics?.paidTotal)}</b></div>
      <div className="rent-money"><span>VARIANCE TO BILLED</span><b>{money(r.economics?.varianceToBilled)}</b></div>
      <div className="rent-callout">Vendor Bills remain canonical BILL / INVOICE records. This Rental record tracks the contract, custody, usage and projected obligation.</div>

      <div className="rent-section">{t.usage}</div>
      <div className="rent-metrics">
        <div className="rent-metric"><span>START {clean(r.usage?.meterType).toUpperCase()}</span><b>{r.usage?.startMeter ?? "—"}</b></div>
        <div className="rent-metric"><span>USED</span><b>{r.usage?.usage || 0}</b></div>
        <div className="rent-metric"><span>OVERAGE</span><b className={overage > 0 ? "rent-overage" : ""}>{overage}</b></div>
      </div>
      <div className="rent-row"><div className="rent-row-top"><strong>RENTED FROM</strong><b>{r.vendor?.name}</b></div><small>{r.vendor?.agreementNumber ? `AGREEMENT ${r.vendor.agreementNumber}` : "NO AGREEMENT NUMBER"}</small></div>
      <div className="rent-row"><div className="rent-row-top"><strong>RESPONSIBLE</strong><b>{r.custody?.responsibleEmployeeLabel || "—"}</b></div><small>{r.custody?.purpose || r.context?.primaryLabel}</small></div>

      {!isOffRent ? <>
        <div className="rent-action-grid"><button className="rent-secondary" onClick={() => { setNewExpectedReturn(r.period?.expectedReturnDate || ""); setExtendOpen(value => !value); }}>{t.extend}</button><button className="rent-primary" onClick={() => setOffRentOpen(value => !value)}>{t.offRent}</button></div>
        {extendOpen ? <div className="rent-row"><Field label={t.newExpected}><input type="date" value={newExpectedReturn} onChange={event => setNewExpectedReturn(event.target.value)} /></Field><Field label="EXTENSION NOTE"><Input value={extensionNotes} onChange={setExtensionNotes} /></Field><button className="rent-primary" onClick={saveExtension}>{t.saveExtension}</button></div> : null}
        {offRentOpen ? <div className="rent-row"><Field label={t.actualOffRent}><input type="date" value={actualOffRentDate} onChange={event => setActualOffRentDate(event.target.value)} /></Field><div className="rent-grid2"><Field label={t.endMeter}><Input value={endMeter} onChange={setEndMeter} inputMode="decimal" /></Field><Field label={t.fuelIn}><Input value={fuelIn} onChange={setFuelIn} /></Field></div><Field label={t.conditionOut}><textarea value={conditionOut} onChange={event => setConditionOut(event.target.value)} /></Field><Field label={t.returnRef}><Input value={returnReference} onChange={setReturnReference} /></Field><button className="rent-primary" onClick={completeOffRent}>{t.completeOffRent}</button></div> : null}
      </> : !isClosed ? <button className="rent-primary" onClick={closeRental}>{t.close}</button> : null}

      <div className="rent-section">{t.history}</div>
      <div className="rent-history">{(r.activity || []).slice().reverse().map(item => <div className="rent-row" key={item.eventId}><div className="rent-row-top"><strong>{clean(item.type).replace(/-/g, " ").toUpperCase()}</strong><b>{clean(item.nextExpectedReturnDate || item.actualOffRentDate || "")}</b></div><small>{item.actorLabel || r.audit?.createdByLabel} · {item.occurredAt}</small></div>)}</div>

      {Object.keys(errors).length ? <div className="rent-error">{Object.values(errors).join(" · ")}</div> : null}
      <button className="rent-secondary" onClick={() => onBack?.()}>{t.back}</button>
      <div className="rent-foot">Rental Expense records temporary custody of an externally owned asset. OFF RENT stops projected accrual; vendor Bills and Payments remain separate canonical financial records.</div>
      <IXIRentalExpenseStyles />
    </div>;
  }

  return <div className="ixi-rentexp">
    <div className="rent-top">
      <div><div className="rent-kicker">IXI TRAN$ACT</div><div className="rent-title">{t.title}</div></div>
      <div className="rent-lang"><button className={lang === "en" ? "on" : ""} onClick={() => changeLang("en")}>ENG</button><button className={lang === "es" ? "on" : ""} onClick={() => changeLang("es")}>ESP</button></div>
    </div>
    <div className="rent-context"><strong>{primary.label || "AOS CONTEXT"}</strong><small>{primary.objectType || "AOS OBJECT"} · {location.label || "NO LOCATION"} · {responsibleEmployeeLabel || "NO EMPLOYEE"}</small></div>

    <div className="rent-section">RENTAL</div>
    <Field label={t.vendor}><Input value={vendorName} onChange={setVendorName} /></Field>
    <Field label={t.asset}><Input value={assetDescription} onChange={setAssetDescription} placeholder="2022 CAT 336 / Generator / Trailer..." /></Field>
    <div className="rent-grid2"><Field label={t.assetType}><select value={assetType} onChange={event => setAssetType(event.target.value)}><option value="equipment">EQUIPMENT</option><option value="machine">MACHINE</option><option value="vehicle">VEHICLE</option><option value="truck">TRUCK</option><option value="trailer">TRAILER</option><option value="tool">TOOL</option><option value="technology">TECHNOLOGY</option><option value="facility">FACILITY</option><option value="storage">STORAGE</option><option value="other">OTHER</option></select></Field><Field label={t.serial}><Input value={serialNumber} onChange={setSerialNumber} /></Field></div>
    <Field label={t.agreement}><Input value={agreementNumber} onChange={setAgreementNumber} /></Field>

    <div className="rent-section">PERIOD / RATE</div>
    <div className="rent-grid2"><Field label={t.start}><input type="date" value={startDate} onChange={event => setStartDate(event.target.value)} /></Field><Field label={t.expected}><input type="date" value={expectedReturnDate} onChange={event => setExpectedReturnDate(event.target.value)} /></Field></div>
    <div className="rent-grid2"><Field label={t.rate}><Input value={baseRate} onChange={setBaseRate} inputMode="decimal" /></Field><Field label={t.rateUnit}><select value={rateUnit} onChange={event => setRateUnit(event.target.value)}><option value="hour">HOUR</option><option value="day">DAY</option><option value="week">WEEK</option><option value="month">MONTH</option></select></Field></div>
    <div className="rent-grid2"><Field label={t.included}><Input value={includedUsage} onChange={setIncludedUsage} inputMode="decimal" /></Field><Field label={t.overage}><Input value={overageRate} onChange={setOverageRate} inputMode="decimal" /></Field></div>

    <div className="rent-section">CONTEXT / CUSTODY</div>
    <Field label={t.useLocation}><Input value={useLocationLabel} onChange={setUseLocationLabel} /></Field>
    <Field label={t.purpose}><Input value={purpose} onChange={setPurpose} /></Field>
    <Field label={t.responsible}><Input value={responsibleEmployeeLabel} onChange={setResponsibleEmployeeLabel} /></Field>

    <div className="rent-section">{t.meter}</div>
    <div className="rent-grid2"><Field label={t.meterType}><select value={meterType} onChange={event => setMeterType(event.target.value)}><option value="hours">HOURS</option><option value="miles">MILES</option><option value="none">NONE</option></select></Field><Field label={t.startMeter}><Input value={startMeter} onChange={setStartMeter} inputMode="decimal" /></Field></div>
    <Field label={t.fuelOut}><Input value={fuelOut} onChange={setFuelOut} placeholder="FULL / 3/4 / 50%" /></Field>
    <Field label={t.conditionIn}><textarea value={conditionIn} onChange={event => setConditionIn(event.target.value)} /></Field>

    <div className="rent-section">{t.terms}</div>
    <div className="rent-grid2"><Field label={t.delivery}><Input value={deliveryCharge} onChange={setDeliveryCharge} inputMode="decimal" /></Field><Field label={t.pickup}><Input value={pickupCharge} onChange={setPickupCharge} inputMode="decimal" /></Field><Field label={t.waiver}><Input value={damageWaiver} onChange={setDamageWaiver} inputMode="decimal" /></Field><Field label={t.insurance}><Input value={insurance} onChange={setInsurance} inputMode="decimal" /></Field><Field label={t.deposit}><Input value={deposit} onChange={setDeposit} inputMode="decimal" /></Field><Field label={t.environmental}><Input value={environmentalFee} onChange={setEnvironmentalFee} inputMode="decimal" /></Field></div>
    <Field label={t.tax}><Input value={taxesEstimate} onChange={setTaxesEstimate} inputMode="decimal" /></Field>
    <Field label={t.fuelRequirement}><Input value={fuelReturnRequirement} onChange={setFuelReturnRequirement} /></Field>
    <Field label={t.otherTerms}><textarea value={otherTerms} onChange={event => setOtherTerms(event.target.value)} /></Field>

    <div className="rent-section">{t.charges}</div>
    {charges.map((charge, index) => <div className="rent-row" key={index}><div className="rent-grid2"><Field label="TYPE"><select value={charge.type} onChange={event => updateCharge(index, "type", event.target.value)}><option value="other">OTHER</option><option value="delivery">DELIVERY</option><option value="pickup">PICKUP</option><option value="fuel">FUEL</option><option value="waiver">DAMAGE WAIVER</option><option value="environmental">ENVIRONMENTAL</option></select></Field><Field label="AMOUNT"><Input value={charge.amount} onChange={value => updateCharge(index, "amount", value)} inputMode="decimal" /></Field></div><Field label="LABEL"><Input value={charge.label} onChange={value => updateCharge(index, "label", value)} /></Field><div className="rent-grid2"><Field label="RECURRENCE"><select value={charge.recurrence} onChange={event => updateCharge(index, "recurrence", event.target.value)}><option value="one-time">ONE TIME</option><option value="per-period">PER PERIOD</option></select></Field><button className="rent-secondary" onClick={() => setCharges(list => list.filter((_, itemIndex) => itemIndex !== index))}>REMOVE</button></div></div>)}
    <button className="rent-secondary" onClick={() => setCharges(list => [...list, emptyCharge()])}>{t.addCharge}</button>

    <div className="rent-total"><span>STARTING PROJECTED COMMITMENT</span><strong>{money(Number(baseRate || 0) + Number(deliveryCharge || 0) + Number(pickupCharge || 0) + Number(damageWaiver || 0) + Number(insurance || 0) + Number(environmentalFee || 0) + Number(taxesEstimate || 0))}</strong></div>

    <div className="rent-section">{t.docs}</div>
    <div className="rent-docs">
      <label><input type="file" accept="application/pdf,image/*" hidden multiple onChange={event => addDocs(event.target.files, "rental-agreement")} /><button type="button" onClick={event => event.currentTarget.parentElement.querySelector("input").click()}>+ RENTAL AGREEMENT</button></label>
      <label><input type="file" accept="image/*" hidden multiple onChange={event => addDocs(event.target.files, "condition-photo")} /><button type="button" onClick={event => event.currentTarget.parentElement.querySelector("input").click()}>+ CONDITION PHOTOS</button></label>
      <label><input type="file" accept="application/pdf,image/*" hidden multiple onChange={event => addDocs(event.target.files, "delivery-ticket")} /><button type="button" onClick={event => event.currentTarget.parentElement.querySelector("input").click()}>+ DELIVERY TICKET</button></label>
      <label><input type="file" accept="application/pdf,image/*" hidden multiple onChange={event => addDocs(event.target.files, "other")} /><button type="button" onClick={event => event.currentTarget.parentElement.querySelector("input").click()}>+ OTHER</button></label>
    </div>
    {documents.length ? <div className="rent-row"><small>{documents.length} document(s) staged for canonical attachment.</small></div> : null}

    <Field label={t.notes}><textarea value={notes} onChange={event => setNotes(event.target.value)} /></Field>
    {Object.keys(errors).length ? <div className="rent-error">RENTED FROM, ASSET, START DATE, EXPECTED RETURN AND RATE ARE REQUIRED.</div> : null}
    <button className="rent-primary" onClick={startRental} disabled={saving}>{saving ? "STARTING..." : t.startRental}<small style={{ display: "block", fontSize: 5 }}>{t.startSub}</small></button>
    <button className="rent-secondary" onClick={() => onBack?.()}>{t.back}</button>
    <div className="rent-foot">RNTEXP records temporary custody of somebody else's asset. It creates a rental commitment, not a vendor Bill and not a payment.</div>
    <IXIRentalExpenseStyles />
  </div>;
}
