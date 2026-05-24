import { useState } from "react";

async function safeJson(response) {
  const text = await response.text();

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(
      `Expected JSON but got ${response.status}: ${text.slice(0, 120)}`
    );
  }
}

export default function ContractorGraph() {
  const [status, setStatus] = useState("");
  const [rows, setRows] = useState([]);
  const [crawlResults, setCrawlResults] = useState([]);
  const [isCrawling, setIsCrawling] = useState(false);

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

  function loadContractorSeedTargets() {
    const header = ["company", "website", "category", "state"];

    const contractorTargets = [
      ["Zachry Construction", "https://www.zachrycorp.com", "Civil Contractor", "TX"],
      ["Austin Bridge & Road", "https://www.austin-ind.com", "Civil Contractor", "TX"],
      ["Webber", "https://www.wwebber.com", "Heavy Civil Contractor", "TX"],
      ["Sundt Construction", "https://www.sundt.com", "Heavy Civil Contractor", "US"],
      ["Granite Construction", "https://www.graniteconstruction.com", "Heavy Civil Contractor", "US"],
      ["Kiewit", "https://www.kiewit.com", "Heavy Civil Contractor", "US"],
      ["Hensel Phelps", "https://www.henselphelps.com", "General Contractor", "US"],
      ["Rogers-O’Brien", "https://www.r-o.com", "General Contractor", "TX"],
      ["McCarthy Building Companies", "https://www.mccarthy.com", "General Contractor", "US"],
      ["Fluor", "https://www.fluor.com", "Industrial Contractor", "US"]
    ];

    const nextRows = [header, ...contractorTargets];

    setRows(nextRows);
    setStatus(`Loaded ${contractorTargets.length} contractor seed targets.`);
  }

  async function handleCrawl() {
    if (rows.length <= 1) {
      setStatus("Load contractor targets first.");
      return;
    }

    setIsCrawling(true);
    setStatus("Crawling contractor websites...");

    try {
      const response = await fetch("/api/dealer-crawl", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ rows })
      });

      const data = await safeJson(response);

      if (!response.ok) {
        setStatus(data.message || "Contractor crawl failed.");
        return;
      }

      setCrawlResults(data.results || []);
      setStatus(data.message || "Contractor crawl complete.");
    } catch (error) {
      setStatus(`Crawl error: ${error.message}`);
    } finally {
      setIsCrawling(false);
    }
  }

  function handleExport() {
    if (crawlResults.length === 0) {
      setStatus("No contractor results to export.");
      return;
    }

    const header =
      "Company,Website,Category,State,Contacts,Emails,Phones,Scanned Links\n";

    const csvRows = crawlResults.map((item) => {
      return [
        cleanCsv(item.company),
        cleanCsv(item.website),
        cleanCsv(item.category),
        cleanCsv(item.state),
        cleanCsv((item.contacts || []).join(" | ")),
        cleanCsv((item.emails || []).join(" | ")),
        cleanCsv((item.phones || []).join(" | ")),
        cleanCsv((item.scannedLinks || []).join(" | "))
      ].join(",");
    });

    const csvContent = header + csvRows.join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.setAttribute("download", "contractor-graph-results.csv");

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setStatus(`Exported ${crawlResults.length} contractor results.`);
  }

  function clearResults() {
    setCrawlResults([]);
    setStatus("Contractor Graph results cleared.");
  }

  return (
    <main style={pageStyle}>
      <a href="/ixi" style={backLinkStyle}>
        ← Back to IXI Command Center
      </a>

      <h1>Contractor Graph</h1>

      <p style={mutedText}>
        Demand-side intelligence engine for contractors, dirt companies, civil firms, aggregate operators, pipeline contractors, and fleet owners.
      </p>

      <div style={statsGrid}>
        <StatCard label="Target Rows" value={rows.length} />
        <StatCard label="Sites Scanned" value={crawlResults.length} />
        <StatCard label="Contacts" value={totalContacts} />
        <StatCard label="Emails" value={totalEmails} />
        <StatCard label="Phone Numbers" value={totalPhones} />
      </div>

      <section style={panelStyle}>
        <h2>Contractor Crawler</h2>

        <p style={mutedText}>
          Load contractor seed targets, crawl their websites, extract contacts, then export usable buyer/customer intelligence.
        </p>

        <div style={buttonRow}>
          <button style={primaryButton} onClick={loadContractorSeedTargets}>
            Load Contractor Targets
          </button>

          <button
            style={buttonStyle}
            onClick={handleCrawl}
            disabled={isCrawling}
          >
            {isCrawling ? "Crawling..." : "Start Contractor Crawl"}
          </button>

          <button style={buttonStyle} onClick={handleExport}>
            Export Contractors
          </button>

          <button style={dangerButton} onClick={clearResults}>
            Clear Results
          </button>
        </div>

        {status && <p style={statusStyle}>{status}</p>}
      </section>

      {crawlResults.length > 0 && (
        <section style={tableWrapper}>
          <h2>Contractor Crawl Results</h2>

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
              {crawlResults.map((item, index) => (
                <tr key={index}>
                  <td style={cellStyle}>{item.company || "—"}</td>
                  <td style={cellStyle}>{item.website || "—"}</td>
                  <td style={cellStyle}>{item.category || "—"}</td>
                  <td style={cellStyle}>{item.state || "—"}</td>
                  <td style={cellStyle}>
                    {(item.contacts || []).join(", ") || "—"}
                  </td>
                  <td style={cellStyle}>
                    {(item.emails || []).join(", ") || "—"}
                  </td>
                  <td style={cellStyle}>
                    {(item.phones || []).join(", ") || "—"}
                  </td>
                  <td style={cellStyle}>
                    {(item.scannedLinks || []).length}
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

const backLinkStyle = {
  display: "inline-block",
  marginBottom: "30px",
  color: "#aaa",
  textDecoration: "none"
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

const primaryButton = {
  background: "#f98512",
  color: "#111",
  border: "none",
  padding: "14px 22px",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "bold"
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
