import Head from "next/head";
import { useEffect, useMemo, useState } from "react";
import Papa from "papaparse";
import sharetribeSdk from "sharetribe-flex-sdk";
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

export default function BulkUploadPage() {
  const [authorId, setAuthorId] = useState("");
  const [sellerStatus, setSellerStatus] = useState("Checking logged-in seller...");
  const [rows, setRows] = useState([]);
  const [results, setResults] = useState([]);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState("");

  const validRows = useMemo(() => rows.filter(row => row.isValid), [rows]);
  const invalidRows = useMemo(() => rows.filter(row => !row.isValid), [rows]);

  useEffect(() => {
    async function loadCurrentSeller() {
      try {
        const clientId = process.env.NEXT_PUBLIC_SHARETRIBE_CLIENT_ID;

        if (!clientId) {
          setSellerStatus("Missing seller client ID");
          return;
        }

        const sdk = sharetribeSdk.createInstance({
          clientId,
        });

        const response = await sdk.currentUser.show();
        const uuid = response?.data?.data?.id?.uuid;

        if (!uuid) {
          setSellerStatus("No logged-in seller found");
          return;
        }

        setAuthorId(uuid);
        setSellerStatus("Seller account detected");
      } catch (err) {
        console.error("CURRENT SELLER LOAD FAILED:", err);
        setSellerStatus("Seller not detected. Log in and refresh.");
      }
    }

    loadCurrentSeller();
  }, []);

  function downloadTemplate() {
    const example = [
      CSV_HEADERS.join(","),
      [
        "DOZERS",
        "2021",
        "CATERPILLAR",
        "D6",
        "3210",
        "285000",
        "Dallas TX",
        "Clean machine tight undercarriage ready to work.",
        "gps rops good undercarriage",
        "",
        "STK-1001",
        "",
        "CAT00D6XXXXX",
        "Good",
        "Dallas",
        "TX",
      ].join(","),
    ].join("\n");

    const blob = new Blob([example], { type: "text/csv;charset=utf-8;" });
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
      setError("No logged-in seller detected. Log in and refresh.");
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
        <title>Bulk Upload | IronXchange</title>
      </Head>

      <main className="bulk-shell">
        <section className="bulk-hero">
          <div>
            <p className="eyebrow">SELLER INVENTORY</p>
            <h1>Bulk Upload</h1>
            <p>
              Load multiple machines into IronXchange, then launch them from
              Launch Studio.
            </p>
          </div>

          <button className="ghost-btn" onClick={downloadTemplate}>
            Download CSV Template
          </button>
        </section>

        <section className="bulk-grid">
          <div className="bulk-panel">
            <p className="panel-kicker">STEP 1</p>
            <h2>Upload CSV</h2>

            <label className="upload-box">
              <input type="file" accept=".csv" onChange={handleFileUpload} />
              <span>Upload CSV</span>
              <small>category, year, make, model, hours, price, location</small>
            </label>

            <div className="seller-detect-box">
              <strong>{sellerStatus}</strong>
              <small>
                Bulk Upload will import machines into the currently logged-in seller account.
              </small>
            </div>
          </div>

          <div className="bulk-panel">
            <p className="panel-kicker">STEP 2</p>
            <h2>Validation Status</h2>

            <div className="status-row">
              <div>
                <strong>{rows.length}</strong>
                <span>Total Rows</span>
              </div>
              <div>
                <strong>{validRows.length}</strong>
                <span>Ready</span>
              </div>
              <div>
                <strong>{invalidRows.length}</strong>
                <span>Needs Fix</span>
              </div>
            </div>

            {error && <div className="error-box">{error}</div>}

            <button
              className="primary-btn"
              disabled={isImporting || validRows.length === 0}
              onClick={importMachines}
            >
              {isImporting ? "Importing..." : "Import Machines"}
            </button>
          </div>
        </section>

        <section className="bulk-panel wide">
          <div className="panel-head">
            <div>
              <p className="panel-kicker">PREVIEW</p>
              <h2>Preview Rows</h2>
            </div>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Row</th>
                  <th>Status</th>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Location</th>
                  <th>Price</th>
                  <th>Errors</th>
                </tr>
              </thead>

              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="empty-cell">
                      Upload a CSV to preview machines.
                    </td>
                  </tr>
                ) : (
                  rows.map(row => (
                    <tr key={row.rowNumber}>
                      <td>{row.rowNumber}</td>
                      <td>
                        <span className={row.isValid ? "pill good" : "pill bad"}>
                          {row.isValid ? "Ready" : "Fix"}
                        </span>
                      </td>
                      <td>{row.title}</td>
                      <td>{row.category}</td>
                      <td>{row.location}</td>
                      <td>{row.price ? `$${row.price}` : "Call"}</td>
                      <td>{row.errors.join(", ")}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="bulk-panel wide">
          <p className="panel-kicker">IMPORT RESULTS</p>
          <h2>Row Results</h2>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Row</th>
                  <th>Status</th>
                  <th>Title</th>
                  <th>Listing ID</th>
                  <th>Error</th>
                </tr>
              </thead>

              <tbody>
                {results.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="empty-cell">
                      No import results yet.
                    </td>
                  </tr>
                ) : (
                  results.map(result => (
                    <tr key={`${result.row}-${result.title || result.error}`}>
                      <td>{result.row}</td>
                      <td>
                        <span
                          className={
                            result.status === "created" ? "pill good" : "pill bad"
                          }
                        >
                          {result.status}
                        </span>
                      </td>
                      <td>{result.title || "-"}</td>
                      <td>{result.listingId || "-"}</td>
                      <td>{result.error || "-"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      <style jsx>{`
        .bulk-shell {
          min-height: 100vh;
          background:
            radial-gradient(circle at top left, rgba(255, 196, 0, 0.12), transparent 32%),
            linear-gradient(180deg, #111315 0%, #070809 100%);
          color: #f5f5f5;
          padding: 34px 4%;
        }

        .bulk-hero {
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: linear-gradient(135deg, rgba(32, 35, 38, 0.96), rgba(13, 15, 17, 0.96));
          border-radius: 24px;
          padding: 28px;
          display: flex;
          justify-content: space-between;
          gap: 20px;
          align-items: center;
          box-shadow: 0 24px 80px rgba(0, 0, 0, 0.35);
          margin-bottom: 18px;
        }

        .eyebrow,
        .panel-kicker {
          color: #ffc400;
          font-size: 11px;
          letter-spacing: 0.16em;
          font-weight: 900;
          margin: 0 0 8px;
        }

        h1 {
          font-size: 42px;
          line-height: 1;
          margin: 0 0 10px;
        }

        h2 {
          font-size: 20px;
          margin: 0 0 16px;
        }

        p {
          color: #b9bec5;
          margin: 0;
        }

        .bulk-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 18px;
          margin-bottom: 18px;
        }

        .bulk-panel {
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(18, 20, 22, 0.92);
          border-radius: 22px;
          padding: 22px;
          box-shadow: 0 18px 50px rgba(0, 0, 0, 0.25);
        }

        .wide {
          margin-bottom: 18px;
        }

        .upload-box {
          border: 1px dashed rgba(255, 196, 0, 0.45);
          background: rgba(255, 196, 0, 0.06);
          border-radius: 18px;
          padding: 24px;
          display: grid;
          gap: 6px;
          cursor: pointer;
        }

        .upload-box input {
          display: none;
        }

        .upload-box span {
          font-size: 18px;
          font-weight: 900;
          color: #ffc400;
        }

        small {
          color: #858b94;
        }

        .seller-detect-box {
          margin-top: 16px;
          border: 1px solid rgba(255, 196, 0, 0.22);
          background: rgba(255, 196, 0, 0.06);
          border-radius: 14px;
          padding: 14px;
          display: grid;
          gap: 5px;
        }

        .seller-detect-box strong {
          color: #ffc400;
          font-size: 12px;
          font-weight: 950;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .seller-detect-box small {
          color: #858b94;
        }

        .status-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-bottom: 18px;
        }

        .status-row div {
          background: #0a0b0c;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          padding: 16px;
          display: grid;
          gap: 4px;
        }

        .status-row strong {
          font-size: 28px;
          color: #ffc400;
        }

        .status-row span {
          color: #aeb4bc;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          font-weight: 900;
        }

        .primary-btn,
        .ghost-btn {
          border: 0;
          border-radius: 999px;
          padding: 13px 18px;
          font-weight: 900;
          cursor: pointer;
        }

        .primary-btn {
          background: #ffc400;
          color: #111;
          width: 100%;
        }

        .primary-btn:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }

        .ghost-btn {
          background: rgba(255, 255, 255, 0.08);
          color: #f5f5f5;
          border: 1px solid rgba(255, 255, 255, 0.12);
          white-space: nowrap;
        }

        .error-box {
          background: rgba(255, 70, 70, 0.1);
          border: 1px solid rgba(255, 70, 70, 0.35);
          color: #ff9b9b;
          padding: 12px 14px;
          border-radius: 14px;
          margin-bottom: 14px;
          font-weight: 800;
        }

        .table-wrap {
          overflow-x: auto;
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        table {
          width: 100%;
          border-collapse: collapse;
          min-width: 900px;
          background: #090a0b;
        }

        th,
        td {
          text-align: left;
          padding: 13px 14px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.07);
          font-size: 13px;
          vertical-align: top;
        }

        th {
          color: #ffc400;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          background: #111315;
        }

        td {
          color: #d8dce1;
        }

        .pill {
          display: inline-flex;
          border-radius: 999px;
          padding: 5px 9px;
          font-size: 11px;
          font-weight: 900;
          text-transform: uppercase;
        }

        .pill.good {
          background: rgba(48, 209, 88, 0.12);
          color: #70f09a;
          border: 1px solid rgba(48, 209, 88, 0.28);
        }

        .pill.bad {
          background: rgba(255, 70, 70, 0.12);
          color: #ff9b9b;
          border: 1px solid rgba(255, 70, 70, 0.3);
        }

        .empty-cell {
          text-align: center;
          color: #777f89;
          padding: 30px;
        }

        @media (max-width: 800px) {
          .bulk-shell {
            padding: 14px;
          }

          .bulk-hero,
          .bulk-grid {
            grid-template-columns: 1fr;
          }

          .bulk-hero {
            display: grid;
          }

          h1 {
            font-size: 34px;
          }
        }
      `}</style>
    </>
  );
}
