import Head from "next/head";
import { useMemo, useState } from "react";

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
  {
    title: "2023 KOMATSU WA475-10",
    type: "WHEEL LOADERS",
    hours: "5,790 Hrs",
    location: "Post, TX",
    price: "$175,500",
    image: "/images/2023-komatsu-wa475-10.jpg",
    link: "https://staging.ironxchange.com/l/2023-komatsu-wa475-4-989-hrs/69f80a91-ef02-446d-bfa8-61f00353e32e"
  },
  {
    title: "2020 DEERE 772GP",
    type: "MOTOR GRADERS",
    hours: "3,907 Hrs",
    location: "Colorado City, TX",
    price: "$179,000",
    image: "/images/2020-Deere-772GP.jpg",
    link: "https://staging.ironxchange.com/l/2020-deere-772gp-4-790-hrs/69f7ffd8-f07e-4587-a4dd-4a1fa7626d91"
  },
  {
    title: "2019 MCCLOSKEY I54",
    type: "OTHER SPECIALTY",
    hours: "4,016 Hrs",
    location: "Jal, NM",
    price: "$315,000",
    image: "/images/2019-mccloskey-i54.jpg",
    link: "https://staging.ironxchange.com/l/2019-mccloskey-i54-4-118-hrs/69f8117f-38b5-4218-893f-bbdab94b929d"
  }
];

export default function Browse() {
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState("ALL CATEGORIES");

  const filteredListings = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return listings.filter((item) => {
      const matchesCategory =
        category === "ALL CATEGORIES" || item.type === category;

      const matchesSearch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.type.toLowerCase().includes(q) ||
        item.location.toLowerCase().includes(q) ||
        item.hours.toLowerCase().includes(q) ||
        item.price.toLowerCase().includes(q);

      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, category]);

  return (
    <>
      <Head>
        <title>Browse Equipment | IronXchange</title>
        <meta
          name="description"
          content="Browse heavy equipment for sale on IronXchange."
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
          <a href={`${STAGING}/login`} className="login-icon">
            <i className="fa-regular fa-user"></i>
          </a>
        </div>
      </nav>

      <section className="browse-hero">
        <div>
          <h1>HEAVY EQUIPMENT FOR SALE</h1>
          <p>
            Browse equipment from owners, dealers, and fleet operators. No
            middlemen. Contact direct.
          </p>
        </div>
      </section>

      <section className="search-section">
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

          <button onClick={() => {}}>SEARCH</button>
        </div>

        <div className="popular">
          <span>Popular Searches:</span>
          {[
            "EXCAVATORS",
            "SKID STEER/CTL",
            "DOZERS",
            "DUMP TRUCKS - ARTIC/RIGID",
            "TRAILERS",
            "WHEEL LOADERS"
          ].map((x) => (
            <button
              key={x}
              onClick={() => {
                setCategory(x);
                setSearchQuery("");
              }}
            >
              {x}
            </button>
          ))}
        </div>
      </section>

      <section className="featured">
        <div className="section-head">
          <h2>AVAILABLE EQUIPMENT</h2>
          <span>{filteredListings.length} LISTINGS</span>
        </div>

        <div className="cards">
          {filteredListings.map((item) => (
            <div className="card" key={item.title}>
              <a
                href={item.link}
                className="card-photo"
                style={{ backgroundImage: `url(${item.image})` }}
              >
                <span>♡</span>
              </a>

              <div className="card-body">
                <h3>{item.title}</h3>
                <p>{item.type}</p>

                <div className="meta">
                  <span>◷ {item.hours}</span>
                  <span>⌖ {item.location}</span>
                </div>

                <div className="price-row">
                  <strong>{item.price}</strong>
                  <a href={item.link}>VIEW DETAILS</a>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredListings.length === 0 && (
          <div className="empty">
            <h3>No listings matched that search.</h3>
            <p>Try another keyword or category.</p>
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

        .browse-hero {
          background:
            linear-gradient(90deg, rgba(0,0,0,.90), rgba(0,0,0,.70), rgba(0,0,0,.35)),
            url('/images/hero-equipment-yard.jpg');
          background-size: cover;
          background-position: center;
          color: white;
          padding: 74px 5% 68px;
          box-shadow: inset 0 -80px 160px rgba(0,0,0,.70);
        }

        .browse-hero h1 {
          font-family: 'Bebas Neue', sans-serif;
          font-size: clamp(4rem, 7vw, 6.7rem);
          line-height: .88;
          margin: 0;
          letter-spacing: 1px;
          font-weight: 400;
        }

        .browse-hero p {
          margin: 18px 0 0;
          max-width: 720px;
          font-size: 1.1rem;
          color: #ddd;
          font-weight: 600;
        }

        .search-section {
          padding: 38px 5% 30px;
          background: #f8f8f8;
          text-align: center;
        }

        .search-container {
          max-width: 1100px;
          margin: 0 auto;
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

        button {
          background: ${BRAND_YELLOW};
          border: none;
          font-family: 'Montserrat', sans-serif;
          font-weight: 900;
          cursor: pointer;
          transition: background .18s ease, transform .18s ease;
        }

        button:hover {
          transform: translateY(-1px);
          background: #ffd43b;
        }

        .popular {
          max-width: 1100px;
          margin: 18px auto 0;
          text-align: left;
          color: #444;
          font-size: 14px;
        }

        .popular button {
          background: transparent;
          border: none;
          margin: 6px 0 0 18px;
          text-decoration: underline;
          cursor: pointer;
          color: #333;
          font-weight: 700;
        }

        .popular button:hover {
          transform: none;
          background: transparent;
          color: #000;
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
        }

        .card-photo {
          height: 185px;
          background-size: cover;
          background-position: center;
          position: relative;
          display: block;
        }

        .card-photo span {
          position: absolute;
          top: 12px;
          right: 14px;
          color: white;
          font-size: 25px;
        }

        .card-body {
          padding: 18px;
        }

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

        @media (max-width: 850px) {
          .nav-links {
            display: none;
          }

          .logo-img {
            height: 56px;
          }

          .browse-hero {
            text-align: center;
            padding: 58px 24px 50px;
          }

          .browse-hero h1 {
            font-size: 4rem;
          }

          .search-container,
          .cards,
          .ready {
            grid-template-columns: 1fr;
          }

          input,
          select {
            border-right: none;
            border-bottom: 1px solid #e5e5e5;
          }

          .section-head,
          footer {
            flex-direction: column;
            align-items: flex-start;
          }

          .ready {
            text-align: center;
          }

          .ready-icon {
            margin: 0 auto;
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
