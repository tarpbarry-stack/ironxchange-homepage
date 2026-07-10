import Head from "next/head";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import featureKeywords from "../../lib/featureKeywords";
import { getListingId } from "../../lib/listingFormatters";

import SellerLogoDecal from "../../components/SellerLogoDecal";

import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

import MachineBadges from "../../components/MachineBadges";
import IXInspectLightbox from "../../components/IXInspectLightbox";

import { initPostHog, captureIXEvent } from "../../lib/posthog";

import {
  getFrameClass,
  getFrameStyle
} from "../../lib/ixvision/frameEngine";

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
  const { passportId, from } = router.query;
  
  const [listings, setListings] = useState([]);
  const [passport, setPassport] = useState(null);
  const [passportError, setPassportError] = useState("");
  const [savedIds, setSavedIds] = useState([]);
  const [saveBusy, setSaveBusy] = useState(false);
  const [sdkInstance, setSdkInstance] = useState(null);
  const [activeImage, setActiveImage] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [loggedIn, setLoggedIn] = useState(false);
  const [copied, setCopied] = useState("");
  const [slugIxiState, setSlugIxiState] = useState({
  color: "none",
  outline: 1
});
  useEffect(() => {
  initPostHog();
}, []);
  
  useEffect(() => {
  if (!router.isReady || !passportId) return;

  async function loadPage() {
    try {
      setPassportError("");

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

      /*
       * 1. Resolve permanent Passport identity.
       */
      const passportResponse = await fetch(
        `/api/passport/${encodeURIComponent(passportId)}`
      );

      const passportPayload = await passportResponse.json();

      if (!passportResponse.ok || !passportPayload?.ok) {
        throw new Error(
          passportPayload?.error || "Passport could not be found"
        );
      }

      const resolvedPassport = passportPayload.passport;

      if (!resolvedPassport?.sourceId) {
        throw new Error("Passport does not contain a sourceId");
      }

      setPassport(resolvedPassport);

      /*
       * 2. Load current Sharetribe listings.
       *
       * This preserves the same normalized listing object that the slug page
       * already uses. We are only changing how the correct machine is selected.
       */
      const listingsResponse = await fetch("/api/listings");
      const listingsPayload = await listingsResponse.json();

      if (!listingsResponse.ok || !Array.isArray(listingsPayload)) {
        throw new Error("Machine listing lookup failed");
      }

      setListings(listingsPayload);
    } catch (error) {
      console.error("Passport page load failed:", error);

      setPassportError(
        error.message || "Passport could not be loaded"
      );
    }
  }

  loadPage();
}, [router.isReady, passportId]);

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
  if (!passport?.sourceId || listings.length === 0) {
    return null;
  }

  return listings.find(item => {
    const itemId = String(getListingId(item) || item.id || "");

    return itemId === String(passport.sourceId);
  });
}, [passport, listings]);

useEffect(() => {
  if (!listing) return;

  const viewTitle = cleanMachineTitle(cleanText(listing.title) || "Equipment Listing");
  const viewPrice = cleanText(listing.price) || "Call for Price";
  const viewHours = cleanText(listing.hours) || "Hours not listed";
  const viewLocation = cleanText(listing.location) || "Location not listed";
  const viewYear =
    cleanText(listing.year) ||
    viewTitle.match(/\b(19|20)\d{2}\b/)?.[0] ||
    "—";

  captureIXEvent("listing_viewed", {
    listingId: listing.id,
    authorId: listing.authorId,
    title: viewTitle,
    year: viewYear,
    make: cleanText(listing.make) || "—",
    model: cleanText(listing.model) || "—",
    price: viewPrice,
    hours: viewHours,
    location: viewLocation,
    category: listing.category || listing.type
  });
}, [listing]);


  

  const prevListing = null;
  const nextListing = null;
  
 if (passportError) {
  return (
    <main className="loading">
      <div>
        <strong>Machine Passport unavailable</strong>
        <p>{passportError}</p>
      </div>

      <style jsx>{`
        .loading {
          min-height: 100vh;
          display: grid;
          place-items: center;
          padding: 40px;
          background: #0b0b0b;
          color: #d6d6d6;
          font-family: Arial, sans-serif;
          text-align: center;
        }

        strong {
          display: block;
          margin-bottom: 10px;
          color: #f2f2f2;
          font-size: 20px;
        }

        p {
          margin: 0;
          color: rgba(255, 255, 255, 0.48);
          font-size: 13px;
        }
      `}</style>
    </main>
  );
}

if (!passport || !listing) {
  return (
    <main className="loading">
      Loading Machine Passport...
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

  const imageObjects = Array.isArray(listing?.imageObjects)
  ? listing.imageObjects
  : [];

const images = getListingImages(listing);

const activeImageObject =
  imageObjects[activeImage] ||
  { url: images[activeImage] };

const heroImage =
  images[activeImage] ||
  "/images/hero-equipment-yard.jpg";
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
  const location = cleanText(listing.location) || "";
  const cameFromBrowse = from === "browser";

  const year = cleanText(listing.year) || title.match(/\b(19|20)\d{2}\b/)?.[0] || "—";
  const make = cleanText(listing.make) || "—";
  const model = cleanText(listing.model) || "—";
  const serial =
  cleanText(
    listing.serialNumber ||
    listing.publicData?.serialNumber ||
    listing.vin ||
    listing.serial
  ) || "";

const stockNumber =
  cleanText(
    listing.stockNumber ||
    listing.publicData?.stockNumber
  ) || "";

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

const salesmanName =
  cleanText(passport?.salesmanName) || "";

const salesmanPhone =
  cleanText(passport?.salesmanPhone) || "";

const salesmanEmail =
  cleanText(passport?.salesmanEmail) || "";

 const description =
  cleanText(listing.description) ||
  cleanText(listing.publicData?.description) ||
  cleanText(listing.publicData?.details) ||
  "";

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

  const passportUrl =
  passport?.passportUrl ||
  `https://www.ironxchange.com/p/${passportId}`;

const listingUrl =
  typeof window !== "undefined"
    ? window.location.href
    : passportUrl;

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

const slugColors = ["none", "green", "yellow", "red", "cyan", "white", "blue", "orange"];

function cycleSlugColor(e) {
  e.preventDefault();
  e.stopPropagation();

  const currentIndex = slugColors.indexOf(slugIxiState.color || "none");
  const nextColor = slugColors[(currentIndex + 1) % slugColors.length];

  setSlugIxiState(current => ({
    ...current,
    color: nextColor
  }));
}

function cycleSlugOutline(e) {
  e.preventDefault();
  e.stopPropagation();

  const nextOutline =
    Number(slugIxiState.outline || 1) === 1 ? 3 :
    Number(slugIxiState.outline || 1) === 3 ? 5 :
    1;

  setSlugIxiState(current => ({
    ...current,
    outline: nextOutline
  }));
}



  return (

        <>
      <Head>
        <title>{title} | IXI Machine Passport</title>

        <link
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"
          rel="stylesheet"
        />
      </Head>

      <main>
        <Navbar />

       <section className="page">
  <div className="passport-shell">
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
           <div className={`hero-wrap slug-color-${slugIxiState.color || "none"} slug-outline-${slugIxiState.outline || 1}`}>
              <img
  src={heroImage}
  alt={title}
  className={`hero-photo ${getFrameClass(activeImageObject, "slugHero")}`}
  style={getFrameStyle(activeImageObject, "slugHero")}
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

          <section className="panel description">
            <div className="description-meta-row">
  <div className="description-meta-item description-heading">
    Description
  </div>

  <div className="description-meta-item">
    Serial : <span>{serial}</span>
  </div>

  <div className="description-meta-item">
    Stock : <span>{stockNumber}</span>
  </div>

  <div className="description-meta-item">
    Loc : <span>{location}</span>
  </div>
</div>

<p>{description}</p>
          </section>

          <section className="panel seller-panel">
  <div className="seller-company-block">
    <span className="seller-eyebrow">Presented By</span>

    <div className="seller-row">
      <SellerLogoDecal
        logo={sellerLogo}
        name={sellerName}
        variant="slug"
      />

      <div className="seller-company-copy">
        <strong>{sellerName}</strong>

        <p>{sellerCompanyName}</p>

        <p>{sellerLocation}</p>
      </div>
    </div>
  </div>

  <div className="salesman-block">
    <span className="salesman-label">Sales Contact</span>

    <div className="salesman-line">
      <span>Name</span>
      <strong>{salesmanName}</strong>
    </div>

    <div className="salesman-line">
      <span>Phone</span>
      <strong>{salesmanPhone}</strong>
    </div>

    <div className="salesman-line">
      <span>Email</span>
      <strong>{salesmanEmail}</strong>
    </div>
  </div>

  <div className="seller-actions">
    <a
      href={
        loggedIn
          ? `/inquire?listingId=${listing.id}`
          : `/login?next=${encodeURIComponent(
              `/inquire?listingId=${listing.id}`
            )}`
      }
      className="message-btn"
    >
      Message
    </a>

    <button
      type="button"
      className="call-btn"
      onClick={() => {
        if (salesmanPhone) {
          window.location.href = `tel:${salesmanPhone}`;
        }
      }}
    >
      Call
    </button>

    <a
      href={`/yard/${listing.authorId}`}
      className="yard-btn"
    >
      Seller Yard
    </a>
  </div>
</section>
<div className="passport-identity">
  <div>
    <strong>IXI Machine Passport</strong>
    <span>{passport?.passportId || ""}</span>
  </div>

  <span>Powered by IronXchange</span>
</div>
  </div>
</section>

       <IXInspectLightbox
  open={lightboxOpen}
  images={images}
  index={lightboxIndex}
  title={title}
  onClose={closeLightbox}
  onChange={setLightboxIndex}
  onInspectEvent={(event, payload) => {
    window.posthog?.capture?.(event, {
      listingId,
      ...payload
    });
  }}
/>
      </main>

      <Footer />

              <style jsx>{`
  :global(html),
  :global(body) {
    margin: 0;
    min-height: 100%;
    overflow-x: hidden;
    background: #090909;
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
  select,
  a {
    font-family: inherit;
    -webkit-font-smoothing: antialiased;
    text-rendering: geometricPrecision;
  }

  button {
    cursor: pointer;
  }

  a {
    color: inherit;
  }

  img {
    max-width: 100%;
  }

  ::selection {
    background: rgba(255, 196, 0, 0.28);
    color: #fff;
  }

  *:focus-visible {
    outline: 1px solid rgba(255, 196, 0, 0.45);
    outline-offset: 3px;
  }

  * {
    scrollbar-width: thin;
    scrollbar-color: rgba(255, 255, 255, 0.12) transparent;
  }

  *::-webkit-scrollbar {
    width: 7px;
    height: 7px;
  }

  *::-webkit-scrollbar-track {
    background: transparent;
  }

  *::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.12);
    border-radius: 999px;
  }

  *::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 196, 0, 0.24);
  }

  main {
    min-height: 100vh;
    background:
      radial-gradient(
        circle at top center,
        rgba(255, 196, 0, 0.025),
        transparent 28%
      ),
      radial-gradient(
        circle at 18% 12%,
        rgba(255, 255, 255, 0.015),
        transparent 22%
      ),
      #090909;
  }

  /* =========================================================
     PASSPORT OUTER FRAME
     ========================================================= */

  .page {
    width: 100%;
    max-width: 1530px;
    margin: 0 auto;
    padding: 18px 2.5% 42px;
  }

  .passport-shell {
    width: 100%;
    padding: 15px;

    background:
      linear-gradient(
        180deg,
        rgba(255, 255, 255, 0.017),
        rgba(255, 255, 255, 0)
      ),
      #101010;

    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 20px;

    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.025),
      0 32px 85px rgba(0, 0, 0, 0.34);
  }

  /* =========================================================
     CONTEXTUAL RETURN
     ========================================================= */

  .back-results {
    min-height: 25px;

    display: inline-flex;
    align-items: center;

    margin: 0 0 7px;
    padding: 0;

    appearance: none;
    background: transparent;
    border: 0;

    color: rgba(255, 255, 255, 0.36);

    font-size: 9px;
    font-weight: 900;
    letter-spacing: 0.68px;
    text-transform: uppercase;

    transition:
      color 0.14s ease,
      transform 0.14s ease;
  }

  .back-results:hover {
    color: rgba(255, 196, 0, 0.88);
    transform: translateX(-1px);
  }

  /* =========================================================
     MACHINE TITLE
     ========================================================= */

  .title-row {
    position: relative;

    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: end;
    gap: 20px;

    margin: 0 0 9px;
    padding: 0 2px 10px;

    border-bottom: 1px solid rgba(255, 255, 255, 0.055);
  }

  .title-row::after {
    content: "";

    position: absolute;
    left: 2px;
    bottom: -1px;

    width: 180px;
    height: 1px;

    background:
      linear-gradient(
        90deg,
        rgba(255, 196, 0, 0.34),
        transparent
      );
  }

  .title-row > div:first-child {
    min-width: 0;
  }

  h1 {
    margin: 0;

    display: flex;
    align-items: baseline;

    color: #f2f2f2;

    font-size: clamp(31px, 2.8vw, 44px);
    font-weight: 950;
    line-height: 0.94;
    letter-spacing: -1.2px;
    text-transform: uppercase;
  }

  .title-hours {
    display: inline-block;

    margin-left: clamp(40px, 9vw, 150px);

    color: rgba(255, 255, 255, 0.42);

    font-size: 0.6em;
    font-weight: 700;
    letter-spacing: -0.18px;

    white-space: nowrap;
    transform: translateY(-1px);
  }

  .title-row p {
    display: none;
  }

  .price {
    color: #f2f2f2;

    font-size: clamp(26px, 2vw, 36px);
    font-weight: 900;
    line-height: 1;
    letter-spacing: -0.8px;

    white-space: nowrap;
  }

  /* =========================================================
     DESKTOP PHOTOGRAPHY
     ========================================================= */

  .photo-grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 310px;
    align-items: start;
    gap: 12px;

    margin: 0 0 9px;
  }

  .hero-wrap {
    position: relative;

    min-width: 0;
    overflow: hidden;

    background: #101010;
    border-radius: 16px;

    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.035),
      0 26px 66px rgba(0, 0, 0, 0.31);
  }

  .hero-wrap::after {
    content: "";

    position: absolute;
    inset: 0;

    pointer-events: none;

    border-radius: 16px;

    box-shadow:
      inset 0 0 0 1px rgba(255, 255, 255, 0.04),
      inset 0 -80px 130px rgba(0, 0, 0, 0.15);
  }

  .hero-photo {
    width: 100%;
    height: 610px;

    display: block;

    object-fit: cover;

    background: #101010;
    border: 1px solid rgba(255, 255, 255, 0.055);
    border-radius: 16px;

    cursor: pointer;

    transition:
      filter 0.22s ease,
      transform 0.22s ease;
  }

  .hero-photo:hover {
    filter:
      contrast(1.035)
      saturate(1.025)
      brightness(1.01);

    transform: scale(1.002);
  }

  .photo-rail {
    height: 610px;

    display: grid;
    grid-auto-rows: 144px;
    gap: 11px;

    padding-right: 2px;

    overflow-y: auto;
  }

  .photo-rail img {
    width: 100%;
    height: 144px;

    display: block;

    object-fit: cover;

    background: #101010;
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 13px;

    opacity: 0.72;
    cursor: pointer;

    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.025),
      0 11px 24px rgba(0, 0, 0, 0.18);

    transition:
      opacity 0.16s ease,
      transform 0.16s ease,
      border-color 0.16s ease,
      filter 0.16s ease;
  }

  .photo-rail img:hover,
  .photo-rail img.active-thumb {
    opacity: 1;
    transform: translateY(-1px);

    border-color: rgba(255, 196, 0, 0.24);

    filter:
      contrast(1.03)
      saturate(1.02);
  }

  .photo-rail img.active-thumb {
    outline: 1px solid rgba(255, 196, 0, 0.2);
    outline-offset: -3px;
  }

  .arrow {
    position: absolute;
    top: 50%;
    z-index: 5;

    width: 23px;
    height: 92px;

    padding: 0;

    appearance: none;
    background: rgba(0, 0, 0, 0.07);
    border: 0;

    color: rgba(255, 255, 255, 0.42);

    font-size: 28px;
    font-weight: 300;

    opacity: 0;
    transform: translateY(-50%);

    transition:
      opacity 0.18s ease,
      color 0.18s ease,
      background 0.18s ease;
  }

  .hero-wrap:hover .arrow {
    opacity: 1;
  }

  .arrow:hover {
    color: rgba(255, 255, 255, 0.75);
    background: rgba(0, 0, 0, 0.18);
  }

  .arrow.left {
    left: 0;
    border-radius: 0 10px 10px 0;
  }

  .arrow.right {
    right: 0;
    border-radius: 10px 0 0 10px;
  }

  .mobile-gallery {
    display: none;
  }

  /* =========================================================
     SHARED INNER PANELS
     ========================================================= */

  .panel {
    background:
      linear-gradient(
        180deg,
        rgba(255, 255, 255, 0.027),
        rgba(255, 255, 255, 0)
      ),
      radial-gradient(
        circle at top,
        rgba(255, 255, 255, 0.015),
        transparent 72%
      ),
      #141414;

    border: 1px solid rgba(255, 255, 255, 0.062);
    border-radius: 15px;

    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.038),
      0 15px 36px rgba(0, 0, 0, 0.22);
  }

  .description,
  .seller-panel {
    margin-top: 9px;
  }

  /* =========================================================
     DESCRIPTION / IDENTITY LINE
     ========================================================= */

  .description {
    padding: 17px 20px 18px;
  }

  .description-meta-row {
    width: 100%;

    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    align-items: baseline;

    margin: 0 0 13px;
    padding: 0 0 11px;

    border-bottom: 1px solid rgba(255, 255, 255, 0.045);
  }

  .description-meta-item {
    min-width: 0;

    color: rgba(255, 255, 255, 0.84);

    font-size: 10.5px;
    font-weight: 950;
    letter-spacing: 0.7px;
    text-transform: uppercase;

    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .description-meta-item:nth-child(2),
  .description-meta-item:nth-child(3),
  .description-meta-item:nth-child(4) {
    text-align: center;
  }

  .description-meta-item span {
    color: rgba(255, 255, 255, 0.56);
  }

  .description p {
    max-width: 1180px;

    margin: 0;
    min-height: 1px;

    color: rgba(255, 255, 255, 0.7);

    font-size: 14px;
    font-weight: 500;
    line-height: 1.6;
    letter-spacing: 0.04px;

    white-space: pre-wrap;
  }

  /* =========================================================
     SELLER / SALESMAN / ACTIONS
     ========================================================= */

  .seller-panel {
    display: grid;
    grid-template-columns:
      minmax(300px, 1.15fr)
      minmax(245px, 0.85fr)
      auto;

    align-items: center;
    gap: 20px;

    padding: 16px 18px;
  }

  .seller-company-block,
  .seller-company-copy,
  .salesman-block {
    min-width: 0;
  }

  .seller-eyebrow,
  .salesman-label {
    display: block;

    margin: 0 0 8px;

    font-size: 8px;
    font-weight: 950;
    letter-spacing: 0.72px;
    text-transform: uppercase;
  }

  .seller-eyebrow {
    color: rgba(255, 196, 0, 0.88);
  }

  .salesman-label {
    color: rgba(255, 255, 255, 0.34);
  }

  .seller-row {
    display: flex;
    align-items: center;
    gap: 17px;

    min-width: 0;
  }

  .seller-company-copy strong {
    display: block;

    max-width: 100%;

    color: #f2f2f2;

    font-size: 17px;
    font-weight: 950;
    letter-spacing: -0.28px;

    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .seller-company-copy p {
    margin: 4px 0 0;

    color: rgba(255, 255, 255, 0.43);

    font-size: 9px;
    font-weight: 900;
    letter-spacing: 0.5px;
    text-transform: uppercase;

    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .salesman-block {
    padding-left: 20px;

    border-left: 1px solid rgba(255, 255, 255, 0.055);
  }

  .salesman-line {
    display: grid;
    grid-template-columns: 46px minmax(0, 1fr);
    align-items: baseline;
    gap: 9px;

    margin-top: 6px;
  }

  .salesman-line span {
    color: rgba(255, 255, 255, 0.29);

    font-size: 7.5px;
    font-weight: 950;
    letter-spacing: 0.56px;
    text-transform: uppercase;
  }

  .salesman-line strong {
    min-width: 0;

    color: rgba(255, 255, 255, 0.7);

    font-size: 10.5px;
    font-weight: 750;

    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .seller-actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 7px;

    min-width: 0;
  }

  .message-btn,
  .yard-btn,
  .call-btn {
    min-width: 84px;
    height: 34px;

    display: inline-flex;
    align-items: center;
    justify-content: center;

    margin: 0;
    padding: 0 12px;

    appearance: none;

    background:
      linear-gradient(
        180deg,
        rgba(255, 255, 255, 0.018),
        rgba(255, 255, 255, 0)
      ),
      #101010;

    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 9px;

    color: rgba(255, 255, 255, 0.75);

    font-size: 7.5px;
    font-weight: 950;
    line-height: 1;
    letter-spacing: 0.58px;
    text-align: center;
    text-decoration: none;
    text-transform: uppercase;
    white-space: nowrap;

    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.025);

    transition:
      color 0.14s ease,
      border-color 0.14s ease,
      background 0.14s ease,
      transform 0.14s ease,
      box-shadow 0.14s ease;
  }

  .message-btn {
    min-width: 91px;

    color: #ffc400;

    border-color: rgba(255, 196, 0, 0.23);

    background:
      linear-gradient(
        180deg,
        rgba(255, 196, 0, 0.07),
        rgba(255, 196, 0, 0)
      ),
      #131313;
  }

  .message-btn:hover,
  .yard-btn:hover,
  .call-btn:hover {
    color: #ffc400;

    border-color: rgba(255, 196, 0, 0.38);

    background:
      linear-gradient(
        180deg,
        rgba(255, 196, 0, 0.055),
        rgba(255, 196, 0, 0)
      ),
      #151515;

    transform: translateY(-1px);

    box-shadow:
      0 10px 24px rgba(0, 0, 0, 0.18);
  }

  /* =========================================================
     PASSPORT MARK
     ========================================================= */

  .passport-identity {
    min-height: 43px;

    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 18px;

    margin-top: 9px;
    padding: 11px 4px 0;

    border-top: 1px solid rgba(255, 255, 255, 0.045);

    color: rgba(255, 255, 255, 0.28);

    text-transform: uppercase;
  }

  .passport-identity > div {
    display: flex;
    align-items: baseline;
    gap: 12px;
  }

  .passport-identity strong {
    color: rgba(255, 255, 255, 0.57);

    font-size: 9px;
    font-weight: 950;
    letter-spacing: 0.72px;
  }

  .passport-identity span {
    font-size: 8px;
    font-weight: 900;
    letter-spacing: 0.64px;
  }

  /* =========================================================
     TABLET / MOBILE PHOTOGRAPHY
     ========================================================= */

  @media (max-width: 950px) {
    .page {
      padding: 14px 3.5% 36px;
    }

    .passport-shell {
      padding: 12px;
      border-radius: 17px;
    }

    .photo-grid {
      display: block;
      margin-bottom: 8px;
    }

    .hero-wrap,
    .photo-rail {
      display: none;
    }

    .mobile-gallery {
      display: flex;
      gap: 9px;

      overflow-x: auto;
      overflow-y: hidden;

      padding-bottom: 8px;

      scroll-snap-type: x mandatory;
      overscroll-behavior-x: contain;
      -webkit-overflow-scrolling: touch;
    }

    .mobile-hero {
      min-width: 80%;
      height: 420px;

      overflow: hidden;

      background: #101010;
      border: 1px solid rgba(255, 255, 255, 0.055);
      border-radius: 14px;

      scroll-snap-align: start;

      box-shadow:
        0 15px 36px rgba(0, 0, 0, 0.23);
    }

    .mobile-hero img {
      width: 100%;
      height: 100%;

      display: block;
      object-fit: cover;
    }

    .mobile-pair {
      min-width: 44vw;
      height: 420px;

      display: grid;
      grid-template-rows: 1fr 1fr;
      gap: 9px;

      scroll-snap-align: start;
    }

    .mobile-pair img {
      width: 100%;
      height: 205px;

      display: block;
      object-fit: cover;

      background: #101010;
      border: 1px solid rgba(255, 255, 255, 0.055);
      border-radius: 14px;

      box-shadow:
        0 11px 25px rgba(0, 0, 0, 0.18);
    }

    .seller-panel {
      grid-template-columns:
        minmax(260px, 1fr)
        minmax(215px, 0.8fr);

      gap: 18px;
    }

    .seller-actions {
      grid-column: 1 / -1;

      justify-content: flex-end;

      padding-top: 11px;

      border-top: 1px solid rgba(255, 255, 255, 0.045);
    }
  }

  /* =========================================================
     PHONE
     ========================================================= */

  @media (max-width: 700px) {
    .page {
      padding: 10px 0 28px;
    }

    .passport-shell {
      padding: 10px;

      border-left: 0;
      border-right: 0;
      border-radius: 0;

      box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.025),
        0 18px 45px rgba(0, 0, 0, 0.24);
    }

    .back-results {
      margin-left: 1px;
    }

    .title-row {
      grid-template-columns: 1fr;
      gap: 7px;

      padding-left: 1px;
      padding-right: 1px;
    }

    h1 {
      display: block;

      font-size: 26px;
      line-height: 0.97;
      letter-spacing: -0.82px;
    }

    .title-hours {
      margin-left: 9px;

      font-size: 0.58em;

      transform: none;
    }

    .price {
      width: fit-content;

      font-size: 22px;
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
      height: 158.5px;
    }

    .description {
      padding: 14px;
    }

    .description-meta-row {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 9px 14px;

      margin-bottom: 12px;
      padding-bottom: 10px;
    }

    .description-meta-item {
      text-align: left !important;
    }

    .description-meta-item:nth-child(2) {
      order: 1;
    }

    .description-meta-item:nth-child(3) {
      order: 2;
    }

    .description-meta-item:nth-child(4) {
      order: 3;
    }

    .description-heading {
      order: 4;
    }

    .description p {
      font-size: 13px;
      line-height: 1.52;
    }

    .seller-panel {
      grid-template-columns: 1fr;
      align-items: stretch;
      gap: 14px;

      padding: 14px;
    }

    .salesman-block {
      padding: 13px 0 0;

      border-top: 1px solid rgba(255, 255, 255, 0.05);
      border-left: 0;
    }

    .seller-actions {
      grid-column: auto;

      display: grid;
      grid-template-columns: 1fr;
      gap: 7px;

      width: 100%;
      padding-top: 13px;

      border-top: 1px solid rgba(255, 255, 255, 0.05);
    }

    .message-btn,
    .yard-btn,
    .call-btn {
      width: 100%;
      min-width: 0;
      height: 36px;
    }

    .passport-identity {
      align-items: flex-start;
      flex-direction: column;
      gap: 6px;

      min-height: 0;
      padding: 11px 3px 2px;
    }

    .passport-identity > div {
      flex-wrap: wrap;
    }
  }

  /* =========================================================
     NARROW PHONE
     ========================================================= */

  @media (max-width: 430px) {
    .description-meta-row {
      grid-template-columns: 1fr;
      gap: 8px;
    }

    .description-meta-item:nth-child(2) {
      order: 1;
    }

    .description-meta-item:nth-child(3) {
      order: 2;
    }

    .description-meta-item:nth-child(4) {
      order: 3;
    }

    .description-heading {
      order: 4;
    }

    .seller-row {
      gap: 12px;
    }

    .seller-company-copy strong {
      font-size: 15px;
    }
  }
`}</style>
    </>
  );
}
