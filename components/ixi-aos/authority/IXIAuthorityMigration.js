import { getIXITransactModuleCapability } from "./IXIAuthorityModuleMap";

const clean=value=>String(value??"").trim();
const arr=value=>Array.isArray(value)?value:[];

export function adaptLegacyTransactPermissions(permissions=[]){
  const source=arr(permissions).map(clean).filter(Boolean);
  const directGrants=source.filter(value=>!value.startsWith("deny:"));
  const moduleDenies=source.filter(value=>value.startsWith("deny:")).map(value=>value.slice(5)).filter(Boolean);
  const deniedCapabilities=Array.from(new Set(moduleDenies.map(getIXITransactModuleCapability)));
  return {source,directGrants,moduleDenies,deniedCapabilities};
}

export default {adaptLegacyTransactPermissions};
