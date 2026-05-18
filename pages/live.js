import Head from "next/head";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";

const BRAND_YELLOW = "#FFC400";

function slugify(text = "") {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function clean(value) {
  return value ? String(value).trim() : "";
}

function getListingUrl(listing) {
  if (!listing?.title) return "";

  if (typeof window === "undefined") return "";

  return `${window.location.origin}/listing/${slugify(listing.title)}?from=live`;
}

function buildSocialCopy(platform, listing, listingUrl) {
  const title = clean(listing.title) || "Equipment Listing";
  const price = clean(listing.price) || "Call for Price";
  const hours = clean(listing.hours) || "Hours not listed";
  const location = clean(listing.location) || "Location not listed";
  const description =
    clean(listing.description) ||
    "Clean machine. Full specs and photos available on IronXchange.";

  const base = `${title}
${hours} | ${location}
${price}

${description}

Listed on IronXchange.
View full specs + photos:
${listingUrl}`;

  if (platform === "x") {
    return `${title}
${hours} | ${location}
${price}

Listed on IronXchange:
${listingUrl}

#IronXchange #HeavyEquipment`;
  }

  if (platform === "linkedin") {
    return `${title}

${hours} | ${location}
${price}

Now listed on IronXchange.

${description}

View full specs and photos:
${listingUrl}`;
  }

  if (platform === "tiktok") {
    return `${title}
${hours} | ${location}
${price}

Full listing on IronXchange:
${listingUrl}

#IronXchange #HeavyEquipment #ConstructionEquipment`;
  }

  return base;
}

export default function ListingLivePage() {
  const router = useRouter();
  const { id } = router.query;

  const [loading, setLoading] = useState(true);
  const [listings, setListings] = useState([]);
  const [copied, setCopied] = useState("");

  useEffect(() => {
    fetch("/api/listings")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setListings(data);
      })
      .finally(() => setLoading(false));
  }, []);

  const listing = useMemo(() => {
    if (!id || listings.length === 0) return null;

    return listings.find(item => String(item.id) === String(id)) || null;
  }, [id, listings]);

  const listingUrl = listing ? getListingUrl(listing) : "";

  async function copyText(label, text) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);

      setTimeout(() => setCopied(""), 1600);
    } catch {
      alert("Copy failed. Highlight and copy manually.");
    }
  }

  if (loading) {
    return (
      <main className="loading">
        Loading live listing...
        <style jsx>{`
          .loading {
            min-height: 100vh;
            background: #0b0b0b;
            color: #d6d6d6;
            padding: 40px;
            font-family: Arial, sans-serif;
          }
        `}</style>
      </main>
    );
  }

  if (!listing) {
    return (
      <main className="loading">
        Listing not found yet. Refresh in a few seconds.
        <style jsx>{`
          .loading {
            min-height: 100vh;
            background: #0b0b0b;
            color: #d6d6d6;
            padding: 40px;
            font-family: Arial, sans-serif;
          }
        `}</style>
      </main>
    );
  }

  const shareButtons = [
    ["Facebook Marketplace", "facebook"],
    ["Facebook Page", "facebook"],
    ["Instagram", "instagram"],
    ["TikTok", "tiktok"],
    ["X", "x"],
    ["LinkedIn", "linkedin"]
  ];

  return (
    <>
      <Head>
        <title>Your Listing Is Live | IronXchange</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />

        <link
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"
          rel="stylesheet"
        />
      </Head>

      <main>
        <nav className="nav">
          <a href="/" className="logo-wrap">
            <img
              src="/images/ironxchange-logo.png"
              className="logo-img"
              alt="IronXchange"
            />
          </a>

          <div className="nav-links">
            <a href="/browse">SEARCH</a>
            <a href="/post-free" className="yellow-link">POST FREE</a>
            <a href="/account" className="login-icon logged-in" aria-label="Account">
              <i className="fa-regular fa-user"></i>
            </a>
          </div>
        </nav>

        <section className="wrap">
          <div className="hero">
            <div>
              <div className="live-pill">
                <span></span>
                LISTING LIVE
              </div>

              <h1>Your Listing Is Live</h1>

              <p>
                Now put it in front of buyers. Copy the post, open your platform,
                paste it, and drive traffic back to IronXchange.
              </p>
            </div>

            <div className="hero-actions">
              <a href={listingUrl} className="dark-btn">
                VIEW LIVE LISTING
              </a>

              <a href="/account" className="dark-btn">
                DASHBOARD
              </a>
            </div>
          </div>

          <div className="grid">
            <section className="panel preview">
              <img
                src={listing.imageUrl || listing.image || "/images/hero-equipment-yard.jpg"}
                alt={listing.title}
              />

              <div className="preview-body">
                <h2>{listing.title}</h2>

                <div className="facts">
                  <span>Hours</span>
                  <strong>{listing.hours || "—"}</strong>

                  <span>Price</span>
                  <strong>{listing.price || "Call"}</strong>

                  <span>Location</span>
                  <strong>{listing.location || "—"}</strong>
                </div>

                <button
                  type="button"
                  className="copy-link"
                  onClick={() => copyText("Listing Link", listingUrl)}
                >
                  {copied === "Listing Link" ? "COPIED" : "COPY LISTING LINK"}
                </button>
              </div>
            </section>

            <section className="panel promote">
              <h2>Promote Listing</h2>

              <p className="sub">
                These posts include your machine details, IronXchange branding,
                and the live listing link.
              </p>

              <div className="share-grid">
                {shareButtons.map(([label, platform]) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() =>
                      copyText(
                        label,
                        buildSocialCopy(platform, listing, listingUrl)
                      )
                    }
                  >
                    <i className="fa-regular fa-copy"></i>
                    {copied === label ? "COPIED" : `COPY ${label.toUpperCase()} POST`}
                  </button>
                ))}
              </div>

              <div className="open-grid">
                <a href="https://www.facebook.com/marketplace/create/vehicle" target="_blank" rel="noreferrer">
                  Open Facebook Marketplace
                </a>

                <a href="https://www.facebook.com/" target="_blank" rel="noreferrer">
                  Open Facebook
                </a>

                <a href="https://www.instagram.com/" target="_blank" rel="noreferrer">
                  Open Instagram
                </a>

                <a href="https://www.tiktok.com/upload" target="_blank" rel="noreferrer">
                  Open TikTok
                </a>

                <a href="https://x.com/compose/post" target="_blank" rel="noreferrer">
                  Open X
                </a>

                <a href="https://www.linkedin.com/feed/" target="_blank" rel="noreferrer">
                  Open LinkedIn
                </a>
              </div>
            </section>
          </div>
        </section>
      </main>

      <style jsx>{`
        :global(body) {
          margin: 0;
          background: #0b0b0b;
          color: #d6d6d6;
          font-family: Arial, sans-serif;
        }

        * {
          box-sizing: border-box;
        }

        main {
          min-height: 100vh;
          background: #0b0b0b;
        }

        .nav {
          height: 64px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 2%;
          background: #050505;
          border-bottom: 1px solid rgba(255,255,255,.08);
        }

        .logo-img {
          height: 38px;
          width: auto;
          display: block;
        }

        .nav-links {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .nav-links a {
          color: white;
          text-decoration: none;
          font-weight: 900;
          text-transform: uppercase;
          font-size: 12px;
          letter-spacing: .5px;
        }

        .yellow-link {
          color: ${BRAND_YELLOW} !important;
        }

        .login-icon {
          border: 2px solid #38A169;
          color: #38A169 !important;
          border-radius: 50%;
          width: 26px;
          height: 26px;
          display: grid;
          place-items: center;
          font-size: 14px !important;
        }

        .wrap {
          padding: 18px 2% 48px;
          max-width: 1500px;
          margin: 0 auto;
        }

        .hero {
          background: #151515;
          border: 1px solid #282828;
          border-radius: 16px;
          padding: 28px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 24px;
          margin-bottom: 10px;
        }

        .live-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border: 1px solid #2f855a;
          color: #38A169;
          border-radius: 999px;
          padding: 7px 11px;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: .5px;
          margin-bottom: 16px;
        }

        .live-pill span {
          width: 8px;
          height: 8px;
          background: #38A169;
          border-radius: 50%;
        }

        h1 {
          margin: 0;
          color: #f2f2f2;
          font-size: 42px;
          line-height: 1;
          letter-spacing: -1px;
        }

        .hero p {
          margin: 12px 0 0;
          color: #aaa;
          max-width: 680px;
          line-height: 1.55;
          font-size: 15px;
        }

        .hero-actions {
          display: grid;
          gap: 10px;
          min-width: 210px;
        }

        .dark-btn,
        .copy-link {
          text-decoration: none;
          text-align: center;
          background: ${BRAND_YELLOW};
          color: #050505;
          border: none;
          border-radius: 10px;
          padding: 15px 16px;
          font-size: 12px;
          font-weight: 900;
          letter-spacing: .4px;
          cursor: pointer;
        }

        .dark-btn:last-child {
          background: #101010;
          border: 1px solid #3a3a3a;
          color: #f2f2f2;
        }

        .grid {
          display: grid;
          grid-template-columns: 430px 1fr;
          gap: 10px;
        }

        .panel {
          background: #151515;
          border: 1px solid #282828;
          border-radius: 16px;
          overflow: hidden;
        }

        .preview img {
          width: 100%;
          height: 285px;
          object-fit: cover;
          display: block;
          background: #050505;
        }

        .preview-body {
          padding: 20px;
        }

        h2 {
          margin: 0 0 16px;
          color: #f2f2f2;
          font-size: 22px;
          line-height: 1.15;
        }

        .facts {
          display: grid;
          grid-template-columns: 90px 1fr;
          row-gap: 10px;
          margin-bottom: 18px;
          font-size: 14px;
        }

        .facts span {
          color: #888;
        }

        .facts strong {
          color: #f2f2f2;
        }

        .copy-link {
          width: 100%;
        }

        .promote {
          padding: 24px;
        }

        .sub {
          margin: -8px 0 18px;
          color: #999;
          line-height: 1.5;
          font-size: 14px;
        }

        .share-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
          margin-bottom: 18px;
        }

        .share-grid button {
          min-height: 58px;
          background: #101010;
          border: 1px solid #333;
          color: #f2f2f2;
          border-radius: 12px;
          padding: 14px;
          font-size: 12px;
          font-weight: 900;
          letter-spacing: .35px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }

        .share-grid button:hover {
          border-color: ${BRAND_YELLOW};
        }

        .open-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          border-top: 1px solid #2a2a2a;
          padding-top: 18px;
        }

        .open-grid a {
          text-align: center;
          text-decoration: none;
          color: ${BRAND_YELLOW};
          background: #101010;
          border: 1px solid #333;
          border-radius: 10px;
          padding: 13px 10px;
          font-size: 11px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: .35px;
        }

        @media (max-width: 900px) {
          .hero {
            flex-direction: column;
            align-items: stretch;
          }

          h1 {
            font-size: 34px;
          }

          .grid {
            grid-template-columns: 1fr;
          }

          .share-grid,
          .open-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 650px) {
          .nav {
            height: 60px;
            padding: 8px 4%;
          }

          .logo-img {
            height: 34px;
          }

          .nav-links a:not(.yellow-link):not(.login-icon) {
            display: none;
          }

          .wrap {
            padding: 12px 3% 36px;
          }

          .hero,
          .promote,
          .preview-body {
            padding: 18px;
          }
        }
      `}</style>
    </>
  );
}
