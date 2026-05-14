import Head from "next/head";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";

const STAGING = "https://staging.ironxchange.com";
const BRAND_YELLOW = "#FFC400";

function slugify(text = "") {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function getListingImages(listing) {
  const possibleImages = [
    ...(Array.isArray(listing?.images) ? listing.images : []),
    ...(Array.isArray(listing?.imageUrls) ? listing.imageUrls : []),
    listing?.imageUrl,
    listing?.image
  ].filter(Boolean);

  const normalized = possibleImages
    .map((img) => {
      if (typeof img === "string") return img;
      return img.url || img.src || img.attributes?.variants?.default?.url;
    })
    .filter(Boolean);

  return [...new Set(normalized)];
}

export default function ListingPage() {
  const router = useRouter();
  const { slug } = router.query;

  const [listings, setListings] = useState([]);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    fetch("/api/listings")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setListings(data);
      })
      .catch(() => {});
  }, []);

  const listing = useMemo(() => {
    if (!slug || listings.length === 0) return null;

    return listings.find((item) => slugify(item.title) === slug);
  }, [slug, listings]);

  const images = getListingImages(listing);

  if (!listing) {
    return (
      <main style={{ background: "#0b0b0b", color: "#ddd", minHeight: "100vh", padding: 40 }}>
        Loading listing...
      </main>
    );
  }

  const heroImage = images[activeImage] || "/images/hero-equipment-yard.jpg";

  return (
    <>
      <Head>
        <title>{listing.title} | IronXchange</title>
        <link
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"
          rel="stylesheet"
        />
      </Head>

      <main>
        <nav className="nav">
          <a href="/" className="logo-wrap">
            <img src="/images/ironxchange-logo.png" className="logo-img" alt="IronXchange" />
          </a>

          <div className="nav-links">
            <a href={`${STAGING}/l/new`} className="yellow-link">POST FREE</a>
            <a href={`${STAGING}/login`} className="login-icon" aria-label="Login">
              <i className="fa-regular fa-user"></i>
            </a>
          </div>
        </nav>

        <section className="page">
          <div className="title-row">
            <div>
              <h1>{listing.title}</h1>
              <p>{listing.hours} · {listing.location}</p>
            </div>

            <div className="price">{listing.price}</div>
          </div>

          <div className="photo-grid">
            <div className="hero-wrap">
              <img src={heroImage} alt={listing.title} className="hero-photo" />

              <button
                className="arrow left"
                onClick={() => setActiveImage((activeImage - 1 + images.length) % images.length)}
              >
                ‹
              </button>

              <button
                className="arrow right"
                onClick={() => setActiveImage((activeImage + 1) % images.length)}
              >
                ›
              </button>

              <div className="photo-actions">
                <span>♡ Save</span>
                <span>↗ Share</span>
                <span>👁 Watch</span>
              </div>
            </div>

            <div className="photo-rail">
              {images.map((src, index) => (
                <img
                  key={src}
                  src={src}
                  alt=""
                  onClick={() => setActiveImage(index)}
                />
              ))}
            </div>
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

        * { box-sizing: border-box; }

        main {
          min-height: 100vh;
          background: #0b0b0b;
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

        .page {
          padding: 28px 3%;
          max-width: 1500px;
          margin: 0 auto;
        }

        .title-row {
          display: flex;
          justify-content: space-between;
          gap: 24px;
          margin-bottom: 18px;
        }

        h1 {
          margin: 0;
          color: #f2f2f2;
          font-size: 30px;
          font-weight: 800;
          letter-spacing: -0.5px;
        }

        .title-row p {
          margin: 10px 0 0;
          color: #9a9a9a;
          font-size: 16px;
        }

        .price {
          color: #f2f2f2;
          font-size: 32px;
          font-weight: 800;
          white-space: nowrap;
        }

        .photo-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 300px;
          gap: 12px;
        }

        .hero-wrap {
          position: relative;
          min-width: 0;
        }

        .hero-photo {
          width: 100%;
          height: 620px;
          object-fit: cover;
          border-radius: 14px;
          display: block;
          background: #111;
        }

        .photo-rail {
          height: 620px;
          overflow-y: auto;
          display: grid;
          grid-auto-rows: 146px;
          gap: 12px;
        }

        .photo-rail img {
          width: 100%;
          height: 146px;
          object-fit: cover;
          border-radius: 14px;
          cursor: pointer;
        }

        .photo-actions {
          position: absolute;
          left: 20px;
          bottom: 20px;
          display: flex;
          gap: 18px;
          background: rgba(0,0,0,.62);
          padding: 12px 16px;
          border-radius: 10px;
          color: #e5e5e5;
          font-size: 14px;
        }

        .arrow {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 42px;
          height: 42px;
          border-radius: 50%;
          border: 1px solid rgba(255,255,255,.28);
          background: rgba(0,0,0,.42);
          color: #f2f2f2;
          font-size: 32px;
          cursor: pointer;
        }

        .arrow.left { left: 18px; }
        .arrow.right { right: 18px; }

        @media (max-width: 950px) {
          .photo-grid {
            display: flex;
            overflow-x: auto;
            gap: 10px;
            scroll-snap-type: x mandatory;
            -webkit-overflow-scrolling: touch;
          }

          .hero-wrap {
            min-width: 78%;
            scroll-snap-align: start;
          }

          .hero-photo {
            height: 360px;
            object-fit: cover;
          }

          .photo-rail {
            display: grid;
            grid-auto-flow: column;
            grid-template-rows: repeat(2, 175px);
            grid-auto-columns: 42vw;
            gap: 10px;
            height: 360px;
            overflow: visible;
          }

          .photo-rail img {
            width: 100%;
            height: 175px;
          }
        }

        @media (max-width: 850px) {
          .logo-img { height: 56px; }
          .nav-links { gap: 18px; }
          .yellow-link { font-size: 12px !important; }

          .page { padding: 22px 4%; }

          .title-row {
            flex-direction: column;
            gap: 8px;
          }

          h1 { font-size: 24px; }
          .price { font-size: 25px; }

          .arrow { display: none; }

          .photo-actions {
            left: 12px;
            bottom: 12px;
            gap: 12px;
            font-size: 12px;
            padding: 10px 12px;
          }
        }
      `}</style>
    </>
  );
}
