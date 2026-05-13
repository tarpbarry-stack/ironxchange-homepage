export default function ListingPage() {
  return (
    <main style={{ padding: "24px", fontFamily: "Arial, sans-serif" }}>
     <div
  style={{
    display: "flex",
    alignItems: "baseline",
    gap: "12px",
    flexWrap: "wrap"
  }}
>
<h1
  style={{
    margin: 0,
    fontSize: "20px",
    fontWeight: "700",
    lineHeight: 1.2,
    letterSpacing: "-0.1px"
  }}
>
  2020 DEERE 872GP
</h1>

<div
  style={{
    fontSize: "20px",
    fontWeight: "700",
    color: "#111"
  }}
>
  $179,000
</div>
</div>

<p
  style={{
    marginTop: "10px",
    fontSize: "15px",
    color: "#666"
  }}
>
  3,875 hrs · Colorado City, TX
</p>

    <img
  src="/images/2020-Deere-772GP.jpg"
  alt="2020 Deere 872GP"
  style={{
    width: "100%",
    maxWidth: "1400px",
    height: "72vh",
    minHeight: "420px",
    maxHeight: "760px",
    objectFit: "cover",
    display: "block",
    marginTop: "18px",
    borderRadius: "18px"
  }}
/>
<div style={{ marginTop: "22px", maxWidth: "760px" }}>
  <h2 style={{ fontSize: "20px", marginBottom: "12px" }}>
    Highlights
  </h2>

  <ul style={{ fontSize: "16px", lineHeight: "1.8", paddingLeft: "20px" }}>
    <li>3,875 hours</li>
    <li>Colorado City, TX</li>
    <li>Clean cab</li>
    <li>Push block</li>
    <li>Rear ripper</li>
    <li>Work-ready machine</li>
  </ul>
</div>
      
      <p style={{ marginTop: "18px", fontSize: "20px" }}>
        LISTING PAGE ROUTE WORKS. CLEAN BUILD STARTS HERE.
      </p>
    </main>
  );
}
