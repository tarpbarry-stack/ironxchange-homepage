import Head from "next/head";
import { useEffect, useState } from "react";

import ListingCard from "../components/ListingCard";
import { getListingId } from "../lib/listingFormatters";

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
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    fetch("/api/listings")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setLiveListings(data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    async function checkAuth() {
      try {
        const SharetribeSdk = await import("sharetribe-flex-sdk");

        const sdk = SharetribeSdk.createInstance({
          clientId: process.env.NEXT_PUBLIC_SHARETRIBE_CLIENT_ID
        });

        await sdk.currentUser.show();

        setLoggedIn(true);
      } catch {
        setLoggedIn(false);
      }
    }

    checkAuth();
  }, []);

  const featuredListings = liveListings
  .filter(item => {
    const listingStatus =
      item.listingStatus ||
      item.publicData?.listingStatus ||
      item.attributes?.publicData?.listingStatus;

    return listingStatus !== "archived";
  })
  .slice(0, 8);

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
    <meta name="viewport" content="width=device-width, initial-scale=1" />
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
  <div className="brand-side">
    <a href="/" className="logo-wrap">
      <img
        src="/images/ironxchange-logo.png"
        className="logo-img"
        alt="IronXchange"
      />
    </a>

    <div className="social-mini">
      <a href="#" aria-label="Facebook">
        <i className="fa-brands fa-facebook-f"></i>
      </a>

      <a href="#" aria-label="Instagram">
        <i className="fa-brands fa-instagram"></i>
      </a>

      <a href="#" aria-label="LinkedIn">
        <i className="fa-brands fa-linkedin-in"></i>
      </a>

      <a href="#" aria-label="YouTube">
        <i className="fa-brands fa-youtube"></i>
      </a>
    </div>
  </div>

  <div className="nav-links">

<div className="social-mini">
  <a href="YOUR_FACEBOOK_URL" aria-label="Facebook" target="_blank" rel="noreferrer">
    <i className="fa-brands fa-facebook-f"></i>
  </a>

  <a href="YOUR_INSTAGRAM_URL" aria-label="Instagram" target="_blank" rel="noreferrer">
    <i className="fa-brands fa-instagram"></i>
  </a>

  <a href="YOUR_LINKEDIN_URL" aria-label="LinkedIn" target="_blank" rel="noreferrer">
    <i className="fa-brands fa-linkedin-in"></i>
  </a>

  <a href="YOUR_YOUTUBE_URL" aria-label="YouTube" target="_blank" rel="noreferrer">
    <i className="fa-brands fa-youtube"></i>
  </a>

  <a href="YOUR_TIKTOK_URL" aria-label="TikTok" target="_blank" rel="noreferrer">
    <i className="fa-brands fa-tiktok"></i>
  </a>

  <a href="YOUR_X_URL" aria-label="X" target="_blank" rel="noreferrer">
    <i className="fa-brands fa-x-twitter"></i>
  </a>
</div>

<a href="/browse">SEARCH</a>
        
    <a href="/browse">SEARCH</a>

    <a href="/post-free" className="yellow-link">
      POST FREE
    </a>

    <a
      href="/account"
      className="login-icon logged-in"
      aria-label="Account"
    >
      <i className="fa-regular fa-user"></i>
    </a>
  </div>
</nav>
      <section className="hero">
        <div className="hero-content">
          <h1>FREE HEAVY EQUIPMENT MARKETPLACE</h1>

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

          <a href="/post-free" className="btn-primary">
            POST EQUIPMENT FREE →
          </a>

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
  <div className="cards">
    {featuredListings.map((item) => {
      const id = String(getListingId(item));

      return (
        <ListingCard
          key={id}
          listing={item}
          showSave={false}
          from="browser"
        />
      );
    })}
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

<a href="/post-free">
  POST EQUIPMENT FREE →
</a>
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

      <a href="/post-free">Post Equipment</a>
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

        :global(html),
:global(body) {
  margin: 0;
  width: 100%;
  overflow-x: hidden;
  font-family: 'Inter', sans-serif;
  background: #0b0b0b;
  color: #d6d6d6;
}

.nav {
  height: 60px;
  display: flex;
  justify-content: space-between;
  align-items: center;

  padding: 7px 2.5%;

  background:
    linear-gradient(180deg, rgba(255,255,255,.028), rgba(255,255,255,0)),
    #050505;

  border-bottom: 1px solid rgba(255,255,255,.07);

  box-shadow:
    0 1px 0 rgba(255,255,255,.025) inset,
    0 10px 28px rgba(0,0,0,.28);
}

.brand-side {
  display: flex;
  align-items: center;
  gap: 14px;
}

.logo-img {
  height: 36px;
  display: block;
}

.social-mini {
  display: flex;
  align-items: center;
  gap: 6px;
}

.social-mini a {
  width: 13px;
  height: 18px;
  display: grid;
  place-items: center;
  color: rgba(255,255,255,.40) !important;
  font-size: 8.75px;
  line-height: 1;
  text-decoration: none;
  transition: color .14s ease;
}

.social-mini a:hover {
  color: rgba(255,196,0,.78) !important;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 14px;
}

.nav-links a {
  color: rgba(255,255,255,.86);
  text-decoration: none;
  font-weight: 900;
  text-transform: uppercase;
  font-size: 11px;
  letter-spacing: .55px;
  line-height: 1;
}

.yellow-link {
  color: #FFC400 !important;
}

.login-icon {
  width: 27px;
  height: 27px;

  display: grid;
  place-items: center;

  border: 1px solid rgba(56,161,105,.78);
  border-radius: 50%;

  color: #38A169 !important;

  font-size: 13px !important;

  box-shadow:
    0 1px 0 rgba(255,255,255,.05) inset,
    0 0 0 1px rgba(255,255,255,.018);
}

.login-icon.logged-in {
  border-color: rgba(56,161,105,.78);
  color: #38A169 !important;
}

      .hero {
  position: relative;
  height: 365px;
min-height: 365px;

  background:
    linear-gradient(
      90deg,
      rgba(0,0,0,.46),
      rgba(0,0,0,.16),
      rgba(0,0,0,0)
    ),
    url('/images/hero-equipment-yard.jpg');

  background-size: cover;

  background-position: center 74%;

  color: white;

  overflow: visible;
}

    .hero-content {
  max-width: 760px;
  padding: 58px 5% 0;
}

        .hero h1 {
          font-family: 'Bebas Neue', sans-serif;
          font-size: clamp(1.95rem, 3.25vw, 2.85rem);
          line-height: 1;
          margin: 0;
          letter-spacing: .5px;
          font-weight: 400;
          max-width: 1000px;
          text-shadow: 0 3px 18px rgba(0,0,0,.34);
        }

        .hero-icons {
          display: flex;
          gap: 26px;
          margin: 22px 0 22px;
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
  display: inline-flex;
  align-items: center;
  justify-content: center;

  height: 38px;
  padding: 0 16px;

  background: #151515;
  color: #FFC400;

  border: 1px solid #3a2d00;
  border-radius: 8px;

  text-decoration: none;

  font-family: 'Montserrat', sans-serif;
  font-size: 10px;
  font-weight: 900;

  letter-spacing: .55px;
  text-transform: uppercase;

  box-shadow:
    0 1px 0 rgba(255,255,255,.035) inset,
    0 10px 24px rgba(0,0,0,.22);

  transition:
    transform .14s ease,
    border-color .14s ease,
    background .14s ease;
}

.btn-primary:hover,
.ready a:hover {
  transform: translateY(-1px);

  background: #1a1400;

  border-color: #FFC400;
}

     .hero-search {
  position: absolute;
  left: 5%;
  right: 5%;
  bottom: -32px;

  z-index: 4;
  max-width: 1240px;

  padding: 10px;

  background:
    linear-gradient(180deg, rgba(255,255,255,.045), rgba(255,255,255,0)),
    rgba(8,8,8,.72);

  border: 1px solid rgba(255,255,255,.07);
  outline: 1px solid rgba(255,255,255,.025);

  border-radius: 14px;

  box-shadow:
    0 1px 0 rgba(255,255,255,.04) inset,
    0 18px 44px rgba(0,0,0,.32);
}

      .search-container {
  max-width: 1180px;
  display: grid;
  grid-template-columns: minmax(320px, 1fr) 280px 160px;
  background: #141414;
  border-radius: 10px;
  width: 100%;
  overflow: hidden;
  box-shadow: 0 20px 55px rgba(0,0,0,.48);
  border: 1px solid rgba(255,255,255,.09);
}
       input, select {
  height: 38px;

  padding: 0 13px;

  border: none;
  border-right: 1px solid rgba(255,255,255,.07);

  background: #101010;
  color: #e8e8e8;

  font-size: 12px;
  font-family: 'Inter', sans-serif;
  font-weight: 650;

  outline: none;
}

       input::placeholder {
  color: rgba(255,255,255,.36);
  font-weight: 600;
}

      select {
  font-family: 'Montserrat', sans-serif;
  font-weight: 850;
  font-size: 10.5px;

  color: rgba(255,255,255,.78);

  text-transform: uppercase;
  letter-spacing: .35px;

  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;

  background:
    linear-gradient(45deg, transparent 50%, #FFC400 50%),
    linear-gradient(135deg, #FFC400 50%, transparent 50%),
    #101010;

  background-position:
    calc(100% - 17px) 50%,
    calc(100% - 12px) 50%;

  background-size:
    5px 5px,
    5px 5px;

  background-repeat: no-repeat;

  padding-right: 34px;
}

       .search-btn {
  height: 40px;

  background: #151515;
  color: #FFC400;

  border: 1px solid #3a2d00;
  border-left: 1px solid #2a2a2a;

  font-family: 'Montserrat', sans-serif;
  font-weight: 900;
  font-size: 10px;

  cursor: pointer;

  letter-spacing: .55px;
  text-transform: uppercase;

  box-shadow:
    0 1px 0 rgba(255,255,255,.035) inset;
}

.search-btn:hover {
  background: #1a1400;
  border-color: #FFC400;
}

.search-btn:hover {
  filter: brightness(.96);
}

       .featured {
  min-height: 660px;
  padding: 52px 5% 54px;
  background: #0b0b0b;
  color: #d6d6d6;
}

.how h2,
.ready h2 {
  margin: 0;
  color: #f2f2f2;
  font-family: 'Bebas Neue', sans-serif;
  font-size: 3rem;
  font-weight: 400;
  letter-spacing: 1px;
}
       .cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 22px;
  min-height: 560px;
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
    height: 34px;
  }

  .nav-links {
    display: none;
  }

  .hero,
  .featured,
  .how,
  .ready,
  footer {
    overflow-x: hidden;
  }

 .hero {
  height: 500px;
  min-height: 500px;
  padding-bottom: 72px;
  background-size: 160%;
  background-repeat: no-repeat;
  background-position: center 18%;
  background-color: #0b0b0b;
}
  .hero-content {
    padding: 28px 5% 0;
  }

  .hero h1 {
    font-size: 2rem;
    line-height: 1;
  }

  .hero-icons {
    justify-content: center;
    gap: 24px;
  }

  .hero-search {
    left: 4%;
    right: 4%;
    bottom: -18px;
    max-width: 92%;
  }

  .search-container {
    width: 100%;
    max-width: 100%;
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
    grid-template-columns: 1fr !important;
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
