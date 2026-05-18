import { useState } from "react";

export default function DiscoveryEngine() {
  const [status, setStatus] = useState("");

  function seedTargets() {
    const targets = [
      {
        company: "HOLT CAT",
        website: "https://www.holtcat.com",
        category: "Heavy Equipment",
        state: "TX"
      },
      {
        company: "Warren CAT",
        website: "https://www.warrencat.com",
        category: "Heavy Equipment",
        state: "TX"
      },
      {
        company: "Kirby-Smith",
        website: "https://www.kirby-smith.com",
        category: "Heavy Equipment",
        state: "OK"
      },
      {
        company: "RDO Equipment",
        website: "https://www.rdoequipment.com",
        category: "Heavy Equipment",
        state: "ND"
      },
      {
        company: "Bobcat of Dallas",
        website: "https://www.bobcatofdallas.com",
        category: "Compact Equipment",
        state: "TX"
      }
    ];

    localStorage.setItem(
      "ixiDiscoveryTargets",
      JSON.stringify(targets)
    );

    setStatus(`Saved ${targets.length} discovery targets.`);
  }

  return (
    <main style={pageStyle}>
      <a href="/ixi" style={backLinkStyle}>
        ← Back to IXI Command Center
      </a>

      <h1>Discovery Engine</h1>

      <p style={mutedText}>
        Find new dealer and contractor crawl targets.
      </p>

      <section style={panelStyle}>
        <h2>Discovery Controls</h2>

        <button style={buttonStyle} onClick={seedTargets}>
          Seed Discovery Targets
        </button>

        {status && <p style={statusStyle}>{status}</p>}
      </section>
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

const mutedText = {
  color: "#888"
};

const backLinkStyle = {
  display: "inline-block",
  marginBottom: "30px",
  color: "#aaa",
  textDecoration: "none"
};

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
  borderRadius: "8px",
  cursor: "pointer"
};

const statusStyle = {
  marginTop: "20px",
  color: "#f98512"
};
