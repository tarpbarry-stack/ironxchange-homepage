import { useMemo, useState } from "react";
import { createIXIWorkOrderDraft } from "./IXIWorkOrderContract";
import { getIXIWorkOrderActuals } from "./IXIWorkOrderSelectors";
import {
  WorkOrderIcon,
  LocationIcon,
  CameraIcon,
  MicIcon,
  RepairIcon,
  PMIcon,
  InspectIcon,
  ReadyIcon,
  FlagIcon,
  OperableIcon,
  LimitedIcon,
  DownIcon,
  PersonIcon,
  CreateIcon
} from "../../IXITransactIcons";

const clean = value => String(value ?? "").trim();

const COPY = {
  en: {
    new: "NEW WORK ORDER",
    sub: "Create a new work order",
    back: "TRAN$ACT",
    location: "LOCATION",
    problem: "WHAT NEEDS WORK?",
    placeholder: "Describe the work or problem...",
    photo: "ADD PHOTO",
    voice: "VOICE NOTE",
    type: "TYPE",
    repair: "REPAIR",
    pm: "PM",
    inspection: "INSPECTION",
    makeReady: "MAKE READY",
    priority: "PRIORITY",
    normal: "NORMAL",
    high: "HIGH",
    critical: "CRITICAL",
    condition: "MACHINE CONDITION",
    operable: "OPERABLE",
    limited: "LIMITED",
    down: "DOWN",
    assign: "ASSIGN TO",
    me: "ME",
    create: "CREATE WORK ORDER",
    createSub: "CREATE AND START WORK",
    work: "WORK",
    cost: "COST",
    activity: "ACTIVITY",
    related: "RELATED",
    assigned: "ASSIGNED TO",
    status: "WORK STATUS",
    description: "WORK DESCRIPTION",
    add: "ADD TO WORK ORDER",
    time: "+ TIME",
    material: "+ MATERIAL",
    service: "+ SERVICE",
    expense: "+ EXPENSE",
    purchase: "+ PURCHASE",
    document: "+ DOCUMENT",
    notes: "NOTES",
    photos: "PHOTOS",
    pause: "PAUSE WORK",
    complete: "COMPLETE WORK",
    inProgress: "IN PROGRESS"
  },
  es: {
    new: "NUEVA ORDEN DE TRABAJO",
    sub: "Crea una nueva orden de trabajo",
    back: "TRAN$ACT",
    location: "UBICACIÓN",
    problem: "¿QUÉ NECESITA TRABAJO?",
    placeholder: "Describe el trabajo o problema...",
    photo: "AGREGAR FOTO",
    voice: "NOTA DE VOZ",
    type: "TIPO",
    repair: "REPARACIÓN",
    pm: "MANTENIMIENTO",
    inspection: "INSPECCIÓN",
    makeReady: "PREPARACIÓN",
    priority: "PRIORIDAD",
    normal: "NORMAL",
    high: "ALTA",
    critical: "CRÍTICA",
    condition: "CONDICIÓN DEL EQUIPO",
    operable: "OPERABLE",
    limited: "LIMITADA",
    down: "FUERA DE SERVICIO",
    assign: "ASIGNAR A",
    me: "YO",
    create: "CREAR ORDEN DE TRABAJO",
    createSub: "CREAR Y COMENZAR EL TRABAJO",
    work: "TRABAJO",
    cost: "COSTO",
    activity: "ACTIVIDAD",
    related: "RELACIONADO",
    assigned: "ASIGNADO A",
    status: "ESTADO DEL TRABAJO",
    description: "DESCRIPCIÓN DEL TRABAJO",
    add: "AGREGAR A LA ORDEN",
    time: "+ TIEMPO",
    material: "+ MATERIAL",
    service: "+ SERVICIO",
    expense: "+ GASTO",
    purchase: "+ COMPRA",
    document: "+ DOCUMENTO",
    notes: "NOTAS",
    photos: "FOTOS",
    pause: "PAUSAR TRABAJO",
    complete: "TERMINAR TRABAJO",
    inProgress: "EN PROGRESO"
  }
};

export default function IXIWorkOrderApp({
  context = {},
  initialWorkOrder = null,
  onBack = null,
  onCreate = null,
  onAction = null
}) {
  const [lang, setLang] = useState("en");
  const t = COPY[lang];
  const [workOrder, setWorkOrder] = useState(initialWorkOrder || null);
  const [description, setDescription] = useState("");
  const [type, setType] = useState("repair");
  const [priority, setPriority] = useState("normal");
  const [condition, setCondition] = useState("operable");
  const actuals = useMemo(() => getIXIWorkOrderActuals(workOrder || {}), [workOrder]);
  const label = context.primary?.label || "AOS OBJECT";

  function act(id) {
    onAction?.(id, workOrder, context);
  }

  function create() {
    if (!clean(description)) return;

    const draft = createIXIWorkOrderDraft({
      context,
      input: {
        title: clean(description).slice(0, 80),
        description,
        type,
        priority,
        machineCondition: condition,
        assignedTo: [context.actor || {}]
      }
    });

    draft.identity.number = "WO-1058";
    draft.work.status = "in-progress";
    setWorkOrder(draft);
    onCreate?.(draft, context);
  }

  const Lang = () => (
    <div className="wo-lang">
      <button className={lang === "en" ? "on" : ""} onClick={() => setLang("en")}>ENG</button>
      <i>/</i>
      <button className={lang === "es" ? "on" : ""} onClick={() => setLang("es")}>ESP</button>
    </div>
  );

  if (!workOrder) {
    return (
      <div className="wo-app wo-v13">
        <Lang />

        <div className="wo-title">
          <div className="wo-icon"><WorkOrderIcon size={23} /></div>
          <div>
            <strong>{t.new}</strong>
            <small>{t.sub}</small>
          </div>
        </div>

        <button className="wo-back" onClick={() => onBack?.()}>‹ {t.back}</button>

        <label>{t.location}</label>
        <div className="wo-location">
          <LocationIcon size={15} />
          <b>{label}</b>
          <span className="locked">LOCKED</span>
        </div>

        <label>{t.problem}</label>
        <textarea
          value={description}
          onChange={event => setDescription(event.target.value)}
          placeholder={t.placeholder}
        />

        <div className="wo-duo">
          <button onClick={() => act("photo")}><CameraIcon size={15} /><b>{t.photo}</b></button>
          <button onClick={() => act("voice")}><MicIcon size={15} /><b>{t.voice}</b></button>
        </div>

        <label>{t.type}</label>
        <div className="wo-four">
          <button className={type === "repair" ? "sel" : ""} onClick={() => setType("repair")}><RepairIcon size={18} /><span>{t.repair}</span></button>
          <button className={type === "pm" ? "sel" : ""} onClick={() => setType("pm")}><PMIcon size={18} /><span>{t.pm}</span></button>
          <button className={type === "inspection" ? "sel" : ""} onClick={() => setType("inspection")}><InspectIcon size={18} /><span>{t.inspection}</span></button>
          <button className={type === "make-ready" ? "sel" : ""} onClick={() => setType("make-ready")}><ReadyIcon size={18} /><span>{t.makeReady}</span></button>
        </div>

        <label>{t.priority}</label>
        <div className="wo-three priority">
          <button className={priority === "normal" ? "sel" : ""} onClick={() => setPriority("normal")}><FlagIcon size={15} />{t.normal}</button>
          <button className={priority === "high" ? "high sel2" : "high"} onClick={() => setPriority("high")}><FlagIcon size={15} />{t.high}</button>
          <button className={priority === "critical" ? "critical sel2" : "critical"} onClick={() => setPriority("critical")}><FlagIcon size={15} />{t.critical}</button>
        </div>

        <label>{t.condition}</label>
        <div className="wo-three condition">
          <button className={condition === "operable" ? "sel" : ""} onClick={() => setCondition("operable")}><OperableIcon size={15} />{t.operable}</button>
          <button className={condition === "limited" ? "sel2" : ""} onClick={() => setCondition("limited")}><LimitedIcon size={15} />{t.limited}</button>
          <button className={condition === "down" ? "down sel2" : "down"} onClick={() => setCondition("down")}><DownIcon size={15} />{t.down}</button>
        </div>

        <label>{t.assign}</label>
        <div className="wo-assign">
          <PersonIcon size={16} />
          <b>{t.me}</b>
          <span>⌄</span>
        </div>

        <button className="wo-create" onClick={create}>
          <CreateIcon size={19} />
          <span><b>{t.create}</b><small>{t.createSub}</small></span>
        </button>

        <Styles />
      </div>
    );
  }

  return (
    <div className="wo-app wo-v13">
      <Lang />

      <div className="wo-live">
        <div>
          <span>IXI TRAN$ACT</span>
          <strong>{workOrder.identity?.number || "WO-1058"}</strong>
          <b>{t.inProgress}</b>
        </div>
        <h3>{label}</h3>
        <small>{t.repair} · {t.normal} · {t.operable}</small>
      </div>

      <div className="wo-tabs">
        <button className="active">{t.work}</button>
        <button onClick={() => act("cost")}>{t.cost}</button>
        <button onClick={() => act("activity")}>{t.activity}</button>
        <button onClick={() => act("related")}>{t.related}</button>
      </div>

      <section className="wo-assigned">
        <label>{t.assigned}</label>
        <b>John Carter</b>
        <span>✎</span>
      </section>

      <section>
        <div className="wo-status">
          <label>{t.status}</label>
          <button>{t.inProgress} ›</button>
        </div>
        <label>{t.description}</label>
        <div className="wo-desc">
          <p>{workOrder.work?.description}</p>
          <div className="wo-photo"><CameraIcon size={20} /></div>
        </div>
        <div className="wo-duo">
          <button onClick={() => act("photo")}><CameraIcon size={14} /><b>{t.photo}</b></button>
          <button onClick={() => act("voice")}><MicIcon size={14} /><b>{t.voice}</b></button>
        </div>
      </section>

      <label>{t.add}</label>
      <div className="wo-six">
        <button onClick={() => act("time")}>{t.time}</button>
        <button onClick={() => act("material")}>{t.material}</button>
        <button onClick={() => act("service")}>{t.service}</button>
        <button onClick={() => act("expense")}>{t.expense}</button>
        <button onClick={() => act("purchase-order")}>{t.purchase}</button>
        <button onClick={() => act("document")}>{t.document}</button>
      </div>

      <div className="wo-lower">
        <section>
          <div className="head">{t.notes}<span>View All</span></div>
          <p>Checked for leaks at connections. Found damage near cylinder.</p>
        </section>
        <section>
          <div className="head">{t.photos} (3)<span>View All</span></div>
          <div className="thumbs"><i /><i /><i /></div>
        </section>
      </div>

      <div className="wo-costline">
        <span>ACTUAL</span><b>${actuals.totalActual.toLocaleString()}</b>
        <span>COMMITTED</span><b>${actuals.committed.toLocaleString()}</b>
      </div>

      <div className="wo-bottom">
        <button onClick={() => act("pause")}>Ⅱ {t.pause}</button>
        <button className="finish" onClick={() => act("complete")}>✓ {t.complete}</button>
      </div>

      <Styles />
    </div>
  );
}

function Styles() {
  return (
    <style jsx global>{`
      .wo-app,.wo-app *{box-sizing:border-box}
      .wo-app{position:relative;min-height:100%;padding:0 2px 10px;color:#eef0ee;font-family:"Arial Narrow","Roboto Condensed",Arial,sans-serif;font-stretch:condensed}
      .wo-lang{position:absolute;right:2px;top:1px;display:flex;gap:2px;align-items:center;z-index:5}
      .wo-lang button{border:0;background:none;color:#666;font-size:6.5px;font-weight:950;padding:2px}
      .wo-lang button.on{color:#ffc400}.wo-lang i{font-size:6px;color:#444}
      .wo-title{height:55px;display:flex;align-items:center;gap:9px;border-bottom:1px solid #292d2a}
      .wo-title .wo-icon{width:38px;height:38px;display:grid;place-items:center;flex:none;border:1.5px solid #ffc400;border-radius:8px;background:radial-gradient(circle at 40% 25%,rgba(255,196,0,.16),transparent 62%),linear-gradient(#16170f,#0c0e0c);color:#ffc400;box-shadow:inset 0 1px rgba(255,255,255,.08),0 0 12px rgba(255,196,0,.08)}
      .wo-title strong{display:block;font-size:16px;line-height:.96;font-weight:950;letter-spacing:-.035em}
      .wo-title small{display:block;margin-top:4px;color:#a5aaa6;font:700 7px Arial,sans-serif}
      .wo-back{height:25px;margin:7px 0 1px;padding:0 9px;border:1px solid #3a3e3b;border-radius:5px;background:linear-gradient(#141615,#090b0a);color:#ffc400;font-size:6.5px;font-weight:950}
      .wo-app label{display:block;margin:7px 2px 4px;color:#a2a7a3;font-size:6.5px;font-weight:950;letter-spacing:.04em}
      .wo-location,.wo-assign{height:36px;display:flex;align-items:center;gap:8px;padding:0 10px;border:1px solid #aa8300;border-radius:6px;background:linear-gradient(#141716,#0d0f0e);color:#ffc400;box-shadow:inset 0 1px rgba(255,255,255,.04),inset 0 -6px 14px rgba(0,0,0,.12)}
      .wo-location b,.wo-assign b{flex:1;color:#f2f3f1;font-size:9px;letter-spacing:.01em}
      .wo-location .locked{font-size:4.5px;color:#6f746f;letter-spacing:.08em}
      .wo-app textarea{width:100%;height:66px;padding:10px;border:1px solid #3a3e3b;border-radius:6px;background:linear-gradient(#121514,#0c0e0d);color:#f3f4f3;font:700 8.5px/1.4 Arial,sans-serif;resize:none;outline:none;box-shadow:inset 0 2px 8px rgba(0,0,0,.28)}
      .wo-app textarea::placeholder{color:#858b87}
      .wo-duo{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:7px}
      .wo-duo button,.wo-bottom button{height:37px;display:flex;align-items:center;justify-content:center;gap:7px;border:1px solid #3b3f3c;border-radius:6px;background:linear-gradient(#171a18,#0d0f0e);color:#e5e7e5;font-size:7px;font-weight:950}
      .wo-duo button svg{color:#ffc400}
      .wo-four{display:grid;grid-template-columns:repeat(4,1fr);gap:5px}
      .wo-four button{height:55px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;border:1px solid #3a3e3b;border-radius:6px;background:linear-gradient(#181b19,#0e100f);color:#aeb3af;box-shadow:inset 0 1px rgba(255,255,255,.04),inset 0 -8px 16px rgba(0,0,0,.12)}
      .wo-four button span{font-size:6px;font-weight:950}
      .wo-four button.sel{border-color:#e0ad00;background:radial-gradient(circle at 50% 25%,rgba(255,196,0,.24),transparent 62%),linear-gradient(#2a2208,#171407);color:#ffc400}
      .wo-three{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}
      .wo-three button{height:38px;display:flex;align-items:center;justify-content:center;gap:6px;border:1px solid #3a3e3b;border-radius:6px;background:linear-gradient(#171a18,#0e100f);color:#b8bdb9;font-size:7px;font-weight:950}
      .priority button.sel{border-color:#e0ad00;background:linear-gradient(135deg,#2c2409,#171407);color:#ffc400}
      .priority .high svg{color:#ff7a18}.priority .critical svg,.condition .down svg{color:#f33}
      .condition button.sel{border-color:#5d8e25;background:linear-gradient(135deg,#17220d,#0e130a);color:#9ee548}
      .wo-assign{border-color:#3b3f3c}.wo-assign span{color:#bbb;font-size:12px}
      .wo-create{width:100%;height:51px;margin-top:10px;display:flex;align-items:center;justify-content:center;gap:10px;border:1px solid #ffd52d;border-radius:6px;background:linear-gradient(#ffd52e,#ffc20a 56%,#e8a800);color:#0b0c0b;box-shadow:inset 0 1px rgba(255,255,255,.52),0 5px 15px rgba(255,183,0,.13)}
      .wo-create>span{display:block}.wo-create b{display:block;font-size:10px;font-weight:950}.wo-create small{display:block;margin-top:2px;font-size:6px;font-weight:900}
      .wo-live{padding:3px 3px 7px;border-bottom:1px solid #2d302e}.wo-live div{display:flex;align-items:center;gap:7px}.wo-live span{color:#ffc400;font-size:6px;font-weight:950}.wo-live strong{font-size:17px}.wo-live b{padding:3px 5px;border-radius:3px;background:#273400;color:#a8df19;font-size:5.5px}.wo-live h3{margin:5px 0 0;font-size:9px}.wo-live small{color:#a0a4a1;font-size:6px}
      .wo-tabs{height:31px;display:grid;grid-template-columns:repeat(4,1fr);border-bottom:1px solid #2d302e}.wo-tabs button{position:relative;border:0;background:none;color:#919692;font-size:6px;font-weight:950}.wo-tabs button.active{color:#f4f5f4}.wo-tabs button.active:after{content:"";position:absolute;left:8px;right:8px;bottom:-1px;height:2px;background:#ffc400}
      .wo-app section{margin-top:6px;padding:7px;border:1px solid #313532;border-radius:5px;background:linear-gradient(180deg,#121514,#0e100f)}
      .wo-assigned{position:relative}.wo-assigned label{margin:0}.wo-assigned b{font-size:8px}.wo-assigned span{position:absolute;right:8px;top:12px;color:#b5b8b6}
      .wo-status{display:flex;justify-content:space-between;align-items:center}.wo-status label{margin:0}.wo-status button{height:22px;border:1px solid #3f5212;border-radius:3px;background:#172000;color:#a8df19;font-size:5.5px;font-weight:950}
      .wo-desc{display:grid;grid-template-columns:1fr 50px;gap:5px}.wo-desc p{margin:0;padding:7px;background:#0b0d0c;border:1px solid #262927;border-radius:3px;color:#dfe1df;font-size:7px;line-height:1.45}.wo-photo{display:grid;place-items:center;border:1px solid #555;border-radius:3px;background:linear-gradient(135deg,#c28f24,#303833);color:#ffc400}
      .wo-six{display:grid;grid-template-columns:repeat(3,1fr);gap:4px}.wo-six button{height:34px;border:1px solid #343735;border-radius:5px;background:linear-gradient(#141716,#0e100f);color:#e4e6e4;font-size:5.8px;font-weight:950}.wo-six button:first-child{color:#a7d91e}.wo-six button:nth-child(2){color:#74b9ff}.wo-six button:nth-child(3){color:#c98cff}.wo-six button:nth-child(4){color:#ffc400}
      .wo-lower{display:grid;grid-template-columns:1fr 1fr;gap:5px}.wo-lower .head{color:#b7bbb8;font-size:5.5px;font-weight:950}.wo-lower .head span{float:right;color:#ffc400}.wo-lower p{margin:5px 0 0;font-size:6px;line-height:1.35}.thumbs{display:flex;gap:3px;margin-top:5px}.thumbs i{width:31%;height:31px;border:1px solid #4d4f4d;border-radius:3px;background:linear-gradient(135deg,#bd8c24,#252b28)}
      .wo-costline{display:grid;grid-template-columns:1fr 1fr 1fr 1fr;align-items:center;margin-top:6px;padding:6px;border-top:1px solid #303330;color:#8b908c;font-size:5px}.wo-costline b{color:#e7e9e7;font-size:7.5px}.wo-bottom{display:grid;grid-template-columns:1fr 1fr;gap:5px;margin-top:6px}.wo-bottom .finish{border-color:#9b7800;color:#ffc400;background:rgba(255,196,0,.05)}
    `}</style>
  );
}
