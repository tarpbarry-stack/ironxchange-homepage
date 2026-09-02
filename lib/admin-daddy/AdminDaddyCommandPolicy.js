const {ADMIN_CAPABILITIES}=require("./AdminDaddyAuthority");
const COMMAND_POLICIES=Object.freeze({
 "job.execute":{capability:ADMIN_CAPABILITIES.ACQUISITION_RETRY,risk:"medium",requiresReason:true,requiresAudit:true,idempotent:true,targetType:"job"},
 "job.cancel":{capability:ADMIN_CAPABILITIES.ACQUISITION_RETRY,risk:"high",requiresReason:true,requiresAudit:true,idempotent:true,targetType:"job"},
 "object.recover-provision":{capability:ADMIN_CAPABILITIES.OBJECTS_REPAIR,risk:"high",requiresReason:true,requiresAudit:true,idempotent:true,targetType:"provisioning"},
 "case.acknowledge":{capability:ADMIN_CAPABILITIES.COMMAND,risk:"low",requiresReason:false,requiresAudit:true,idempotent:true,targetType:"case"},
 "case.assign":{capability:ADMIN_CAPABILITIES.COMMAND,risk:"low",requiresReason:false,requiresAudit:true,idempotent:true,targetType:"case"},
 "case.resolve":{capability:ADMIN_CAPABILITIES.COMMAND,risk:"medium",requiresReason:true,requiresAudit:true,idempotent:true,targetType:"case"}
});
function getCommandPolicy(commandType){return COMMAND_POLICIES[String(commandType??"").trim()]||null;}
function validateCommandAgainstPolicy(command){const policy=getCommandPolicy(command?.commandType);if(!policy){const e=new Error(`Admin Daddy command is not registered: ${command?.commandType||""}`);e.code="ADMIN_DADDY_COMMAND_NOT_REGISTERED";e.statusCode=501;throw e;}if(policy.requiresReason&&!String(command?.reason??"").trim()){const e=new Error("A documented operator reason is required for this command.");e.code="ADMIN_DADDY_COMMAND_REASON_REQUIRED";e.statusCode=400;throw e;}if(policy.targetType&&String(command?.target?.type??"").trim()!==policy.targetType){const e=new Error(`Command target must be ${policy.targetType}.`);e.code="ADMIN_DADDY_COMMAND_TARGET_INVALID";e.statusCode=400;throw e;}return policy;}
module.exports={COMMAND_POLICIES,getCommandPolicy,validateCommandAgainstPolicy};
