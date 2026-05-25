import Head from "next/head";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import featureKeywords from "../../lib/featureKeywords";
import { getListingId } from "../../lib/listingFormatters";

import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

import {
  fetchCurrentUserWithSavedListings,
  getSavedListingIdsFromUser,
  toggleSavedListing
} from "../../lib/savedListings";

const BRAND_YELLOW = "#FFC400";

function slugify(text = "") {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function cleanText(value) {
  return value ? String(value).trim() : "";
}

function getImageUrl(img) {
  if (!img) return null;
  if (typeof img === "string") return img;

  return (
    img.url ||
    img.src ||
    img.attributes?.variants?.default?.url ||
    img.attributes?.variants?.["landscape-crop"]?.url ||
    img.attributes?.variants?.["landscape-crop2x"]?.url ||
    img.attributes?.variants?.["scaled-large"]?.url ||
    img.attributes?.variants?.["scaled-medium"]?.url ||
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

function cleanMachineTitle(title = "") {
  return String(title)
    .replace(/\s*[-–]?\s*\d{1,3}(,\d{3})*\s*(HRS|Hrs|hrs|Hours|hours)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
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
    .filter(feature => feature.match.some(term => text.includes(term)))
    .map(feature => feature.label);

  return [...new Set(matches)];
}

function buildBuyerShareCopy(listing, listingUrl, title, price, hours, location, highlights = []) {
  const featureLine = highlights.slice(0, 6).join(" • ");
  const description =
    cleanText(listing.description) ||
    cleanText(listing.publicData?.description) ||
    cleanText(listing.publicData?.details) ||
    "Full specs and photos available on IronXchange.";

  return `${title}
${hours} | ${location}
${price}

${featureLine}

${description}

Full specs + photos:
${listingUrl}`;
}

export default function ListingPage() {
  const router = useRouter();
  const { slug, from } = router.query;

  const [listings, setListings] = useState([]);
  const [savedIds, setSavedIds] = useState([]);
  const [saveBusy, setSaveBusy] = useState(false);
  const [sdkInstance, setSdkInstance] = useState(null);
  const [activeImage, setActiveImage] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [loggedIn, setLoggedIn] = useState(false);
  const [copied, setCopied] = useState("");

  useEffect(() => {
    async function loadPage() {
      try {
        const SharetribeSdk = await import("sharetribe-flex-sdk");

        const sdk = SharetribeSdk.createInstance({
          clientId: process.env.NEXT_PUBLIC_SHARETRIBE_CLIENT_ID
        });

        setSdkInstance(sdk);

        try {
          const currentUser = await fetchCurrentUserWithSavedListings(sdk);
          setSavedIds(getSavedListingIdsFromUser(currentUser));
        } catch {
          setSavedIds([]);
        }

        const res = await fetch("/api/listings");
        const data = await res.json();

        if (Array.isArray(data)) {
          setListings(data);
        }
      } catch (err) {
        console.error("Listing page load failed:", err);
      }
    }

    loadPage();
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
    return listings.find(item => slugify(item.title) === slug);
  }, [slug, listings]);

  const currentIndex = useMemo(() => {
    if (!slug || listings.length === 0) return -1;
    return listings.findIndex(item => slugify(item.title) === slug);
  }, [slug, listings]);

  const prevListing = currentIndex > 0 ? listings[currentIndex - 1] : null;

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

  const rawTitle = cleanText(listing.title) || "Equipment Listing";

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
  const serial =
    cleanText(listing.serialNumber || listing.publicData?.serialNumber || listing.vin || listing.serial) ||
    "Not listed";
  const stockNumber = cleanText(listing.stockNumber || listing.publicData?.stockNumber) || "Not listed";

  const sellerProfile = listing.author?.profile || listing.author?.attributes?.profile || {};
  const sellerPublicData = sellerProfile.publicData || {};

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

  const sellerLogo = getSellerLogoUrl(listing);

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

  const listingId = getListingId(listing);
  const isSaved = savedIds.includes(String(listingId));

  const listingUrl =
    typeof window !== "undefined"
      ? window.location.href
      : `https://www.ironxchange.com/listing/${slugify(title)}`;

  const buyerShareCopy = buildBuyerShareCopy(
    listing,
    listingUrl,
    title,
    price,
    hours,
    location,
    displayHighlights
  );

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

  async function copyText(label, text) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(""), 1500);
    } catch {
      alert("Copy failed. Highlight and copy manually.");
    }
  }

  function openWhatsApp() {
    window.open(
      `https://wa.me/?text=${encodeURIComponent(buyerShareCopy)}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  function openMessenger() {
    copyText("Messenger", buyerShareCopy);
    window.open("https://www.messenger.com/", "_blank", "noopener,noreferrer");
  }

  function openSms() {
    window.open(
      `sms:?&body=${encodeURIComponent(buyerShareCopy)}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  async function nativeShare() {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: buyerShareCopy,
          url: listingUrl
        });
        return;
      } catch {}
    }

    copyText("Share", buyerShareCopy);
  }

  async function handleToggleSaved(e) {
    e.preventDefault();
    e.stopPropagation();

    if (saveBusy) return;

    if (!sdkInstance) {
      window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`;
      return;
    }

    setSaveBusy(true);

    try {
      const result = await toggleSavedListing({
        sdk: sdkInstance,
        listing
      });

      setSavedIds(result.savedIds);
    } catch (err) {
      console.error("Save toggle failed:", err);
      window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`;
    } finally {
      setSaveBusy(false);
    }
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
                  {displayHighlights.map(item => (
                    <span key={item}>{String(item).toLowerCase()}</span>
                  ))}
                </div>
              </div>
            </div>

            <div className="right-stack">
              <div className="mini-tool-tab">
                <button
                  type="button"
                  onClick={nativeShare}
                  title="Share this listing"
                >
                  <i className="fa-solid fa-arrow-up-from-bracket"></i>
                </button>

                <button
                  type="button"
                  className={isSaved ? "saved-star" : ""}
                  onClick={handleToggleSaved}
                  disabled={saveBusy}
                  aria-label={isSaved ? "Unsave listing" : "Save listing"}
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

              <div className="media-tools-row">
                <div className="panel buyer-launch-panel">
                  <h2>Send This Machine</h2>

                  <div className="buyer-launch-stack">
                    <button type="button" onClick={openWhatsApp}>
                      <i className="fa-brands fa-whatsapp whatsapp-icon"></i>
                      <span>WhatsApp</span>
                    </button>

                    <button type="button" onClick={openMessenger}>
                      <i className="fa-brands fa-facebook-messenger messenger-icon"></i>
                      <span>{copied === "Messenger" ? "Copied" : "Messenger"}</span>
                    </button>

                    <button type="button" onClick={openSms}>
                      <i className="fa-solid fa-comment-sms sms-icon"></i>
                      <span>Text</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => copyText("Link", listingUrl)}
                    >
                      <i className="fa-solid fa-link link-icon"></i>
                      <span>{copied === "Link" ? "Copied" : "Copy Link"}</span>
                    </button>

                    <button type="button" onClick={nativeShare}>
                      <i className="fa-solid fa-arrow-up-from-bracket share-icon"></i>
                      <span>{copied === "Share" ? "Copied" : "Share"}</span>
                    </button>
                  </div>
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
                {sellerLogo ? (
                  <img
                    src={sellerLogo}
                    alt={sellerName}
                    className="seller-logo"
                  />
                ) : (
                  <div className="seller-avatar">
                    <i className="fa-regular fa-user"></i>
                  </div>
                )}

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
        :global(html),
        :global(body) {
          margin: 0;
          min-height: 100%;
          overflow-x: hidden;
          background: #0b0b0b;
          color: #d6d6d6;
          font-family: Arial, sans-serif;
          -webkit-font-smoothing: antialiased;
          text-rendering: geometricPrecision;
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

        button,
        input,
        textarea,
        select {
          font-family: inherit;
          -webkit-font-smoothing: antialiased;
          text-rendering: geometricPrecision;
        }

        main {
          min-height: 100vh;
          background:
            radial-gradient(circle at top center, rgba(255,196,0,.032), transparent 28%),
            radial-gradient(circle at 18% 12%, rgba(255,255,255,.018), transparent 22%),
            #0b0b0b;
        }

        button:focus-visible,
        a:focus-visible {
          outline: 1px solid rgba(255,196,0,.42);
          outline-offset: 3px;
        }

        .page {
          max-width: 1500px;
          margin: 0 auto;
          padding: 18px 3% 54px;
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
          text-rendering: geometricPrecision;
          -webkit-font-smoothing: antialiased;
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
          text-rendering: geometricPrecision;
          -webkit-font-smoothing: antialiased;
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
            inset 0 -70px 110px rgba(0,0,0,.13);
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
          cursor: pointer;
          will-change: transform;
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
          opacity: .72;
          box-shadow:
            0 1px 0 rgba(255,255,255,.025) inset,
            0 10px 22px rgba(0,0,0,.16);
          transition:
            opacity .16s ease,
            transform .16s ease,
            border-color .16s ease,
            box-shadow .16s ease,
            filter .16s ease;
        }

        .photo-rail img:hover,
        .photo-rail img.active-thumb {
          opacity: 1;
          transform: translateY(-1px);
          border-color: rgba(255,196,0,.26);
          filter:
            contrast(1.03)
            saturate(1.02);
          box-shadow:
            0 1px 0 rgba(255,255,255,.035) inset,
            0 12px 26px rgba(0,0,0,.24),
            0 0 16px rgba(255,196,0,.055);
        }

        .photo-rail img.active-thumb {
          outline: 1px solid rgba(255,196,0,.22);
          outline-offset: -3px;
        }

        .arrow {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 34px;
          height: 88px;
          border: none;
          background: rgba(0,0,0,.08);
          color: rgba(255,255,255,.42);
          font-size: 34px;
          font-weight: 300;
          line-height: 1;
          cursor: pointer;
          z-index: 4;
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
  --info-row-height: 318px;
  --mini-tool-height: 38px;
  --info-gap: 10px;
  --media-row-height: calc(
    var(--info-row-height) - var(--mini-tool-height) - var(--info-gap)
  );

  display: grid;
  grid-template-columns: minmax(0, 1fr) 560px;

  gap: 14px;
  margin-top: 14px;

  align-items: stretch;
}

        .right-stack {
  height: var(--info-row-height);

  display: grid;
  grid-template-rows: var(--mini-tool-height) var(--media-row-height);

  gap: var(--info-gap);

  min-width: 0;
  align-content: start;
}

        .mini-tool-tab {
          height: 38px;
          padding: 0 14px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background:
            linear-gradient(180deg, rgba(255,255,255,.032), rgba(255,255,255,0)),
            radial-gradient(circle at top, rgba(255,255,255,.018), transparent 72%),
            #141414;
          border: 1px solid rgba(255,255,255,.065);
          outline: 1px solid rgba(255,255,255,.018);
          border-radius: 12px;
          box-shadow:
            0 1px 0 rgba(255,255,255,.045) inset,
            0 16px 38px rgba(0,0,0,.24);
        }

        .mini-tool-tab a,
        .mini-tool-tab button {
          -webkit-appearance: none;
          appearance: none;
          background: transparent;
          border: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          color: rgba(255,255,255,.58) !important;
          text-decoration: none !important;
          font-size: 10px;
          font-weight: 850;
          letter-spacing: .55px;
          text-transform: uppercase;
          cursor: pointer;
          transition:
            color .14s ease,
            transform .14s ease;
        }

        .mini-tool-tab a:visited {
          color: rgba(255,255,255,.58) !important;
        }

        .mini-tool-tab a:hover,
        .mini-tool-tab button:hover {
          color: #FFC400 !important;
          transform: translateY(-1px);
        }

        .mini-tool-tab i {
          font-size: 11px;
        }

        .saved-star {
          color: #FFC400 !important;
          text-shadow: 0 0 8px rgba(255,196,0,.12);
        }

        .mini-tool-tab button:disabled {
          opacity: .28;
          cursor: default;
        }

        .panel {
          background:
            linear-gradient(180deg, rgba(255,255,255,.032), rgba(255,255,255,0)),
            radial-gradient(circle at top, rgba(255,255,255,.018), transparent 72%),
            #141414;
          border: 1px solid rgba(255,255,255,.065);
          outline: 1px solid rgba(255,255,255,.018);
          border-radius: 14px;
          padding: 18px 20px;
          box-shadow:
            0 1px 0 rgba(255,255,255,.045) inset,
            0 16px 38px rgba(0,0,0,.24);
          transition:
            border-color .16s ease,
            box-shadow .16s ease,
            background .16s ease;
        }

        .panel:hover {
          border-color: rgba(255,255,255,.085);
          box-shadow:
            0 1px 0 rgba(255,255,255,.052) inset,
            0 18px 44px rgba(0,0,0,.26);
        }

        .panel + .panel,
        .panel + section {
          margin-top: 14px;
        }

        .media-tools-row .panel {
  margin-top: 0 !important;
}

        .panel h2 {
          margin: 0 0 14px;
          color: rgba(255,255,255,.86);
          font-size: 12px;
          font-weight: 950;
          letter-spacing: .68px;
          text-transform: uppercase;
          text-rendering: geometricPrecision;
          -webkit-font-smoothing: antialiased;
        }

.media-tools-row {
  display: grid;

  grid-template-columns: 190px 360px;

  gap: 10px;

  width: 560px;
  max-width: 560px;

  height: var(--media-row-height);

  align-items: stretch;
}

.buyer-launch-panel,
.video-panel {
  height: var(--media-row-height);
  min-height: var(--media-row-height);
  max-height: var(--media-row-height);

  padding: 12px;

  display: flex;
  flex-direction: column;

  overflow: hidden;
}

.buyer-launch-panel h2,
.video-panel h2 {
  margin: 0 0 10px;
  text-align: center;
}

.buyer-launch-stack {
  display: grid;
  gap: 6px;

  flex: 1;
  align-content: stretch;
}

.buyer-launch-stack button {
  min-height: 0;
  height: 100%;

  display: flex;
  align-items: center;

  gap: 8px;

  border-radius: 9px;
  border: 1px solid rgba(255,255,255,.07);

  background:
    linear-gradient(
      180deg,
      rgba(255,255,255,.014),
      rgba(255,255,255,0)
    ),
    #101010;

  color: rgba(255,255,255,.68);

  padding: 0 8px;

  font-size: 7px;
  font-weight: 950;

  letter-spacing: .52px;
  text-transform: uppercase;

  cursor: pointer;

  box-shadow:
    0 1px 0 rgba(255,255,255,.02) inset;

  transition:
    transform .14s ease,
    border-color .14s ease,
    color .14s ease,
    background .14s ease;
}

.buyer-launch-stack button:hover {
  transform: translateY(-1px);

  border-color: rgba(255,196,0,.18);

  color: #FFC400;

  background:
    linear-gradient(
      180deg,
      rgba(255,196,0,.035),
      rgba(255,196,0,0)
    ),
    #151515;
}

.buyer-launch-stack i {
  width: 13px;

  text-align: center;

  font-size: 10px;
}

.video-panel {
  align-self: stretch;
}

        .whatsapp-icon {
          color: #25D366;
          filter: grayscale(.25);
        }

        .messenger-icon {
          color: #80bfff;
          filter: grayscale(.20);
        }

        .sms-icon {
          color: rgba(52,199,89,.82);
          filter: grayscale(.32);
        }

        .link-icon,
        .share-icon {
          color: rgba(255,196,0,.76);
        }

      .video-box {
  position: relative;

  flex: 1;
  min-height: 0;

  overflow: hidden;

  border: 1px solid rgba(255,255,255,.055);
  border-radius: 12px;

  background:
    linear-gradient(180deg, rgba(255,255,255,.018), rgba(255,255,255,0)),
    #050505;

  box-shadow:
    0 1px 0 rgba(255,255,255,.025) inset,
    0 10px 24px rgba(0,0,0,.16);
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
  height: var(--info-row-height);
  min-height: var(--info-row-height);
  max-height: var(--info-row-height);
  overflow: hidden;

  display: grid;
  grid-template-columns: .82fr 1fr;
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

          text-rendering: geometricPrecision;
        }

        .highlight-chips {
          display: flex;
          flex-wrap: wrap;

          justify-content: flex-start;
          align-content: flex-start;

          gap: 6px;

          max-height: 132px;
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

          background:
            linear-gradient(
              180deg,
              rgba(255,255,255,.028),
              rgba(255,255,255,.01)
            );

          color: rgba(255,255,255,.42);

          font-size: 9px;
          font-weight: 850;

          letter-spacing: .14px;
          line-height: 1;

          text-transform: lowercase;

          backdrop-filter: blur(2px);
        }

      .description {
  margin-top: 18px;
  padding: 18px 20px;
}

        .description h2 {
          margin: 0 0 14px;

          color: rgba(255,255,255,.84);

          font-size: 12px;
          font-weight: 950;

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

          text-rendering: geometricPrecision;
          -webkit-font-smoothing: antialiased;
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

          gap: 18px;
        }

        .seller-logo {
          width: auto;
          max-width: 180px;
          max-height: 82px;

          object-fit: contain;
          display: block;

          filter:
            contrast(1.03)
            saturate(1.02)
            drop-shadow(0 10px 22px rgba(0,0,0,.30));
        }

        .seller-avatar {
          width: 72px;
          height: 72px;

          border: 1px solid rgba(255,255,255,.08);
          border-radius: 50%;

          background:
            linear-gradient(180deg, rgba(255,255,255,.018), rgba(255,255,255,0)),
            #101010;

          display: grid;
          place-items: center;

          color: rgba(255,255,255,.52);

          box-shadow:
            0 1px 0 rgba(255,255,255,.025) inset;
        }

        .seller-row strong {
          display: block;

          color: #f2f2f2;

          font-size: 17px;
          font-weight: 950;

          letter-spacing: -.28px;

          text-rendering: geometricPrecision;
          -webkit-font-smoothing: antialiased;
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
          justify-content: flex-end;
          align-items: center;

          gap: 10px;

          min-width: 0;
          flex-wrap: wrap;
        }

        .message-btn,
        .yard-btn,
        .call-btn {
          height: 38px;

          display: inline-flex;
          align-items: center;
          justify-content: center;

          padding: 0 16px;

          background:
            linear-gradient(180deg, rgba(255,255,255,.018), rgba(255,255,255,0)),
            #101010;

          border: 1px solid rgba(255,255,255,.08);
          border-radius: 12px;

          color: #EAEAEA;

          text-decoration: none;

          font-size: 10px;
          font-weight: 900;

          letter-spacing: .55px;
          text-transform: uppercase;

          box-shadow:
            0 1px 0 rgba(255,255,255,.025) inset;

          transition:
            border-color .15s ease,
            background .15s ease,
            color .15s ease,
            transform .15s ease,
            box-shadow .15s ease;
        }

        .message-btn {
          background:
            linear-gradient(180deg, rgba(255,196,0,.10), rgba(255,196,0,0)),
            #151515;

          border-color: rgba(255,196,0,.24);

          color: #FFC400;

          min-width: 138px;
        }

        .yard-btn,
        .call-btn {
          min-width: 104px;
        }

        .message-btn:hover,
        .yard-btn:hover,
        .call-btn:hover {
          transform: translateY(-1px);

          border-color: #FFC400;
          color: #FFC400;

          background:
            linear-gradient(180deg, rgba(255,196,0,.055), rgba(255,196,0,0)),
            #161616;

          box-shadow:
            0 10px 22px rgba(0,0,0,.18);
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
          font-weight: 950;

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
          .page {
            padding: 16px 3.5% 44px;
          }

          .page {
  display: flex;
  flex-direction: column;
}

          .photo-grid {
            order: 1;
            display: block;
            margin-top: 10px;
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
            min-width: 78%;
            height: 390px;

            scroll-snap-align: start;

            background: #111;
            border: 1px solid rgba(255,255,255,.055);
            border-radius: 12px;

            overflow: hidden;
          }

          .mobile-hero img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }

          .mobile-pair {
            min-width: 42vw;
            height: 390px;

            display: grid;
            grid-template-rows: 1fr 1fr;
            gap: 10px;

            scroll-snap-align: start;
          }

          .mobile-pair img {
            width: 100%;
            height: 190px;

            object-fit: cover;

            border: 1px solid rgba(255,255,255,.055);
            border-radius: 12px;
          }

        .info-grid {
  display: contents;
}

.right-stack {
  display: contents;
}

        .media-tools-row {
  display: contents;
}

.mini-tool-tab {
  order: 2;
  width: 100%;
  margin-top: 12px;
}

.facts-highlights-panel {
  order: 3;

  height: auto;
  min-height: 0;
  max-height: none;

  display: grid;
  grid-template-columns: .82fr 1fr;

  margin-top: 12px;
}

         .description {
  order: 4;
}

.seller-panel {
  order: 5;
}
          .seller-actions {
            min-width: 0;
            width: 100%;
          }

.buyer-launch-panel {
  order: 6;

  height: auto;
  min-height: 0;
  max-height: none;

  margin-top: 14px !important;
}

.video-panel {
  order: 7;

  height: auto;
  min-height: 0;
  max-height: none;

  margin-top: 14px !important;
}

.video-box {
  height: 240px;
  min-height: 240px;
  max-height: 240px;
}

.buyer-launch-stack {
  min-height: 190px;
}

.buyer-launch-stack button {
  min-height: 34px;
}
          
        }

    @media (max-width: 850px) {
  .page {
    padding: 14px 4% 38px;
    gap: 0;
  }

  .title-row {
    grid-template-columns: 1fr;
    gap: 6px;
  }

  h1 {
    display: block;
    font-size: 25px;
    line-height: .96;
    letter-spacing: -.75px;
  }

  .title-hours {
    display: inline-block;
    margin-left: 10px;
    transform: none;
    font-size: .58em;
  }

  .price {
    width: fit-content;
    height: auto;
    font-size: 21px;
    line-height: 1;
  }

  .mobile-gallery {
    gap: 8px;
  }

  .mobile-hero {
    min-width: 86%;
    height: 310px;
  }

  .mobile-pair {
    min-width: 54vw;
    height: 310px;
    gap: 8px;
  }

  .mobile-pair img {
    height: 151px;
  }

  .mini-tool-tab {
    padding: 0 10px;
    overflow-x: auto;
    gap: 12px;
    justify-content: flex-start;
  }

  .mini-tool-tab a,
  .mini-tool-tab button {
    flex: 0 0 auto;
    white-space: nowrap;
  }

  .facts-highlights-panel {
    grid-template-columns: .9fr 1fr;
    padding: 14px;
  }

  .facts-column {
    padding-right: 12px;
    padding-bottom: 0;
  }

  .facts-column::after {
    display: block;
  }

  .highlights-column {
    padding-left: 12px;
    padding-top: 0;
    border-top: none;
  }

  .facts {
    grid-template-columns: 72px 1fr;
    row-gap: 7px;
  }

  .facts span {
    font-size: 8px;
  }

  .facts strong {
    font-size: 10.5px;
  }

  .highlight-chips {
    gap: 5px;
    max-height: none;
  }

  .highlight-chips span {
    min-height: 19px;
    padding: 3px 6px;
    font-size: 7.5px;
  }

  .panel {
    padding: 14px;
  }

  .description {
    margin-top: 14px;
  }

  .description p {
    font-size: 13px;
    line-height: 1.5;
  }

  .buyer-launch-panel,
  .video-panel {
    padding: 10px;
  }

  .buyer-launch-stack {
    min-height: 0;
  }

  .buyer-launch-stack button {
    min-height: 30px;
    font-size: 6.5px;
  }

  .video-box {
    height: 210px;
    min-height: 210px;
    max-height: 210px;
  }

  .seller-row {
    align-items: center;
  }

  .seller-logo {
    max-width: 138px;
    max-height: 70px;
  }

  .seller-panel {
    gap: 16px;
  }

  .seller-actions {
    display: grid;
    grid-template-columns: 1fr;
    gap: 8px;
    width: 100%;
  }

  .message-btn,
  .yard-btn,
  .call-btn {
    width: 100%;
    min-width: 0;
  }
}
      `}</style>
    </>
  );
}
