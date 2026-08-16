export const IXI_TRANSACT_MODULES=Object.freeze([
  {id:"work-order",label:"WORK ORDER",group:"work",documentType:"work-order"},
  {id:"expense",label:"EXPENSE",group:"spend",documentType:"expense"},
  {id:"technology-work",label:"TECHNOLOGY WORK",group:"work",documentType:"technology-work-order",specializedWorkOrder:true},
  {id:"time",label:"TIME",group:"work",documentType:"time-entry"},
  {id:"material",label:"PART / MATERIAL",group:"work",documentType:"material-usage"},
  {id:"bill",label:"BILL / INVOICE",group:"spend",documentType:"bill"},
  {id:"receipt",label:"RECEIPT",group:"spend",documentType:"receipt"},
  {id:"purchase-order",label:"PURCHASE ORDER",group:"buy",documentType:"purchase-order"},
  {id:"quote",label:"QUOTE",group:"sell",documentType:"quote"},
  {id:"invoice",label:"INVOICE",group:"sell",documentType:"invoice"},
  {id:"settlement",label:"SETTLEMENT",group:"settle",documentType:"settlement"}
]);

function sortByOrder(items,order){
 const rank=new Map(order.map((id,index)=>[id,index]));
 return [...items].sort((a,b)=>(rank.has(a.id)?rank.get(a.id):999)-(rank.has(b.id)?rank.get(b.id):999));
}

export function getIXITransactModules({objectType="",permissions=[]}={}){
 const type=String(objectType||"").toLowerCase();
 const denied=new Set((permissions||[]).filter(x=>String(x).startsWith("deny:")).map(x=>String(x).slice(5)));
 let preferred=IXI_TRANSACT_MODULES;
 if(["machine","equipment","vehicle","truck","trailer"].includes(type)){
  preferred=sortByOrder(IXI_TRANSACT_MODULES,["work-order","expense","technology-work","time","material","purchase-order","receipt","bill","quote","invoice","settlement"]);
 }else if(["location","yard","shop"].includes(type)){
  preferred=sortByOrder(IXI_TRANSACT_MODULES,["work-order","expense","purchase-order","bill","receipt","technology-work","time","material","quote","invoice","settlement"]);
 }
 return preferred.filter(item=>!denied.has(item.id));
}
