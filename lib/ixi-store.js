import fs from "fs";
import path from "path";

const dataDir = path.join(process.cwd(), "data");
const filePath = path.join(dataDir, "dealer-graph-results.json");

export function ensureStore() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
  }

  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify([]));
  }
}

export function loadDealerResults() {
  ensureStore();

  const raw = fs.readFileSync(filePath, "utf8");

  return JSON.parse(raw);
}

export function saveDealerResults(results) {
  ensureStore();

  fs.writeFileSync(filePath, JSON.stringify(results, null, 2));
}
