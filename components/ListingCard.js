import { useMemo, useState } from "react";
import Link from "next/link";
import {
  formatHours,
  formatPrice,
  getAuctionMeta,
  getFeatureLine,
  getListingHref,
  getListingId,
  getListingImages,
  getListingTitle,
  getLocation,
  getPublicData,
  isAuctionListing,
} from "../lib/listingFormatters";

export default function ListingCard({
  listing,
  saved = false,
  onToggleSaved,
  showSave = true,
  href,
}) {
  const [imageIndex, setImageIndex] = useState(0);

  const id = getListingId(listing);
  const pd = getPublicData(listing);

  const title = getListingTitle(listing);
  const price = formatPrice(listing);
  const hours = formatHours(pd.hours);
  const location = getLocation(listing);
  const featureLine = getFeatureLine(listing);
  const images = useMemo(() => getListingImages(listing), [listing]);
  const image = images[imageIndex];

  const auction = isAuctionListing(listing);
  const auctionMeta = getAuctionMeta(listing);

  const cardHref = href || getListingHref(listing);

  function prevImage(e) {
    e.preventDefault();
    e.stopPropagation();
    setImageIndex(prev => (prev === 0 ? images.length - 1 : prev - 1));
  }

  function nextImage(e) {
    e.preventDefault();
    e.stopPropagation();
    setImageIndex(prev => (prev === images.length - 1 ? 0 : prev + 1));
  }

  function toggleSaved(e) {
    e.preventDefault();
    e.stopPropagation();
    if (onToggleSaved) onToggleSaved(id, listing);
  }

  return (
    <Link href={cardHref} className="ix-card-link">
      <article className="ix-listing-card">
        <div className="ix-image-shell">
          {image ? (
            <img src={image} alt={title} className="ix-card-image" />
          ) : (
            <div className="ix-image-placeholder">No Image</div>
          )}

          {images.length > 1 && (
            <>
              <button className="ix-arrow ix-arrow-left" onClick={prevImage}>‹</button>
              <button className="ix-arrow ix-arrow-right" onClick={nextImage}>›</button>
            </>
          )}

          {auction && <div className="ix-auction-badge">Auction</div>}
        </div>

        <div className="ix-card-body">
          <div className="ix-price-row">
            <div className="ix-price">{auction ? "Auction Inventory" : price}</div>
            <div className="ix-hours">{hours}</div>
          </div>

          <h3 className="ix-title">{title}</h3>

          {auction ? (
            <div className="ix-auction-line">
              {auctionMeta.auctionType && <span>{auctionMeta.auctionType}</span>}
              {auctionMeta.auctionDate && <span>{auctionMeta.auctionDate}</span>}
              {auctionMeta.estimateLow && auctionMeta.estimateHigh && (
                <span>
                  Est. ${Number(auctionMeta.estimateLow).toLocaleString()}–$
                  {Number(auctionMeta.estimateHigh).toLocaleString()}
                </span>
              )}
            </div>
          ) : (
            featureLine && <div className="ix-feature-line">{featureLine}</div>
          )}

          <div className="ix-meta-row">
            <span className="ix-location">{location}</span>

            {showSave && (
              <button
                className={`ix-save ${saved ? "is-saved" : ""}`}
                onClick={toggleSaved}
                aria-label={saved ? "Unsave machine" : "Save machine"}
              >
                ★
              </button>
            )}
          </div>
        </div>

        <style jsx>{`
          .ix-card-link {
            display: block;
            height: 100%;
            color: inherit;
            text-decoration: none;
          }

          .ix-listing-card {
            height: 100%;
            overflow: hidden;
            border-radius: 16px;
            background: #151719;
            border: 1px solid rgba(255,255,255,0.08);
            box-shadow: 0 12px 32px rgba(0,0,0,0.28);
            transition: transform 150ms ease, border-color 150ms ease, box-shadow 150ms ease;
          }

          .ix-listing-card:hover {
            transform: translateY(-2px);
            border-color: rgba(249,133,18,0.38);
            box-shadow: 0 18px 42px rgba(0,0,0,0.38);
          }

          .ix-image-shell {
            position: relative;
            width: 100%;
            aspect-ratio: 4 / 3;
            background: #0d0f10;
            overflow: hidden;
          }

          .ix-card-image {
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
          }

          .ix-image-placeholder {
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #8b8f92;
            font-size: 13px;
            background: #101214;
          }

          .ix-arrow {
            position: absolute;
            top: 50%;
            transform: translateY(-50%);
            width: 28px;
            height: 36px;
            border: 1px solid rgba(255,255,255,0.14);
            border-radius: 999px;
            background: rgba(10,10,10,0.55);
            color: #fff;
            font-size: 22px;
            cursor: pointer;
            opacity: 0;
          }

          .ix-image-shell:hover .ix-arrow {
            opacity: 1;
          }

          .ix-arrow-left { left: 10px; }
          .ix-arrow-right { right: 10px; }

          .ix-auction-badge {
            position: absolute;
            left: 10px;
            top: 10px;
            padding: 5px 8px;
            border-radius: 999px;
            background: rgba(249,133,18,0.92);
            color: #111;
            font-size: 11px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.04em;
          }

          .ix-card-body {
            padding: 13px 14px 14px;
          }

          .ix-price-row {
            display: flex;
            align-items: baseline;
            justify-content: space-between;
            gap: 10px;
            margin-bottom: 6px;
          }

          .ix-price {
            color: #f4f4f4;
            font-size: 18px;
            font-weight: 850;
            letter-spacing: -0.02em;
          }

          .ix-hours {
            color: #b9bec2;
            font-size: 12.5px;
            white-space: nowrap;
          }

          .ix-title {
            margin: 0;
            color: #ffffff;
            font-size: 15.5px;
            line-height: 1.25;
            font-weight: 800;
          }

          .ix-feature-line,
          .ix-auction-line {
            min-height: 18px;
            margin-top: 7px;
            color: #aeb4b8;
            font-size: 12.5px;
            line-height: 1.35;
          }

          .ix-auction-line {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
          }

          .ix-auction-line span {
            color: #d8dde0;
          }

          .ix-meta-row {
            margin-top: 11px;
            padding-top: 10px;
            border-top: 1px solid rgba(255,255,255,0.08);
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
          }

          .ix-location {
            min-width: 0;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            color: #c7cbce;
            font-size: 12.75px;
          }

          .ix-save {
            border: 0;
            background: transparent;
            color: #6f7478;
            font-size: 15px;
            cursor: pointer;
            padding: 2px 0 2px 8px;
          }

          .ix-save:hover,
          .ix-save.is-saved {
            color: #f98512;
          }
        `}</style>
      </article>
    </Link>
  );
}
