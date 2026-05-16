export default function AuctionIntel() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#111",
        color: "#fff",
        padding: "40px",
        fontFamily: "Arial"
      }}
    >
      <h1>Auction Intel</h1>

      <p style={{ color: "#888" }}>
        Auction pricing, machine comps, and market intelligence.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "20px",
          marginTop: "40px"
        }}
      >
        <div style={statCard}>
          <h2>0</h2>
          <p>Imported Results</p>
        </div>

        <div style={statCard}>
          <h2>0</h2>
          <p>Tracked Machines</p>
        </div>

        <div style={statCard}>
          <h2>0</h2>
          <p>Valuation Matches</p>
        </div>

        <div style={statCard}>
          <h2>0</h2>
          <p>Recent Auctions</p>
        </div>
      </div>

      <div style={panelStyle}>
        <h2>Auction Intel Controls</h2>

        <button style={buttonStyle}>
          Import Results
        </button>

        <button style={buttonStyle}>
          Search Comps
        </button>

        <button style={buttonStyle}>
          Export Valuations
        </button>
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
