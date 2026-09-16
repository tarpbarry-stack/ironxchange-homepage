export async function salesRequest(path, { body, signal } = {}) {
  const response = await fetch(`/api/ixi/sales-desk/${path}`,{method:body ? "POST" : "GET",cache:"no-store",credentials:"same-origin",signal,headers:body ? {"Content-Type":"application/json"} : {},...(body ? {body:JSON.stringify(body)} : {})});
  const payload = await response.json().catch(()=>null);
  if (!response.ok || payload?.ok !== true) {
    const error = new Error(payload?.error?.message || "Sales Desk could not complete the request. Your changes are still here.");
    error.status=response.status;error.code=payload?.error?.code;throw error;
  }
  return payload;
}
export const todayLocal = () => {
  const date=new Date();return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
};
export const STAGES = [["inquiry","INQUIRY"],["qualified","QUALIFIED"],["quoting","QUOTING"],["negotiating","NEGOTIATING"],["handoff","TRAN$ACT HANDOFF"],["lost","LOST"],["archived","ARCHIVED"]];
export const stageLabel = value => STAGES.find(([id])=>id===value)?.[1] || value;
export function machineReference(item) {
  const passportId=String(item.canonicalIdentity?.passportId || item.passportId || item.publicData?.passportId || item.ixiMedia?.passportId || "");
  const listingId=String(item.id?.uuid || item.id || "");
  return {key:passportId ? `passport:${passportId}` : `listing:${listingId}`,passportId,listingId,title:item.title || "Machine"};
}
