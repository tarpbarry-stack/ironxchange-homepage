const fs = require("fs");
const path = require("path");

function read(relativePath) {
  return fs.readFileSync(
    path.join(process.cwd(), relativePath),
    "utf8"
  );
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const creationHook = read(
  "components/ixi-mos/object-creation/useIXIMosObjectCreation.js"
);
const studioCommit = read(
  "lib/mos/ixiAosObjectCommit.js"
);
const bulkPage = read("pages/bulk-import.js");
const trustedCommit = read(
  "lib/server/aos/commitTrustedAosObject.js"
);
const provisioningClient = read(
  "lib/mos/ixiAosProvisioningClient.js"
);
const creationBoundary = read(
  "lib/mos/ixiAosCreationBoundary.js"
);

assert(
  creationHook.includes("return createClientOnlyDraft({"),
  "Container + must create a client-only draft."
);
assert(
  creationHook.includes("await provisionAosObject({"),
  "Manual Save must terminate at canonical provisioning."
);
assert(
  creationHook.includes("replaceWorkspaceObjectId("),
  "Successful manual Save must replace draft identity with permanent identity."
);
assert(
  studioCommit.includes("return provisionAosObject(input);"),
  "Object Studio permanent creation must terminate at canonical provisioning."
);
assert(
  bulkPage.includes("createAosImportJob({") &&
  bulkPage.includes("executeAosImportJob({"),
  "Bulk intake must use the authoritative IX-Core Import Job path."
);
assert(
  trustedCommit.includes('path: "/objects/provision"'),
  "Trusted API/Chat must terminate at IX-Core provisioning."
);
assert(
  trustedCommit.includes("assertAosCreationReceipt("),
  "Trusted API/Chat must use the canonical creation receipt."
);
assert(
  provisioningClient.includes("assertAosCreationReceipt("),
  "Browser provisioning must use the canonical creation receipt."
);
assert(
  creationBoundary.includes("AOS_CREATION_TRANSACT_UNVERIFIED") &&
  creationBoundary.includes("AOS_CREATION_PASSPORT_UNVERIFIED") &&
  creationBoundary.includes("AOS_CREATION_ENTITY_UNVERIFIED"),
  "Canonical receipt must verify Object, Passport, TRAN$ACT and Entity identity."
);

console.log("AOS CREATION ENTRY-POINT UNIFICATION VERIFIED");
