import Head from "next/head";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import Papa from "papaparse";
import { createInstance } from "sharetribe-flex-sdk";

import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import IXIEnvironmentRail from "../../components/IXIEnvironmentRail";

import { normalizeListingRow } from "../../lib/normalizeListingRow";

const CSV_HEADERS = [
  "category",
  "year",
  "make",
  "model",
  "hours",
  "price",
  "location",
  "description",
  "keywords",
  "imageUrls",
  "sellerReference",
  "externalLinks",
  "serialNumber",
  "condition",
  "city",
  "state",
];

function cleanNumber(value = "") {
  const raw = String(value || "").replace(/[^0-9.]/g, "");
  const number = Number(raw);
  return Number.isNaN(number) ? 0 : number;
}

function formatMoney(value) {
  const number = cleanNumber(value);
  if (!number) return "Call";
  return `$${number.toLocaleString()}`;
}

function formatCount(value) {
  return Number(value || 0).toLocaleString();
}

function parseKeywords(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  return String(value || "")
    .split(",")
    .map(item => item.trim())
    .filter(Boolean);
}

function summarizeCategories(rows = []) {
  const map = new Map();

  rows.forEach(row => {
    const category = row.category || "Uncategorized";
    map.set(category, (map.get(category) || 0) + 1);
  });

  return Array.from(map.entries())
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
}

export default function BulkUploadPage() {
  const fileInputRef = useRef(null);

  const [authorId, setAuthorId] = useState("");
  const [sellerStatus, setSellerStatus] = useState("Checking seller...");
  const [rows, setRows] = useState([]);
  const [results, setResults] = useState([]);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState("");

  const validRows = useMemo(
    () => rows.filter(row => row.isValid),
    [rows]
  );

  const invalidRows = useMemo(
    () => rows.filter(row => !row.isValid),
    [rows]
  );

  const createdResults = useMemo(
    () => results.filter(result => result.status === "created"),
    [results]
  );

  const failedResults = useMemo(
    () => results.filter(result => result.status !== "created"),
    [results]
  );

  const inventoryValue = useMemo(
    () =>
      validRows.reduce((sum, row) => {
        return sum + cleanNumber(row.price);
      }, 0),
    [validRows]
  );

  const categorySummary = useMemo(
    () => summarizeCategories(validRows),
    [validRows]
  );

  const passportCount = useMemo(
    () => results.filter(result => result.passportId || result.passportUrl).length,
    [results]
  );

  useEffect(() => {
    async function loadCurrentSeller() {
      try {
        const clientId = process.env.NEXT_PUBLIC_SHARETRIBE_CLIENT_ID;

        if (!clientId) {
          setSellerStatus("Missing Sharetribe client ID");
          return;
        }

        const sdk = createInstance({ clientId });

        const response = await sdk.currentUser.show();

        const uuid = response?.data?.data?.id?.uuid;

        if (!uuid) {
          setSellerStatus("Seller not detected. Please log in again.");
          setAuthorId("");
          return;
        }

        setAuthorId(uuid);
        setSellerStatus("Seller account detected");
      } catch (err) {
        console.error("CURRENT SELLER LOAD FAILED:", err);
        setSellerStatus("Seller not detected. Please log in again.");
        setAuthorId("");
      }
    }

    loadCurrentSeller();
  }, []);

  function downloadTemplate() {
    const example = [
      CSV_HEADERS.join(","),
      [
        "EXCAVATORS",
        "2023",
        "VOLVO",
        "EC220",
        "568",
        "289000",
        "Wichita Falls, TX",
        "Clean machine ready to work.",
        "hydraulic,cab",
        "",
        "JF5384",
        "",
        "",
        "Good",
        "Wichita Falls",
        "TX",
      ].join(","),
    ].join("\n");

    const blob = new Blob([example], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "ironxchange-bulk-upload-template.csv";
    link.click();

    URL.revokeObjectURL(url);
  }

  function handleFileUpload(event) {
    setError("");
    setResults([]);

    const file = event.target.files?.[0];

    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,

      complete: result => {
        const normalized = result.data.map((row, index) =>
          normalizeListingRow(row, index)
        );

        setRows(normalized);
      },

      error: err => {
        setError(err?.message || "CSV parse failed");
      },
    });
  }

  async function importMachines() {
    setError("");
    setResults([]);

    if (!authorId.trim()) {
      setError("Seller account not detected. Please log in again.");
      return;
    }

    if (validRows.length === 0) {
      setError("No valid rows to import.");
      return;
    }

    setIsImporting(true);

    try {
      const response = await fetch("/api/bulk-create-listings", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          authorId: authorId.trim(),
          rows,
        }),
      });

      const data = await response.json();

      if (!response.ok && !data.results) {
        throw new Error(data?.error || "Import failed");
      }

      setResults(data.results || []);
    } catch (err) {
      setError(err?.message || "Import failed");
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <>
     <Head>
  <title>Seller Intake Studio | IronXchange</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />

  <link
    href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"
    rel="stylesheet"
  />
</Head>

      <main>
        <Navbar />

        <div className="env-shell">
          <IXIEnvironmentRail
            activeEnvironment="INVENTORY"
            hasAccount={true}
            hasInventory={true}
            hasRelationship={true}
            className="bulk-env-rail"
          />
        </div>

        <section className="intake-shell">
          <section className="hero-panel">
            <div className="hero-copy">
              <span>IronXchange Seller Intake Studio</span>
              <h1>Bulk Upload</h1>
              <p>
                Upload an entire inventory in minutes. Review every machine before
                publishing. Every created listing receives an IronXchange Passport.
              </p>

              <div className="seller-pill">
                <strong>{sellerStatus}</strong>
                <small>Bulk Upload uses the currently logged-in seller account.</small>
              </div>
            </div>

            <div className="hero-actions">
              <button type="button" onClick={downloadTemplate}>
                <span>01</span>
                Download Template
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
              >
                <span>02</span>
                Upload Spreadsheet
              </button>

              <button
                type="button"
                className="primary-action"
                onClick={importMachines}
                disabled={isImporting || !authorId || validRows.length === 0}
              >
                <span>03</span>
                {isImporting
                  ? "Publishing..."
                  : `Publish ${formatCount(validRows.length)} Machines`}
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                hidden
              />
            </div>
          </section>

          {error ? (
            <section className="error-banner">
              <strong>Import Notice</strong>
              <span>{error}</span>
            </section>
          ) : null}

          <section className="metric-grid">
            <div className="metric-card">
              <span>Rows Loaded</span>
              <strong>{formatCount(rows.length)}</strong>
              <small>Total spreadsheet rows detected</small>
            </div>

            <div className="metric-card good">
              <span>Ready</span>
              <strong>{formatCount(validRows.length)}</strong>
              <small>Machines ready to publish</small>
            </div>

            <div className="metric-card warn">
              <span>Needs Review</span>
              <strong>{formatCount(invalidRows.length)}</strong>
              <small>Rows with missing required fields</small>
            </div>

            <div className="metric-card passport">
              <span>Passports</span>
              <strong>{results.length ? formatCount(passportCount) : "Pending"}</strong>
              <small>Created after publishing</small>
            </div>
          </section>

          <section className="studio-grid">
            <section className="review-panel">
              <div className="panel-head">
                <div>
                  <span>Machine Review Board</span>
                  <h2>Preview Inventory</h2>
                </div>

                <small>
                  {validRows.length} ready / {invalidRows.length} review
                </small>
              </div>

              {rows.length === 0 ? (
                <div className="empty-state">
                  <span>Upload CSV</span>
                  <h3>No machines loaded yet.</h3>
                  <p>
                    Download the template, fill one test row, save as CSV, then
                    upload it here.
                  </p>
                </div>
              ) : (
                <div className="machine-board">
                  {rows.map(row => {
                    const keywords = parseKeywords(row.keywords);

                    return (
                      <article
                        key={row.rowNumber}
                        className={`machine-object ${
                          row.isValid ? "ready" : "needs-review"
                        }`}
                      >
                        <div className="machine-topline">
                          <span>Row {row.rowNumber}</span>
                          <strong>{row.isValid ? "Ready" : "Fix"}</strong>
                        </div>

                        <h3>{row.title || `${row.year} ${row.make} ${row.model}`}</h3>

                        <div className="machine-facts">
                          <span>{row.category || "Category"}</span>
                          <span>{row.hours ? `${row.hours} hrs` : "Hours —"}</span>
                          <span>{formatMoney(row.price)}</span>
                          <span>{row.location || "Location —"}</span>
                        </div>

                        {keywords.length ? (
                          <div className="keyword-row">
                            {keywords.slice(0, 5).map(keyword => (
                              <small key={keyword}>{keyword}</small>
                            ))}
                          </div>
                        ) : null}

                        {row.errors?.length ? (
                          <div className="row-errors">
                            {row.errors.join(", ")}
                          </div>
                        ) : null}
                      </article>
                    );
                  })}
                </div>
              )}
            </section>

            <aside className="summary-rail">
              <section className="summary-card">
                <span>Inventory Summary</span>
                <h2>{formatMoney(inventoryValue)}</h2>
                <p>Total ready inventory value</p>
              </section>

              <section className="summary-card">
                <span>Categories</span>

                {categorySummary.length === 0 ? (
                  <p>No category data yet.</p>
                ) : (
                  <div className="category-list">
                    {categorySummary.map(item => (
                      <div key={item.category}>
                        <strong>{item.category}</strong>
                        <small>{item.count}</small>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="publish-card">
                <span>Publish Inventory</span>
                <h2>{formatCount(validRows.length)} Machines</h2>

                <ul>
                  <li>{formatCount(validRows.length)} Sharetribe listings</li>
                  <li>{formatCount(validRows.length)} Passport requests</li>
                  <li>{formatCount(validRows.length)} Launch Studio records</li>
                </ul>

                <button
                  type="button"
                  onClick={importMachines}
                  disabled={isImporting || !authorId || validRows.length === 0}
                >
                  {isImporting ? "Publishing..." : "Publish Inventory"}
                </button>
              </section>
            </aside>
          </section>

          <section className="results-panel">
            <div className="panel-head">
              <div>
                <span>Import Results</span>
                <h2>Publishing Report</h2>
              </div>

              <small>
                {createdResults.length} created / {failedResults.length} failed
              </small>
            </div>

            {results.length === 0 ? (
              <div className="empty-results">
                <span>No import results yet.</span>
              </div>
            ) : (
              <div className="results-grid">
                {results.map(result => (
                  <article
                    key={`${result.row}-${result.title}`}
                    className={`result-card ${
                      result.status === "created" ? "created" : "failed"
                    }`}
                  >
                    <div className="result-status">
                      <span>Row {result.row}</span>
                      <strong>{result.status}</strong>
                    </div>

                    <h3>{result.title}</h3>

                    {result.listingId ? (
                      <p className="mono">{result.listingId}</p>
                    ) : null}

                    {result.passportId ? (
                      <div className="passport-strip">
                        <span>Passport</span>
                        <strong>{result.passportId}</strong>
                      </div>
                    ) : null}

                    {result.error ? (
                      <div className="result-error">{result.error}</div>
                    ) : null}

                    <div className="result-actions">
                      {result.launchStudioUrl ? (
                        <Link href={result.launchStudioUrl}>Launch</Link>
                      ) : null}

                      {result.publicUrl ? (
                        <Link href={result.publicUrl}>Public</Link>
                      ) : null}

                      {result.passportUrl ? (
                        <Link href={result.passportUrl}>Passport</Link>
                      ) : null}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </section>
      </main>

      <Footer />

     <style jsx>{`
  :global(html),
  :global(body) {
    margin: 0;
    min-height: 100%;
    overflow-x: hidden;
    background: #0b0b0b;
    color: #d6d6d6;
    font-family: Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    text-rendering: geometricPrecision;
  }

  * {
    box-sizing: border-box;
  }

  button,
  input {
    font-family: inherit;
    -webkit-font-smoothing: antialiased;
    text-rendering: geometricPrecision;
  }

  main {
    min-height: 100vh;
    background:
      radial-gradient(circle at top center, rgba(255,196,0,.032), transparent 28%),
      radial-gradient(circle at 18% 12%, rgba(255,255,255,.018), transparent 22%),
      #0b0b0b;
  }

  .env-shell {
    max-width: 1600px;
    margin: 12px auto -12px;
    padding: 0 2%;
  }

  .intake-shell {
    max-width: 1600px;
    margin: 0 auto;
    padding: 0 2% 44px;
  }

  .hero-panel,
  .metric-card,
  .review-panel,
  .summary-card,
  .publish-card,
  .results-panel,
  .machine-object,
  .result-card,
  .error-banner {
    background:
      linear-gradient(180deg, rgba(255,255,255,.032), rgba(255,255,255,0)),
      radial-gradient(circle at top, rgba(255,255,255,.018), transparent 72%),
      #141414;

    border: 1px solid rgba(255,255,255,.065);
    outline: 1px solid rgba(255,255,255,.018);
    border-radius: 14px;

    box-shadow:
      0 1px 0 rgba(255,255,255,.045) inset,
      0 16px 38px rgba(0,0,0,.24);
  }

  .hero-panel {
    min-height: 154px;
    margin-bottom: 9px;
    padding: 14px 16px;

    display: grid;
    grid-template-columns: minmax(0, 1fr) 392px;
    gap: 16px;
    align-items: center;
  }

  .hero-copy span,
  .panel-head span,
  .summary-card span,
  .publish-card span,
  .metric-card span {
    display: block;
    margin-bottom: 3px;

    color: #FFC400;

    font-size: 8px;
    font-weight: 950;
    letter-spacing: .78px;
    text-transform: uppercase;
  }

  .hero-copy h1 {
    margin: 0;

    color: #f2f2f2;

    font-size: 42px;
    font-weight: 950;
    letter-spacing: -1.55px;
    line-height: .94;
    text-transform: uppercase;

    text-rendering: geometricPrecision;
    -webkit-font-smoothing: antialiased;
  }

  .hero-copy p {
    max-width: 760px;
    margin: 7px 0 0;

    color: rgba(255,255,255,.42);

    font-size: 11.5px;
    line-height: 1.45;
    font-weight: 700;
  }

  .seller-pill {
    width: fit-content;
    margin-top: 12px;
    padding: 7px 10px;

    display: flex;
    align-items: center;
    gap: 10px;

    border: 1px solid rgba(0,209,255,.22);
    border-radius: 999px;

    background:
      linear-gradient(180deg, rgba(0,209,255,.055), rgba(0,209,255,0)),
      #101010;

    box-shadow:
      0 1px 0 rgba(255,255,255,.025) inset,
      0 0 12px rgba(0,209,255,.035);
  }

  .seller-pill strong {
    color: #7DEBFF;

    font-size: 8px;
    font-weight: 950;
    letter-spacing: .62px;
    text-transform: uppercase;
    white-space: nowrap;
  }

  .seller-pill small {
    color: rgba(255,255,255,.40);

    font-size: 9px;
    font-weight: 850;
    letter-spacing: .18px;
  }

  .hero-actions {
    display: grid;
    gap: 7px;
  }

  .hero-actions button {
    min-height: 38px;
    padding: 0 10px 0 12px;

    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;

    border-radius: 11px;
    border: 1px solid rgba(255,255,255,.08);

    background:
      linear-gradient(180deg, rgba(255,255,255,.018), rgba(255,255,255,0)),
      #101010;

    color: #f2f2f2;

    font-size: 8.5px;
    font-weight: 950;
    letter-spacing: .58px;
    text-transform: uppercase;

    cursor: pointer;

    box-shadow:
      0 1px 0 rgba(255,255,255,.025) inset;

    transition:
      transform .14s ease,
      border-color .14s ease,
      background .14s ease,
      color .14s ease,
      box-shadow .14s ease;
  }

  .hero-actions button:hover:not(:disabled) {
    transform: translateY(-1px);
    color: #FFC400;
    border-color: rgba(255,196,0,.28);

    background:
      linear-gradient(180deg, rgba(255,196,0,.055), rgba(255,196,0,0)),
      #151515;

    box-shadow:
      0 1px 0 rgba(255,255,255,.035) inset,
      0 8px 18px rgba(0,0,0,.18);
  }

  .hero-actions button span {
    width: 24px;
    height: 24px;

    display: grid;
    place-items: center;

    border-radius: 999px;
    border: 1px solid rgba(255,255,255,.07);

    background:
      linear-gradient(180deg, rgba(255,255,255,.026), rgba(255,255,255,0)),
      #0b0b0b;

    color: rgba(255,255,255,.42);

    font-size: 7.5px;
    font-weight: 950;
    letter-spacing: .3px;
  }

  .hero-actions .primary-action {
    background:
      linear-gradient(180deg, rgba(255,255,255,.18), rgba(255,255,255,0)),
      #FFC400;

    border-color: #FFC400;
    color: #050505;

    box-shadow:
      0 1px 0 rgba(255,255,255,.22) inset,
      0 0 18px rgba(255,196,0,.10);
  }

  .hero-actions .primary-action span {
    background: rgba(0,0,0,.13);
    border-color: rgba(0,0,0,.10);
    color: rgba(0,0,0,.72);
  }

  .hero-actions .primary-action:hover:not(:disabled) {
    color: #050505;

    box-shadow:
      0 1px 0 rgba(255,255,255,.26) inset,
      0 0 24px rgba(255,196,0,.22);
  }

  .hero-actions button:disabled,
  .publish-card button:disabled {
    opacity: .38;
    cursor: not-allowed;
  }

  .error-banner {
    margin-bottom: 9px;
    padding: 10px 12px;

    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 14px;

    border-color: rgba(229,62,62,.35);

    background:
      linear-gradient(180deg, rgba(229,62,62,.10), rgba(229,62,62,0)),
      #141414;
  }

  .error-banner strong {
    color: #ff9b9b;

    font-size: 8.5px;
    font-weight: 950;
    letter-spacing: .55px;
    text-transform: uppercase;
  }

  .error-banner span {
    color: rgba(255,255,255,.62);

    font-size: 10.5px;
    font-weight: 800;
  }

  .metric-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 9px;
    margin-bottom: 9px;
  }

  .metric-card {
    min-height: 94px;
    padding: 13px 14px;
  }

  .metric-card strong {
    display: block;
    margin: 6px 0 3px;

    color: #f2f2f2;

    font-size: 25px;
    font-weight: 950;
    letter-spacing: -.8px;
    line-height: 1;

    text-rendering: geometricPrecision;
  }

  .metric-card small {
    color: rgba(255,255,255,.42);

    font-size: 9.2px;
    font-weight: 850;
    line-height: 1.28;
  }

  .metric-card.good {
    border-color: rgba(56,161,105,.30);
    box-shadow:
      0 1px 0 rgba(255,255,255,.022) inset,
      0 0 14px rgba(56,161,105,.045);
  }

  .metric-card.warn {
    border-color: rgba(246,173,85,.28);
  }

  .metric-card.passport {
    border-color: rgba(0,209,255,.22);
    background:
      linear-gradient(180deg, rgba(255,255,255,.032), rgba(255,255,255,0)),
      radial-gradient(circle at top left, rgba(0,209,255,.055), transparent 58%),
      #141414;
  }

  .studio-grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 312px;
    gap: 10px;
    align-items: start;
    margin-bottom: 10px;
  }

  .review-panel,
  .results-panel {
    padding: 13px 14px;
  }

  .panel-head {
    display: flex;
    justify-content: space-between;
    align-items: center;

    gap: 12px;

    margin-bottom: 10px;
    padding-bottom: 8px;

    border-bottom: 1px solid rgba(255,255,255,.052);
  }

  .panel-head h2 {
    margin: 0;

    color: #f2f2f2;

    font-size: 13px;
    font-weight: 950;
    letter-spacing: .35px;
    text-transform: uppercase;

    text-rendering: geometricPrecision;
    -webkit-font-smoothing: antialiased;
  }

  .panel-head small {
    color: rgba(255,255,255,.42);

    font-size: 8.5px;
    font-weight: 900;
    letter-spacing: .36px;
    white-space: nowrap;
    text-transform: uppercase;
  }

  .empty-state,
  .empty-results {
    min-height: 214px;

    display: grid;
    place-items: center;
    text-align: center;

    border: 1px dashed rgba(255,255,255,.10);
    border-radius: 13px;

    background:
      linear-gradient(180deg, rgba(255,255,255,.012), rgba(255,255,255,0)),
      #0f0f0f;

    padding: 28px;
  }

  .empty-state > div,
  .empty-results > div {
    max-width: 520px;
  }

  .empty-state span,
  .empty-results span {
    color: #7DEBFF;

    font-size: 8px;
    font-weight: 950;
    letter-spacing: .78px;
    text-transform: uppercase;
  }

  .empty-state h3 {
    margin: 7px 0 6px;

    color: #f2f2f2;

    font-size: 18px;
    font-weight: 950;
    letter-spacing: -.42px;
    text-transform: uppercase;
  }

  .empty-state p {
    max-width: 500px;
    margin: 0 auto;

    color: rgba(255,255,255,.42);

    font-size: 11px;
    line-height: 1.45;
    font-weight: 750;
  }

  .machine-board {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(246px, 1fr));
    gap: 9px;
  }

  .machine-object {
    min-height: 158px;
    padding: 11px;

    position: relative;
    overflow: hidden;

    transition:
      transform .14s ease,
      border-color .14s ease,
      background .14s ease,
      box-shadow .14s ease;
  }

  .machine-object:hover {
    transform: translateY(-1px);

    border-color: rgba(255,255,255,.12);

    background:
      linear-gradient(180deg, rgba(255,255,255,.038), rgba(255,255,255,0)),
      #171717;

    box-shadow:
      0 1px 0 rgba(255,255,255,.055) inset,
      0 18px 38px rgba(0,0,0,.25);
  }

  .machine-object.ready {
    border-color: rgba(56,161,105,.24);
  }

  .machine-object.needs-review {
    border-color: rgba(229,62,62,.35);
  }

  .machine-topline,
  .result-status {
    display: flex;
    justify-content: space-between;
    align-items: center;

    gap: 10px;
  }

  .machine-topline span,
  .result-status span {
    color: rgba(255,255,255,.42);

    font-size: 8px;
    font-weight: 950;
    letter-spacing: .55px;
    text-transform: uppercase;
  }

  .machine-topline strong,
  .result-status strong {
    width: fit-content;
    padding: 3px 7px;

    border-radius: 999px;
    border: 1px solid rgba(56,161,105,.26);

    background:
      linear-gradient(180deg, rgba(56,161,105,.12), rgba(56,161,105,.04));

    color: #38A169;

    font-size: 7.5px;
    font-weight: 950;
    letter-spacing: .42px;
    text-transform: uppercase;
  }

  .machine-object.needs-review .machine-topline strong,
  .result-card.failed .result-status strong {
    color: #ff9b9b;
    border-color: rgba(229,62,62,.42);
    background: rgba(229,62,62,.08);
  }

  .machine-object h3,
  .result-card h3 {
    margin: 9px 0 10px;

    color: #f2f2f2;

    font-size: 14.5px;
    font-weight: 950;
    letter-spacing: -.36px;
    line-height: 1.08;
    text-transform: uppercase;

    text-rendering: geometricPrecision;
    -webkit-font-smoothing: antialiased;
  }

  .machine-facts {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 5px;
  }

  .machine-facts span {
    min-height: 24px;
    padding: 6px 7px;

    border-radius: 8px;
    border: 1px solid rgba(255,255,255,.045);

    background:
      linear-gradient(180deg, rgba(255,255,255,.018), rgba(255,255,255,0)),
      #101010;

    color: rgba(255,255,255,.54);

    font-size: 8.5px;
    font-weight: 850;
    letter-spacing: .18px;

    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .keyword-row {
    margin-top: 8px;

    display: flex;
    flex-wrap: wrap;
    gap: 5px;
  }

  .keyword-row small {
    padding: 4px 6px;

    border-radius: 999px;
    border: 1px solid rgba(255,196,0,.34);

    background:
      linear-gradient(180deg, rgba(255,196,0,.085), rgba(255,196,0,.02)),
      #111;

    color: #FFC400;

    font-size: 8px;
    font-weight: 900;
    text-transform: lowercase;
  }

  .row-errors,
  .result-error {
    margin-top: 8px;

    color: #ff9b9b;

    font-size: 9px;
    line-height: 1.35;
    font-weight: 800;
  }

  .summary-rail {
    display: grid;
    gap: 9px;
  }

  .summary-card,
  .publish-card {
    padding: 13px 14px;
  }

  .summary-card h2,
  .publish-card h2 {
    margin: 5px 0 4px;

    color: #f2f2f2;

    font-size: 20px;
    font-weight: 950;
    letter-spacing: -.55px;
    text-transform: uppercase;

    text-rendering: geometricPrecision;
  }

  .summary-card p {
    margin: 0;

    color: rgba(255,255,255,.42);

    font-size: 10.5px;
    line-height: 1.35;
    font-weight: 750;
  }

  .category-list {
    margin-top: 9px;

    display: grid;
    gap: 6px;
  }

  .category-list div {
    display: flex;
    justify-content: space-between;
    align-items: center;

    gap: 10px;

    padding: 7px 8px;

    border: 1px solid rgba(255,255,255,.045);
    border-radius: 10px;

    background:
      linear-gradient(180deg, rgba(255,255,255,.018), rgba(255,255,255,0)),
      #101010;
  }

  .category-list strong {
    color: rgba(255,255,255,.62);

    font-size: 8.5px;
    font-weight: 950;
    letter-spacing: .34px;
    text-transform: uppercase;

    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .category-list small {
    color: #FFC400;

    font-size: 9px;
    font-weight: 950;
  }

  .publish-card {
    border-color: rgba(255,196,0,.26);

    background:
      linear-gradient(180deg, rgba(255,196,0,.055), rgba(255,196,0,0)),
      radial-gradient(circle at top, rgba(255,196,0,.045), transparent 62%),
      #141414;
  }

  .publish-card ul {
    margin: 10px 0 12px;
    padding: 0;

    list-style: none;

    display: grid;
    gap: 7px;
  }

  .publish-card li {
    color: rgba(255,255,255,.50);

    font-size: 10px;
    font-weight: 850;
    line-height: 1.25;
  }

  .publish-card li::before {
    content: "✓";
    margin-right: 7px;

    color: #FFC400;

    font-weight: 950;
  }

  .publish-card button {
    width: 100%;
    min-height: 38px;

    border-radius: 11px;
    border: 1px solid #FFC400;

    background:
      linear-gradient(180deg, rgba(255,255,255,.18), rgba(255,255,255,0)),
      #FFC400;

    color: #050505;

    font-size: 8.8px;
    font-weight: 950;
    letter-spacing: .58px;
    text-transform: uppercase;

    cursor: pointer;

    box-shadow:
      0 1px 0 rgba(255,255,255,.22) inset,
      0 0 18px rgba(255,196,0,.10);

    transition:
      transform .14s ease,
      box-shadow .14s ease,
      filter .14s ease;
  }

  .publish-card button:hover:not(:disabled) {
    transform: translateY(-1px);

    box-shadow:
      0 1px 0 rgba(255,255,255,.26) inset,
      0 0 24px rgba(255,196,0,.22);
  }

  .results-panel {
    margin-bottom: 10px;
  }

  .results-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(262px, 1fr));
    gap: 9px;
  }

  .result-card {
    padding: 11px;
  }

  .result-card.created {
    border-color: rgba(56,161,105,.24);
  }

  .mono {
    margin: 0 0 8px;

    color: rgba(255,255,255,.42);

    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 9px;
    line-height: 1.4;
    word-break: break-all;
  }

  .passport-strip {
    margin: 8px 0;
    padding: 8px;

    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;

    border: 1px solid rgba(0,209,255,.22);
    border-radius: 10px;

    background:
      linear-gradient(180deg, rgba(0,209,255,.055), rgba(0,209,255,0)),
      #101010;

    box-shadow:
      0 1px 0 rgba(255,255,255,.025) inset,
      0 0 12px rgba(0,209,255,.035);
  }

  .passport-strip span {
    color: #7DEBFF;

    font-size: 7.5px;
    font-weight: 950;
    letter-spacing: .58px;
    text-transform: uppercase;
  }

  .passport-strip strong {
    color: #f2f2f2;

    font-size: 9.5px;
    font-weight: 950;
    letter-spacing: .24px;
  }

  .result-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;

    margin-top: 10px;
  }

  .result-actions :global(a) {
    height: 26px;
    padding: 0 9px;

    display: inline-flex;
    align-items: center;
    justify-content: center;

    border-radius: 999px;
    border: 1px solid rgba(255,196,0,.26);

    background:
      linear-gradient(180deg, rgba(255,196,0,.055), rgba(255,196,0,0)),
      #101010;

    color: #FFC400;

    font-size: 7.8px;
    font-weight: 950;
    letter-spacing: .5px;
    text-transform: uppercase;
    text-decoration: none;

    transition:
      transform .14s ease,
      border-color .14s ease,
      background .14s ease;
  }

  .result-actions :global(a:hover) {
    transform: translateY(-1px);

    border-color: rgba(255,196,0,.48);

    background:
      linear-gradient(180deg, rgba(255,196,0,.10), rgba(255,196,0,0)),
      #15120a;
  }

  @media (max-width: 1050px) {
    .hero-panel,
    .studio-grid {
      grid-template-columns: 1fr;
    }

    .metric-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (max-width: 640px) {
    .env-shell {
      margin: 8px auto -6px;
      padding: 0 4%;
    }

    .intake-shell {
      padding: 0 4% 40px;
    }

    .hero-panel {
      padding: 18px;
    }

    .hero-copy h1 {
      font-size: 36px;
      letter-spacing: -1.2px;
    }

    .metric-grid {
      grid-template-columns: 1fr;
    }

    .machine-board,
    .results-grid {
      grid-template-columns: 1fr;
    }

    .seller-pill {
      width: 100%;
      align-items: flex-start;
      border-radius: 13px;
      flex-direction: column;
      gap: 4px;
    }
  }
`}</style>
    </>
  );
}
