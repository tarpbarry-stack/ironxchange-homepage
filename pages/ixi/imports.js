export default function Imports() {
  return (
    <main style={{ minHeight: "100vh", background: "#111", color: "#fff", padding: "40px", fontFamily: "Arial" }}>
      <h1>Imports / Exports</h1>
      <p style={{ color: "#888" }}>Upload dealer lists, UCC files, auction exports, and download clean IXI data.</p>

      <div style={panelStyle}>
        <h2>Import Tools</h2>
        <button style={buttonStyle}>Upload Dealer CSV</button>
        <button style={buttonStyle}>Upload UCC File</button>
        <button style={buttonStyle}>Upload Auction Data</button>
      </div>

      <div style={panelStyle}>
        <h2>Export Tools</h2>
        <button style={buttonStyle}>Export Contacts</button>
        <button style={buttonStyle}>Export Companies</button>
        <button style={buttonStyle}>Export UCC Buyers</button>
      </div>
    </main>
  );
}

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
