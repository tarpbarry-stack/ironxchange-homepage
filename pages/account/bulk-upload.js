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

  const validRows = useMemo(
    () => rows.filter(row => row.isValid),
    [rows]
  );

  const invalidRows = useMemo(
    () => rows.filter(row => !row.isValid),
    [rows]
  );

  useEffect(() => {
    async function loadCurrentSeller() {
      try {
        const clientId =
          process.env.NEXT_PUBLIC_SHARETRIBE_CLIENT_ID;

        if (!clientId) {
          setSellerStatus("Missing seller client ID");
          return;
        }

        const sdk = sharetribeSdk.createInstance({
          clientId,
        });

        const response =
          await sdk.currentUser.show();

        const uuid =
          response?.data?.data?.id?.uuid;

        if (!uuid) {
          setSellerStatus(
            "Seller not detected. Use UUID below."
          );
          return;
        }

        setAuthorId(uuid);

        setSellerStatus(
          "Seller account detected"
        );

      } catch (err) {
        console.error(
          "CURRENT SELLER LOAD FAILED:",
          err
        );

        setSellerStatus(
          "Seller not detected. Use UUID below."
        );
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
        "Clean machine ready to work.",
        "gps,rops",
        "",
        "STK-1001",
        "",
        "CAT00D6XXXXX",
        "Good",
        "Dallas",
        "TX",
      ].join(","),
    ].join("\n");

    const blob = new Blob(
      [example],
      { type: "text/csv;charset=utf-8;" }
    );

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;

    link.download =
      "ironxchange-bulk-upload-template.csv";

    link.click();

    URL.revokeObjectURL(url);
  }

  function handleFileUpload(event) {
    setError("");
    setResults([]);

    const file =
      event.target.files?.[0];

    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,

      complete: result => {
        const normalized =
          result.data.map((row, index) =>
            normalizeListingRow(
              row,
              index
            )
          );

        setRows(normalized);
      },

      error: err => {
        setError(
          err?.message ||
          "CSV parse failed"
        );
      },
    });
  }

  async function importMachines() {
    setError("");
    setResults([]);

    if (!authorId.trim()) {
      setError(
        "Missing seller UUID"
      );
      return;
    }

    if (validRows.length === 0) {
      setError(
        "No valid rows to import."
      );
      return;
    }

    setIsImporting(true);

    try {
      const response =
        await fetch(
          "/api/bulk-create-listings",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              authorId:
                authorId.trim(),

              rows,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok && !data.results) {
        throw new Error(
          data?.error ||
          "Import failed"
        );
      }

      setResults(
        data.results || []
      );

    } catch (err) {
      setError(
        err?.message ||
        "Import failed"
      );

    } finally {
      setIsImporting(false);
    }
  }

  return (
    <>
      <Head>
        <title>
          Bulk Upload | IronXchange
        </title>
      </Head>

      <main className="bulk-shell">

        <section className="bulk-hero">
          <div>
            <p className="eyebrow">
              SELLER INVENTORY
            </p>

            <h1>
              Bulk Upload
            </h1>

            <p>
              Load multiple machines
              into IronXchange.
            </p>
          </div>

          <button
            className="ghost-btn"
            onClick={downloadTemplate}
          >
            Download CSV Template
          </button>
        </section>

        <section className="bulk-grid">

          <div className="bulk-panel">

            <p className="panel-kicker">
              STEP 1
            </p>

            <h2>
              Upload CSV
            </h2>

            <label className="upload-box">

              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
              />

              <span>
                Upload CSV
              </span>

              <small>
                category, year, make,
                model, hours, price,
                location
              </small>
            </label>

            <div className="seller-detect-box">

              <strong>
                {sellerStatus}
              </strong>

              <small>
                Auto seller detection
                is not available yet.
                Use seller UUID for V1.
              </small>

              <input
                value={authorId}
                onChange={event =>
                  setAuthorId(
                    event.target.value
                  )
                }
                placeholder="Seller UUID"
              />
            </div>
          </div>

          <div className="bulk-panel">

            <p className="panel-kicker">
              STEP 2
            </p>

            <h2>
              Validation Status
            </h2>

            <div className="status-row">

              <div>
                <strong>
                  {rows.length}
                </strong>

                <span>
                  Total Rows
                </span>
              </div>

              <div>
                <strong>
                  {validRows.length}
                </strong>

                <span>
                  Ready
                </span>
              </div>

              <div>
                <strong>
                  {invalidRows.length}
                </strong>

                <span>
                  Needs Fix
                </span>
              </div>

            </div>

            {error && (
              <div className="error-box">
                {error}
              </div>
            )}

            <button
              className="primary-btn"
              disabled={
                isImporting ||
                validRows.length === 0
              }
              onClick={importMachines}
            >
              {isImporting
                ? "Importing..."
                : "Import Machines"}
            </button>
          </div>
        </section>

        <section className="bulk-panel wide">

          <p className="panel-kicker">
            PREVIEW
          </p>

          <h2>
            Preview Rows
          </h2>

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
                    <td
                      colSpan="7"
                      className="empty-cell"
                    >
                      Upload CSV to preview.
                    </td>
                  </tr>

                ) : (
                  rows.map(row => (
                    <tr key={row.rowNumber}>

                      <td>
                        {row.rowNumber}
                      </td>

                      <td>
                        <span
                          className={
                            row.isValid
                              ? "pill good"
                              : "pill bad"
                          }
                        >
                          {row.isValid
                            ? "Ready"
                            : "Fix"}
                        </span>
                      </td>

                      <td>
                        {row.title}
                      </td>

                      <td>
                        {row.category}
                      </td>

                      <td>
                        {row.location}
                      </td>

                      <td>
                        {row.price
                          ? `$${row.price}`
                          : "Call"}
                      </td>

                      <td>
                        {row.errors.join(", ")}
                      </td>

                    </tr>
                  ))
                )}

              </tbody>
            </table>
          </div>
        </section>

        <section className="bulk-panel wide">

          <p className="panel-kicker">
            IMPORT RESULTS
          </p>

          <h2>
            Row Results
          </h2>

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
                    <td
                      colSpan="5"
                      className="empty-cell"
                    >
                      No import results yet.
                    </td>
                  </tr>

                ) : (
                  results.map(result => (
                    <tr
                      key={`${result.row}-${result.title}`}
                    >

                      <td>
                        {result.row}
                      </td>

                      <td>
                        <span
                          className={
                            result.status ===
                            "created"
                              ? "pill good"
                              : "pill bad"
                          }
                        >
                          {result.status}
                        </span>
                      </td>

                      <td>
                        {result.title}
                      </td>

                      <td>
                        {result.listingId || "-"}
                      </td>

                      <td>
                        {result.error || "-"}
                      </td>

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
            radial-gradient(circle at top left, rgba(255,196,0,.12), transparent 32%),
            linear-gradient(180deg, #111315 0%, #070809 100%);
          color: #f5f5f5;
          padding: 34px 4%;
        }

        .bulk-hero,
        .bulk-panel {
          border: 1px solid rgba(255,255,255,.1);
          background: rgba(18,20,22,.92);
          border-radius: 22px;
          padding: 22px;
          margin-bottom: 18px;
        }

        .bulk-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 18px;
        }

        .eyebrow,
        .panel-kicker {
          color: #ffc400;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: .16em;
        }

        .upload-box {
          border: 1px dashed rgba(255,196,0,.45);
          background: rgba(255,196,0,.06);
          border-radius: 18px;
          padding: 24px;
          display: grid;
          gap: 6px;
          cursor: pointer;
        }

        .upload-box input {
          display: none;
        }

        .seller-detect-box {
          margin-top: 16px;
          border: 1px solid rgba(255,196,0,.22);
          background: rgba(255,196,0,.06);
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
        }

        .seller-detect-box input {
          margin-top: 8px;
          height: 36px;
          border: 1px solid rgba(255,196,0,.24);
          border-radius: 10px;
          background: #08090a;
          color: #f5f5f5;
          padding: 0 10px;
          font-size: 12px;
          font-weight: 800;
          outline: none;
        }

        .status-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-bottom: 18px;
        }

        .status-row div {
          background: #0a0b0c;
          border-radius: 16px;
          padding: 16px;
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

        .table-wrap {
          overflow-x: auto;
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        th,
        td {
          padding: 13px 14px;
          border-bottom: 1px solid rgba(255,255,255,.07);
        }

        .pill {
          border-radius: 999px;
          padding: 5px 9px;
          font-size: 11px;
          font-weight: 900;
        }

        .pill.good {
          background: rgba(48,209,88,.12);
          color: #70f09a;
        }

        .pill.bad {
          background: rgba(255,70,70,.12);
          color: #ff9b9b;
        }

        .empty-cell {
          text-align: center;
          padding: 30px;
        }
      `}</style>
    </>
  );
}
