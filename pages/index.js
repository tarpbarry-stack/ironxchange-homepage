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
  {
    title: "2018 BELL B30E",
    type: "Articulated Truck",
    hours: "6,800 Hrs",
    location: "Waco, TX",
    price: "$98,900",
    image: "/images/2018-bell-b30e.jpg",
    link: `${STAGING}/s?keywords=${encodeURIComponent("2018 BELL B30E")}`
  },
  {
    title: "2021 DEERE 750L",
    type: "Dozer",
    hours: "4,017 Hrs",
    location: "Wilson, OK",
    price: "$129,000",
    image: "/images/2021-deere-750l.jpg",
    link: `${STAGING}/s?keywords=${encodeURIComponent("2021 DEERE 750L")}`
  },
  {
    title: "2023 KOMATSU WA475-10",
    type: "Wheel Loader",
    hours: "5,790 Hrs",
    location: "Post, TX",
    price: "$175,500",
    image: "/images/2023-komatsu-wa475-10.jpg",
    link: `${STAGING}/s?keywords=${encodeURIComponent("2023 KOMATSU WA475-10")}`
  },
  {
    title: "2020 DEERE 872GP",
    type: "Motor Grader",
    hours: "3,907 Hrs",
    location: "Lamesa, TX",
    price: "$184,000",
    image: "/images/2020-deere-872gp.jpg",
    link: `${STAGING}/s?keywords=${encodeURIComponent("2020 DEERE 872GP")}`
  },
  {
    title: "2023 DEERE 1025R",
    type: "Compact Tractor",
    hours: "861 Hrs",
    location: "Ringling, OK",
    price: "$13,200",
    image: "/images/2023-deere-1025r.jpg",
    link: `${STAGING}/s?keywords=${encodeURIComponent("2023 DEERE 1025R")}`
  },
  {
    title: "2017 DEERE 85G",
    type: "Mini Excavator",
    hours: "3,105 Hrs",
    location: "Many, LA",
    price: "$52,500",
    image: "/images/2017-deere-85g.jpg",
    link: `${STAGING}/s?keywords=${encodeURIComponent("2017 DEERE 85G")}`
  },
  {
    title: "2007 PETERBILT 389",
    type: "Water Truck",
    hours: "298,000 Miles",
    location: "Hobbs, NM",
    price: "$44,900",
    image: "/images/2007-peterbilt-389.jpg",
    link: `${STAGING}/s?keywords=${encodeURIComponent("2007 PETERBILT 389")}`
  },
  {
    title: "2019 MCCLOSKEY I54",
    type: "Crusher",
    hours: "4,016 Hrs",
    location: "Jal, NM",
    price: "$315,000",
    image: "/images/2019-mccloskey-i54.jpg",
    link: `${STAGING}/s?keywords=${encodeURIComponent("2019 MCCLOSKEY I54")}`
  }
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
          <img src="/images/ironxchange-logo.png" className="logo-img" alt="IronXchange" />
        </a>

        <div className="nav-links">
  <a href={`${STAGING}/s`}>Browse Equipment</a>
  <a href={`${STAGING}/l/new`} className="yellow-link">Post Equipment Free</a>
  <a href={`${STAGING}/login`} className="login-icon">
    <i className="fa-regular fa-user"></i>
  </a>
</div>
      </nav>

      <section className="hero">
        <div className="hero-content">
          <h1>FREE HEAVY<br />EQUIPMENT MARKETPLACE</h1>

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
    <strong>LISTINGS LIVE<br />IN MINUTES</strong>
  </div>
</div>

          <div className="cta-buttons">
            <a href={`${STAGING}/l/new`} className="btn-primary">POST EQUIPMENT FREE →</a>
          </div>

          <p className="built-line">
            BUILT BY PEOPLE WHO ACTUALLY BUY AND SELL <b>IRON.</b>
          </p>
        </div>
      </section>

      <section className="search-section">
        <h2>FIND THE RIGHT EQUIPMENT. CONTACT DIRECT.</h2>
        <p>Browse equipment from owners, dealers, and fleet operators. No middlemen.</p>

        <div className="search-container">
          <input
            type="text"
            placeholder="Search equipment (e.g. Caterpillar 320, Komatsu dozer, trailer...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />

          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            {categories.map((c) => <option key={c}>{c}</option>)}
          </select>

          <button onClick={handleSearch} className="search-btn">SEARCH</button>
        </div>

        <div className="popular">
          <span>Popular Searches:</span>
          {["EXCAVATORS", "SKID STEER/CTL", "DOZERS", "DUMP TRUCKS - ARTIC/RIGID", "TRAILERS", "WHEEL LOADERS"].map((x) => (
            <button key={x} onClick={() => window.location.href = `${STAGING}/s?keywords=${encodeURIComponent(x)}`}>
              {x}
            </button>
          ))}
        </div>
      </section>

      <section className="featured">
        <div className="section-head">
          <h2>FEATURED EQUIPMENT</h2>
          <a href={`${STAGING}/s`}>VIEW ALL EQUIPMENT →</a>
        </div>

        <div className="cards">
        {listings.map((item) => (
  <div className="card" key={item.title}>
    <div
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
    <a href={`${STAGING}/s`}>Browse Equipment</a>
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

        .hero {
        box-shadow: inset 0 -120px 200px rgba(0,0,0,0.9);          
        height: 85vh;
          min-height: 680px;
          background:
            linear-gradient(90deg, rgba(0,0,0,.87), rgba(0,0,0,.64), rgba(0,0,0,.24)),
            url('/images/hero-equipment-yard.jpg');
          background-size: cover;
          background-position: center;
          display: flex;
          align-items: center;
          color: white;
          padding: 0 5%;
        }

        .hero-content { max-width: 850px; }

       .hero h1 {
  font-family: 'Bebas Neue', sans-serif;
  font-size: clamp(4.6rem, 8vw, 7.2rem);
  line-height: .86;
  margin: 0;
  letter-spacing: 1px;
  font-weight: 400;
  max-width: 780px;
}

      .hero-icons {
  display: flex;
  gap: 42px;
  margin: 36px 0 32px;
  flex-wrap: wrap;
}

        .hero-icons div {
          text-align: center;
          font-family: 'Montserrat', sans-serif;
          font-weight: 900;
          font-size: 13px;
          line-height: 1.25;
        }
.hero-icon {
  width: 62px;
  height: 62px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 30px;
  margin: 0 auto 10px;
  position: relative;
    
  color: white; /* icon stays white */
}

/* RED = circle + slash */
.hero-icon.red {
  border: 3px solid #C53030;
}

/* GREEN = live */
.hero-icon.green {
  border: 3px solid #2F855A;
  color: #2F855A;
}

/* SLASH */
.slash-icon::after {
  content: "";
  position: absolute;
  width: 78px;
  height: 4px;
  background: #C53030;
  transform: rotate(-38deg);
  border-radius: 999px;
}

.benefit-icon {
  display: block;
  font-size: 46px;
  margin: 0 auto 12px;
  position: relative;
}

.benefit-icon.yellow {
  color: #FFC400;
}

.benefit-icon.green {
  color: #38A169;
}

.x-icon::before,
.x-icon::after {
  content: "";
  position: absolute;
  left: 50%;
  top: 50%;
  width: 58px;
  height: 4px;
  background: #C53030;
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

       .btn-primary,
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

.btn-primary:hover,
.ready a:hover {
  transform: translateY(-2px);
  box-shadow: 0 16px 34px rgba(0,0,0,.35);
}

        .built-line {
          margin-top: 64px;
          font-family: 'Montserrat', sans-serif;
          font-weight: 900;
          letter-spacing: .5px;
          font-size: 14px;
        }

        .built-line b { color: ${BRAND_YELLOW}; }

        .search-section {
          padding: 42px 5% 32px;
          background: #f8f8f8;
          text-align: center;
        }

        .search-section h2,
        .featured h2,
        .how h2,
        .ready h2 {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 3rem;
          font-weight: 400;
          letter-spacing: 1px;
          margin: 0;
        }

        .search-section p {
          color: #333;
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

        .section-head a {
          color: #1b334b;
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
          padding: 62px 5%;
          text-align: center;
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

        .benefits div:last-child { border-right: none; }

        .benefits h3 {
          margin: 10px 0 6px;
          font-family: 'Montserrat', sans-serif;
          font-weight: 900;
        }

        .benefits p {
          color: #555;
          margin: 0;
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

          .hero {
            min-height: 620px;
            text-align: center;
            justify-content: center;
          }

          .hero h1 { font-size: 4rem; }

          .hero-icons,
          .cta-buttons {
            justify-content: center;
          }

          .search-container,
          .cards,
          .benefits,
          .ready {
            grid-template-columns: 1fr;
          }

          input,
          select {
            border-right: none;
            border-bottom: 1px solid #e5e5e5;
          }

          .search-btn {
  background: ${BRAND_YELLOW};
  border: none;
  font-family: 'Montserrat', sans-serif;
  font-weight: 900;
  cursor: pointer;
  transition: background .18s ease, transform .18s ease;
}

.search-btn:hover {
  transform: translateY(-1px);
  background: #ffd43b;
}
.section-head,
          footer {
            flex-direction: column;
          }

          .foot-cols {
            flex-direction: column;
            gap: 25px;
          }

          .benefits div {
            border-right: none;
            border-bottom: 1px solid #ccc;
          }
        }
      `}</style>
    </>
  );
}
