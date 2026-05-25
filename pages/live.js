import Head from "next/head";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";

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
  return `${window.location.origin}/listing/${slugify(listing.title)}?from=live`;
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
  const hours = clean(listing?.hours) || "Hours not listed";
  const location = clean(listing?.location) || "Location not listed";
  const description =
    clean(listing?.description) ||
    "Clean machine. Full specs and photos available on IronXchange.";

  const features = selectedKeywords.slice(0, 5).join(" • ");

  if (platform === "linkedin") {
    return `${title}

${hours} | ${location}
${price}

${features}

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

  return `${title}
${hours} | ${location}
${price}

${features}

${description}

Listed on IronXchange.
View full specs + photos:
${listingUrl}`;
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
      .catch(err => console.error("Live page load failed:", err))
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

  const title = cleanMachineTitle(listing?.title || "Machine Command Center");
  const category = clean(listing?.type || listing?.category || listing?.publicData?.category) || "Category not listed";
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
    ? `${clean(listing.title)} | ${clean(edit.hours || listing.hours)} | ${clean(edit.location || listing.location)}`
    : "";

  const shortDescription = listing
    ? `
${clean(listing.title)}
${clean(edit.hours || listing.hours)} | ${clean(edit.location || listing.location)}

${formatMoney(edit.price || listing.price)}

Listed on IronXchange:
${listingUrl}
`.trim()
    : "";

  const longDescription = listing
    ? `
${clean(listing.title)}

${clean(edit.hours || listing.hours)} | ${clean(edit.location || listing.location)}
${formatMoney(edit.price || listing.price)}

${selectedKeywords.slice(0, 8).join(" • ")}

${clean(edit.description || listing.description)}

View full specs + photos:
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

    addActivity(
      "success",
      `${mapped.length} photo${mapped.length === 1 ? "" : "s"} added`
    );

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

    addActivity(
      "success",
      `${mapped.length} photo${mapped.length === 1 ? "" : "s"} dropped`
    );
  }

  function removePhoto(indexToRemove) {
    setPhotoItems(current =>
      current.filter((_, index) => index !== indexToRemove)
    );

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

    setActivePhotoIndex(0);
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
        headers: {
          "Content-Type": "application/json"
        },
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
          headers: {
            "Content-Type": "application/json"
          },
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

      addActivity("success", `Edit saved — ${title}`);
      alert("Saved. Listing updates applied.");
    } catch (err) {
      console.error("SAVE QUICK EDIT ERROR:", err);
      addActivity("error", `Edit failed — ${title}`);
      alert(`Edit failed: ${err.message}`);
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
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          listingId: String(listing.id),
          workflowStatus: nextWorkflow
        })
      });

      if (!response.ok) {
        throw new Error("Workflow update failed");
      }

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
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          listingId: String(listing.id)
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || `${action} failed`);
      }

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

  if (loading) {
    return (
      <main className="loading">
        Loading machine command center...
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
        <title>{title} Command Center | IronXchange</title>

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
          <section className="command-bar">
            <div className="command-title">
              <button type="button" onClick={() => router.push("/account/my-listings")}>
                ← Inventory
              </button>

              <div>
                <span>Machine Command Center</span>
                <h1>{title}</h1>
              </div>
            </div>

            <div className="command-actions">
              <div className={isPaused ? "status-pill paused" : "status-pill live"}>
                <span></span>
                {isPaused ? "Paused" : "Live"}
              </div>

              <a href={listingUrl} target="_blank" rel="noreferrer" className="mini-btn yellow-btn">
                View Public
              </a>

              <button
                type="button"
                onClick={saveQuickEdit}
                className="mini-btn save-mini"
                disabled={saving}
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </section>

          <section className="hero-command-grid">
            <section className="v10-machine-card">
              <div className="v10-photo-stage">
                <img src={heroPhoto} alt={listing.title} className="v10-hero-photo" />

                <button
                  type="button"
                  className="photo-nav left"
                  onClick={() => changeActivePhoto(-1)}
                  aria-label="Previous photo"
                >
                  ‹
                </button>

                <button
                  type="button"
                  className="photo-nav right"
                  onClick={() => changeActivePhoto(1)}
                  aria-label="Next photo"
                >
                  ›
                </button>

                <div className="v10-photo-overlay">
                  <span>{activePhotoIndex + 1} / {photoItems.length || 1}</span>
                  <strong>Drag thumbnails to reorder</strong>
                </div>
              </div>

              <div className="v10-card-body">
                <div className="v10-title-row">
                  <div>
                    <h2>{title}</h2>
                    <p>
                      {selectedKeywords.slice(0, 6).join(" • ") ||
                        "Add key selling features, condition notes, and package details."}
                    </p>
                  </div>

                  <div className="v10-price-block">
                    <strong>{formatMoney(edit.price || listing.price)}</strong>
                    <span>{edit.hours || listing.hours || "—"} hrs</span>
                  </div>
                </div>

                <div className="v10-meta-row">
                  <span>⌖ {edit.location || listing.location || "Location not listed"}</span>
                  <span>{category}</span>
                  <span>{photoItems.length} photos</span>
                  <span>{workflowStatus}</span>
                </div>

                <label
                  className="v10-photo-drop"
                  onDragOver={e => e.preventDefault()}
                  onDrop={handlePhotoDrop}
                >
                  <input type="file" multiple accept="image/*" onChange={handlePhotos} />
                  + Add / Drop Photos
                </label>

                <div className="v10-thumb-strip">
                  {photoItems.map((photo, index) => (
                    <div
                      key={photo.id}
                      className={`v10-thumb ${index === activePhotoIndex ? "active" : ""} ${
                        index === 0 ? "hero" : ""
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
                      {index === 0 && <span>HERO</span>}
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
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <aside className="command-stack">
              <div className="stack-head">
                <span>Seller Controls</span>
                <strong>Operate Listing</strong>
              </div>

              <button
                type="button"
                className="command-primary"
                onClick={saveQuickEdit}
                disabled={saving}
              >
                {saving ? "Saving Changes..." : "Save Changes"}
              </button>

              <button
                type="button"
                className={isPaused ? "command-button green" : "command-button"}
                onClick={() => runListingCommand(isPaused ? "reactivate" : "pause")}
                disabled={!!commandBusy}
              >
                {commandBusy
                  ? "Working..."
                  : isPaused
                    ? "Reactivate Listing"
                    : "Pause Listing"}
              </button>

              <label className="workflow-control">
                Workflow Bucket
                <select
                  value={workflowStatus}
                  onChange={e => updateWorkflow(e.target.value)}
                >
                  {workflowOptions.map(option => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <a href={listingUrl} target="_blank" rel="noreferrer" className="command-button link">
                View Public Listing
              </a>

              <button
                type="button"
                className="command-button"
                onClick={() => copyText("Listing Link", listingUrl)}
              >
                {copied === "Listing Link" ? "Copied" : "Copy Listing Link"}
              </button>

              <button
                type="button"
                className="command-button"
                onClick={downloadHeroImage}
              >
                Download Hero Photo
              </button>

              <button
                type="button"
                className="command-button"
                onClick={downloadAllPhotos}
              >
                Download Photo Pack
              </button>

              <button
                type="button"
                className="command-button danger"
                onClick={() => runListingCommand("delete")}
              >
                Delete / Archive
              </button>
            </aside>
          </section>

          <section className="main-grid">
            <div className="left-stack">
              <section className="panel metrics-panel">
                <div className="metric">
                  <span>Views</span>
                  <strong>—</strong>
                </div>

                <div className="metric">
                  <span>Saves</span>
                  <strong>—</strong>
                </div>

                <div className="metric">
                  <span>Inquiries</span>
                  <strong>—</strong>
                </div>

                <div className="metric">
                  <span>Shares</span>
                  <strong>—</strong>
                </div>
              </section>

              <section className="panel machine-data-panel">
                <div className="panel-head">
                  <h2>Machine Data</h2>
                  <span>Core Listing Fields</span>
                </div>

                <div className="machine-data-grid">
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

                  <label>
                    Hours
                    <input
                      value={edit.hours}
                      onChange={e => setEdit({ ...edit, hours: e.target.value })}
                    />
                  </label>

                  <label>
                    Price
                    <input
                      value={edit.price}
                      onChange={e => setEdit({ ...edit, price: e.target.value })}
                    />
                  </label>

                  <label>
                    Location
                    <input
                      value={edit.location}
                      onChange={e => setEdit({ ...edit, location: e.target.value })}
                    />
                  </label>

                  <div>
                    <span>Category</span>
                    <strong>{category}</strong>
                  </div>

                  <div>
                    <span>Stock #</span>
                    <strong>{listing.stockNumber || listing.publicData?.stockNumber || "—"}</strong>
                  </div>
                </div>
              </section>

              <section className="panel activity-panel">
                <div className="panel-head">
                  <h2>Activity Log</h2>
                  <span>Recent Actions</span>
                </div>

                <div className="activity-list">
                  <div className="activity-item success">
                    <span>PHOTO ORDER READY</span>
                    <small>LIVE</small>
                  </div>

                  <div className="activity-item">
                    <span>WORKFLOW: {workflowStatus.toUpperCase()}</span>
                    <small>SYNCED</small>
                  </div>

                  <div className="activity-item">
                    <span>PUBLIC PAGE LINK READY</span>
                    <small>READY</small>
                  </div>

                  <div className="activity-item">
                    <span>SELLER COMMAND CENTER LOADED</span>
                    <small>NOW</small>
                  </div>
                </div>
              </section>
            </div>

            <div className="right-stack">
              <section className="panel edit-panel">
                <div className="panel-head">
                  <h2>Sales Copy</h2>
                  <span>Description + Keywords</span>
                </div>

                <label className="wide">
                  Description
                  <textarea
                    value={edit.description}
                    onChange={e => setEdit({ ...edit, description: e.target.value })}
                    placeholder="Describe condition, attachments, maintenance, ownership history, and buyer-relevant details..."
                  />
                </label>

                <div className="keywords-panel">
                  <div className="keywords-head">
                    <h2>Feature Tags</h2>
                    <span>{selectedKeywords.length} Selected</span>
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
                        className={
                          selectedKeywords.includes(keyword)
                            ? "keyword-chip active"
                            : "keyword-chip"
                        }
                      >
                        {keyword}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="save-row">
                  <button
                    type="button"
                    onClick={saveQuickEdit}
                    className="save-btn"
                    disabled={saving}
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>

                  <a
                    href={listingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="preview-btn"
                  >
                    View Public
                  </a>
                </div>
              </section>

              <section className="panel promote-panel">
                <div className="panel-head">
                  <h2>Media Blast</h2>
                  <span>Copy + Open</span>
                </div>

                <div className="promote-grid">
                  <button
                    type="button"
                    onClick={() => copyText("Marketplace Title", marketplaceTitle)}
                  >
                    {copied === "Marketplace Title" ? "Copied" : "Marketplace Title"}
                  </button>

                  <button
                    type="button"
                    onClick={() => copyText("Short Description", shortDescription)}
                  >
                    {copied === "Short Description" ? "Copied" : "Short Copy"}
                  </button>

                  <button
                    type="button"
                    onClick={() => copyText("Long Description", longDescription)}
                  >
                    {copied === "Long Description" ? "Copied" : "Long Copy"}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      copyText(
                        "Facebook Post",
                        buildSocialCopy("facebook", listing, listingUrl, selectedKeywords)
                      )
                    }
                  >
                    {copied === "Facebook Post" ? "Copied" : "Facebook"}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      copyText(
                        "Instagram Caption",
                        buildSocialCopy("instagram", listing, listingUrl, selectedKeywords)
                      )
                    }
                  >
                    {copied === "Instagram Caption" ? "Copied" : "Instagram"}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      copyText(
                        "LinkedIn Post",
                        buildSocialCopy("linkedin", listing, listingUrl, selectedKeywords)
                      )
                    }
                  >
                    {copied === "LinkedIn Post" ? "Copied" : "LinkedIn"}
                  </button>

                  <a href="https://www.facebook.com/marketplace/create/vehicle" target="_blank" rel="noreferrer">
                    FB Marketplace
                  </a>

                  <a href="https://www.linkedin.com/feed/" target="_blank" rel="noreferrer">
                    LinkedIn
                  </a>

                  <a href="https://www.instagram.com/" target="_blank" rel="noreferrer">
                    Instagram
                  </a>

                  <a href="https://www.tiktok.com/upload" target="_blank" rel="noreferrer">
                    TikTok
                  </a>
                </div>
              </section>

              <section className="panel seller-bar">
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
                  <p>Profile/contact expansion hooks stay ready for V10 seller CRM.</p>
                </div>
              </section>
            </div>
          </section>
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
          background:
            radial-gradient(circle at top, rgba(255,196,0,.025), transparent 28%),
            #0b0b0b;
        }

        button,
        input,
        textarea,
        select {
          font-family: inherit;
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
        }

        .wrap {
          max-width: 1580px;
          margin: 0 auto;
          padding: 14px 2% 54px;
        }

        .panel,
        .command-bar,
        .v10-machine-card,
        .command-stack {
          background:
            linear-gradient(180deg, rgba(255,255,255,.028), rgba(255,255,255,0)),
            #141414;
          border: 1px solid rgba(255,255,255,.06);
          outline: 1px solid rgba(255,255,255,.018);
          border-radius: 14px;
          box-shadow:
            0 1px 0 rgba(255,255,255,.04) inset,
            0 18px 44px rgba(0,0,0,.22);
        }

        .command-bar {
          min-height: 62px;
          margin-bottom: 12px;
          padding: 10px 12px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 14px;
        }

        .command-title {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
        }

        .command-title button {
          height: 34px;
          padding: 0 12px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,.08);
          background: #101010;
          color: rgba(255,255,255,.58);
          font-size: 9px;
          font-weight: 900;
          letter-spacing: .55px;
          text-transform: uppercase;
          cursor: pointer;
        }

        .command-title button:hover {
          color: #FFC400;
          border-color: rgba(255,196,0,.28);
        }

        .command-title span {
          display: block;
          margin-bottom: 3px;
          color: #FFC400;
          font-size: 9px;
          font-weight: 950;
          letter-spacing: .72px;
          text-transform: uppercase;
        }

        .command-title h1 {
          margin: 0;
          color: #f2f2f2;
          font-size: 20px;
          font-weight: 950;
          letter-spacing: -.5px;
          line-height: 1;
          text-transform: uppercase;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 720px;
        }

        .command-actions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
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

        .mini-btn {
          height: 34px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(255,255,255,.09);
          background: #101010;
          color: #f2f2f2;
          border-radius: 999px;
          padding: 0 12px;
          font-size: 9px;
          font-weight: 950;
          letter-spacing: .55px;
          text-transform: uppercase;
          text-decoration: none;
          cursor: pointer;
        }

        .mini-btn:hover {
          color: #FFC400;
          border-color: rgba(255,196,0,.28);
        }

        .yellow-btn,
        .save-mini {
          background: #FFC400;
          color: #050505;
          border-color: #FFC400;
        }

        .yellow-btn:hover,
        .save-mini:hover {
          color: #050505;
          filter: brightness(1.05);
        }

        .hero-command-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 310px;
          gap: 12px;
          align-items: stretch;
          margin-bottom: 12px;
        }

        .v10-machine-card {
          overflow: hidden;
          contain: layout paint;
        }

        .v10-photo-stage {
          position: relative;
          background: #050505;
          overflow: hidden;
        }

        .v10-photo-stage::after {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          box-shadow:
            inset 0 0 0 1px rgba(255,255,255,.035),
            inset 0 -92px 120px rgba(0,0,0,.34);
        }

        .v10-hero-photo {
          width: 100%;
          height: 560px;
          object-fit: cover;
          display: block;
          background: #050505;
          transition:
            filter .18s ease,
            transform .28s ease;
        }

        .v10-machine-card:hover .v10-hero-photo {
          filter:
            contrast(1.035)
            saturate(1.025)
            brightness(1.01);
          transform: scale(1.006);
        }

        .photo-nav {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          z-index: 3;
          width: 34px;
          height: 86px;
          border: none;
          background: rgba(0,0,0,.10);
          color: rgba(255,255,255,.42);
          font-size: 36px;
          font-weight: 300;
          cursor: pointer;
          transition: background .16s ease, color .16s ease;
        }

        .photo-nav:hover {
          color: rgba(255,255,255,.75);
          background: rgba(0,0,0,.24);
        }

        .photo-nav.left {
          left: 0;
          border-radius: 0 12px 12px 0;
        }

        .photo-nav.right {
          right: 0;
          border-radius: 12px 0 0 12px;
        }

        .v10-photo-overlay {
          position: absolute;
          left: 14px;
          bottom: 12px;
          z-index: 4;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 11px;
          background: rgba(0,0,0,.52);
          border: 1px solid rgba(255,255,255,.08);
          border-radius: 999px;
          backdrop-filter: blur(7px);
        }

        .v10-photo-overlay span,
        .v10-photo-overlay strong {
          color: rgba(255,255,255,.72);
          font-size: 9px;
          font-weight: 950;
          letter-spacing: .55px;
          text-transform: uppercase;
        }

        .v10-photo-overlay strong {
          color: #FFC400;
        }

        .v10-card-body {
          padding: 14px 14px 13px;
        }

        .v10-title-row {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 18px;
          align-items: start;
        }

        .v10-title-row h2 {
          margin: 0;
          color: #f2f2f2;
          font-size: clamp(25px, 2.2vw, 38px);
          font-weight: 950;
          letter-spacing: -1px;
          line-height: .96;
          text-transform: uppercase;
          text-rendering: geometricPrecision;
        }

        .v10-title-row p {
          margin: 9px 0 0;
          color: rgba(255,255,255,.43);
          font-size: 13px;
          font-weight: 750;
          line-height: 1.35;
        }

        .v10-price-block {
          text-align: right;
          white-space: nowrap;
        }

        .v10-price-block strong {
          display: block;
          color: #f2f2f2;
          font-size: 31px;
          font-weight: 900;
          letter-spacing: -.7px;
          line-height: 1;
        }

        .v10-price-block span {
          display: block;
          margin-top: 6px;
          color: rgba(255,255,255,.54);
          font-size: 12px;
          font-weight: 600;
          letter-spacing: .18px;
          text-transform: uppercase;
        }

        .v10-meta-row {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 13px;
        }

        .v10-meta-row span {
          min-height: 24px;
          display: inline-flex;
          align-items: center;
          padding: 0 8px;
          background: rgba(255,255,255,.025);
          border: 1px solid rgba(255,255,255,.055);
          border-radius: 999px;
          color: rgba(255,255,255,.42);
          font-size: 9.5px;
          font-weight: 800;
          letter-spacing: .22px;
          text-transform: lowercase;
        }

        .v10-photo-drop {
          margin-top: 13px;
          height: 34px;
          display: grid;
          place-items: center;
          background: rgba(255,196,0,.045);
          border: 1px dashed rgba(255,196,0,.28);
          border-radius: 10px;
          color: #FFC400;
          font-size: 10px;
          font-weight: 950;
          letter-spacing: .58px;
          text-transform: uppercase;
          cursor: pointer;
        }

        .v10-photo-drop input {
          display: none;
        }

        .v10-thumb-strip {
          margin-top: 11px;
          display: flex;
          gap: 9px;
          overflow-x: auto;
          overflow-y: hidden;
          padding-bottom: 8px;
          scrollbar-width: thin;
          scrollbar-color: rgba(255,255,255,.14) transparent;
        }

        .v10-thumb {
          position: relative;
          flex: 0 0 122px;
          height: 84px;
          overflow: hidden;
          background: #080808;
          border: 1px solid rgba(255,255,255,.07);
          border-radius: 10px;
          cursor: grab;
          opacity: .72;
          transition:
            opacity .15s ease,
            transform .15s ease,
            border-color .15s ease;
        }

        .v10-thumb:hover,
        .v10-thumb.active {
          opacity: 1;
          transform: translateY(-1px);
          border-color: rgba(255,196,0,.30);
        }

        .v10-thumb.hero {
          border-color: rgba(255,196,0,.55);
        }

        .v10-thumb img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .v10-thumb span {
          position: absolute;
          top: 6px;
          left: 6px;
          z-index: 2;
          padding: 3px 6px;
          background: #FFC400;
          color: #050505;
          border-radius: 999px;
          font-size: 8px;
          font-weight: 950;
        }

        .v10-thumb button {
          position: absolute;
          top: 6px;
          right: 6px;
          z-index: 3;
          width: 20px;
          height: 20px;
          border: none;
          border-radius: 50%;
          background: rgba(185,28,28,.92);
          color: #fff;
          font-size: 12px;
          font-weight: 900;
          cursor: pointer;
        }

        .command-stack {
          padding: 14px;
          display: grid;
          align-content: start;
          gap: 9px;
        }

        .stack-head {
          margin-bottom: 4px;
          padding-bottom: 12px;
          border-bottom: 1px solid rgba(255,255,255,.06);
        }

        .stack-head span {
          display: block;
          color: #FFC400;
          font-size: 9px;
          font-weight: 950;
          letter-spacing: .7px;
          text-transform: uppercase;
          margin-bottom: 5px;
        }

        .stack-head strong {
          display: block;
          color: #f2f2f2;
          font-size: 20px;
          font-weight: 950;
          letter-spacing: -.45px;
          text-transform: uppercase;
        }

        .command-primary,
        .command-button,
        .workflow-control select {
          width: 100%;
          min-height: 40px;
          border-radius: 11px;
          border: 1px solid rgba(255,255,255,.08);
          background: #101010;
          color: #f2f2f2;
          font-size: 10px;
          font-weight: 950;
          letter-spacing: .52px;
          text-transform: uppercase;
          cursor: pointer;
        }

        .command-primary {
          background: #FFC400;
          border-color: #FFC400;
          color: #050505;
        }

        .command-button {
          display: flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
        }

        .command-button:hover {
          color: #FFC400;
          border-color: rgba(255,196,0,.26);
        }

        .command-button.green {
          color: #38A169;
          border-color: rgba(56,161,105,.32);
          background: rgba(56,161,105,.04);
        }

        .command-button.danger {
          color: #ff9b9b;
          border-color: rgba(229,62,62,.28);
        }

        .workflow-control {
          display: grid;
          gap: 7px;
          color: rgba(255,255,255,.48);
          font-size: 9px;
          font-weight: 950;
          letter-spacing: .6px;
          text-transform: uppercase;
        }

        .workflow-control select {
          appearance: none;
          padding: 0 11px;
          outline: none;
        }

        .main-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 520px;
          gap: 12px;
          align-items: start;
        }

        .left-stack,
        .right-stack {
          display: grid;
          gap: 12px;
          grid-auto-rows: min-content;
        }

        .metrics-panel {
          padding: 12px;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
        }

        .metric {
          background: #101010;
          border: 1px solid rgba(255,255,255,.06);
          border-radius: 11px;
          padding: 11px;
        }

        .metric span {
          display: block;
          color: rgba(255,255,255,.42);
          font-size: 9px;
          font-weight: 950;
          letter-spacing: .58px;
          text-transform: uppercase;
          margin-bottom: 5px;
        }

        .metric strong {
          color: #f2f2f2;
          font-size: 20px;
          font-weight: 900;
          line-height: 1;
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

        .machine-data-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
        }

        .machine-data-grid > div,
        .machine-data-grid label {
          min-height: 66px;
          background: #101010;
          border: 1px solid rgba(255,255,255,.06);
          border-radius: 11px;
          padding: 10px;
        }

        .machine-data-grid span,
        label {
          color: rgba(255,255,255,.44);
          font-size: 9px;
          font-weight: 950;
          letter-spacing: .58px;
          text-transform: uppercase;
        }

        .machine-data-grid strong {
          display: block;
          margin-top: 7px;
          color: #f2f2f2;
          font-size: 13px;
          font-weight: 850;
          line-height: 1.15;
          overflow-wrap: anywhere;
        }

        label {
          display: grid;
          gap: 7px;
        }

        input,
        textarea {
          width: 100%;
          background: #0c0c0c;
          border: 1px solid rgba(255,255,255,.08);
          border-radius: 9px;
          color: #f2f2f2;
          padding: 10px 11px;
          font-size: 13px;
          outline: none;
        }

        input:focus,
        textarea:focus,
        select:focus {
          border-color: rgba(255,196,0,.50);
        }

        textarea {
          min-height: 186px;
          resize: vertical;
          line-height: 1.5;
        }

        .wide {
          grid-column: 1 / -1;
        }

        .keywords-panel {
          margin-top: 14px;
        }

        .keywords-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .keywords-head h2 {
          margin: 0;
          color: #f2f2f2;
          font-size: 13px;
          font-weight: 950;
          text-transform: uppercase;
        }

        .keywords-head span {
          color: rgba(255,255,255,.44);
          font-size: 9px;
          font-weight: 950;
          text-transform: uppercase;
        }

        .keyword-search {
          margin-bottom: 8px;
        }

        .keyword-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          max-height: 230px;
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
          border: 1px solid rgba(255,255,255,.055);
          border-radius: 999px;
          background: rgba(255,255,255,.025);
          color: rgba(255,255,255,.42);
          font-size: 9.5px;
          font-weight: 800;
          line-height: 1;
          letter-spacing: .15px;
          text-transform: lowercase;
          cursor: pointer;
        }

        .keyword-chip.active {
          color: #FFC400;
          border-color: rgba(255,196,0,.34);
          background: rgba(255,196,0,.07);
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
          color: #050505;
          border-color: #FFC400;
        }

        .preview-btn {
          background: #101010;
          color: #f2f2f2;
        }

        .promote-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
        }

        .promote-grid button,
        .promote-grid a {
          min-height: 36px;
          background: #101010;
          border: 1px solid rgba(255,255,255,.09);
          color: #f2f2f2;
          border-radius: 999px;
          padding: 9px 10px;
          font-size: 9px;
          font-weight: 950;
          letter-spacing: .45px;
          text-decoration: none;
          cursor: pointer;
          text-align: center;
          text-transform: uppercase;
        }

        .promote-grid a {
          color: #FFC400;
          border-color: rgba(255,196,0,.25);
          background: rgba(255,196,0,.04);
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

        .activity-item.success {
          border-color: rgba(56,161,105,.30);
        }

        .seller-bar {
          display: grid;
          grid-template-columns: 112px 1fr;
          gap: 14px;
          align-items: center;
        }

        .seller-bar img {
          width: 112px;
          max-height: 68px;
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

        .seller-bar span {
          display: block;
          color: rgba(255,255,255,.44);
          font-size: 9px;
          font-weight: 950;
          letter-spacing: .58px;
          text-transform: uppercase;
          margin-bottom: 5px;
        }

        .seller-bar strong {
          color: #f2f2f2;
          font-size: 18px;
          font-weight: 950;
          letter-spacing: -.2px;
        }

        .seller-bar p {
          margin: 6px 0 0;
          color: rgba(255,255,255,.44);
          font-size: 12px;
          line-height: 1.35;
        }

        @media (max-width: 1180px) {
          .hero-command-grid,
          .main-grid {
            grid-template-columns: 1fr;
          }

          .command-stack {
            grid-template-columns: repeat(2, 1fr);
          }

          .stack-head,
          .workflow-control {
            grid-column: 1 / -1;
          }
        }

        @media (max-width: 760px) {
          .wrap {
            padding: 12px 4% 42px;
          }

          .nav {
            padding: 8px 4%;
          }

          .logo-img {
            height: 34px;
          }

          .nav-links a:not(.yellow-link):not(.login-icon) {
            display: none;
          }

          .command-bar {
            align-items: stretch;
            flex-direction: column;
          }

          .command-title h1 {
            max-width: 100%;
            white-space: normal;
          }

          .command-actions {
            justify-content: flex-start;
          }

          .v10-hero-photo {
            height: 360px;
          }

          .v10-title-row {
            grid-template-columns: 1fr;
          }

          .v10-price-block {
            text-align: left;
          }

          .machine-data-grid,
          .metrics-panel,
          .promote-grid,
          .command-stack {
            grid-template-columns: 1fr;
          }

          .seller-bar {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
}









    
