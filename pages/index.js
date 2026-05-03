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
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState("ALL CATEGORIES");

  const handleSearch = () => {
    const terms = [
      searchQuery.trim(),
      category !== "ALL CATEGORIES" ? category : ""
    ].filter(Boolean).join(" ");

    window.location.href = terms
      ? `${STAGING}/s?keywords=${encodeURIComponent(terms)}`
      : `${STAGING}/s`;
  };

  return (
    <>
      <Head>
        <title>IronXchange - Free Heavy Equipment Marketplace</title>
        <meta name="description" content="Free Heavy Equipment Marketplace. List and browse machinery with no fees." />
        <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600;700;800&family=Montserrat:wght@600;700;800;900&display=swap" rel="stylesheet" />
      </Head>

      <nav className="nav">
        <a href="/" className="logo-wrap">
          <img src="/images/ironxchange-logo.png" className="logo-img" alt="IronXchange" />
        </a>

        <div className="nav-links">
          <a href={`${STAGING}/s`}>Browse Equipment</a>
          <a href={`${STAGING}/l/new`} className="post-btn">Post Equipment</a>
          <a href="#how">How It Works</a>
          <a href="#about">About</a>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-content">
          <h1>FREE HEAVY EQUIPMENT MARKETPLACE</h1>
          <p className="subtitle">No fees. No credit cards. Listings live in minutes.</p>

          <div className="features">
            <div>NO FEES</div>
            <div>NO CREDIT CARDS</div>
            <div>LISTINGS LIVE IN MINUTES</div>
          </div>

          <div className="cta-buttons">
            <a href={`${STAGING}/l/new`} className="btn-primary">
              POST EQUIPMENT FREE →
            </a>
            <a href={`${STAGING}/s`} className="btn-secondary">
              BROWSE EQUIPMENT
            </a>
          </div>
        </div>
      </section>

      <section className="search-section">
        <h2>FIND THE RIGHT EQUIPMENT. CONTACT DIRECT.</h2>
        <p>Browse equipment from owners, dealers, and fleet operators. No middlemen.</p>

        <div className="search-container">
          <input
            type="text"
            placeholder="Search equipment — CAT 320, D6 Dozer, Bell B30E..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />

          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>

          <button onClick={handleSearch} className="search-btn">SEARCH</button>
        </div>
      </section>

      <section className="featured">
        <h2>FEATURED EQUIPMENT</h2>
      </section>

      <style jsx>{`
        * {
          box-sizing: border-box;
        }

        :global(body) {
          margin: 0;
          font-family: 'Inter', sans-serif;
          background: #fff;
        }

        .nav {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 18px 5%;
          background: #0a0a0a;
          position: sticky;
          top: 0;
          z-index: 100;
          border-bottom: 1px solid rgba(255,255,255,.08);
        }

        .logo-wrap {
          display: flex;
          align-items: center;
        }

        .logo-img {
          height: 78px;
          width: auto;
          display: block;
        }

        .nav-links {
          display: flex;
          align-items: center;
          gap: 30px;
        }

        .nav-links a {
          color: white;
          text-decoration: none;
          font-family: 'Montserrat', sans-serif;
          font-weight: 800;
          font-size: 13px;
          letter-spacing: .6px;
          text-transform: uppercase;
        }

        .post-btn {
          background: ${BRAND_YELLOW};
          color: black !important;
          padding: 12px 22px;
          border-radius: 6px;
        }

        .hero {
          height: 85vh;
          min-height: 680px;
          background:
            linear-gradient(90deg, rgba(0,0,0,.86), rgba(0,0,0,.62), rgba(0,0,0,.25)),
            url('/images/hero-equipment-yard.jpg');
          background-size: cover;
          background-position: center;
          display: flex;
          align-items: center;
          color: white;
          padding: 0 5%;
        }

        .hero-content {
          max-width: 850px;
        }

        .hero-content h1 {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 6.2rem;
          line-height: .9;
          margin: 0;
          letter-spacing: 1px;
          font-weight: 400;
        }

        .subtitle {
          font-size: 1.45rem;
          font-weight: 700;
          margin-top: 22px;
          color: rgba(255,255,255,.92);
        }

        .features {
          display: flex;
          gap: 28px;
          margin: 34px 0;
          flex-wrap: wrap;
        }

        .features div {
          font-family: 'Montserrat', sans-serif;
          font-weight: 900;
          font-size: 14px;
          letter-spacing: .6px;
          border-left: 5px solid ${BRAND_YELLOW};
          padding-left: 12px;
        }

        .cta-buttons {
          display: flex;
          gap: 14px;
          flex-wrap: wrap;
        }

        .btn-primary,
        .btn-secondary {
          padding: 18px 32px;
          font-family: 'Montserrat', sans-serif;
          font-size: .95rem;
          font-weight: 900;
          border-radius: 8px;
          text-decoration: none;
          letter-spacing: .4px;
        }

        .btn-primary {
          background: ${BRAND_YELLOW};
          color: black;
        }

        .btn-secondary {
          color: white;
          border: 2px solid white;
        }

        .search-section {
          padding: 44px 5%;
          background: #f8f8f8;
          text-align: center;
        }

        .search-section h2,
        .featured h2 {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 3rem;
          font-weight: 400;
          letter-spacing: 1px;
          margin: 0;
        }

        .search-section p {
          color: #444;
          font-size: 1.05rem;
          margin-top: 8px;
        }

        .search-container {
          max-width: 1100px;
          margin: 28px auto 0;
          display: grid;
          grid-template-columns: 1fr 285px 155px;
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 12px 32px rgba(0,0,0,0.12);
          border: 1px solid #e8e8e8;
        }

        input,
        select {
          padding: 22px;
          border: none;
          border-right: 1px solid #e5e5e5;
          font-size: 1rem;
          font-family: 'Inter', sans-serif;
          outline: none;
          background: white;
        }

        select {
          font-family: 'Montserrat', sans-serif;
          font-weight: 800;
          font-size: .82rem;
        }

        .search-btn {
          background: ${BRAND_YELLOW};
          border: none;
          font-family: 'Montserrat', sans-serif;
          font-weight: 900;
          cursor: pointer;
        }

        .featured {
          padding: 50px 5%;
          background: white;
          min-height: 240px;
        }

        @media (max-width: 850px) {
          .nav-links {
            display: none;
          }

          .logo-img {
            height: 56px;
          }

          .hero {
            min-height: 620px;
            text-align: center;
            justify-content: center;
          }

          .hero-content h1 {
            font-size: 4rem;
          }

          .features,
          .cta-buttons {
            justify-content: center;
          }

          .search-container {
            grid-template-columns: 1fr;
          }

          input,
          select {
            border-right: none;
            border-bottom: 1px solid #e5e5e5;
          }

          .search-btn {
            padding: 20px;
          }
        }
      `}</style>
    </>
  );
}
