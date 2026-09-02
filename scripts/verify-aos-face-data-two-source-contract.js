const fs = require("fs");

function read(path) {
  return fs.readFileSync(path, "utf8");
}

function requireText(text, needle, label) {
  if (!text.includes(needle)) {
    throw new Error(`Missing ${label}: ${needle}`);
  }
}

const contractPath =
  "components/ixi-aos/face-data-runtime/IXIFaceDataSourceContract.js";

const authPath =
  "components/ixi-aos/face-data-runtime/IXIFaceAppAuthorizationEngine.js";

const indexPath =
  "components/ixi-aos/face-data-runtime/index.js";

const doctrinePath =
  "data/ixi-face-data-catalog/TWO-SOURCE-DATA-DOCTRINE.md";

const contract = read(contractPath);
const auth = read(authPath);
const index = read(indexPath);
const doctrine = read(doctrinePath);

requireText(
  contract,
  'TRANSACT: "transact"',
  "TRAN$ACT source class"
);

requireText(
  contract,
  'USER_FIELD: "permissioned-user-field"',
  "permissioned user field source class"
);

requireText(
  contract,
  "getIXIFactualFaceDataCapabilityIds",
  "canonical factual capability resolver"
);

requireText(
  contract,
  "canIXIActorEditUserFaceField",
  "permissioned user field edit gate"
);

requireText(
  auth,
  "getIXIFactualFaceDataCapabilityIds(manifest)",
  "Face data authorization against factual sources"
);

requireText(
  auth,
  '"FACE_DATA_SOURCE_INVALID"',
  "third-source rejection"
);

requireText(
  auth,
  "getIXIFaceDataSourceForCapability",
  "authorized source provenance reporting"
);

requireText(
  index,
  'from "./IXIFaceDataSourceContract"',
  "runtime export"
);

requireText(
  doctrine,
  "The **Object is the truth**.",
  "Object truth doctrine"
);

requireText(
  doctrine,
  "only two source classes",
  "two-source doctrine"
);

console.log(
  "AOS FACE DATA TWO-SOURCE CONTRACT GREEN"
);
