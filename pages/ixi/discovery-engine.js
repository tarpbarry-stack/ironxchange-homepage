export default function DiscoveryEngine() {
  return (
    <main style={pageStyle}>
      <a href="/ixi" style={backLinkStyle}>
        ← Back to IXI Command Center
      </a>

      <h1>Discovery Engine</h1>

      <p style={mutedText}>
        Find new dealer, contractor, auction, and equipment company targets for IXI.
      </p>

      <div style={statsGrid}>
        <StatCard label="Sources" value="0" />
        <StatCard label="Discovered Companies" value="0" />
        <StatCard label="Dealer Targets" value="0" />
        <StatCard label="Contractor Targets" value="0" />
      </div>

      <section style={panelStyle}>
        <h2>Discovery Sources</h2>

        <div style={sourceGrid}>
          <SourceCard title="MachineryTrader Dealers" status="Coming Soon" />
          <SourceCard title="Google Maps Searches" status="Coming Soon" />
          <SourceCard title="Auction Sellers" status="Coming Soon" />
          <SourceCard title="AGC / Contractor Lists" status="Coming Soon" />
          <SourceCard title="OEM Dealer Locators" status="Coming Soon" />
          <SourceCard title="Manual Seed Lists" status="Active" />
        </div>
      </section>

      <section style={panelStyle}>
        <h2>Discovery Controls</h2>

        <div style={buttonRow}>
          <button style={buttonStyle}>
            Run Dealer Discovery
          </button>

          <button style={buttonStyle}>
            Run Contractor Discovery
          </button>

          <button style={buttonStyle}>
            Export Targets
          </button>
        </div>

        <p style={statusStyle}>
          Discovery Engine shell is live. Next step: connect source discovery APIs.
        </p>
      </section>
    </main>
  );
}

function StatCard({ label, value }) {
  return (
    <div style={statCard}>
      <h2>{value}</h2>
      <p>{label}</p>
    </div>
  );
}

function SourceCard({ title, status }) {
  return (
    <div style={sourceCard}>
      <h3>{title}</h3>
      <p style={mutedText}>{status}</p>
    </div>
  );
}

const pageStyle = {
  minHeight: "100vh",
  background: "#111",
  color: "#fff",
  padding: "40px",
  fontFamily: "Arial"
};

const mutedText = {
  color: "#888"
};

const backLinkStyle = {
  display: "inline-block",
  marginBottom: "30px",
  color: "#aaa",
  textDecoration: "none"
};

const statsGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
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
  marginTop: "40px",
  background: "#1a1a1a",
  padding: "30px",
  borderRadius: "12px",
  border: "1px solid #333"
};

const sourceGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "20px",
  marginTop: "20px"
};

const sourceCard = {
  background: "#222",
  padding: "20px",
  borderRadius: "12px",
  border: "1px solid #333"
};

const buttonRow = {
  display: "flex",
  gap: "12px",
  flexWrap: "wrap",
  marginTop: "20px"
};

const buttonStyle = {
  background: "#333",
  color: "#fff",
  border: "none",
  padding: "14px 22px",
  borderRadius: "8px",
  cursor: "pointer"
};

const statusStyle = {
  marginTop: "20px",
  color: "#f98512"
};
