import { useState } from "react";

export default function DealerGraph() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [status, setStatus] = useState("");

  async function handleUpload() {
    if (!selectedFile) {
      setStatus("Choose a CSV file first.");
      return;
    }

    setStatus(`Selected file: ${selectedFile.name}`);
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
        <div style={statCard}><h2>0</h2><p>Dealers</p></div>
        <div style={statCard}><h2>0</h2><p>Contacts</p></div>
        <div style={statCard}><h2>0</h2><p>Emails</p></div>
        <div style={statCard}><h2>0</h2><p>Phone Numbers</p></div>
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

        <button style={buttonStyle}>
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
