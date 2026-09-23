import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const governedStylesheets = [
  "components/ixi-dashboard/dashboard.module.css",
  "components/ixi-sales-desk/salesDesk.module.css",
  "components/ixi-command-center/IXIAosCommandCenter.module.css",
  "components/ixi-command-center/IXITransactAppDirectory.module.css",
  "components/ixi-command-center/IXITransactRebuild.module.css",
  "components/ixi-command-center/IXITransactSidePanel.module.css",
  "components/ixi-command-center/IXITransactWorkspace.module.css",
  "components/ixi-mos/workspace/IXIAosToolbarChassis.module.css",
];

function dominantGreenColors(source) {
  const matches = [];
  for (const match of source.matchAll(/#([0-9a-f]{6})(?![0-9a-f])/gi)) {
    const channels = [0, 2, 4].map(offset => Number.parseInt(match[1].slice(offset, offset + 2), 16));
    if (channels[1] > channels[0] && channels[1] > channels[2]) matches.push(match[0]);
  }
  for (const match of source.matchAll(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/gi)) {
    const channels = match.slice(1, 4).map(Number);
    if (channels[1] > channels[0] && channels[1] > channels[2]) matches.push(match[0]);
  }
  return matches;
}

function offPaletteChromaticColors(source) {
  const matches = [];
  const inspect = (label, channels) => {
    const [red, green, blue] = channels;
    const chroma = Math.max(...channels) - Math.min(...channels);
    if (chroma >= 24 && !(red >= green && green >= blue)) matches.push(label);
  };
  for (const match of source.matchAll(/#([0-9a-f]{6})(?![0-9a-f])/gi)) {
    inspect(match[0], [0, 2, 4].map(offset => Number.parseInt(match[1].slice(offset, offset + 2), 16)));
  }
  for (const match of source.matchAll(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/gi)) {
    inspect(match[0], match.slice(1, 4).map(Number));
  }
  return matches;
}

test("V12 tokens are globally loaded and define the governed shell palette", () => {
  assert.match(read("pages/_app.js"), /import\s+["']\.\.\/styles\/global\.css["']/);
  const tokens = read("styles/global.css");
  for (const token of [
    "--ix-canvas",
    "--ix-surface-deep",
    "--ix-surface",
    "--ix-surface-raised",
    "--ix-surface-elevated",
    "--ix-line",
    "--ix-line-strong",
    "--ix-text-primary",
    "--ix-text-secondary",
    "--ix-text-muted",
    "--ix-yellow",
    "--ix-success",
    "--ix-danger",
  ]) assert.match(tokens, new RegExp(`${token}\\s*:`), `${token} must remain part of the V12 contract`);
});

test("governed desktop shells use V12 tokens and cannot drift olive or green", () => {
  for (const path of governedStylesheets) {
    const stylesheet = read(path);
    assert.match(stylesheet, /var\(--ix-/, `${path} must consume the shared V12 contract`);
    assert.deepEqual(dominantGreenColors(stylesheet), [], `${path} contains an unapproved green-dominant shell color`);
    assert.deepEqual(offPaletteChromaticColors(stylesheet), [], `${path} contains an unapproved cool or purple shell color`);
  }
});

test("SOLD scoreboard and filters use the same neutral V12 surfaces", () => {
  const page = read("pages/account/my-listings-v2.js");
  const soldStart = page.indexOf(".sold-toolbar");
  const soldEnd = page.indexOf("@media(max-width:760px)", soldStart);
  assert.ok(soldStart >= 0 && soldEnd > soldStart, "SOLD toolbar styles must remain discoverable");
  const soldStyles = page.slice(soldStart, soldEnd);
  assert.match(soldStyles, /var\(--ix-surface-raised\)/);
  assert.match(soldStyles, /var\(--ix-line-strong\)/);
  assert.match(soldStyles, /var\(--ix-text-secondary\)/);
  assert.deepEqual(dominantGreenColors(soldStyles), [], "SOLD shell colors cannot drift green");
});

test("semantic green is centralized instead of becoming page chrome", () => {
  const dashboard = read("components/ixi-dashboard/dashboard.module.css");
  const salesDesk = read("components/ixi-sales-desk/salesDesk.module.css");
  const transact = read("components/ixi-command-center/IXIAosCommandCenter.module.css");
  assert.match(dashboard, /background:var\(--ix-success\)/);
  assert.match(salesDesk, /border-left-color:var\(--ix-success\)/);
  assert.match(transact, /data-live="true"[^}]+var\(--ix-success\)/);
});
