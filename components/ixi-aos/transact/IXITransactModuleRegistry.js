export const IXI_TRANSACT_MODULES=Object.freeze([
  {id:"work-order",label:"WORK ORDER",group:"work",documentType:"work-order"},
  {id:"time",label:"TIME",group:"work",documentType:"time-entry"},
  {id:"material",label:"PART / MATERIAL",group:"work",documentType:"material-usage"},
  {id:"expense",label:"EXPENSE",group:"spend",documentType:"expense"},
  {id:"bill",label:"BILL / INVOICE",group:"spend",documentType:"bill"},
  {id:"receipt",label:"RECEIPT",group:"spend",documentType:"receipt"},
  {id:"purchase-order",label:"PURCHASE ORDER",group:"buy",documentType:"purchase-order"},
  {id:"quote",label:"QUOTE",group:"sell",documentType:"quote"},
  {id:"invoice",label:"INVOICE",group:"sell",documentType:"invoice"},
  {id:"settlement",label:"SETTLEMENT",group:"settle",documentType:"settlement"}
]);

export function getIXITransactModules({objectType="",permissions=[]}={}){
  const type=String(objectType||"").toLowerCase();
  const denied=new Set((permissions||[]).filter(x=>String(x).startsWith("deny:")).map(x=>String(x).slice(5)));
  let preferred=IXI_TRANSACT_MODULES;
  if(["machine","equipment","vehicle","truck","trailer","location","yard","shop"].includes(type)){
    const order=["work-order","time","material","expense","purchase-order","receipt","bill","quote","invoice","settlement"];
    preferred=[...IXI_TRANSACT_MODULES].sort((a,b)=>order.indexOf(a.id)-order.indexOf(b.id));
  }
  return preferred.filter(item=>!denied.has(item.id));
}
