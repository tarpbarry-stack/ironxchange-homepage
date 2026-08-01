import { useRef, useState } from "react";

import { captureIXEvent } from "../../../lib/posthog";

import {
  getCardImages,
  getListingHref,
  getListingId
} from "../../../lib/listingFormatters";

import IXIMachineRail from "../../IXIMachineRail";

import IXIAuctionObjectFace1
  from "../../ixi-auction-object/IXIAuctionObjectFace1";

import IXIAuctionObjectFace2
  from "../../ixi-auction-object/IXIAuctionObjectFace2";

import IXIAuctionObjectFace3
  from "../../ixi-auction-object/IXIAuctionObjectFace3";

import {
  getFrameClass,
  getFrameStyle
} from "../../../lib/ixvision/frameEngine";

function getBulkImageUrls(listing = {}) {
  const raw =
    listing?.imageUrls ||
    listing?.publicData?.imageUrls ||
    listing?.attributes?.publicData?.imageUrls ||
    [];

  if (Array.isArray(raw)) return raw.filter(Boolean);

  if (typeof raw === "string") {
    return raw
      .split(",")
      .map(url => url.trim())
      .filter(Boolean);
  }

  return [];
}

export default function AuctionListingCard({
  listing = {},
  sourceListingUrl = "",

  saved = false,
  onToggleSaved,
  from = "browse",

  priceValue,
  onPriceChange,
  onPriceKeyDown,

  lotNumberValue,
  onLotNumberChange,
  onLotNumberKeyDown,

  hoursValue,
  onHoursChange,
  onHoursKeyDown,
  
  locationValue,
  onLocationChange,
  onLocationKeyDown,

  machineFace = 1,
  onCycleMachineFace,

  dealerBidPack = {},
  onSaveDealerBidPack,

  onSendFront,
  onSendBack,

  armedDestination,
  onSendToArmedDestination,

  ixiState,
  actionNotice,
  onIxiStateChange,

  isBoardDraggingCard = false,
  isGhostTarget = false,

  onBoardDragStart,
  onBoardDragOver,
  onBoardDragEnd,

  dragHandleProps
}) {
  const [photoIndex, setPhotoIndex] = useState(0);
  console.log("AUCTION DRAG HANDLE RECEIVED", {
  listingId:
    listing?.id?.uuid ||
    listing?.id ||
    "",

  hasDragHandleProps:
    Boolean(dragHandleProps),

  hasPointerDown:
    typeof dragHandleProps?.onPointerDown ===
    "function",

  hasActivatorRef:
    Boolean(dragHandleProps?.ref)
});

  const [localBoardColor, setLocalBoardColor] = useState("none");
const [localBoardOutline, setLocalBoardOutline] = useState(1);

 const boardColor = ixiState?.color || localBoardColor;
const boardOutline = ixiState?.outline || localBoardOutline;

const boardColors = ["none", "green", "yellow", "red", "cyan", "white", "blue", "orange"];

function cycleBoardColor(e) {
  e.preventDefault();
  e.stopPropagation();

  const currentIndex = boardColors.indexOf(boardColor);
  const nextColor = boardColors[(currentIndex + 1) % boardColors.length];

  if (onIxiStateChange) {
    onIxiStateChange(id, { color: nextColor });
  } else {
    setLocalBoardColor(nextColor);
  }
}

  function cycleBoardOutline(e) {
  e.preventDefault();
  e.stopPropagation();

  const nextOutline =
    boardOutline === 1 ? 3 :
    boardOutline === 3 ? 5 :
    boardOutline === 5 ? 0 :
    1;

  if (onIxiStateChange) {
    onIxiStateChange(id, { outline: nextOutline });
  } else {
    setLocalBoardOutline(nextOutline);
  }
}

 const boardDragStart = useRef(null);
const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
const [isBoardDragging, setIsBoardDragging] = useState(false);

function startBoardDrag(e) {
  if (e.target.closest("button, input, select, a")) return;

  boardDragStart.current = {
    x: e.clientX,
    y: e.clientY
  };

  setIsBoardDragging(true);
  setDragOffset({ x: 0, y: 0 });

  onBoardDragStart?.(listing, e);

  e.currentTarget.setPointerCapture?.(e.pointerId);
}

function moveBoardDrag(e) {
  if (!boardDragStart.current) return;

  setDragOffset({
    x: e.clientX - boardDragStart.current.x,
    y: e.clientY - boardDragStart.current.y
  });

  const elementsBelow = document.elementsFromPoint(
    e.clientX,
    e.clientY
  );

  const targetCard = elementsBelow
    .map(el => el.closest?.("[data-listing-card-id]"))
    .find(card => {
      const targetId = card?.getAttribute("data-listing-card-id");
      return targetId && targetId !== id;
    });

  if (!targetCard) return;

  const targetId = targetCard.getAttribute("data-listing-card-id");

  onBoardDragOver?.({
    id: targetId
  });
}
  

function endBoardDrag(e) {
  if (!boardDragStart.current) return;

  boardDragStart.current = null;

  onBoardDragEnd?.(e);

  setTimeout(() => {
    setIsBoardDragging(false);
    setDragOffset({ x: 0, y: 0 });
  }, 180);
}

  const id = String(getListingId(listing));

 const requestedAuctionFace =
  Number(machineFace);

const auctionFace =
  requestedAuctionFace === 3
    ? 3
    : requestedAuctionFace === 2
      ? 2
      : 1;
  
  const sharetribeImages = getCardImages(listing);
  const bulkImages = getBulkImageUrls(listing);

  const images =
    bulkImages.length > 0
      ? bulkImages
      : sharetribeImages;

  const currentPhoto = images[photoIndex];
  const [photoFitMap, setPhotoFitMap] = useState({});

  const currentImageValue =
  images[photoIndex];

const currentImageObject =
  typeof currentImageValue === "string"
    ? { url: currentImageValue }
    : currentImageValue || { url: currentPhoto };

  function changePhoto(e, direction) {
    e.preventDefault();
    e.stopPropagation();

    if (images.length < 2) return;

    setPhotoIndex(current =>
      (current + direction + images.length) % images.length
    );
  }

function handleCardClick() {
  captureIXEvent("auction_listing_card_clicked", {
    listingId: id,
    title: listing.title,
    category: listing.category || listing.type,
    make: listing.make,
    model: listing.model,
    price: listing.price,
    location: listing.location,
    from
  });
}

  function getSmartPhotoFit(photoUrl) {
  return photoFitMap[photoUrl] || "soft-cover";
}

function handlePhotoLoad(e, photoUrl) {
  const img = e.currentTarget;

  const ratio = img.naturalWidth / img.naturalHeight;

  let fit = "soft-cover";

  if (ratio >= 1.65) {
    fit = "contain-wide";
  } else if (ratio <= 1.15) {
    fit = "contain-tall";
  } else if (ratio >= 1.35 && ratio < 1.65) {
    fit = "soft-cover";
  }

  setPhotoFitMap(current => ({
    ...current,
    [photoUrl]: fit
  }));
}
  
  return (
 <div
  data-listing-card-id={id}
  className={`card auction-listing-card board-color-${boardColor} board-outline-${boardOutline} ${
    isBoardDragging ? "board-dragging" : ""
  } ${isBoardDraggingCard ? "grid-drag-source" : ""} ${
    isGhostTarget ? "grid-ghost-target" : ""
  }`}
  style={{
    transform: isBoardDragging
      ? `translate(${dragOffset.x}px, ${dragOffset.y}px) scale(1.015)`
      : undefined,
    zIndex: isBoardDragging ? 50 : undefined
  }}
>
{actionNotice?.message || ixiState?.actionNotice?.message || ixiState?.theaterNotice ? (
  <div className={`ixi-action-card-notice ${
    actionNotice?.tone || ixiState?.actionNotice?.tone || "success"
  }`}>
    {actionNotice?.message || ixiState?.actionNotice?.message || ixiState.theaterNotice}
  </div>
) : null}
{auctionFace === 3 ? (
  <IXIAuctionObjectFace3
  listing={listing}

  dealerBidPack={
    dealerBidPack
  }

  onSaveDealerBidPack={
    onSaveDealerBidPack
  }

  dragHandleProps={
    dragHandleProps
  }
/>
) : auctionFace === 2 ? (
  <IXIAuctionObjectFace2
    listing={listing}
    sourceListingUrl={sourceListingUrl}
    dragHandleProps={dragHandleProps}

    sellerMode={true}

    lotNumberValue={lotNumberValue}
  onLotNumberChange={onLotNumberChange}
  onLotNumberKeyDown={onLotNumberKeyDown}
 
    hoursValue={hoursValue}
    onHoursChange={onHoursChange}
    onHoursKeyDown={onHoursKeyDown}

    openingBidValue={priceValue}
    onOpeningBidChange={onPriceChange}
    onOpeningBidKeyDown={onPriceKeyDown}
  />
) : (
  <>
    <a
      href={getListingHref(listing, from)}
      className="photo-click-zone"
      onClick={handleCardClick}
    >
      <div
        className="card-photo"
        {...(dragHandleProps || {})}
        {...(!dragHandleProps
          ? {
              onPointerDown: startBoardDrag,
              onPointerMove: moveBoardDrag,
              onPointerUp: endBoardDrag,
              onPointerCancel: endBoardDrag
            }
          : {})}
      >
        <img
          src={
            currentPhoto ||
            "/images/hero-equipment-yard.jpg"
          }
          alt={listing.title || "Machine"}
          draggable={false}
          className={`card-photo-img photo-fit-${getSmartPhotoFit(
            currentPhoto
          )} ${getFrameClass(
            currentImageObject,
            "card"
          )}`}
          style={getFrameStyle(
            currentImageObject,
            "card"
          )}
          onLoad={event =>
            handlePhotoLoad(
              event,
              currentPhoto
            )
          }
          loading="lazy"
        />

        <div className="status-photo-pill auction">
          AUCT
        </div>

        {images.length > 1 ? (
          <>
            <button
              type="button"
              className="card-photo-nav left"
              onClick={event =>
                changePhoto(event, -1)
              }
              aria-label="Previous photo"
            >
              ‹
            </button>

            <button
              type="button"
              className="card-photo-nav right"
              onClick={event =>
                changePhoto(event, 1)
              }
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
    </a>

  <div className="card-body">
  <div
    className="card-board-zone"
    {...(dragHandleProps || {})}
    {...(!dragHandleProps
      ? {
          onPointerDown: startBoardDrag,
          onPointerMove: moveBoardDrag,
          onPointerUp: endBoardDrag,
          onPointerCancel: endBoardDrag
        }
      : {})}
  >
    <IXIAuctionObjectFace1
      listing={listing}
      from={from}
      onListingClick={handleCardClick}

      sellerMode={true}

      lotNumberValue={lotNumberValue}
  onLotNumberChange={onLotNumberChange}
  onLotNumberKeyDown={onLotNumberKeyDown}

      hoursValue={hoursValue}
      onHoursChange={onHoursChange}
      onHoursKeyDown={onHoursKeyDown}

      priceValue={priceValue}
      onPriceChange={onPriceChange}
      onPriceKeyDown={onPriceKeyDown}

      locationValue={locationValue}
      onLocationChange={onLocationChange}
      onLocationKeyDown={onLocationKeyDown}
    />
  </div>
</div>
  </>
)}
         
<IXIMachineRail
  listing={listing}
  saved={saved}
  boardColor={boardColor}
  boardOutline={boardOutline}
  machineFace={auctionFace}
onCycleMachineFace={onCycleMachineFace}
  onSendFront={onSendFront}
  onSendBack={onSendBack}
  onCycleColor={cycleBoardColor}
  onCycleOutline={cycleBoardOutline}
  onToggleSaved={onToggleSaved}
  armedDestination={armedDestination}
  onSendToArmedDestination={onSendToArmedDestination}
/>

      <style jsx>{`

        .card {
          position: relative;
          text-decoration: none;
          color: inherit;

          font-family: 'Inter', sans-serif;
          font-size: initial;
          line-height: normal;
          isolation: isolate;

          height: 470px;
min-height: 470px;
max-height: 470px;

          border: 1px solid rgba(255,255,255,.06);
          outline: 1px solid rgba(255,255,255,.018);

          border-radius: 13px;
          overflow: hidden;

          background:
            linear-gradient(180deg, rgba(255,255,255,.028), rgba(255,255,255,0)),
            #141414;

          box-shadow:
            0 1px 0 rgba(255,255,255,.045) inset,
            0 18px 44px rgba(0,0,0,.22);

         transition:
  transform .22s cubic-bezier(.22,.61,.36,1),
  border-color .16s ease,
  background .16s ease,
  box-shadow .16s ease;

          contain: layout paint;
        }

.ixi-action-card-notice {
  position: absolute;
  inset: 0;

  display: flex;
  align-items: center;
  justify-content: center;

  z-index: 80;
  pointer-events: none;

  background: rgba(0,0,0,.74);
  color: rgba(0,194,255,.96);

  font-size: 12px;
  font-weight: 950;
  letter-spacing: .9px;
  text-align: center;

  border: 2px solid rgba(0,194,255,.78);
  border-radius: inherit;

  box-shadow:
    0 0 18px rgba(0,194,255,.34),
    inset 0 0 22px rgba(0,194,255,.10);

  animation: ixiTheaterNoticePulse .22s ease-out;
}

@keyframes ixiTheaterNoticePulse {
  from {
    transform: scale(.96);
    opacity: .35;
  }

  to {
    transform: scale(1);
    opacity: 1;
  }
}


.photo-click-zone {
  display: block;
  color: inherit;
  text-decoration: none;
}

.card.board-dragging {
  cursor: grabbing;
  opacity: 1;

  box-shadow:
    0 1px 0 rgba(255,255,255,.06) inset,
    0 30px 80px rgba(0,0,0,.48);

  transition: none;
}

.card.grid-drag-source {
  opacity: 1;
}

.card.grid-ghost-target {
  box-shadow:
    0 1px 0 rgba(255,255,255,.06) inset,
    0 0 0 2px rgba(0,194,255,.44),
    0 22px 52px rgba(0,0,0,.30);
}

.card.grid-ghost-target::after {
  content: "";
  position: absolute;
  inset: 8px;
  border: 1px dashed rgba(0,194,255,.42);
  border-radius: 10px;
  pointer-events: none;
  z-index: 20;
}

.card-board-zone {
  height: 100%;
  cursor: grab;
}
.card.board-color-none .rail-color::after {
  background: rgba(255,255,255,.14);
}

.card.board-color-green .rail-color::after {
  background: rgba(56,161,105,.66);
}

.card.board-color-yellow .rail-color::after {
  background: rgba(255,196,0,.70);
}

.card.board-color-red .rail-color::after {
  background: rgba(229,62,62,.70);
}

.card.board-color-cyan .rail-color::after {
  background: rgba(0,194,255,.68);
}

.card.board-color-white .rail-color::after {
  background: rgba(255,255,255,.58);
}

.card.board-color-blue .rail-color::after {
  background: rgba(49,130,206,.70);
}

.card.board-color-orange .rail-color::after {
  background: rgba(249,133,18,.72);
}


.card.board-outline-1 {
  outline-width: 1px;
}

.card.board-outline-3 {
  outline-width: 3px;
}

.card.board-outline-5 {
  outline-width: 5px;
}

.card.board-outline-0 {
  outline-width: 0;
}

.card.board-color-none {
  outline-color: rgba(255,255,255,.018);
}

.card.board-color-green {
  outline-color: rgba(56,161,105,.95);
}

.card.board-color-yellow {
  outline-color: rgba(255,196,0,.95);
}

.card.board-color-red {
  outline-color: rgba(229,62,62,.95);
}

.card.board-color-cyan {
  outline-color: rgba(0,194,255,.95);
}

.card.board-color-white {
  outline-color: rgba(255,255,255,.85);
}

.card.board-color-blue {
  outline-color: rgba(49,130,206,.95);
}

.card.board-color-orange {
  outline-color: rgba(249,133,18,.95);
}

        .card:hover {
          transform: translateY(-2px) scale(1.003);
          border-color: rgba(255,196,0,.14);

          background:
            linear-gradient(180deg, rgba(255,255,255,.038), rgba(255,255,255,0)),
            #171717;

          box-shadow:
            0 1px 0 rgba(255,255,255,.06) inset,
            0 22px 52px rgba(0,0,0,.30);
        }

        .card-photo {
          position: relative;
          height: 220px;
          overflow: hidden;

          border-bottom: 1px solid rgba(255,255,255,.065);
          background:
    radial-gradient(circle at center, rgba(255,255,255,.045), transparent 58%),
    linear-gradient(180deg, #101010, #070707);

          box-shadow:
            inset 0 -40px 70px rgba(0,0,0,.10);
        }

        .card-photo-img {
  width: 100%;
  height: 100%;
  object-position: center center;
  display: block;
  user-select: none;
  -webkit-user-drag: none;
  pointer-events: none;
  transition:
    filter .18s ease,
    transform .28s ease;
  image-rendering: auto;
  backface-visibility: hidden;
  transform-origin: center center;
}

       .card-photo-img.photo-fit-contain-wide,
.card-photo-img.photo-fit-contain-tall {
  filter:
    contrast(1.035)
    saturate(1.035)
    brightness(1.02);
}

.card-photo-img.photo-fit-soft-cover {
  object-fit: cover;
  transform: scale(.96);
}

.card-photo-img.photo-fit-contain-wide {
  object-fit: cover;
  transform: scale(.94);
}

.card-photo-img.photo-fit-contain-tall {
  object-fit: cover;
  transform: scale(.92);
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
          z-index: 5;

          padding: 3px 6px;
          border-radius: 999px;

          background: rgba(0,0,0,.18);
          color: rgba(255,255,255,.44);

          backdrop-filter: blur(2px);

          font-size: 8px;
          font-weight: 700;
          letter-spacing: .25px;
        }

        .card-body {
  padding: 13px 13px 14px;
  display: flex;
  flex-direction: column;

  height: 268px;
  min-height: 268px;
  max-height: 268px;
}

    
       
        

.status-photo-pill {
  position: absolute;
  left: 10px;
  top: 10px;
  z-index: 6;

  height: 24px;
  padding: 0 10px;

  display: inline-flex;
  align-items: center;
  justify-content: center;

  border-radius: 999px;

  background: rgba(0,194,255,.12);
  border: 1px solid rgba(0,194,255,.42);
  color: rgba(210,250,255,.86);

  font-size: 8.5px;
  font-weight: 950;
  letter-spacing: .45px;
  text-transform: uppercase;

  box-shadow:
    0 0 0 1px rgba(0,194,255,.05),
    0 8px 20px rgba(0,0,0,.28);
}

.status-photo-pill.auction {
  background: rgba(255,196,0,.14);
  border-color: rgba(255,196,0,.52);
  color: #FFC400;

  box-shadow:
    0 0 0 1px rgba(255,196,0,.05),
    0 8px 20px rgba(0,0,0,.28),
    0 0 14px rgba(255,196,0,.08);
}

      `}</style>
    </div>
  );
}
