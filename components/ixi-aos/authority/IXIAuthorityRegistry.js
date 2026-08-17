export const IXI_AUTHORITY_CAPABILITIES = Object.freeze([
  Object.freeze({ id: "aos.discover", label: "DISCOVER", family: "aos", description: "Discover that an object exists." }),
  Object.freeze({ id: "aos.view", label: "VIEW", family: "aos", description: "Open and read an object." }),
  Object.freeze({ id: "aos.create", label: "CREATE", family: "aos", description: "Create objects or child records in scope." }),
  Object.freeze({ id: "aos.edit", label: "EDIT", family: "aos", description: "Modify object data in scope." }),
  Object.freeze({ id: "aos.move", label: "MOVE", family: "aos", description: "Move or re-parent objects in scope." }),
  Object.freeze({ id: "aos.archive", label: "ARCHIVE", family: "aos", description: "Archive objects in scope." }),
  Object.freeze({ id: "aos.delete", label: "DELETE", family: "aos", description: "Delete or soft-delete objects where policy permits." }),
  Object.freeze({ id: "transact.open", label: "OPEN TRAN$ACT", family: "transact", description: "Open the TRAN$ACT surface for an object." }),
  Object.freeze({ id: "transact.execute", label: "TRANSACT", family: "transact", description: "Execute approved TRAN$ACT actions in scope." }),
  Object.freeze({ id: "financial.view", label: "FINANCIAL VIEW", family: "financial", description: "Read approved financial projections and records." }),
  Object.freeze({ id: "financial.create", label: "FINANCIAL CREATE", family: "financial", description: "Create financial documents where allowed." }),
  Object.freeze({ id: "financial.approve", label: "FINANCIAL APPROVE", family: "financial", description: "Approve transactions within configured limits." }),
  Object.freeze({ id: "financial.pay", label: "PAYMENT AUTHORITY", family: "financial", description: "Release or record payments where allowed." }),
  Object.freeze({ id: "financial.gl", label: "GENERAL LEDGER", family: "financial", description: "Access General Ledger functions where allowed." }),
  Object.freeze({ id: "financial.close", label: "PERIOD CLOSE", family: "financial", description: "Close or reopen accounting periods where allowed." }),
  Object.freeze({ id: "authority.view", label: "VIEW ACCESS", family: "authority", description: "Read effective authority and policy." }),
  Object.freeze({ id: "authority.manage", label: "MANAGE ACCESS", family: "authority", description: "Create or modify authority policy." }),
  Object.freeze({ id: "identity.invite", label: "INVITE USER", family: "identity", description: "Grant login access and send an IXI invitation." }),
  Object.freeze({ id: "identity.suspend", label: "SUSPEND ACCESS", family: "identity", description: "Suspend authenticated access without deleting the object." })
]);

export const IXI_AUTHORITY_SUBJECT_TYPES = Object.freeze([
  "principal",
  "role",
  "group",
  "entity-member",
  "all-authenticated"
]);

export const IXI_AUTHORITY_SCOPE_TYPES = Object.freeze([
  "target",
  "target-and-descendants",
  "entity",
  "location",
  "selected-passports"
]);

export function getIXIAuthorityCapability(id = "") {
  const key = String(id || "").trim();
  return IXI_AUTHORITY_CAPABILITIES.find(item => item.id === key) || null;
}

export function listIXIAuthorityCapabilities({ family = "" } = {}) {
  const key = String(family || "").trim();
  return key ? IXI_AUTHORITY_CAPABILITIES.filter(item => item.family === key) : [...IXI_AUTHORITY_CAPABILITIES];
}

export default {
  IXI_AUTHORITY_CAPABILITIES,
  IXI_AUTHORITY_SUBJECT_TYPES,
  IXI_AUTHORITY_SCOPE_TYPES,
  getIXIAuthorityCapability,
  listIXIAuthorityCapabilities
};
