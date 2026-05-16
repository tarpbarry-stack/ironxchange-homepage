export default function SocialWheel() {
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
      <h1>Social Wheel</h1>

      <p style={{ color: "#888" }}>
        Social distribution and publishing engine for IronXchange.
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
          <p>Connected Accounts</p>
        </div>

        <div style={statCard}>
          <h2>0</h2>
          <p>Scheduled Posts</p>
        </div>

        <div style={statCard}>
          <h2>0</h2>
          <p>Published Today</p>
        </div>

        <div style={statCard}>
          <h2>0</h2>
          <p>Active Campaigns</p>
        </div>
      </div>

      <div style={panelStyle}>
        <h2>Social Wheel Controls</h2>

        <button style={buttonStyle}>
          Create Post
        </button>

        <button style={buttonStyle}>
          Schedule Distribution
        </button>

        <button style={buttonStyle}>
          View Queue
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
