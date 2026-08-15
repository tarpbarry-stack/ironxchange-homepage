import { createIXIAosWorkOrder, getIXIAosFinancialPassportId } from "../financial-runtime/IXIAosFinancialRuntimeAdapter";

const clean=v=>String(v??"").trim();
const arr=v=>Array.isArray(v)?v:[];
const obj=v=>v&&typeof v==="object"&&!Array.isArray(v)?v:{};
const num=v=>Number.isFinite(Number(v))?Number(v):0;

export const LOCATION_MAINTENANCE_PRIORITY=Object.freeze({CRITICAL:"critical",HIGH:"high",MEDIUM:"medium",LOW:"low"});
export const LOCATION_MAINTENANCE_STATUS=Object.freeze({OPEN:"open",SCHEDULED:"scheduled",IN_PROGRESS:"in-progress",COMPLETE:"complete",OVERDUE:"overdue"});

export function getIXILocationMaintenanceData(object={}){
  const fields=obj(object.fields);
  return {
    systems:arr(fields.facilitySystems),
    workOrders:arr(fields.maintenanceWorkOrders),
    preventiveMaintenance:arr(fields.preventiveMaintenance),
    inspections:arr(fields.facilityInspections),
    serviceContracts:arr(fields.serviceContracts),
    capitalWatch:arr(fields.capitalReplacementWatch),
    metrics:obj(fields.maintenanceMetrics),
    notes:clean(fields.facilityNotes)
  };
}

export function createIXILocationMaintenanceViewModel({object={},now=new Date()}={}){
  const data=getIXILocationMaintenanceData(object);
  const current=now instanceof Date?now:new Date(now);
  const nowMs=Number.isNaN(current.getTime())?Date.now():current.getTime();
  const open=data.workOrders.filter(x=>!["complete","closed"].includes(clean(x.status).toLowerCase()));
  const overdue=open.filter(x=>{const due=new Date(x.dueDate||0).getTime();return due&&due<nowMs;});
  const critical=open.filter(x=>clean(x.priority).toLowerCase()==="critical");
  const nextCandidates=[...open,...data.preventiveMaintenance]
    .map(x=>({...x,_due:new Date(x.dueDate||x.nextDue||0).getTime()}))
    .filter(x=>x._due&&!Number.isNaN(x._due))
    .sort((a,b)=>a._due-b._due);
  const attention=open.slice().sort((a,b)=>priorityScore(a.priority)-priorityScore(b.priority)).slice(0,6);
  const healthBase=num(data.metrics.healthScore||100);
  const health=Math.max(0,Math.min(100,healthBase-(critical.length*8)-(overdue.length*3)));
  return {
    passportId:getIXIAosFinancialPassportId(object),
    ...data,
    openWorkOrders:open,
    overdueWorkOrders:overdue,
    criticalIssues:critical,
    nextDue:nextCandidates[0]||null,
    attention,
    healthScore:health,
    downtimeYtd:num(data.metrics.downtimeYtd),
    pmCompliance:num(data.metrics.pmCompliance),
    mttr:num(data.metrics.mttr),
    maintenanceCostYtd:num(data.metrics.maintenanceCostYtd),
    costPerSqFt:num(data.metrics.costPerSqFt)
  };
}

function priorityScore(value){return {critical:0,high:1,medium:2,low:3}[clean(value).toLowerCase()]??9;}

export async function createIXILocationMaintenanceWorkOrder({object={},workOrder={},apiBaseUrl="",headers={},signal}={}){
  if(!getIXIAosFinancialPassportId(object)) throw new Error("Location Passport is required before creating a maintenance work order.");
  const row=obj(workOrder);
  const amount=num(row.estimatedCost||row.amount);
  return createIXIAosWorkOrder({
    object,
    input:{
      title:clean(row.title||row.asset||"FACILITY WORK ORDER"),
      description:clean(row.description||row.task||row.issue),
      currency:"USD",
      dueDate:clean(row.dueDate),
      lines:amount?[{description:clean(row.title||row.asset||"FACILITY WORK ORDER"),quantity:1,rate:amount,amount,currency:"USD",accounting:{category:"facility-maintenance"}}]:[],
      metadata:{
        locationMaintenance:true,
        maintenanceWorkOrderId:clean(row.workOrderId||row.id),
        asset:clean(row.asset||row.system),
        priority:clean(row.priority),
        preventiveMaintenanceId:clean(row.preventiveMaintenanceId),
        source:"location-f5-maintenance"
      }
    },
    apiBaseUrl,headers,signal
  });
}

export default {getIXILocationMaintenanceData,createIXILocationMaintenanceViewModel,createIXILocationMaintenanceWorkOrder};