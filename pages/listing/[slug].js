import Head from "next/head";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import featureKeywords from "../../lib/featureKeywords";
import { getListingId } from "../../lib/listingFormatters";

import SellerLogoDecal from "../../components/SellerLogoDecal";

import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

import MachineBadges from "../../components/MachineBadges";

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
  img.attributes?.variants?.["scaled-large"]?.url ||
  img.attributes?.variants?.["scaled-medium"]?.url ||
  img.attributes?.variants?.default?.url ||
  img.attributes?.variants?.["landscape-crop"]?.url ||
  img.attributes?.variants?.["landscape-crop2x"]?.url ||
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
  const imageObjects = Array.isArray(listing?.imageObjects)
    ? listing.imageObjects
    : [];


  const objectUrls = imageObjects
    .map(getImageUrl)
    .filter(Boolean);

  const legacyUrls = [
    ...(Array.isArray(listing?.images) ? listing.images : []),
    ...(Array.isArray(listing?.imageUrls) ? listing.imageUrls : []),
    listing?.imageUrl,
    listing?.image
  ]
    .map(getImageUrl)
    .filter(Boolean);

 return [...new Set([
  ...objectUrls,
  ...legacyUrls
])];
 
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

const rawExternalLinks =
  listing?.externalLinks ||
  listing?.publicData?.externalLinks ||
  listing?.attributes?.publicData?.externalLinks ||
  [];

const externalLinks = Array.isArray(rawExternalLinks)
  ? rawExternalLinks.filter(link => link?.url && link?.label)
  : [];


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
  <MachineBadges
    keywords={displayHighlights}
    variant="slug"
  />
</div>

{externalLinks.length > 0 ? (
  <div className="also-listed-split">
    <div className="also-listed-head">
      <span>Machine Also Listed Here</span>
    </div>

    <div className="also-listed-links">
      {externalLinks.slice(0, 3).map((link, index) => (
        <a
          key={`${link.label}-${index}`}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
        >
          ↗ {link.label}
        </a>
      ))}
    </div>
  </div>
) : null}

                
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
  <SellerLogoDecal
  logo={sellerLogo}
  name={sellerName}
  variant="slug"
/>

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
  }

  button,
  input,
  textarea,
  select {
    font-family: inherit;
  }
  
* {
  box-sizing: border-box;
}

button,
input,
textarea,
select,
a {
  font-family: inherit;
  -webkit-font-smoothing: antialiased;
  text-rendering: geometricPrecision;
}

button {
  cursor: pointer;
}

button:disabled {
  cursor: default;
}

a {
  color: inherit;
}

img,
video {
  max-width: 100%;
}

::selection {
  background: rgba(255,196,0,.28);
  color: #fff;
}

*:focus-visible {
  outline: 1px solid rgba(255,196,0,.42);
  outline-offset: 3px;
}

* {
  scrollbar-width: thin;
  scrollbar-color: rgba(255,255,255,.12) transparent;
}

*::-webkit-scrollbar {
  width: 7px;
  height: 7px;
}

*::-webkit-scrollbar-track {
  background: transparent;
}

*::-webkit-scrollbar-thumb {
  background: rgba(255,255,255,.12);
  border-radius: 999px;
}

*::-webkit-scrollbar-thumb:hover {
  background: rgba(255,196,0,.24);
}

.ix-v12-panel {
  background:
    linear-gradient(180deg, rgba(255,255,255,.032), rgba(255,255,255,0)),
    radial-gradient(circle at top, rgba(255,255,255,.018), transparent 72%),
    var(--ix-panel);
  border: 1px solid var(--ix-border);
  outline: 1px solid rgba(255,255,255,.018);
  border-radius: var(--ix-radius);
  box-shadow: var(--ix-shadow-panel);
}
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
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: end;
  gap: 20px;
  margin: 0 0 8px;
  padding: 0 0 10px;
  border-bottom: 1px solid rgba(255,255,255,.055);
}

.title-row::after {
  content: "";
  position: absolute;
  left: 0;
  bottom: -1px;
  width: 180px;
  height: 1px;
  background: linear-gradient(90deg, rgba(255,196,0,.34), transparent);
}

        .title-row > div:first-child {
          min-width: 0;
        }

       h1 {
  margin: 0;

  color: #f2f2f2;

  font-size: clamp(32px, 2.8vw, 44px);
  font-weight: 950;

  letter-spacing: -1.28px;
  line-height: .92;

  text-transform: uppercase;

  display: flex;
  align-items: baseline;

  text-rendering: geometricPrecision;
  -webkit-font-smoothing: antialiased;
}

      .title-hours {
  margin-left: 14px;

  color: rgba(255,255,255,.42);

  font-size: .60em;
  font-weight: 700;

  letter-spacing: -.18px;

  white-space: nowrap;

  display: inline-block;

  transform: translateY(-1px);
}

        .title-row p {
          display: none;
        }

      .price {
  color: #f2f2f2;

  font-size: clamp(26px, 2vw, 36px);
  font-weight: 900;

  letter-spacing: -.8px;
  line-height: 1;

  white-space: nowrap;

  text-rendering: geometricPrecision;
  -webkit-font-smoothing: antialiased;
}

     .photo-grid {
  display: grid;

  grid-template-columns:
    minmax(0, 1fr)
    310px;

  gap: 14px;

  margin-top: 10px;
  margin-bottom: 0;

  align-items: start;
}
       .hero-wrap {
  position: relative;

  min-width: 0;

  border-radius: 16px;

  overflow: hidden;

  background: #111;

  box-shadow:
    0 1px 0 rgba(255,255,255,.04) inset,
    0 28px 70px rgba(0,0,0,.30);
}
      .hero-wrap::after {
  content: "";

  position: absolute;
  inset: 0;

  pointer-events: none;

  border-radius: 16px;

  box-shadow:
    inset 0 0 0 1px rgba(255,255,255,.04),
    inset 0 -90px 140px rgba(0,0,0,.18);
}

       .hero-photo {
  width: 100%;
  height: 610px;

  object-fit: cover;

  display: block;

  border-radius: 16px;

  background: #111;

  border: 1px solid rgba(255,255,255,.055);

  box-shadow:
    0 1px 0 rgba(255,255,255,.035) inset,
    0 28px 70px rgba(0,0,0,.32);

  cursor: pointer;

  will-change: transform;

  transition:
    transform .24s ease,
    filter .24s ease;
}

      .hero-photo:hover {
  transform: scale(1.004);

  filter:
    contrast(1.04)
    saturate(1.03)
    brightness(1.01);
}

       .photo-rail {
  height: 610px;

  overflow-y: auto;

  display: grid;

  grid-auto-rows: 144px;

  gap: 14px;

  padding-right: 2px;
}

        .photo-rail img {
  width: 100%;
  height: 144px;

  object-fit: cover;

  border-radius: 13px;

  border: 1px solid rgba(255,255,255,.05);

  cursor: pointer;

  opacity: .72;

  box-shadow:
    0 1px 0 rgba(255,255,255,.025) inset,
    0 12px 26px rgba(0,0,0,.18);

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

  width: 38px;
  height: 108px;

  border: 1px solid rgba(255,255,255,.04);

  background:
    linear-gradient(
      180deg,
      rgba(0,0,0,.18),
      rgba(0,0,0,.06)
    );

  color: rgba(255,255,255,.42);

  font-size: 38px;
  font-weight: 300;

  line-height: 1;

  cursor: pointer;

  z-index: 4;

  backdrop-filter: blur(3px);

  transition:
    background .16s ease,
    color .16s ease,
    border-color .16s ease,
    opacity .16s ease;

  opacity: 0;
}

.hero-wrap:hover .arrow {
  opacity: 1;
}

       .arrow:hover {
  background:
    linear-gradient(
      180deg,
      rgba(0,0,0,.34),
      rgba(0,0,0,.18)
    );

  color: rgba(255,255,255,.92);

  border-color: rgba(255,196,0,.18);
}

       .arrow.left {
  left: 0;
  border-radius: 0 16px 16px 0;
}
        .arrow.right {
  right: 0;
  border-radius: 16px 0 0 16px;
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
  height: 40px;

  padding: 0 16px;

  display: flex;
  align-items: center;
  justify-content: space-between;

  background:
    linear-gradient(
      180deg,
      rgba(255,255,255,.034),
      rgba(255,255,255,0)
    ),
    radial-gradient(circle at top, rgba(255,255,255,.018), transparent 72%),
    #141414;

  border: 1px solid rgba(255,255,255,.065);
  outline: 1px solid rgba(255,255,255,.018);

  border-radius: 13px;

  box-shadow:
    0 1px 0 rgba(255,255,255,.045) inset,
    0 16px 38px rgba(0,0,0,.24);

  overflow-x: auto;
  overflow-y: hidden;
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

  min-width: fit-content;

  padding: 0;

  color: rgba(255,255,255,.56) !important;

  text-decoration: none !important;

  font-size: 9px;
  font-weight: 900;

  letter-spacing: .62px;
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

  text-shadow:
    0 0 12px rgba(255,196,0,.14);
}
        .mini-tool-tab button:disabled {
          opacity: .28;
          cursor: default;
        }

       .panel {
  background:
    linear-gradient(
      180deg,
      rgba(255,255,255,.032),
      rgba(255,255,255,0)
    ),
    radial-gradient(circle at top, rgba(255,255,255,.018), transparent 72%),
    #141414;

  border: 1px solid rgba(255,255,255,.065);

  outline: 1px solid rgba(255,255,255,.018);

  border-radius: 15px;

  box-shadow:
    0 1px 0 rgba(255,255,255,.045) inset,
    0 18px 44px rgba(0,0,0,.26);

  transition:
    border-color .16s ease,
    box-shadow .16s ease,
    background .16s ease;
}

       .panel:hover {
  border-color: rgba(255,255,255,.085);

  box-shadow:
    0 1px 0 rgba(255,255,255,.052) inset,
    0 20px 48px rgba(0,0,0,.28);
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

  padding: 13px;

  display: flex;
  flex-direction: column;

  overflow: hidden;

  border-radius: 15px;
}

.buyer-launch-panel h2,
.video-panel h2 {
  margin: 0 0 11px;

  text-align: center;

  color: rgba(255,255,255,.86);

  font-size: 10.5px;
  font-weight: 950;

  letter-spacing: .72px;
  text-transform: uppercase;
}

.buyer-launch-stack {
  display: grid;

  gap: 7px;

  flex: 1;

  align-content: stretch;
}

.buyer-launch-stack button {
  min-height: 0;
  height: 100%;

  display: flex;
  align-items: center;

  gap: 9px;

  border-radius: 10px;

  border: 1px solid rgba(255,255,255,.065);

  background:
    linear-gradient(
      180deg,
      rgba(255,255,255,.018),
      rgba(255,255,255,0)
    ),
    #101010;

  color: rgba(255,255,255,.68);

  padding: 0 10px;

  font-size: 7.5px;
  font-weight: 950;

  letter-spacing: .58px;
  text-transform: uppercase;

  cursor: pointer;

  box-shadow:
    0 1px 0 rgba(255,255,255,.025) inset;

  transition:
    transform .14s ease,
    border-color .14s ease,
    color .14s ease,
    background .14s ease,
    box-shadow .14s ease;
}

.buyer-launch-stack button:hover {
  transform: translateY(-1px);

  border-color: rgba(255,196,0,.22);

  color: #FFC400;

  background:
    linear-gradient(
      180deg,
      rgba(255,196,0,.045),
      rgba(255,196,0,0)
    ),
    #151515;

  box-shadow:
    0 10px 24px rgba(0,0,0,.18);
}

.buyer-launch-stack i {
  width: 14px;

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
  border-radius: 13px;

  background:
    linear-gradient(
      180deg,
      rgba(255,255,255,.018),
      rgba(255,255,255,0)
    ),
    #050505;

  box-shadow:
    0 1px 0 rgba(255,255,255,.025) inset,
    0 12px 28px rgba(0,0,0,.18);
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

  font-size: 9px;
  font-weight: 900;

  letter-spacing: .62px;
  text-transform: uppercase;
}

        .video-placeholder i {
  width: 46px;
  height: 46px;

  display: grid;
  place-items: center;

  margin-bottom: 8px;

  border-radius: 50%;

  color: rgba(255,196,0,.82);

  border: 1px solid rgba(255,196,0,.24);

  background:
    linear-gradient(
      180deg,
      rgba(255,196,0,.10),
      rgba(255,196,0,0)
    ),
    #151515;

  box-shadow:
    0 0 20px rgba(255,196,0,.08);
}

//// QUICK FACTS HIGH LIGHTS ///////

      .facts-highlights-panel {
  height: var(--info-row-height);
  min-height: var(--info-row-height);
  max-height: var(--info-row-height);

  overflow: hidden;

  display: grid;

  grid-template-columns: minmax(0, .82fr) minmax(0, 1fr);

min-width: 0;
  gap: 0;

  align-items: start;

  border-radius: 16px;

  padding: 22px 24px;

  background:
    linear-gradient(
      180deg,
      rgba(255,255,255,.032),
      rgba(255,255,255,0)
    ),
    radial-gradient(circle at top, rgba(255,255,255,.018), transparent 72%),
    #141414;

  border: 1px solid rgba(255,255,255,.065);

  box-shadow:
    0 1px 0 rgba(255,255,255,.045) inset,
    0 18px 44px rgba(0,0,0,.26);
}

.facts-column,
.highlights-column {
  min-width: 0;
  overflow: hidden;
}


       .facts-column::after {
  content: "";

  position: absolute;
  top: 6px;
  right: 0;

  width: 1px;
  height: calc(100% - 12px);

  background:
    linear-gradient(
      180deg,
      transparent,
      rgba(255,255,255,.11),
      transparent
    );
}

        .highlights-column {
  padding-left: 24px;
}
        .facts-column h2,
.highlights-column h2 {
  margin: 0 0 14px;

  color: rgba(255,255,255,.86);

  font-size: 11px;
  font-weight: 950;

  letter-spacing: .72px;
  text-transform: uppercase;

  text-align: left;

  text-rendering: geometricPrecision;
  -webkit-font-smoothing: antialiased;
}

        .facts {
  display: grid;

  grid-template-columns: 82px 1fr;

  column-gap: 12px;
  row-gap: 9px;

  align-items: baseline;
}

       .facts span {
  color: rgba(255,255,255,.34);

  font-size: 9px;
  font-weight: 950;

  letter-spacing: .62px;
  text-transform: uppercase;
}

       .facts strong {
  min-width: 0;

  color: rgba(255,255,255,.76);

  font-size: 12.5px;
  font-weight: 760;

  line-height: 1.15;

  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  text-rendering: geometricPrecision;
  -webkit-font-smoothing: antialiased;
}


       .highlight-chips {
  max-height: 150px;
  overflow: hidden;
}


.also-listed-split {
  position: relative;

  margin-top: 14px;
  padding-top: 13px;

  border-top: 1px solid rgba(255,255,255,.045);
}

.also-listed-split::before {
  content: "";

  position: absolute;
  top: -1px;
  left: 0;

  width: 34%;
  height: 1px;

  background:
    linear-gradient(
      90deg,
      rgba(0,209,255,.42),
      transparent
    );
}

.also-listed-head span {
  display: block;

  margin-bottom: 8px;

  color: #7DEBFF;

  font-size: 8px;
  font-weight: 950;
  letter-spacing: .72px;
  text-transform: uppercase;
}

.also-listed-links {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
}

.also-listed-links a {
  min-height: 22px;

  display: inline-flex;
  align-items: center;
  justify-content: center;

  padding: 4px 8px;

  border-radius: 1px;

  border-top: 1px solid rgba(255,255,255,.075);
  border-left: 1px solid rgba(255,255,255,.052);
  border-right: 1px solid rgba(0,0,0,.36);
  border-bottom: 1px solid rgba(0,0,0,.46);

  background:
    linear-gradient(
      180deg,
      rgba(0,209,255,.052),
      rgba(255,255,255,.010) 45%,
      rgba(0,0,0,.035)
    ),
    #171717;

  color: rgba(125,235,255,.78);

  font-size: 9px;
  font-weight: 850;
  letter-spacing: .08px;
  line-height: 1;

  white-space: nowrap;
  text-decoration: none;

  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.025),
    inset 0 -1px 1px rgba(0,0,0,.34),
    0 1px 0 rgba(255,255,255,.012);

  text-shadow:
    0 1px 0 rgba(0,0,0,.52);

  transition:
    transform .14s ease,
    color .14s ease,
    border-color .14s ease,
    background .14s ease,
    box-shadow .14s ease;
}

.also-listed-links a:hover {
  transform: translateY(-1px);

  color: #7DEBFF;

  border-top-color: rgba(0,209,255,.28);
  border-left-color: rgba(0,209,255,.18);

  background:
    linear-gradient(
      180deg,
      rgba(0,209,255,.085),
      rgba(255,255,255,.014) 46%,
      rgba(0,0,0,.055)
    ),
    #1a1a1a;

  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.045),
    inset 0 -1px 1px rgba(0,0,0,.42),
    0 0 12px rgba(0,209,255,.07);
}  

      .description {
  margin-top: 18px;

  padding: 20px 22px;

  border-radius: 15px;
}

        .description h2 {
  margin: 0 0 15px;

  color: rgba(255,255,255,.86);

  font-size: 11px;
  font-weight: 950;

  letter-spacing: .72px;
  text-transform: uppercase;

  text-rendering: geometricPrecision;
  -webkit-font-smoothing: antialiased;
}

        .description p {
  margin: 0;

  max-width: 1180px;

  color: rgba(255,255,255,.70);

  font-size: 14px;
  font-weight: 500;

  line-height: 1.62;

  letter-spacing: .04px;

  text-rendering: geometricPrecision;
  -webkit-font-smoothing: antialiased;
}

     .seller-panel {
  padding: 20px 22px;

  display: flex;
  justify-content: space-between;
  align-items: center;

  gap: 24px;

  border-radius: 15px;
}

        .seller-row {
  display: flex;
  align-items: center;

  gap: 20px;
}

        .seller-logo {
  width: auto;

  max-width: 185px;
  max-height: 84px;

  object-fit: contain;

  display: block;

  background: transparent;
  border: none;
  border-radius: 0;

  filter:
    contrast(1.03)
    saturate(1.02);
}

        .seller-avatar {
  width: 64px;
  height: 64px;

  display: flex;
  align-items: center;
  justify-content: center;

  background: transparent;
  border: none;
  border-radius: 0;
  box-shadow: none;

  color: rgba(255,255,255,.42);
}
        .seller-row strong {
  display: block;

  color: #f2f2f2;

  font-size: 18px;
  font-weight: 950;

  letter-spacing: -.30px;

  text-rendering: geometricPrecision;
  -webkit-font-smoothing: antialiased;
}

        .seller-row p {
  margin: 5px 0 0;

  color: rgba(255,255,255,.44);

  font-size: 10px;
  font-weight: 900;

  letter-spacing: .52px;
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
  height: 40px;

  display: inline-flex;
  align-items: center;
  justify-content: center;

  padding: 0 17px;

  background:
    linear-gradient(
      180deg,
      rgba(255,255,255,.018),
      rgba(255,255,255,0)
    ),
    #101010;

  border: 1px solid rgba(255,255,255,.08);
  border-radius: 12px;

  color: #EAEAEA;

  text-decoration: none;

  font-size: 9px;
  font-weight: 950;

  letter-spacing: .62px;
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
    linear-gradient(
      180deg,
      rgba(255,196,0,.10),
      rgba(255,196,0,0)
    ),
    #151515;

  border-color: rgba(255,196,0,.24);

  color: #FFC400;

  min-width: 142px;

  box-shadow:
    0 1px 0 rgba(255,255,255,.04) inset,
    0 0 18px rgba(255,196,0,.05);
}

        .yard-btn,
.call-btn {
  min-width: 108px;
}

        .message-btn:hover,
.yard-btn:hover,
.call-btn:hover {
  transform: translateY(-1px);

  border-color: #FFC400;

  color: #FFC400;

  background:
    linear-gradient(
      180deg,
      rgba(255,196,0,.055),
      rgba(255,196,0,0)
    ),
    #161616;

  box-shadow:
    0 12px 28px rgba(0,0,0,.20);
}

        .seller-eyebrow {
  display: block;

  margin-bottom: 7px;

  color: #FFC400;

  font-size: 8.5px;
  font-weight: 950;

  letter-spacing: .72px;
  text-transform: uppercase;
}
        .seller-panel h2 {
  margin: 0 0 15px;

  color: #f2f2f2;

  font-size: 19px;
  font-weight: 950;

  letter-spacing: -.30px;
  text-transform: uppercase;
}

        .lightbox {
  position: fixed;
  inset: 0;

  z-index: 9999;

  display: flex;
  align-items: center;
  justify-content: center;

  background: rgba(0,0,0,.96);

  backdrop-filter: blur(4px);
}

       .lightbox-image {
  max-width: 94vw;
  max-height: 92vh;

  object-fit: contain;

  border-radius: 14px;

  box-shadow:
    0 1px 0 rgba(255,255,255,.04) inset,
    0 34px 90px rgba(0,0,0,.60);
}

        .lightbox-close {
  position: absolute;

  top: 22px;
  right: 22px;

  width: 40px;
  height: 40px;

  border: 1px solid rgba(255,255,255,.08);
  border-radius: 50%;

  background: rgba(20,20,20,.84);

  color: rgba(255,255,255,.72);

  font-size: 28px;

  cursor: pointer;

  backdrop-filter: blur(3px);
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

  padding-bottom: 12px;
}

          .mobile-hero {
  min-width: 80%;

  height: 420px;

  scroll-snap-align: start;

  background: #111;

  border: 1px solid rgba(255,255,255,.055);

  border-radius: 14px;

  overflow: hidden;

  box-shadow:
    0 16px 40px rgba(0,0,0,.24);
}

          .mobile-hero img {
  width: 100%;
  height: 100%;

  object-fit: cover;
}

          .mobile-pair {
  min-width: 44vw;

  height: 420px;

  display: grid;

  grid-template-rows: 1fr 1fr;

  gap: 10px;

  scroll-snap-align: start;
}

         .mobile-pair img {
  width: 100%;
  height: 205px;

  object-fit: cover;

  border: 1px solid rgba(255,255,255,.055);

  border-radius: 14px;

  box-shadow:
    0 12px 28px rgba(0,0,0,.18);
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

  margin-top: 14px;

  padding: 0 12px;

  overflow-x: auto;

  gap: 14px;

  justify-content: flex-start;
}

.facts-highlights-panel {
  order: 3;

  height: auto;
  min-height: 0;
  max-height: none;

  display: grid;

  grid-template-columns: .84fr 1fr;

  margin-top: 14px;

  padding: 16px;
}

.facts-column {
  padding-right: 14px;
}

.highlights-column {
  padding-left: 14px;
}

        .description {
  order: 4;

  margin-top: 16px;
}

.seller-panel {
  order: 5;

  gap: 18px;
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

  margin-top: 16px !important;
}

.video-panel {
  order: 7;

  height: auto;
  min-height: 0;
  max-height: none;

  margin-top: 16px !important;
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

  font-size: 26px;

  line-height: .96;

  letter-spacing: -.82px;
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

  font-size: 22px;

  line-height: 1;
}

  .mobile-gallery {
    gap: 8px;
  }

 .mobile-hero {
  min-width: 87%;

  height: 325px;
}

  .mobile-pair {
  min-width: 56vw;

  height: 325px;

  gap: 8px;
}

.mobile-pair img {
  height: 158px;
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
  grid-template-columns: 70px 1fr;

  row-gap: 7px;
}

.facts span {
  font-size: 7.8px;
}

.facts strong {
  font-size: 10.5px;
}

  .highlight-chips {
    gap: 5px;
    max-height: none;
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
  height: 220px;

  min-height: 220px;

  max-height: 220px;
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
