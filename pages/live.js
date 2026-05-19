import Head from "next/head";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";

const BRAND_YELLOW = "#FFC400";

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
  if (!raw) return "Call";
  return `$${Number(raw).toLocaleString()}`;
}

function getListingImages(listing) {
  return [
    ...(Array.isArray(listing?.images) ? listing.images : []),
    ...(Array.isArray(listing?.imageUrls) ? listing.imageUrls : []),
    listing?.imageUrl,
    listing?.image
  ].filter(Boolean);
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
      JSON.stringify([event, ...current].slice(0, 40))
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

function buildSocialCopy(platform, listing, listingUrl, selectedKeywords = []) {
  const title = clean(listing?.title) || "Equipment Listing";
  const price = formatMoney(listing?.price);
  const hours = clean(listing?.hours) || "Hours not listed";
  const location = clean(listing?.location) || "Location not listed";
  const description =
    clean(listing?.description) ||
    "Clean machine. Full specs and photos available on IronXchange.";

  const features = selectedKeywords.slice(0, 5).join(" • ");

  if (platform === "x") {
    return `${title}
${hours} | ${location}
${price}

${features}

Listed on IronXchange:
${listingUrl}

#IronXchange #HeavyEquipment`;
  }

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

  useEffect(() => {
    if (!listing) return;

    setEdit({
      price: clean(listing.price),
      hours: clean(listing.hours),
      location: clean(listing.location),
      description: clean(listing.description)
    });

    setSelectedKeywords(getListingKeywords(listing));

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

  const sellerName =
    clean(listing?.sellerName) ||
    clean(listing?.sellerCompany) ||
    clean(listing?.authorName) ||
    "IronXchange Seller";

  const sellerLogo = listing?.sellerLogo || listing?.profileImage || "";

  const availableKeywords = useMemo(() => {
    return Array.from(
      new Set([
        ...commonKeywordOptions,
        ...selectedKeywords
      ])
    ).sort();
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

    addActivity(
      "success",
      `Photo removed — ${clean(listing?.title) || "Listing"}`
    );
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

    addActivity(
      "success",
      `Photo order changed — ${clean(listing?.title) || "Listing"}`
    );
  }

  async function copyText(label, text) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);

      addActivity(
        "success",
        `${label} copied — ${clean(listing?.title) || "Listing"}`
      );

      setTimeout(() => setCopied(""), 1500);
    } catch {
      addActivity(
        "error",
        `${label} copy failed — ${clean(listing?.title) || "Listing"}`
      );

      alert("Copy failed. Highlight and copy manually.");
    }
  }

  async function downloadHeroImage() {
    const hero = photoItems[0]?.url || heroPhoto;

    if (!hero) {
      alert("No image found.");
      return;
    }

    await downloadImage(hero, `${slugify(listing.title)}-hero.jpg`);

    addActivity(
      "success",
      `Hero image downloaded — ${clean(listing?.title) || "Listing"}`
    );
  }

  async function downloadAllPhotos() {
    if (photoItems.length === 0) {
      alert("No photos found.");
      return;
    }

    for (let i = 0; i < photoItems.length; i += 1) {
      await downloadImage(
        photoItems[i].url,
        `${slugify(listing.title)}-${i + 1}.jpg`
      );
    }

    addActivity(
      "success",
      `Photo pack downloaded — ${clean(listing?.title) || "Listing"}`
    );
  }

  async function saveQuickEdit() {
    if (!listing?.id) return;

    setSaving(true);

    try {
      if (clean(edit.price)) {
        await fetch("/api/update-listing-price", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            listingId: listing.id,
            price: cleanNumber(edit.price)
          })
        });
      }

      addActivity(
        "success",
        `Edit saved — ${clean(listing?.title) || "Listing"}`
      );

      alert("Saved. Price API is wired. Hours/location/description/keywords/photo save can be wired next.");
    } catch {
      addActivity(
        "error",
        `Edit failed — ${clean(listing?.title) || "Listing"}`
      );

      alert("Edit failed.");
    } finally {
      setSaving(false);
    }
  }

  function statusAction(action) {
    addActivity(
      "success",
      `${action} selected — ${clean(listing?.title) || "Listing"}`
    );

    alert(`${action} action logged. API wiring comes next.`);
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

  return (
    <>
      <Head>
        <title>Machine Command Center | IronXchange</title>
      </Head>

      <main>
        <nav className="nav">
          <a href="/" className="logo-wrap">
            <img src="/images/ironxchange-logo.png" className="logo-img" alt="IronXchange" />
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
            <div className="live-pill"><span></span> LISTING LIVE</div>

            <div className="command-actions">
              <a href={listingUrl} className="mini-btn yellow-btn">VIEW LIVE</a>
              <a href="/account" className="mini-btn">DASHBOARD</a>
              <button type="button" onClick={() => statusAction("Pause")} className="mini-btn">PAUSE</button>
              <button type="button" onClick={() => statusAction("Sold")} className="mini-btn">SOLD</button>
              <button type="button" onClick={() => statusAction("Archive")} className="mini-btn">ARCHIVE</button>
              <button type="button" onClick={() => statusAction("Duplicate")} className="mini-btn">DUPLICATE</button>
              <button type="button" onClick={() => statusAction("Delete")} className="mini-btn danger-btn">DELETE</button>
            </div>
          </section>

          <section className="panel photo-row-panel">
            <div className="panel-head">
              <h2>Photo Order</h2>
              <span>{photoItems.length} Photos</span>
            </div>

            <label
              className="photo-add-box"
              onDragOver={e => e.preventDefault()}
              onDrop={handlePhotoDrop}
            >
              <input type="file" multiple accept="image/*" onChange={handlePhotos} />
              + Add / Drop Photos
            </label>

            <div className="photo-strip">
              {photoItems.map((photo, index) => (
                <div
                  key={photo.id}
                  className={index === 0 ? "photo-tile hero-tile" : "photo-tile"}
                  draggable
                  onDragStart={() => setDraggedPhotoIndex(index)}
                  onDragOver={e => e.preventDefault()}
                  onDrop={() => {
                    reorderPhotos(draggedPhotoIndex, index);
                    setDraggedPhotoIndex(null);
                  }}
                  onClick={() => setActivePhotoIndex(index)}
                >
                  {index === 0 && <span className="hero-badge">HERO</span>}
                  <img src={photo.url} alt={`Photo ${index + 1}`} />
                  <button type="button" onClick={e => {
                    e.stopPropagation();
                    removePhoto(index);
                  }}>
                    ×
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section className="main-grid">
            <section className="panel preview-card">
              <div className="photo-stage">
                <img src={heroPhoto} alt={listing.title} className="hero-photo" />

                <button type="button" className="photo-nav left" onClick={() => changeActivePhoto(-1)}>‹</button>
                <button type="button" className="photo-nav right" onClick={() => changeActivePhoto(1)}>›</button>
              </div>

            <div className="card-body live-card-body">
  <div className="title-row">
    <h3>
      {String(listing.title || "")
        .replace(edit.hours || listing.hours || "", "")
        .replace(/\s+[-–]\s*$/, "")
        .trim()}
    </h3>

    <h3 className="hours-inline">
      {edit.hours || listing.hours || "—"}
    </h3>
  </div>

  <p className="feature-line">
    {selectedKeywords.slice(0, 4).join(" • ")}
  </p>

  <div className="price-row">
    <strong>{formatMoney(edit.price || listing.price)}</strong>

    <div className="meta">
      <span>⌖ {edit.location || listing.location || "—"}</span>
    </div>
  </div>
</div>
            </section>

            <section className="panel edit-panel">
              <div className="panel-head">
                <h2>Edit Listing</h2>
                <span>Details + Keywords</span>
              </div>

              <div className="edit-grid">
                <label>
                  Price
                  <input value={edit.price} onChange={e => setEdit({ ...edit, price: e.target.value })} />
                </label>

                <label>
                  Hours
                  <input value={edit.hours} onChange={e => setEdit({ ...edit, hours: e.target.value })} />
                </label>

                <label className="wide">
                  Location
                  <input value={edit.location} onChange={e => setEdit({ ...edit, location: e.target.value })} />
                </label>

                <label className="wide">
                  Description
                  <textarea
                    value={edit.description}
                    onChange={e => setEdit({ ...edit, description: e.target.value })}
                  />
                </label>
              </div>

              <div className="keywords-panel">
                <div className="keywords-head">
                  <h2>Tags / Keywords</h2>
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
                      className={selectedKeywords.includes(keyword) ? "keyword-chip active" : "keyword-chip"}
                    >
                      {keyword}
                    </button>
                  ))}
                </div>
              </div>

              <button type="button" onClick={saveQuickEdit} className="save-btn">
                {saving ? "SAVING..." : "SAVE CHANGES"}
              </button>
            </section>
          </section>

          <section className="panel promote-panel">
            <div className="panel-head">
              <h2>Promote Listing</h2>
              <span>Copy + Open</span>
            </div>

            <div className="promote-grid">
              <button type="button" onClick={() => copyText("Marketplace Title", marketplaceTitle)}>
                {copied === "Marketplace Title" ? "COPIED" : "Copy Marketplace Title"}
              </button>
              <button type="button" onClick={() => copyText("Short Description", shortDescription)}>
                {copied === "Short Description" ? "COPIED" : "Copy Short Description"}
              </button>
              <button type="button" onClick={() => copyText("Long Description", longDescription)}>
                {copied === "Long Description" ? "COPIED" : "Copy Long Description"}
              </button>
              <button type="button" onClick={() => copyText("Facebook Post", buildSocialCopy("facebook", listing, listingUrl, selectedKeywords))}>
                {copied === "Facebook Post" ? "COPIED" : "Copy Facebook Post"}
              </button>
              <button type="button" onClick={() => copyText("Instagram Caption", buildSocialCopy("instagram", listing, listingUrl, selectedKeywords))}>
                {copied === "Instagram Caption" ? "COPIED" : "Copy Instagram Caption"}
              </button>
              <button type="button" onClick={() => copyText("LinkedIn Post", buildSocialCopy("linkedin", listing, listingUrl, selectedKeywords))}>
                {copied === "LinkedIn Post" ? "COPIED" : "Copy LinkedIn Post"}
              </button>
              <a href="https://www.facebook.com/marketplace/create/vehicle" target="_blank" rel="noreferrer">Facebook Marketplace</a>
              <a href="https://www.instagram.com/" target="_blank" rel="noreferrer">Instagram</a>
              <a href="https://www.tiktok.com/upload" target="_blank" rel="noreferrer">TikTok</a>
              <a href="https://www.linkedin.com/feed/" target="_blank" rel="noreferrer">LinkedIn</a>
              <button type="button" onClick={downloadHeroImage}>Download Hero</button>
              <button type="button" onClick={downloadAllPhotos}>Download All Photos</button>
            </div>
          </section>

          <section className="panel seller-bar">
            {sellerLogo ? (
              <img src={sellerLogo} alt={sellerName} />
            ) : (
              <div className="seller-icon"><i className="fa-regular fa-user"></i></div>
            )}

            <div>
              <span>Seller</span>
              <strong>{sellerName}</strong>
              <p>Seller profile/contact expansion goes here next.</p>
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

        * { box-sizing: border-box; }

        main { min-height: 100vh; background: #0b0b0b; }

        .nav {
          height: 64px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 2%;
          background: #050505;
          border-bottom: 1px solid rgba(255,255,255,.08);
        }

        .logo-img { height: 38px; display: block; }

        .nav-links { display: flex; align-items: center; gap: 14px; }

        .nav-links a {
          color: white;
          text-decoration: none;
          font-weight: 900;
          text-transform: uppercase;
          font-size: 12px;
        }

        .yellow-link { color: ${BRAND_YELLOW} !important; }

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
          padding: 14px 2% 48px;
        }

        .panel,
        .command-bar {
          background: #151515;
          border: 1px solid #282828;
          border-radius: 14px;
        }

        .command-bar {
          padding: 10px;
          margin-bottom: 10px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
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
          white-space: nowrap;
        }

        .live-pill span {
          width: 8px;
          height: 8px;
          background: #38A169;
          border-radius: 50%;
        }

        .command-actions {
          display: flex;
          flex-wrap: wrap;
          justify-content: flex-end;
          gap: 7px;
        }

        .mini-btn {
          border: 1px solid #333;
          background: #101010;
          color: #f2f2f2;
          border-radius: 999px;
          padding: 8px 10px;
          font-size: 9px;
          font-weight: 900;
          text-decoration: none;
          cursor: pointer;
        }

        .yellow-btn {
          background: ${BRAND_YELLOW};
          color: #050505;
          border-color: ${BRAND_YELLOW};
        }

        .danger-btn {
          border-color: rgba(229,62,62,.6);
          color: #ff9b9b;
        }

        .photo-row-panel {
          padding: 14px;
          margin-bottom: 10px;
        }

        .panel-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          margin-bottom: 12px;
        }

        .panel-head h2 {
          margin: 0;
          color: #f2f2f2;
          font-size: 16px;
          text-transform: uppercase;
        }

        .panel-head span {
          color: ${BRAND_YELLOW};
          font-size: 10px;
          font-weight: 900;
          text-transform: uppercase;
        }

        .photo-add-box {
          display: block;
          border: 1px dashed #444;
          background: #101010;
          border-radius: 12px;
          padding: 12px;
          margin-bottom: 10px;
          text-align: center;
          color: ${BRAND_YELLOW};
          font-size: 11px;
          font-weight: 900;
          cursor: pointer;
          text-transform: uppercase;
        }

        .photo-add-box input { display: none; }

        .photo-strip {
          display: flex;
          gap: 10px;
          overflow-x: auto;
          padding-bottom: 8px;
        }

        .photo-tile {
          position: relative;
          flex: 0 0 150px;
          height: 110px;
          border: 1px solid #2a2a2a;
          border-radius: 12px;
          overflow: hidden;
          cursor: grab;
          background: #101010;
        }

        .photo-tile img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .hero-tile { border: 2px solid ${BRAND_YELLOW}; }

        .hero-badge {
          position: absolute;
          top: 7px;
          left: 7px;
          background: ${BRAND_YELLOW};
          color: #050505;
          font-size: 9px;
          font-weight: 900;
          padding: 4px 7px;
          border-radius: 999px;
          z-index: 2;
        }

        .photo-tile button {
          position: absolute;
          top: 7px;
          right: 7px;
          width: 22px;
          height: 22px;
          border: none;
          background: #B91C1C;
          color: white;
          border-radius: 50%;
          font-size: 13px;
          font-weight: 900;
          cursor: pointer;
          z-index: 3;
        }

        .main-grid {
          display: grid;
          grid-template-columns: minmax(420px, 540px) 1fr;
          gap: 10px;
          margin-bottom: 10px;
        }

        .preview-card { overflow: hidden; }

        .photo-stage {
          position: relative;
          background: #050505;
        }

        .hero-photo {
          width: 100%;
          height: 380px;
          object-fit: cover;
          display: block;
        }

        .photo-nav {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 36px;
          height: 48px;
          border: 1px solid rgba(255,255,255,.2);
          background: rgba(0,0,0,.55);
          color: white;
          border-radius: 10px;
          font-size: 26px;
          cursor: pointer;
        }

        .photo-nav.left { left: 10px; }
        .photo-nav.right { right: 10px; }

        .card-body,
.edit-panel,
.promote-panel,
.seller-bar {
  padding: 18px;
}

.preview-card .live-card-body {
  padding: 22px;
}

.preview-card .title-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 18px;
}

.preview-card h3 {
  margin: 0;
  color: #F2F2F2;
  font-size: 24px;
  letter-spacing: -0.3px;
  line-height: 1.1;
}

.preview-card .hours-inline {
  color: #8A8A8A;
  font-size: 15px;
  font-weight: 800;
  letter-spacing: .3px;
  white-space: nowrap;
  text-align: right;
}

.preview-card .feature-line {
  min-height: 48px;
  margin: 12px 0 24px;
  color: #8F8F8F;
  font-size: 16px;
  line-height: 1.4;
}

.preview-card .price-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 18px;
}

.preview-card .price-row strong {
  color: #F2F2F2;
  font-size: 26px;
}

.preview-card .meta {
  display: flex;
  gap: 12px;
  font-size: 13px;
  color: #9A9A9A;
  flex-wrap: wrap;
}

.preview-card .price-row span {
  color: #9A9A9A;
  font-size: 13px;
  font-weight: 900;
  letter-spacing: .4px;
  white-space: nowrap;
}

h1 {
  margin: 0 0 16px;
  color: #f2f2f2;
  font-size: 26px;
  line-height: 1.08;
}
        .facts {
          display: grid;
          grid-template-columns: 90px 1fr;
          row-gap: 10px;
          font-size: 14px;
        }

        .facts span { color: #888; }
        .facts strong { color: #f2f2f2; }

        .tag-row {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 14px;
        }

        .tag-row span,
        .keyword-chip {
          background: rgba(255,196,0,.08);
          border: 1px solid rgba(255,196,0,.25);
          color: #ffc400;
          border-radius: 999px;
          padding: 6px 9px;
          font-size: 9px;
          font-weight: 900;
          text-transform: uppercase;
        }

        .edit-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }

        .wide { grid-column: 1 / -1; }

        label {
          display: grid;
          gap: 6px;
          color: #888;
          font-size: 10px;
          font-weight: 900;
          text-transform: uppercase;
        }

        input,
        textarea {
          width: 100%;
          background: #101010;
          border: 1px solid #303030;
          border-radius: 9px;
          color: #f2f2f2;
          padding: 11px 12px;
          font-size: 13px;
          outline: none;
        }

        textarea {
          min-height: 150px;
          resize: vertical;
          font-family: Arial, sans-serif;
        }

        input:focus,
        textarea:focus {
          border-color: ${BRAND_YELLOW};
        }

        .keywords-panel { margin-top: 14px; }

        .keywords-head {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
        }

        .keywords-head h2 {
          margin: 0;
          font-size: 13px;
          color: #f2f2f2;
          text-transform: uppercase;
        }

        .keywords-head span {
          color: #888;
          font-size: 10px;
          font-weight: 900;
        }

        .keyword-search { margin-bottom: 8px; }

        .keyword-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          max-height: 220px;
          overflow-y: auto;
          border: 1px solid #252525;
          background: #101010;
          border-radius: 12px;
          padding: 8px;
        }

        .keyword-chip {
          cursor: pointer;
          background: #181818;
          color: #cfcfcf;
          border-color: #333;
        }

        .keyword-chip.active {
          background: ${BRAND_YELLOW};
          color: #050505;
          border-color: ${BRAND_YELLOW};
        }

        .save-btn {
          width: 100%;
          margin-top: 14px;
          border: none;
          border-radius: 10px;
          padding: 14px 16px;
          background: ${BRAND_YELLOW};
          color: #050505;
          font-size: 12px;
          font-weight: 900;
          cursor: pointer;
        }

        .promote-panel {
          margin-bottom: 10px;
        }

        .promote-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
        }

        .promote-grid button,
        .promote-grid a {
          min-height: 36px;
          background: #101010;
          border: 1px solid rgba(255,255,255,.12);
          color: #f2f2f2;
          border-radius: 999px;
          padding: 9px 12px;
          font-size: 9px;
          font-weight: 900;
          text-decoration: none;
          cursor: pointer;
          text-align: center;
          text-transform: uppercase;
        }

        .promote-grid a {
          color: ${BRAND_YELLOW};
          border-color: rgba(255,196,0,.25);
          background: rgba(255,196,0,.04);
        }

        .seller-bar {
          display: grid;
          grid-template-columns: 130px 1fr;
          gap: 16px;
          align-items: center;
        }

        .seller-bar img {
          max-width: 120px;
          max-height: 70px;
          object-fit: contain;
        }

        .seller-icon {
          width: 58px;
          height: 58px;
          border: 1px solid #555;
          border-radius: 50%;
          display: grid;
          place-items: center;
          color: #aaa;
        }

        .seller-bar span {
          display: block;
          color: #888;
          font-size: 10px;
          font-weight: 900;
          text-transform: uppercase;
          margin-bottom: 5px;
        }

        .seller-bar strong {
          color: #f2f2f2;
          font-size: 18px;
        }

        .seller-bar p {
          margin: 6px 0 0;
          color: #888;
          font-size: 12px;
        }

        @media (max-width: 1000px) {
          .main-grid,
          .promote-grid {
            grid-template-columns: 1fr;
          }

          .command-bar {
            align-items: stretch;
            flex-direction: column;
          }

          .command-actions {
            justify-content: flex-start;
          }

          .seller-bar {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
}
