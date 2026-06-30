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
          
         <style jsx>{`
        .photo-workbench {
          margin: 18px 0 24px;
          padding: 16px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 14px;
          background: linear-gradient(
              180deg,
              rgba(255, 255, 255, 0.025),
              rgba(255, 255, 255, 0)
            ),
            #101010;
        }

        .workbench-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          margin-bottom: 14px;
        }

        .workbench-head span {
          display: block;
          color: #ffc400;
          font-size: 10px;
          font-weight: 950;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .workbench-head strong {
          display: block;
          margin-top: 4px;
          color: rgba(255, 255, 255, 0.48);
          font-size: 11px;
          font-weight: 800;
        }

        .photo-add {
          position: relative;
          min-width: 130px;
          height: 34px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(255, 196, 0, 0.32);
          border-radius: 8px;
          background: rgba(255, 196, 0, 0.08);
          color: #ffc400;
          font-size: 10px;
          font-weight: 950;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          cursor: pointer;
          overflow: hidden;
        }

        .photo-add input {
          position: absolute;
          inset: 0;
          opacity: 0;
          cursor: pointer;
        }

        .photo-strip {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  overflow-y: hidden;
  padding: 4px 2px 12px;
  scroll-behavior: smooth;
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 196, 0, 0.42) rgba(255, 255, 255, 0.06);
}

.photo-strip::-webkit-scrollbar {
  height: 8px;
}

.photo-strip::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.055);
  border-radius: 999px;
}

.photo-strip::-webkit-scrollbar-thumb {
  background: rgba(255, 196, 0, 0.42);
  border-radius: 999px;
}

.photo-strip::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 196, 0, 0.68);
}

        .photo-tile {
          position: relative;
          flex: 0 0 136px;
          width: 136px;
          height: 104px;
          border: 1px solid rgba(255, 255, 255, 0.11);
          border-radius: 10px;
          background: #080808;
          overflow: hidden;
          cursor: grab;
        }

        .photo-tile.active {
          border-color: rgba(255, 196, 0, 0.78);
          box-shadow: 0 0 0 1px rgba(255, 196, 0, 0.12),
            0 0 16px rgba(255, 196, 0, 0.16);
        }

        .photo-tile.hero {
          border-color: rgba(0, 194, 255, 0.7);
        }

        .photo-tile img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          display: block;
          background: #050505;
        }

        .hero-badge {
          position: absolute;
          top: 5px;
          left: 5px;
          z-index: 3;
          padding: 3px 5px;
          border-radius: 5px;
          background: rgba(0, 194, 255, 0.9);
          color: #001018;
          font-size: 7px;
          font-weight: 950;
          letter-spacing: 0.08em;
        }

        .photo-remove {
          position: absolute;
          top: 5px;
          right: 5px;
          z-index: 4;
          width: 18px;
          height: 18px;
          border: 0;
          border-radius: 999px;
          background: rgba(0, 0, 0, 0.72);
          color: white;
          font-size: 14px;
          line-height: 18px;
          cursor: pointer;
        }

        .photo-tile small {
          position: absolute;
          right: 6px;
          bottom: 5px;
          z-index: 3;
          color: rgba(255, 255, 255, 0.62);
          font-size: 8px;
          font-weight: 950;
        }

        .polish-toggle {
          position: absolute;
          left: 5px;
          right: 5px;
          bottom: 5px;
          z-index: 5;
          display: flex;
          gap: 4px;
        }

        .polish-toggle button {
          flex: 1;
          height: 16px;
          border: 1px solid rgba(255, 255, 255, 0.16);
          border-radius: 4px;
          background: rgba(0, 0, 0, 0.68);
          color: rgba(255, 255, 255, 0.68);
          font-size: 7px;
          font-weight: 950;
          text-transform: uppercase;
          cursor: pointer;
        }

        .polish-toggle button.active {
          border-color: rgba(255, 196, 0, 0.75);
          background: rgba(255, 196, 0, 0.2);
          color: #ffc400;
        }
      `}</style>
    </section>
  );
}
