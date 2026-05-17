import { useEffect, useState } from "react";

export default function DealerGraph() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [status, setStatus] = useState("");
  const [rows, setRows] = useState([]);
  const [crawlResults, setCrawlResults] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem(
      "ixiDealerGraphResults"
    );

    if (saved) {
      setCrawlResults(JSON.parse(saved));
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

  async function handleUpload() {
    if (!selectedFile) {
      setStatus("Choose a CSV file first.");
      return;
    }

    const text = await selectedFile.text();

    const lines = text
      .split("\n")
      .filter((line) => line.trim() !== "");

    const parsedRows = lines.map((line) =>
      line.split(",")
    );

    setRows(parsedRows);

    setStatus(`Loaded ${parsedRows.length} rows`);
  }

  async function handleCrawl() {
    if (rows.length === 0) {
      setStatus("Upload a dealer CSV first.");
      return;
    }

    setStatus("Scanning dealer websites...");

    const response = await fetch("/api/dealer-crawl", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ rows })
    });

    const data = await response.json();

    setCrawlResults(data.results || []);

    setStatus(data.message);
  }

  function handleExport() {
    if (crawlResults.length === 0) {
      setStatus("No crawl results to export.");
      return;
    }

    const header =
      "Company,Website,Contacts,Emails,Phones\n";

    const csvRows = crawlResults.map((dealer) => {
      return [
        `"${dealer.company || ""}"`,
        `"${dealer.website || ""}"`,
        `"${(dealer.contacts || []).join(" | ")}"`,
        `"${(dealer.emails || []).join(" | ")}"`,
        `"${(dealer.phones || []).join(" | ")}"`
      ].join(",");
    });

    const csvContent = header + csvRows.join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;"
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;

    link.setAttribute(
      "download",
      "dealer-graph-results.csv"
    );

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

      <p style={{ color: "#888" }}>
        Heavy equipment dealer intelligence engine
      </p>

      <div style={statsGrid}>
        <div style={statCard}>
          <h2>{rows.length}</h2>
          <p>CSV Rows</p>
        </div>

        <div style={statCard}>
          <h2>{crawlResults.length}</h2>
          <p>Sites Scanned</p>
        </div>

        <div style={statCard}>
          <h2>{totalEmails}</h2>
          <p>Emails</p>
        </div>

        <div style={statCard}>
          <h2>{totalPhones}</h2>
          <p>Phone Numbers</p>
        </div>
      </div>

      <div style={panelStyle}>
        <h2>Import Dealer List</h2>

        <input
          type="file"
          accept=".csv"
          onChange={(event) =>
            setSelectedFile(event.target.files[0])
          }
        />

        <br />
        <br />

        <button style={buttonStyle} onClick={handleUpload}>
          Upload Dealer CSV
        </button>

        <button style={buttonStyle} onClick={handleCrawl}>
          Start Crawl
        </button>

        <button style={buttonStyle} onClick={handleExport}>
          Export Contacts
        </button>

        <button style={dangerButton} onClick={clearResults}>
          Clear Results
        </button>

        {status && (
          <p style={statusStyle}>
            {status}
          </p>
        )}
      </div>

      {crawlResults.length > 0 && (
        <div style={tableWrapper}>
          <h2>Crawl Results</h2>

          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={cellStyle}>Company</th>
                <th style={cellStyle}>Website</th>
                <th style={cellStyle}>Contacts</th>
                <th style={cellStyle}>Emails</th>
                <th style={cellStyle}>Phones</th>
              </tr>
            </thead>

            <tbody>
              {crawlResults.map((dealer, index) => (
                <tr key={index}>
                  <td style={cellStyle}>
                    {dealer.company}
                  </td>

                  <td style={cellStyle}>
                    {dealer.website}
                  </td>

                  <td style={cellStyle}>
                    {(dealer.contacts || []).join(", ")}
                  </td>

                  <td style={cellStyle}>
                    {(dealer.emails || []).join(", ")}
                  </td>

                  <td style={cellStyle}>
                    {(dealer.phones || []).join(", ")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

const pageStyle = {
  minHeight: "100vh",
  background: "#111",
  color: "#fff",
  padding: "40px",
  fontFamily: "Arial"
};

const statsGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(4, 1fr)",
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

const buttonStyle = {
  background: "#333",
  color: "#fff",
  border: "none",
  padding: "14px 22px",
  marginRight: "15px",
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
