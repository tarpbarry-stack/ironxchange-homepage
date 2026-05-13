export default function ListingPage() {
  return (
    <main style={{ padding: "40px", fontFamily: "Arial, sans-serif" }}>
     <div
  style={{
    display: "flex",
    alignItems: "baseline",
    gap: "20px",
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
          maxWidth: "1200px",
          height: "auto",
          display: "block",
          marginTop: "30px"
        }}
      />

      <p style={{ marginTop: "30px", fontSize: "20px" }}>
        LISTING PAGE ROUTE WORKS. CLEAN BUILD STARTS HERE.
      </p>
    </main>
  );
}
