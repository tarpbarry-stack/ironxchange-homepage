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
  "CRAWLER CARRIERS",
  "DOZERS",
  "DRILLS & PILING",
  "DUMP TRUCKS",
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
  "OTHER SPECIALTY"
];

export default function Home() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("ALL CATEGORIES");

  const handleSearch = () => {
    const terms = [
      query.trim(),
      category !== "ALL CATEGORIES" ? category : ""
    ].filter(Boolean).join(" ");

    const encoded = encodeURIComponent(terms);
    window.location.href = encoded
      ? `${STAGING}/s?keywords=${encoded}`
      : `${STAGING}/s`;
  };

  return (
    <>
      <Head>
        <title>IronXchange - Free Heavy Equipment Marketplace</title>
        <meta name="description" content="Free Heavy Equipment Marketplace. List and browse machinery with no fees." />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap" rel="stylesheet" />
      </Head>

      {/* Navigation */}
      <nav className="nav">
        <div className="nav-container">
          <img src="/images/ironxchange-logo.png" alt="IronXchange" className="logo" />
          
          <div className="nav-links">
            <a href={`${STAGING}/s`}>Browse Equipment</a>
            <a href={`${STAGING}/l/new`} className="post-btn">Post Equipment</a>
            <a href="#how">How It Works</a>
            <a href="#about">About</a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero">
        <div className="hero-overlay" />
        <div className="hero-content">
          <h1>FREE HEAVY EQUIPMENT MARKETPLACE</h1>
          <p className="subtitle">List. Browse. Buy. Sell. Direct from owners and dealers nationwide.</p>

          <div className="hero-features">
            <div>NO FEES</div>
            <div>NO CREDIT CARDS</div>
            <div>LISTINGS LIVE IN MINUTES</div>
          </div>

          <div className="hero-ctas">
            <a href={`${STAGING}/l/new`} className="btn-primary">POST EQUIPMENT FREE →</a>
            <a href={`${STAGING}/s`} className="btn-secondary">BROWSE EQUIPMENT</a>
          </div>
        </div>
      </section>

      {/* Search Bar */}
      <section className="search-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search equipment (e.g. CAT 336, D6 Dozer, Freightliner...)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <button onClick={handleSearch} className="search-btn">SEARCH</button>
        </div>
      </section>

      <style jsx>{`
        :root {
          --yellow: ${BRAND_YELLOW};
        }

        .nav {
          background: #0a0a0a;
          padding: 20px 5%;
          position: sticky;
          top: 0;
          z-index: 100;
        }
        .nav-container {
          max-width: 1400px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .logo {
          height: 68px;
        }
        .nav-links a {
          color: white;
          text-decoration: none;
          margin-left: 32px;
          font-weight: 600;
        }
        .post-btn {
          background: var(--yellow);
          color: black;
          padding: 12px 24px;
          border-radius: 6px;
        }

        .hero {
          height: 92vh;
          min-height: 700px;
          background-image: url('/images/hero-equipment-yard.jpg');
          background-size: cover;
          background-position: center;
          display: flex;
          align-items: center;
          position: relative;
          color: white;
        }
        .hero-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.65);
        }
        .hero-content {
          position: relative;
          z-index: 2;
          max-width: 780px;
          padding-left: 7%;
        }
        .hero-content h1 {
          font-size: 4.8rem;
          line-height: 1.05;
          margin: 0 0 16px 0;
          font-weight: 700;
        }
        .subtitle {
          font-size: 1.35rem;
          margin-bottom: 32px;
          opacity: 0.95;
        }
        .hero-features {
          display: flex;
          gap: 40px;
          margin: 32px 0 40px;
          font-size: 1.1rem;
          font-weight: 600;
        }
        .btn-primary, .btn-secondary {
          padding: 18px 36px;
          font-size: 1.15rem;
          font-weight: 700;
          border-radius: 8px;
          text-decoration: none;
          display: inline-block;
        }
        .btn-primary {
          background: var(--yellow);
          color: black;
        }
        .btn-secondary {
          border: 2px solid white;
          color: white;
        }

        .search-section {
          padding: 60px 5%;
          background: #f8f9fa;
          text-align: center;
        }
        .search-box {
          max-width: 920px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1fr 280px 160px;
          gap: 12px;
          background: white;
          padding: 12px;
          border-radius: 12px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.08);
        }
        input, select, button {
          padding: 18px 20px;
          font-size: 1.1rem;
          border: none;
        }
        input {
          border-radius: 8px;
        }
        select {
          background: white;
        }
        .search-btn {
          background: var(--yellow);
          color: black;
          font-weight: 700;
          border-radius: 8px;
          cursor: pointer;
        }
      `}</style>
    </>
  );
}
