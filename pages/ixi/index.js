export default function IXICommandCenter() {
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
      <h1>IXI Command Center</h1>

      <p>Private intelligence layer for IronXchange.</p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "20px",
          marginTop: "40px"
        }}
      >
        <div style={cardStyle}>Dealer Graph</div>
        <div style={cardStyle}>CRM</div>
        <div style={cardStyle}>UCC Intelligence</div>
        <div style={cardStyle}>Social Wheel</div>
        <div style={cardStyle}>Auction Intel</div>
        <div style={cardStyle}>Imports / Exports</div>
      </div>
    </main>
  );
}

const cardStyle = {
  background: "#222",
  padding: "30px",
  borderRadius: "12px",
  border: "1px solid #333",
  fontSize: "20px"
};
