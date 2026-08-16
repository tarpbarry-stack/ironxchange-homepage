const clean=v=>String(v??"").trim();
const obj=v=>v&&typeof v==="object"&&!Array.isArray(v)?v:{};
const arr=v=>Array.isArray(v)?v:[];

export const IXI_WORK_ORDER_SCHEMA="ixi-work-order-v1";
export const IXI_WORK_ORDER_STATUSES=Object.freeze(["requested","open","scheduled","in-progress","waiting","complete","closed","canceled"]);
export const IXI_WORK_ORDER_WAIT_REASONS=Object.freeze(["parts","vendor","approval","machine","other"]);
export const IXI_WORK_ORDER_TYPES=Object.freeze(["repair","pm","inspection","make-ready","facility","fabrication","transport-prep","other"]);
export const IXI_MACHINE_CONDITIONS=Object.freeze(["operable","limited","down"]);
export const IXI_WORK_ORDER_RESULTS=Object.freeze(["fully-functioning","functional-with-notes","further-work-required","unresolved"]);

function money(value){const n=Number(value);return Number.isFinite(n)?Math.round(n*100)/100:0}

export function createIXIWorkOrderDraft({context={},input={}}={}){
  const c=obj(context),i=obj(input),primary=obj(c.primary),entity=obj(c.entity),location=obj(c.location),actor=obj(c.actor);
  return {
    schema:IXI_WORK_ORDER_SCHEMA,
    identity:{workOrderId:clean(i.workOrderId),number:clean(i.number)},
    context:{
      entityPassportId:clean(i.entityPassportId||entity.passportId),
      primaryPassportId:clean(i.primaryPassportId||primary.passportId),
      primaryObjectId:clean(i.primaryObjectId||primary.objectId),
      primaryObjectType:clean(i.primaryObjectType||primary.objectType),
      primaryLabel:clean(i.primaryLabel||primary.label),
      locationPassportId:clean(i.locationPassportId||location.passportId),
      locationLabel:clean(i.locationLabel||location.label),
      jobPassportId:clean(i.jobPassportId)
    },
    work:{
      type:clean(i.type||"repair"),title:clean(i.title),description:clean(i.description),
      priority:clean(i.priority||"normal"),machineCondition:clean(i.machineCondition||"operable"),
      status:clean(i.status||"open"),waitingReason:clean(i.waitingReason)
    },
    people:{
      requestedBy:{passportId:clean(actor.passportId),userId:clean(actor.userId),employeeId:clean(actor.employeeId),label:clean(actor.label)},
      assignedTo:arr(i.assignedTo),completedBy:null
    },
    dates:{requestedAt:clean(i.requestedAt||c.launchedAt||new Date().toISOString()),scheduledAt:"",startedAt:"",completedAt:"",closedAt:""},
    result:{disposition:"",finalMachineCondition:"",workPerformed:"",recommendations:""},
    references:{
      timeEntryIds:[],
      materialRecordIds:[],
      serviceRecordIds:[],
      expenseIds:[],
      purchaseRequestIds:[],
      purchaseOrderIds:[],
      billIds:[],
      technologyWorkIds:[],
      attachmentIds:[],
      photoIds:[],
      noteIds:[]
    },
    financial:{
      laborActual:0,
      materialActual:0,
      serviceActual:0,
      otherActual:0,
      requested:0,
      committed:0,
      estimated:money(i.estimated),
      totalActual:0,
      status:"open"
    },
    recordStatus:"open",revision:1,
    audit:{createdBy:clean(actor.userId||actor.employeeId||actor.passportId),createdAt:clean(c.launchedAt||new Date().toISOString()),updatedAt:clean(c.launchedAt||new Date().toISOString())}
  };
}

export function normalizeIXIWorkOrder(value={}){
  const source=obj(value),base=createIXIWorkOrderDraft({context:{},input:{}});
  return {...base,...source,identity:{...base.identity,...obj(source.identity)},context:{...base.context,...obj(source.context)},work:{...base.work,...obj(source.work)},people:{...base.people,...obj(source.people),assignedTo:arr(source.people?.assignedTo)},dates:{...base.dates,...obj(source.dates)},result:{...base.result,...obj(source.result)},references:{...base.references,...obj(source.references),purchaseRequestIds:arr(source.references?.purchaseRequestIds),purchaseOrderIds:arr(source.references?.purchaseOrderIds),photoIds:arr(source.references?.photoIds)},financial:{...base.financial,...obj(source.financial)},audit:{...base.audit,...obj(source.audit)}};
}

export default {createIXIWorkOrderDraft,normalizeIXIWorkOrder};
