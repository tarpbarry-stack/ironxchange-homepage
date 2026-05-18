import Head from "next/head";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";

const BRAND_YELLOW = "#FFC400";

function slugify(text = "") {
  return String(text).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
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
 
