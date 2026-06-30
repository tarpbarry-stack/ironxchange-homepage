import { useState } from "react";

import {
  buildIXPhotoVariants,
  getIXActivePhotoUrl
} from "../../lib/ixvision/pipeline/processIXPhoto";

function slugify(text = "") {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
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
  photoItems = [],
  setPhotoItems,
  activePhotoIndex = 0,
  setActivePhotoIndex,
  photoPolishMode = "original",
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

      const file = new File([blob], `${slugify(title)}-${mode}.jpg`, {
        type: blob.type || "image/jpeg"
      });

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
            cleanUrl: mode === "clean" ? processed.cleanUrl : photo.cleanUrl,
            cleanFile: mode === "clean" ? processed.cleanFile : photo.cleanFile,
            dealerPopUrl:
              mode === "dealerPop" ? processed.dealerPopUrl : photo.dealerPopUrl,
            dealerPopFile:
              mode === "dealerPop" ? processed.dealerPopFile : photo.dealerPopFile,
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
            key={photo.id || index}
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

            <div className="polish-toggle" onClick={e => e.stopPropagation()}>
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
              ? item.originalFile || item.file || null
              : mode === "dealerPop"
                ? item.dealerPopFile || item.file || null
                : item.cleanFile || item.file || null,

          url:
            mode === "original"
              ? item.originalUrl || item.url
              : mode === "dealerPop"
                ? item.dealerPopUrl || item.url
                : item.cleanUrl || item.url
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
          padding: 9px 12px 10px;
          margin-bottom: 9px;
        }

        .workbench-head {
          min-height: 30px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 14px 14px;
          gap: 14px;
          margin-bottom: 8px;
        }

        .workbench-head span {
          display: block;
          margin-bottom: 3px;
          color: #FFC400;
          font-size: 8px;
          font-weight: 950;
          letter-spacing: .78px;
          text-transform: uppercase;
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
          gap: 12px;
          overflow-x: auto;
          overflow-y: hidden;
          padding-bottom: 5px;
          scrollbar-width: thin;
          scrollbar-color: rgba(255,255,255,.14) transparent;
        }

        .photo-tile {
          position: relative;
          flex: 0 0 190px;
          height: 134px;
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
      `}</style>
    </section>
  );
}
