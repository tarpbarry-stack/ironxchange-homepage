export default function UCC() {
  return (
    <main style={{ minHeight: "100vh", background: "#111", color: "#fff", padding: "40px", fontFamily: "Arial" }}>
      <h1>UCC Intelligence</h1>
      <p style={{ color: "#888" }}>Track active equipment buyers from financing filings.</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px", marginTop: "40px" }}>
        <div style={statCard}><h2>0</h2><p>Filings</p></div>
        <div style={statCard}><h2>0</h2><p>Equipment Buyers</p></div>
        <div style={statCard}><h2>0</h2><p>Texas Matches</p></div>
        <div style={statCard}><h2>0</h2><p>New This Week</p></div>
      </div>

      <div style={panelStyle}>
        <h2>UCC Controls</h2>
        <button style={buttonStyle}>Import Texas UCC</button>
        <button style={buttonStyle}>Scan Equipment</button>
        <button style={buttonStyle}>Export Buyers</button>
      </div>
    </main>
  );
}

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
