import Head from "next/head";

const STAGING = "https://staging.ironxchange.com";
const BRAND_YELLOW = "#FFC400";

export default function ListingPage() {
  return (
    <>
  <Head>
    <title>2020 DEERE 872GP | IronXchange</title>

    <link
      href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"
      rel="stylesheet"
    />
  </Head>
    <main
      style={{
        padding: "24px",
        fontFamily: "Arial, sans-serif",
        background: "#0B0B0B",
        minHeight: "100vh",
        color: "#F5F5F5"
      }}
    >

<nav className="nav">
  <a href="/" className="logo-wrap">
    <img
      src="/images/ironxchange-logo.png"
      className="logo-img"
      alt="IronXchange"
    />
  </a>

  <div className="nav-links">
    <a href={`${STAGING}/l/new`} className="yellow-link">
      POST FREE
    </a>

    <a
      href={`${STAGING}/login`}
      className="login-icon"
      aria-label="Login"
    >
      <i className="fa-regular fa-user"></i>
    </a>
  </div>
</nav>
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
<style jsx>{`
  .nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 14px 5%;
    background: #050505;
    border-bottom: 1px solid rgba(255,255,255,.08);
    margin: -24px -24px 24px;
  }

  .logo-img {
    height: 78px;
    width: auto;
    display: block;
  }

  .nav-links {
    display: flex;
    align-items: center;
    gap: 28px;
  }

  .nav-links a {
    color: white;
    text-decoration: none;
    font-weight: 900;
    text-transform: uppercase;
    font-size: 13px;
    letter-spacing: .6px;
  }

  .yellow-link {
    color: ${BRAND_YELLOW} !important;
  }

  .login-icon {
    border: 2px solid white;
    border-radius: 50%;
    width: 28px;
    height: 28px;
    display: grid;
    place-items: center;
    font-size: 15px !important;
  }

  @media (max-width: 850px) {
    .logo-img {
      height: 56px;
    }

    .nav-links {
      display: flex;
      gap: 18px;
    }

    .yellow-link {
      font-size: 12px !important;
    }

    .login-icon {
      width: 28px;
      height: 28px;
    }
  }
`}</style>
   </main>
</>
);
}
