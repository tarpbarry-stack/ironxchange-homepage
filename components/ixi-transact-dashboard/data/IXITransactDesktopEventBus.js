const EVENT_NAME="ixi-transact-desktop-event";
const clean=value=>String(value??"").trim();

export const IXI_TRANSACT_DESKTOP_EVENTS=Object.freeze({
  FINANCIAL_MUTATION_COMMITTED:"financial-mutation-committed"
});

export function publishIXITransactDesktopEvent(type="",detail={}){
  const eventType=clean(type);
  if(!eventType||typeof window==="undefined"||typeof window.dispatchEvent!=="function")return false;
  window.dispatchEvent(new CustomEvent(EVENT_NAME,{detail:{type:eventType,occurredAt:new Date().toISOString(),detail:detail&&typeof detail==="object"?detail:{}}}));
  return true;
}

export function subscribeIXITransactDesktopEvent(type="",handler=()=>{}){
  const eventType=clean(type);
  if(!eventType||typeof window==="undefined"||typeof window.addEventListener!=="function"||typeof handler!=="function")return()=>{};
  const listener=event=>{if(clean(event?.detail?.type)===eventType)handler(event.detail.detail||{},event.detail)};
  window.addEventListener(EVENT_NAME,listener);
  return()=>window.removeEventListener(EVENT_NAME,listener);
}

export default{IXI_TRANSACT_DESKTOP_EVENTS,publishIXITransactDesktopEvent,subscribeIXITransactDesktopEvent};
