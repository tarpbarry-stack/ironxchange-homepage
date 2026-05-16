const modules = [
  { title: "Dealer Graph", href: "/ixi/dealer-graph" },
  { title: "CRM", href: "/ixi/crm" },
  { title: "UCC Intelligence", href: "/ixi/ucc" },
  { title: "Social Wheel", href: "/ixi/social-wheel" },
  { title: "Auction Intel", href: "/ixi/auction-intel" },
  { title: "Imports / Exports", href: "/ixi/imports" }
];

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
      <div
  style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "40px",
    borderBottom: "1px solid #333",
    paddingBottom: "20px"
  }}
>
  <div>
    <h1 style={{ margin: 0 }}>IXI Command Center</h1>
    <p style={{ color: "#888", marginTop: "8px" }}>
      Private intelligence layer for IronXchange
    </p>
  </div>

  <div style={{ display: "flex", gap: "20px" }}>
    <a href="/ixi" style={navStyle}>Home</a>
    <a href="/ixi/dealer-graph" style={navStyle}>Dealer Graph</a>
    <a href="/ixi/crm" style={navStyle}>CRM</a>
    <a href="/ixi/ucc" style={navStyle}>UCC</a>
  </div>
</div>

      <p>Private intelligence layer for IronXchange.</p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "20px",
          marginTop: "40px"
        }}
      >
        {modules.map((item) => (
          <a key={item.href} href={item.href} style={cardStyle}>
            <div>
  <div style={{ fontSize: "22px", marginBottom: "10px" }}>
    {item.title}
  </div>

  <div style={{ color: "#888", fontSize: "14px" }}>
    Module initializing
  </div>
</div>
          </a>
        ))}
      </div>
    </main>
  );
}

const cardStyle = {
  display: "block",
  background: "#222",
  padding: "30px",
  borderRadius: "12px",
  border: "1px solid #333",
  fontSize: "20px",
  color: "#fff",
  textDecoration: "none",
  cursor: "pointer"

  const navStyle = {
  color: "#aaa",
  textDecoration: "none",
  fontSize: "14px"
};

};
