import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

function read(path) {
  return fs.readFileSync(
    new URL(`../${path}`, import.meta.url),
    "utf8"
  );
}

const interStack =
  /'Inter Variable', Inter, ui-sans-serif/u;

test("Ticket Command uses readable operational typography", () => {
  const css = read(
    "components/ixi-tickets/IXITicketCommand.module.css"
  );

  assert.match(css, /"Inter Variable", Inter/u);
  assert.match(
    css,
    /\.command button, \.command input, \.command select, \.command textarea/u
  );
  assert.doesNotMatch(
    css,
    /font-size:\s*(?:[5-9](?:\.\d+)?)px/u
  );
  assert.match(
    css,
    /\.originalRequest[^}]*font-size: 13px/su
  );
});

test("URL and Bulk Import no longer use prototype type scales", () => {
  for (const path of [
    "pages/url-import.js",
    "pages/bulk-import.js"
  ]) {
    const source = read(path);

    assert.match(source, interStack);
    assert.doesNotMatch(
      source,
      /font-size:\s*(?:[5-9](?:\.\d+)?)px/u
    );
  }
});

test("remaining operational pages share the Inter Variable foundation", () => {
  for (const path of [
    "pages/saved.js",
    "pages/account/my-listings-v2.js",
    "pages/auction-work/index.js",
    "pages/auction-market/index.js",
    "pages/aos/work.js",
    "pages/theater.js"
  ]) {
    const source = read(path);

    assert.match(
      source,
      /:global\(body\)[\s\S]*?font-family:\s*'Inter Variable'/u,
      `${path} must use the operational font foundation`
    );
  }
});

test("shared operational chrome meets the commercial type floor", () => {
  const auctionRail = read(
    "components/IXIAuctionEnvironmentRail.js"
  );
  const scoreboard = read(
    "components/ixi-mos/IXIAosScoreboard.jsx"
  );
  const ticketLauncher = read(
    "components/ixi-tickets/IXITicketLauncher.jsx"
  );
  const scale = read(
    "components/ixi-chassis/IXICardScaleControl.jsx"
  );
  const footer = read("components/Footer.js");

  assert.match(
    auctionRail,
    /font-size: 11px;[\s\S]*?font-weight: 850/u
  );
  assert.match(
    auctionRail,
    /state-available[\s\S]*?\.42/u
  );
  assert.match(
    auctionRail,
    /state-locked[\s\S]*?\.16/u
  );
  assert.match(
    scoreboard,
    /\.aos-metric span[\s\S]*?font-size: 11px/u
  );
  assert.match(ticketLauncher, /font-size: 10px/u);
  assert.match(
    scale,
    /data-ixi-header-tools="true"[\s\S]*?font-size: 10px/u
  );
  assert.match(footer, /font-size: 12px/u);
});
