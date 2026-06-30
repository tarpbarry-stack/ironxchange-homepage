import { useState } from "react";

import {
  processIXPhoto,
  buildIXPhotoVariants,
  getIXActivePhotoFile,
  getIXActivePhotoUrl
} from "../../lib/ixvision/pipeline/processIXPhoto";

function slugify(text = "") {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function clean(value) {
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
    img.attributes?.variants?.["scaled-small"]?.url ||
    null
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

export default function MachineMediaWorkbench({
  listing,
  title = "",
  sellerName = "IronXchange Seller",

  photoItems,
  setPhotoItems,

  activePhotoIndex,
  setActivePhotoIndex,

  photoPolishMode = "original",
  setPhotoPolishMode,

  setPhotosDirty,

  commandBusy = "",
  setCommandBusy = () => {},

  trackLaunchEvent = () => {},
  addActivity = () => {}
}) {
  const [draggedPhotoIndex, setDraggedPhotoIndex] = useState(null);

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
          mode: photoPolishMode,
          userEmail: listing?.sellerEmail,
          companyName: sellerName
        })
      )
    );

    setPhotoItems(current => [...current, ...mapped]);
    setPhotosDirty?.(true);

    addActivity(
      "success",
      `${mapped.length} IX polished photo${mapped.length === 1 ? "" : "s"} added`
    );

    trackLaunchEvent("launch_ix_photos_added", {
      listingId: String(listing?.id?.uuid || listing?.id || ""),
      count: mapped.length,
      make
    });

    e.target.value = "";
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
          mode: photoPolishMode,
          userEmail: listing?.sellerEmail,
          companyName: sellerName
        })
      )
    );

    setPhotoItems(current => [...current, ...mapped]);
    setPhotosDirty?.(true);

    addActivity(
      "success",
      `${mapped.length} IX polished photo${mapped.length === 1 ? "" : "s"} dropped`
    );

    trackLaunchEvent("launch_ix_photos_dropped", {
      listingId: String(listing?.id?.uuid || listing?.id || ""),
      count: mapped.length,
      make
    });
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

      setPhotosDirty?.(true);
      addActivity("success", `Photo reprocessed — ${mode}`);
    } catch (error) {
      console.error("Existing photo reprocess failed:", error);
      alert(`Photo reprocess failed: ${error.message}`);
    } finally {
      setCommandBusy("");
    }
  }

  function removePhoto(indexToRemove) {
    setPhotoItems(current => current.filter((_, index) => index !== indexToRemove));
    setActivePhotoIndex(0);
    setPhotosDirty?.(true);

    addActivity("success", `Photo removed — ${title}`);

    trackLaunchEvent("launch_photo_removed", {
      listingId: String(listing?.id?.uuid || listing?.id || ""),
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
    setPhotosDirty?.(true);

    addActivity("success", `Photo order changed — ${title}`);

    trackLaunchEvent("launch_photo_reordered", {
      listingId: String(listing?.id?.uuid || listing?.id || ""),
      fromIndex,
      toIndex
    });
  }

  return (
    <section className="photo-workbench">
      <div className="workbench-head">
        <div>
          <span>Machine Media Workbench</span>
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

            <div
              className="polish-toggle"
              onClick={e => e.stopPropagation()}
            >
              {["original", "clean", "dealerPop"].map(mode => (
                <button
                  key={mode}
                  type="button"
                  className={photo.activeMode === mode ? "active" : ""}
                  disabled={commandBusy === `photo-${photo.id}-${mode}`}
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

                    setPhotosDirty?.(true);
                  }}
                >
                  {mode === "dealerPop" ? "Pop" : mode}
                </button>
              ))}
            </div>

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
  );
}
