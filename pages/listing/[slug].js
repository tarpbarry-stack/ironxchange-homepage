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

function getImageUrl(img) {
  if (!img) return null;
  if (typeof img === "string") return img;

  return (
    img.url ||
    img.src ||
    img.attributes?.variants?.default?.url ||
    img.attributes?.variants?.landscape-crop?.url ||
    img.attributes?.variants?.["scaled-small"]?.url ||
    null
  );
}

function getListingImages(listing) {
  const rawImages = [
    ...(Array.isArray(listing?.images) ? listing.images : []),
    ...(Array.isArray(listing?.imageUrls) ? listing.imageUrls : []),
    listing?.imageUrl,
    listing?.image
  ];

  const images = rawImages.map(getImageUrl).filter(Boolean);

  return [...new Set(images)];
}

function cleanText(value) {
  return value ? String(value).trim() : "";
}

export default function ListingPage() {
  const router = useRouter();
  const { slug } = router.query;

  const [listings, setListings] = useState([]);
const [activeImage, setActiveImage] = useState(0);

const [lightboxOpen, setLightboxOpen] = useState(false);
const [lightboxIndex, setLightboxIndex] = useState(0);
  
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

  if (!listing) {
    return (
      <main className="loading">
        Loading listing...
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

  const images = getListingImages(listing);
  const heroImage = images[activeImage] || "/images/hero-equipment-yard.jpg";
  const mobilePairs = [];
  for (let i = 1; i < images.length; i += 2) {
  mobilePairs.push(images.slice(i, i + 2));
  }

  const title = cleanText(listing.title) || "Equipment Listing";
  const price = cleanText(listing.price) || "Call for Price";
  const hours = cleanText(listing.hours) || "Hours not listed";
  const location = cleanText(listing.location) || "Location not listed";
  const year = cleanText(listing.year) || title.match(/\b(19|20)\d{2}\b/)?.[0] || "—";
  const make = cleanText(listing.make) || "—";
  const model = cleanText(listing.model) || "—";
  const serial = cleanText(listing.serialNumber || listing.vin || listing.serial) || "Not listed";
  const sellerName = cleanText(listing.sellerName || listing.authorName) || "Private Seller";
  const sellerLocation = cleanText(listing.sellerLocation) || location;
  const description =
    cleanText(listing.description) ||
    cleanText(listing.publicData?.description) ||
    cleanText(listing.publicData?.details) ||
    "Seller description has not been added yet.";

  const highlights = [
    listing.publicData?.highlight1,
    listing.publicData?.highlight2,
    listing.publicData?.highlight3,
    listing.publicData?.highlight4
  ]
    .filter(Boolean)
    .map(cleanText);

  const displayHighlights =
    highlights.length > 0
      ? highlights
      : ["Clean presentation", "Work-ready machine", "Seller supplied listing", "Contact seller for details"];

function openLightbox(index) {
  setLightboxIndex(index);
  setLightboxOpen(true);
}

function closeLightbox() {
  setLightboxOpen(false);
}

function lightboxPrev() {
  setLightboxIndex((lightboxIndex - 1 + images.length) % images.length);
}

function lightboxNext() {
  setLightboxIndex((lightboxIndex + 1) % images.length);
}
  function goPrev() {
    if (images.length < 2) return;
    setActiveImage((activeImage - 1 + images.length) % images.length);
  }

  function goNext() {
    if (images.length < 2) return;
    setActiveImage((activeImage + 1) % images.length);
  }

  return (
    <>
      <Head>
        <title>{title} | IronXchange</title>

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
            <a href={`${STAGING}/l/new`} className="yellow-link">
              POST FREE
            </a>

            <a href={`${STAGING}/login`} className="login-icon" aria-label="Login">
              <i className="fa-regular fa-user"></i>
            </a>
          </div>
        </nav>

        <section className="page">
          <div className="title-row">
  <div>
                
    <h1>{title}</h1>

    <p>
      {hours} · {location}
    </p>
  </div>

      <div className="price">{price}</div>

          <div className="photo-grid">
            <div className="hero-wrap">
            <img
  src={heroImage}
  alt={title}
  className="hero-photo"
  onClick={() => openLightbox(activeImage)}
/>

              <button className="arrow left" onClick={goPrev} type="button">
                ‹
              </button>

              <button className="arrow right" onClick={goNext} type="button">
                ›
              </button>

             <div className="photo-toolbar left">
  <span>♡ Save</span>
  <span>↗ Share</span>
  <span>👁 Watch</span>
</div>

<div className="photo-toolbar right">
  <a href="/browse">← Results</a>
  <button>← Prev</button>
  <button>Next →</button>
</div>
    
            </div>

          <div className="photo-rail">
  {images.map((src, index) => (
    <img
      key={`${src}-${index}`}
      src={src}
      alt=""
      onClick={() => {
  setActiveImage(index);
  openLightbox(index);
}}
      className={index === activeImage ? "active-thumb" : ""}
    />
  ))}
</div>

<div className="mobile-gallery">
  <div className="mobile-hero">
    <img src={heroImage} alt={title} />
  </div>

  {mobilePairs.map((pair, pairIndex) => (
    <div className="mobile-pair" key={pairIndex}>
      {pair.map((src, index) => (
        <img
          key={`${src}-${pairIndex}-${index}`}
          src={src}
          alt=""
          onClick={() => {
  const imgIndex = pairIndex * 2 + index + 1;
  setActiveImage(imgIndex);
  openLightbox(imgIndex);
}}
        />
      ))}
    </div>
  ))}
</div>
</div>
          <section className="info-grid">
            <div className="panel">
              <h2>Quick Facts</h2>

              <div className="facts">
                <span>Year</span>
                <strong>{year}</strong>

                <span>Make</span>
                <strong>{make}</strong>

                <span>Model</span>
                <strong>{model}</strong>

                <span>Hours</span>
                <strong>{hours}</strong>

                <span>Serial #</span>
                <strong>{serial}</strong>

                <span>Location</span>
                <strong>{location}</strong>

                <span>Seller</span>
                <strong>{sellerName}</strong>
              </div>
            </div>

            <div className="panel">
              <h2>Highlights</h2>

              <ul className="highlights">
                {displayHighlights.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </section>

          <section className="panel description">
            <h2>Description</h2>

            <p>{description}</p>
          </section>

          <section className="panel seller-panel">
            <div>
              <h2>Contact Seller</h2>

              <div className="seller-row">
                <div className="seller-avatar">
                  <i className="fa-regular fa-user"></i>
                </div>

                <div>
                  <strong>{sellerName}</strong>
                  <p>{sellerLocation}</p>
                </div>
              </div>
            </div>

            <div className="seller-actions">
              <a href={`${STAGING}/login`} className="message-btn">
                Message Seller
              </a>

              <a href="tel:" className="call-btn">
                Call
              </a>
            </div>
          </section>
 </section>

{lightboxOpen && (
  <div className="lightbox">
    <button className="lightbox-close" onClick={closeLightbox}>
      ×
    </button>

    <button className="lightbox-arrow left" onClick={lightboxPrev}>
      ‹
    </button>

    <img
      src={images[lightboxIndex]}
      alt=""
      className="lightbox-image"
    />

    <button className="lightbox-arrow right" onClick={lightboxNext}>
      ›
    </button>
  </div>
)}
  
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
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 14px 5%;
          background: #050505;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
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
          letter-spacing: 0.6px;
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

        .page {
          padding: 28px 3%;
          max-width: 1500px;
          margin: 0 auto;
        }

        .title-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 24px;
          margin-bottom: 18px;
        }

        h1 {
          margin: 0;
          color: #f2f2f2;
          font-size: 30px;
          font-weight: 800;
          letter-spacing: -0.5px;
          line-height: 1.1;
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
          letter-spacing: -0.6px;
          white-space: nowrap;
        }

        .photo-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 300px;
          gap: 12px;
          margin-top: 18px;
        }

        .hero-wrap {
          position: relative;
          min-width: 0;
        }

        .hero-photo {
          width: 100%;
          height: 620px;
          object-fit: cover;
          display: block;
          border-radius: 14px;
          background: #111;
        }

     .photo-rail {
  height: 620px;
  overflow-y: auto;
  display: grid;
  grid-auto-rows: 146px;
  gap: 12px;
  padding-right: 2px;

  scrollbar-width: thin;
  scrollbar-color: rgba(255,255,255,.12) transparent;
}

        .photo-rail img {
          width: 100%;
          height: 146px;
          object-fit: cover;
          border-radius: 14px;
          cursor: pointer;
          opacity: 0.82;
          transition: opacity 0.15s ease, transform 0.15s ease;
        }

.photo-rail::-webkit-scrollbar {
  width: 6px;
}

.photo-rail::-webkit-scrollbar-track {
  background: transparent;
}

.photo-rail::-webkit-scrollbar-thumb {
  background: rgba(255,255,255,.12);
  border-radius: 999px;
}

.photo-rail::-webkit-scrollbar-thumb:hover {
  background: rgba(255,255,255,.22);
}
        .photo-rail img:hover,
        .photo-rail img.active-thumb {
          opacity: 1;
          transform: translateY(-1px);
        }

        .photo-toolbar {
  position: absolute;
  bottom: 20px;
  display: flex;
  gap: 18px;
  background: rgba(0, 0, 0, 0.62);
  backdrop-filter: blur(8px);
  padding: 12px 16px;
  border-radius: 10px;
  color: #E5E5E5;
  font-size: 14px;
}

.photo-toolbar.left {
  left: 20px;
}

.photo-toolbar.right {
  right: 20px;
}

.photo-toolbar a,
.photo-toolbar button,
.photo-toolbar span {
  background: none;
  border: none;
  padding: 0;
  margin: 0;
  color: #E5E5E5;
  text-decoration: none;
  cursor: pointer;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: .4px;
  text-transform: uppercase;
}

.photo-toolbar a:hover,
.photo-toolbar button:hover {
  opacity: .75;
}

        .arrow {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 42px;
          height: 42px;
          border-radius: 50%;
          border: 1px solid rgba(255, 255, 255, 0.28);
          background: rgba(0, 0, 0, 0.42);
          color: #f2f2f2;
          font-size: 32px;
          line-height: 1;
          cursor: pointer;
        }

        .arrow.left {
          left: 18px;
        }

        .arrow.right {
          right: 18px;
        }

        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-top: 22px;
        }

        .panel {
          background: #151515;
          border: 1px solid #282828;
          border-radius: 16px;
          padding: 24px;
        }

        .panel h2 {
          margin: 0 0 18px;
          color: #f2f2f2;
          font-size: 18px;
          text-transform: uppercase;
          letter-spacing: 0.4px;
        }

        .facts {
          display: grid;
          grid-template-columns: 130px 1fr;
          row-gap: 12px;
          column-gap: 24px;
          font-size: 15px;
        }

        .facts span {
          color: #9a9a9a;
        }

        .facts strong {
          color: #e5e5e5;
          font-weight: 500;
        }

        .highlights {
          margin: 0;
          padding: 0;
          list-style: none;
          display: grid;
          gap: 14px;
          font-size: 15px;
        }

        .highlights li::before {
          content: "✓";
          color: ${BRAND_YELLOW};
          margin-right: 12px;
          font-weight: 900;
        }

        .description {
          margin-top: 16px;
        }

        .description p {
          color: #d0d0d0;
          line-height: 1.7;
          font-size: 16px;
          margin: 0;
          max-width: 1100px;
        }

        .seller-panel {
          margin-top: 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 24px;
        }

        .seller-row {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .seller-avatar {
          width: 58px;
          height: 58px;
          border-radius: 50%;
          border: 1px solid #777;
          display: grid;
          place-items: center;
          font-size: 28px;
          color: #ddd;
        }

        .seller-row strong {
          color: #f2f2f2;
          font-size: 16px;
        }

        .seller-row p {
          margin: 5px 0 0;
          color: #aaa;
        }

        .seller-actions {
          display: flex;
          gap: 16px;
          min-width: 430px;
        }

        .message-btn,
        .call-btn {
          flex: 1;
          text-align: center;
          text-decoration: none;
          text-transform: uppercase;
          font-weight: 900;
          border-radius: 10px;
          padding: 18px 20px;
          font-size: 13px;
          letter-spacing: 0.3px;
        }

        .message-btn {
          background: ${BRAND_YELLOW};
          color: #050505;
        }

        .call-btn {
          border: 1px solid #3a3a3a;
          color: #e5e5e5;
        }

.lightbox {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.94);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.lightbox-image {
  max-width: 94vw;
  max-height: 92vh;
  object-fit: contain;
}

.lightbox-close {
  position: absolute;
  top: 22px;
  right: 22px;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  border: none;
  background: rgba(255,255,255,.12);
  color: white;
  font-size: 30px;
  cursor: pointer;
}

.lightbox-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 54px;
  height: 54px;
  border-radius: 50%;
  border: none;
  background: rgba(255,255,255,.12);
  color: white;
  font-size: 40px;
  cursor: pointer;
}

.lightbox-arrow.left {
  left: 24px;
}

.lightbox-arrow.right {
  right: 24px;
}
.mobile-gallery {
  display: none;
}

        @media (max-width: 950px) {
        .photo-grid {
  display: block;
}

.hero-wrap,
.photo-rail {
  display: none;
}

.mobile-gallery {
  display: flex;
  overflow-x: auto;
  gap: 10px;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
  padding-bottom: 10px;
}

.mobile-hero {
  min-width: 92%;
  height: 250px;
  scroll-snap-align: start;
  background: #111;
  border-radius: 14px;
  overflow: hidden;
}

.mobile-hero img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.mobile-pair {
  min-width: 18vw;
  height: 250px;
  display: grid;
  grid-template-rows: 1fr 1fr;
  gap: 8px;
  scroll-snap-align: start;
}

.mobile-pair img {
  width: 100%;
  height: 121px;
  object-fit: cover;
  border-radius: 12px;
}
          .info-grid {
            grid-template-columns: 1fr;
          }

          .seller-panel {
            align-items: stretch;
            flex-direction: column;
          }

          .seller-actions {
            min-width: 0;
            width: 100%;
          }
        }

        @media (max-width: 850px) {
          .logo-img {
            height: 56px;
          }

          .nav-links {
            gap: 18px;
          }

          .yellow-link {
            font-size: 12px !important;
          }

          .login-icon {
            width: 28px;
            height: 28px;
          }

          .page {
            padding: 22px 4%;
          }

          .title-row {
            flex-direction: column;
            gap: 8px;
          }

          h1 {
            font-size: 24px;
          }

          .price {
            font-size: 25px;
          }

          .photo-actions {
            left: 12px;
            bottom: 12px;
            gap: 12px;
            font-size: 12px;
            padding: 10px 12px;
          }

          .arrow {
  width: 34px;
  height: 34px;
  font-size: 26px;
  background: rgba(0,0,0,.45);
}

          .panel {
            padding: 20px;
          }

          .facts {
            grid-template-columns: 110px 1fr;
            font-size: 14px;
          }

          .seller-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </>
  );
}
