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
  ["2019 CAT 336FL", "Excavator • Hydraulic", "5,317 Hrs", "Odessa, TX", "$182,500"],
  ["2016 KOMATSU D61PX-24", "Dozer", "4,650 Hrs", "Fort Worth, TX", "$124,900"],
  ["2020 VOLVO L120H", "Wheel Loader", "2,950 Hrs", "Amarillo, TX", "$169,900"],
  ["2018 BELL B30E", "Articulated Truck", "6,807 Hrs", "Waco, TX", "$98,900"]
];

export default function Home() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("ALL CATEGORIES");

  function search() {
    const terms = [
      query.trim(),
      category !== "ALL CATEGORIES" ? category : ""
    ]
      .filter(Boolean)
      .join(" ");

    const encoded = encodeURIComponent(terms);

    window.location.href = encoded
      ? `${STAGING}/s?keywords=${encoded}`
      : `${STAGING}/s`;
  }

  return (
    <>
      <header className="nav">
        <a href="/">
          <img src="/images/ironxchange-logo.png" className="logo" alt="IronXchange" />
        </a>

        <nav>
          <a href={`${STAGING}/s`}>Browse Equipment</a>
          <a className="yellow" href={`${STAGING}/l/new`}>Post Equipment</a>
          <a href="#how">How It Works</a>
          <a href="#about">About</a>
          <a href="mailto:info@ironxchange.com">Contact</a>
        </nav>
      </header>

      <section className="hero">
        <div className="shade" />

        <div className="heroContent">
          <h1>Free Heavy Equipment Marketplace</h1>

          <div className="iconRow">
            <div>
              <span>⊘</span>
              <b>No Fees</b>
            </div>
            <div>
              <span>▭</span>
              <b>No Credit Cards</b>
            </div>
            <div>
              <span>◷</span>
              <b>Listings Live<br />in Minutes</b>
            </div>
          </div>

          <div className="heroButtons">
            <a className="primary" href={`${STAGING}/l/new`}>
              Post Equipment Free →
            </a>

            <a className="secondary" href={`${STAGING}/s`}>
              Browse Equipment
            </a>
          </div>

          <p className="trust">
            Built by people who actually buy and sell <b>iron.</b>
          </p>
        </div>
      </section>

      <section className="searchSection">
        <h2>Find the right equipment. Contact direct.</h2>
        <p>Browse equipment from owners, dealers, and fleet operators. No middlemen.</p>

        <div className="searchBox">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && search()}
            placeholder="Search equipment — CAT 320, D6 Dozer, Bell B30E..."
          />

          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>

          <button onClick={search}>Search</button>
        </div>

        <div className="popular">
          <strong>Popular Searches:</strong>
          {["EXCAVATORS", "SKID STEER/CTL", "DOZERS", "DUMP TRUCKS - ARTIC/RIGID", "TRAILERS", "WHEEL LOADERS"].map((x) => (
            <button
              key={x}
              onClick={() => {
                window.location.href = `${STAGING}/s?keywords=${encodeURIComponent(x)}`;
              }}
            >
              {x}
            </button>
          ))}
        </div>
      </section>

      <section className="featured">
        <div className="sectionTop">
          <h2>Featured Equipment</h2>
          <a href={`${STAGING}/s`}>View All Equipment →</a>
        </div>

        <div className="cards">
          {listings.map((l) => (
            <div className="card" key={l[0]}>
              <div className="photo" />

              <div className="cardBody">
                <h3>{l[0]}</h3>
                <p>{l[1]}</p>

                <div className="meta">
                  <span>◷ {l[2]}</span>
                  <span>⌖ {l[3]}</span>
                </div>

                <div className="priceRow">
                  <strong>{l[4]}</strong>
                  <a href={`${STAGING}/s`}>View Details</a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="how" className="benefits">
        <h2>List Your Equipment in Minutes</h2>

        <div className="benefitGrid">
          <div>
            <span>◇</span>
            <h3>No Contracts</h3>
            <p>List as long as you need.</p>
          </div>

          <div>
            <span>◎</span>
            <h3>No Reps</h3>
            <p>You deal direct with buyers.</p>
          </div>

          <div>
            <span>$</span>
            <h3>No Fees</h3>
            <p>100% free. Always.</p>
          </div>

          <div>
            <span>↯</span>
            <h3>Go Live Instantly</h3>
            <p>Listings live in minutes.</p>
          </div>
        </div>
      </section>

      <section className="cta">
        <div>
          <h2>Ready to sell?</h2>
          <p>Post your machine free and deal direct with buyers.</p>
        </div>

        <a href={`${STAGING}/l/new`}>Post Equipment Free →</a>
      </section>

      <footer id="about">
        <img src="/images/ironxchange-logo.png" alt="IronXchange" />
        <p>© 2026 IronXchange. All rights reserved.</p>
      </footer>

      <style jsx>{`
        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
        }

        .nav {
          height: 96px;
          background: #050505;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 42px;
          position: sticky;
          top: 0;
          z-index: 50;
          border-bottom: 1px solid rgba(255,255,255,0.08);
        }

       .logo {
  height: 80px;
  width: auto;
  display: block;
  filter: brightness(1.05) contrast(1.1);
}

        nav {
          display: flex;
          gap: 30px;
          align-items: center;
          text-transform: uppercase;
          font-size: 13px;
          font-weight: 900;
        }

        nav a {
          color: white;
          text-decoration: none;
        }

        nav a.yellow {
          color: ${BRAND_YELLOW};
        }

        .hero {
          min-height: 690px;
          height: 88vh;
          background-image: url('/images/hero-equipment-yard.jpg');
          background-size: cover;
          background-position: center;
          position: relative;
          color: white;
          display: flex;
          align-items: center;
          padding-left: 7%;
        }

        .shade {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            90deg,
            rgba(0,0,0,.90),
            rgba(0,0,0,.62),
            rgba(0,0,0,.18)
          );
        }

        .heroContent {
          position: relative;
          z-index: 2;
          max-width: 760px;
        }

        h1 {
          font-size: 72px;
          line-height: .95;
          margin: 0;
          font-weight: 1000;
          text-transform: uppercase;
          letter-spacing: -2px;
        }

        .iconRow {
          display: flex;
          gap: 34px;
          margin: 34px 0;
        }

        .iconRow div {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          text-align: center;
          text-transform: uppercase;
          font-size: 14px;
        }

        .iconRow span {
          color: ${BRAND_YELLOW};
          border: 3px solid ${BRAND_YELLOW};
          border-radius: 50%;
          width: 52px;
          height: 52px;
          display: grid;
          place-items: center;
          font-size: 25px;
          font-weight: 900;
        }

        .heroButtons {
          display: flex;
          gap: 14px;
          margin-top: 28px;
        }

        .heroButtons a,
        .cta a {
          padding: 18px 34px;
          text-transform: uppercase;
          font-weight: 1000;
          text-decoration: none;
          border-radius: 6px;
        }

        .primary,
        .cta a {
          background: ${BRAND_YELLOW};
          color: black;
        }

        .secondary {
          border: 2px solid white;
          color: white;
        }

        .trust {
          margin-top: 52px;
          text-transform: uppercase;
          font-weight: 800;
          letter-spacing: .5px;
        }

        .trust b {
          color: ${BRAND_YELLOW};
        }

        .searchSection {
          background: #f5f5f5;
          padding: 42px 7% 34px;
          text-align: center;
        }

        .searchSection h2,
        .featured h2,
        .benefits h2 {
          margin: 0;
          font-size: 34px;
          text-transform: uppercase;
          font-weight: 1000;
        }

        .searchSection p {
          color: #444;
          font-size: 18px;
        }

        .searchBox {
          margin: 28px auto 14px;
          max-width: 1100px;
          background: white;
          display: grid;
          grid-template-columns: 1fr 280px 160px;
          gap: 10px;
          padding: 16px;
          border-radius: 12px;
          box-shadow: 0 16px 38px rgba(0,0,0,.14);
        }

        input,
        select {
          padding: 18px;
          font-size: 16px;
          border: 1px solid #ddd;
          border-radius: 8px;
          background: white;
        }

        .searchBox button {
          background: ${BRAND_YELLOW};
          border: none;
          border-radius: 8px;
          font-weight: 1000;
          text-transform: uppercase;
          cursor: pointer;
        }

        .popular {
          max-width: 1100px;
          margin: 0 auto;
          text-align: left;
          color: #555;
          font-size: 14px;
        }

        .popular button {
          margin-left: 18px;
          background: none;
          border: none;
          text-decoration: underline;
          cursor: pointer;
          color: #333;
        }

        .featured {
          padding: 48px 7%;
          background: white;
        }

        .sectionTop {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .sectionTop a {
          color: #111;
          font-weight: 900;
          text-transform: uppercase;
          font-size: 13px;
        }

        .cards {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 24px;
          margin-top: 28px;
        }

        .card {
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 10px 25px rgba(0,0,0,.12);
          border: 1px solid #eee;
        }

        .photo {
          height: 175px;
          background-image: url('/images/hero-equipment-yard.jpg');
          background-size: cover;
          background-position: center;
        }

        .cardBody {
          padding: 18px;
        }

        .card h3 {
          margin: 0;
          font-size: 19px;
          text-transform: uppercase;
        }

        .card p {
          color: #555;
          margin: 6px 0 12px;
        }

        .meta {
          display: flex;
          gap: 12px;
          font-size: 13px;
          color: #555;
          flex-wrap: wrap;
        }

        .priceRow {
          margin-top: 18px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .priceRow strong {
          font-size: 22px;
        }

        .priceRow a {
          border: 1px solid #ccc;
          padding: 9px 12px;
          color: #111;
          text-decoration: none;
          font-size: 12px;
          font-weight: 900;
          text-transform: uppercase;
          border-radius: 5px;
        }

        .benefits {
          padding: 58px 7%;
          background: #f3f3f3;
          text-align: center;
        }

        .benefitGrid {
          margin-top: 38px;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 28px;
        }

        .benefitGrid span {
          color: ${BRAND_YELLOW};
          font-size: 52px;
          font-weight: 900;
        }

        .benefitGrid h3 {
          text-transform: uppercase;
          font-size: 20px;
          margin: 8px 0;
        }

        .benefitGrid p {
          color: #555;
        }

        .cta {
          background: #070707;
          color: white;
          padding: 42px 7%;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .cta h2 {
          margin: 0;
          text-transform: uppercase;
          font-size: 30px;
        }

        .cta p {
          color: #aaa;
        }

        footer {
          background: #050505;
          color: white;
          padding: 38px 7%;
        }

        footer img {
          height: 42px;
        }

        footer p {
          color: #777;
        }

        @media (max-width: 850px) {
          nav {
            display: none;
          }

          .nav {
            padding: 0 22px;
          }

          .logo {
            height: 38px;
          }

          .hero {
            padding: 40px 24px;
            justify-content: center;
            text-align: center;
          }

          h1 {
            font-size: 48px;
          }

          .iconRow {
            justify-content: center;
            flex-wrap: wrap;
          }

          .heroButtons {
            flex-direction: column;
          }

          .searchBox {
            grid-template-columns: 1fr;
          }

          .cards {
            grid-template-columns: 1fr;
          }

          .benefitGrid {
            grid-template-columns: 1fr;
          }

          .cta {
            flex-direction: column;
            gap: 24px;
            text-align: center;
          }
        }
      `}</style>
    </>
  );
}
