const BRAND_YELLOW = "#FFC400";

export default function ListingPage() {
  return (
    <main
      style={{
        padding: "24px",
        fontFamily: "Arial, sans-serif",
        background: "#0B0B0B",
        minHeight: "100vh",
        color: "#F5F5F5"
      }}
    >

<header
  style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "18px 24px",
    marginBottom: "24px",
    background: "#050505",
    borderRadius: "14px",
    border: "1px solid #1A1A1A"
  }}
>
  <a href="/" style={{ textDecoration: "none" }}>
    <img
      src="/images/ironxchange-logo.png"
      alt="IronXchange"
      style={{
        height: "56px",
        display: "block"
      }}
    />
  </a>

  <div
    style={{
      display: "flex",
      gap: "28px",
      alignItems: "center",
      fontSize: "13px",
      fontWeight: "700",
      textTransform: "uppercase"
    }}
  >
    <a href="/browse" style={{ color: "#fff", textDecoration: "none" }}>
      Browse
    </a>

    <a
      href="/create-listing"
      style={{
        color: BRAND_YELLOW,
        textDecoration: "none"
      }}
    >
      Post Equipment Free
    </a>

    <a href="/login" style={{ color: "#fff", textDecoration: "none" }}>
      Login
    </a>
  </div>
</header>

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
    letterSpacing: "-0.1px",
    color: "#F5F5F5"
  }}
>
  2020 DEERE 872GP
</h1>

<div
  style={{
    fontSize: "20px",
    fontWeight: "700",
    color: "#F5F5F5"
  }}
>
  $179,000
</div>
</div>

<p
  style={{
    marginTop: "10px",
    fontSize: "15px",
    color: "#999"
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
  height: "auto",
  maxHeight: "760px",
  objectFit: "contain",
  display: "block",
  marginTop: "18px",
  borderRadius: "18px",
  background: "#111"
}}
/>

<div
  style={{
    marginTop: "22px",
    maxWidth: "760px",
    background: "#151515",
    padding: "24px",
    borderRadius: "18px",
    border: "1px solid #222"
  }}
>
  <h2
    style={{
      fontSize: "20px",
      marginBottom: "12px",
      color: "#F5F5F5"
    }}
  >
    Highlights
  </h2>

  <ul
    style={{
      fontSize: "16px",
      lineHeight: "1.8",
      paddingLeft: "20px",
      color: "#DDD"
    }}
  >
    <li>3,875 hours</li>
    <li>Colorado City, TX</li>
    <li>Clean cab</li>
    <li>Push block</li>
    <li>Rear ripper</li>
    <li>Work-ready machine</li>
  </ul>
</div>

    </main>
  );
}
