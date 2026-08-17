const clean=value=>String(value??"").trim();
const obj=value=>value&&typeof value==="object"&&!Array.isArray(value)?value:{};

export function createIXIAuthorityAuditEvent({eventType="authority.changed",actorPassportId="",targetPassportId="",policyId="",ruleId="",before=null,after=null,metadata={}}={}){
  return {
    schema:"ixi-authority-audit-v1",
    eventType:clean(eventType)||"authority.changed",
    eventId:`auth_evt_${Date.now()}_${Math.random().toString(36).slice(2,10)}`,
    occurredAt:new Date().toISOString(),
    actorPassportId:clean(actorPassportId),
    targetPassportId:clean(targetPassportId),
    policyId:clean(policyId),
    ruleId:clean(ruleId),
    before:before?obj(before):null,
    after:after?obj(after):null,
    metadata:obj(metadata)
  };
}

export default {createIXIAuthorityAuditEvent};
