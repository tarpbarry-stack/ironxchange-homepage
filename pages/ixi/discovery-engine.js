import { useEffect, useState } from "react";

async function safeJson(response) {
  const text = await response.text();

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(
      `Expected JSON but got ${response.status}: ${text.slice(0, 120)}`
    );
  }
}

export default function DiscoveryEngine() {
  const [targets, setTargets] = useState([]);
  const [status, setStatus] = useState("");
  const [company, setCompany] = useState("");
  const [website, setWebsite] = useState("");
  const [category, setCategory] = useState("Heavy Equipment");
  const [state, setState] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("ixiDiscoveryTargets");

    if (saved) {
      try {
        setTargets(JSON.parse(saved));
      } catch {
        localStorage.removeItem("ixiDiscoveryTargets");
      }
    }
  }, []);

  function saveTargets(nextTargets) {
    const deduped = dedupeTargets(nextTargets);

    setTargets(deduped);

    localStorage.setItem(
      "ixiDiscoveryTargets",
      JSON.stringify(deduped)
    );
  }

  function addTarget() {
    if (!company || !website) {
      setStatus("Company and website are required.");
      return;
    }

    const nextTarget = {
      company,
      website,
      category,
      state
    };

    saveTargets([...targets, nextTarget]);

    setCompany("");
    setWebsite("");
    setCategory("Heavy Equipment");
    setState("");

    setStatus(`Added ${nextTarget.company}`);
  }

  async function runDiscovery(endpoint, label) {
    setStatus(`Running ${label} discovery...`);

    try {
      const response = await fetch(endpoint, {
        method: "POST"
      });

      const data = await safeJson(response);

      if (!response.ok) {
        setStatus(data.message || `${label} discovery failed.`);
        return;
      }

      const discovered = data.targets || [];

      saveTargets([...targets, ...discovered]);

      setStatus(`Added ${discovered.length} ${label} targets.`);
    } catch (error) {
      setStatus(`${label} discovery error: ${error.message}`);
    }
  }

  function clearTargets() {
    localStorage.removeItem("ixiDiscoveryTargets");

    setTargets([]);

    setStatus("Discovery targets cleared.");
  }

  function exportTargets() {
    if (targets.length === 0) {
      setStatus("No targets to export.");
      return;
    }

    const header = "company,website,category,state\n";

    const rows = targets.map((target) => {
      return [
        cleanCsv(target.company),
        cleanCsv(target.website),
        cleanCsv(target.category),
        cleanCsv(target.state)
      ].join(",");
    });

    const csvContent = header + rows.join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;"
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;

    link.setAttribute(
      "download",
      "ixi-discovery-targets.csv"
    );

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    setStatus(`Exported ${targets.length} targets.`);
  }

  return (
    <main style={pageStyle}>
      <a href="/ixi" style={backLinkStyle}>
        ← Back to IXI Command Center
      </a>

      <h1>Discovery Engine</h1>

      <p style={mutedText}>
        Build and manage dealer, contractor, auction, and equipment company crawl targets.
      </p>

      <div style={statsGrid}>
        <StatCard label="Saved Targets" value={targets.length} />

        <StatCard
          label="Dealer Targets"
          value={
            targets.filter(
              (t) =>
                (t.category || "").includes("Dealer") ||
                (t.category || "").includes("Equipment")
            ).length
          }
        />

        <StatCard
          label="Contractor Targets"
          value={
            targets.filter((t) =>
              (t.category || "").includes("Contractor")
            ).length
          }
        />

        <StatCard
          label="States"
          value={
            new Set(
              targets.map((t) => t.state).filter(Boolean)
            ).size
          }
        />
      </div>

      <section style={panelStyle}>
        <h2>Add Discovery Target</h2>

        <div style={formGrid}>
          <input
            style={inputStyle}
            placeholder="Company name"
            value={company}
            onChange={(event) =>
              setCompany(event.target.value)
            }
          />

          <input
            style={inputStyle}
            placeholder="Website URL"
            value={website}
            onChange={(event) =>
              setWebsite(event.target.value)
            }
          />

          <input
            style={inputStyle}
            placeholder="Category"
            value={category}
            onChange={(event) =>
              setCategory(event.target.value)
            }
          />

          <input
            style={inputStyle}
            placeholder="State"
            value={state}
            onChange={(event) =>
              setState(event.target.value)
            }
          />
        </div>

        <div style={buttonRow}>
          <button style={buttonStyle} onClick={addTarget}>
            Add Target
          </button>

          <button
            style={buttonStyle}
            onClick={() =>
              runDiscovery(
                "/api/discover-machinerytrader",
                "MachineryTrader"
              )
            }
          >
            Run MachineryTrader Discovery
          </button>

          <button
            style={buttonStyle}
            onClick={() =>
              runDiscovery("/api/discover-google", "Google")
            }
          >
            Run Google Discovery
          </button>

          <button
            style={buttonStyle}
            onClick={() =>
              runDiscovery("/api/discover-oem", "OEM")
            }
          >
            Run OEM Discovery
          </button>

          <button style={buttonStyle} onClick={exportTargets}>
            Export Targets
          </button>

          <button
            style={dangerButton}
            onClick={clearTargets}
          >
            Clear Targets
          </button>
        </div>

        {status && (
          <p style={statusStyle}>{status}</p>
        )}
      </section>

      {targets.length > 0 && (
        <section style={tableWrapper}>
          <h2>Saved Discovery Targets</h2>

          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={cellStyle}>Company</th>
                <th style={cellStyle}>Website</th>
                <th style={cellStyle}>Category</th>
                <th style={cellStyle}>State</th>
              </tr>
            </thead>

            <tbody>
              {targets.map((target, index) => (
                <tr key={index}>
                  <td style={cellStyle}>
                    {target.company}
                  </td>

                  <td style={cellStyle}>
                    {target.website}
                  </td>

                  <td style={cellStyle}>
                    {target.category}
                  </td>

                  <td style={cellStyle}>
                    {target.state}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
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

function cleanCsv(value) {
  const text = String(value || "").replace(/"/g, '""');

  return `"${text}"`;
}

function dedupeTargets(items) {
  const seen = new Set();

  return items.filter((item) => {
    const key = String(item.website || item.company || "")
      .trim()
      .toLowerCase();

    if (!key || seen.has(key)) {
      return false;
    }

    seen.add(key);

    return true;
  });
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
  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
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

const formGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "14px",
  marginTop: "20px"
};

const inputStyle = {
  background: "#111",
  color: "#fff",
  border: "1px solid #333",
  padding: "14px",
  borderRadius: "8px"
};

const buttonRow = {
  display: "flex",
  gap: "12px",
  flexWrap: "wrap",
  marginTop: "24px"
};

const buttonStyle = {
  background: "#333",
  color: "#fff",
  border: "none",
  padding: "14px 22px",
  borderRadius: "8px",
  cursor: "pointer"
};

const dangerButton = {
  background: "#7a1f1f",
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

const tableWrapper = {
  marginTop: "50px",
  background: "#1a1a1a",
  padding: "30px",
  borderRadius: "12px",
  border: "1px solid #333",
  overflowX: "auto"
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse"
};

const cellStyle = {
  border: "1px solid #333",
  padding: "12px",
  textAlign: "left",
  verticalAlign: "top"
};
