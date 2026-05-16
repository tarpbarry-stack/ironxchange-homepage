export default function DealerGraph() {
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
      <a href="/ixi" style={backLinkStyle}>
        ← Back to IXI Command Center
      </a>

      <h1>Dealer Graph</h1>

      <p style={{ color: "#888" }}>
        Heavy equipment dealer intelligence engine
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
          <p>Dealers</p>
        </div>

        <div style={statCard}>
          <h2>0</h2>
          <p>Contacts</p>
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

      <div
        style={{
          marginTop: "50px",
          background: "#1a1a1a",
          padding: "30px",
          borderRadius: "12px",
          border: "1px solid #333"
        }}
      >
        <h2>Dealer Graph Controls</h2>

        <button style={buttonStyle}>
          Start Crawl
        </button>

        <button
          style={buttonStyle}
          onClick={async () => {
            const response = await fetch("/api/dealer-upload", {
              method: "POST"
            });

            const data = await response.json();

            alert(data.message);
          }}
        >
          Import Dealer List
        </button>

        <button style={buttonStyle}>
          Export Contacts
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
