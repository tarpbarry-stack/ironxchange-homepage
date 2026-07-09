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
        }

        main {
          min-height: 100vh;
          background:
            radial-gradient(circle at top center, rgba(255,196,0,.045), transparent 30%),
            radial-gradient(circle at 18% 12%, rgba(0,209,255,.045), transparent 24%),
            linear-gradient(180deg, #101010 0%, #070707 100%);
        }

        .env-shell {
          max-width: 1600px;
          margin: 12px auto -4px;
          padding: 0 2%;
        }

        .intake-shell {
          max-width: 1600px;
          margin: 0 auto;
          padding: 14px 2% 54px;
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
          border: 1px solid rgba(255,255,255,.075);
          outline: 1px solid rgba(255,255,255,.018);
          border-radius: 18px;
          background:
            linear-gradient(180deg, rgba(255,255,255,.038), rgba(255,255,255,0)),
            radial-gradient(circle at top left, rgba(255,255,255,.025), transparent 64%),
            #141414;
          box-shadow:
            0 1px 0 rgba(255,255,255,.045) inset,
            0 20px 46px rgba(0,0,0,.24);
        }

        .hero-panel {
          min-height: 260px;
          padding: 30px;
          display: grid;
          grid-template-columns: minmax(0, 1fr) 430px;
          gap: 28px;
          align-items: stretch;
          margin-bottom: 14px;
        }

        .hero-copy span,
        .panel-head span,
        .summary-card span,
        .publish-card span,
        .metric-card span {
          display: block;
          color: #ffc400;
          font-size: 8.5px;
          font-weight: 950;
          letter-spacing: .9px;
          text-transform: uppercase;
        }

        .hero-copy h1 {
          margin: 8px 0 10px;
          color: #f4f4f4;
          font-size: clamp(42px, 6vw, 78px);
          line-height: .92;
          font-weight: 950;
          letter-spacing: -3px;
          text-transform: uppercase;
        }

        .hero-copy p {
          max-width: 760px;
          margin: 0;
          color: rgba(255,255,255,.56);
          font-size: 16px;
          line-height: 1.5;
        }

        .seller-pill {
          width: fit-content;
          margin-top: 22px;
          padding: 10px 13px;
          border: 1px solid rgba(0,209,255,.22);
          border-radius: 999px;
          background: rgba(0,209,255,.045);
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .seller-pill strong {
          color: #7debff;
          font-size: 9px;
          font-weight: 950;
          letter-spacing: .62px;
          text-transform: uppercase;
        }

        .seller-pill small {
          color: rgba(255,255,255,.48);
          font-size: 10px;
          font-weight: 850;
        }

        .hero-actions {
          display: grid;
          gap: 10px;
          align-content: center;
        }

        .hero-actions button {
          min-height: 58px;
          padding: 0 18px;
          border-radius: 15px;
          border: 1px solid rgba(255,255,255,.08);
          background:
            linear-gradient(180deg, rgba(255,255,255,.03), rgba(255,255,255,0)),
            #101010;
          color: #f2f2f2;
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 11px;
          font-weight: 950;
          letter-spacing: .7px;
          text-transform: uppercase;
          cursor: pointer;
          transition: transform .14s ease, border-color .14s ease, color .14s ease;
        }

        .hero-actions button:hover:not(:disabled) {
          transform: translateY(-1px);
          color: #ffc400;
          border-color: rgba(255,196,0,.32);
        }

        .hero-actions button span {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          background: rgba(255,255,255,.06);
          color: rgba(255,255,255,.54);
        }

        .hero-actions .primary-action {
          background:
            linear-gradient(180deg, rgba(255,255,255,.20), rgba(255,255,255,0)),
            #ffc400;
          border-color: #ffc400;
          color: #050505;
        }

        .hero-actions button:disabled,
        .publish-card button:disabled {
          opacity: .38;
          cursor: not-allowed;
        }

        .error-banner {
          margin-bottom: 14px;
          padding: 13px 16px;
          display: flex;
          justify-content: space-between;
          gap: 14px;
          border-color: rgba(255,90,90,.32);
          background:
            linear-gradient(180deg, rgba(255,70,70,.08), rgba(255,70,70,0)),
            #141414;
        }

        .error-banner strong {
          color: #ff9b9b;
          font-size: 10px;
          font-weight: 950;
          text-transform: uppercase;
        }

        .error-banner span {
          color: rgba(255,255,255,.72);
          font-size: 12px;
        }

        .metric-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 14px;
        }

        .metric-card {
          min-height: 128px;
          padding: 18px;
        }

        .metric-card strong {
          display: block;
          margin: 12px 0 5px;
          color: #f4f4f4;
          font-size: 36px;
          font-weight: 950;
          letter-spacing: -1.2px;
        }

        .metric-card small {
          color: rgba(255,255,255,.42);
          font-size: 11px;
          font-weight: 850;
        }

        .metric-card.good {
          border-color: rgba(56,161,105,.26);
        }

        .metric-card.warn {
          border-color: rgba(246,173,85,.25);
        }

        .metric-card.passport {
          border-color: rgba(0,209,255,.20);
        }

        .studio-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 340px;
          gap: 14px;
          align-items: start;
          margin-bottom: 14px;
        }

        .review-panel,
        .results-panel {
          padding: 18px;
        }

        .panel-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 14px;
          padding-bottom: 12px;
          margin-bottom: 14px;
          border-bottom: 1px solid rgba(255,255,255,.055);
        }

        .panel-head h2 {
          margin: 4px 0 0;
          color: #f4f4f4;
          font-size: 18px;
          font-weight: 950;
          letter-spacing: -.4px;
          text-transform: uppercase;
        }

        .panel-head small {
          color: rgba(255,255,255,.45);
          font-size: 10px;
          font-weight: 950;
          text-transform: uppercase;
        }

        .empty-state,
        .empty-results {
          min-height: 260px;
          display: grid;
          place-items: center;
          text-align: center;
          border: 1px dashed rgba(255,255,255,.10);
          border-radius: 16px;
          background: rgba(0,0,0,.12);
          padding: 30px;
        }

        .empty-state span,
        .empty-results span {
          color: #7debff;
          font-size: 9px;
          font-weight: 950;
          letter-spacing: .8px;
          text-transform: uppercase;
        }

        .empty-state h3 {
          margin: 8px 0 6px;
          color: #f4f4f4;
          font-size: 22px;
          font-weight: 950;
        }

        .empty-state p {
          max-width: 520px;
          margin: 0 auto;
          color: rgba(255,255,255,.48);
          font-size: 13px;
          line-height: 1.5;
        }

        .machine-board {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(265px, 1fr));
          gap: 12px;
        }

        .machine-object {
          padding: 14px;
          min-height: 186px;
          position: relative;
          overflow: hidden;
        }

        .machine-object.ready {
          border-color: rgba(56,161,105,.24);
        }

        .machine-object.needs-review {
          border-color: rgba(255,90,90,.28);
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
          text-transform: uppercase;
          letter-spacing: .6px;
        }

        .machine-topline strong,
        .result-status strong {
          padding: 4px 7px;
          border-radius: 999px;
          color: #70f09a;
          border: 1px solid rgba(56,161,105,.28);
          background: rgba(56,161,105,.08);
          font-size: 7.5px;
          font-weight: 950;
          text-transform: uppercase;
        }

        .machine-object.needs-review .machine-topline strong,
        .result-card.failed .result-status strong {
          color: #ff9b9b;
          border-color: rgba(255,90,90,.34);
          background: rgba(255,90,90,.08);
        }

        .machine-object h3,
        .result-card h3 {
          margin: 12px 0 12px;
          color: #f4f4f4;
          font-size: 17px;
          font-weight: 950;
          letter-spacing: -.35px;
          line-height: 1.08;
          text-transform: uppercase;
        }

        .machine-facts {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 6px;
        }

        .machine-facts span {
          min-height: 25px;
          padding: 6px 7px;
          border-radius: 8px;
          background: rgba(0,0,0,.20);
          color: rgba(255,255,255,.58);
          font-size: 9px;
          font-weight: 850;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .keyword-row {
          margin-top: 10px;
          display: flex;
          flex-wrap: wrap;
          gap: 5px;
        }

        .keyword-row small {
          padding: 4px 6px;
          border-radius: 999px;
          border: 1px solid rgba(255,196,0,.22);
          color: #ffc400;
          background: rgba(255,196,0,.055);
          font-size: 8px;
          font-weight: 850;
        }

        .row-errors,
        .result-error {
          margin-top: 10px;
          color: #ff9b9b;
          font-size: 10px;
          line-height: 1.4;
        }

        .summary-rail {
          display: grid;
          gap: 12px;
        }

        .summary-card,
        .publish-card {
          padding: 17px;
        }

        .summary-card h2,
        .publish-card h2 {
          margin: 8px 0 4px;
          color: #f4f4f4;
          font-size: 25px;
          font-weight: 950;
          letter-spacing: -.8px;
        }

        .summary-card p {
          margin: 0;
          color: rgba(255,255,255,.44);
          font-size: 11px;
          line-height: 1.45;
        }

        .category-list {
          margin-top: 12px;
          display: grid;
          gap: 7px;
        }

        .category-list div {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          padding: 8px;
          border-radius: 10px;
          background: rgba(0,0,0,.18);
        }

        .category-list strong {
          color: rgba(255,255,255,.68);
          font-size: 9px;
          font-weight: 950;
          text-transform: uppercase;
        }

        .category-list small {
          color: #ffc400;
          font-size: 10px;
          font-weight: 950;
        }

        .publish-card {
          border-color: rgba(255,196,0,.26);
        }

        .publish-card ul {
          margin: 13px 0 16px;
          padding: 0;
          list-style: none;
          display: grid;
          gap: 8px;
        }

        .publish-card li {
          color: rgba(255,255,255,.54);
          font-size: 11px;
          font-weight: 850;
        }

        .publish-card li::before {
          content: "✓";
          color: #ffc400;
          margin-right: 7px;
        }

        .publish-card button {
          width: 100%;
          min-height: 42px;
          border: 1px solid #ffc400;
          border-radius: 12px;
          background:
            linear-gradient(180deg, rgba(255,255,255,.18), rgba(255,255,255,0)),
            #ffc400;
          color: #050505;
          font-size: 9px;
          font-weight: 950;
          letter-spacing: .7px;
          text-transform: uppercase;
          cursor: pointer;
        }

        .results-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 12px;
        }

        .result-card {
          padding: 14px;
        }

        .result-card.created {
          border-color: rgba(56,161,105,.24);
        }

        .mono {
          margin: 0 0 10px;
          color: rgba(255,255,255,.44);
          font-family: monospace;
          font-size: 10px;
          word-break: break-all;
        }

        .passport-strip {
          margin: 10px 0;
          padding: 9px;
          border-radius: 11px;
          border: 1px solid rgba(0,209,255,.18);
          background: rgba(0,209,255,.05);
          display: flex;
          justify-content: space-between;
          gap: 10px;
        }

        .passport-strip span {
          color: #7debff;
          font-size: 8px;
          font-weight: 950;
          text-transform: uppercase;
        }

        .passport-strip strong {
          color: #f4f4f4;
          font-size: 10px;
          font-weight: 950;
        }

        .result-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
          margin-top: 12px;
        }

        .result-actions :global(a) {
          height: 27px;
          padding: 0 10px;
          border-radius: 999px;
          border: 1px solid rgba(255,196,0,.22);
          color: #ffc400;
          background: rgba(255,196,0,.055);
          display: inline-flex;
          align-items: center;
          text-decoration: none;
          font-size: 8px;
          font-weight: 950;
          text-transform: uppercase;
          letter-spacing: .5px;
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
          .intake-shell {
            padding: 10px 4% 40px;
          }

          .hero-panel {
            padding: 22px;
          }

          .metric-grid {
            grid-template-columns: 1fr;
          }

          .machine-board,
          .results-grid {
            grid-template-columns: 1fr;
          }

          .seller-pill {
            align-items: flex-start;
            border-radius: 14px;
            flex-direction: column;
          }
        }
      `}</style>
    </>
  );
}
