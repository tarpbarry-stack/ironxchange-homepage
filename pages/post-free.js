import Head from "next/head";
import { useMemo, useState, useEffect } from "react";
import { createInstance, types as sdkTypes } from "sharetribe-flex-sdk";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import MachineBadges from "../components/MachineBadges";

import motorGradersTaxonomy from "../lib/motorGradersTaxonomy";
import wheelLoadersTaxonomy from "../lib/wheelLoadersTaxonomy";
import dozersTaxonomy from "../lib/dozersTaxonomy";
import excavatorsTaxonomy from "../lib/excavatorsTaxonomy";
import aerialTaxonomy from "../lib/aerialTaxonomy";
import aggregateTaxonomy from "../lib/aggregateTaxonomy";
import agricultureHarvestersTaxonomy from "../lib/agricultureHarvestersTaxonomy";
import agricultureTractorsTaxonomy from "../lib/agricultureTractorsTaxonomy";
import asphaltEquipmentTaxonomy from "../lib/asphaltEquipmentTaxonomy";
import backhoeLoadersTaxonomy from "../lib/backhoeLoadersTaxonomy";
import compactionRollersTaxonomy from "../lib/compactionRollersTaxonomy";
import cranesTaxonomy from "../lib/cranesTaxonomy";
import crawlerCarriersTaxonomy from "../lib/crawlerCarriersTaxonomy";
import drillsAndPilingTaxonomy from "../lib/drillsAndPilingTaxonomy";
import dumpTrucksTaxonomy from "../lib/dumpTrucksTaxonomy";
import forkliftsTaxonomy from "../lib/forkliftsTaxonomy";
import scraperTaxonomy from "../lib/scraperTaxonomy";
import skidSteerCtlTaxonomy from "../lib/skidSteerCtlTaxonomy";
import telehandlersTaxonomy from "../lib/telehandlersTaxonomy";
import trenchersTaxonomy from "../lib/trenchersTaxonomy";
import trailersTaxonomy from "../lib/trailersTaxonomy";
import trucksTaxonomy from "../lib/trucksTaxonomy";
import attachmentsPartsTaxonomy from "../lib/attachmentsPartsTaxonomy";
import supportEquipmentTaxonomy from "../lib/supportEquipmentTaxonomy";
import utilityCartsTaxonomy from "../lib/utilityCartsTaxonomy";

const BRAND_YELLOW = "#FFC400";

const { Money, UUID } = sdkTypes;

const sdk = createInstance({
  clientId: process.env.NEXT_PUBLIC_SHARETRIBE_CLIENT_ID
});

const taxonomyMap = {
  "AERIAL EQUIPMENT": aerialTaxonomy,
  "AGGREGATE": aggregateTaxonomy,
  "AGRICULTURE HARVESTERS": agricultureHarvestersTaxonomy,
  "AGRICULTURE TRACTORS": agricultureTractorsTaxonomy,
  "ASPHALT EQUIPMENT": asphaltEquipmentTaxonomy,
  "BACKHOE LOADERS": backhoeLoadersTaxonomy,
  "COMPACTION/ROLLERS": compactionRollersTaxonomy,
  "CRANES": cranesTaxonomy,
  "CRAWLER CARRIERS / LOADER": crawlerCarriersTaxonomy,
  "DOZERS": dozersTaxonomy,
  "DRILLS & PILING": drillsAndPilingTaxonomy,
  "DUMP TRUCKS - ARTIC/RIGID": dumpTrucksTaxonomy,
  "EXCAVATORS": excavatorsTaxonomy,
  "FORKLIFTS": forkliftsTaxonomy,
  "MOTOR GRADERS": motorGradersTaxonomy,
  "SCRAPER": scraperTaxonomy,
  "SKID STEER/CTL": skidSteerCtlTaxonomy,
  "TELEHANDLERS": telehandlersTaxonomy,
  "TRENCHERS/PLOWS": trenchersTaxonomy,
  "TRAILERS": trailersTaxonomy,
  "TRUCKS": trucksTaxonomy,
  "WHEEL LOADERS": wheelLoadersTaxonomy,
  "ATTACHMENTS / PARTS": attachmentsPartsTaxonomy,
  "SUPPORT EQUIPMENT": supportEquipmentTaxonomy,
  "UTILITY CARTS": utilityCartsTaxonomy
};

const categories = Object.keys(taxonomyMap);

const workflowOptions = [
  { value: "good-listing", label: "Good Listing" },
  { value: "reprice", label: "Reprice" },
  { value: "refresh-photos", label: "Refresh Photos" },
  { value: "social-blast", label: "Social Blast" },
  { value: "review", label: "Review" }
];

const stateOptions = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"
];

const commonKeywordOptions = [
  "aggregate configuration",
  "cold ac",
  "cold a/c",
  "heat",
  "cab",
  "enclosed cab",
  "rops",
  "fops",
  "backup camera",
  "camera system",
  "360 camera",
  "led lights",
  "work lights",
  "beacon",
  "strobe",
  "joystick controls",
  "pilot controls",
  "hydraulic controls",
  "electro hydraulic controls",
  "high flow hydraulics",
  "aux hydraulics",
  "quick coupler",
  "hydraulic coupler",
  "quick attach",
  "bucket",
  "forks",
  "ripper",
  "push block",
  "ride control",
  "payload system",
  "payload scales",
  "weigh system",
  "smartgrade",
  "smart grade",
  "topcon",
  "trimble",
  "gps",
  "grade control",
  "2d grade control",
  "3d grade control",
  "machine control",
  "machine guidance",
  "tier 3",
  "tier 4",
  "tier 4 final",
  "de-tier",
  "detier",
  "no def",
  "egr delete",
  "fresh service",
  "service records",
  "fleet maintained",
  "dealer maintained",
  "one owner",
  "municipal owned",
  "contractor owned",
  "owner operator",
  "tight machine",
  "straight machine",
  "ready to work",
  "job ready",
  "work ready",
  "field ready",
  "new tires",
  "good tires",
  "radial tires",
  "foam filled tires",
  "solid tires",
  "good undercarriage",
  "new undercarriage",
  "excellent undercarriage",
  "new tracks",
  "good tracks",
  "low hours",
  "clean machine",
  "excellent hydraulics",
  "strong hydraulics",
  "strong engine",
  "excellent engine"
];

function clean(value) {
  return value ? String(value).trim() : "";
}

function cleanNumber(value = "") {
  return String(value).replace(/[^0-9]/g, "");
}

function slugify(text = "") {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function formatMoney(value) {
  const raw = cleanNumber(value);
  if (!raw) return "Price";
  return `$${Number(raw).toLocaleString()}`;
}

function formatHours(value) {
  const raw = cleanNumber(value);
  if (!raw) return "Hrs";
  return `${Number(raw).toLocaleString()} hrs`;
}

function trackLaunchEvent(eventName, payload = {}) {
  if (typeof window === "undefined") return;

  try {
    window.posthog?.capture?.(eventName, payload);
  } catch (err) {
    console.warn("PostHog capture skipped:", err);
  }
}

function addActivity(type, message) {
  if (typeof window === "undefined") return;

  try {
    const event = {
      id: `${Date.now()}-${Math.random()}`,
      type,
      message,
      createdAt: new Date().toISOString()
    };

    const current = JSON.parse(localStorage.getItem("ixActivityLog") || "[]");

    localStorage.setItem(
      "ixActivityLog",
      JSON.stringify([event, ...current].slice(0, 50))
    );

    window.dispatchEvent(new Event("ix-activity-updated"));
  } catch (err) {
    console.error("Activity log failed", err);
  }

export default function PostFreePage() {
  const [category, setCategory] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("ix-category") || "EXCAVATORS";
    }

    return "EXCAVATORS";
  });

  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [hours, setHours] = useState("");
  const [price, setPrice] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [stockNumber, setStockNumber] = useState("");
  const [city, setCity] = useState("");
  const [stateCode, setStateCode] = useState("");
  const [description, setDescription] = useState("");

  const [photoItems, setPhotoItems] = useState([]);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [draggedPhotoIndex, setDraggedPhotoIndex] = useState(null);

  const [selectedKeywords, setSelectedKeywords] = useState([]);
  const [keywordSearch, setKeywordSearch] = useState("");
  const [workflowStatus, setWorkflowStatus] = useState("Good Listing");

  const [loggedIn, setLoggedIn] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState("");

  useEffect(() => {
    async function checkAuth() {
      try {
        await sdk.currentUser.show();
        setLoggedIn(true);
      } catch {
        setLoggedIn(false);
      }
    }

    checkAuth();
  }, []);

  const taxonomy = taxonomyMap[category] || [];

  const availableMakes = useMemo(() => {
    return Array.from(new Set(taxonomy.map(item => item.make).filter(Boolean)));
  }, [taxonomy]);

  const availableModels = useMemo(() => {
    return Array.from(
      new Set(
        taxonomy
          .filter(item => item.make === make)
          .map(item => item.model)
          .filter(Boolean)
      )
    );
  }, [taxonomy, make]);

  const title = useMemo(() => {
    const base = [year, make, model].filter(Boolean).join(" ");

    if (!base) return "Year Make Model";

    return hours
      ? `${base} – ${Number(cleanNumber(hours)).toLocaleString()} Hrs`
      : base;
  }, [year, make, model, hours]);

  const locationLabel = [city, stateCode].filter(Boolean).join(", ");

  const heroPhoto =
    photoItems[activePhotoIndex]?.url ||
    photoItems[0]?.url ||
    "/images/hero-equipment-yard.jpg";

  const availableKeywords = useMemo(() => {
    return Array.from(new Set([...commonKeywordOptions, ...selectedKeywords])).sort();
  }, [selectedKeywords]);

  const filteredKeywords = useMemo(() => {
    const search = keywordSearch.trim().toLowerCase();

    if (!search) return availableKeywords.slice(0, 500);

    return availableKeywords
      .filter(keyword => keyword.toLowerCase().includes(search))
      .slice(0, 500);
  }, [availableKeywords, keywordSearch]);

  const listingUrl = "";

  const marketplaceTitle = `${title} | ${formatHours(hours)} | ${locationLabel || "Location"}`;

  const shortDescription = `${title}
${formatHours(hours)} | ${locationLabel || "Location"}
${formatMoney(price)}

${selectedKeywords.slice(0, 6).join(" • ")}

Full specs + photos available on IronXchange.`;

  const longDescription = `${title}
${formatHours(hours)} | ${locationLabel || "Location"}
${formatMoney(price)}

${selectedKeywords.slice(0, 6).join(" • ")}

${description || "Clean machine. Full specs and photos available on IronXchange."}`;

  function toggleKeyword(keyword) {
    setSelectedKeywords(current =>
      current.includes(keyword)
        ? current.filter(item => item !== keyword)
        : [...current, keyword]
    );
  }

  function changeActivePhoto(direction) {
    if (photoItems.length === 0) return;

    setActivePhotoIndex(current => {
      const next = current + direction;
      if (next < 0) return photoItems.length - 1;
      if (next >= photoItems.length) return 0;
      return next;
    });
  }

  function handlePhotos(e) {
    const files = Array.from(e.target.files || []).filter(file =>
      file.type.startsWith("image/")
    );

    const mapped = files.slice(0, 24).map(file => ({
      id: `${Date.now()}-${file.name}-${Math.random()}`,
      file,
      url: URL.createObjectURL(file),
      existing: false
    }));

    setPhotoItems(current => [...current, ...mapped]);

    addActivity("success", `${mapped.length} photo${mapped.length === 1 ? "" : "s"} added`);
    trackLaunchEvent("post_free_photos_added", { count: mapped.length });

    e.target.value = "";
  }

  function handlePhotoDrop(e) {
    e.preventDefault();

    const files = Array.from(e.dataTransfer.files || []).filter(file =>
      file.type.startsWith("image/")
    );

    const mapped = files.slice(0, 24).map(file => ({
      id: `${Date.now()}-${file.name}-${Math.random()}`,
      file,
      url: URL.createObjectURL(file),
      existing: false
    }));

    setPhotoItems(current => [...current, ...mapped]);

    addActivity("success", `${mapped.length} photo${mapped.length === 1 ? "" : "s"} dropped`);
    trackLaunchEvent("post_free_photos_dropped", { count: mapped.length });
  }

  function removePhoto(indexToRemove) {
    setPhotoItems(current => current.filter((_, index) => index !== indexToRemove));
    setActivePhotoIndex(0);
  }

  function reorderPhotos(fromIndex, toIndex) {
    setPhotoItems(current => {
      if (fromIndex === null || fromIndex === toIndex) return current;

      const next = [...current];
      const [movedPhoto] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, movedPhoto);

      return next;
    });

    setActivePhotoIndex(toIndex);
  }

  async function copyText(label, text) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);

      addActivity("success", `${label} copied — ${title}`);
      trackLaunchEvent("post_free_copy_clicked", { label });

      setTimeout(() => setCopied(""), 1500);
    } catch {
      alert("Copy failed. Highlight and copy manually.");
    }
  }

    async function compressImage(file, maxWidth = 1600, quality = 0.82) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      const reader = new FileReader();

      reader.onload = event => {
        image.onload = () => {
          const scale = Math.min(1, maxWidth / image.width);
          const width = Math.round(image.width * scale);
          const height = Math.round(image.height * scale);

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          ctx.drawImage(image, 0, 0, width, height);

          canvas.toBlob(
            blob => {
              if (!blob) {
                reject(new Error("Image compression failed."));
                return;
              }

              const compressedFile = new File(
                [blob],
                file.name.replace(/\.[^.]+$/, ".jpg"),
                {
                  type: "image/jpeg",
                  lastModified: Date.now()
                }
              );

              resolve(compressedFile);
            },
            "image/jpeg",
            quality
          );
        };

        image.onerror = reject;
        image.src = event.target.result;
      };

      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function handleSubmit() {
    if (!loggedIn) {
      window.location.href = "/login";
      return;
    }

    if (!category || !year || !make || !model || !hours || !price) {
      alert("Category, year, make, model, hours, and price are required.");
      return;
    }

    setSaving(true);

    try {
      const uploadedImages = await Promise.all(
        photoItems.map(async photo => {
          const imageFile = await compressImage(photo.file);

          return sdk.images.upload(
            { image: imageFile },
            { expand: true }
          );
        })
      );

      const imageIds = uploadedImages.map(
        upload => new UUID(upload.data.data.id.uuid)
      );

      const categorySlug = slugify(category);
      const makeSlug = slugify(`${category}-${make}`);
      const modelSlug = slugify(`${category}-${make}-${model}`);

      const response = await sdk.ownListings.create({
        title,

        description,

        publicData: {
          categoryLevel1: categorySlug,
          categoryLevel2: makeSlug,
          categoryLevel3: modelSlug,

          category,
          year: String(year),
          make,
          model,

          hours: Number(cleanNumber(hours)),
          stockNumber,
          serialNumber,

          city,
          location: locationLabel,
          loc: stateCode,

          keywords: selectedKeywords,

          listingType: "free-listing",
          listingStatus: "live",

          transactionProcessAlias: "default-inquiry/release-1",
          unitType: "inquiry"
        },

        price: new Money(
          Number(cleanNumber(price)) * 100,
          "USD"
        ),

        images: imageIds
      });

      const listingId = response.data.data.id.uuid;

      addActivity("success", `Posted free listing — ${title}`);
      trackLaunchEvent("post_free_listing_created", {
        listingId,
        title,
        selectedKeywordCount: selectedKeywords.length,
        photoCount: photoItems.length
      });

      window.location.href = `/live?id=${listingId}`;
    } catch (err) {
      console.error("CREATE LISTING ERROR:", err);
      addActivity("error", `Post failed — ${title}`);
      alert(`Post failed: ${err.message || JSON.stringify(err)}`);
    } finally {
      setSaving(false);
    }
  }

  function launchExternal(platform, url, copyLabel, copy) {
    copyText(copyLabel, copy);

    trackLaunchEvent(`post_free_${platform}_clicked`, {
      title,
      listingUrl
    });

    window.open(url, "_blank", "noopener,noreferrer");
  }

  function launchWhatsApp() {
    const message = shortDescription;
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;

    launchExternal("whatsapp", url, "WhatsApp Message", message);
  }

  function launchMessenger() {
    launchExternal(
      "messenger",
      "https://www.messenger.com/",
      "Messenger Message",
      shortDescription
    );
  }

  function launchSms() {
    const url = `sms:?&body=${encodeURIComponent(shortDescription)}`;

    launchExternal("sms", url, "Text Message", shortDescription);
  }

  async function nativeShare() {
    const message = shortDescription;

    trackLaunchEvent("post_free_native_share_clicked", { title });

    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: message
        });
        return;
      } catch {
        // Native share cancelled. Fall back to copy.
      }
    }

    await copyText("Share Message", message);
  }

  return (
    <>
      <Head>
        <title>Post Free | IronXchange</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />

        <link
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"
          rel="stylesheet"
        />
      </Head>

      <main>
        <Navbar />

        <section className="launch-wrap">
          <section className="launch-header">
            <div className="launch-title">
              <button type="button" onClick={() => window.location.href = "/account/my-listings"}>
                ← Inventory
              </button>

              <div>
                <span>IronXchange Post Now</span>
                <h1>{title}</h1>
                <p>Add the machine. Build the card. Post it free. Then blast it everywhere.</p>
              </div>
            </div>

            <div className="launch-header-actions">
              <button type="button" className="status-command live">
                <span></span>
                Ready
              </button>

              <button
                type="button"
                className="save-top"
                onClick={handleSubmit}
                disabled={saving}
              >
                {saving ? "Posting..." : "Post Free"}
              </button>

              <button
                type="button"
                className="dashboard-top"
                onClick={() => window.location.href = "/account"}
              >
                Dashboard
              </button>
            </div>
          </section>

          <section className="photo-workbench">
            <div className="workbench-head">
              <div>
                <span>Photo Workbench</span>
                <strong>Drag to reorder • first image becomes hero</strong>
              </div>

              <label
                className="photo-add"
                onDragOver={e => e.preventDefault()}
                onDrop={handlePhotoDrop}
              >
                <input type="file" multiple accept="image/*" onChange={handlePhotos} />
                + Add Photos
              </label>
            </div>

            <div className="photo-strip">
              {photoItems.map((photo, index) => (
                <div
                  key={photo.id}
                  className={`photo-tile ${index === 0 ? "hero" : ""} ${
                    index === activePhotoIndex ? "active" : ""
                  }`}
                  draggable
                  onDragStart={() => setDraggedPhotoIndex(index)}
                  onDragOver={e => e.preventDefault()}
                  onDrop={() => {
                    reorderPhotos(draggedPhotoIndex, index);
                    setDraggedPhotoIndex(null);
                  }}
                  onClick={() => setActivePhotoIndex(index)}
                >
                  {index === 0 ? <span className="hero-badge">HERO</span> : null}

                  <img src={photo.url} alt={`Photo ${index + 1}`} />

                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation();
                      removePhoto(index);
                    }}
                    aria-label="Remove photo"
                  >
                    ×
                  </button>

                  <small>{index + 1}</small>
                </div>
              ))}
            </div>
          </section>

          <section className="studio-grid">
            <aside className="inventory-rail intake-rail">
              <div className="rail-head">
                <span>Machine Intake</span>
                <strong>Post Free</strong>
              </div>

              <div className="intake-scroll">
                <label>
                  Category
                  <select
                    value={category}
                    onChange={e => {
                      const nextCategory = e.target.value;

                      setCategory(nextCategory);
                      localStorage.setItem("ix-category", nextCategory);

                      setMake("");
                      setModel("");
                    }}
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Year
                  <input
                    value={year}
                    onChange={e => setYear(cleanNumber(e.target.value).slice(0, 4))}
                    placeholder="2021"
                  />
                </label>

                <label>
                  Make
                  <select
                    value={make}
                    onChange={e => {
                      setMake(e.target.value);
                      setModel("");
                    }}
                  >
                    <option value="">Select Make</option>
                    {availableMakes.map(item => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Model
                  <select
                    value={model}
                    onChange={e => setModel(e.target.value)}
                  >
                    <option value="">Select Model</option>
                    {availableModels.map(item => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Hours
                  <input
                    value={hours}
                    onChange={e => setHours(cleanNumber(e.target.value).slice(0, 5))}
                    placeholder="2222"
                  />
                </label>

                <label>
                  Price
                  <input
                    value={price}
                    onChange={e => setPrice(cleanNumber(e.target.value))}
                    placeholder="99999"
                  />
                </label>

                <div className="split-inputs">
                  <label>
                    Serial #
                    <input
                      value={serialNumber}
                      onChange={e => setSerialNumber(e.target.value)}
                      placeholder="Serial"
                    />
                  </label>

                  <label>
                    Stock #
                    <input
                      value={stockNumber}
                      onChange={e => setStockNumber(e.target.value)}
                      placeholder="Stock"
                    />
                  </label>
                </div>

                <div className="split-inputs city-state">
                  <label>
                    City
                    <input
                      value={city}
                      onChange={e => setCity(e.target.value)}
                      placeholder="Post"
                    />
                  </label>

                  <label>
                    State
                    <select
                      value={stateCode}
                      onChange={e => setStateCode(e.target.value)}
                    >
                      <option value="">ST</option>
                      {stateOptions.map(state => (
                        <option key={state} value={state}>
                          {state}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>
            </aside>

            <section className="preview-zone">
              <div className="card-nav-row">
                <button type="button" disabled>
                  ← Previous
                </button>

                <div>
                  <span>Buyer Card</span>
                  <strong>True marketplace-card preview</strong>
                </div>

                <button type="button" disabled>
                  Next →
                </button>
              </div>

              <div className="listing-preview-card">
                <div
                  className="preview-photo"
                  style={{
                    backgroundImage: `url(${heroPhoto || "/images/hero-equipment-yard.jpg"})`
                  }}
                  onClick={() => changeActivePhoto(1)}
                >
                  {photoItems.length > 1 ? (
                    <>
                      <button
                        type="button"
                        className="card-photo-nav left"
                        onClick={e => {
                          e.preventDefault();
                          e.stopPropagation();
                          changeActivePhoto(-1);
                        }}
                        aria-label="Previous photo"
                      >
                        ‹
                      </button>

                      <button
                        type="button"
                        className="card-photo-nav right"
                        onClick={e => {
                          e.preventDefault();
                          e.stopPropagation();
                          changeActivePhoto(1);
                        }}
                        aria-label="Next photo"
                      >
                        ›
                      </button>

                      <span className="photo-count">
                        {activePhotoIndex + 1}/{photoItems.length}
                      </span>
                    </>
                  ) : null}
                </div>

                <div className="preview-body">
                  <div className="preview-title-row">
                    <input
                      className="card-title-input"
                      value={title}
                      readOnly
                      title="Title is generated from year, make, model, and hours."
                    />

                    <input
                      className="card-hours-input"
                      value={formatHours(hours)}
                      onChange={e => setHours(cleanNumber(e.target.value))}
                    />
                  </div>

                  <div className="preview-keyword-row">
                    <MachineBadges
                      keywords={selectedKeywords.slice(0, 10)}
                      variant="studio"
                    />
                  </div>

                  <div className="preview-price-row">
                    <input
                      className="card-price-input"
                      value={formatMoney(price)}
                      onChange={e => setPrice(cleanNumber(e.target.value))}
                    />

                    <div className="preview-meta">
                      <button type="button" aria-label="Save preview star">
                        <i className="fa-regular fa-star"></i>
                      </button>

                      <input
                        className="card-location-input"
                        value={locationLabel}
                        onChange={e => setCity(e.target.value)}
                        placeholder="Location"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <aside className="distribution-center">
              <div className="distribution-head">
                <span>Distribution Center</span>
                <h2>Launch This Machine</h2>
                <p>
                  Post the machine once, then use IronXchange as the source card
                  for every buyer channel.
                </p>
              </div>

              <button type="button" className="launch-btn whatsapp" onClick={launchWhatsApp}>
                <i className="fa-brands fa-whatsapp"></i>
                <div>
                  <strong>WhatsApp Blast</strong>
                  <span>Copy machine message + open WhatsApp</span>
                </div>
              </button>

              <button type="button" className="launch-btn messenger" onClick={launchMessenger}>
                <i className="fa-brands fa-facebook-messenger"></i>
                <div>
                  <strong>Messenger Blast</strong>
                  <span>Copy buyer message + open Messenger</span>
                </div>
              </button>

              <button
                type="button"
                className="launch-btn marketplace"
                onClick={() =>
                  launchExternal(
                    "marketplace",
                    "https://www.facebook.com/marketplace/create/vehicle",
                    "Marketplace Copy",
                    longDescription
                  )
                }
              >
                <i className="fa-brands fa-facebook"></i>
                <div>
                  <strong>Facebook Marketplace</strong>
                  <span>Copy listing copy + open Marketplace</span>
                </div>
              </button>

              <button
                type="button"
                className="launch-btn facebook"
                onClick={() =>
                  launchExternal(
                    "facebook",
                    "https://www.facebook.com/",
                    "Facebook Post",
                    longDescription
                  )
                }
              >
                <i className="fa-brands fa-facebook-f"></i>
                <div>
                  <strong>Facebook Feed</strong>
                  <span>Copy post + open Facebook</span>
                </div>
              </button>

              <button
                type="button"
                className="launch-btn instagram"
                onClick={() =>
                  launchExternal(
                    "instagram",
                    "https://www.instagram.com/",
                    "Instagram Caption",
                    shortDescription
                  )
                }
              >
                <i className="fa-brands fa-instagram"></i>
                <div>
                  <strong>Instagram</strong>
                  <span>Copy caption + open Instagram</span>
                </div>
              </button>

              <button
                type="button"
                className="launch-btn linkedin"
                onClick={() =>
                  launchExternal(
                    "linkedin",
                    "https://www.linkedin.com/",
                    "LinkedIn Post",
                    longDescription
                  )
                }
              >
                <i className="fa-brands fa-linkedin-in"></i>
                <div>
                  <strong>LinkedIn</strong>
                  <span>Copy professional post + open LinkedIn</span>
                </div>
              </button>

              <button
                type="button"
                className="launch-btn tiktok"
                onClick={() =>
                  launchExternal(
                    "tiktok",
                    "https://www.tiktok.com/upload",
                    "TikTok Caption",
                    shortDescription
                  )
                }
              >
                <i className="fa-brands fa-tiktok"></i>
                <div>
                  <strong>TikTok</strong>
                  <span>Copy caption + open upload</span>
                </div>
              </button>

              <div className="utility-grid">
                <button type="button" onClick={launchSms}>
                  <i className="fa-solid fa-comment-sms"></i>
                  Text Blast
                </button>

                <button type="button" onClick={() => copyText("Marketplace Title", marketplaceTitle)}>
                  {copied === "Marketplace Title" ? "Copied" : "Title"}
                </button>

                <button type="button" onClick={() => copyText("Short Copy", shortDescription)}>
                  {copied === "Short Copy" ? "Copied" : "Short Copy"}
                </button>

                <button type="button" onClick={() => copyText("Long Copy", longDescription)}>
                  {copied === "Long Copy" ? "Copied" : "Long Copy"}
                </button>

                <button
                  type="button"
                  className="share-everywhere-btn"
                  onClick={nativeShare}
                >
                  <i className="fa-solid fa-arrow-up-from-bracket"></i>
                  Share Everywhere
                </button>
              </div>
            </aside>
          </section>

          <section className="lower-grid">
            <section className="panel badge-panel">
              <div className="panel-head">
                <h2>Badge Studio</h2>

                <div className="badge-head-actions">
                  <span>{selectedKeywords.length} selected</span>

                  <select
                    value={workflowStatus}
                    onChange={e => setWorkflowStatus(e.target.value)}
                  >
                    {workflowOptions.map(option => (
                      <option key={option.value} value={option.label}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="selected-badges">
                {selectedKeywords.slice(0, 16).map((keyword, index) => (
                  <button
                    key={`${keyword}-${index}`}
                    type="button"
                    onClick={() => toggleKeyword(keyword)}
                  >
                    {String(keyword).trim().toLowerCase()}
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                ))}
              </div>

              <input
                className="keyword-search"
                value={keywordSearch}
                onChange={e => setKeywordSearch(e.target.value)}
                placeholder="Search features, hydraulics, tires, GPS..."
              />

              <div className="keyword-grid">
                {filteredKeywords.map(keyword => (
                  <button
                    key={keyword}
                    type="button"
                    onClick={() => toggleKeyword(keyword)}
                    className={selectedKeywords.includes(keyword) ? "keyword-chip active" : "keyword-chip"}
                  >
                    {keyword}
                  </button>
                ))}
              </div>
            </section>

            <section className="panel copy-panel">
              <div className="panel-head">
                <h2>Sales Copy</h2>
                <span>Feeds your blasts</span>
              </div>

              <label className="wide">
                Description
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Condition, attachments, service, ownership history, and buyer-relevant notes..."
                />
              </label>

              <div className="save-row">
                <button
                  type="button"
                  className="save-btn"
                  onClick={handleSubmit}
                  disabled={saving}
                >
                  {saving ? "Posting..." : "Post Free"}
                </button>

                <button
                  type="button"
                  className="preview-btn"
                  onClick={() => copyText("Short Copy", shortDescription)}
                >
                  Copy Preview
                </button>
              </div>
            </section>
          </section>

          <section className="footer-ops">
            <section className="panel activity-panel">
              <div className="panel-head">
                <h2>Post Log</h2>
                <span>Recent actions</span>
              </div>

              <div className="activity-list">
                <div className="activity-item success">
                  <span>POST NOW READY</span>
                  <small>NOW</small>
                </div>

                <div className="activity-item">
                  <span>{photoItems.length} PHOTO{photoItems.length === 1 ? "" : "S"} LOADED</span>
                  <small>READY</small>
                </div>

                <div className="activity-item">
                  <span>{selectedKeywords.length} BADGE{selectedKeywords.length === 1 ? "" : "S"} SELECTED</span>
                  <small>SYNCED</small>
                </div>
              </div>
            </section>

            <section className="panel seller-panel">
              <div className="seller-icon">
                <i className="fa-regular fa-user"></i>
              </div>

              <div>
                <span>Seller</span>
                <strong>IronXchange Seller</strong>
                <p>Post once. Build the source card. Send the machine anywhere buyers live.</p>
              </div>
            </section>
          </section>
        </section>
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

        .launch-wrap {
          max-width: 1600px;
          margin: 0 auto;
          padding: 10px 2% 44px;
        }

        .panel,
        .launch-header,
        .photo-workbench,
        .inventory-rail,
        .distribution-center,
        .listing-preview-card {
          background:
            linear-gradient(180deg, rgba(255,255,255,.032), rgba(255,255,255,0)),
            radial-gradient(circle at top, rgba(255,255,255,.018), transparent 72%),
            #141414;
          border: 1px solid rgba(255,255,255,.065);
          outline: 1px solid rgba(255,255,255,.018);
          border-radius: 14px;
          box-shadow:
            0 1px 0 rgba(255,255,255,.045) inset,
            0 16px 38px rgba(0,0,0,.24);
        }

        .launch-header {
          min-height: 52px;
          margin-bottom: 8px;
          padding: 8px 12px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 14px;
        }

        .launch-title {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
        }

        .launch-title button,
        .card-nav-row button {
          height: 30px;
          padding: 0 11px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,.08);
          background:
            linear-gradient(180deg, rgba(255,255,255,.018), rgba(255,255,255,0)),
            #101010;
          color: rgba(255,255,255,.58);
          font-size: 8.5px;
          font-weight: 950;
          letter-spacing: .55px;
          text-transform: uppercase;
          cursor: pointer;
        }

        .launch-title button:hover,
        .card-nav-row button:hover:not(:disabled) {
          transform: translateY(-1px);
          color: #FFC400;
          border-color: rgba(255,196,0,.32);
          background: #151515;
        }

        .launch-title span,
        .workbench-head span,
        .rail-head span,
        .card-nav-row span,
        .distribution-head span {
          display: block;
          margin-bottom: 3px;
          color: #FFC400;
          font-size: 8px;
          font-weight: 950;
          letter-spacing: .78px;
          text-transform: uppercase;
        }

        .launch-title h1 {
          margin: 0;
          color: #f2f2f2;
          font-size: 18.5px;
          font-weight: 950;
          letter-spacing: -.5px;
          line-height: 1;
          text-transform: uppercase;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 620px;
        }

        .launch-title p,
        .distribution-head p,
        .seller-panel p {
          margin: 4px 0 0;
          color: rgba(255,255,255,.42);
          font-size: 11px;
          line-height: 1.35;
        }

        .launch-header-actions {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }

        .status-command,
        .save-top,
        .dashboard-top {
          height: 31px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,.08);
          background:
            linear-gradient(180deg, rgba(255,255,255,.018), rgba(255,255,255,0)),
            #101010;
          color: #f2f2f2;
          padding: 0 10px;
          font-size: 8.5px;
          font-weight: 950;
          letter-spacing: .55px;
          text-transform: uppercase;
          cursor: pointer;
        }

        .status-command {
          gap: 7px;
        }

        .status-command span {
          width: 7px;
          height: 7px;
          border-radius: 50%;
        }

        .status-command.live {
          color: #38A169;
          border-color: rgba(56,161,105,.42);
          background: rgba(56,161,105,.045);
          animation: livePulse 2.8s ease-in-out infinite;
        }

        .status-command.live span {
          background: #38A169;
          box-shadow: 0 0 10px rgba(56,161,105,.48);
        }

        .save-top,
        .save-btn {
          background:
            linear-gradient(180deg, rgba(255,255,255,.18), rgba(255,255,255,0)),
            #FFC400;
          border-color: #FFC400;
          color: #050505;
        }

        .photo-workbench {
          padding: 9px 12px 10px;
          margin-bottom: 9px;
        }

        .workbench-head {
          min-height: 30px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 14px;
          margin-bottom: 8px;
        }

        .workbench-head strong {
          display: block;
          color: rgba(255,255,255,.46);
          font-size: 9.5px;
          font-weight: 850;
          letter-spacing: .32px;
        }

        .photo-add {
          min-width: 126px;
          height: 28px;
          display: grid;
          place-items: center;
          border-radius: 999px;
          border: 1px dashed rgba(255,196,0,.30);
          background:
            linear-gradient(180deg, rgba(255,196,0,.06), rgba(255,196,0,0)),
            #101010;
          color: #FFC400;
          font-size: 8.5px;
          font-weight: 950;
          letter-spacing: .58px;
          text-transform: uppercase;
          cursor: pointer;
        }

        .photo-add input {
          display: none;
        }

        .photo-strip {
          display: flex;
          gap: 9px;
          overflow-x: auto;
          overflow-y: hidden;
          padding-bottom: 5px;
        }

        .photo-tile {
          position: relative;
          flex: 0 0 150px;
          height: 106px;
          overflow: hidden;
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,.07);
          background: #080808;
          cursor: grab;
          opacity: .72;
        }

        .photo-tile:hover,
        .photo-tile.active {
          opacity: 1;
          transform: translateY(-1px);
          border-color: rgba(255,196,0,.36);
        }

        .photo-tile.hero {
          border: 2px solid rgba(255,196,0,.94);
        }

        .photo-tile img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .hero-badge {
          position: absolute;
          top: 7px;
          left: 7px;
          z-index: 3;
          padding: 4px 7px;
          border-radius: 999px;
          background: #FFC400;
          color: #050505;
          font-size: 8px;
          font-weight: 950;
          letter-spacing: .35px;
        }

        .photo-tile button {
          position: absolute;
          top: 7px;
          right: 7px;
          z-index: 3;
          width: 22px;
          height: 22px;
          border: 1px solid rgba(255,255,255,.10);
          border-radius: 50%;
          background: rgba(185,28,28,.86);
          color: white;
          font-size: 13px;
          font-weight: 950;
          cursor: pointer;
        }

        .photo-tile small {
          position: absolute;
          bottom: 7px;
          right: 7px;
          z-index: 3;
          color: rgba(255,255,255,.72);
          font-size: 9px;
          font-weight: 950;
        }

        .studio-grid {
          display: grid;
          grid-template-columns: 230px minmax(360px, 1fr) 312px;
          gap: 10px;
          align-items: start;
          margin-bottom: 10px;
        }

        .inventory-rail,
        .distribution-center {
          height: 618px;
          padding: 12px;
          display: grid;
          align-content: start;
          gap: 9px;
          overflow: hidden;
        }

        .rail-head {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          gap: 10px;
          padding-bottom: 8px;
          border-bottom: 1px solid rgba(255,255,255,.052);
        }

        .rail-head strong {
          color: rgba(255,255,255,.50);
          font-size: 8.5px;
          font-weight: 950;
          letter-spacing: .62px;
          text-transform: uppercase;
        }

        .intake-scroll {
          display: grid;
          gap: 8px;
          max-height: 554px;
          overflow-y: auto;
          padding-right: 3px;
        }

        label {
          display: grid;
          gap: 5px;
          color: rgba(255,255,255,.44);
          font-size: 8.5px;
          font-weight: 950;
          letter-spacing: .62px;
          text-transform: uppercase;
        }

        input,
        select,
        textarea,
        .keyword-search {
          width: 100%;
          background:
            linear-gradient(180deg, rgba(255,255,255,.012), rgba(255,255,255,0)),
            #0c0c0c;
          border: 1px solid rgba(255,255,255,.08);
          border-radius: 10px;
          color: #f2f2f2;
          padding: 0 9px;
          font-size: 11px;
          outline: none;
          box-shadow: 0 1px 0 rgba(255,255,255,.018) inset;
        }

        input,
        select {
          height: 31px;
        }

        input:focus,
        select:focus,
        textarea:focus,
        .keyword-search:focus {
          border-color: rgba(255,196,0,.35);
          box-shadow:
            0 1px 0 rgba(255,255,255,.025) inset,
            0 0 0 1px rgba(255,196,0,.12);
        }

        .split-inputs {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 7px;
        }

        .city-state {
          grid-template-columns: 1fr 64px;
        }

        .preview-zone {
          min-width: 0;
          height: 618px;
          display: flex;
          flex-direction: column;
        }

        .card-nav-row {
          height: 34px;
          max-width: 430px;
          margin: 0 auto 8px;
          display: grid;
          grid-template-columns: 88px 1fr 88px;
          align-items: center;
          gap: 8px;
        }

        .card-nav-row div {
          text-align: center;
        }

        .card-nav-row strong {
          color: rgba(255,255,255,.54);
          font-size: 9.5px;
          font-weight: 850;
        }

        .card-nav-row button:disabled {
          opacity: .26;
          cursor: default;
        }

        .listing-preview-card {
          width: min(100%, 430px);
          margin: 24px auto 0;
          overflow: hidden;
          contain: layout paint;
          transform: scale(1.08);
          transform-origin: top center;
        }

        .listing-preview-card:hover {
          transform: translateY(-2px) scale(1.083);
          border-color: rgba(255,196,0,.14);
        }

        .preview-photo {
          position: relative;
          height: 250px;
          background-size: cover;
          background-position: center;
          border-bottom: 1px solid rgba(255,255,255,.065);
          overflow: hidden;
          cursor: pointer;
        }

        .listing-preview-card:hover .preview-photo {
          filter: contrast(1.04) saturate(1.03) brightness(1.01);
          transform: scale(1.018);
        }

        .card-photo-nav {
          position: absolute;
          top: 92%;
          transform: translateY(-50%);
          width: 24px;
          height: 90px;
          border: none;
          background: rgba(0,0,0,.03);
          color: rgba(255,255,255,.34);
          font-size: 28px;
          cursor: pointer;
          z-index: 5;
          opacity: 0;
        }

        .listing-preview-card:hover .card-photo-nav {
          opacity: 1;
        }

        .card-photo-nav.left {
          left: 0;
        }

        .card-photo-nav.right {
          right: 0;
        }

        .photo-count {
          position: absolute;
          top: 8px;
          right: 8px;
          padding: 3px 6px;
          border-radius: 999px;
          background: rgba(0,0,0,.18);
          color: rgba(255,255,255,.44);
          font-size: 8px;
          font-weight: 700;
          letter-spacing: .25px;
          z-index: 5;
        }

        .preview-body {
          padding: 13px 13px 12px;
        }

        .preview-title-row {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          gap: 10px;
        }

        .card-title-input,
        .card-hours-input,
        .card-price-input,
        .card-location-input {
          border: none;
          background: transparent;
          padding: 0;
          outline: none;
        }

        .card-title-input {
          min-width: 0;
          color: #f2f2f2;
          font-size: 18px;
          font-weight: 950;
          line-height: 1.1;
          letter-spacing: -.32px;
          text-transform: uppercase;
        }

        .card-hours-input {
          width: 92px;
          text-align: right;
          color: rgba(255,255,255,.54);
          font-size: 13px;
          font-weight: 500;
        }

        .preview-keyword-row {
          min-height: 56px;
          margin: 8px 0 14px;
          overflow: hidden;
        }

        .preview-price-row {
          position: relative;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 11px;
          border-top: 1px solid rgba(255,255,255,.045);
          gap: 12px;
        }

        .preview-price-row::before {
          content: "";
          position: absolute;
          top: -1px;
          left: 0;
          width: 32%;
          height: 1px;
          background: linear-gradient(90deg, rgba(255,196,0,.26), transparent);
        }

        .card-price-input {
          width: 150px;
          color: #f2f2f2;
          font-size: 20px;
          font-weight: 850;
        }

        .preview-meta {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 9px;
          min-width: 0;
          margin-left: auto;
        }

        .preview-meta button {
          width: 18px;
          height: 18px;
          border: none;
          background: transparent;
          color: rgba(255,255,255,.24);
          cursor: pointer;
          padding: 0;
        }

        .card-location-input {
          width: 150px;
          color: rgba(255,255,255,.48);
          font-size: 10.5px;
          font-weight: 850;
          letter-spacing: .42px;
          text-align: right;
          text-transform: uppercase;
        }

        .distribution-head h2 {
          margin: 0;
          color: #f2f2f2;
          font-size: 21px;
          font-weight: 950;
          letter-spacing: -.55px;
          text-transform: uppercase;
        }

        .launch-btn {
          min-height: 46px;
          display: flex;
          align-items: center;
          gap: 11px;
          border: none;
          border-radius: 12px;
          padding: 9px 11px;
          cursor: pointer;
          text-align: left;
        }

        .launch-btn i {
          font-size: 20px;
          width: 24px;
          text-align: center;
        }

        .launch-btn strong {
          display: block;
          font-size: 11.5px;
          font-weight: 950;
        }

        .launch-btn span {
          display: block;
          margin-top: 2px;
          font-size: 10px;
          font-weight: 700;
          opacity: .84;
          line-height: 1.2;
        }

        .launch-btn.whatsapp { background: #25D366; color: #06140a; }
        .launch-btn.messenger { background: linear-gradient(135deg, #00B2FF, #7B61FF); color: white; }
        .launch-btn.marketplace,
        .launch-btn.facebook { background: #1877F2; color: white; }
        .launch-btn.instagram { background: linear-gradient(135deg, #f58529, #dd2a7b, #8134af, #515bd4); color: white; }
        .launch-btn.linkedin { background: #0A66C2; color: white; }
        .launch-btn.tiktok {
          background: linear-gradient(135deg, #111, #050505);
          color: white;
          border: 1px solid rgba(255,255,255,.10);
        }

        .utility-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 7px;
          margin-top: 2px;
        }

        .utility-grid button,
        .preview-btn {
          min-height: 32px;
          border-radius: 10px;
          border: 1px solid rgba(255,255,255,.08);
          background:
            linear-gradient(180deg, rgba(255,255,255,.018), rgba(255,255,255,0)),
            #101010;
          color: #f2f2f2;
          font-size: 8.5px;
          font-weight: 950;
          letter-spacing: .55px;
          text-transform: uppercase;
          cursor: pointer;
        }

        .share-everywhere-btn {
          grid-column: 1 / -1 !important;
          min-height: 36px !important;
          background: linear-gradient(135deg, #FFC400, #ff8a00) !important;
          border-color: rgba(255,196,0,.72) !important;
          color: #050505 !important;
          animation: goldBreath 3.8s ease-in-out infinite;
        }

        .lower-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 420px;
          gap: 10px;
          margin-bottom: 10px;
        }

        .panel {
          padding: 13px 14px;
        }

        .panel-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          margin-bottom: 10px;
          padding-bottom: 8px;
          border-bottom: 1px solid rgba(255,255,255,.052);
        }

        .panel-head h2 {
          margin: 0;
          color: #f2f2f2;
          font-size: 13px;
          font-weight: 950;
          letter-spacing: .35px;
          text-transform: uppercase;
        }

        .panel-head span {
          color: #FFC400;
          font-size: 8px;
          font-weight: 950;
          letter-spacing: .65px;
          text-transform: uppercase;
        }

        .badge-head-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .badge-head-actions select {
          height: 28px;
          width: 126px;
          font-size: 8px;
          font-weight: 950;
          text-transform: uppercase;
        }

        textarea,
        .keyword-search {
          width: 100%;
          border-radius: 10px;
          color: #f2f2f2;
          padding: 10px 11px;
          font-size: 13px;
        }

        textarea {
          min-height: 148px;
          resize: vertical;
          line-height: 1.5;
        }

        .selected-badges {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-bottom: 10px;
        }

        .selected-badges button {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 5px 8px;
          border-radius: 999px;
          border: 1px solid rgba(255,196,0,.34);
          background: rgba(255,196,0,.06);
          color: #FFC400;
          font-size: 9px;
          font-weight: 900;
          text-transform: lowercase;
          cursor: pointer;
        }

        .keyword-search {
          margin-bottom: 8px;
        }

        .keyword-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          max-height: 188px;
          overflow-y: auto;
          border: 1px solid rgba(255,255,255,.055);
          border-radius: 12px;
          background: #0f0f0f;
          padding: 9px;
        }

        .keyword-chip {
          padding: 5px 7px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,.055);
          background: rgba(255,255,255,.018);
          color: rgba(255,255,255,.42);
          font-size: 9.5px;
          font-weight: 800;
          line-height: 1;
          text-transform: lowercase;
          cursor: pointer;
        }

        .keyword-chip.active {
          color: #FFC400;
          border-color: rgba(255,196,0,.38);
          background:
            linear-gradient(180deg, rgba(255,196,0,.09), rgba(255,196,0,.025)),
            #111;
        }

        .save-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          margin-top: 10px;
        }

        .save-btn,
        .preview-btn {
          min-height: 38px;
          border-radius: 11px;
          display: flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          font-size: 9px;
          font-weight: 950;
          letter-spacing: .58px;
          text-transform: uppercase;
          cursor: pointer;
        }

        .footer-ops {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        .activity-list {
          display: grid;
          gap: 7px;
        }

        .activity-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          background: #101010;
          border: 1px solid rgba(255,255,255,.06);
          border-radius: 11px;
          padding: 10px;
        }

        .activity-item.success {
          border-color: rgba(56,161,105,.30);
        }

        .activity-item span {
          color: #f2f2f2;
          font-size: 10px;
          font-weight: 950;
          letter-spacing: .35px;
        }

        .activity-item small {
          color: rgba(255,255,255,.42);
          font-size: 8.5px;
          font-weight: 900;
          letter-spacing: .36px;
          white-space: nowrap;
          text-transform: uppercase;
        }

        .seller-panel {
          display: grid;
          grid-template-columns: 70px 1fr;
          gap: 14px;
          align-items: center;
        }

        .seller-icon {
          width: 58px;
          height: 58px;
          border: 1px solid rgba(255,255,255,.10);
          border-radius: 50%;
          display: grid;
          place-items: center;
          color: rgba(255,255,255,.52);
          background: #101010;
        }

        .seller-panel span {
          display: block;
          margin-bottom: 5px;
          color: rgba(255,255,255,.44);
          font-size: 8.5px;
          font-weight: 950;
          letter-spacing: .62px;
          text-transform: uppercase;
        }

        .seller-panel strong {
          color: #f2f2f2;
          font-size: 18px;
          font-weight: 950;
          letter-spacing: -.24px;
        }

        @keyframes livePulse {
          0%, 100% { box-shadow: 0 0 0 rgba(56,161,105,0); }
          50% { box-shadow: 0 0 10px rgba(56,161,105,.28); }
        }

        @keyframes goldBreath {
          0%, 100% {
            box-shadow:
              0 1px 0 rgba(255,255,255,.20) inset,
              0 10px 24px rgba(255,196,0,.12);
          }

          50% {
            box-shadow:
              0 1px 0 rgba(255,255,255,.25) inset,
              0 12px 30px rgba(255,196,0,.22);
          }
        }

        @media (max-width: 980px) {
          .studio-grid {
            grid-template-columns: 1fr;
          }

          .preview-zone {
            order: 1;
            height: auto;
          }

          .distribution-center {
            order: 3;
            height: auto;
          }

          .inventory-rail {
            order: 4;
            height: auto;
          }

          .listing-preview-card {
            transform: none;
          }

          .listing-preview-card:hover {
            transform: translateY(-2px);
          }

          .lower-grid,
          .footer-ops {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
}          
