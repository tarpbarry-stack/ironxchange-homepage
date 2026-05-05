import Head from "next/head";
import { useMemo, useState, useEffect } from "react";

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

export default function Browse() {
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState("ALL CATEGORIES");
  const [liveListings, setLiveListings] = useState([]);

  useEffect(() => {
    fetch("/api/listings")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setLiveListings(data);
      })
      .catch(() => {});
  }, []);

  const filteredListings = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return liveListings.filter((item) => {
      const matchesCategory =
        category === "ALL CATEGORIES" ||
        String(item.type || "").toUpperCase() === category;

      const matchesSearch =
        !q ||
        (item.title || "").toLowerCase().includes(q) ||
        (item.type || "").toLowerCase().includes(q) ||
        (item.location || "").toLowerCase().includes(q) ||
        (item.hours || "").toLowerCase().includes(q) ||
        (item.price || "").toLowerCase().includes(q) ||
        (item.make || "").toLowerCase().includes(q) ||
        (item.model || "").toLowerCase().includes(q);

      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, category, liveListings]);

  return (
    <>
      <Head>
        <title>Browse Equipment | IronXchange</title>
        <meta name="description" content="Browse heavy equipment for sale on IronXchange." />
        <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600;700;800&family=Montserrat:wght@600;700;800;900&display=swap" rel="stylesheet" />
        <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" rel="stylesheet" />
      </Head>

      <nav className="nav">
        <a href="/" className="logo-wrap">
          <img src="/images/ironxchange-logo.png" className="logo-img" alt="IronXchange" />
        </a>

        <div className="nav-links">
          <a href="/browse">Browse Equipment</a>
          <a href={`${STAGING}/l/new`} className="yellow-link">Post Equipment Free</a>
          <a href={`${STAGING}/login`} className="login-icon">
            <i className="fa-regular fa-user"></i>
          </a>
        </div>
      </nav>

      <section className="search-section">
        <h1>Browse Equipment</h1>
        <p>Search heavy equipment for sale from owners, dealers, and fleet operators.</p>

        <div className="search-container">
          <input
            type="text"
            placeholder="Search equipment — Deere 772GP, WA475, crusher..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>

          <button type="button" className="search-btn">
            SEARCH
          </button>
        </div>
      </section>

      <section className="featured">
        <div className="section-head">
          <h2>AVAILABLE EQUIPMENT</h2>
          <span>{filteredListings.length} LISTINGS</span>
        </div>

        <div className="cards">
          {filteredListings.map((item) => (
            <a href={item.link} className="card" key={item.link || item.title}>
              <div
                className="card-photo"
                style={{
                  backgroundImage: `url(${
                    item.imageUrl ||
                    item.image ||
                    item.photo ||
                    item.thumbnail ||
                    "/images/hero-equipment-yard.jpg"
                  })`
                }}
              >
                <span>♡</span>
              </div>

              <div className="card-body">
                <h3>{item.title}</h3>
                <p>{item.type}</p>

                <div className="meta">
                  <span>◷ {item.hours}</span>
                  <span>⌖ {item.location}</span>
                </div>

                <div className="price-row">
                  <strong>{item.price}</strong>
                  <span>VIEW DETAILS</span>
                </div>
              </div>
            </a>
          ))}
        </div>

        {filteredListings.length === 0 && (
          <div className="empty">
            <h3>No live listings loaded.</h3>
            <p>Check /api/listings or refresh the page.</p>
          </div>
        )}
      </section>

      <section className="ready">
        <div className="ready-icon">✎</div>
        <div>
          <h2>READY TO SELL?</h2>
          <p>Post your machine free and deal direct with buyers.</p>
        </div>
        <a href={`${STAGING}/l/new`}>POST EQUIPMENT FREE →</a>
      </section>

      <footer>
        <div>
          <img src="/images/ironxchange-logo.png" alt="IronXchange" />
          <p>© 2026 IronXchange. All rights reserved.</p>
        </div>

        <div className="foot-cols">
          <div>
            <h4>MARKETPLACE</h4>
            <a href="/browse">Browse Equipment</a>
            <a href={`${STAGING}/l/new`}>Post Equipment</a>
          </div>

          <div>
            <h4>COMPANY</h4>
            <a href="/contact">Contact</a>
          </div>

          <div>
            <h4>LEGAL</h4>
            <a href="https://ironxchange-c9x31o.mysharetribe-test.com/privacy-policy">Privacy</a>
            <a href="https://ironxchange-c9x31o.mysharetribe-test.com/terms-of-service">Terms</a>
          </div>
        </div>
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
          padding: 14px 5%;
          background: #050505;
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
          gap: 28px;
        }

        .nav-links a {
          color: white;
          text-decoration: none;
          font-family: 'Montserrat', sans-serif;
          font-weight: 900;
          font-size: 13px;
          letter-spacing: .6px;
          text-transform: uppercase;
        }

        .yellow-link { color: ${BRAND_YELLOW} !important; }

        .login-icon {
          border: 2px solid white;
          border-radius: 50%;
          width: 28px;
          height: 28px;
          display: grid;
          place-items: center;
          font-size: 15px !important;
        }

        .search-section {
          padding: 38px 5% 30px;
          background: #f8f8f8;
          text-align: center;
        }

        .search-section h1 {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 3.8rem;
          font-weight: 400;
          letter-spacing: 1px;
          margin: 0;
        }

        .search-section p {
          color: #444;
          margin: 6px 0 26px;
          font-weight: 600;
        }

        .search-container {
          max-width: 1100px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1fr 285px 135px;
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 12px 32px rgba(0,0,0,0.12);
          border: 1px solid #e8e8e8;
        }

        input, select {
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
          color: #000;
          border: none;
          font-family: 'Montserrat', sans-serif;
          font-weight: 900;
          cursor: pointer;
          letter-spacing: .6px;
          transition: background .18s ease;
        }

        .search-btn:hover {
          background: #e6b000;
        }

        .featured {
          padding: 56px 5%;
          background: white;
        }

        .section-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 28px;
        }

        .section-head h2 {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 3rem;
          font-weight: 400;
          letter-spacing: 1px;
          margin: 0;
        }

        .section-head span {
          font-family: 'Montserrat', sans-serif;
          font-weight: 900;
          font-size: 13px;
          color: #1b334b;
        }

        .cards {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 24px;
        }

        .card {
          text-decoration: none;
          color: inherit;
          display: block;
          border: 1px solid #e8e8e8;
          border-radius: 14px;
          overflow: hidden;
          box-shadow: 0 12px 30px rgba(0,0,0,.1);
          background: white;
          transition: transform .18s ease, box-shadow .18s ease;
        }

        .card:hover {
          transform: translateY(-4px);
          box-shadow: 0 18px 38px rgba(0,0,0,.16);
          cursor: pointer;
        }

        .card-photo {
          height: 185px;
          background-size: cover;
          background-position: center;
          position: relative;
        }

        .card-photo span {
          position: absolute;
          top: 12px;
          right: 14px;
          color: white;
          font-size: 25px;
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

        .price-row span {
          border: 1px solid #ccc;
          padding: 9px 12px;
          border-radius: 6px;
          color: #111;
          font-family: 'Montserrat', sans-serif;
          font-size: 11px;
          font-weight: 900;
        }

        .empty {
          margin: 38px auto 0;
          max-width: 760px;
          padding: 30px;
          border: 1px solid #ddd;
          border-radius: 12px;
          text-align: center;
          background: #fafafa;
        }

        .empty h3 {
          font-family: 'Montserrat', sans-serif;
          margin: 0 0 8px;
        }

        .empty p {
          margin: 0;
          color: #555;
        }

        .ready {
          background: #070707;
          color: white;
          padding: 42px 5%;
          display: grid;
          grid-template-columns: auto 1fr auto;
          gap: 22px;
          align-items: center;
        }

        .ready-icon {
          width: 62px;
          height: 62px;
          border: 4px solid ${BRAND_YELLOW};
          border-radius: 50%;
          display: grid;
          place-items: center;
          color: ${BRAND_YELLOW};
          font-size: 30px;
        }

        .ready h2 {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 3rem;
          font-weight: 400;
          letter-spacing: 1px;
          margin: 0;
        }

        .ready p {
          color: #aaa;
          margin: 4px 0 0;
        }

        .ready a {
          display: inline-block;
          background: ${BRAND_YELLOW};
          color: black;
          padding: 18px 36px;
          border-radius: 6px;
          text-decoration: none;
          font-family: 'Montserrat', sans-serif;
          font-weight: 900;
          letter-spacing: .5px;
          box-shadow: 0 12px 28px rgba(0,0,0,.28);
          transition: transform .18s ease, box-shadow .18s ease;
        }

        .ready a:hover {
          transform: translateY(-2px);
          box-shadow: 0 16px 34px rgba(0,0,0,.35);
        }

        footer {
          background: #050505;
          color: white;
          padding: 42px 5%;
          display: flex;
          justify-content: space-between;
          gap: 50px;
        }

        footer img { height: 52px; }

        footer p {
          color: #777;
          font-size: 13px;
        }

        .foot-cols {
          display: flex;
          gap: 70px;
        }

        .foot-cols h4 {
          font-family: 'Montserrat', sans-serif;
          font-size: 13px;
          margin: 0 0 14px;
        }

        .foot-cols a {
          display: block;
          color: #aaa;
          text-decoration: none;
          margin-bottom: 8px;
          font-size: 13px;
        }

        @media (max-width: 850px) {
          .nav-links { display: none; }
          .logo-img { height: 56px; }

          .search-container,
          .cards,
          .ready {
            grid-template-columns: 1fr;
          }

          input, select {
            border-right: none;
            border-bottom: 1px solid #e5e5e5;
          }

          .search-btn {
            height: 58px;
          }

          .section-head,
          footer {
            flex-direction: column;
            align-items: flex-start;
          }

          .ready { text-align: center; }

          .ready-icon { margin: 0 auto; }

          .foot-cols {
            flex-direction: column;
            gap: 25px;
          }
        }
      `}</style>
    </>
  );
}
}
