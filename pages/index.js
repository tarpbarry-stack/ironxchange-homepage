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

const listings = [
  ["2018 BELL B30E", "Articulated Truck", "6,807 Hrs", "Waco, TX", "$98,900"],
  ["2019 CAT 336FL", "Excavator", "5,317 Hrs", "Odessa, TX", "$182,500"],
  ["2016 KOMATSU D61PX-24", "Dozer", "4,650 Hrs", "Fort Worth, TX", "$124,900"],
  ["2020 VOLVO L120H", "Wheel Loader", "2,950 Hrs", "Amarillo, TX", "$169,900"]
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
            <a href={`${STAGING}/l/new`} className="btn-primary">POST EQUIPMENT FREE →</a>
            <a href={`${STAGING}/s`} className="btn-secondary">BROWSE EQUIPMENT</a>
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
            {categories.map((c) => <option key={c}>{c}</option>)}
          </select>

          <button onClick={handleSearch} className="search-btn">SEARCH</button>
        </div>
      </section>

      <section className="featured">
        <div className="section-head">
          <h2>FEATURED EQUIPMENT</h2>
          <a href={`${STAGING}/s`}>VIEW ALL EQUIPMENT →</a>
        </div>

        <div className="cards">
          {listings.map((item) => (
            <div className="card" key={item[0]}>
              <div className="card-photo" />
              <div className="card-body">
                <h3>{item[0]}</h3>
                <p>{item[1]}</p>
                <div className="meta">
                  <span>{item[2]}</span>
                  <span>{item[3]}</span>
                </div>
                <div className="price-row">
                  <strong>{item[4]}</strong>
                  <a href={`${STAGING}/s`}>VIEW DETAILS</a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="how" className="how">
        <h2>LIST YOUR EQUIPMENT IN MINUTES</h2>

        <div className="benefits">
          <div>
            <span>01</span>
            <h3>NO CONTRACTS</h3>
            <p>List as long as you need. No long-term commitment.</p>
          </div>

          <div>
            <span>02</span>
            <h3>NO REPS</h3>
            <p>No sales rep required. Create your listing direct.</p>
          </div>

          <div>
            <span>03</span>
            <h3>NO FEES</h3>
            <p>No listing fees. No credit card. No commission.</p>
          </div>

          <div>
            <span>04</span>
            <h3>LIVE FAST</h3>
            <p>Post equipment and get it in front of buyers in minutes.</p>
          </div>
        </div>
      </section>

      <section className="final-cta">
        <div>
          <h2>READY TO MOVE IRON?</h2>
          <p>Post your machine free and deal direct with buyers.</p>
        </div>
        <a href={`${STAGING}/l/new`}>POST EQUIPMENT FREE →</a>
      </section>

      <footer id="about">
        <img src="/images/ironxchange-logo.png" alt="IronXchange" />
        <p>Free Heavy Equipment Marketplace. No fees. No credit cards. Listings live in minutes.</p>
        <small>© 2026 IronXchange. All rights reserved.</small>
      </footer>

      <style jsx>{`
        * { box-sizing: border-box; }

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

        .hero-content { max-width: 850px; }

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
        .btn-secondary,
        .final-cta a {
          padding: 18px 32px;
          font-family: 'Montserrat', sans-serif;
          font-size: .95rem;
          font-weight: 900;
          border-radius: 8px;
          text-decoration: none;
          letter-spacing: .4px;
        }

        .btn-primary,
        .final-cta a {
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
        .featured h2,
        .how h2,
        .final-cta h2 {
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
          padding: 60px 5%;
          background: white;
        }

        .section-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 28px;
        }

        .section-head a {
          color: #111;
          font-family: 'Montserrat', sans-serif;
          font-weight: 900;
          font-size: 13px;
        }

        .cards {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 24px;
        }

        .card {
          border: 1px solid #e8e8e8;
          border-radius: 14px;
          overflow: hidden;
          box-shadow: 0 12px 30px rgba(0,0,0,.1);
          background: white;
        }

        .card-photo {
          height: 185px;
          background:
            linear-gradient(rgba(0,0,0,.05), rgba(0,0,0,.05)),
            url('/images/hero-equipment-yard.jpg');
          background-size: cover;
          background-position: center;
        }

        .card-body { padding: 18px; }

        .card h3 {
          font-family: 'Montserrat', sans-serif;
          font-size: 18px;
          margin: 0;
          font-weight: 900;
        }

        .card p {
          margin: 6px 0 14px;
          color: #555;
          font-weight: 600;
        }

        .meta {
          display: flex;
          gap: 12px;
          color: #555;
          font-size: 13px;
          flex-wrap: wrap;
        }

        .price-row {
          margin-top: 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .price-row strong {
          font-family: 'Montserrat', sans-serif;
          font-size: 22px;
          font-weight: 900;
        }

        .price-row a {
          border: 1px solid #ccc;
          padding: 9px 12px;
          border-radius: 6px;
          color: #111;
          text-decoration: none;
          font-family: 'Montserrat', sans-serif;
          font-size: 11px;
          font-weight: 900;
        }

        .how {
          background: #f3f3f3;
          padding: 65px 5%;
          text-align: center;
        }

        .benefits {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 24px;
          margin-top: 32px;
        }

        .benefits div {
          background: white;
          padding: 28px;
          border-radius: 14px;
          box-shadow: 0 10px 25px rgba(0,0,0,.08);
        }

        .benefits span {
          color: ${BRAND_YELLOW};
          font-family: 'Bebas Neue', sans-serif;
          font-size: 3.5rem;
        }

        .benefits h3 {
          margin: 4px 0 8px;
          font-family: 'Montserrat', sans-serif;
          font-weight: 900;
        }

        .benefits p {
          color: #555;
          margin: 0;
        }

        .final-cta {
          background: #080808;
          color: white;
          padding: 48px 5%;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .final-cta p {
          color: #aaa;
          margin-bottom: 0;
        }

        footer {
          background: #050505;
          color: white;
          padding: 42px 5%;
        }

        footer img {
          height: 52px;
        }

        footer p {
          color: #aaa;
          max-width: 620px;
        }

        footer small {
          color: #666;
        }

        @media (max-width: 850px) {
          .nav-links { display: none; }
          .logo-img { height: 56px; }

          .hero {
            min-height: 620px;
            text-align: center;
            justify-content: center;
          }

          .hero-content h1 { font-size: 4rem; }

          .features,
          .cta-buttons {
            justify-content: center;
          }

          .search-container,
          .cards,
          .benefits {
            grid-template-columns: 1fr;
          }

          input,
          select {
            border-right: none;
            border-bottom: 1px solid #e5e5e5;
          }

          .search-btn { padding: 20px; }

          .section-head,
          .final-cta {
            flex-direction: column;
            gap: 20px;
            text-align: center;
          }
        }
      `}</style>
    </>
  );
}
