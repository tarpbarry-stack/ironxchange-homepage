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
        {modules.map((item) => (
          <a key={item.href} href={item.href} style={cardStyle}>
            {item.title}
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
};
