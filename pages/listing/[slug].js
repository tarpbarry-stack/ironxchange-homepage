import Head from "next/head";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import featureKeywords from "../../lib/featureKeywords";

import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

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

function getSellerLogoUrl(listing = {}) {
  const image =
    listing.sellerLogo ||
    listing.sellerImage ||
    listing.authorImage ||
    listing.author?.profileImage ||
    listing.author?.attributes?.profileImage;

  if (typeof image === "string") return image;

  const variants = image?.attributes?.variants || image?.variants || {};

  const nonSquareVariant = Object.entries(variants).find(([key, value]) => {
    return value?.url && !key.toLowerCase().includes("square");
  });

  return (
    variants.default?.url ||
    variants["landscape-crop"]?.url ||
    variants["landscape-crop2x"]?.url ||
    variants["scaled-large"]?.url ||
    variants["scaled-medium"]?.url ||
    variants["scaled-small"]?.url ||
    nonSquareVariant?.[1]?.url ||
    Object.values(variants).find(v => v?.url)?.url ||
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

function inferHighlightsFromDescription(listing = {}) {
  const text = [
    listing.description,
    listing.publicData?.description,
    listing.publicData?.details
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const matches = featureKeywords
    .filter(feature =>
      feature.match.some(term => text.includes(term))
    )
    .map(feature => feature.label);

  return [...new Set(matches)];
}

function cleanMachineTitle(title = "") {
  return String(title)
    .replace(/\s*[-–]\s*\d{1,3}(,\d{3})*\s*(HRS|Hrs|Hours)?/i, "")
    .trim();
}

export default function ListingPage() {
  const router = useRouter();
  const { slug, from } = router.query;

const [listings, setListings] = useState([]);
const [activeImage, setActiveImage] = useState(0);

const [lightboxOpen, setLightboxOpen] = useState(false);
const [lightboxIndex, setLightboxIndex] = useState(0);

const [isSaved, setIsSaved] = useState(false);
const [loggedIn, setLoggedIn] = useState(false);

useEffect(() => {
  if (!slug) return;

  const saved = JSON.parse(
    localStorage.getItem("ironxchangeSaved") || "[]"
  );

  setIsSaved(saved.includes(slug));
}, [slug]);

function toggleSaved() {
  const saved = JSON.parse(
    localStorage.getItem("ironxchangeSaved") || "[]"
  );

  const updated = saved.includes(slug)
    ? saved.filter((item) => item !== slug)
    : [...saved, slug];

  localStorage.setItem(
    "ironxchangeSaved",
    JSON.stringify(updated)
  );

  setIsSaved(updated.includes(slug));
}  
  
  useEffect(() => {
    fetch("/api/listings")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setListings(data);
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

  const listing = useMemo(() => {
    if (!slug || listings.length === 0) return null;
    return listings.find((item) => slugify(item.title) === slug);
  }, [slug, listings]);

  const currentIndex = useMemo(() => {
  if (!slug || listings.length === 0) return -1;
  return listings.findIndex((item) => slugify(item.title) === slug);
}, [slug, listings]);

const prevListing =
  currentIndex > 0 ? listings[currentIndex - 1] : null;

const nextListing =
  currentIndex >= 0 && currentIndex < listings.length - 1
    ? listings[currentIndex + 1]
    : null;

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

 const rawTitle =
  cleanText(listing.title) ||
  "Equipment Listing";

const title =
  rawTitle
    .replace(/\s*[-–]?\s*\d{1,3}(,\d{3})*\s*(HRS|Hrs|hrs|Hours|hours)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
  const price = cleanText(listing.price) || "Call for Price";
  const hours = cleanText(listing.hours) || "Hours not listed";
  const location = cleanText(listing.location) || "Location not listed";
  const cameFromBrowse = from === "browser";  
  const year = cleanText(listing.year) || title.match(/\b(19|20)\d{2}\b/)?.[0] || "—";
  const make = cleanText(listing.make) || "—";
  const model = cleanText(listing.model) || "—";
  const serial = cleanText(listing.serialNumber || listing.publicData?.serialNumber || listing.vin || listing.serial) || "Not listed";
  const stockNumber = cleanText(listing.stockNumber || listing.publicData?.stockNumber) || "Not listed";
  const sellerProfile =
  listing.author?.profile ||
  listing.author?.attributes?.profile ||
  {};

const sellerPublicData =
  sellerProfile.publicData || {};

const sellerName =
  cleanText(
    listing.sellerName ||
    sellerPublicData.sellerName ||
    sellerProfile.displayName ||
    listing.authorName
  ) || "IronXchange Seller";

const sellerCompanyName =
  cleanText(
    listing.sellerCompany ||
    listing.companyName ||
    sellerPublicData.companyName ||
    sellerProfile.abbreviatedName
  ) || "";

const sellerLocation =
  cleanText(
    listing.sellerLocation ||
    listing.authorLocation ||
    listing.author?.profile?.publicData?.location ||
    listing.author?.attributes?.profile?.publicData?.location
  ) || location;

const sellerImageVariants =
  listing.author?.attributes?.profileImage?.attributes?.variants ||
  listing.author?.profileImage?.attributes?.variants ||
  {};

const sellerLogo =
  listing.sellerLogo ||
  listing.sellerImage ||
  listing.authorImage ||
  sellerImageVariants.default?.url ||
  sellerImageVariants["landscape-crop"]?.url ||
  sellerImageVariants["landscape-crop2x"]?.url ||
  sellerImageVariants["scaled-large"]?.url ||
  sellerImageVariants["scaled-medium"]?.url ||
  sellerImageVariants["scaled-small"]?.url ||
  Object.values(sellerImageVariants).find(v => v?.url)?.url ||
  null;
  const description =
    cleanText(listing.description) ||
    cleanText(listing.publicData?.description) ||
    cleanText(listing.publicData?.details) ||
    "Seller description has not been added yet.";

 const selectedHighlights = [
  ...(Array.isArray(listing.keywords) ? listing.keywords : []),
  ...(Array.isArray(listing.publicData?.keywords) ? listing.publicData.keywords : []),
  ...(Array.isArray(listing.attributes?.publicData?.keywords)
    ? listing.attributes.publicData.keywords
    : [])
]
  .filter(Boolean)
  .map(cleanText);

const inferredHighlights = inferHighlightsFromDescription(listing);

const displayHighlights =
  selectedHighlights.length > 0
    ? selectedHighlights.slice(0, 12)
    : inferredHighlights.slice(0, 12);

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
       <Navbar />

        <section className="page">
                {cameFromBrowse && (
  <button
    type="button"
    className="back-results"
    onClick={() => router.back()}
  >
    ← Back to Results
  </button>
)}
          <div className="title-row">
  <div>
                
  <h1>
  {title}

  <span className="title-hours">
    {hours}
  </span>
</h1>

    <p>
      {hours} · {location}
    </p>
  </div>

   <div className="price">{price}</div>
</div>

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
          <div className="panel facts-highlights-panel">
  <div className="facts-column">
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

      <span>Stock #</span>
      <strong>{stockNumber}</strong>

      <span>Location</span>
      <strong>{location}</strong>

      <span>Seller</span>
      <strong>{sellerName}</strong>
    </div>
  </div>

  <div className="highlights-column">
    <h2>Highlights</h2>

    <div className="highlight-chips">
      {displayHighlights.map((item) => (
        <span key={item}>{String(item).toLowerCase()}</span>
      ))}
    </div>
  </div>
</div>

          <div className="right-stack">
  <div className="mini-tool-tab">
    <button
      type="button"
      onClick={() => {
        const url = window.location.href;

        if (navigator.share) {
          navigator.share({ title, url });
        } else {
          navigator.clipboard.writeText(url);
          alert("Listing link copied");
        }
      }}
    >
      <i className="fa-solid fa-arrow-up-from-bracket"></i>
    </button>

    <button
      type="button"
      className={isSaved ? "saved-star" : ""}
      onClick={toggleSaved}
    >
      <i className={isSaved ? "fa-solid fa-star" : "fa-regular fa-star"}></i>
    </button>

    <a href="/browse">← Results</a>

    {prevListing ? (
      <a href={`/listing/${slugify(prevListing.title)}?from=browser`}>
        ← Prev
      </a>
    ) : (
      <button disabled>← Prev</button>
    )}

    {nextListing ? (
      <a href={`/listing/${slugify(nextListing.title)}?from=browser`}>
        Next →
      </a>
    ) : (
      <button disabled>Next →</button>
    )}
  </div>

  <div className="panel video-panel">
    <h2>Machine Video</h2>

    <div className="video-box">
      <video controls poster={heroImage}>
        <source src={listing.videoUrl || listing.publicData?.videoUrl || ""} />
      </video>

      {!listing.videoUrl && !listing.publicData?.videoUrl ? (
        <div className="video-placeholder">
          <i className="fa-solid fa-play"></i>
          <span>Video Coming Soon</span>
        </div>
      ) : null}
    </div>
  </div>
</div>
          </section>

          <section className="panel description">
            <h2>Description</h2>

            <p>{description}</p>
          </section>

          <section className="panel seller-panel">
            <div>
            <span className="seller-eyebrow">IronXchange Seller</span>
                      <h2>Contact Seller</h2>

              <div className="seller-row">
               <div className="seller-avatar">
  {sellerLogo ? (
    <img src={sellerLogo} alt={sellerName} />
  ) : (
    <i className="fa-regular fa-user"></i>
  )}
</div>

                <div>
                  <strong>{sellerName}</strong>
                  <p>{sellerCompanyName}</p>
                  <p>{sellerLocation}</p>
                </div>
              </div>
            </div>

           <div className="seller-actions">
  <a
    href={
      loggedIn
        ? `/inquire?listingId=${listing.id}`
        : `/login?next=${encodeURIComponent(`/inquire?listingId=${listing.id}`)}`
    }
    className="message-btn"
  >
    Message Seller
  </a>

  <a
    href={`/yard/${listing.authorId}`}
    className="yard-btn"
  >
    View Seller Yard
  </a>

  <button type="button" className="call-btn">
    Call
  </button>
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

  <Footer />
  
      <style jsx>{`
        :global(body) {
          margin: 0;
          background: #0b0b0b;
          color: #d6d6d6;
          font-family: Arial, sans-serif;
        }
        
        body {
  line-height: 1.35;
}
      * {
  box-sizing: border-box;

  scrollbar-width: thin;
  scrollbar-color: rgba(255,255,255,.10) transparent;
}

*::-webkit-scrollbar {
  width: 7px;
  height: 7px;
}

*::-webkit-scrollbar-track {
  background: transparent;
}

*::-webkit-scrollbar-thumb {
  background: rgba(255,255,255,.10);
  border-radius: 999px;
}

*::-webkit-scrollbar-thumb:hover {
  background: rgba(255,196,0,.22);
}
        main {
  min-height: 100vh;

  background:
    radial-gradient(
      circle at top,
      rgba(255,196,0,.025),
      transparent 26%
    ),
    #0b0b0b;
}

button:focus-visible,
a:focus-visible {
  outline: 1px solid rgba(255,196,0,.42);
  outline-offset: 3px;
}

        .page {
   padding: 18px 3% 54px;

  max-width: 1500px;
  margin: 0 auto;
}

.back-results {
  height: 28px;

  display: inline-flex;
  align-items: center;

  background: transparent;
  border: none;
  padding: 0;
  margin: 0 0 10px;

  color: rgba(255,255,255,.40);

  font-size: 10px;
  font-weight: 900;
  letter-spacing: .65px;
  text-transform: uppercase;

  cursor: pointer;
  font-family: inherit;
}

.back-results:hover {
  color: #FFC400;
}

.title-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: baseline;

  gap: 18px;

  margin: 0 0 6px;
  padding: 0;
}

.title-row::after {
  content: "";

  grid-column: 1 / -1;

  height: 1px;

  background:
    linear-gradient(
      90deg,
      rgba(255,255,255,.08),
      rgba(255,255,255,.02)
    );

  margin-top: 4px;
}

.title-row > div:first-child {
  min-width: 0;
}

h1 {
  margin: 0;

  color: #f2f2f2;

  font-size: clamp(30px, 2.55vw, 42px);
  font-weight: 950;

  letter-spacing: -1.15px;
  line-height: .92;

  text-transform: uppercase;

  display: flex;
  align-items: baseline;
}

.title-hours {
  margin-left: 12px;

  color: rgba(255,255,255,.42);

  font-size: .62em;
  font-weight: 700;

  letter-spacing: -.2px;

  white-space: nowrap;

  display: inline-block;
  transform: translateX(32px);
}


.title-row p {
  display: none;
}

.price {
  color: #f2f2f2;

  font-size: clamp(24px, 2vw, 34px);
  font-weight: 900;

  letter-spacing: -.7px;
  line-height: 1;

  white-space: nowrap;
}

        .photo-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 300px;
  gap: 12px;

  margin-top: 8px;
  margin-bottom: 0;
}

       .hero-wrap {
  position: relative;
  min-width: 0;

  border-radius: 14px;

  overflow: hidden;

  background: #111;
}

.hero-wrap::after {
  content: "";

  position: absolute;
  inset: 0;

  pointer-events: none;

  border-radius: 14px;

  box-shadow:
    inset 0 0 0 1px rgba(255,255,255,.035),
    inset 0 -60px 90px rgba(0,0,0,.10);
}

       .hero-photo {
  width: 100%;
  height: 584px;

  object-fit: cover;
  display: block;

  border-radius: 14px;

  background: #111;

  border: 1px solid rgba(255,255,255,.055);

  box-shadow:
    0 1px 0 rgba(255,255,255,.035) inset,
    0 24px 60px rgba(0,0,0,.26);

  transition:
    transform .22s ease,
    filter .22s ease;
}

.hero-photo:hover {
  transform: scale(1.003);

  filter:
    contrast(1.03)
    saturate(1.02)
    brightness(1.01);
}

    .photo-rail {
  height: 584px;
  overflow-y: auto;

  display: grid;
  grid-auto-rows: 137px;
  gap: 12px;

  padding-right: 2px;

  scrollbar-width: thin;
  scrollbar-color: rgba(255,255,255,.12) transparent;
}

       .photo-rail img {
  width: 100%;
  height: 146px;

  object-fit: cover;

  border-radius: 12px;

  border: 1px solid rgba(255,255,255,.05);

  cursor: pointer;

  opacity: 0.72;

  transition:
    opacity .16s ease,
    transform .16s ease,
    border-color .16s ease,
    box-shadow .16s ease;
}

.photo-rail img:hover,
.photo-rail img.active-thumb {
  opacity: 1;

  transform: translateY(-1px);

  border-color: rgba(255,196,0,.18);

  box-shadow:
    0 10px 24px rgba(0,0,0,.18);
}

       .photo-rail img:hover,
.photo-rail img.active-thumb {
  opacity: 1;

  transform: translateY(-1px);

  border-color: rgba(255,196,0,.22);

  box-shadow:
    0 1px 0 rgba(255,255,255,.035) inset,
    0 10px 24px rgba(0,0,0,.24);
}

.photo-rail img.active-thumb {
  outline: 1px solid rgba(255,196,0,.18);
  outline-offset: -3px;
}

     .photo-toolbar {
  position: absolute;
  bottom: 10px;

  display: flex;
  align-items: center;
  gap: 14px;

  background: rgba(0, 0, 0, 0.38);
  backdrop-filter: blur(6px);

  padding: 8px 12px;
  border-radius: 9px;

  color: rgba(255,255,255,.82);
}

.photo-toolbar.left {
  left: 10px;
}

.photo-toolbar.right {
  right: 10px;
}

.photo-toolbar a,
.photo-toolbar button,
.photo-toolbar span {
  background: none;
  border: none;
  padding: 0;
  margin: 0;

  color: rgba(255,255,255,.82);

  text-decoration: none;
  cursor: pointer;

  font-size: 10px;
  font-weight: 700;
  letter-spacing: .45px;
  text-transform: uppercase;

  line-height: 1;
  font-family: inherit;
}

.photo-toolbar a:hover,
.photo-toolbar button:hover {
  opacity: .72;
}

        .arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);

  width: 34px;
  height: 88px;

  border: none;

  background: rgba(0,0,0,.10);

  color: rgba(255,255,255,.46);

  font-size: 34px;
  font-weight: 300;

  line-height: 1;

  cursor: pointer;

  transition:
    background .16s ease,
    color .16s ease;
}

.arrow:hover {
  background: rgba(0,0,0,.22);
  color: rgba(255,255,255,.82);
}

.arrow.left {
  left: 0;
  border-radius: 0 14px 14px 0;
}

.arrow.right {
  right: 0;
  border-radius: 14px 0 0 14px;
}

    .info-grid {
  display: grid;
  grid-template-columns: minmax(0, 640px) minmax(0, 1fr);
  gap: 14px;
  margin-top: 14px;
  align-items: stretch;
}

.right-stack {
  display: grid;
  grid-template-rows: 38px auto;
  gap: 10px;

  height: 100%;
  min-width: 0;
}

.mini-tool-tab {
  height: 38px;

  padding: 0 14px;

  display: flex;
  align-items: center;
  justify-content: space-between;

  background:
    linear-gradient(180deg, rgba(255,255,255,.022), rgba(255,255,255,0)),
    #111;

  border: 1px solid rgba(255,255,255,.06);
  border-radius: 12px;

  box-shadow:
    0 1px 0 rgba(255,255,255,.03) inset;
}

.mini-tool-tab button:first-child {
  margin-left: 18px;
}

.mini-tool-tab button:nth-child(2),
.mini-tool-tab {
  height: 38px;

  padding: 0 14px;

  display: flex;
  align-items: center;
  justify-content: space-between;

  background:
    linear-gradient(180deg, rgba(255,255,255,.022), rgba(255,255,255,0)),
    #111;

  border: 1px solid rgba(255,255,255,.06);
  border-radius: 12px;

  box-shadow:
    0 1px 0 rgba(255,255,255,.03) inset;
}

.mini-tool-tab a:hover,
.mini-tool-tab button:hover {
  color: #FFC400;
  transform: translateY(-1px);
}

.mini-tool-tab button:nth-child(4),
.mini-tool-tab button:nth-child(5) {
  transform: translateX(-24px);
}

.mini-tool-tab i {
  font-size: 11px;
}

.right-stack .panel {
  height: 100%;
}

      .panel {
 background:
  linear-gradient(
    180deg,
    rgba(255,255,255,.022),
    rgba(255,255,255,0)
  ),
  radial-gradient(
    circle at top,
    rgba(255,255,255,.012),
    transparent 68%
  ),
  #101010;

  border: 1px solid rgba(255,255,255,.065);
  outline: 1px solid rgba(255,255,255,.018);

  border-radius: 14px;

 padding: 18px 20px;

  box-shadow:
    0 1px 0 rgba(255,255,255,.03) inset,
   0 14px 34px rgba(0,0,0,.18)
   }

.panel {
  transition:
    border-color .16s ease,
    box-shadow .16s ease,
    background .16s ease;
}

.panel:hover {
  border-color: rgba(255,255,255,.085);

  box-shadow:
    0 1px 0 rgba(255,255,255,.035) inset,
   0 18px 40px rgba(0,0,0,.22)
}

.panel + .panel,
.panel + section {
  margin-top: 14px;
}

.panel h2 {
  margin: 0 0 14px;

  color: rgba(255,255,255,.82);

  font-size: 12px;
  font-weight: 900;

  letter-spacing: .68px;
  text-transform: uppercase;
}

     .video-panel {
  min-height: 100%;
 padding: 18px 20px;
}

.video-panel h2 {
  margin: 0 0 12px;

  color: rgba(255,255,255,.82);

  font-size: 12px;
  font-weight: 900;
  letter-spacing: .65px;
  text-transform: uppercase;
  text-align: center;
}

.video-box {
  position: relative;

  height: 210px;
  max-height: 210px;

  overflow: hidden;

  border: 1px solid rgba(255,255,255,.055);
  border-radius: 14px;

  background:
    linear-gradient(180deg, rgba(255,255,255,.018), rgba(255,255,255,0)),
    #050505;

  box-shadow:
    0 1px 0 rgba(255,255,255,.025) inset,
    0 14px 34px rgba(0,0,0,.18);
}

.video-box video {
  width: 100%;
  height: 100%;

  object-fit: cover;
  display: block;
}

.video-placeholder {
  position: absolute;
  inset: 0;

  display: grid;
  place-items: center;

  color: rgba(255,255,255,.46);

  font-size: 9.5px;
  font-weight: 900;

  letter-spacing: .58px;
  text-transform: uppercase;
}

.video-placeholder i {
  width: 44px;
  height: 44px;

  display: grid;
  place-items: center;

  margin-bottom: 8px;

  border-radius: 50%;

  color: rgba(255,196,0,.82);

  border: 1px solid rgba(255,196,0,.26);

  background:
    linear-gradient(180deg, rgba(255,196,0,.10), rgba(255,196,0,0)),
    #151515;

  box-shadow:
    0 0 18px rgba(255,196,0,.08);
}

.facts-highlights-panel {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0;
  align-items: start;

  border-radius: 14px;

  padding: 20px 22px;
}

.facts-column {
  position: relative;
  padding-right: 22px;
}

.facts-column::after {
  content: "";

  position: absolute;
  top: 4px;
  right: 0;

  width: 1px;
  height: calc(100% - 8px);

  background: rgba(255,255,255,.09);
}

.highlights-column {
  padding-left: 22px;
}

.facts-column h2,
.highlights-column h2 {
  text-align: left;
}

.facts {
  display: grid;
  grid-template-columns: 82px 1fr;
  column-gap: 12px;
  row-gap: 9px;
  align-items: baseline;
}

.facts span {
  color: rgba(255,255,255,.36);

  font-size: 9.5px;
  font-weight: 900;

  letter-spacing: .58px;
  text-transform: uppercase;
}

.facts strong {
  min-width: 0;

  color: rgba(255,255,255,.74);

  font-size: 12.5px;
  font-weight: 750;

  line-height: 1.16;

  overflow-wrap: anywhere;
}

.highlight-chips {
  display: flex;
  flex-wrap: wrap;

  justify-content: center;
  align-content: flex-start;

  gap: 6px;

  max-height: 118px;
  overflow: hidden;
}

.highlight-chips span {
  min-height: 22px;

  padding: 4px 7px;

  display: inline-flex;
  align-items: center;
  justify-content: center;

  border: 1px solid rgba(255,255,255,.055);
  border-radius: 999px;

  background: rgba(255,255,255,.022);

  color: rgba(255,255,255,.42);

  font-size: 9px;
  font-weight: 850;

  letter-spacing: .14px;
  line-height: 1;

  text-transform: lowercase;
}

        .highlights li::before {
          content: "✓";
          color: ${BRAND_YELLOW};
          margin-right: 12px;
          font-weight: 900;
        }

        .description {
 padding: 18px 20px;
}

.description h2 {
  margin: 0 0 14px;

  color: rgba(255,255,255,.84);

  font-size: 12px;
  font-weight: 900;
  letter-spacing: .65px;
  text-transform: uppercase;
}

.description p {
  margin: 0;

  max-width: 1180px;

  color: rgba(255,255,255,.68);

  font-size: 14px;
  font-weight: 500;
  line-height: 1.58;
  letter-spacing: .05px;
}

       .seller-panel {

  padding: 18px 20px;

  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 22px;

  border-radius: 14px;
}

       .seller-row {
  display: flex;
  align-items: center;
  gap: 16px;
}

     .seller-avatar {
  width: 180px;
  height: 92px;

  border: 1px solid rgba(255,255,255,.08);
  border-radius: 12px;

  background: #050505;

  display: flex;
  align-items: center;
  justify-content: center;

  overflow: hidden;

  padding: 8px;

  flex: 0 0 180px;

  box-shadow:
    0 1px 0 rgba(255,255,255,.025) inset;
}

.seller-avatar img {
 max-width: 105%;
max-height: none;
  object-fit: contain;
  object-position: center center;
  display: block;
  border-radius: 0;
  transform: translateY(0px);
}

      .seller-row strong {
  display: block;

  color: #f2f2f2;

  font-size: 17px;
  font-weight: 900;

  letter-spacing: -.28px;
}

.seller-row p {
  margin: 5px 0 0;

  color: rgba(255,255,255,.44);

  font-size: 10px;
  font-weight: 900;

  letter-spacing: .48px;
  text-transform: uppercase;
}

        .seller-actions {
          display: flex;
          gap: 16px;
          min-width: 430px;
        }

       .message-btn,
.yard-btn,
.call-btn {
  height: 38px;

  display: inline-flex;
  align-items: center;
  justify-content: center;

  padding: 0 16px;

  background: #101010;

  border: 1px solid #2A2A2A;
  border-radius: 12px;

  color: #EAEAEA;

  text-decoration: none;

  font-size: 10px;
  font-weight: 900;

  letter-spacing: .55px;
  text-transform: uppercase;

  transition:
    border-color .15s ease,
    background .15s ease,
    color .15s ease,
    transform .15s ease;
}

.message-btn {
  background:
    linear-gradient(180deg, rgba(255,196,0,.10), rgba(255,196,0,0)),
    #151515;

  border-color: rgba(255,196,0,.24);

  color: #FFC400;
}

.message-btn:hover,
.yard-btn:hover,
.call-btn:hover {
  transform: translateY(-1px);

  border-color: #FFC400;
  color: #FFC400;

  background: #161616;
}

.seller-eyebrow {
  display: block;

  margin-bottom: 6px;

  color: #FFC400;

  font-size: 9px;
  font-weight: 900;

  letter-spacing: .65px;
  text-transform: uppercase;
}

.seller-panel h2 {
  margin: 0 0 14px;

  color: #f2f2f2;

  font-size: 18px;
  font-weight: 900;

  letter-spacing: -.25px;
  text-transform: uppercase;
}

.lightbox {
  position: fixed;
  inset: 0;

  z-index: 9999;

  display: flex;
  align-items: center;
  justify-content: center;

  background: rgba(0,0,0,.94);
  backdrop-filter: blur(3px);
}

.lightbox-image {
  max-width: 94vw;
  max-height: 92vh;

  object-fit: contain;

  border-radius: 12px;

  box-shadow:
    0 1px 0 rgba(255,255,255,.04) inset,
    0 28px 80px rgba(0,0,0,.55);
}

.lightbox-close {
  position: absolute;
  top: 22px;
  right: 22px;

  width: 38px;
  height: 38px;

  border: 1px solid rgba(255,255,255,.08);
  border-radius: 50%;

  background: rgba(20,20,20,.82);
  color: rgba(255,255,255,.72);

  font-size: 26px;
  cursor: pointer;
}

.lightbox-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);

  width: 42px;
  height: 92px;

  border: 1px solid rgba(255,255,255,.06);
  border-radius: 12px;

  background: rgba(20,20,20,.62);
  color: rgba(255,255,255,.58);

  font-size: 38px;
  font-weight: 300;

  cursor: pointer;
}

.lightbox-close:hover,
.lightbox-arrow:hover {
  color: #FFC400;
  border-color: rgba(255,196,0,.24);
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
  min-width: 82%;
  height: 340px;
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
  min-width: 44vw;
  height: 340px;
  display: grid;
  grid-template-rows: 1fr 1fr;
  gap: 10px;
  scroll-snap-align: start;
}

.mobile-pair img {
  width: 100%;
  height: 165px;
  object-fit: cover;
  border-radius: 14px;
}
          .info-grid {
  grid-template-columns: 1fr;
  gap: 12px;
  margin-top: 14px;
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
            height: 34px;
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
  padding: 16px 4% 40px;
}

          .title-row {
  grid-template-columns: 1fr;
  align-items: start;
  padding: 16px;
}

          h1 {
            font-size: 24px;
          }

          .price {
  width: fit-content;
  min-width: 0;
  height: 44px;
  font-size: 18px;
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

.facts-highlights-panel {
  grid-template-columns: 1fr;
}

.facts-column {
  padding-right: 0;
  border-right: none;
  border-bottom: 1px solid rgba(255,255,255,.10);
  padding-bottom: 18px;
}

.facts-column::after {
  display: none;
}

.highlights-column {
  padding-left: 0;
  padding-top: 4px;
}

.facts {
  grid-template-columns: 92px 1fr;
}

.seller-panel {
  display: grid;
  align-items: stretch;
}

.seller-row {
  align-items: flex-start;
}
          .panel {
            padding: 20px;
          }

          .seller-actions {
  width: 100%;
  flex-direction: column;
}

.message-btn,
.yard-btn,
.call-btn {
  width: 100%;
}
        }
      `}</style>
    </>
  );
}
