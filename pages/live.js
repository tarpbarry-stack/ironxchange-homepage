import Head from "next/head";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const BRAND_YELLOW = "#FFC400";

const workflowOptions = [
  "Good Listing",
  "Reprice",
  "Refresh Photos",
  "Social Blast",
  "Review"
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

function slugify(text = "") {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function clean(value) {
  return value ? String(value).trim() : "";
}

function cleanNumber(value = "") {
  return String(value).replace(/[^0-9]/g, "");
}

function formatMoney(value) {
  const raw = cleanNumber(value);
  if (!raw) return "Call for price";
  return `$${Number(raw).toLocaleString()}`;
}

function formatHours(value) {
  const raw = cleanNumber(value);
  if (!raw) return "—";
  return `${Number(raw).toLocaleString()} hrs`;
}

function cleanMachineTitle(title = "") {
  return String(title)
    .replace(/\s*[-–]?\s*\d{1,5}(,\d{3})*\s*(HRS|Hrs|hrs|Hours|hours)\b/g, "")
    .replace(/\s*[-–]\s*$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function getImageUrl(img) {
  if (!img) return null;
  if (typeof img === "string") return img;

  return (
    img.url ||
    img.src ||
    img.attributes?.variants?.default?.url ||
    img.attributes?.variants?.["landscape-crop"]?.url ||
    img.attributes?.variants?.["scaled-large"]?.url ||
    img.attributes?.variants?.["scaled-medium"]?.url ||
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

  return [...new Set(rawImages.map(getImageUrl).filter(Boolean))];
}

function getListingKeywords(listing) {
  const raw =
    listing?.keywords ||
    listing?.tags ||
    listing?.publicData?.keywords ||
    listing?.attributes?.publicData?.keywords ||
    [];

  if (Array.isArray(raw)) return raw.filter(Boolean).map(String);

  if (typeof raw === "string") {
    return raw
      .split(",")
      .map(item => item.trim())
      .filter(Boolean);
  }

  return [];
}

function getWorkflowStatus(listing = {}) {
  return (
    listing.workflowStatus ||
    listing.publicData?.workflowStatus ||
    listing.attributes?.publicData?.workflowStatus ||
    listing.metadata?.workflowStatus ||
    "Good Listing"
  );
}

function getListingStatus(listing = {}) {
  return (
    listing.listingStatus ||
    listing.publicData?.listingStatus ||
    listing.attributes?.publicData?.listingStatus ||
    listing.metadata?.listingStatus ||
    "live"
  );
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
}

function getListingUrl(listing) {
  if (!listing?.title || typeof window === "undefined") return "";
  return `${window.location.origin}/listing/${slugify(listing.title)}?from=launch-studio`;
}

async function downloadImage(url, filename) {
  const response = await fetch(url);
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = objectUrl;
  link.download = filename;

  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(objectUrl);
}

function buildSocialCopy(platform, listing, listingUrl, selectedKeywords = []) {
  const title = clean(listing?.title) || "Equipment Listing";
  const price = formatMoney(listing?.price);
  const hours = formatHours(listing?.hours);
  const location = clean(listing?.location) || "Location not listed";
  const description =
    clean(listing?.description) ||
    clean(listing?.publicData?.description) ||
    "Clean machine. Full specs and photos available on IronXchange.";

  const features = selectedKeywords.slice(0, 6).join(" • ");
  const linkLine = `Full specs + photos:\n${listingUrl}`;

  if (platform === "marketplace") {
    return `${title}
${hours} | ${location}
${price}

${features}

${description}

${linkLine}`;
  }

  if (platform === "linkedin") {
    return `${title}

${hours} | ${location}
${price}

${features}

${description}

${linkLine}

#IronXchange #HeavyEquipment #ConstructionEquipment`;
  }

  if (platform === "instagram") {
    return `${title}
${hours} | ${location}
${price}

${features}

${linkLine}

#IronXchange #HeavyEquipment #YellowIron #ConstructionEquipment`;
  }

  if (platform === "tiktok") {
    return `${title}
${hours} | ${location}
${price}

${linkLine}

#IronXchange #HeavyEquipment #ConstructionEquipment`;
  }

  return `${title}
${hours} | ${location}
${price}

${features}

${description}

${linkLine}`;
}

export default function ListingLivePage() {
  const router = useRouter();
  const { id } = router.query;

  const [loading, setLoading] = useState(true);
  const [listings, setListings] = useState([]);
  const [copied, setCopied] = useState("");
  const [saving, setSaving] = useState(false);
  const [commandBusy, setCommandBusy] = useState("");

  const [edit, setEdit] = useState({
    price: "",
    hours: "",
    location: "",
    description: ""
  });

  const [photoItems, setPhotoItems] = useState([]);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [draggedPhotoIndex, setDraggedPhotoIndex] = useState(null);

  const [selectedKeywords, setSelectedKeywords] = useState([]);
  const [keywordSearch, setKeywordSearch] = useState("");
  const [workflowStatus, setWorkflowStatus] = useState("Good Listing");

  useEffect(() => {
    fetch("/api/listings")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setListings(data);
      })
      .catch(err => console.error("Launch Studio load failed:", err))
      .finally(() => setLoading(false));
  }, []);

  const listing = useMemo(() => {
    if (!id || listings.length === 0) return null;
    return listings.find(item => String(item.id) === String(id)) || null;
  }, [id, listings]);

  const listingUrl = listing ? getListingUrl(listing) : "";
  const listingStatus = getListingStatus(listing || {});
  const isPaused = listingStatus === "paused";

  useEffect(() => {
    if (!listing) return;

    setEdit({
      price: clean(listing.price),
      hours: clean(listing.hours),
      location: clean(listing.location),
      description: clean(listing.description || listing.publicData?.description)
    });

    setSelectedKeywords(getListingKeywords(listing));
    setWorkflowStatus(getWorkflowStatus(listing));

    setPhotoItems(
      getListingImages(listing).map((url, index) => ({
        id: `existing-${index}-${url}`,
        url,
        file: null,
        existing: true
      }))
    );

    setActivePhotoIndex(0);
  }, [listing]);

  const heroPhoto =
    photoItems[activePhotoIndex]?.url ||
    photoItems[0]?.url ||
    listing?.imageUrl ||
    listing?.image ||
    "/images/hero-equipment-yard.jpg";

  const title = cleanMachineTitle(listing?.title || "Machine Listing");
  const category =
    clean(listing?.type || listing?.category || listing?.publicData?.category) ||
    "Category not listed";

  const sellerName =
    clean(listing?.sellerName) ||
    clean(listing?.sellerCompany) ||
    clean(listing?.authorName) ||
    "IronXchange Seller";

  const sellerLogo = listing?.sellerLogo || listing?.profileImage || "";

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

  const marketplaceTitle = listing
    ? `${clean(listing.title)} | ${formatHours(edit.hours || listing.hours)} | ${clean(edit.location || listing.location)}`
    : "";

  const shortDescription = listing
    ? `
${clean(listing.title)}
${formatHours(edit.hours || listing.hours)} | ${clean(edit.location || listing.location)}

${formatMoney(edit.price || listing.price)}

Full specs + photos:
${listingUrl}
`.trim()
    : "";

  const longDescription = listing
    ? `
${clean(listing.title)}

${formatHours(edit.hours || listing.hours)} | ${clean(edit.location || listing.location)}
${formatMoney(edit.price || listing.price)}

${selectedKeywords.slice(0, 8).join(" • ")}

${clean(edit.description || listing.description)}

Full specs + photos:
${listingUrl}

Listed on IronXchange.
`.trim()
    : "";

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
  }

  function removePhoto(indexToRemove) {
    setPhotoItems(current => current.filter((_, index) => index !== indexToRemove));
    setActivePhotoIndex(0);
    addActivity("success", `Photo removed — ${title}`);
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
    addActivity("success", `Photo order changed — ${title}`);
  }

  async function copyText(label, text) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      addActivity("success", `${label} copied — ${title}`);
      setTimeout(() => setCopied(""), 1500);
    } catch {
      addActivity("error", `${label} copy failed — ${title}`);
      alert("Copy failed. Highlight and copy manually.");
    }
  }

  async function downloadHeroImage() {
    const hero = photoItems[0]?.url || heroPhoto;

    if (!hero) {
      alert("No image found.");
      return;
    }

    await downloadImage(hero, `${slugify(title)}-hero.jpg`);
    addActivity("success", `Hero image downloaded — ${title}`);
  }

  async function downloadAllPhotos() {
    if (photoItems.length === 0) {
      alert("No photos found.");
      return;
    }

    for (let i = 0; i < photoItems.length; i += 1) {
      await downloadImage(photoItems[i].url, `${slugify(title)}-${i + 1}.jpg`);
    }

    addActivity("success", `Photo pack downloaded — ${title}`);
  }

  async function saveQuickEdit() {
    if (!listing?.id) return;

    setSaving(true);

    try {
      const detailsResponse = await fetch("/api/update-listing-details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId: String(listing.id),
          hours: edit.hours,
          location: edit.location,
          description: edit.description,
          keywords: selectedKeywords
        })
      });

      const detailsData = await detailsResponse.json();

      if (!detailsResponse.ok) {
        throw new Error(detailsData?.error || "Details update failed");
      }

      if (cleanNumber(edit.price)) {
        const priceResponse = await fetch("/api/update-listing-price", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            listingId: String(listing.id),
            price: cleanNumber(edit.price)
          })
        });

        const priceData = await priceResponse.json();

        if (!priceResponse.ok) {
          throw new Error(priceData?.error || "Price update failed");
        }
      }

      addActivity("success", `Listing saved — ${title}`);
      alert("Saved. Listing updates applied.");
    } catch (err) {
      console.error("SAVE QUICK EDIT ERROR:", err);
      addActivity("error", `Save failed — ${title}`);
      alert(`Save failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  }

  async function updateWorkflow(nextWorkflow) {
    if (!listing?.id) return;

    setWorkflowStatus(nextWorkflow);

    try {
      const response = await fetch("/api/update-listing-workflow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId: String(listing.id),
          workflowStatus: nextWorkflow
        })
      });

      if (!response.ok) throw new Error("Workflow update failed");

      addActivity("success", `Workflow set to ${nextWorkflow} — ${title}`);
    } catch (err) {
      console.error(err);
      addActivity("error", `Workflow update failed — ${title}`);
      alert("Workflow update failed.");
    }
  }

  async function runListingCommand(action) {
    if (!listing?.id) return;

    setCommandBusy(action);

    try {
      const endpoint =
        action === "pause"
          ? "/api/pause-listing"
          : action === "reactivate"
            ? "/api/reactivate-listing"
            : "";

      if (!endpoint) {
        addActivity("success", `${action} selected — ${title}`);
        alert(`${action} action logged. API wiring comes next.`);
        return;
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId: String(listing.id)
        })
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data?.error || `${action} failed`);

      addActivity("success", `${action} complete — ${title}`);
      router.reload();
    } catch (err) {
      console.error(err);
      addActivity("error", `${action} failed — ${title}`);
      alert(`${action} failed: ${err.message}`);
    } finally {
      setCommandBusy("");
    }
  }

  function launchExternal(url, copyLabel, copy) {
    copyText(copyLabel, copy);
    window.open(url, "_blank", "noopener,noreferrer");
  }

  if (loading) {
    return (
      <main className="loading">
        Loading Launch Studio...
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

  return (

        <>
      <Head>
        <title>{title} Launch Studio | IronXchange</title>

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
              <button type="button" onClick={() => router.push("/account/my-listings")}>
                ← Inventory
              </button>

              <div>
                <span>IronXchange Launch Studio</span>
                <h1>{title}</h1>
                <p>Build the card. Blast the machine. Keep IronXchange as the source link.</p>
              </div>
            </div>

            <div className="launch-header-actions">
              <div className={isPaused ? "status-pill paused" : "status-pill live"}>
                <span></span>
                {isPaused ? "Paused" : "Live"}
              </div>

              <select
                className="workflow-select"
                value={workflowStatus}
                onChange={e => updateWorkflow(e.target.value)}
              >
                {workflowOptions.map(option => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>

              <button
                type="button"
                className="save-top"
                onClick={saveQuickEdit}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save"}
              </button>

              <a href={listingUrl} target="_blank" rel="noreferrer" className="public-link">
                View Public
              </a>
            </div>
          </section>

          <section className="photo-workbench">
            <div className="workbench-head">
              <div>
                <span>Photo Workbench</span>
                <strong>First photo is your buyer-card hero. Drag to reorder.</strong>
              </div>

              <label
                className="photo-add"
                onDragOver={e => e.preventDefault()}
                onDrop={handlePhotoDrop}
              >
                <input type="file" multiple accept="image/*" onChange={handlePhotos} />
                + Add / Drop Photos
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
            <aside className="left-toolbar">
              <div className="toolbar-head">
                <span>Machine Data</span>
                <strong>Source Facts</strong>
              </div>

              <div className="data-stack">
                <div>
                  <span>Year</span>
                  <strong>{listing.year || listing.publicData?.year || "—"}</strong>
                </div>

                <div>
                  <span>Make</span>
                  <strong>{listing.make || listing.publicData?.make || "—"}</strong>
                </div>

                <div>
                  <span>Model</span>
                  <strong>{listing.model || listing.publicData?.model || "—"}</strong>
                </div>

                <div>
                  <span>Category</span>
                  <strong>{category}</strong>
                </div>

                <div>
                  <span>Stock #</span>
                  <strong>{listing.stockNumber || listing.publicData?.stockNumber || "—"}</strong>
                </div>

                <div>
                  <span>Seller</span>
                  <strong>{sellerName}</strong>
                </div>
              </div>

              <div className="toolbar-actions">
                <button
                  type="button"
                  onClick={() => runListingCommand(isPaused ? "reactivate" : "pause")}
                  disabled={!!commandBusy}
                >
                  {commandBusy
                    ? "Working..."
                    : isPaused
                      ? "Reactivate"
                      : "Pause"}
                </button>

                <button type="button" onClick={downloadHeroImage}>
                  Hero Image
                </button>

                <button type="button" onClick={downloadAllPhotos}>
                  Photo Pack
                </button>
              </div>
            </aside>

            <section className="preview-zone">
              <div className="section-label">
                <span>Live Buyer Card</span>
                <strong>What buyers see before they click.</strong>
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
                      title="Title is generated from listing year, make, model, and hours."
                    />

                    <input
                      className="card-hours-input"
                      value={formatHours(edit.hours || listing.hours)}
                      onChange={e => setEdit({ ...edit, hours: cleanNumber(e.target.value) })}
                    />
                  </div>

                  <div className="preview-keyword-row">
                    {selectedKeywords.slice(0, 8).map((keyword, index) => (
                      <span key={`${keyword}-${index}`}>
                        {String(keyword).trim().toLowerCase()}
                      </span>
                    ))}
                  </div>

                  <div className="preview-price-row">
                    <input
                      className="card-price-input"
                      value={formatMoney(edit.price || listing.price)}
                      onChange={e => setEdit({ ...edit, price: cleanNumber(e.target.value) })}
                    />

                    <div className="preview-meta">
                      <button type="button" aria-label="Save preview star">
                        <i className="fa-regular fa-star"></i>
                      </button>

                      <input
                        className="card-location-input"
                        value={edit.location || listing.location || ""}
                        onChange={e => setEdit({ ...edit, location: e.target.value })}
                        placeholder="Location"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="micro-note">
                Change price, hours, location, badges, and hero photo — the card updates here before you launch.
              </div>
            </section>

            <aside className="distribution-center">
              <div className="distribution-head">
                <span>Distribution Center</span>
                <h2>Launch This Machine</h2>
                <p>
                  Copy the sales copy, open the platform, and send buyers back to the
                  IronXchange source page.
                </p>
              </div>

              <button
                type="button"
                className="launch-btn marketplace"
                onClick={() =>
                  launchExternal(
                    "https://www.facebook.com/marketplace/create/vehicle",
                    "Marketplace Copy",
                    buildSocialCopy("marketplace", listing, listingUrl, selectedKeywords)
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
                    `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(listingUrl)}`,
                    "Facebook Post",
                    buildSocialCopy("facebook", listing, listingUrl, selectedKeywords)
                  )
                }
              >
                <i className="fa-brands fa-facebook-f"></i>
                <div>
                  <strong>Facebook Feed</strong>
                  <span>Copy post + share source link</span>
                </div>
              </button>

              <button
                type="button"
                className="launch-btn instagram"
                onClick={() =>
                  launchExternal(
                    "https://www.instagram.com/",
                    "Instagram Caption",
                    buildSocialCopy("instagram", listing, listingUrl, selectedKeywords)
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
                    `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(listingUrl)}`,
                    "LinkedIn Post",
                    buildSocialCopy("linkedin", listing, listingUrl, selectedKeywords)
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
                    "https://www.tiktok.com/upload",
                    "TikTok Caption",
                    buildSocialCopy("tiktok", listing, listingUrl, selectedKeywords)
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
                <button type="button" onClick={() => copyText("Listing Link", listingUrl)}>
                  {copied === "Listing Link" ? "Copied" : "Copy Link"}
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
              </div>
            </aside>
          </section>

          <section className="lower-grid">
            <section className="panel badge-panel">
              <div className="panel-head">
                <h2>Badge Studio</h2>
                <span>{selectedKeywords.length} selected</span>
              </div>

              <div className="selected-badges">
                {selectedKeywords.slice(0, 14).map((keyword, index) => (
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
                <span>description feeds your social blast</span>
              </div>

              <label className="wide">
                Description
                <textarea
                  value={edit.description}
                  onChange={e => setEdit({ ...edit, description: e.target.value })}
                  placeholder="Describe condition, attachments, maintenance, ownership history, and buyer-relevant details..."
                />
              </label>

              <div className="save-row">
                <button
                  type="button"
                  className="save-btn"
                  onClick={saveQuickEdit}
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save Listing"}
                </button>

                <a href={listingUrl} target="_blank" rel="noreferrer" className="preview-btn">
                  View Public Page
                </a>
              </div>
            </section>
          </section>

          <section className="footer-ops">
            <section className="panel activity-panel">
              <div className="panel-head">
                <h2>Launch Log</h2>
                <span>recent actions</span>
              </div>

              <div className="activity-list">
                <div className="activity-item success">
                  <span>LAUNCH STUDIO READY</span>
                  <small>NOW</small>
                </div>

                <div className="activity-item">
                  <span>WORKFLOW: {workflowStatus.toUpperCase()}</span>
                  <small>SYNCED</small>
                </div>

                <div className="activity-item">
                  <span>SOURCE LINK READY</span>
                  <small>READY</small>
                </div>
              </div>
            </section>

            <section className="panel seller-panel">
              {sellerLogo ? (
                <img src={sellerLogo} alt={sellerName} />
              ) : (
                <div className="seller-icon">
                  <i className="fa-regular fa-user"></i>
                </div>
              )}

              <div>
                <span>Seller</span>
                <strong>{sellerName}</strong>
                <p>IronXchange is the source page. Blast the machine anywhere buyers live.</p>
              </div>
            </section>
          </section>
        </section>
      </main>

      <Footer />

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

        button,
        input,
        textarea,
        select {
          font-family: inherit;
        }

        main {
          min-height: 100vh;
          background:
            radial-gradient(circle at top, rgba(255,196,0,.025), transparent 28%),
            #0b0b0b;
        }

        .launch-wrap {
          max-width: 1600px;
          margin: 0 auto;
          padding: 14px 2% 54px;
        }

        .panel,
        .launch-header,
        .photo-workbench,
        .left-toolbar,
        .distribution-center,
        .listing-preview-card {
          background:
            linear-gradient(180deg, rgba(255,255,255,.028), rgba(255,255,255,0)),
            #141414;
          border: 1px solid rgba(255,255,255,.06);
          outline: 1px solid rgba(255,255,255,.018);
          border-radius: 14px;
          box-shadow:
            0 1px 0 rgba(255,255,255,.045) inset,
            0 18px 44px rgba(0,0,0,.22);
        }

        .launch-header {
          min-height: 68px;
          margin-bottom: 12px;
          padding: 12px 14px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
        }

        .launch-title {
          display: flex;
          align-items: center;
          gap: 14px;
          min-width: 0;
        }

        .launch-title button {
          height: 36px;
          padding: 0 12px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,.08);
          background: #101010;
          color: rgba(255,255,255,.58);
          font-size: 9px;
          font-weight: 950;
          letter-spacing: .58px;
          text-transform: uppercase;
          cursor: pointer;
        }

        .launch-title button:hover {
          color: #FFC400;
          border-color: rgba(255,196,0,.28);
        }

        .launch-title span,
        .workbench-head span,
        .toolbar-head span,
        .section-label span,
        .distribution-head span {
          display: block;
          margin-bottom: 5px;
          color: #FFC400;
          font-size: 9px;
          font-weight: 950;
          letter-spacing: .72px;
          text-transform: uppercase;
        }

        .launch-title h1 {
          margin: 0;
          color: #f2f2f2;
          font-size: 22px;
          font-weight: 950;
          letter-spacing: -.65px;
          text-transform: uppercase;
        }

        .launch-title p,
        .distribution-head p,
        .seller-panel p,
        .micro-note {
          margin: 6px 0 0;
          color: rgba(255,255,255,.42);
          font-size: 12px;
          line-height: 1.4;
        }

        .launch-header-actions {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .status-pill {
          height: 34px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 0 11px;
          border-radius: 999px;
          font-size: 9px;
          font-weight: 950;
          letter-spacing: .58px;
          text-transform: uppercase;
        }

        .status-pill span {
          width: 7px;
          height: 7px;
          border-radius: 50%;
        }

        .status-pill.live {
          color: #38A169;
          border: 1px solid rgba(56,161,105,.42);
          background: rgba(56,161,105,.045);
        }

        .status-pill.live span {
          background: #38A169;
        }

        .status-pill.paused {
          color: #f6ad55;
          border: 1px solid rgba(246,173,85,.42);
          background: rgba(246,173,85,.055);
        }

        .status-pill.paused span {
          background: #f6ad55;
        }

        .workflow-select,
        .save-top,
        .public-link {
          height: 34px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,.08);
          background: #101010;
          color: #f2f2f2;
          padding: 0 12px;
          font-size: 9px;
          font-weight: 950;
          letter-spacing: .58px;
          text-transform: uppercase;
          text-decoration: none;
          cursor: pointer;
        }

        .save-top {
          background: #FFC400;
          border-color: #FFC400;
          color: #050505;
        }

        .photo-workbench {
          padding: 14px;
          margin-bottom: 14px;
        }

        .workbench-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          margin-bottom: 12px;
        }

        .workbench-head strong,
        .section-label strong {
          color: #f2f2f2;
          font-size: 14px;
          font-weight: 850;
        }

        .photo-add {
          min-width: 180px;
          height: 38px;
          display: grid;
          place-items: center;
          border-radius: 10px;
          background: rgba(255,196,0,.045);
          border: 1px dashed rgba(255,196,0,.28);
          color: #FFC400;
          font-size: 10px;
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
          gap: 10px;
          overflow-x: auto;
          overflow-y: hidden;
          padding-bottom: 6px;
          scrollbar-width: thin;
          scrollbar-color: rgba(255,255,255,.14) transparent;
        }

        .photo-tile {
          position: relative;
          flex: 0 0 158px;
          height: 112px;
          overflow: hidden;
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,.07);
          background: #080808;
          cursor: grab;
          opacity: .72;
          transition:
            opacity .15s ease,
            transform .15s ease,
            border-color .15s ease;
        }

        .photo-tile:hover,
        .photo-tile.active {
          opacity: 1;
          transform: translateY(-1px);
          border-color: rgba(255,196,0,.34);
        }

        .photo-tile.hero {
          border: 2px solid #FFC400;
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
        }

        .photo-tile button {
          position: absolute;
          top: 7px;
          right: 7px;
          z-index: 3;
          width: 22px;
          height: 22px;
          border: none;
          border-radius: 50%;
          background: rgba(185,28,28,.92);
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
          grid-template-columns: 230px minmax(360px, 1fr) 360px;
          gap: 14px;
          align-items: start;
          margin-bottom: 14px;
        }

        .left-toolbar,
        .distribution-center {
          padding: 14px;
          display: grid;
          align-content: start;
          gap: 10px;
        }

        .toolbar-head strong {
          display: block;
          color: #f2f2f2;
          font-size: 20px;
          font-weight: 950;
          letter-spacing: -.45px;
          text-transform: uppercase;
          margin-bottom: 4px;
        }

        .data-stack {
          display: grid;
          gap: 8px;
          margin-top: 6px;
        }

        .data-stack div {
          background: #101010;
          border: 1px solid rgba(255,255,255,.06);
          border-radius: 11px;
          padding: 10px;
        }

        .data-stack span,
        .seller-panel span {
          display: block;
          color: rgba(255,255,255,.42);
          font-size: 9px;
          font-weight: 950;
          letter-spacing: .55px;
          text-transform: uppercase;
          margin-bottom: 6px;
        }

        .data-stack strong {
          color: #f2f2f2;
          font-size: 12px;
          font-weight: 850;
          line-height: 1.2;
          overflow-wrap: anywhere;
        }

        .toolbar-actions {
          display: grid;
          gap: 8px;
          margin-top: 6px;
        }

        .toolbar-actions button,
        .utility-grid button {
          min-height: 38px;
          border-radius: 10px;
          border: 1px solid rgba(255,255,255,.08);
          background: #101010;
          color: #f2f2f2;
          font-size: 9px;
          font-weight: 950;
          letter-spacing: .55px;
          text-transform: uppercase;
          cursor: pointer;
        }

        .preview-zone {
          min-width: 0;
        }

        .section-label {
          margin-bottom: 10px;
        }

        .listing-preview-card {
          width: min(100%, 430px);
          margin: 0 auto;
          overflow: hidden;
          contain: layout paint;
          transform: scale(1.08);
          transform-origin: top center;
        }

        .preview-photo {
          position: relative;
          height: 265px;
          background-size: cover;
          background-position: center;
          border-bottom: 1px solid rgba(255,255,255,.065);
          overflow: hidden;
          box-shadow: inset 0 -40px 70px rgba(0,0,0,.10);
          cursor: pointer;
        }

        .card-photo-nav {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 24px;
          height: 90px;
          border: none;
          background: rgba(0,0,0,.08);
          color: rgba(255,255,255,.44);
          font-size: 28px;
          cursor: pointer;
        }

        .card-photo-nav.left {
          left: 0;
          border-radius: 0 10px 10px 0;
        }

        .card-photo-nav.right {
          right: 0;
          border-radius: 10px 0 0 10px;
        }

        .photo-count {
          position: absolute;
          top: 8px;
          right: 8px;
          padding: 3px 6px;
          border-radius: 999px;
          background: rgba(0,0,0,.24);
          color: rgba(255,255,255,.62);
          font-size: 8px;
          font-weight: 800;
        }

        .preview-body {
          padding: 14px 14px 13px;
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
          letter-spacing: -.3px;
          text-transform: uppercase;
        }

        .card-hours-input {
          width: 92px;
          text-align: right;
          color: rgba(255,255,255,.54);
          font-size: 13px;
          font-weight: 600;
        }

        .preview-keyword-row {
          min-height: 22px;
          margin: 9px 0 15px;
          display: flex;
          flex-wrap: wrap;
          gap: 5px 6px;
        }

        .preview-keyword-row span {
          padding: 3px 6px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,.055);
          background: rgba(255,255,255,.025);
          color: rgba(255,255,255,.42);
          font-size: 9.5px;
          font-weight: 750;
          text-transform: lowercase;
        }

        .preview-price-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 12px;
          border-top: 1px solid rgba(255,255,255,.055);
          gap: 10px;
        }

        .card-price-input {
          width: 150px;
          color: #f2f2f2;
          font-size: 20px;
          font-weight: 900;
        }

        .preview-meta {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 7px;
          min-width: 0;
        }

        .preview-meta button {
          border: none;
          background: transparent;
          color: rgba(255,255,255,.28);
          cursor: pointer;
          padding: 0;
        }

        .card-location-input {
          width: 150px;
          color: rgba(255,255,255,.48);
          font-size: 10px;
          font-weight: 850;
          text-align: right;
          text-transform: uppercase;
        }

        .micro-note {
          max-width: 430px;
          margin: 34px auto 0;
          text-align: center;
        }

        .distribution-head h2 {
          margin: 0;
          color: #f2f2f2;
          font-size: 25px;
          font-weight: 950;
          letter-spacing: -.6px;
          text-transform: uppercase;
        }

        .launch-btn {
          min-height: 58px;
          display: flex;
          align-items: center;
          gap: 14px;
          border: none;
          border-radius: 14px;
          padding: 12px 14px;
          cursor: pointer;
          text-align: left;
          transition: transform .15s ease, filter .15s ease;
        }

        .launch-btn:hover {
          transform: translateY(-1px);
          filter: brightness(1.04);
        }

        .launch-btn i {
          font-size: 24px;
          width: 28px;
          text-align: center;
        }

        .launch-btn strong {
          display: block;
          font-size: 13px;
          font-weight: 950;
        }

        .launch-btn span {
          display: block;
          margin-top: 3px;
          font-size: 11px;
          opacity: .88;
        }

        .launch-btn.marketplace,
        .launch-btn.facebook {
          background: #1877F2;
          color: white;
        }

        .launch-btn.instagram {
          background: linear-gradient(135deg, #f58529, #dd2a7b, #8134af, #515bd4);
          color: white;
        }

        .launch-btn.linkedin {
          background: #0A66C2;
          color: white;
        }

        .launch-btn.tiktok {
          background: #111;
          color: white;
          border: 1px solid rgba(255,255,255,.08);
        }

        .utility-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
          margin-top: 4px;
        }

        .lower-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 420px;
          gap: 14px;
          margin-bottom: 14px;
        }

        .panel {
          padding: 16px;
        }

        .panel-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          margin-bottom: 13px;
        }

        .panel-head h2 {
          margin: 0;
          color: #f2f2f2;
          font-size: 15px;
          font-weight: 950;
          letter-spacing: -.1px;
          text-transform: uppercase;
        }

        .panel-head span {
          color: #FFC400;
          font-size: 9px;
          font-weight: 950;
          letter-spacing: .55px;
          text-transform: uppercase;
        }

        label {
          display: grid;
          gap: 6px;
          color: rgba(255,255,255,.44);
          font-size: 9px;
          font-weight: 950;
          letter-spacing: .58px;
          text-transform: uppercase;
        }

        textarea,
        .keyword-search {
          width: 100%;
          background: #0c0c0c;
          border: 1px solid rgba(255,255,255,.08);
          border-radius: 10px;
          color: #f2f2f2;
          padding: 11px 12px;
          font-size: 13px;
          outline: none;
        }

        textarea {
          min-height: 170px;
          resize: vertical;
          line-height: 1.55;
        }

        .save-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-top: 14px;
        }

        .save-btn,
        .preview-btn {
          min-height: 42px;
          border-radius: 11px;
          border: 1px solid rgba(255,255,255,.08);
          display: flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          font-size: 10px;
          font-weight: 950;
          letter-spacing: .58px;
          text-transform: uppercase;
          cursor: pointer;
        }

        .save-btn {
          background: #FFC400;
          border-color: #FFC400;
          color: #050505;
        }

        .preview-btn {
          background: #101010;
          color: #f2f2f2;
        }

        .selected-badges {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
          margin-bottom: 12px;
        }

        .selected-badges button {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 5px 8px;
          border-radius: 999px;
          border: 1px solid rgba(255,196,0,.32);
          background: rgba(255,196,0,.08);
          color: #FFC400;
          font-size: 9px;
          font-weight: 900;
          text-transform: lowercase;
          cursor: pointer;
        }

        .keyword-search {
          margin-bottom: 10px;
        }

        .keyword-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          max-height: 214px;
          overflow-y: auto;
          border: 1px solid rgba(255,255,255,.055);
          background: #0f0f0f;
          border-radius: 12px;
          padding: 10px;
          scrollbar-width: thin;
          scrollbar-color: rgba(255,255,255,.14) transparent;
        }

        .keyword-chip {
          padding: 5px 7px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,.055);
          background: rgba(255,255,255,.025);
          color: rgba(255,255,255,.42);
          font-size: 9.5px;
          font-weight: 800;
          line-height: 1;
          text-transform: lowercase;
          cursor: pointer;
        }

        .keyword-chip.active {
          color: #FFC400;
          border-color: rgba(255,196,0,.34);
          background: rgba(255,196,0,.07);
        }

        .footer-ops {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }

        .activity-list {
          display: grid;
          gap: 8px;
        }

        .activity-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          background: #101010;
          border: 1px solid rgba(255,255,255,.06);
          border-radius: 11px;
          padding: 11px;
        }

        .activity-item.success {
          border-color: rgba(56,161,105,.30);
        }

        .activity-item span {
          color: #f2f2f2;
          font-size: 10.5px;
          font-weight: 950;
          letter-spacing: .35px;
        }

        .activity-item small {
          color: rgba(255,255,255,.42);
          font-size: 9px;
          font-weight: 900;
          white-space: nowrap;
        }

        .seller-panel {
          display: grid;
          grid-template-columns: 110px 1fr;
          gap: 14px;
          align-items: center;
        }

        .seller-panel img {
          width: 110px;
          max-height: 66px;
          object-fit: contain;
        }

        .seller-icon {
          width: 58px;
          height: 58px;
          border: 1px solid rgba(255,255,255,.10);
          border-radius: 50%;
          display: grid;
          place-items: center;
          color: rgba(255,255,255,.52);
        }

        .seller-panel strong {
          color: #f2f2f2;
          font-size: 18px;
          font-weight: 950;
          letter-spacing: -.2px;
        }

        @media (max-width: 1280px) {
          .studio-grid,
          .lower-grid,
          .footer-ops {
            grid-template-columns: 1fr;
          }

          .listing-preview-card {
            transform: none;
          }

          .micro-note {
            margin-top: 12px;
          }
        }

        @media (max-width: 860px) {
          .launch-wrap {
            padding: 12px 4% 42px;
          }

          .launch-header {
            align-items: stretch;
            flex-direction: column;
          }

          .launch-header-actions,
          .workbench-head {
            align-items: stretch;
            flex-direction: column;
          }

          .workflow-select,
          .save-top,
          .public-link,
          .photo-add {
            width: 100%;
          }

          .photo-tile {
            flex: 0 0 128px;
            height: 92px;
          }

          .listing-preview-card {
            width: 100%;
          }

          .preview-photo {
            height: 250px;
          }

          .utility-grid,
          .save-row {
            grid-template-columns: 1fr;
          }

          .seller-panel {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
}
