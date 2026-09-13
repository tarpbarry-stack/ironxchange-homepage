import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const core = process.env.IXI_CORE_CONTRACT_ROOT;
if (!core || !fs.existsSync(path.join(core, "mos/routes/mosRouter.js"))) {
  throw new Error("IXI_CORE_CONTRACT_ROOT must identify the paired IX-Core checkout. The release gate cannot skip integration.");
}
const release = JSON.parse(fs.readFileSync(path.join(root, "config/ixi-core-release.json"), "utf8"));
const actual = execFileSync("git", ["rev-parse", "HEAD"], { cwd: core, encoding: "utf8" }).trim();
if (!/^[a-f0-9]{40}$/.test(release.commit) || release.commit !== actual) {
  throw new Error("Paired backend checkout does not match the pinned release commit");
}
execFileSync("git", ["diff", "--exit-code", "HEAD", "--"], { cwd: core, stdio: "inherit" });
const tests = fs.readdirSync(path.join(root, "tests"))
  .filter(file => /^ixi-(?:aos|transact)-.*\.test\.mjs$/.test(file))
  .map(file => path.join("tests", file)).sort();
if (!tests.includes("tests/ixi-aos-paired-session-recovery.test.mjs")) throw new Error("Required integration regression is missing");
execFileSync(process.execPath, ["--test", ...tests], {
  cwd: root, stdio: "inherit", env: { ...process.env, IXI_CORE_CONTRACT_ROOT: path.resolve(core) }
});
execFileSync("npm", ["test"], { cwd: core, stdio: "inherit" });
console.log(JSON.stringify({ ok: true, backendCommit: actual, pairedIntegrationRequired: true }));
