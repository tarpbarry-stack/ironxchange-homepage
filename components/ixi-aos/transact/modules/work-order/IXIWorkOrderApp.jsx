import { useMemo, useState } from "react";
import { createIXIWorkOrderDraft } from "./IXIWorkOrderContract";
import { getIXIWorkOrderActuals } from "./IXIWorkOrderSelectors";
import IXIWorkOrderStyles from "./IXIWorkOrderStyles";
import IXIExpenseApp from "../expense/IXIExpenseApp";
import IXIMaterialApp from "../material/IXIMaterialApp";
import { WorkOrderIcon, LocationIcon, CameraIcon, MicIcon, RepairIcon, PMIcon, InspectIcon, ReadyIcon, FlagIcon, OperableIcon, LimitedIcon, DownIcon, PersonIcon, TeamIcon, CreateIcon, EditIcon, ClockIcon, MaterialIcon, ServiceIcon, ExpenseIcon, PurchaseIcon, DocumentIcon, PauseIcon, StopIcon, RefreshIcon } from "../../IXITransactIcons";

const clean = value => String(value ?? "").trim();
const COPY = {
  en:{new:"NEW WORK ORDER",sub:"Create a new work order",back:"TRAN$ACT",location:"LOCATION",problem:"WHAT NEEDS WORK?",placeholder:"Describe the work or problem...",photo:"ADD PHOTO",voice:"VOICE NOTE",type:"TYPE",repair:"REPAIR",pm:"PM",inspection:"INSPECTION",makeReady:"MAKE READY",priority:"PRIORITY",normal:"NORMAL",high:"HIGH",critical:"CRITICAL",condition:"MACHINE CONDITION",operable:"OPERABLE",limited:"LIMITED",down:"DOWN",assign:"ASSIGN TO",me:"ME",create:"CREATE WORK ORDER",createSub:"CREATE AND START WORK",work:"WORK",cost:"COST",activity:"ACTIVITY",related:"RELATED",assigned:"ASSIGNED TO",crew:"CREW / TEAM",status:"WORK STATUS",description:"WORK DESCRIPTION",add:"ADD TO WORK ORDER",time:"+ TIME",material:"+ MATERIAL",service:"+ SERVICE",expense:"+ EXPENSE",purchase:"+ PURCHASE",document:"+ DOCUMENT",notes:"NOTES",photos:"PHOTOS",pause:"PAUSE WORK",complete:"COMPLETE WORK",inProgress:"IN PROGRESS",created:"CREATED",hold:"ON HOLD",completed:"COMPLETED",timer:"TIMER",running:"RUNNING",stop:"STOP",totalWo:"TOTAL ON WO",viewAll:"VIEW ALL",addNote:"+ ADD NOTE",addPhoto:"+ ADD PHOTO",technician:"TECHNICIAN",locked:"LOCKED"},
  es:{new:"NUEVA ORDEN DE TRABAJO",sub:"Crea una nueva orden de trabajo",back:"TRAN$ACT",location:"UBICACIÓN",problem:"¿QUÉ NECESITA TRABAJO?",placeholder:"Describe el trabajo o problema...",photo:"AGREGAR FOTO",voice:"NOTA DE VOZ",type:"TIPO",repair:"REPARACIÓN",pm:"MANTENIMIENTO",inspection:"INSPECCIÓN",makeReady:"PREPARACIÓN",priority:"PRIORIDAD",normal:"NORMAL",high:"ALTA",critical:"CRÍTICA",condition:"CONDICIÓN DEL EQUIPO",operable:"OPERABLE",limited:"LIMITADA",down:"FUERA DE SERVICIO",assign:"ASIGNAR A",me:"YO",create:"CREAR ORDEN DE TRABAJO",createSub:"CREAR Y COMENZAR EL TRABAJO",work:"TRABAJO",cost:"COSTO",activity:"ACTIVIDAD",related:"RELACIONADO",assigned:"ASIGNADO A",crew:"CUADRILLA / EQUIPO",status:"ESTADO DEL TRABAJO",description:"DESCRIPCIÓN DEL TRABAJO",add:"AGREGAR A LA ORDEN",time:"+ TIEMPO",material:"+ MATERIAL",service:"+ SERVICIO",expense:"+ GASTO",purchase:"+ COMPRA",document:"+ DOCUMENTO",notes:"NOTAS",photos:"FOTOS",pause:"PAUSAR TRABAJO",complete:"TERMINAR TRABAJO",inProgress:"EN PROGRESO",created:"CREADA",hold:"EN ESPERA",completed:"TERMINADA",timer:"TEMPORIZADOR",running:"EN CURSO",stop:"DETENER",totalWo:"TOTAL EN ESTA OT",viewAll:"VER TODO",addNote:"+ AGREGAR NOTA",addPhoto:"+ AGREGAR FOTO",technician:"TÉCNICO",locked:"BLOQUEADO"}
};

function Money({ value = 0 }) {
  return <>${Number(value || 0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</>;
}

export default function IXIWorkOrderApp({ context = {}, initialWorkOrder = null, onBack = null, onCreate = null, onAction = null }) {
  const [lang,setLang] = useState("en");
  const [workOrder,setWorkOrder] = useState(initialWorkOrder || null);
  const [description,setDescription] = useState("");
  const [type,setType] = useState("repair");
  const [priority,setPriority] = useState("normal");
  const [condition,setCondition] = useState("operable");
  const [submodule,setSubmodule] = useState("");
  const t = COPY[lang];
  const actuals = useMemo(() => getIXIWorkOrderActuals(workOrder || {}), [workOrder]);
  const label = context.primary?.label || "AOS OBJECT";
  const actorName = clean(context.actor?.displayName || context.actor?.name || context.actor?.label) || "—";

  function act(id) {
    if (id === "expense" || id === "material") {
      setSubmodule(id);
      return;
    }
    onAction?.(id,workOrder,context);
  }

  function create() {
    const draft = createIXIWorkOrderDraft({ context, input:{ title:clean(description).slice(0,80) || "Work order", description, type, priority, machineCondition:condition, assignedTo:[context.actor || {}] } });
    draft.identity.number = "WO-1058";
    draft.work.status = "in-progress";
    setWorkOrder(draft);
    onCreate?.(draft,context);
  }

  function saveExpense(draft,input,response) {
    const expenseId = clean(draft?.identity?.expenseId) || `EXP-${Date.now()}`;
    setWorkOrder(current => ({
      ...current,
      references:{...(current?.references || {}),expenseIds:[...((current?.references || {}).expenseIds || []),expenseId]},
      financial:{...(current?.financial || {}),otherActual:Number(current?.financial?.otherActual || 0)+Number(input?.amount || 0)}
    }));
    onAction?.("expense-save",workOrder,context,{expense:{...draft,identity:{...(draft?.identity || {}),expenseId}},response});
    setSubmodule("");
  }

  function saveMaterial(draft,input,response) {
    const materialUsageId = clean(draft?.identity?.materialUsageId) || `MAT-${Date.now()}`;
    setWorkOrder(current => ({
      ...current,
      references:{...(current?.references || {}),materialRecordIds:[...((current?.references || {}).materialRecordIds || []),materialUsageId]},
      financial:{...(current?.financial || {}),materialActual:Number(current?.financial?.materialActual || 0)+Number(draft?.material?.extendedCost || 0)}
    }));
    onAction?.("material-save",workOrder,context,{material:{...draft,identity:{...(draft?.identity || {}),materialUsageId}},response});
    setSubmodule("");
  }

  const Lang = () => <div className="wo-lang"><button className={lang === "en" ? "on" : ""} onClick={() => setLang("en")}>ENG</button><i>/</i><button className={lang === "es" ? "on" : ""} onClick={() => setLang("es")}>ESP</button></div>;

  if (workOrder && submodule === "expense") {
    return <IXIExpenseApp context={context} workOrder={workOrder} language={lang} onLanguageChange={setLang} onCancel={() => setSubmodule("")} onSave={saveExpense}/>;
  }

  if (workOrder && submodule === "material") {
    return <IXIMaterialApp context={context} workOrder={workOrder} language={lang} onLanguageChange={setLang} onCancel={() => setSubmodule("")} onSave={saveMaterial}/>;
  }

  if (!workOrder) return <div className="wo-app wo-v13"><Lang/>
    <div className="wo-title"><div className="wo-icon"><WorkOrderIcon size={23}/></div><div><strong>{t.new}</strong><small>{t.sub}</small></div></div>
    <button className="wo-back" onClick={() => onBack?.()}>‹ {t.back}</button>
    <label>{t.location}</label><div className="wo-location"><LocationIcon size={15}/><b>{label}</b><span className="locked">{t.locked}</span></div>
    <label>{t.problem}</label><textarea value={description} onChange={e => setDescription(e.target.value)} placeholder={t.placeholder}/>
    <div className="wo-duo"><button onClick={() => act("photo")}><CameraIcon size={15}/><b>{t.photo}</b></button><button onClick={() => act("voice")}><MicIcon size={15}/><b>{t.voice}</b></button></div>
    <label>{t.type}</label><div className="wo-four"><button className={type === "repair" ? "sel" : ""} onClick={() => setType("repair")}><RepairIcon size={18}/><span>{t.repair}</span></button><button className={type === "pm" ? "sel" : ""} onClick={() => setType("pm")}><PMIcon size={18}/><span>{t.pm}</span></button><button className={type === "inspection" ? "sel" : ""} onClick={() => setType("inspection")}><InspectIcon size={18}/><span>{t.inspection}</span></button><button className={type === "make-ready" ? "sel" : ""} onClick={() => setType("make-ready")}><ReadyIcon size={18}/><span>{t.makeReady}</span></button></div>
    <label>{t.priority}</label><div className="wo-three priority"><button className={priority === "normal" ? "sel" : ""} onClick={() => setPriority("normal")}><FlagIcon size={15}/>{t.normal}</button><button className="high" onClick={() => setPriority("high")}><FlagIcon size={15}/>{t.high}</button><button className="critical" onClick={() => setPriority("critical")}><FlagIcon size={15}/>{t.critical}</button></div>
    <label>{t.condition}</label><div className="wo-three condition"><button className={condition === "operable" ? "sel" : ""} onClick={() => setCondition("operable")}><OperableIcon size={15}/>{t.operable}</button><button onClick={() => setCondition("limited")}><LimitedIcon size={15}/>{t.limited}</button><button className="down" onClick={() => setCondition("down")}><DownIcon size={15}/>{t.down}</button></div>
    <label>{t.assign}</label><div className="wo-assign"><PersonIcon size={16}/><b>{actorName === "—" ? t.me : actorName}</b><span>⌄</span></div>
    <button className="wo-create" onClick={create}><CreateIcon size={19}/><span><b>{t.create}</b><small>{t.createSub}</small></span></button>
    <IXIWorkOrderStyles/>
  </div>;

  const desc = clean(workOrder.work?.description);
  const number = workOrder.identity?.number || "WO-1058";
  return <div className="wo-app wo-v13 wo-work"><Lang/>
    <div className="wo-work-identity"><div className="wo-work-icon"><WorkOrderIcon size={23}/></div><div className="wo-work-copy"><div className="wo-number-row"><strong>{number}</strong><span>{t.inProgress}</span></div><h3>{label}</h3><small>{t.repair}<i>•</i>{t.normal}<i>•</i>{t.operable}</small></div><button className="wo-edit" onClick={() => act("edit-work-order")}><EditIcon size={13}/></button></div>
    <div className="wo-tabs"><button className="active">{t.work}</button><button onClick={() => act("cost")}>{t.cost}</button><button onClick={() => act("activity")}>{t.activity}</button><button onClick={() => act("related")}>{t.related}</button></div>
    <section className="wo-description-card"><label>{t.description}</label><div className="wo-description-body"><p>{desc || "—"}</p><div className="wo-photo-preview"><CameraIcon size={18}/></div></div><div className="wo-duo compact"><button onClick={() => act("photo")}><CameraIcon size={15}/><b>{t.photo}</b></button><button onClick={() => act("voice")}><MicIcon size={15}/><b>{t.voice}</b></button></div></section>
    <section className="wo-person-card"><label>{t.assigned}</label><div><PersonIcon size={18}/><span><b>{actorName}</b><small>{t.technician}</small></span><button onClick={() => act("assign")}><EditIcon size={13}/></button></div></section>
    <section className="wo-person-card"><label>{t.crew}</label><div><TeamIcon size={18}/><span><b>—</b><small>—</small></span><button onClick={() => act("crew")}><EditIcon size={13}/></button></div></section>
    <section className="wo-status-card"><label>{t.status}</label><div className="wo-status-line"><span className="done"/><span className="active"/><span/><span/></div><div className="wo-status-labels"><b>{t.created}</b><b>{t.inProgress}</b><b>{t.hold}</b><b>{t.completed}</b></div></section>
    <section className="wo-timer-card"><label>{t.timer}</label><strong>00:00:00</strong><small>{t.running}</small><button onClick={() => act("stop-time")}><StopIcon size={12}/>{t.stop}</button><div>{t.totalWo}<b>— hr</b><i>|</i><b><Money value={actuals.totalActual}/></b></div></section>
    <section className="wo-add-card"><label>{t.add}</label><div className="wo-six"><button onClick={() => act("time")}><ClockIcon size={18}/>{t.time}</button><button onClick={() => act("material")}><MaterialIcon size={18}/>{t.material}</button><button onClick={() => act("service")}><ServiceIcon size={18}/>{t.service}</button><button onClick={() => act("expense")}><ExpenseIcon size={18}/>{t.expense}</button><button onClick={() => act("purchase-order")}><PurchaseIcon size={18}/>{t.purchase}</button><button onClick={() => act("document")}><DocumentIcon size={18}/>{t.document}</button></div></section>
    <section className="wo-note-card"><div className="head">{t.notes}<button>{t.viewAll}</button></div><div className="empty-note">—</div><button className="wide" onClick={() => act("note")}>{t.addNote}</button></section>
    <section className="wo-photos-card"><div className="head">{t.photos} (0)<button>{t.viewAll}</button></div><div className="thumb-row"><i/><i/><i/></div><button className="wide" onClick={() => act("photo")}>{t.addPhoto}</button></section>
    <div className="wo-bottom"><button onClick={() => act("pause")}><PauseIcon size={16}/>{t.pause}</button><button className="finish" onClick={() => act("complete")}><OperableIcon size={16}/>{t.complete}</button></div>
    <div className="wo-audit"><span>{t.created}: —</span><i>•</i><span>Updated: —</span><RefreshIcon size={11}/></div>
    <IXIWorkOrderStyles/>
  </div>;
}
