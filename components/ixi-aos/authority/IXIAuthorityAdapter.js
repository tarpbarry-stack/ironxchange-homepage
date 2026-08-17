import { evaluateIXIAuthority, evaluateIXIAuthoritySet } from "./IXIAuthorityEvaluator";
import IXIAuthorityClient from "./IXIAuthorityClient";

const clean=v=>String(v??"").trim();
const arr=v=>Array.isArray(v)?v:[];
const obj=v=>v&&typeof v==="object"&&!Array.isArray(v)?v:{};

export function createIXIAuthorityRuntime({actor={},entity={},target={},permissions=[],policies=[],ancestorPassportIds=[],locationPassportId="",systemDeniedCapabilities=[]}={}){
  const actorSource=obj(actor),entitySource=obj(entity),targetSource=obj(target);
  const actorSnapshot={
    principalId:clean(actorSource.principalId||actorSource.employeeId||actorSource.userId||actorSource.id),
    passportId:clean(actorSource.passportId||actorSource.ixiPassportId),
    roles:arr(actorSource.roles||actorSource.roleIds),
    groups:arr(actorSource.groups||actorSource.groupIds),
    entityPassportIds:arr(actorSource.entityPassportIds||[clean(entitySource.passportId)]).filter(Boolean),
    permissions:arr(permissions||actorSource.permissions),
    authenticated:actorSource.authenticated!==false
  };
  const targetPassportId=clean(targetSource.passportId||targetSource.ixiPassportId);
  const base={actor:actorSnapshot,targetPassportId,ancestorPassportIds:arr(ancestorPassportIds),entityPassportId:clean(entitySource.passportId),locationPassportId:clean(locationPassportId),policies:arr(policies),systemDeniedCapabilities:arr(systemDeniedCapabilities)};
  return {
    actor:actorSnapshot,
    targetPassportId,
    can(capability){return evaluateIXIAuthority({...base,capability}).allowed;},
    decision(capability){return evaluateIXIAuthority({...base,capability});},
    decisions(capabilities){return evaluateIXIAuthoritySet({...base,capabilities});},
    async remoteDecision(capability,options={}){return IXIAuthorityClient.evaluateIXIAuthorityRemote({capability,passportId:targetPassportId,...options});}
  };
}

export default {createIXIAuthorityRuntime};
