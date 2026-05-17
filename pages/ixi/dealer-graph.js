import { useEffect, useState } from "react";

export default function DealerGraph() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [status, setStatus] = useState("");
  const [rows, setRows] = useState([]);
  const [crawlResults, setCrawlResults] = useState([]);
  const [isCrawling, setIsCrawling] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("ixiDealerGraphResults");

    if (saved) {
      try {
        setCrawlResults(JSON.parse(saved));
      } catch {
        localStorage.removeItem("ixiDealerGraphResults");
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "ixiDealerGraphResults",
      JSON.stringify(crawlResults)
    );
  }, [crawlResults]);

  const totalEmails = crawlResults.reduce(
    (sum, item) => sum + (item.emails?.length || 0),
    0
  );

  const totalPhones = crawlResults.reduce(
    (sum, item) => sum + (item.phones?.length || 0),
    0
  );

  const totalContacts = crawlResults.reduce(
    (sum, item) => sum + (item.contacts?.length || 0),
    0
  );

  async function handleUpload() {
    if (!selectedFile) {
      setStatus("Choose a CSV file first.");
      return;
    }

    const text = await selectedFile.text();

    const lines = text
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    const parsedRows = lines.map((line) =>
      line.split(",").map((cell) => cell.trim())
    );

    setRows(parsedRows);
    setStatus(`Loaded ${parsedRows.length} CSV rows.`);
  }

  async function handleCrawl() {
    if (rows.length === 0) {
      setStatus("Upload a dealer CSV first.");
      return;
    }

    setIsCrawling(true);
    setStatus("Scanning dealer websites...");

    try {
      const response = await fetch("/api/dealer-crawl", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ rows })
      });

      const data = await response.json();

      if (!response.ok) {
        setStatus(data.message || "Crawl failed.");
        return;
      }

      setCrawlResults(data.results || []);
      setStatus(data.message || "Crawl complete.");
    } catch (error) {
      setStatus(`Crawl error: ${error.message}`);
    } finally {
      setIsCrawling(false);
    }
  }

  function handleExport() {
    if (crawlResults.length === 0) {
      setStatus("No crawl results to export.");
      return;
    }

    const header =
      "Company,Website,Category,State,Contacts,Emails,Phones,Scanned Links\n";

    const csvRows = crawlResults.map((dealer) => {
      return [
        cleanCsv(dealer.company),
        cleanCsv(dealer.website),
        cleanCsv(dealer.category),
        cleanCsv(dealer.state),
        cleanCsv((dealer.contacts || []).join(" | ")),
        cleanCsv((dealer.emails || []).join(" | ")),
        cleanCsv((dealer.phones || []).join(" | ")),
        cleanCsv((dealer.scannedLinks || []).join(" | "))
      ].join(",");
    });

    const csvContent = header + csvRows.join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.setAttribute("download", "dealer-graph-results.csv");

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function clearResults() {
    localStorage.removeItem("ixiDealerGraphResults");
    setCrawlResults([]);
    setStatus("Dealer Graph results cleared.");
  }

  return (
    <main style={pageStyle}>
      <a href="/ixi" style={backLinkStyle}>
        ← Back to IXI Command Center
      </a>

      <h1>Dealer Graph</h1>

      <p style={mutedText}>
        Heavy equipment dealer intelligence engine.
      </p>

      <div style={statsGrid}>
        <StatCard label="CSV Rows" value={rows.length} />
        <StatCard label="Sites Scanned" value={crawlResults.length} />
        <StatCard label="Contacts" value={totalContacts} />
        <StatCard label="Emails" value={totalEmails} />
        <StatCard label="Phone Numbers" value={totalPhones} />
      </div>

      <section style={panelStyle}>
        <h2>Import Dealer List</h2>

        <p style={mutedText}>
          Upload a CSV with columns: company, website, category, state.
        </p>

        <input
          type="file"
          accept=".csv"
          onChange={(event) => setSelectedFile(event.target.files[0])}
        />

        <div style={buttonRow}>
          <button style={buttonStyle} onClick={handleUpload}>
            Upload Dealer CSV
          </button>

          <button
            style={buttonStyle}
            onClick={handleCrawl}
            disabled={isCrawling}
          >
            {isCrawling ? "Crawling..." : "Start Crawl"}
          </button>

          <button style={buttonStyle} onClick={handleExport}>
            Export Contacts
          </button>

          <button style={dangerButton} onClick={clearResults}>
            Clear Results
          </button>
        </div>

        {status && <p style={statusStyle}>{status}</p>}
      </section>

      {crawlResults.length > 0 && (
        <section style={tableWrapper}>
          <h2>Crawl Results</h2>

          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={cellStyle}>Company</th>
                <th style={cellStyle}>Website</th>
                <th style={cellStyle}>Category</th>
                <th style={cellStyle}>State</th>
                <th style={cellStyle}>Contacts</th>
                <th style={cellStyle}>Emails</th>
                <th style={cellStyle}>Phones</th>
                <th style={cellStyle}>Pages</th>
              </tr>
            </thead>

            <tbody>
              {crawlResults.map((dealer, index) => (
                <tr key={index}>
                  <td style={cellStyle}>{dealer.company || "—"}</td>
                  <td style={cellStyle}>{dealer.website || "—"}</td>
                  <td style={cellStyle}>{dealer.category || "—"}</td>
                  <td style={cellStyle}>{dealer.state || "—"}</td>
                  <td style={cellStyle}>
                    {(dealer.contacts || []).join(", ") || "—"}
                  </td>
                  <td style={cellStyle}>
                    {(dealer.emails || []).join(", ") || "—"}
                  </td>
                  <td style={cellStyle}>
                    {(dealer.phones || []).join(", ") || "—"}
                  </td>
                  <td style={cellStyle}>
                    {(dealer.scannedLinks || []).length}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </main>
  );
}

function StatCard({ label, value }) {
  return (
    <div style={statCard}>
      <h2>{value}</h2>
      <p>{label}</p>
    </div>
  );
}

function cleanCsv(value) {
  const text = String(value || "").replace(/"/g, '""');
  return `"${text}"`;
}

const pageStyle = {
  minHeight: "100vh",
  background: "#111",
  color: "#fff",
  padding: "40px",
  fontFamily: "Arial"
};

const mutedText = {
  color: "#888"
};

const statsGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
  gap: "20px",
  marginTop: "40px"
};

const statCard = {
  background: "#222",
  padding: "20px",
  borderRadius: "12px",
  border: "1px solid #333"
};

const panelStyle = {
  marginTop: "40px",
  background: "#1a1a1a",
  padding: "30px",
  borderRadius: "12px",
  border: "1px solid #333"
};

const buttonRow = {
  display: "flex",
  gap: "12px",
  flexWrap: "wrap",
  marginTop: "24px"
};

const buttonStyle = {
  background: "#333",
  color: "#fff",
  border: "none",
  padding: "14px 22px",
  borderRadius: "8px",
  cursor: "pointer"
};

const dangerButton = {
  background: "#7a1f1f",
  color: "#fff",
  border: "none",
  padding: "14px 22px",
  borderRadius: "8px",
  cursor: "pointer"
};

const statusStyle = {
  marginTop: "20px",
  color: "#f98512"
};

const backLinkStyle = {
  display: "inline-block",
  marginBottom: "30px",
  color: "#aaa",
  textDecoration: "none"
};

const tableWrapper = {
  marginTop: "50px",
  background: "#1a1a1a",
  padding: "30px",
  borderRadius: "12px",
  border: "1px solid #333",
  overflowX: "auto"
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse"
};

const cellStyle = {
  border: "1px solid #333",
  padding: "12px",
  textAlign: "left",
  verticalAlign: "top"
};
