import Head from "next/head";
import { useEffect, useMemo, useState } from "react";

const STAGING = "https://staging.ironxchange.com";
const BRAND_YELLOW = "#FFC400";

const featureKeywords = [
  { match: ["push block", "pushblock"], label: "Push Block" },
  { match: ["rear ripper", "ripper"], label: "Rear Ripper" },
  { match: ["smartgrade", "smart grade"], label: "SmartGrade" },
  { match: ["topcon"], label: "Topcon" },
  { match: ["trimble"], label: "Trimble" },
  { match: ["gps"], label: "GPS" },
  { match: ["joystick"], label: "Joystick Controls" },
  { match: ["20.5", "20.5 tires", "20.5r25"], label: "20.5 Tires" },
  { match: ["23.5", "23.5 tires", "23.5r25"], label: "23.5 Tires" },
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
    .filter((feature) =>
      feature.match.some((term) => text.includes(term))
    )
    .map((feature) => feature.label);

  return [...new Set(matches)].slice(0, 4).join(" • ");
}

function slugify(text = "") {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function SavedListings() {
  const [listings, setListings] = useState([]);
  const [savedSlugs, setSavedSlugs] = useState([]);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("ironxchangeSaved") || "[]");
    setSavedSlugs(saved);

    fetch("/api/listings")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setListings(data);
      })
      .catch(() => {});
  }, []);

  const savedListings = useMemo(() => {
    return listings.filter((item) => savedSlugs.includes(slugify(item.title)));
  }, [listings, savedSlugs]);

  return (
    <>
      <Head>
        <title>Saved Listings | IronXchange</title>
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
    <a href="/browse">BROWSE</a>

    <a href={`${STAGING}/l/new`} className="yellow-link">
      POST FREE
    </a>

    <a href={`${STAGING}/login`} className="login-icon" aria-label="Login">
      <i className="fa-regular fa-user"></i>
    </a>
  </div>
</nav>

<main>
  <div className="saved-head">
  <div>
    <h1>Saved Listings</h1>

    <p>
      Machines you've starred and saved for later.
    </p>
  </div>

  <span>
    {savedListings.length} SAVED
  </span>
</div>
      <div className="cards">
  {savedListings.map((item) => (
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
            "/images/hero-equipment-yard.jpg"
          })`
        }}
      />

      <div className="card-body">
        <div className="title-row">
          <h3>{item.title.replace(item.hours, "").trim()}</h3>

          <h3 className="hours-inline">{item.hours}</h3>
        </div>

       <p className="feature-line">
  {getFeatureLine(item)}
</p>

        <div className="price-row">
          <strong>{item.price}</strong>

          <div className="meta">
            <span>⌖ {item.location}</span>
          </div>
        </div>
      </div>
    </a>
  ))}
</div>
        {savedListings.length === 0 && (
          <p className="empty">No saved listings yet.</p>
        )}
      </main>

      <style jsx>{`
        :global(body) {
          margin: 0;
          font-family: Arial, sans-serif;
          background: #0b0b0b;
          color: #d6d6d6;
        }

.nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 5%;
  background: #050505;
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
  font-weight: 900;
  text-transform: uppercase;
  font-size: 13px;
  letter-spacing: .6px;
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

        main {
          padding: 40px 5%;
        }

        h1 {
          color: #f2f2f2;
          margin-bottom: 24px;
        }

.saved-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 24px;
}

.saved-head h1 {
  margin: 0;
  color: #F2F2F2;
  font-size: 30px;
  letter-spacing: -0.4px;
}

.saved-head p {
  margin: 8px 0 0;
  color: #8A8A8A;
  font-size: 14px;
}

.saved-head span {
  color: #777;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: .5px;
}

        .cards {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 22px;
        }

       .card {
  text-decoration: none;
  color: inherit;
  background: #151515;
  border: 1px solid #242424;
  border-radius: 16px;
  overflow: hidden;
  transition: transform .18s ease,
              border-color .18s ease,
              background .18s ease;
}

.card:hover {
  transform: translateY(-3px);
  border-color: #3A3A3A;
  background: #181818;
}

       .card-photo {
  height: 190px;
  background-size: cover;
  background-position: center;
  border-bottom: 1px solid #202020;
}

.card-body {
  padding: 16px;
}

.card h3 {
  margin: 0;
  color: #F2F2F2;
  font-size: 16px;
  letter-spacing: -0.2px;
}

.title-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 10px;
}

.hours-inline {
  color: #8A8A8A;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: .3px;
  white-space: nowrap;
}

.feature-line {
  min-height: 38px;
  margin: 8px 0 18px;
  color: #8F8F8F;
  font-size: 13px;
  line-height: 1.4;
}

.price-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
}

.price-row strong {
  color: #F2F2F2;
  font-size: 18px;
}

.meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #9A9A9A;
  flex-wrap: wrap;
}

.meta span {
  color: #9A9A9A;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: .4px;
}

.empty {
  color: #999;
}

        @media (max-width: 850px) {
          .cards {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
}
