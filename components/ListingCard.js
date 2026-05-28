import { useState } from "react";

import {
  cleanMachineTitle,
  formatHours,
  getCardImages,
  getFeatureLine,
  getListingHref,
  getListingId,
} from "../lib/listingFormatters";

import MachineBadges from "./MachineBadges";

function getBulkImageUrls(listing = {}) {
  const raw =
    listing?.imageUrls ||
    listing?.publicData?.imageUrls ||
    listing?.attributes?.publicData?.imageUrls ||
    [];

  if (Array.isArray(raw)) {
    return raw.filter(Boolean);
  }

  if (typeof raw === "string") {
    return raw
      .split(",")
      .map(url => url.trim())
      .filter(Boolean);
  }

  return [];
}

export default function ListingCard({
  listing = {},
  saved = false,
  onToggleSaved,
  showSave = true,
  from = "browse",
}) {
  const [photoIndex, setPhotoIndex] = useState(0);

  const id = String(getListingId(listing));

  const sharetribeImages =
    getCardImages(listing);

  const bulkImages =
    getBulkImageUrls(listing);

  const images =
    bulkImages.length > 0
      ? bulkImages
      : sharetribeImages;

  const currentPhoto =
    images[photoIndex];

  function changePhoto(e, direction) {
    e.preventDefault();
    e.stopPropagation();

    if (images.length < 2) return;

    setPhotoIndex(current =>
      (current + direction + images.length) %
      images.length
    );
  }

  function toggleSave(e) {
    e.preventDefault();
    e.stopPropagation();

    if (onToggleSaved) {
      onToggleSaved(id, listing);
    }
  }

  const keywords = Array.isArray(
    listing?.keywords
  )
    ? listing.keywords
    : Array.isArray(
        listing?.publicData?.keywords
      )
        ? listing.publicData.keywords
        : [];

  const normalizedKeywords = keywords
    .filter(Boolean)
    .map(k =>
      String(k)
        .trim()
        .toLowerCase()
    )
    .slice(0, 6);

  return (
    <a
      href={getListingHref(listing, from)}
      className="card"
    >
      <div className="card-photo">

  <img
    src={
      currentPhoto ||
      "/images/hero-equipment-yard.jpg"
    }
    alt={listing.title || "Machine"}
    className="card-photo-img"
    loading="lazy"
  />
        {images.length > 1 ? (
          <>
            <button
              type="button"
              className="card-photo-nav left"
              onClick={e =>
                changePhoto(e, -1)
              }
              aria-label="Previous photo"
            >
              ‹
            </button>

            <button
              type="button"
              className="card-photo-nav right"
              onClick={e =>
                changePhoto(e, 1)
              }
              aria-label="Next photo"
            >
              ›
            </button>

            <span className="photo-count">
              {photoIndex + 1}/
              {images.length}
            </span>
          </>
        ) : null}
      </div>

      <div className="card-body">

        <div className="title-row">

          <h3>
            {cleanMachineTitle(
              listing.title
            )}
          </h3>

          <h3 className="hours-inline">
            {formatHours(
              listing.hours
            )}
          </h3>

        </div>

        <div className="keyword-row">

          <MachineBadges
            keywords={normalizedKeywords}
            variant="card"
          />

        </div>

        <div className="price-row">

          <strong>
            {listing.price ||
              "Call for price"}
          </strong>

          <div className="meta">

            {showSave ? (
              <button
                type="button"
                className={`save-star ${
                  saved ? "saved" : ""
                }`}
                onClick={toggleSave}
                aria-label={
                  saved
                    ? "Unsave listing"
                    : "Save listing"
                }
                title={
                  saved
                    ? "Saved"
                    : "Save"
                }
              >
                <i
                  className={
                    saved
                      ? "fa-solid fa-star"
                      : "fa-regular fa-star"
                  }
                ></i>
              </button>
            ) : null}

            <span>
              ⌖{" "}
              {listing.location ||
                "Location not listed"}
            </span>

          </div>
        </div>
      </div>

      <style jsx>{`
        .card {
          position: relative;
          text-decoration: none;
          color: inherit;

          border: 1px solid rgba(255,255,255,.06);
          outline: 1px solid rgba(255,255,255,.018);

          border-radius: 13px;

          overflow: hidden;

          background:
            linear-gradient(
              180deg,
              rgba(255,255,255,.028),
              rgba(255,255,255,0)
            ),
            #141414;

          box-shadow:
            0 1px 0 rgba(255,255,255,.045) inset,
            0 18px 44px rgba(0,0,0,.22);

          transition:
            transform .16s ease,
            border-color .16s ease,
            background .16s ease,
            box-shadow .16s ease;

          contain: layout paint;
        }

        .card:hover {
          transform:
            translateY(-2px)
            scale(1.003);

          border-color:
            rgba(255,196,0,.14);

          background:
            linear-gradient(
              180deg,
              rgba(255,255,255,.038),
              rgba(255,255,255,0)
            ),
            #171717;

          box-shadow:
            0 1px 0 rgba(255,255,255,.06) inset,
            0 22px 52px rgba(0,0,0,.30);
        }

        .card-photo {
  position: relative;

  height: 196px;

  overflow: hidden;

  border-bottom:
    1px solid rgba(255,255,255,.065);

  background: #0f0f0f;

  box-shadow:
    inset 0 -40px 70px rgba(0,0,0,.10);
}

.card-photo-img {
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

        .card:hover .card-photo-img {
          filter:
            contrast(1.04)
            saturate(1.03)
            brightness(1.01);

          transform: scale(1.018);
        }

        .card-photo-nav {
          position: absolute;
          top: 92%;

          transform: translateY(-50%);

          width: 22px;
          height: 92px;

          border: none;

          background: rgba(0,0,0,.06);

          color: rgba(255,255,255,.42);

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
          background: rgba(0,0,0,.14);
          color: rgba(255,255,255,.68);
        }

        .photo-count {
          position: absolute;

          top: 8px;
          right: 8px;

          background: rgba(0,0,0,.18);

          color: rgba(255,255,255,.44);

          backdrop-filter: blur(2px);

          border-radius: 999px;

          padding: 3px 6px;

          font-size: 8px;
          font-weight: 700;

          letter-spacing: .25px;

          z-index: 5;
        }

        .card-body {
          padding: 13px 13px 14px;

          display: flex;
          flex-direction: column;

          min-height: 148px;
        }

        .title-row {
          display: flex;
          justify-content: space-between;
          align-items: baseline;

          gap: 10px;
        }

        .card h3 {
          margin: 0;

          color: #f2f2f2;

          font-size: 15.5px;
          font-weight: 900;

          line-height: 1.12;

          max-width: 92%;

          letter-spacing: -0.28px;

          text-rendering:
            geometricPrecision;
        }

        .hours-inline {
          color:
            rgba(255,255,255,.54) !important;

          font-size: 12.75px !important;

          font-weight: 500 !important;

          letter-spacing: .18px;

          line-height: 1;

          white-space: nowrap;
        }

        .keyword-row {
          height: 54px;
          max-height: 54px;

          margin: 15px 0 8px;

          overflow: visible;
        }

        .keyword-row :global(.machine-badges.card) {
          max-height: 60px;
          overflow: hidden;
        }

        .price-row {
          position: relative;

          display: flex;
          justify-content: space-between;
          align-items: center;

          margin-top: auto;

          padding-top: 13px;

          border-top:
            1px solid rgba(255,255,255,.045);

          gap: 12px;
        }

        .price-row::before {
          content: "";

          position: absolute;

          top: -1px;
          left: 0;

          width: 34%;
          height: 1px;

          background:
            linear-gradient(
              90deg,
              rgba(255,196,0,.22),
              transparent
            );
        }

        .price-row strong {
          color: #f2f2f2;

          font-size: 17.25px;

          font-weight: 850;

          letter-spacing: -0.12px;

          white-space: nowrap;
        }

        .meta {
          display: flex;
          align-items: center;

          gap: 9px;

          color: #9a9a9a;

          flex-wrap: nowrap;

          justify-content: flex-end;

          text-align: right;

          margin-left: auto;
        }

        .meta span {
          color:
            rgba(255,255,255,.48);

          font-size: 10.5px;

          font-weight: 850;

          letter-spacing: .42px;

          white-space: nowrap;

          text-transform: uppercase;
        }

        .save-star {
          width: 18px;
          height: 18px;

          display: grid;
          place-items: center;

          background: transparent;

          border: none;

          color:
            rgba(255,255,255,.28);

          cursor: pointer;

          padding: 0;

          margin-right: -2px;

          transition:
            color .14s ease,
            transform .14s ease;
        }

        .save-star i {
          font-size: 12px;
        }

        .save-star.saved {
          color: #ffc400;

          text-shadow:
            0 0 8px rgba(255,196,0,.12);
        }

        .save-star:hover {
          color:
            rgba(255,196,0,.82);

          transform: scale(1.06);
        }
      `}</style>
    </a>
  );
}
