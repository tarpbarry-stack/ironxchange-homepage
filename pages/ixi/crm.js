export default function CRM() {
  return (
    <main style={{ minHeight: "100vh", background: "#111", color: "#fff", padding: "40px", fontFamily: "Arial" }}>
      <h1>IXI CRM</h1>
      <p style={{ color: "#888" }}>Companies, contacts, notes, tags, and source history.</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px", marginTop: "40px" }}>
        <div style={statCard}><h2>0</h2><p>Companies</p></div>
        <div style={statCard}><h2>0</h2><p>Contacts</p></div>
        <div style={statCard}><h2>0</h2><p>Tags</p></div>
        <div style={statCard}><h2>0</h2><p>Tasks</p></div>
      </div>

      <div style={panelStyle}>
        <h2>CRM Controls</h2>
        <button style={buttonStyle}>Import Contacts</button>
        <button style={buttonStyle}>View Companies</button>
        <button style={buttonStyle}>Export CRM</button>
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
