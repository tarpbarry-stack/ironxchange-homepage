import Head from "next/head";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { createInstance, types as sdkTypes } from "sharetribe-flex-sdk";
import { captureIXEvent } from "../lib/posthog";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

import MachineBadges from "../components/MachineBadges";

import {
  getFrameClass,
  getFrameStyle
} from "../lib/ixvision/frameEngine";

import categoryDnaKeywords from "../lib/categoryDnaKeywords";
import {
  buildIXPhotoVariants,
  getIXActivePhotoUrl
} from "../lib/ixvision/pipeline/processIXPhoto";

const BRAND_YELLOW = "#FFC400";

const { UUID } = sdkTypes;

const sdk = createInstance({
  clientId: process.env.NEXT_PUBLIC_SHARETRIBE_CLIENT_ID
});

const workflowOptions = [
  { value: "good-listing", label: "Good Listing" },
  { value: "reprice", label: "Reprice" },
  { value: "refresh-photos", label: "Refresh Photos" },
  { value: "social-blast", label: "Social Blast" },
  { value: "review", label: "Review" }
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
  img.attributes?.variants?.["scaled-large"]?.url ||
  img.attributes?.variants?.["scaled-medium"]?.url ||
  img.attributes?.variants?.default?.url ||
  img.attributes?.variants?.["landscape-crop"]?.url ||
  img.attributes?.variants?.["scaled-small"]?.url ||
  null
);
}

function getImageId(img) {
  if (!img) return "";

  return (
    img.imageId ||
    img.id?.uuid ||
    img.id ||
    img.uuid ||
    ""
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
    listing.attributes?.metadata?.workflowStatus ||
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

function getListingId(listing = {}) {
  return listing.id?.uuid || listing.id || listing.uuid || listing.listingId || "";
}

function getAuthorId(listing = {}) {
  return (
    listing.authorId ||
    listing.sellerId ||
    listing.author?.id?.uuid ||
    listing.author?.id ||
    ""
  );
}

function getListingMake(listing = {}) {
  return (
    listing.make ||
    listing.publicData?.make ||
    listing.attributes?.publicData?.make ||
    listing.metadata?.make ||
    listing.attributes?.metadata?.make ||
    ""
  );
}

function trackLaunchEvent(eventName, payload = {}) {
  // POSTHOG HOOK:
  // Global window.posthog can capture Launch Studio behavior here.
  // Wire later without touching page flow.
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

function buildSocialCopy(platform, listing, listingUrl, selectedKeywords = [], edit = {}) {
  const title = clean(listing?.title) || "Equipment Listing";
  const price = formatMoney(edit.price || listing?.price);
  const hours = formatHours(edit.hours || listing?.hours);
  const location = clean(edit.location || listing?.location) || "Location not listed";
  const description =
    clean(edit.description) ||
    clean(listing?.description) ||
    clean(listing?.publicData?.description) ||
    "Clean machine. Full specs and photos available on IronXchange.";

  const features = selectedKeywords.slice(0, 6).join(" • ");
  const linkLine = `Full specs + photos:\n${listingUrl}`;

  if (platform === "sms" || platform === "whatsapp" || platform === "messenger") {
    return `${title}
${hours} | ${location}
${price}

${features}

${linkLine}`;
  }

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

export async function getServerSideProps() {
  return {
    props: {}
  };
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

useEffect(() => {
  trackLaunchEvent("launch_page_viewed", {
    page: "live",
    listingId: id || ""
  });
}, [id]);

  const [photoItems, setPhotoItems] = useState([]);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [draggedPhotoIndex, setDraggedPhotoIndex] = useState(null);

  const [selectedKeywords, setSelectedKeywords] = useState([]);
  const [keywordSearch, setKeywordSearch] = useState("");
  const [workflowStatus, setWorkflowStatus] = useState("Good Listing");

const [externalLinks, setExternalLinks] = useState([
  { label: "", url: "" },
  { label: "", url: "" },
  { label: "", url: "" }
]);

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
    return listings.find(item => String(getListingId(item)) === String(id)) || null;
  }, [id, listings]);

  const listingId = getListingId(listing || {});
  const listingUrl = listing ? getListingUrl(listing) : "";
  const listingStatus = getListingStatus(listing || {});
  const isPaused = listingStatus === "paused";

  const sellerInventory = useMemo(() => {
    if (!listing) return [];

    const authorId = getAuthorId(listing);

    return listings.filter(item => {
      const itemStatus = getListingStatus(item);

      if (itemStatus === "deleted" || itemStatus === "archived") return false;

      if (authorId) {
        return String(getAuthorId(item)) === String(authorId);
      }

      return true;
    });
  }, [listing, listings]);

  const currentInventoryIndex = useMemo(() => {
    if (!listing) return -1;

    return sellerInventory.findIndex(
      item => String(getListingId(item)) === String(listingId)
    );
  }, [sellerInventory, listing, listingId]);

  const previousListing =
    currentInventoryIndex > 0 ? sellerInventory[currentInventoryIndex - 1] : null;

  const nextListing =
    currentInventoryIndex >= 0 && currentInventoryIndex < sellerInventory.length - 1
      ? sellerInventory[currentInventoryIndex + 1]
      : null;

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

  const savedLinks = Array.isArray(listing?.publicData?.externalLinks)
  ? listing.publicData.externalLinks
  : [];

setExternalLinks([
  savedLinks[0] || { label: "", url: "" },
  savedLinks[1] || { label: "", url: "" },
  savedLinks[2] || { label: "", url: "" }
]);


const rawImages = Array.isArray(listing?.imageObjects) && listing.imageObjects.length > 0
  ? listing.imageObjects
  : Array.isArray(listing?.images)
    ? listing.images
    : [];

setPhotoItems(
  rawImages
    .map((img, index) => ({
      id: `existing-${index}-${getImageUrl(img)}`,

      imageId: getImageId(img),

      url: getImageUrl(img),

      originalUrl: getImageUrl(img),
      cleanUrl: getImageUrl(img),
      dealerPopUrl: getImageUrl(img),

      activeMode: "original",

      file: null,

      existing: true
    }))
    .filter(item => item.url)
);

    

    setActivePhotoIndex(0);

    trackLaunchEvent("launch_studio_opened", {
      listingId: String(getListingId(listing)),
      listingTitle: listing.title,
      listingStatus: getListingStatus(listing),
      workflowStatus: getWorkflowStatus(listing)
    });
  }, [listing]);

 const heroPhoto =
  getIXActivePhotoUrl(photoItems[activePhotoIndex]) ||
  getIXActivePhotoUrl(photoItems[0]) ||
  listing?.imageUrl ||
  listing?.image ||
  "/images/hero-equipment-yard.jpg";

  const activePreviewPhoto =
  photoItems[activePhotoIndex] ||
  photoItems[0] ||
  { url: heroPhoto };

  const title = cleanMachineTitle(listing?.title || "Machine Listing");

  const sellerName =
    clean(listing?.sellerName) ||
    clean(listing?.sellerCompany) ||
    clean(listing?.authorName) ||
    "IronXchange Seller";

  const sellerLogo = listing?.sellerLogo || listing?.profileImage || "";

const rawListingCategory =
  listing?.publicData?.category ||
  listing?.category ||
  listing?.categoryLevel1 ||
  listing?.publicData?.categoryLevel1 ||
  "";

const listingCategory =
  categoryDnaKeywords[rawListingCategory]
    ? rawListingCategory
    : categoryDnaKeywords[String(rawListingCategory).toUpperCase()]
      ? String(rawListingCategory).toUpperCase()
      : "";

  const selectedKeywordSet = useMemo(() => {
  return new Set(selectedKeywords);
}, [selectedKeywords]);

const availableKeywords = useMemo(() => {
  const dna = categoryDnaKeywords[listingCategory] || [];
  return Array.from(new Set(dna));
}, [listingCategory]);

const filteredKeywords = useMemo(() => {
  const search = keywordSearch.trim().toLowerCase();

  const selected = selectedKeywords.filter(Boolean);

  const unselected = availableKeywords.filter(
    keyword => !selectedKeywordSet.has(keyword)
  );

  if (!search) {
    return [...selected, ...unselected].slice(0, 180);
  }

  const selectedMatches = selected.filter(keyword =>
    keyword.toLowerCase().includes(search)
  );

  const startsWithMatches = unselected.filter(keyword =>
    keyword.toLowerCase().startsWith(search)
  );

  const includesMatches = unselected.filter(keyword => {
    const lower = keyword.toLowerCase();
    return !lower.startsWith(search) && lower.includes(search);
  });

  return [
    ...selectedMatches,
    ...startsWithMatches,
    ...includesMatches
  ].slice(0, 180);
}, [availableKeywords, selectedKeywords, selectedKeywordSet, keywordSearch]);
  const marketplaceTitle = listing
    ? `${clean(listing.title)} | ${formatHours(edit.hours || listing.hours)} | ${clean(edit.location || listing.location)}`
    : "";

  const shortDescription = listing
    ? buildSocialCopy("sms", listing, listingUrl, selectedKeywords, edit)
    : "";

  const longDescription = listing
    ? buildSocialCopy("marketplace", listing, listingUrl, selectedKeywords, edit)
    : "";

  function goToListing(targetListing) {
    const targetId = getListingId(targetListing || {});
    if (!targetId) return;
    router.push(`/live?id=${targetId}`);
  }

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

  async function handlePhotos(e) {
  const files = Array.from(e.target.files || []).filter(file =>
    file.type.startsWith("image/")
  );

  if (files.length === 0) {
    e.target.value = "";
    return;
  }

  const make = getListingMake(listing);

  const mapped = await Promise.all(
    files.slice(0, 24).map(file =>
      buildIXPhotoVariants(file, {
        make,
        mode: "clean",
        userEmail: listing?.sellerEmail,
        companyName: sellerName
      })
    )
  );

  setPhotoItems(current => [...current, ...mapped]);

  addActivity(
    "success",
    `${mapped.length} IX polished photo${mapped.length === 1 ? "" : "s"} added`
  );

  trackLaunchEvent("launch_ix_photos_added", {
    listingId: String(listingId || ""),
    count: mapped.length,
    make
  });

  e.target.value = "";
}

async function reprocessExistingPhoto(photoId, mode) {
  if (!mode || mode === "original") return;

  const targetPhoto = photoItems.find(photo => photo.id === photoId);

  if (!targetPhoto?.originalUrl) return;

  try {
    setCommandBusy(`photo-${photoId}-${mode}`);

    const response = await fetch(targetPhoto.originalUrl);
    const blob = await response.blob();

    const file = new File(
      [blob],
      `${slugify(title)}-${mode}.jpg`,
      { type: blob.type || "image/jpeg" }
    );

    const make = getListingMake(listing);

    const processed = await buildIXPhotoVariants(file, {
      make,
      mode,
      userEmail: listing?.sellerEmail,
      companyName: sellerName
    });

    setPhotoItems(current =>
      current.map(photo => {
        if (photo.id !== photoId) return photo;

        return {
          ...photo,

          cleanUrl:
            mode === "clean"
              ? processed.cleanUrl
              : photo.cleanUrl,

          cleanFile:
            mode === "clean"
              ? processed.cleanFile
              : photo.cleanFile,

          dealerPopUrl:
            mode === "dealerPop"
              ? processed.dealerPopUrl
              : photo.dealerPopUrl,

          dealerPopFile:
            mode === "dealerPop"
              ? processed.dealerPopFile
              : photo.dealerPopFile,

          url: getIXActivePhotoUrl(processed),
          file: processed.file,

          activeMode: mode,
          existing: false
        };
      })
    );

    addActivity("success", `Photo reprocessed — ${mode}`);
  } catch (error) {
    console.error("Existing photo reprocess failed:", error);
    alert(`Photo reprocess failed: ${error.message}`);
  } finally {
    setCommandBusy("");
  }
}

  
 async function handlePhotoDrop(e) {
  e.preventDefault();

  const files = Array.from(e.dataTransfer.files || []).filter(file =>
    file.type.startsWith("image/")
  );

  if (files.length === 0) return;

  const make = getListingMake(listing);

  const mapped = await Promise.all(
    files.slice(0, 24).map(file =>
      buildIXPhotoVariants(file, {
        make,
        mode: "clean",
        userEmail: listing?.sellerEmail,
        companyName: sellerName
      })
    )
  );

  setPhotoItems(current => [...current, ...mapped]);

  addActivity(
    "success",
    `${mapped.length} IX polished photo${mapped.length === 1 ? "" : "s"} dropped`
  );

  trackLaunchEvent("launch_ix_photos_dropped", {
    listingId: String(listingId || ""),
    count: mapped.length,
    make
  });
}

  function removePhoto(indexToRemove) {
    setPhotoItems(current => current.filter((_, index) => index !== indexToRemove));
    setActivePhotoIndex(0);

    addActivity("success", `Photo removed — ${title}`);
    trackLaunchEvent("launch_photo_removed", {
      listingId: String(listingId || ""),
      photoIndex: indexToRemove
    });
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
    trackLaunchEvent("launch_photo_reordered", {
      listingId: String(listingId || ""),
      fromIndex,
      toIndex
    });
  }

  async function copyText(label, text) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);

      addActivity("success", `${label} copied — ${title}`);
      trackLaunchEvent("launch_copy_clicked", {
        listingId: String(listingId || ""),
        label
      });

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
    trackLaunchEvent("launch_hero_downloaded", {
      listingId: String(listingId || "")
    });
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
    trackLaunchEvent("launch_photo_pack_downloaded", {
      listingId: String(listingId || ""),
      count: photoItems.length
    });
  }


async function buildLiveImageIdsForSave() {
  const finalImageIds = [];

  for (const photo of photoItems) {
   if (
  photo.existing &&
  photo.imageId &&
  !photo.file
) {
  finalImageIds.push(
    new UUID(photo.imageId)
  );

  continue;
}
    if (!photo.file) continue;

    const upload = await sdk.images.upload(
      { image: photo.file },
      { expand: true }
    );

    finalImageIds.push(
      new UUID(upload.data.data.id.uuid)
    );
  }

  if (photoItems.length > 0 && finalImageIds.length !== photoItems.length) {
    throw new Error(
      "Photo save stopped: final image count mismatch."
    );
  }

  return finalImageIds;
}





  

  

  async function saveQuickEdit() {
    if (!listingId) return;

    setSaving(true);

    try {
      const detailsResponse = await fetch("/api/update-listing-details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId,
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
            listingId,
            price: cleanNumber(edit.price)
          })
        });

        const priceData = await priceResponse.json();

        if (!priceResponse.ok) {
          throw new Error(priceData?.error || "Price update failed");
        }
      }

const imageIds = await buildLiveImageIdsForSave();

if (imageIds.length > 0) {
  await sdk.ownListings.update(
    {
      id: new UUID(listingId),
      images: imageIds
    },
    {
      expand: true,
      include: ["images"]
    }
  );
}

     trackLaunchEvent("launch_card_saved", {
  listingId: String(listingId),
  selectedKeywordCount: selectedKeywords.length,
  photoCount: photoItems.length,
  savedImageCount: imageIds.length
});

      alert("Launched. Listing updates applied.");
    } catch (err) {
      console.error("SAVE QUICK EDIT ERROR:", err);
      addActivity("error", `Launch failed — ${title}`);
      alert(`Launch failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  }

  async function updateWorkflow(nextWorkflow) {
    if (!listingId) return;

    setWorkflowStatus(nextWorkflow);

    try {
      const response = await fetch("/api/update-listing-workflow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId,
          workflowStatus: nextWorkflow
        })
      });

      if (!response.ok) throw new Error("Workflow update failed");

      addActivity("success", `Workflow set to ${nextWorkflow} — ${title}`);
      trackLaunchEvent("launch_workflow_updated", {
        listingId: String(listingId),
        workflowStatus: nextWorkflow
      });
    } catch (err) {
      console.error(err);
      addActivity("error", `Workflow update failed — ${title}`);
      alert("Workflow update failed.");
    }
  }


async function saveExternalLinks() {
  if (!listingId) return;

  try {
    const response = await fetch(
      "/api/update-listing-external-links",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          listingId,
          externalLinks
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "External links save failed");
    }

    addActivity(
      "success",
      `External links updated — ${title}`
    );

    trackLaunchEvent(
      "launch_external_links_saved",
      {
        listingId: String(listingId)
      }
    );

  } catch (error) {
    console.error(error);

    addActivity(
      "error",
      `External links failed — ${title}`
    );

    alert(`Save failed: ${error.message}`);
  }
}

  
  async function pauseListing() {
    if (!listingId) return;

    setCommandBusy("pause");

    try {
      const response = await fetch("/api/pause-listing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Pause failed");
      }

      setListings(current =>
        current.map(item =>
          String(getListingId(item)) === String(listingId)
            ? {
                ...item,
                listingStatus: "paused",
                publicData: {
                  ...(item.publicData || {}),
                  listingStatus: "paused"
                },
                metadata: {
                  ...(item.metadata || {}),
                  listingStatus: "paused"
                }
              }
            : item
        )
      );

      addActivity("success", `Listing paused — ${title}`);
      trackLaunchEvent("launch_listing_paused", { listingId: String(listingId) });
    } catch (error) {
      addActivity("error", `Pause failed — ${title}`);
      alert(`Pause failed: ${error.message}`);
      console.error("Pause failed:", error);
    } finally {
      setCommandBusy("");
    }
  }

  async function reactivateListing() {
    if (!listingId) return;

    setCommandBusy("reactivate");

    try {
      const response = await fetch("/api/reactivate-listing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Reactivate failed");
      }

      setListings(current =>
        current.map(item =>
          String(getListingId(item)) === String(listingId)
            ? {
                ...item,
                listingStatus: "live",
                publicData: {
                  ...(item.publicData || {}),
                  listingStatus: "live"
                },
                metadata: {
                  ...(item.metadata || {}),
                  listingStatus: "live"
                }
              }
            : item
        )
      );

      addActivity("success", `Listing reactivated — ${title}`);
      trackLaunchEvent("launch_listing_reactivated", { listingId: String(listingId) });
    } catch (error) {
      addActivity("error", `Reactivate failed — ${title}`);
      alert(`Reactivate failed: ${error.message}`);
      console.error("Reactivate failed:", error);
    } finally {
      setCommandBusy("");
    }
  }

  async function confirmDelete() {
    if (!listingId) return;

    const ok = window.confirm(
      `Delete this listing?\n\n${title}\n\nThis cannot be undone.`
    );

    if (!ok) return;

    setCommandBusy("delete");

    try {
      const response = await fetch("/api/delete-listing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Delete failed");
      }

      setListings(current =>
        current.filter(item => String(getListingId(item)) !== String(listingId))
      );

      addActivity("success", `Deleted — ${title}`);
      trackLaunchEvent("launch_listing_deleted", { listingId: String(listingId) });

      router.push("/account/my-listings");
    } catch (error) {
      addActivity("error", `Delete failed — ${title}`);
      alert(`Delete failed: ${error.message}`);
      console.error("Delete failed:", error);
    } finally {
      setCommandBusy("");
    }
  }

  function toggleLiveStatus() {
    if (isPaused) {
      reactivateListing();
    } else {
      pauseListing();
    }
  }

  function launchExternal(platform, url, copyLabel, copy) {
    copyText(copyLabel, copy);

    trackLaunchEvent(`launch_${platform}_clicked`, {
      listingId: String(listingId || ""),
      listingUrl
    });

    window.open(url, "_blank", "noopener,noreferrer");
  }

  function launchWhatsApp() {
    const message = buildSocialCopy("whatsapp", listing, listingUrl, selectedKeywords, edit);
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;

    launchExternal("whatsapp", url, "WhatsApp Message", message);
  }

  function launchMessenger() {
    const message = buildSocialCopy("messenger", listing, listingUrl, selectedKeywords, edit);

    launchExternal(
      "messenger",
      "https://www.messenger.com/",
      "Messenger Message",
      message
    );
  }

  function launchSms() {
    const message = buildSocialCopy("sms", listing, listingUrl, selectedKeywords, edit);
    const url = `sms:?&body=${encodeURIComponent(message)}`;

    launchExternal("sms", url, "Text Message", message);
  }

  async function nativeShare() {
    const message = buildSocialCopy("sms", listing, listingUrl, selectedKeywords, edit);

    trackLaunchEvent("launch_native_share_clicked", {
      listingId: String(listingId || ""),
      listingUrl
    });

    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: message,
          url: listingUrl
        });
        return;
      } catch {
        // User cancelled or native share failed. Fall back to copy.
      }
    }

    await copyText("Share Message", message);
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
              <button
                type="button"
                className={`status-command ${isPaused ? "paused" : "live"}`}
                onClick={isPaused ? reactivateListing : pauseListing}
                disabled={commandBusy === "pause" || commandBusy === "reactivate"}
                title={isPaused ? "Reactivate listing" : "Pause listing"}
              >
                <span></span>
                {commandBusy === "pause" || commandBusy === "reactivate"
                  ? "Working"
                  : isPaused
                    ? "Paused"
                    : "Live"}
              </button>

              <button
                type="button"
                className="save-top"
                onClick={saveQuickEdit}
                disabled={saving}
              >
                {saving ? "Launching..." : "Launch"}
              </button>

              <a href={listingUrl} target="_blank" rel="noreferrer" className="public-link">
                View Public
              </a>

              <button
                type="button"
                className="dashboard-top"
                onClick={() => router.push("/account")}
              >
                Dashboard
              </button>

<button
  type="button"
  className="profile-top"
  onClick={() => router.push("/account/profile")}
>
  Profile
</button>

              <button
                type="button"
                className="duplicate-top"
                onClick={() => {
                  addActivity("success", `Duplicate selected — ${title}`);
                  trackLaunchEvent("launch_duplicate_clicked", {
                    listingId: String(listing?.id || "")
                  });
                  alert("Duplicate hook is ready. We will wire the duplicate API next.");
                }}
              >
                Duplicate
              </button>

              <button
                type="button"
                className="delete-top"
                onClick={confirmDelete}
                disabled={commandBusy === "delete"}
              >
                {commandBusy === "delete" ? "Deleting..." : "Delete"}
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

                  <img src={getIXActivePhotoUrl(photo)} alt={`Photo ${index + 1}`} />

                    {true ? (
  <div
    className="polish-toggle"
    onClick={e => e.stopPropagation()}
  >
    {["original", "clean", "dealerPop"].map(mode => (
      <button
        key={mode}
        type="button"
        className={photo.activeMode === mode ? "active" : ""}


onClick={async () => {
  if (photo.existing && mode !== "original") {
    await reprocessExistingPhoto(photo.id, mode);
    return;
  }

  setPhotoItems(current =>
    current.map(item =>
      item.id === photo.id
        ? {
            ...item,

            activeMode: mode,

            file:
              mode === "original"
                ? item.originalFile || null
                : mode === "dealerPop"
                  ? item.dealerPopFile || null
                  : item.cleanFile || null,

            url:
              mode === "original"
                ? item.originalUrl
                : mode === "dealerPop"
                  ? item.dealerPopUrl
                  : item.cleanUrl
          }
        : item
    )
  );
}}




      >
        {mode === "dealerPop" ? "Pop" : mode}
      </button>
    ))}
  </div>
) : null}
                    
                  <button
                  type="button"
                  className="photo-remove"
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
            <aside className="inventory-rail">
              <div className="rail-head">
                <span>My Inventory</span>
                <strong>{sellerInventory.length} Machines</strong>
              </div>

              <div className="inventory-scroll">
                {sellerInventory.map(item => {
                  const itemImages = getListingImages(item);
                  const itemStatus = getListingStatus(item);
                  const isCurrent = String(item.id) === String(listing.id);

                  return (
                    <button
                      key={String(item.id)}
                      type="button"
                      className={isCurrent ? "inventory-mini active" : "inventory-mini"}
                      onClick={() => goToListing(item)}
                    >
                      <img
                        src={itemImages[0] || "/images/hero-equipment-yard.jpg"}
                        alt={item.title || "Inventory machine"}
                      />

                      <span>{cleanMachineTitle(item.title || "Machine")}</span>

                      <strong>{formatMoney(item.price)}</strong>

                      <small className={itemStatus === "paused" ? "paused" : "live"}>
                        {itemStatus === "paused" ? "Paused" : "Live"}
                      </small>
                    </button>
                  );
                })}
              </div>


<div className="external-link-panel">
  <div className="external-link-head">
    <span>Distribution Hub</span>
    <strong>Machine Also Listed Here</strong>
  </div>

  {externalLinks.map((link, index) => (
    <div className="external-link-item" key={index}>
      <span className="external-arrow">↗</span>

      <input
        type="text"
        placeholder="NAME"
        value={link.label}
        onChange={e => {
          const next = [...externalLinks];
          next[index] = { ...next[index], label: e.target.value };
          setExternalLinks(next);
        }}
      />

      <input
        type="url"
        placeholder="URL"
        value={link.url}
        onChange={e => {
          const next = [...externalLinks];
          next[index] = { ...next[index], url: e.target.value };
          setExternalLinks(next);
        }}
      />

      <button
        type="button"
        className="external-clear"
        onClick={() => {
          const next = [...externalLinks];
          next[index] = { label: "", url: "" };
          setExternalLinks(next);
        }}
      >
        ×
      </button>
    </div>
  ))}

  <button type="button" className="external-save-btn" onClick={saveExternalLinks}>
    Save Hub
  </button>
</div>
                  
                  
            </aside>

            <section className="preview-zone">
              <div className="card-nav-row">
                <button
                  type="button"
                  onClick={() => goToListing(previousListing)}
                  disabled={!previousListing}
                >
                  ← Previous
                </button>

                <div>
                  <span>Live Buyer Card</span>
                  <strong>True marketplace-card preview</strong>
                </div>

                <button
                  type="button"
                  onClick={() => goToListing(nextListing)}
                  disabled={!nextListing}
                >
                  Next →
                </button>
              </div>

              <div className="listing-preview-card">
              <div
  className="preview-photo"
  onClick={() => changeActivePhoto(1)}
>
 <img
  src={heroPhoto || "/images/hero-equipment-yard.jpg"}
  alt={title || "Machine"}
  className={`preview-photo-img ${getFrameClass(activePreviewPhoto, "livePreview")}`}
  style={getFrameStyle(activePreviewPhoto, "livePreview")}
/>
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
  <MachineBadges
    keywords={selectedKeywords.slice(0, 10)}
    variant="studio"
  />
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
            </section>
            <aside className="distribution-center">
              <div className="distribution-head">
                <span>Distribution Center</span>
                <h2>Launch This Machine</h2>
                <p>
                  Copy the message, open the platform, and drive every buyer back to
                  the IronXchange source page.
                </p>
              </div>

              <button
                type="button"
                className="launch-btn whatsapp"
                onClick={launchWhatsApp}
              >
                <i className="fa-brands fa-whatsapp"></i>
                <div>
                  <strong>WhatsApp Blast</strong>
                  <span>Copy machine message + open WhatsApp</span>
                </div>
              </button>

              <button
                type="button"
                className="launch-btn messenger"
                onClick={launchMessenger}
              >
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
                    buildSocialCopy("marketplace", listing, listingUrl, selectedKeywords, edit)
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
                    `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(listingUrl)}`,
                    "Facebook Post",
                    buildSocialCopy("facebook", listing, listingUrl, selectedKeywords, edit)
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
                    "instagram",
                    "https://www.instagram.com/",
                    "Instagram Caption",
                    buildSocialCopy("instagram", listing, listingUrl, selectedKeywords, edit)
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
                    `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(listingUrl)}`,
                    "LinkedIn Post",
                    buildSocialCopy("linkedin", listing, listingUrl, selectedKeywords, edit)
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
                    buildSocialCopy("tiktok", listing, listingUrl, selectedKeywords, edit)
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
                    onChange={e => updateWorkflow(e.target.value)}
                  >
                    {workflowOptions.map(option => (
                      <option key={option.value} value={option.value}>
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

             <div className="keyword-grid" key={listingCategory}>
                {filteredKeywords.map(keyword => (
                  <button
                    key={keyword}
                    type="button"
                    onClick={() => toggleKeyword(keyword)}
                    className={selectedKeywordSet.has(keyword) ? "keyword-chip active" : "keyword-chip"}
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
                  value={edit.description}
                  onChange={e => setEdit({ ...edit, description: e.target.value })}
                  placeholder="Condition, attachments, service, ownership history, and buyer-relevant notes..."
                />
              </label>

              <div className="save-row">
                <button
                  type="button"
                  className="save-btn"
                  onClick={saveQuickEdit}
                  disabled={saving}
                >
                  {saving ? "Launching..." : "Launch Listing"}
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
                <span>Recent actions</span>
              </div>

              <div className="activity-list">
                <div className="activity-item success">
                  <span>LAUNCH STUDIO READY</span>
                  <small>NOW</small>
                </div>

                <div className="activity-item">
                  <span>WORKFLOW: {workflowOptions.find(item => item.value === workflowStatus)?.label?.toUpperCase() || workflowStatus.toUpperCase()}</span>
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

        .launch-title button {
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

  transition:
    transform .14s ease,
    border-color .14s ease,
    color .14s ease,
    background .14s ease;
}

        .launch-title button:hover {
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

          text-rendering: geometricPrecision;
-webkit-font-smoothing: antialiased;
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
.public-link,
.dashboard-top,
.profile-top,
.duplicate-top,
.delete-top {
          height: 31px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,.08);
          background:
  linear-gradient(180deg, rgba(255,255,255,.018), rgba(255,255,255,0)),
  #101010;
  box-shadow: 0 1px 0 rgba(255,255,255,.025) inset;
          color: #f2f2f2;
          padding: 0 10px;
          font-size: 8.5px;
          font-weight: 950;
          letter-spacing: .55px;
          text-transform: uppercase;
          text-decoration: none;
          cursor: pointer;
          transition:
            transform .14s ease,
            border-color .14s ease,
            background .14s ease,
            color .14s ease,
            box-shadow .14s ease;
        }

       .status-command:hover,
.public-link:hover,
.dashboard-top:hover,
.profile-top:hover,
.duplicate-top:hover {
          transform: translateY(-1px);
          border-color: rgba(255,196,0,.26);
          color: #FFC400;
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

        .status-command.paused {
          color: #a0a0a0;
          border-color: rgba(160,160,160,.35);
          background: rgba(120,120,120,.10);
        }

        .status-command.paused span {
          background: #a0a0a0;
        }

      .save-top {
  background:
    linear-gradient(180deg, rgba(255,255,255,.18), rgba(255,255,255,0)),
    #FFC400;

  border-color: #FFC400;
  color: #050505;

  box-shadow:
    0 1px 0 rgba(255,255,255,.22) inset,
    0 0 18px rgba(255,196,0,.10);
}

        .save-top:hover {
  transform: translateY(-1px);
  box-shadow:
    0 1px 0 rgba(255,255,255,.26) inset,
    0 0 24px rgba(255,196,0,.22);
}

        .delete-top {
          color: #ff9b9b;
          border-color: rgba(229,62,62,.35);
          animation: dangerBreath 3.4s ease-in-out infinite;
        }

        .delete-top:hover {
          background: rgba(229,62,62,.12);
          border-color: rgba(229,62,62,.60);
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

  text-rendering: geometricPrecision;
  -webkit-font-smoothing: antialiased;
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

  box-shadow: 0 1px 0 rgba(255,255,255,.025) inset;

  transition:
    transform .14s ease,
    border-color .14s ease,
    background .14s ease,
    box-shadow .14s ease;
}

        .photo-add:hover {
  transform: translateY(-1px);

  border-color: rgba(255,196,0,.55);

  background:
    linear-gradient(180deg, rgba(255,196,0,.10), rgba(255,196,0,0)),
    #151515;

  box-shadow:
    0 1px 0 rgba(255,255,255,.035) inset,
    0 0 16px rgba(255,196,0,.06);
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

  scrollbar-width: thin;
  scrollbar-color: rgba(255,255,255,.14) transparent;
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

  box-shadow:
    0 1px 0 rgba(255,255,255,.025) inset,
    0 10px 22px rgba(0,0,0,.16);

  transition:
    opacity .15s ease,
    transform .15s ease,
    border-color .15s ease,
    box-shadow .15s ease,
    filter .15s ease;
}

        .photo-tile:hover,
.photo-tile.active {
  opacity: 1;

  transform: translateY(-1px);

  border-color: rgba(255,196,0,.36);

  box-shadow:
    0 1px 0 rgba(255,255,255,.04) inset,
    0 14px 28px rgba(0,0,0,.22),
    0 0 18px rgba(255,196,0,.055);

  filter:
    contrast(1.03)
    saturate(1.02);
}

        .photo-tile.hero {
  border: 2px solid rgba(255,196,0,.94);

  box-shadow:
    0 1px 0 rgba(255,255,255,.04) inset,
    0 14px 30px rgba(0,0,0,.24),
    0 0 22px rgba(255,196,0,.08);
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

  background:
    linear-gradient(180deg, rgba(255,255,255,.20), rgba(255,255,255,0)),
    #FFC400;

  color: #050505;

  font-size: 8px;
  font-weight: 950;
  letter-spacing: .35px;

  box-shadow:
    0 1px 0 rgba(255,255,255,.22) inset,
    0 0 12px rgba(255,196,0,.10);
}

        .photo-remove {
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

  opacity: .88;

  transition:
    transform .14s ease,
    background .14s ease,
    opacity .14s ease;
}

.photo-remove:hover {
  transform: scale(1.06);
  background: rgba(229,62,62,.96);
  opacity: 1;
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

        .polish-toggle {
  position: absolute;

  left: 7px;
  bottom: 7px;

  z-index: 4;

  display: flex;
  gap: 3px;

  padding: 3px;

  border-radius: 999px;

  background: rgba(0,0,0,.50);

  backdrop-filter: blur(4px);

  box-shadow:
    0 1px 0 rgba(255,255,255,.05) inset;
}

.polish-toggle button {
  position: static;

  width: auto;
  height: 17px;

  padding: 0 5px;

  border-radius: 999px;
  border: 1px solid rgba(255,255,255,.12);

  background: rgba(255,255,255,.08);

  color: rgba(255,255,255,.72);

  font-size: 6.5px;
  font-weight: 950;

  letter-spacing: .35px;
  text-transform: uppercase;

  cursor: pointer;

  transition:
    background .14s ease,
    color .14s ease,
    border-color .14s ease,
    transform .14s ease;
}

.polish-toggle button:hover {
  transform: translateY(-1px);

  border-color: rgba(255,196,0,.28);

  color: #FFC400;
}

.polish-toggle button.active {
  background: #FFC400;

  border-color: #FFC400;

  color: #050505;

  box-shadow:
    0 1px 0 rgba(255,255,255,.22) inset;
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

        .inventory-scroll {
  display: grid;
  gap: 8px;

  max-height: 310px;
  overflow-y: auto;

  padding-right: 3px;

  scrollbar-width: thin;
  scrollbar-color: rgba(255,255,255,.14) transparent;
}

        .inventory-mini {
  width: 100%;

  padding: 7px;

  display: grid;
  grid-template-columns: 58px 1fr;
  grid-template-rows: auto auto auto;

  gap: 3px 8px;

  text-align: left;

  border: 1px solid rgba(255,255,255,.06);
  border-radius: 11px;

  background:
    linear-gradient(180deg, rgba(255,255,255,.018), rgba(255,255,255,0)),
    #101010;

  cursor: pointer;

  box-shadow:
    0 1px 0 rgba(255,255,255,.025) inset;

  transition:
    transform .14s ease,
    border-color .14s ease,
    background .14s ease,
    box-shadow .14s ease;
}
        .inventory-mini:hover {
  transform: translateX(2px);

  border-color: rgba(255,255,255,.12);

  background:
    linear-gradient(180deg, rgba(255,255,255,.026), rgba(255,255,255,0)),
    #151515;

  box-shadow:
    0 1px 0 rgba(255,255,255,.035) inset,
    0 10px 22px rgba(0,0,0,.18);
}

        .inventory-mini.active {
  border-color: rgba(255,196,0,.48);

  background:
    linear-gradient(180deg, rgba(255,196,0,.075), rgba(255,196,0,0)),
    #15120a;

  box-shadow:
    0 1px 0 rgba(255,255,255,.035) inset,
    0 0 18px rgba(255,196,0,.075);
}

        .inventory-mini img {
  grid-row: 1 / 4;

  width: 58px;
  height: 44px;

  object-fit: cover;

  border-radius: 8px;

  filter:
    contrast(1.02)
    saturate(1.02);

  box-shadow:
    0 1px 0 rgba(255,255,255,.035) inset;
}

       .inventory-mini span {
  color: #f2f2f2;
  font-size: 10px;
  font-weight: 900;
  line-height: 1.1;

  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;

  text-rendering: geometricPrecision;
  -webkit-font-smoothing: antialiased;
}
        .inventory-mini strong {
  color: rgba(255,255,255,.72);

  font-size: 10px;
  font-weight: 900;

  letter-spacing: -.08px;

  text-rendering: geometricPrecision;
}

        .inventory-mini small {
          width: fit-content;
          padding: 2px 6px;
          border-radius: 999px;
          font-size: 7.5px;
          font-weight: 950;
          text-transform: uppercase;
        }

       .inventory-mini small.live {
  color: #38A169;

  background:
    linear-gradient(180deg, rgba(56,161,105,.12), rgba(56,161,105,.04));

  border: 1px solid rgba(56,161,105,.26);
}

        .inventory-mini small.paused {
  color: #f6ad55;

  background:
    linear-gradient(180deg, rgba(246,173,85,.13), rgba(246,173,85,.04));

  border: 1px solid rgba(246,173,85,.28);
}

.external-link-panel {
  margin-top: 8px;

  padding: 9px 9px 8px;

  display: grid;
  gap: 6px;

  border: 1px solid rgba(255,255,255,.065);
  outline: 1px solid rgba(255,255,255,.018);
  border-radius: 13px;

  background:
    linear-gradient(180deg, rgba(255,255,255,.028), rgba(255,255,255,0)),
    radial-gradient(circle at top left, rgba(0,209,255,.06), transparent 58%),
    #101010;

  box-shadow:
    0 1px 0 rgba(255,255,255,.04) inset,
    0 14px 30px rgba(0,0,0,.18);
}

.external-link-head {
  position: relative;

  padding: 0 0 8px 9px;
  margin-bottom: 2px;

  border-bottom: 1px solid rgba(255,255,255,.045);
}

.external-link-head::before {
  content: "";

  position: absolute;
  left: 0;
  top: 1px;
  bottom: 9px;

  width: 2px;
  border-radius: 999px;

  background: #00D1FF;

  box-shadow:
    0 0 12px rgba(0,209,255,.30);
}

.external-link-head span {
  display: block;

  color: #7DEBFF;

  font-size: 7.4px;
  font-weight: 950;
  letter-spacing: .72px;
  text-transform: uppercase;
}

.external-link-head strong {
  display: block;

  margin-top: 2px;

  color: rgba(255,255,255,.46);

  font-size: 7.2px;
  font-weight: 900;
  letter-spacing: .34px;
  text-transform: uppercase;
}

.external-link-item {
  position: relative;

  display: grid;
  grid-template-columns: 14px 78px minmax(0,1fr) 18px;

  align-items: center;

  gap: 5px;

  padding-top: 7px;
}

.external-link-item::before {
  content: "";

  position: absolute;
  top: 0;
  left: 0;

  width: 34%;
  height: 1px;

  background:
    linear-gradient(
      90deg,
      rgba(0,209,255,.18),
      transparent
    );
}

.external-arrow {
  color: #00D1FF;

  font-size: 11px;
  font-weight: 950;

  text-shadow:
    0 0 10px rgba(0,209,255,.22);
}

.external-link-item input {
  height: 28px;
  min-width: 0;

  border: 1px solid rgba(255,255,255,.07);
  border-radius: 8px;

  background:
    linear-gradient(180deg, rgba(255,255,255,.026), rgba(255,255,255,0)),
    #0b0b0b;

  color: rgba(255,255,255,.82);

  padding: 0 8px;

  font-size: 8.5px;
  font-weight: 850;
  letter-spacing: .18px;

  outline: none;

  box-shadow:
    0 1px 0 rgba(255,255,255,.025) inset;
}

.external-link-item input:first-of-type {
  color: rgba(255,255,255,.92);
  font-weight: 950;
  text-transform: uppercase;
}

.external-link-item input::placeholder {
  color: rgba(255,255,255,.30);
}

.external-link-item input:focus {
  border-color: rgba(0,209,255,.50);

  box-shadow:
    0 1px 0 rgba(255,255,255,.04) inset,
    0 0 0 1px rgba(0,209,255,.12),
    0 0 14px rgba(0,209,255,.06);
}

.external-clear {
  width: 18px;
  height: 18px;

  border: 1px solid rgba(255,255,255,.07);
  border-radius: 50%;

  background: #0b0b0b;

  color: rgba(255,255,255,.34);

  font-size: 11px;
  font-weight: 950;

  line-height: 1;

  cursor: pointer;
}

.external-clear:hover {
  color: #ff9b9b;

  border-color: rgba(229,62,62,.42);

  background: rgba(229,62,62,.08);
}

.external-save-btn {
  width: 92px;
  height: 25px;

  justify-self: end;

  margin-top: 4px;

  border: 1px solid rgba(0,209,255,.34);
  border-radius: 999px;

  background:
    linear-gradient(180deg, rgba(0,209,255,.10), rgba(0,209,255,0)),
    #101010;

  color: #7DEBFF;

  font-size: 7.3px;
  font-weight: 950;
  letter-spacing: .58px;
  text-transform: uppercase;

  cursor: pointer;

  box-shadow:
    0 1px 0 rgba(255,255,255,.025) inset,
    0 0 12px rgba(0,209,255,.04);
}

.external-save-btn:hover {
  transform: translateY(-1px);

  border-color: rgba(0,209,255,.60);

  background: #071317;
}


///// END LEFT BOTTOM TOOLBAR ////

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

  letter-spacing: .18px;

  text-rendering: geometricPrecision;
}

        .card-nav-row button {
  height: 28px;

  border-radius: 999px;
  border: 1px solid rgba(255,255,255,.08);

  background:
    linear-gradient(180deg, rgba(255,255,255,.018), rgba(255,255,255,0)),
    #101010;

  color: rgba(255,255,255,.62);

  font-size: 8.5px;
  font-weight: 950;
  letter-spacing: .5px;
  text-transform: uppercase;

  cursor: pointer;

  box-shadow: 0 1px 0 rgba(255,255,255,.025) inset;

  transition:
    border-color .14s ease,
    color .14s ease,
    background .14s ease,
    transform .14s ease,
    box-shadow .14s ease;
}
        .card-nav-row button:hover:not(:disabled) {
  color: #FFC400;

  border-color: rgba(255,196,0,.34);

  background:
    linear-gradient(180deg, rgba(255,196,0,.07), rgba(255,196,0,0)),
    #151515;

  transform: translateY(-1px);

  box-shadow:
    0 1px 0 rgba(255,255,255,.035) inset,
    0 0 14px rgba(255,196,0,.055);
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

  transition:
    transform .16s ease,
    border-color .16s ease,
    background .16s ease,
    box-shadow .16s ease;
}

        .listing-preview-card:hover {
  transform:
    translateY(-2px)
    scale(1.083);

  border-color: rgba(255,196,0,.14);

  background:
    linear-gradient(
      180deg,
      rgba(255,255,255,.038),
      rgba(255,255,255,0)
    ),
    #171717;

  box-shadow:
  0 1px 0 rgba(255,255,255,.06) inset,
  0 26px 64px rgba(0,0,0,.34),
  0 0 24px rgba(255,196,0,.045);
}

        .preview-photo {
  position: relative;
  height: 250px;
  overflow: hidden;
  border-bottom: 1px solid rgba(255,255,255,.065);
  background: #0f0f0f;
  box-shadow:
    inset 0 -60px 90px rgba(0,0,0,.16),
    inset 0 0 40px rgba(0,0,0,.04);
  cursor: pointer;
}

.preview-photo-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center center;
  display: block;
  transition:
    filter .18s ease,
    transform .28s ease;
  image-rendering: auto;
  backface-visibility: hidden;
  transform-origin: center center;
}

     .listing-preview-card:hover .preview-photo-img {
  filter:
    contrast(1.04)
    saturate(1.03)
    brightness(1.01);

  scale: 1.018;
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

transition:
  opacity .18s ease,
  background .18s ease,
  color .18s ease;
        }

        .listing-preview-card:hover .card-photo-nav {
  opacity: 1;
}

        .card-photo-nav.left {
          left: 0;
          border-radius: 0 10px 10px 0;
        }

        .card-photo-nav.right {
          right: 0;
          border-radius: 10px 0 0 10px;
        }

        .card-photo-nav:hover {
  background: rgba(0,0,0,.18);
  color: rgba(255,255,255,.82);
}
        

        .photo-count {
  position: absolute;
  top: 8px;
  right: 8px;

  padding: 3px 6px;

  border-radius: 999px;

  background: rgba(0,0,0,.18);
  color: rgba(255,255,255,.44);

  backdrop-filter: blur(2px);

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

  text-rendering: geometricPrecision;
  -webkit-font-smoothing: antialiased;
}

        .card-hours-input {
  width: 92px;

  text-align: right;

  color: rgba(255,255,255,.54);

  font-size: 13px;
  font-weight: 500;

  letter-spacing: .18px;
  line-height: 1;

  white-space: nowrap;

  text-rendering: geometricPrecision;
  -webkit-font-smoothing: antialiased;
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

  background:
    linear-gradient(
      90deg,
      rgba(255,196,0,.26),
      transparent
    );
}

        .card-price-input {
  width: 150px;

  color: #f2f2f2;

  font-size: 20px;
  font-weight: 850;

  letter-spacing: -.12px;

  text-rendering: geometricPrecision;
  -webkit-font-smoothing: antialiased;
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

  display: grid;
  place-items: center;

  border: none;
  background: transparent;

  color: rgba(255,255,255,.24);

  cursor: pointer;
  padding: 0;

  margin-right: -2px;

  transition:
    color .14s ease,
    transform .14s ease;
}

.preview-meta button i {
  font-size: 12px;
}
.preview-meta button:hover {
  color: rgba(255,196,0,.82);
  transform: scale(1.06);
}

       .card-location-input {
  width: 150px;

  color: rgba(255,255,255,.48);

  font-size: 10.5px;
  font-weight: 850;

  letter-spacing: .42px;

  text-align: right;
  text-transform: uppercase;

  white-space: nowrap;

  text-rendering: geometricPrecision;
}

.share-everywhere-btn {
  grid-column: 1 / -1 !important;

  min-height: 36px !important;

  background:
    linear-gradient(
      135deg,
      #FFC400,
      #ff8a00
    ) !important;

  border-color: rgba(255,196,0,.72) !important;

  color: #050505 !important;

  box-shadow:
    0 1px 0 rgba(255,255,255,.20) inset,
    0 10px 24px rgba(255,196,0,.14);

  transition:
    transform .14s ease,
    filter .14s ease,
    box-shadow .14s ease;

animation: goldBreath 3.8s ease-in-out infinite;
}

.share-everywhere-btn:hover {
  transform: translateY(-1px);

  filter: brightness(1.04);

  box-shadow:
    0 1px 0 rgba(255,255,255,.24) inset,
    0 12px 28px rgba(255,196,0,.20);
}

.listing-preview-card {
  margin: 24px auto 0;
}


       .distribution-head h2 {
  margin: 0;

  color: #f2f2f2;

  font-size: 21px;
  font-weight: 950;

  letter-spacing: -.55px;
  text-transform: uppercase;

  text-rendering: geometricPrecision;
  -webkit-font-smoothing: antialiased;
}

       .distribution-head p {
  margin-bottom: 4px;

  color: rgba(255,255,255,.40);

  font-size: 10.5px;
  line-height: 1.35;
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

  box-shadow:
    0 1px 0 rgba(255,255,255,.16) inset,
    0 8px 18px rgba(0,0,0,.16);

  transition:
    transform .15s ease,
    filter .15s ease,
    box-shadow .15s ease;
}

       .launch-btn:hover {
  transform: translateY(-1px);

  filter:
    brightness(1.045)
    saturate(1.04);

  box-shadow:
    0 1px 0 rgba(255,255,255,.20) inset,
    0 12px 26px rgba(0,0,0,.24);
}

        .launch-btn i {
  font-size: 20px;

  width: 24px;
  text-align: center;

  filter: drop-shadow(0 1px 0 rgba(0,0,0,.12));
}
        .launch-btn strong {
  display: block;

  font-size: 11.5px;
  font-weight: 950;

  letter-spacing: -.08px;

  text-rendering: geometricPrecision;
  -webkit-font-smoothing: antialiased;
}

        .launch-btn span {
  display: block;

  margin-top: 2px;

  font-size: 10px;
  font-weight: 700;

  opacity: .84;

  line-height: 1.2;
}

        .launch-btn.whatsapp {
          background: #25D366;
          color: #06140a;
        }

        .launch-btn.messenger {
          background: linear-gradient(135deg, #00B2FF, #7B61FF);
          color: white;
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
  background:
    linear-gradient(135deg, #111, #050505);

  color: white;

  border: 1px solid rgba(255,255,255,.10);
}

        .utility-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 7px;
          margin-top: 2px;
        }

        .utility-grid button {
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

  box-shadow:
    0 1px 0 rgba(255,255,255,.025) inset;

  transition:
    transform .14s ease,
    border-color .14s ease,
    color .14s ease,
    background .14s ease,
    box-shadow .14s ease;
}

.utility-grid button:hover {
  transform: translateY(-1px);

  border-color: rgba(255,196,0,.25);

  color: #FFC400;

  background:
    linear-gradient(180deg, rgba(255,196,0,.055), rgba(255,196,0,0)),
    #151515;

  box-shadow:
    0 1px 0 rgba(255,255,255,.035) inset,
    0 8px 18px rgba(0,0,0,.18);
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

  text-rendering: geometricPrecision;
  -webkit-font-smoothing: antialiased;
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

  background:
    linear-gradient(180deg, rgba(255,196,0,.035), rgba(255,196,0,0)),
    #0f0f0f;

  border: 1px solid rgba(255,196,0,.18);
  border-radius: 8px;

  color: rgba(255,255,255,.72);

  font-size: 8px;
  font-weight: 950;

  text-transform: uppercase;

  padding: 0 8px;

  outline: none;
  cursor: pointer;

  box-shadow:
    0 1px 0 rgba(255,255,255,.025) inset;

  transition:
    border-color .14s ease,
    color .14s ease,
    background .14s ease;
}

.badge-head-actions select:hover,
.badge-head-actions select:focus {
  border-color: rgba(255,196,0,.45);
  color: #FFC400;

  background:
    linear-gradient(180deg, rgba(255,196,0,.06), rgba(255,196,0,0)),
    #141414;
}

        label {
  display: grid;
  gap: 6px;

  color: rgba(255,255,255,.44);

  font-size: 8.5px;
  font-weight: 950;

  letter-spacing: .62px;
  text-transform: uppercase;

  text-rendering: geometricPrecision;
}
        textarea,
.keyword-search {
  width: 100%;

  background:
    linear-gradient(180deg, rgba(255,255,255,.012), rgba(255,255,255,0)),
    #0c0c0c;

  border: 1px solid rgba(255,255,255,.08);
  border-radius: 10px;

  color: #f2f2f2;

  padding: 10px 11px;

  font-size: 13px;

  outline: none;

  box-shadow:
    0 1px 0 rgba(255,255,255,.018) inset;

  transition:
    border-color .14s ease,
    background .14s ease,
    box-shadow .14s ease;
}

textarea:hover,
.keyword-search:hover {
  border-color: rgba(255,255,255,.13);
}

textarea:focus,
.keyword-search:focus {
  border-color: rgba(255,196,0,.35);

  background:
    linear-gradient(180deg, rgba(255,196,0,.025), rgba(255,196,0,0)),
    #101010;

  box-shadow:
    0 1px 0 rgba(255,255,255,.025) inset,
    0 0 0 1px rgba(255,196,0,.12);
}

      textarea {
  min-height: 148px;

  resize: vertical;

  line-height: 1.5;

  text-rendering: geometricPrecision;
  -webkit-font-smoothing: antialiased;
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
  border: 1px solid rgba(255,255,255,.08);

  display: flex;
  align-items: center;
  justify-content: center;

  text-decoration: none;

  font-size: 9px;
  font-weight: 950;
  letter-spacing: .58px;
  text-transform: uppercase;

  cursor: pointer;

  box-shadow:
    0 1px 0 rgba(255,255,255,.025) inset;

  transition:
    transform .14s ease,
    border-color .14s ease,
    background .14s ease,
    box-shadow .14s ease,
    color .14s ease;
}
        .save-btn {
  background:
    linear-gradient(180deg, rgba(255,255,255,.18), rgba(255,255,255,0)),
    #FFC400;

  border-color: #FFC400;

  color: #050505;
}

.save-btn:hover {
  transform: translateY(-1px);

  box-shadow:
    0 1px 0 rgba(255,255,255,.24) inset,
    0 10px 22px rgba(255,196,0,.16);
}

        .preview-btn {
  background:
    linear-gradient(180deg, rgba(255,255,255,.018), rgba(255,255,255,0)),
    #101010;

  color: #f2f2f2;
}

.preview-btn:hover {
  transform: translateY(-1px);

  color: #FFC400;

  border-color: rgba(255,196,0,.28);

  background:
    linear-gradient(180deg, rgba(255,196,0,.055), rgba(255,196,0,0)),
    #151515;
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

  background:
    linear-gradient(180deg, rgba(255,196,0,.085), rgba(255,196,0,.02)),
    #111;

  color: #FFC400;

  font-size: 9px;
  font-weight: 900;

  text-transform: lowercase;

  cursor: pointer;

  box-shadow:
    0 1px 0 rgba(255,255,255,.025) inset;

  transition:
    transform .14s ease,
    border-color .14s ease,
    background .14s ease,
    box-shadow .14s ease;
}

.selected-badges button:hover {
  transform: translateY(-1px);

  border-color: rgba(255,196,0,.52);

  background:
    linear-gradient(180deg, rgba(255,196,0,.12), rgba(255,196,0,.025)),
    #15120a;

  box-shadow:
    0 1px 0 rgba(255,255,255,.035) inset,
    0 0 14px rgba(255,196,0,.06);
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

  background:
    linear-gradient(180deg, rgba(255,255,255,.012), rgba(255,255,255,0)),
    #0f0f0f;

  padding: 9px;

  box-shadow:
    0 1px 0 rgba(255,255,255,.018) inset;

  scrollbar-width: thin;
  scrollbar-color: rgba(255,255,255,.14) transparent;
}

        .keyword-chip {
  padding: 5px 7px;

  border-radius: 999px;
  border: 1px solid rgba(255,255,255,.055);

  background:
    linear-gradient(
      180deg,
      rgba(255,255,255,.028),
      rgba(255,255,255,.01)
    );

  color: rgba(255,255,255,.42);

  font-size: 9.5px;
  font-weight: 800;

  line-height: 1;

  text-transform: lowercase;

  cursor: pointer;

  backdrop-filter: blur(2px);

  transition:
    transform .14s ease,
    border-color .14s ease,
    color .14s ease,
    background .14s ease;
}

.keyword-chip:hover {
  transform: translateY(-1px);

  color: rgba(255,255,255,.66);

  border-color: rgba(255,255,255,.12);

  background:
    linear-gradient(
      180deg,
      rgba(255,255,255,.045),
      rgba(255,255,255,.015)
    );
}

       .keyword-chip.active {
  color: #FFC400;

  border-color: rgba(255,196,0,.38);

  background:
    linear-gradient(180deg, rgba(255,196,0,.09), rgba(255,196,0,.025)),
    #111;

  box-shadow:
    0 0 12px rgba(255,196,0,.055);
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

  background:
    linear-gradient(180deg, rgba(255,255,255,.018), rgba(255,255,255,0)),
    #101010;

  border: 1px solid rgba(255,255,255,.06);
  border-radius: 11px;

  padding: 10px;

  box-shadow:
    0 1px 0 rgba(255,255,255,.022) inset;

  transition:
    transform .14s ease,
    border-color .14s ease,
    background .14s ease;
}

.activity-item:hover {
  transform: translateY(-1px);

  border-color: rgba(255,255,255,.11);

  background:
    linear-gradient(180deg, rgba(255,255,255,.026), rgba(255,255,255,0)),
    #151515;
}

        .activity-item.success {
  border-color: rgba(56,161,105,.30);

  box-shadow:
    0 1px 0 rgba(255,255,255,.022) inset,
    0 0 14px rgba(56,161,105,.045);
}

        .activity-item span {
  color: #f2f2f2;

  font-size: 10px;
  font-weight: 950;

  letter-spacing: .35px;

  text-rendering: geometricPrecision;
  -webkit-font-smoothing: antialiased;
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
  grid-template-columns: 110px 1fr;

  gap: 14px;
  align-items: center;
}

       .seller-panel img {
  width: 110px;
  max-height: 66px;

  object-fit: contain;

  filter:
    contrast(1.02)
    saturate(1.01);
}

        .seller-icon {
  width: 58px;
  height: 58px;

  border: 1px solid rgba(255,255,255,.10);
  border-radius: 50%;

  display: grid;
  place-items: center;

  color: rgba(255,255,255,.52);

  background:
    linear-gradient(180deg, rgba(255,255,255,.018), rgba(255,255,255,0)),
    #101010;

  box-shadow:
    0 1px 0 rgba(255,255,255,.025) inset;
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

  text-rendering: geometricPrecision;
  -webkit-font-smoothing: antialiased;
}

       @keyframes livePulse {
  0%, 100% {
    box-shadow:
      0 0 0 rgba(56,161,105,0);
  }

  50% {
    box-shadow:
      0 0 10px rgba(56,161,105,.28);
  }
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

  .inventory-scroll {
    display: flex;
    max-height: none;
    overflow-x: auto;
    overflow-y: hidden;
    padding-bottom: 6px;
  }

  .inventory-mini {
    flex: 0 0 220px;
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

  .inventory-scroll {
    display: flex;
    max-height: none;
    overflow-x: auto;
    overflow-y: hidden;
    padding-bottom: 6px;
  }

  .inventory-mini {
    flex: 0 0 220px;
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
