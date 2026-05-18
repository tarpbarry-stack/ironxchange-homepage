import Head from "next/head";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";

const BRAND_YELLOW = "#FFC400";

function slugify(text = "") {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function clean(value) {
  return value ? String(value).trim() : "";
}

function getListingImages(listing) {
  return [
    ...(Array.isArray(listing?.images) ? listing.images : []),
    ...(Array.isArray(listing?.imageUrls) ? listing.imageUrls : []),
    listing?.imageUrl,
    listing?.image
  ].filter(Boolean);
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
      JSON.stringify([event, ...current].slice(0, 25))
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

function buildSocialCopy(platform, listing, listingUrl) {
  const title = clean(listing.title) || "Equipment Listing";
  const price = clean(listing.price) || "Call for Price";
  const hours = clean(listing.hours) || "Hours not listed";
  const location = clean(listing.location) || "Location not listed";
  const description =
    clean(listing.description) ||
    "Clean machine. Full specs and photos available on IronXchange.";

  if (platform === "x") {
    return `${title}
${hours} | ${location}
${price}

Listed on IronXchange:
${listingUrl}

#IronXchange #HeavyEquipment`;
  }

  if (platform === "linkedin") {
    return `${title}

${hours} | ${location}
${price}

Now listed on IronXchange.

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
    description: "",
    tags: ""
  });
  const [photoOrder, setPhotoOrder] = useState([]);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  useEffect(() => {
    fetch("/api/listings")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setListings(data);
      })
      .finally(() => setLoading(false));
  }, []);

  function changeActivePhoto(direction) {
  const photos = photoOrder.length > 0 ? photoOrder : listingImages;

  if (photos.length === 0) return;

  setActivePhotoIndex(current => {
    const next = current + direction;

    if (next < 0) return photos.length - 1;
    if (next >= photos.length) return 0;

    return next;
  });
}

  const listing = useMemo(() => {
    if (!id || listings.length === 0) return null;
    return listings.find(item => String(item.id) === String(id)) || null;
  }, [id, listings]);

  const listingUrl = listing ? getListingUrl(listing) : "";
  const listingImages = listing ? getListingImages(listing) : [];

  useEffect(() => {
    if (!listing) return;

    setEdit({
      price: clean(listing.price),
      hours: clean(listing.hours),
      location: clean(listing.location),
      description: clean(listing.description),
      tags: Array.isArray(listing.keywords)
        ? listing.keywords.join(", ")
        : Array.isArray(listing.tags)
        ? listing.tags.join(", ")
        : clean(listing.keywords || listing.tags)
    });

    setPhotoOrder(getListingImages(listing));
  }, [listing]);

  const sellerName =
    clean(listing?.sellerName) ||
    clean(listing?.sellerCompany) ||
    "IronXchange Seller";

  const sellerLogo = listing?.sellerLogo || listing?.profileImage || "";

  const shareButtons = [
    ["Facebook Marketplace Post", "facebook"],
    ["Facebook Page Post", "facebook"],
    ["Instagram Caption", "instagram"],
    ["TikTok Caption", "tiktok"],
    ["X Post", "x"],
    ["LinkedIn Post", "linkedin"]
  ];

  const marketplaceTitle = listing
    ? `${clean(listing.title)} | ${clean(listing.hours)} | ${clean(listing.location)}`
    : "";

  const shortDescription = listing
    ? `
${clean(listing.title)}
${clean(listing.hours)} | ${clean(listing.location)}

${clean(listing.price)}

Listed on IronXchange:
${listingUrl}
`.trim()
    : "";

  const longDescription = listing
    ? `
${clean(listing.title)}

${clean(listing.hours)} | ${clean(listing.location)}
${clean(listing.price)}

${clean(listing.description)}

View full specs + photos:
${listingUrl}

Listed on IronXchange.
`.trim()
    : "";

  async function copyText(label, text) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);

      addActivity(
        "success",
        `${label} copied — ${clean(listing?.title) || "Listing"}`
      );

      setTimeout(() => setCopied(""), 1600);
    } catch {
      addActivity(
        "error",
        `${label} copy failed — ${clean(listing?.title) || "Listing"}`
      );

      alert("Copy failed. Highlight and copy manually.");
    }
  }

  async function downloadHeroImage() {
    const hero = photoOrder[0] || listingImages[0] || listing?.imageUrl || listing?.image;

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
    const photos = photoOrder.length > 0 ? photoOrder : listingImages;

    if (photos.length === 0) {
      alert("No photos found.");
      return;
    }

    for (let i = 0; i < photos.length; i += 1) {
      await downloadImage(photos[i], `${slugify(listing.title)}-${i + 1}.jpg`);
    }

    addActivity(
      "success",
      `Photo pack downloaded — ${clean(listing?.title) || "Listing"}`
    );
  }

  function movePhoto(index, direction) {
    const next = [...photoOrder];
    const target = index + direction;

    if (target < 0 || target >= next.length) return;

    [next[index], next[target]] = [next[target], next[index]];
    setPhotoOrder(next);

    addActivity(
      "success",
      `Photo order changed — ${clean(listing?.title) || "Listing"}`
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
            price: clean(edit.price).replace(/,/g, "")
          })
        });
      }

      addActivity(
        "success",
        `Quick edit saved — ${clean(listing?.title) || "Listing"}`
      );

      alert("Quick edit saved. Full field sync can be wired to Sharetribe next.");
    } catch {
      addActivity(
        "error",
        `Quick edit failed — ${clean(listing?.title) || "Listing"}`
      );

      alert("Quick edit failed.");
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
        <meta name="viewport" content="width=device-width, initial-scale=1" />
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
            <a href="/browse">SEARCH</a>
            <a href="/post-free" className="yellow-link">POST FREE</a>
            <a href="/account" className="login-icon logged-in" aria-label="Account">
              <i className="fa-regular fa-user"></i>
            </a>
          </div>
        </nav>

        <section className="wrap">
          <section className="command-bar">
            <div className="live-pill">
              <span></span>
              LISTING LIVE
            </div>

            <div className="command-actions">
              <a href={listingUrl} className="mini-btn yellow-btn">VIEW LIVE LISTING</a>
              <a href="/account" className="mini-btn">DASHBOARD</a>
              <button type="button" onClick={() => statusAction("Pause")} className="mini-btn">PAUSE</button>
              <button type="button" onClick={() => statusAction("Sold")} className="mini-btn">SOLD</button>
              <button type="button" onClick={() => statusAction("Archive")} className="mini-btn">ARCHIVE</button>
              <button type="button" onClick={() => statusAction("Duplicate")} className="mini-btn">DUPLICATE</button>
              <button type="button" onClick={() => statusAction("Delete")} className="mini-btn danger-btn">DELETE</button>
            </div>
          </section>

          <section className="work-grid">
            <section className="panel machine-panel">
              <div className="photo-stage">
  <img
    src={
      (photoOrder.length > 0 ? photoOrder : listingImages)[activePhotoIndex] ||
      listing.imageUrl ||
      listing.image ||
      "/images/hero-equipment-yard.jpg"
    }
    alt={listing.title}
    className="hero-photo"
  />

  <button
    type="button"
    className="photo-nav left"
    onClick={() => changeActivePhoto(-1)}
  >
    ‹
  </button>

  <button
    type="button"
    className="photo-nav right"
    onClick={() => changeActivePhoto(1)}
  >
    ›
  </button>
</div>

<div className="machine-body">
  <h1>{listing.title}</h1>

  <div className="facts">
    <span>Hours</span>
    <strong>{listing.hours || "—"}</strong>

    <span>Price</span>
    <strong>{listing.price || "Call"}</strong>

    <span>Location</span>
    <strong>{listing.location || "—"}</strong>
  </div>

  <div className="tag-row">
    {edit.tags
      .split(",")
      .map(tag => tag.trim())
      .filter(Boolean)
      .map(tag => (
        <span key={tag}>{tag}</span>
      ))
}
  </div>
</div>
    
    </section>
    
    <section className="panel edit-panel">
  <div className="panel-head">
    <h2>Edit Listing</h2>
    <span>Machine Details</span>
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

                <label>
                  Location
                  <input value={edit.location} onChange={e => setEdit({ ...edit, location: e.target.value })} />
                </label>

                <label>
                  Tags / Keywords
                  <input
                    value={edit.tags}
                    onChange={e => setEdit({ ...edit, tags: e.target.value })}
                    placeholder="aggregate, clean, ready to work"
                  />
                </label>

                <label className="wide">
                  Description
                  <textarea
                    value={edit.description}
                    onChange={e => setEdit({ ...edit, description: e.target.value })}
                    rows={5}
                  />
                </label>
              </div>

              <button type="button" onClick={saveQuickEdit} className="save-btn">
                {saving ? "SAVING..." : "SAVE CHANGES"}
              </button>
            </section>

            <section className="panel seller-panel">
  <div className="performance-grid">
    <div><span>Views</span><strong>—</strong></div>
    <div><span>Saves</span><strong>—</strong></div>
    <div><span>Inquiries</span><strong>—</strong></div>
    <div><span>Shares</span><strong>—</strong></div>
  </div>

  <button
    type="button"
    className="secondary-btn"
    onClick={downloadHeroImage}
  >
    DOWNLOAD HERO IMAGE
  </button>

  <button
    type="button"
    className="secondary-btn"
    onClick={downloadAllPhotos}
  >
    DOWNLOAD ALL PHOTOS
  </button>

  <button
    type="button"
    className="copy-link"
    onClick={() => copyText("Listing Link", listingUrl)}
  >
    {copied === "Listing Link"
      ? "COPIED"
      : "COPY LISTING LINK"}
  </button>

  <div className="seller-mini">
    {sellerLogo ? (
      <img src={sellerLogo} alt={sellerName} />
    ) : (
      <i className="fa-regular fa-user"></i>
    )}

    <div>
      <span>Seller</span>
      <strong>{sellerName}</strong>
    </div>
  </div>

</section>

            <section className="panel promote-panel">
              <div className="panel-head">
                <h2>Promote Listing</h2>
                <span>Social Blast</span>
              </div>

              <div className="share-grid">
                <button type="button" onClick={() => copyText("Marketplace Title", marketplaceTitle)}>
                  <i className="fa-regular fa-copy"></i>
                  {copied === "Marketplace Title" ? "COPIED" : "COPY MARKETPLACE TITLE"}
                </button>

                <button type="button" onClick={() => copyText("Short Description", shortDescription)}>
                  <i className="fa-regular fa-copy"></i>
                  {copied === "Short Description" ? "COPIED" : "COPY SHORT DESCRIPTION"}
                </button>

                <button type="button" onClick={() => copyText("Long Description", longDescription)}>
                  <i className="fa-regular fa-copy"></i>
                  {copied === "Long Description" ? "COPIED" : "COPY LONG DESCRIPTION"}
                </button>

                {shareButtons.map(([label, platform]) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => copyText(label, buildSocialCopy(platform, listing, listingUrl))}
                  >
                    <i className="fa-regular fa-copy"></i>
                    {copied === label ? "COPIED" : `COPY ${label.toUpperCase()}`}
                  </button>
                ))}
              </div>

              <div className="open-grid">
                <a href="https://www.facebook.com/marketplace/create/vehicle" target="_blank" rel="noreferrer">Facebook Marketplace</a>
                <a href="https://www.facebook.com/" target="_blank" rel="noreferrer">Facebook</a>
                <a href="https://www.instagram.com/" target="_blank" rel="noreferrer">Instagram</a>
                <a href="https://www.tiktok.com/upload" target="_blank" rel="noreferrer">TikTok</a>
                <a href="https://x.com/compose/post" target="_blank" rel="noreferrer">X</a>
                <a href="https://www.linkedin.com/feed/" target="_blank" rel="noreferrer">LinkedIn</a>
              </div>
            </section>
          </section>

          <section className="panel photo-panel">
            <div className="panel-head">
              <h2>Photo Order</h2>
              <span>Hero image is first</span>
            </div>

            <div className="photo-strip">
              {photoOrder.length > 0 ? (
                photoOrder.map((url, index) => (
                  <div className="photo-tile" key={`${url}-${index}`}>
                    <img src={url} alt={`Photo ${index + 1}`} />

                    <div className="photo-controls">
                      <strong>{index === 0 ? "HERO" : `#${index + 1}`}</strong>
                      <button type="button" onClick={() => movePhoto(index, -1)}>←</button>
                      <button type="button" onClick={() => movePhoto(index, 1)}>→</button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="empty">No photos found.</p>
              )}
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
          background: #0b0b0b;
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
          width: auto;
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
          letter-spacing: .5px;
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
          font-size: 14px !important;
        }

        .wrap {
          padding: 14px 2% 48px;
          max-width: 1580px;
          margin: 0 auto;
        }

        .panel,
        .command-bar {
          background: #151515;
          border: 1px solid #282828;
          border-radius: 14px;
        }

        .command-bar {
          min-height: 54px;
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
          letter-spacing: .5px;
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
          letter-spacing: .35px;
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

        .work-grid {
          display: grid;
          grid-template-columns: 430px 1fr;
          gap: 10px;
        }

        .machine-panel {
          overflow: hidden;
        }

        .hero-photo {
          width: 100%;
          height: 305px;
          object-fit: cover;
          display: block;
          background: #050505;
        }

        .machine-body,
        .edit-panel,
        .seller-panel,
        .promote-panel,
        .photo-panel {
          padding: 18px;
        }

        h1 {
          margin: 0 0 16px;
          color: #f2f2f2;
          font-size: 28px;
          line-height: 1.08;
          letter-spacing: -.5px;
        }

        h2 {
          margin: 0;
          color: #f2f2f2;
          font-size: 18px;
          text-transform: uppercase;
          letter-spacing: .35px;
        }

        .facts {
          display: grid;
          grid-template-columns: 90px 1fr;
          row-gap: 10px;
          font-size: 14px;
        }

        .facts span {
          color: #888;
        }

        .facts strong {
          color: #f2f2f2;
        }

        .panel-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          margin-bottom: 14px;
        }

        .panel-head span {
          color: ${BRAND_YELLOW};
          font-size: 10px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: .4px;
        }

        .edit-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }

        label {
          display: grid;
          gap: 6px;
          color: #888;
          font-size: 10px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: .35px;
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
          text-transform: none;
          font-weight: 700;
        }

        textarea {
          resize: vertical;
          font-family: Arial, sans-serif;
          line-height: 1.45;
        }

        input:focus,
        textarea:focus {
          border-color: ${BRAND_YELLOW};
        }

        .wide {
          grid-column: 1 / -1;
        }

        .save-btn,
        .copy-link,
        .secondary-btn {
          width: 100%;
          border: none;
          border-radius: 10px;
          padding: 14px 16px;
          font-size: 12px;
          font-weight: 900;
          letter-spacing: .4px;
          cursor: pointer;
        }

        .save-btn {
          margin-top: 14px;
          background: ${BRAND_YELLOW};
          color: #050505;
        }

        .copy-link {
          margin-top: 10px;
          background: ${BRAND_YELLOW};
          color: #050505;
        }

        .secondary-btn {
          display: block;
          margin-top: 10px;
          text-align: center;
          text-decoration: none;
          background: #101010;
          color: #f2f2f2;
          border: 1px solid #3a3a3a;
        }

        .seller-mini {
          display: grid;
          grid-template-columns: 112px 1fr;
          gap: 14px;
          align-items: center;
          margin-bottom: 16px;
        }

        .seller-mini img {
          max-width: 112px;
          max-height: 62px;
          object-fit: contain;
          display: block;
        }

        .seller-mini i {
          width: 58px;
          height: 58px;
          border: 1px solid #555;
          border-radius: 50%;
          display: grid;
          place-items: center;
          color: #aaa;
        }

        .seller-mini span {
          display: block;
          color: #888;
          font-size: 10px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: .4px;
          margin-bottom: 5px;
        }

        .seller-mini strong {
          color: #f2f2f2;
          font-size: 15px;
        }

        .performance-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
          margin-bottom: 8px;
        }

        .performance-grid div {
          background: #101010;
          border: 1px solid #2a2a2a;
          border-radius: 10px;
          padding: 10px;
        }

        .performance-grid span {
          display: block;
          color: #888;
          font-size: 9px;
          font-weight: 900;
          text-transform: uppercase;
          margin-bottom: 5px;
        }

        .performance-grid strong {
          color: #f2f2f2;
          font-size: 17px;
        }

        .share-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
  margin-bottom: 14px;
}

.share-grid button {
  min-height: 38px;
  background: #101010;
  border: 1px solid rgba(255,255,255,.11);
  color: #f2f2f2;
  border-radius: 999px;
  padding: 9px 12px;
  font-size: 9px;
  font-weight: 900;
  letter-spacing: .35px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 9px;
  text-transform: uppercase;
}
        .share-grid button i {
          color: ${BRAND_YELLOW};
        }

.tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 14px;
}

.tag-row span {
  background: rgba(255,196,0,.08);
  border: 1px solid rgba(255,196,0,.25);
  color: #ffc400;
  border-radius: 999px;
  padding: 6px 9px;
  font-size: 9px;
  font-weight: 900;
  text-transform: uppercase;
}

        .open-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          border-top: 1px solid rgba(255,255,255,.09);
          padding-top: 16px;
        }

        .open-grid a {
          text-align: center;
          text-decoration: none;
          color: ${BRAND_YELLOW};
          background: rgba(255,196,0,.045);
          border: 1px solid rgba(255,196,0,.22);
          border-radius: 999px;
          padding: 10px 8px;
          font-size: 9px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: .35px;
        }

        .photo-stage {
  position: relative;
}

.photo-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 34px;
  height: 46px;
  border: 1px solid rgba(255,255,255,.2);
  background: rgba(0,0,0,.55);
  color: #fff;
  border-radius: 10px;
  font-size: 26px;
  cursor: pointer;
}

.photo-nav.left {
  left: 10px;
}

.photo-nav.right {
  right: 10px;
}

        .photo-panel {
  margin-bottom: 10px;
  padding: 14px;
  grid-column: 1 / -1;
}

.photo-strip {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding-bottom: 8px;
  scroll-snap-type: x mandatory;
}

.photo-tile {
  flex: 0 0 170px;
  scroll-snap-align: start;
  background: #101010;
  border: 1px solid #2a2a2a;
  border-radius: 12px;
  overflow: hidden;
}

        .photo-tile img {
          width: 100%;
          height: 110px;
          object-fit: cover;
          display: block;
        }

        .photo-controls {
          display: grid;
          grid-template-columns: 1fr 34px 34px;
          align-items: center;
          gap: 6px;
          padding: 8px;
        }

        .photo-controls strong {
          color: ${BRAND_YELLOW};
          font-size: 10px;
          font-weight: 900;
        }

        .photo-controls button {
          background: #181818;
          border: 1px solid #333;
          color: #f2f2f2;
          border-radius: 8px;
          height: 28px;
          cursor: pointer;
        }

        .empty {
          color: #999;
          margin: 0;
          font-size: 13px;
        }

        @media (max-width: 1000px) {
          .work-grid {
            grid-template-columns: 1fr;
          }

          .command-bar {
            align-items: stretch;
            flex-direction: column;
          }

          .command-actions {
            justify-content: flex-start;
          }
        }

        @media (max-width: 650px) {
          .nav {
            height: 60px;
            padding: 8px 4%;
          }

          .logo-img {
            height: 34px;
          }

          .nav-links a:not(.yellow-link):not(.login-icon) {
            display: none;
          }

          .wrap {
            padding: 12px 3% 36px;
          }

          .edit-grid,
          .share-grid,
          .open-grid,
          .performance-grid {
            grid-template-columns: 1fr;
          }

          .photo-strip {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
    </>
  );
}
