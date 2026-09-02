const fs = require("fs");
const path = require("path");
const assert = require("assert");

const ROOT = process.cwd();

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

const runtime = read("components/ixi-aos/face-data-runtime/IXICardFaceManifestRuntime.js");
const source = read("components/ixi-aos/face-data-runtime/IXIFaceDataSourceContract.js");
const auth = read("components/ixi-aos/face-data-runtime/IXIFaceAppAuthorizationEngine.js");

assert.match(runtime, /factualSourceCount:\s*2/);
assert.match(runtime, /"permissioned-user-field"/);
assert.match(runtime, /"transact"/);
assert.match(runtime, /factualData:\s*\{/);
assert.match(runtime, /userFields/);
assert.match(runtime, /transact/);
assert.match(runtime, /context:\s*\{/);
assert.match(runtime, /relationships:/);
assert.match(runtime, /media:/);
assert.match(runtime, /platformCapabilities:/);

assert.match(source, /USER_FIELD:\s*"permissioned-user-field"/);
assert.match(source, /TRANSACT:\s*"transact"/);
assert.match(source, /canIXIActorEditUserFaceField/);

assert.match(auth, /factualDataCapabilities/);
assert.match(auth, /FACE_DATA_SOURCE_INVALID/);
assert.match(auth, /DATA_CAPABILITY_NOT_AUTHORIZED/);

console.log("CARD FACE MANIFEST TWO-SOURCE CONTRACT GREEN");
