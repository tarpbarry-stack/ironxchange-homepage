import Head from "next/head";
import { useState } from "react";

const STAGING = "https://staging.ironxchange.com";
const BRAND_YELLOW = "#FFC400";

const categories = [
  "ALL CATEGORIES",
  "AERIAL EQUIPMENT",
  "AGRICULTURE HARVESTERS",
  "AGRICULTURE TRACTORS",
  "ASPHALT EQUIPMENT",
  "BACKHOE LOADERS",
  "COMPACTION/ROLLERS",
  "CRANES",
  "CRAWLER CARRIERS / LOADER",
  "DOZERS",
  "DRILLS & PILING",
  "DUMP TRUCKS - ARTIC/RIGID",
  "EXCAVATORS",
  "FORKLIFTS",
  "MOTOR GRADERS",
  "SCRAPER",
  "SKID STEER/CTL",
  "TELEHANDLERS",
  "TRENCHERS",
  "TRAILERS",
  "TRUCKS",
  "WHEEL LOADERS",
  "ATTACHMENTS / PARTS",
  "OTHER SPECIALTY",
  "SUPPORT EQUIPMENT",
  "UTILITY CARTS"
];

export default function Home() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("ALL CATEGORIES");

  function search() {
    const terms = [
      query.trim(),
      category !== "ALL CATEGORIES" ? category : ""
    ].filter(Boolean).join(" ");

    const encoded = encodeURIComponent(terms);

    window.location.href = encoded
      ? `${STAGING}/s?keywords=${encoded}`
      : `${STAGING}/s`;
  }

  return (
    <>
      <Head>
        <link href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;600;700&display=swap" rel="stylesheet" />
      </Head>

      <header className="nav">
        <img src="/images/ironxchange-logo.png" className="logo" />

        <nav>
          <a href={`${STAGING}/s`}>Browse Equipment</a>
          <a className="yellow" href={`${STAGING}/l/new`}>Post Equipment</a>
          <a href="#how">How It Works</a>
          <a href="#about">About</a>
        </nav>
      </header>

      <section className="hero">
        <div className="shade" />

        <div className="heroContent">
          <h1>Free Heavy Equipment Marketplace</h1>

          <div className="iconRow">
            <div><span>⊘</span><b>No Fees</b></div>
            <div><span>▭</span><b>No Credit Cards</b></div>
            <div><span>◷</span><b>Listings Live<br />in Minutes</b></div>
          </div>

          <div className="heroButtons">
            <a className="primary" href={`${STAGING}/l/new`}>
              Post Equipment Free →
            </a>

            <a className="secondary" href={`${STAGING}/s`}>
              Browse Equipment
            </a>
          </div>
        </div>
      </section>

      <section className="searchSection">
        <h2>Find the right equipment. Contact direct.</h2>

        <div className="searchBox">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && search()}
            placeholder="Search equipment — CAT 320, D6 Dozer..."
          />

          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>

          <button onClick={search}>Search</button>
        </div>
      </section>

      <style jsx>{`
        body {
          margin: 0;
          font-family: 'Oswald', sans-serif;
        }

        .nav {
          height: 110px;
          background: #050505;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 40px;
        }

        .logo {
          height: 80px;
        }

        nav {
          display: flex;
          gap: 30px;
          text-transform: uppercase;
          font-weight: 700;
        }

        nav a {
          color: white;
          text-decoration: none;
        }

        nav a.yellow {
          color: ${BRAND_YELLOW};
        }

        .hero {
          height: 90vh;
          background-image: url('/images/hero-equipment-yard.jpg');
          background-size: cover;
          display: flex;
          align-items: center;
          padding-left: 7%;
          position: relative;
          color: white;
        }

        .shade {
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,0.65);
        }

        .heroContent {
          position: relative;
          z-index: 2;
          max-width: 700px;
        }

        h1 {
          font-size: 72px;
          text-transform: uppercase;
          margin: 0;
        }

        .iconRow {
          display: flex;
          gap: 30px;
          margin: 30px 0;
        }

        .iconRow span {
          border: 3px solid ${BRAND_YELLOW};
          border-radius: 50%;
          width: 50px;
          height: 50px;
          display: grid;
          place-items: center;
          color: ${BRAND_YELLOW};
        }

        .heroButtons {
          display: flex;
          gap: 15px;
        }

        .primary {
          background: ${BRAND_YELLOW};
          padding: 18px 30px;
          color: black;
          font-weight: 700;
        }

        .secondary {
          border: 2px solid white;
          padding: 18px 30px;
          color: white;
        }

        .searchSection {
          padding: 50px 7%;
          background: #f5f5f5;
          text-align: center;
        }

        .searchBox {
          display: grid;
          grid-template-columns: 1fr 250px 150px;
          gap: 10px;
          background: white;
          padding: 20px;
          border-radius: 10px;
          margin-top: 20px;
        }

        input, select {
          padding: 15px;
          font-size: 16px;
        }

        button {
          background: ${BRAND_YELLOW};
          border: none;
          font-weight: 700;
        }
      `}</style>
    </>
  );
}
