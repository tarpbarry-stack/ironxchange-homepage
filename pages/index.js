import Head from "next/head";
import { useEffect, useState } from "react";

const STAGING = "https://staging.ironxchange.com";
const BRAND_YELLOW = "#FFC400";

const categories = [
  "ALL CATEGORIES",
  "AERIAL EQUIPMENT",
  "AGGREGATE",
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
  "TRENCHERS/PLOWS",
  "TRAILERS",
  "TRUCKS",
  "WHEEL LOADERS",
  "ATTACHMENTS / PARTS",
  "OTHER SPECIALTY",
  "SUPPORT EQUIPMENT",
  "UTILITY CARTS"
];

const featureKeywords = [
  { match: ["push block", "pushblock"], label: "Push Block" },
  { match: ["ripper"], label: "Rear Ripper" },
  { match: ["smartgrade", "smart grade"], label: "SmartGrade" },
  { match: ["topcon"], label: "Topcon" },
  { match: ["trimble"], label: "Trimble" },
  { match: ["gps"], label: "GPS" },
  { match: ["joystick"], label: "Joystick Controls" },
  { match: ["aux hydraulics", "auxiliary hydraulics"], label: "Aux Hydraulics" },
  { match: ["quick coupler", "hydraulic coupler"], label: "Quick Coupler" },
  { match: ["thumb", "hydraulic thumb"], label: "Hydraulic Thumb" },
  { match: ["high flow", "hi-flow"], label: "High Flow" },
  { match: ["ride control"], label: "Ride Control" },
  { match: ["scale", "payload scale"], label: "Scale" },
  { match: ["auto lube", "autolube"], label: "Auto Lube" },
  { match: ["cold ac", "cold a/c", "cold air"], label: "Cold A/C" },
  { match: ["no def", "def deleted", "de-tier", "detier"], label: "No DEF" }
];

function slugify(text = "") {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function getFeatureLine(item) {
  const text = [
    item.title,
    item.description,
    item.publicData?.description,
    item.publicData?.details,
    item.type,
    item.make,
    item.model
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const matches = featureKeywords
    .filter((feature) => feature.match.some((term) => text.includes(term)))
    .map((feature) => feature.label);

  return [...new Set(matches)].slice(0, 4).join(" • ") || item.type || "";
}

export default function Home() {
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

  const featuredListings = liveListings.slice(0, 8);

  function handleSearch() {
    const terms = [
      searchQuery.trim(),
      category !== "ALL CATEGORIES" ? category : ""
    ]
      .filter(Boolean)
      .join(" ");

    window.location.href = terms
      ? `/browse?keywords=${encodeURIComponent(terms)}`
      : "/browse";
  }

  return (
    <>
      <Head>
        <title>IronXchange - Free Heavy Equipment Marketplace</title>
        <meta
          name="description"
          content="Free Heavy Equipment Marketplace. List and browse machinery with no fees."
        />

        <link
          href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600;700;800&family=Montserrat:wght@600;700;800;900&display=swap"
          rel="stylesheet"
        />

        <link
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"
          rel="stylesheet"
        />
      </Head>

      <nav className="nav">
        <a href="/" className="logo-wrap">
          <img
            src="/images/ironxchange-logo.png"
            className="logo-img"
            alt="IronXchange"
          />
        </a>

        <div className="nav-links">
          <a href="/browse">Browse Equipment</a>
          <a href={`${STAGING}/l/new`} className="yellow-link">
            Post Equipment Free
          </a>
          <a href="/login" className="login-icon" aria-label="Login">
            <i className="fa-regular fa-user"></i>
          </a>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-content">
          <h1>
            FREE HEAVY
            <br />
            EQUIPMENT
            <br />
            MARKETPLACE
          </h1>

          <div className="hero-icons">
            <div>
              <span className="hero-icon red slash-icon">
                <i className="fa-solid fa-dollar-sign"></i>
              </span>
              <strong>NO FEES</strong>
            </div>

            <div>
              <span className="hero-icon red slash-icon">
                <i className="fa-regular fa-credit-card"></i>
              </span>
              <strong>NO CREDIT CARDS</strong>
            </div>

            <div>
              <span className="hero-icon green">
                <i className="fa-regular fa-clock"></i>
              </span>
              <strong>
                LISTINGS LIVE
                <br />
                IN MINUTES
              </strong>
            </div>
          </div>

          <a href={`${STAGING}/l/new`} className="btn-primary">
            POST EQUIPMENT FREE →
          </a>

          <p className="built-line">
            BUILT BY PEOPLE WHO ACTUALLY BUY AND SELL <b>IRON.</b>
          </p>
        </div>

        <div className="hero-search">
          <div className="search-container">
            <input
              type="text"
              placeholder="Search equipment — Deere 772GP, WA475, crusher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />

            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              {categories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>

            <button type="button" onClick={handleSearch} className="search-btn">
              SEARCH
            </button>
          </div>
        </div>
      </section>

      <section className="featured">
        <div className="section-head">
          <h2>FEATURED EQUIPMENT</h2>
          <a href="/browse">VIEW ALL EQUIPMENT →</a>
        </div>

        <div className="cards">
          {featuredListings.map((item) => (
            <a
              href={`/listing/${slugify(item.title)}?from=browser`}
              className="card"
              key={item.id || item.link || item.title}
            >
              <div
                className="card-photo"
                style={{
                  backgroundImage: `url(${
                    item.imageUrl ||
                    item.image ||
                    item.images?.[0] ||
                    "/images/hero-equipment-yard.jpg"
                  })`
                }}
              />

              <div className="card-body">
                <div className="title-row">
                  <h3>{String(item.title || "").replace(item.hours || "", "").trim()}</h3>

                  <h3 className="hours-top">{item.hours}</h3>
                </div>

                <p className="feature-line">{getFeatureLine(item)}</p>

                <div className="price-row">
                  <strong>{item.price || "Call for Price"}</strong>

                  <div className="meta">
                    <span>⌖ {item.location || "Location not listed"}</span>
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>
      </section>

      <section id="how" className="how">
        <h2>LIST YOUR EQUIPMENT IN MINUTES</h2>

        <div className="benefits">
          <div>
            <span className="benefit-icon yellow x-icon">
              <i className="fa-regular fa-file-lines"></i>
            </span>
            <h3>NO CONTRACTS</h3>
            <p>List as long as you need.</p>
          </div>

          <div>
            <span className="benefit-icon yellow x-icon">
              <i className="fa-solid fa-users"></i>
            </span>
            <h3>NO REPS</h3>
            <p>You deal direct with buyers.</p>
          </div>

          <div>
            <span className="benefit-icon yellow x-icon">
              <i className="fa-solid fa-dollar-sign"></i>
            </span>
            <h3>NO FEES</h3>
            <p>100% free. Always.</p>
          </div>

          <div>
            <span className="benefit-icon green">
              <i className="fa-solid fa-bolt"></i>
            </span>
            <h3>GO LIVE INSTANTLY</h3>
            <p>Listings live in minutes.</p>
          </div>
        </div>
      </section>

      <section className="ready">
        <div className="ready-icon">✎</div>
        <div>
          <h2>READY TO SELL?</h2>
          <p>Post your machine free and deal direct with buyers.</p>
        </div>
        <a href={`${STAGING}/l/new`}>POST EQUIPMENT FREE →</a>
      </section>

      <footer id="about">
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
            <a href="https://ironxchange-c9x31o.mysharetribe-test.com/privacy-policy">
              Privacy
            </a>
            <a href="https://ironxchange-c9x31o.mysharetribe-test.com/terms-of-service">
              Terms
            </a>
          </div>
        </div>
      </footer>

      <style jsx>{`
        * {
          box-sizing: border-box;
        }

        :global(body) {
          margin: 0;
          font-family: 'Inter', sans-serif;
          background: #0b0b0b;
          color: #d6d6d6;
        }

        .nav {
          height: 86px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 5%;
          background: #050505;
          position: sticky;
          top: 0;
          z-index: 100;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .logo-img {
          height: 68px;
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
          letter-spacing: 0.6px;
          text-transform: uppercase;
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

        .hero {
          position: relative;
          height: 625px;
          min-height: 625px;
          background:
            linear-gradient(
              90deg,
              rgba(0, 0, 0, 0.9),
              rgba(0, 0, 0, 0.55),
              rgba(0, 0, 0, 0.18)
            ),
            url('/images/hero-equipment-yard.jpg');
          background-size: cover;
          background-position: center center;
          color: white;
          overflow: visible;
        }

        .hero-content {
          max-width: 760px;
          padding: 72px 5% 0;
        }

        .hero h1 {
          font-family: 'Bebas Neue', sans-serif;
          font-size: clamp(2.95rem, 5.15vw, 4.85rem);
          line-height: 0.94;
          margin: 0;
          letter-spacing: 1px;
          font-weight: 400;
          max-width: 640px;
        }

        .hero-icons {
          display: flex;
          gap: 34px;
          margin: 28px 0 26px;
          flex-wrap: wrap;
        }

        .hero-icons div {
          text-align: center;
          font-family: 'Montserrat', sans-serif;
          font-weight: 900;
          font-size: 12px;
          line-height: 1.25;
        }

        .hero-icon {
          width: 54px;
          height: 54px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          font-size: 25px;
          margin: 0 auto 9px;
          position: relative;
          color: white;
        }

        .hero-icon.red {
          border: 3px solid #c53030;
        }

        .hero-icon.green {
          border: 3px solid #2f855a;
          color: #2f855a;
        }

        .slash-icon::after {
          content: "";
          position: absolute;
          width: 67px;
          height: 4px;
          background: #c53030;
          transform: rotate(-38deg);
          border-radius: 999px;
        }

        .btn-primary,
        .ready a {
          display: inline-block;
          background: ${BRAND_YELLOW};
          color: black;
          padding: 15px 28px;
          border-radius: 7px;
          text-decoration: none;
          font-family: 'Montserrat', sans-serif;
          font-size: 13px;
          font-weight: 900;
          letter-spacing: 0.5px;
          box-shadow: 0 12px 28px rgba(0, 0, 0, 0.28);
          transition: transform 0.18s ease, box-shadow 0.18s ease;
        }

        .btn-primary:hover,
        .ready a:hover {
          transform: translateY(-2px);
          box-shadow: 0 16px 34px rgba(0, 0, 0, 0.35);
        }

        .built-line {
          margin-top: 28px;
          font-family: 'Montserrat', sans-serif;
          font-weight: 900;
          letter-spacing: 0.5px;
          font-size: 13px;
        }

        .built-line b {
          color: ${BRAND_YELLOW};
        }

        .hero-search {
          position: absolute;
          left: 5%;
          right: 5%;
          bottom: -34px;
          z-index: 4;
        }

        .search-container {
          max-width: 1180px;
          display: grid;
          grid-template-columns: 1fr 270px 145px;
          background: #141414;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 20px 55px rgba(0, 0, 0, 0.48);
          border: 1px solid rgba(255, 255, 255, 0.09);
        }

        input,
        select {
          padding: 17px 18px;
          border: none;
          border-right: 1px solid rgba(255, 255, 255, 0.08);
          font-size: 14px;
          font-family: 'Inter', sans-serif;
          outline: none;
          background: #141414;
          color: #f2f2f2;
        }

        input::placeholder {
          color: #777;
        }

        select {
          font-family: 'Montserrat', sans-serif;
          font-weight: 800;
          font-size: 0.82rem;
        }

        .search-btn {
          background: ${BRAND_YELLOW};
          border: none;
          color: #050505;
          font-family: 'Montserrat', sans-serif;
          font-weight: 900;
          cursor: pointer;
          letter-spacing: 0.4px;
        }

        .featured {
          padding: 76px 5% 60px;
          background: #0b0b0b;
          color: #d6d6d6;
        }

        .section-head {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          margin-bottom: 24px;
        }

        .section-head h2,
        .how h2,
        .ready h2 {
          margin: 0;
          color: #f2f2f2;
          font-family: 'Bebas Neue', sans-serif;
          font-size: 3rem;
          font-weight: 400;
          letter-spacing: 1px;
        }

        .section-head a {
          color: #d6d6d6;
          font-family: 'Montserrat', sans-serif;
          font-weight: 900;
          font-size: 13px;
          text-decoration: none;
        }

        .cards {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 22px;
        }

        .card {
          text-decoration: none;
          color: inherit;
          border: 1px solid #242424;
          border-radius: 16px;
          overflow: hidden;
          background: #151515;
          transition: transform 0.18s ease, border-color 0.18s ease,
            background 0.18s ease;
        }

        .card:hover {
          transform: translateY(-3px);
          border-color: #3a3a3a;
          background: #181818;
        }

        .card-photo {
          height: 190px;
          background-size: cover;
          background-position: center;
        }

        .card-body {
          padding: 16px;
        }

        .card h3 {
          margin: 0;
          color: #f2f2f2;
          font-size: 16px;
          letter-spacing: -0.2px;
        }

        .title-row {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          gap: 10px;
        }

        .hours-top {
          color: #8a8a8a !important;
          font-size: 11px !important;
          font-weight: 700;
          letter-spacing: 0.3px;
          white-space: nowrap;
        }

        .card p {
          margin: 8px 0 18px;
          color: #8f8f8f;
          font-size: 13px;
          line-height: 1.4;
        }

        .feature-line {
          min-height: 38px;
        }

        .meta {
          display: flex;
          gap: 12px;
          font-size: 12px;
          color: #9a9a9a;
          flex-wrap: wrap;
        }

        .price-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 16px;
        }

        .price-row strong {
          color: #f2f2f2;
          font-size: 18px;
        }

        .price-row span {
          color: #9a9a9a;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 0.4px;
        }

        .how {
          background: #f3f3f3;
          padding: 54px 5%;
          text-align: center;
        }

        .how h2 {
          color: #111;
        }

        .benefits {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 24px;
          margin-top: 32px;
        }

        .benefits div {
          background: transparent;
          padding: 18px 26px;
          border-right: 1px solid #ccc;
        }

        .benefits div:last-child {
          border-right: none;
        }

        .benefits h3 {
          margin: 10px 0 6px;
          font-family: 'Montserrat', sans-serif;
          font-weight: 900;
          color: #111;
        }

        .benefits p {
          color: #555;
          margin: 0;
        }

        .benefit-icon {
          display: block;
          font-size: 46px;
          margin: 0 auto 12px;
          position: relative;
        }

        .benefit-icon.yellow {
          color: #ffc400;
        }

        .benefit-icon.green {
          color: #38a169;
        }

        .x-icon::before,
        .x-icon::after {
          content: "";
          position: absolute;
          left: 50%;
          top: 50%;
          width: 58px;
          height: 4px;
          background: #c53030;
          border-radius: 999px;
          transform-origin: center;
        }

        .x-icon::before {
          transform: translate(-50%, -50%) rotate(45deg);
        }

        .x-icon::after {
          transform: translate(-50%, -50%) rotate(-45deg);
        }

        .benefit-icon.green i {
          font-size: 50px;
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

        .ready p {
          color: #aaa;
          margin: 4px 0 0;
        }

        footer {
          background: #050505;
          color: white;
          padding: 42px 5%;
          display: flex;
          justify-content: space-between;
          gap: 50px;
        }

        footer img {
          height: 52px;
        }

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

        @media (max-width: 1100px) {
          .cards {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        @media (max-width: 850px) {
          .nav {
            height: 70px;
          }

          .logo-img {
            height: 54px;
          }

          .nav-links {
            display: none;
          }

          .hero {
            height: auto;
            min-height: 620px;
            padding-bottom: 100px;
            background-position: center;
          }

          .hero-content {
            padding: 58px 5% 0;
            text-align: center;
            max-width: none;
          }

          .hero h1 {
            font-size: 3.75rem;
          }

          .hero-icons {
            justify-content: center;
            gap: 24px;
          }

          .hero-search {
            left: 4%;
            right: 4%;
            bottom: -42px;
          }

          .search-container {
            grid-template-columns: 1fr;
          }

          input,
          select {
            border-right: none;
            border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          }

          .search-btn {
            padding: 17px;
          }

          .featured {
            padding-top: 86px;
          }

          .cards,
          .benefits,
          .ready {
            grid-template-columns: 1fr;
          }

          .section-head,
          footer {
            flex-direction: column;
          }

          .benefits div {
            border-right: none;
            border-bottom: 1px solid #ccc;
          }

          .foot-cols {
            flex-direction: column;
            gap: 25px;
          }
        }
      `}</style>
    </>
  );
}
