import { useState } from "react";
import {
  cleanMachineTitle,
  formatHours,
  getCardImages,
  getFeatureLine,
  getListingHref,
  getListingId,
} from "../lib/listingFormatters";

export default function ListingCard({
  listing = {},
  saved = false,
  onToggleSaved,
  showSave = true,
  from = "browse",
}) {
  const [photoIndex, setPhotoIndex] = useState(0);

  const id = String(getListingId(listing));
  const images = getCardImages(listing);
  const currentPhoto = images[photoIndex];

  function changePhoto(e, direction) {
    e.preventDefault();
    e.stopPropagation();

    if (images.length < 2) return;

    setPhotoIndex(current =>
      (current + direction + images.length) % images.length
    );
  }

  function toggleSave(e) {
    e.preventDefault();
    e.stopPropagation();

    if (onToggleSaved) {
      onToggleSaved(id, listing);
    }
  }

  return (
    <a href={getListingHref(listing, from)} className="card">
      <div
        className="card-photo"
        style={{
          backgroundImage: `url(${
            currentPhoto || "/images/hero-equipment-yard.jpg"
          })`,
        }}
      >
        {images.length > 1 ? (
          <>
            <button
              type="button"
              className="card-photo-nav left"
              onClick={e => changePhoto(e, -1)}
              aria-label="Previous photo"
            >
              ‹
            </button>

            <button
              type="button"
              className="card-photo-nav right"
              onClick={e => changePhoto(e, 1)}
              aria-label="Next photo"
            >
              ›
            </button>

            <span className="photo-count">
              {photoIndex + 1}/{images.length}
            </span>
          </>
        ) : null}
      </div>

      <div className="card-body">
        <div className="title-row">
          <h3>{cleanMachineTitle(listing.title)}</h3>
          <h3 className="hours-inline">{formatHours(listing.hours)}</h3>
        </div>

        <p className="feature-line">{getFeatureLine(listing)}</p>

       <div className="price-row">
  <strong>{listing.price || "Call for price"}</strong>

  <div className="meta">
    {showSave ? (
      <button
        type="button"
        className={`save-star ${saved ? "saved" : ""}`}
        onClick={toggleSave}
        aria-label={saved ? "Unsave listing" : "Save listing"}
        title={saved ? "Saved" : "Save"}
      >
        <i className={saved ? "fa-solid fa-star" : "fa-regular fa-star"}></i>
      </button>
    ) : null}

    <span>⌖ {listing.location || "Location not listed"}</span>
  </div>
</div>
      </div>

      <style jsx>{`
        .card {
          position: relative;
          text-decoration: none;
          color: inherit;
          border: 1px solid #242424;
          border-radius: 12px;
          overflow: hidden;
          background: #151515;
          transition:
            transform .16s ease,
            border-color .16s ease,
            background .16s ease;
        }

        .card:hover {
          transform: translateY(-2px);
          border-color: #353535;
          background: #181818;
        }

        .card-photo {
          position: relative;
          height: 184px;
          background-size: cover;
          background-position: center;
          border-bottom: 1px solid #202020;
        }

        .card-photo-nav {
  position: absolute;
  top: 92%;
  transform: translateY(-50%);

  width: 22px;
  height: 92px;

  border: none;

  background: rgba(0,0,0,.12);
  color: rgba(255,255,255,.72);

  font-size: 28px;
  font-weight: 300;

  cursor: pointer;

  z-index: 5;

  opacity: 0;

  transition:
    opacity .18s ease,
    background .18s ease,
    color .18s ease;
}

.card:hover .card-photo-nav {
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
          background: rgba(0,0,0,.34);
          color: white;
        }

       .photo-count {
  position: absolute;

  top: 8px;
  right: 8px;

  background: rgba(0,0,0,.38);

  color: rgba(255,255,255,.72);

  border-radius: 999px;

  padding: 3px 6px;

  font-size: 8px;
  font-weight: 700;
  letter-spacing: .25px;

  z-index: 5;

  backdrop-filter: blur(2px);
}

        .card-body {
          padding: 13px;
        }

        .title-row {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          gap: 8px;
        }

        .card h3 {
          margin: 0;
          color: #f2f2f2;
          font-size: 15px;
          font-weight: 900;
          letter-spacing: -0.15px;
        }

        .hours-inline {
          color: #7c7c7c !important;
          font-size: 12px !important;
          font-weight: 800 !important;
          letter-spacing: .25px;
          white-space: nowrap;
        }

        .feature-line {
          min-height: 38px;
          margin: 8px 0 18px;
          color: #8f8f8f;
          font-size: 13px;
          line-height: 1.4;
        }

        .price-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 16px;
          gap: 12px;
        }

        .price-row strong {
          color: #f2f2f2;
          font-size: 18px;
          white-space: nowrap;
        }

      .meta {
  display: flex;
  align-items: center;
  gap: 9px;
  font-size: 12px;
  color: #9a9a9a;
  flex-wrap: nowrap;
  justify-content: flex-end;
  text-align: right;
  margin-left: auto;
  margin-right: -2px;
}

        .meta span {
          color: #9a9a9a;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: .4px;
          white-space: nowrap;
        }

        .save-star {
          width: 18px;
          height: 18px;
          display: grid;
          place-items: center;
          background: transparent;
          border: none;
          color: rgba(255,255,255,.38);
          cursor: pointer;
          padding: 0;
        }

        .save-star i {
          font-size: 12px;
        }

        .save-star.saved,
        .save-star:hover {
          color: #ffc400;
        }
      `}</style>
    </a>
  );
}
