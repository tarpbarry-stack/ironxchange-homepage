import { useState } from "react";

export default function DealerGraph() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [status, setStatus] = useState("");
  const [rows, setRows] = useState([]);
  const [crawlResults, setCrawlResults] = useState([]);
  const [totalEmails, setTotalEmails] = useState(0);
  const [totalPhones, setTotalPhones] = useState(0);

  async function handleUpload() {
    if (!selectedFile) {
      setStatus("Choose a CSV file first.");
      return;
    }

    const text = await selectedFile.text();

    const lines = text
      .split("\n")
      .filter((line) => line.trim() !== "");

    const parsedRows = lines.map((line) => line.split(","));

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
    setTotalEmails(data.totalEmails || 0);
    setTotalPhones(data.totalPhones || 0);

    setStatus(data.message);
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

      {status && (
        <p style={{ marginTop: "20px", color: "#f98512" }}>
          {status}
        </p>
      )}

      {crawlResults.length > 0 && (
        <div style={{ marginTop: "40px" }}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={cellStyle}>Company</th>
                <th style={cellStyle}>Emails</th>
                <th style={cellStyle}>Phones</th>
                <th style={cellStyle}>Contacts</th>
              </tr>
            </thead>

            <tbody>
              {crawlResults.map((dealer, index) => (
                <tr key={index}>
                  <td style={cellStyle}>{dealer.company}</td>

                  <td style={cellStyle}>
                    {(dealer.emails || []).join(", ")}
                  </td>

                  <td style={cellStyle}>
                    {(dealer.phones || []).join(", ")}
                  </td>

                  <td style={cellStyle}>
                    {(dealer.contacts || []).join(", ")}
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
  textDecoration: "none"
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  marginTop: "20px"
};

const cellStyle = {
  border: "1px solid #333",
  padding: "12px",
  textAlign: "left",
  verticalAlign: "top"
};
