import { useState } from "react";

export default function DealerGraph() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [status, setStatus] = useState("");
  const [rows, setRows] = useState([]);
  const [crawlTargets, setCrawlTargets] = useState([]);

  async function handleUpload() {
    if (!selectedFile) {
      setStatus("Choose a CSV file first.");
      return;
    }

    const text = await selectedFile.text();

    const lines = text.split("\n");

    const parsedRows = lines.map((line) => line.split(","));

    setRows(parsedRows);

    setStatus(`Loaded ${parsedRows.length} rows`);
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
          <h2>{crawlTargets.length}</h2>
          <p>Crawl Targets</p>
        </div>

        <div style={statCard}>
          <h2>0</h2>
          <p>Emails</p>
        </div>

        <div style={statCard}>
          <h2>0</h2>
          <p>Phone Numbers</p>
        </div>
      </div>

      <div style={panelStyle}>
        <h2>Import Dealer List</h2>

        <p style={{ color: "#888" }}>
          Upload a CSV with dealer company names and websites.
        </p>

        <input
          type="file"
          accept=".csv"
          onChange={(event) => setSelectedFile(event.target.files[0])}
          style={{ marginBottom: "20px" }}
        />

        <br />

        <button style={buttonStyle} onClick={handleUpload}>
          Upload Dealer CSV
        </button>

        <button
          style={buttonStyle}
          onClick={async () => {
            if (rows.length === 0) {
              setStatus("Upload a dealer CSV first.");
              return;
            }

            const response = await fetch("/api/dealer-crawl", {
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify({ rows })
            });

            const data = await response.json();

            setCrawlTargets(data.crawlTargets || []);

            setStatus(data.message);
          }}
        >
          Start Crawl
        </button>

        <button style={buttonStyle}>
          Export Contacts
        </button>

        {status && (
          <p style={{ marginTop: "20px", color: "#f98512" }}>
            {status}
          </p>
        )}
      </div>

      {crawlTargets.length > 0 && (
        <div style={tableWrapper}>
          <h2>Crawl Targets</h2>

          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={cellStyle}>Company</th>
                <th style={cellStyle}>Website</th>
                <th style={cellStyle}>Category</th>
                <th style={cellStyle}>State</th>
              </tr>
            </thead>

            <tbody>
              {crawlTargets.map((dealer, index) => (
                <tr key={index}>
                  <td style={cellStyle}>{dealer.company}</td>
                  <td style={cellStyle}>{dealer.website}</td>
                  <td style={cellStyle}>{dealer.category}</td>
                  <td style={cellStyle}>{dealer.state}</td>
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
  marginTop: "50px",
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

const backLinkStyle = {
  display: "inline-block",
  marginBottom: "30px",
  color: "#aaa",
  textDecoration: "none",
  fontSize: "14px"
};

const tableWrapper = {
  marginTop: "50px",
  background: "#1a1a1a",
  padding: "30px",
  borderRadius: "12px",
  border: "1px solid #333"
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  marginTop: "20px"
};

const cellStyle = {
  border: "1px solid #333",
  padding: "12px",
  textAlign: "left"
};
