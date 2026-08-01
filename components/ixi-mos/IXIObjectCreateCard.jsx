import { useState, useRef } from "react";
// DnD is owned by IXISortableMachineCard wrapper.

import { captureIXEvent } from "../../lib/posthog";

import {
  cleanMachineTitle,
  formatHours,
  getCardImages,
  getListingHref,
  getListingId,
} from "../../lib/listingFormatters";

import MachineBadges from "../MachineBadges";

import IXIMachineRail from "../IXIMachineRail";

import IXIMachinePlacementControl
from "../ixi-machine-placement/IXIMachinePlacementControl";

import IXIMachineObjectFace2
from "../ixi-machine-object/IXIMachineObjectFace2";

import IXISellerMachineObjectFace2
from "../ixi-machine-object/IXISellerMachineObjectFace2";

import IXIMachineObjectFace3
from "../ixi-machine-object/IXIMachineObjectFace3";

import IXIMachineObjectFace4
from "../ixi-machine-object/IXIMachineObjectFace4";

import {
  getFrameClass,
  getFrameStyle
} from "../../lib/ixvision/frameEngine";


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

export default function IXIObjectCreateCard({
  listing = {},
  cardContext = "inventory",
  presentation: transportedPresentation,
  sourceListingUrl = "",
  saved = false,
  onToggleSaved,
  showSave = true,
  from = "browse",

  sellerMode = false,
  launchMode = false,
  creationMode = false,
  workflowValue = "good-listing",
  onWorkflowChange,
  priceValue,
onPriceChange,
onPriceKeyDown,
savingPrice = false,

assetNameValue = "",
onAssetNameChange,

entityName = "",

yearValue = "",
onYearChange,

makeValue = "",
onMakeChange,

modelValue = "",
onModelChange,

milesValue = "",
onMilesChange,

vinValue = "",
onVinChange,

currentValueEstimate = "",
onCurrentValueEstimateChange,

currentOperator = "",
currentCrew = "",
currentJob = "",
currentLocation = "",

descriptionValue,
  onDescriptionChange,
  onDescriptionKeyDown,
  savingDescription = false,

    isPaused = false,

  machineAccess = "public",
  machineChannel = "marketplace",
  machinePlacementBusy = false,
  onMachinePlacementChange,

  locationValue,
  onLocationChange,
  onLocationKeyDown,
  
  onEdit,
  onPause,
  onReactivate,
  onDelete,

  machineFace = 1,
  onCycleMachineFace,

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
useDndDrag = false,
dragHandleProps,
}) {
  const [photoIndex, setPhotoIndex] = useState(0);

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

function endIxiRelationship(e) {
  e.preventDefault();
  e.stopPropagation();

  if (onIxiStateChange) {
    onIxiStateChange(id, {
      color: "none",
      outline: 1
    });
  } else {
    setLocalBoardColor("none");
    setLocalBoardOutline(1);
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

  const dx = e.clientX - boardDragStart.current.x;
  const dy = e.clientY - boardDragStart.current.y;

  boardDragStart.current = null;

 onBoardDragEnd?.(e);

 
  setTimeout(() => {
    setIsBoardDragging(false);
    setDragOffset({ x: 0, y: 0 });
  }, 180);
}

  const id = String(getListingId(listing));

  const isWorkspaceContext =
  cardContext === "workspace";

  const isInventoryContext =
  cardContext === "inventory" ||
  cardContext === "enterprise";

  const useSellerPresentation =
  sellerMode || isInventoryContext;

  const presentation =
  transportedPresentation ||
  (useSellerPresentation
    ? "seller"
    : "comparison");
  
  const publicData =
  listing.publicData ||
  listing.attributes?.publicData ||
  {};

  const resolvedAssetName =
  assetNameValue ||
  publicData.assetName ||
  publicData.customerAssetId ||
  listing.title ||
  "";

const resolvedEntityName =
  entityName ||
  publicData.entityName ||
  "YOUR ENTITY";

const resolvedYear =
  yearValue ||
  publicData.year ||
  listing.year ||
  "";

const resolvedMake =
  makeValue ||
  publicData.make ||
  listing.make ||
  "";

const resolvedModel =
  modelValue ||
  publicData.model ||
  listing.model ||
  "";

const resolvedMiles =
  milesValue ||
  publicData.miles ||
  publicData.mileage ||
  "";

const resolvedVin =
  vinValue ||
  publicData.vin ||
  "";

const resolvedCurrentValue =
  currentValueEstimate ||
  publicData.currentValueEstimate ||
  listing.price ||
  "";

const resolvedOperator =
  currentOperator ||
  publicData.currentOperator ||
  "UNASSIGNED";

const resolvedCrew =
  currentCrew ||
  publicData.currentCrew ||
  "NO CREW";

const resolvedJob =
  currentJob ||
  publicData.currentJob ||
  "NO JOB";

const resolvedCurrentLocation =
  currentLocation ||
  publicData.currentLocation ||
  "LOCATION UNKNOWN";

const sellerPlacementLabel = "PRIV";
const sellerPlacementClass = "private";
  
const rawLocation =
  locationValue ||
  listing.location ||
  publicData.location ||
  publicData.loc?.address ||
  publicData.loc ||
  "";

function getSellerCity() {
  const loc = String(rawLocation || "").trim();
  const parts = loc.split(",").map(x => x.trim()).filter(Boolean);

  if (parts.length >= 2) {
    return parts[0].length === 2 ? parts[1] : parts[0];
  }

  return "";
}

function getSellerState() {
  const loc = String(rawLocation || "").trim();
  const parts = loc.split(",").map(x => x.trim()).filter(Boolean);

  if (parts.length >= 2) {
    return parts[0].length === 2
      ? parts[0].toUpperCase()
      : parts[1].slice(0, 2).toUpperCase();
  }

  return loc.length === 2 ? loc.toUpperCase() : "";
}

  const sharetribeImages = getCardImages(listing);
  const bulkImages = getBulkImageUrls(listing);

  const images =
    bulkImages.length > 0
      ? bulkImages
      : sharetribeImages;

  const currentPhoto = images[photoIndex];
  const [photoFitMap, setPhotoFitMap] = useState({});

  const currentImageObject =
  sharetribeImages[photoIndex] ||
  { url: currentPhoto };

  const keywords = Array.isArray(listing?.keywords)
    ? listing.keywords
    : Array.isArray(listing?.publicData?.keywords)
      ? listing.publicData.keywords
      : [];

  const normalizedKeywords = keywords
    .filter(Boolean)
    .map(k => String(k).trim().toLowerCase())
    .slice(0, 6);

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

    onToggleSaved?.(id, listing);
  }

  function stopCardClick(e) {
  e.preventDefault();
  e.stopPropagation();
}

function handleCardClick() {
  captureIXEvent("private_listing_card_clicked", {
    listingId: id,
    title: listing.title,
    category: listing.category || listing.type,
    make: listing.make,
    model: listing.model,
    price: listing.price,
    location: listing.location,
    from,
cardContext
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
    className={`card private-listing-card board-color-${boardColor} board-outline-${boardOutline} ${
      isBoardDragging ? "board-dragging" : ""
    } ${isBoardDraggingCard ? "grid-drag-source" : ""} ${
      isGhostTarget ? "grid-ghost-target" : ""
    } ${presentation === "seller" ? "seller-mode" : ""} ${isPaused ? "paused-card" : ""}`}
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
{Number(machineFace || 1) === 2 ? (
presentation === "seller" ? (
  <IXISellerMachineObjectFace2
      listing={listing}
      dragHandleProps={dragHandleProps}
      descriptionValue={descriptionValue}
      onDescriptionChange={onDescriptionChange}
      onDescriptionKeyDown={onDescriptionKeyDown}
      savingDescription={savingDescription}
    />
  ) : (
    <IXIMachineObjectFace2
      listing={listing}
      dragHandleProps={dragHandleProps}
    />
  )
) : Number(machineFace || 1) === 3 ? (
  <IXIMachineObjectFace3
    listing={listing}
    dragHandleProps={dragHandleProps}
  />
) : Number(machineFace || 1) === 4 ? (
  <IXIMachineObjectFace4
    listing={listing}
    dragHandleProps={dragHandleProps}
  />
) : (
  <>
    
<a
  href={getListingHref(listing, from)}
  className={`photo-click-zone ${
  Number(machineFace || 1) === 1 ? "" : "mof-hidden"
}`}
  onClick={handleCardClick}
>
  <div className="card-photo">
    <img
  src={currentPhoto || "/images/hero-equipment-yard.jpg"}
  alt={listing.title || "Machine"}
  draggable={false}
 className={`card-photo-img photo-fit-${getSmartPhotoFit(currentPhoto)} ${getFrameClass(currentImageObject, "card")}`}
style={getFrameStyle(currentImageObject, "card")}
  onLoad={e => handlePhotoLoad(e, currentPhoto)}
  loading="lazy"
/>

   {presentation === "seller" ? (
  <div
    className={`status-photo-pill ${sellerPlacementClass}`}
  >
    {sellerPlacementLabel}
  </div>
) : null}

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
</a>

<div className="card-body vehicle-face-one">
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
    <div className="vehicle-identity-row">
      <label className="vehicle-field vehicle-field-asset">
        <span>ASSET NAME / ID #</span>

        <input
          value={resolvedAssetName}
          onChange={event =>
            onAssetNameChange?.(
              event.target.value,
              listing
            )
          }
          onClick={stopCardClick}
          placeholder="SERVICE TRUCK 18"
          maxLength={34}
        />
      </label>

      <div className="vehicle-entity">
        <span>ENTITY</span>
        <strong>{resolvedEntityName}</strong>
      </div>
    </div>

    <div className="vehicle-spec-row">
      <label className="vehicle-field vehicle-field-year">
        <span>YEAR</span>

        <input
          value={resolvedYear}
          onChange={event =>
            onYearChange?.(
              event.target.value,
              listing
            )
          }
          onClick={stopCardClick}
          inputMode="numeric"
          placeholder="2018"
          maxLength={4}
        />
      </label>

      <label className="vehicle-field vehicle-field-make">
        <span>MAKE</span>

        <input
          value={resolvedMake}
          onChange={event =>
            onMakeChange?.(
              event.target.value,
              listing
            )
          }
          onClick={stopCardClick}
          placeholder="FORD"
          maxLength={18}
        />
      </label>

      <label className="vehicle-field vehicle-field-model">
        <span>MODEL</span>

        <input
          value={resolvedModel}
          onChange={event =>
            onModelChange?.(
              event.target.value,
              listing
            )
          }
          onClick={stopCardClick}
          placeholder="F-350"
          maxLength={20}
        />
      </label>

      <label className="vehicle-field vehicle-field-miles">
        <span>MILES</span>

        <input
          value={resolvedMiles}
          onChange={event =>
            onMilesChange?.(
              event.target.value,
              listing
            )
          }
          onClick={stopCardClick}
          inputMode="numeric"
          placeholder="150,000"
          maxLength={7}
        />
      </label>
    </div>

    <div className="vehicle-current-block">
      <span className="vehicle-current-label">
        CURRENT
      </span>

      <strong className="vehicle-current-operator">
        {resolvedOperator}
      </strong>

      <div className="vehicle-current-relationship">
        <span>{resolvedCrew}</span>
        <i aria-hidden="true">·</i>
        <span>{resolvedJob}</span>
      </div>

      <div className="vehicle-current-location">
        {resolvedCurrentLocation}
      </div>
    </div>

    <div className="vehicle-vin-row">
      <label className="vehicle-field vehicle-field-vin">
        <span>VIN</span>

        <input
          value={resolvedVin}
          onChange={event =>
            onVinChange?.(
              event.target.value.toUpperCase(),
              listing
            )
          }
          onClick={stopCardClick}
          placeholder="1FT8W3BT8JEC12345"
          maxLength={17}
        />
      </label>
    </div>

    <div className="vehicle-value-location-row">
      <label className="vehicle-field vehicle-field-value">
        <span>CURRENT VALUE EST.</span>

        <input
          value={resolvedCurrentValue}
          onChange={event =>
            onCurrentValueEstimateChange?.(
              event.target.value,
              listing
            )
          }
          onClick={stopCardClick}
          inputMode="numeric"
          placeholder="48,500"
          maxLength={11}
        />
      </label>

      <div className="vehicle-home-location">
        <span>BASE LOCATION</span>

        <div className="location-row">
          <input
            className="city-input location-input"
            {...(onLocationChange
              ? {
                  value:
                    locationValue &&
                    String(locationValue).includes(",")
                      ? String(locationValue)
                          .split(",")[0]
                          ?.trim()
                      : getSellerCity(),

                  onChange: event => {
                    const state =
                      locationValue &&
                      String(locationValue).includes(",")
                        ? String(locationValue)
                            .split(",")[1]
                            ?.trim()
                        : getSellerState();

                    onLocationChange(
                      `${event.target.value}, ${state}`.trim(),
                      listing
                    );
                  }
                }
              : {
                  defaultValue: getSellerCity()
                })}
            onClick={stopCardClick}
            onKeyDown={event =>
              onLocationKeyDown?.(
                event,
                listing
              )
            }
            placeholder="ODESSA"
            maxLength={18}
          />

          <input
            className="state-input location-input"
            {...(onLocationChange
              ? {
                  value:
                    locationValue &&
                    String(locationValue).includes(",")
                      ? String(locationValue)
                          .split(",")[1]
                          ?.trim()
                          .slice(0, 2)
                          .toUpperCase()
                      : getSellerState(),

                  onChange: event => {
                    const city =
                      locationValue &&
                      String(locationValue).includes(",")
                        ? String(locationValue)
                            .split(",")[0]
                            ?.trim()
                        : getSellerCity();

                    onLocationChange(
                      `${city}, ${event.target.value.toUpperCase()}`.trim(),
                      listing
                    );
                  }
                }
              : {
                  defaultValue: getSellerState()
                })}
            onClick={stopCardClick}
            onKeyDown={event =>
              onLocationKeyDown?.(
                event,
                listing
              )
            }
            placeholder="TX"
            maxLength={2}
          />
        </div>
      </div>
    </div>

    <div className="vehicle-bottom-row">
      <div className="vehicle-placement-control">
        {onMachinePlacementChange ? (
          <IXIMachinePlacementControl
            machineAccess={machineAccess}
            machineChannel={machineChannel}
            disabled={machinePlacementBusy}
            onChange={nextPlacement =>
              onMachinePlacementChange(
                listing,
                nextPlacement
              )
            }
          />
        ) : null}
      </div>

      <div className="vehicle-actions">
        <button
          type="button"
          disabled
          title="Additional data coming later"
        >
          DATA
        </button>

        <button
          type="button"
          className="save-action"
          onClick={event => {
            stopCardClick(event);
            onEdit?.(listing);
          }}
        >
          SAVE
        </button>

        <button
          type="button"
          className="danger-action"
          onClick={event => {
            stopCardClick(event);
            onDelete?.(listing);
          }}
        >
          DELETE
        </button>
      </div>
    </div>
  </div>
</div>
         
<IXIMachineRail
  listing={listing}
  saved={saved}
  boardColor={boardColor}
  boardOutline={boardOutline}
  machineFace={machineFace}
  onCycleMachineFace={onCycleMachineFace}
  onSendFront={onSendFront}
  onSendBack={onSendBack}
  onCycleColor={cycleBoardColor}
  onCycleOutline={cycleBoardOutline}
  onToggleSaved={onToggleSaved}
  armedDestination={armedDestination}
  onSendToArmedDestination={onSendToArmedDestination}
/>
  </>
)}

<style jsx>{`

        .card {
          position: relative;
          text-decoration: none;
          color: inherit;

          font-family: 'Inter', sans-serif;
          font-size: initial;
          line-height: normal;
          isolation: isolate;

          height: 391px;
          min-height: 391px;
          max-height: 391px;

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


.machine-face-test {
  position: absolute;
  top: 10px;
  right: 10px;

  z-index: 999;

  padding: 4px 8px;

  background: rgba(0,194,255,.9);
  color: #00141a;

  border-radius: 4px;

  font-size: 9px;
  font-weight: 900;
  letter-spacing: .5px;
}

.mof-hidden {
  display: none !important;
}

        .title-click-zone {
        display: block;
        color: inherit;
        text-decoration: none;
        }

.photo-click-zone {
  display: block;
  color: inherit;
  text-decoration: none;
}

.card-board-zone {
  cursor: grab;
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

      .card.seller-mode {
  height: 470px;
  min-height: 470px;
  max-height: 470px;
}

.card.seller-mode .card-body {
  height: 268px;
  min-height: 268px;
  max-height: 268px;
}
        .card.paused-card {
          opacity: .58;
          filter: grayscale(.42);
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

  height: 171px;
  min-height: 171px;
  max-height: 171px;
}

     .title-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 10px;

  height: 36px;
  min-height: 36px;
  max-height: 36px;

  overflow: hidden;
  position: relative;
}

       .card .title-row h3 {
          margin: 0;
          color: #f2f2f2;

          font-size: 15.5px;
          font-weight: 900;
          line-height: 1.12;
          max-width: calc(100% - 58px);
          letter-spacing: -0.28px;
          text-rendering: geometricPrecision;
          display: -webkit-box;
-webkit-line-clamp: 2;
-webkit-box-orient: vertical;
overflow: hidden;
        }

        .hours-inline {
          color: rgba(255,255,255,.54) !important;
          font-family: 'Inter', sans-serif !important;
          font-size: 12.75px !important;
          font-weight: 500 !important;
          letter-spacing: .18px;
          line-height: 1;
          white-space: nowrap;
          position: absolute;
top: 1px;
right: 0;
width: 54px;
text-align: right;
        }

.hours-input {
  width: 52px;
  height: 23px;

  padding: 0 5px;

  border: 1px solid rgba(255,255,255,.12);
  border-radius: 5px;

  background: rgba(10,10,10,.82);
  color: rgba(255,255,255,.62);

  font-size: 10px;
  font-weight: 850;
  line-height: 1;

  text-align: right;
  outline: none;
}

.hours-input:focus {
  border-color: rgba(255,196,0,.42);
  box-shadow: 0 0 0 1px rgba(255,196,0,.10);
}

     .keyword-row {
  height: 48px;
  min-height: 48px;
  max-height: 48px;
  margin: 5px 0 4px;
  overflow: hidden;
}

        .keyword-row :global(.machine-badges.card) {
          max-height: 60px;
          overflow: hidden;
        }

     .price-row {
  position: relative;
  height: 42px;
  min-height: 42px;
  max-height: 42px;

  display: flex;
  justify-content: space-between;
  align-items: center;

   margin-top: 10px;
  padding-top: 4px;

  gap: 10px;
}
        .price-row::before {
  content: "";
  position: absolute;

  top: 4px;
  z-index: 2;
  
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

.price-row::after {
  content: "";
  position: absolute;
  top: 8px;
  left: 0;

  width: 100%;
  height: 1px;

  background: rgba(255,255,255,.045);

  z-index: 1;
}

       .price-row strong {
  position: relative;
  top: 5px;
          color: #f2f2f2;
          font-size: 17.25px;
          font-weight: 850;
          letter-spacing: -0.12px;
          white-space: nowrap;
        }

       .meta {
  position: relative;
  top: 2px;
          display: flex;
          align-items: center;
          gap: 9px;
          color: #9a9a9a;
          flex-wrap: nowrap;
          justify-content: flex-end;
          text-align: right;
          margin-left: auto;
          min-width: 0;
        }

        .meta span {
          color: rgba(255,255,255,.48);
          font-size: 10.5px;
          font-weight: 850;
          letter-spacing: .42px;
          white-space: nowrap;
          text-transform: uppercase;
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

.status-photo-pill.private {
  background: rgba(120,120,120,.16);
  border-color: rgba(190,190,190,.34);
  color: rgba(255,255,255,.66);
}

        .workflow-photo-pill {
          position: absolute;
          left: 10px;
          top: 10px;
          z-index: 6;
        }

        .workflow-photo-pill select {
          height: 24px;
          max-width: 132px;

          border: 1px solid rgba(255,255,255,.18);
          border-radius: 999px;

          background:
            linear-gradient(45deg, transparent 50%, #FFC400 50%),
            linear-gradient(135deg, #FFC400 50%, transparent 50%),
            rgba(0,0,0,.72);

          background-position:
            calc(100% - 13px) 50%,
            calc(100% - 8px) 50%;

          background-size: 5px 5px, 5px 5px;
          background-repeat: no-repeat;

          color: #f2f2f2;
          padding: 0 24px 0 9px;

          font-size: 9px;
          font-weight: 900;
          letter-spacing: .35px;
          text-transform: uppercase;

          outline: none;
          appearance: none;
          cursor: pointer;
        }

       .price-input,
.location-input {
  height: 23px;

  border: 1px solid rgba(255,255,255,.12);
  border-radius: 5px;

  background: rgba(10,10,10,.82);
  color: rgba(255,255,255,.68);

  padding: 0 6px;

  font-size: 10px;
  font-weight: 850;
  line-height: 1;

  outline: none;
}

.price-input {
  width: 82px;
  text-align: right;
}

        .location-input {
          width: 72px;
          text-align: right;
          color: rgba(255,255,255,.62);
          text-transform: uppercase;
          letter-spacing: .28px;
        }

      .location-row {
  display: flex;
  flex-direction: row;
  align-items: center;

  gap: 4px;
}

.city-input {
  width: 76px;
  text-align: right;
}

.state-input {
  width: 27px;
  padding-left: 3px;
  padding-right: 3px;

  text-align: center;
  text-transform: uppercase;
}

        .price-input:focus,
        .location-input:focus {
          border-color: rgba(255,196,0,.42);
          box-shadow: 0 0 0 1px rgba(255,196,0,.10);
        }

        .status-pill {
          height: 28px;
          padding: 0 10px;
          border-radius: 999px;

          background: rgba(56,161,105,.12);
          border: 1px solid rgba(56,161,105,.35);
          color: #38A169;

          font-size: 9px;
          font-weight: 900;

          display: flex;
          align-items: center;
          justify-content: center;

          white-space: nowrap;
        }

        .status-pill.paused {
          background: rgba(120,120,120,.14);
          border-color: rgba(160,160,160,.35);
          color: #A0A0A0;
        }

        .seller-actions {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
          margin-top: 9px;
        }

        .seller-actions button {
          height: 32px;
          border-radius: 8px;
          border: 1px solid #343434;
          background: #101010;
          color: #D6D6D6;

          font-size: 10px;
          font-weight: 900;

          cursor: pointer;

          position: relative;
          top: -5px;

          transition:
            border-color .14s ease,
            color .14s ease,
            background .14s ease,
            transform .14s ease;
        }

.launch-action {
  border-color: rgba(0,194,255,.42) !important;
  color: rgba(0,194,255,.92) !important;

  background:
    linear-gradient(
      180deg,
      rgba(0,194,255,.09),
      rgba(0,194,255,.03)
    ) !important;

  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.03),
    0 0 0 1px rgba(0,194,255,.04);
}

.launch-action:hover {
  border-color: rgba(0,194,255,.72) !important;
  color: #6FE8FF !important;

  background:
    linear-gradient(
      180deg,
      rgba(0,194,255,.14),
      rgba(0,194,255,.05)
    ) !important;
}
       .seller-actions button:hover:not(.launch-action) {
  transform: translateY(-1px);
  border-color: rgba(255,196,0,.45);
  color: #FFC400;
}

        .danger-action:hover {
          border-color: rgba(229,62,62,.45) !important;
          color: #E53E3E !important;
        }

        .seller-placement-control {
  width: 132px;
  flex: 0 0 132px;
}
        
        .seller-meta-row {
  display: flex;
  align-items: center;
  justify-content: space-between;

  gap: 10px;

  margin-top: 1px;
  padding-top: 5px;

  border-top: 1px solid rgba(255,255,255,.045);
}

.seller-stats {
  display: flex;
  align-items: center;
  justify-content: flex-end;

  gap: 9px;

  min-width: 0;
  margin-left: auto;

  color: rgba(255,255,255,.38);

  font-size: 8.5px;
  font-weight: 850;

  white-space: nowrap;
}

.vehicle-face-one {
  padding: 9px 11px 10px;
}

.vehicle-face-one .card-board-zone {
  height: 100%;

  display: flex;
  flex-direction: column;

  cursor: grab;
}

.vehicle-identity-row {
  display: grid;
  grid-template-columns:
    minmax(0, 1fr)
    92px;

  align-items: end;
  gap: 8px;
}

.vehicle-field {
  display: block;
  min-width: 0;
}

.vehicle-field > span,
.vehicle-entity > span,
.vehicle-home-location > span {
  display: block;

  margin-bottom: 3px;

  color: rgba(255,255,255,.31);

  font-size: 6.5px;
  font-weight: 950;
  letter-spacing: .48px;
  line-height: 1;
  text-transform: uppercase;
}

.vehicle-field input {
  width: 100%;
  height: 22px;

  padding: 0 5px;

  border: 1px solid rgba(255,255,255,.105);
  border-radius: 4px;

  background: rgba(9,9,9,.82);
  color: rgba(255,255,255,.73);

  outline: none;

  font-size: 8.5px;
  font-weight: 850;
  line-height: 1;
  text-transform: uppercase;
}

.vehicle-field input:focus {
  border-color: rgba(255,196,0,.42);

  box-shadow:
    0 0 0 1px rgba(255,196,0,.08);
}

.vehicle-entity {
  min-width: 0;

  padding-bottom: 3px;

  text-align: right;
}

.vehicle-entity strong {
  display: block;

  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  color: rgba(255,255,255,.62);

  font-size: 8px;
  font-weight: 950;
  letter-spacing: .2px;
  text-transform: uppercase;
}

.vehicle-spec-row {
  display: grid;
  grid-template-columns:
    42px
    minmax(0, .85fr)
    minmax(0, 1fr)
    58px;

  gap: 5px;

  margin-top: 6px;
}

.vehicle-field-year input,
.vehicle-field-miles input {
  text-align: right;
}

.vehicle-current-block {
  min-height: 53px;

  margin-top: 7px;
  padding: 5px 8px;

  position: relative;

  border-top: 1px solid rgba(255,255,255,.05);
  border-bottom: 1px solid rgba(255,255,255,.05);

  background:
    linear-gradient(
      90deg,
      rgba(0,194,255,.035),
      transparent 72%
    );
}

.vehicle-current-label {
  position: absolute;
  right: 7px;
  top: 5px;

  color: rgba(0,194,255,.43);

  font-size: 6px;
  font-weight: 950;
  letter-spacing: .58px;
}

.vehicle-current-operator {
  display: block;

  margin: 0 42px 2px 0;

  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  color: rgba(255,255,255,.87);

  font-size: 12px;
  font-weight: 950;
  line-height: 1.08;
  letter-spacing: .1px;
  text-transform: uppercase;
}

.vehicle-current-relationship {
  display: flex;
  align-items: center;
  gap: 5px;

  color: rgba(255,255,255,.55);

  font-size: 7.5px;
  font-weight: 900;
  letter-spacing: .35px;
  text-transform: uppercase;
}

.vehicle-current-relationship i {
  color: rgba(255,255,255,.18);
  font-style: normal;
}

.vehicle-current-location {
  margin-top: 3px;

  color: rgba(255,196,0,.67);

  font-size: 7px;
  font-weight: 950;
  letter-spacing: .4px;
  text-transform: uppercase;
}

.vehicle-vin-row {
  margin-top: 6px;
}

.vehicle-field-vin input {
  letter-spacing: .45px;
}

.vehicle-value-location-row {
  display: grid;
  grid-template-columns:
    82px
    minmax(0, 1fr);

  align-items: end;
  gap: 8px;

  margin-top: 6px;
}

.vehicle-field-value input {
  text-align: right;
}

.vehicle-home-location {
  min-width: 0;
}

.vehicle-home-location .location-row {
  justify-content: flex-end;
}

.vehicle-home-location .city-input {
  width: 76px;
}

.vehicle-home-location .state-input {
  width: 27px;
}

.vehicle-bottom-row {
  display: grid;
  grid-template-columns:
    132px
    minmax(0, 1fr);

  align-items: center;
  gap: 7px;

  margin-top: auto;
  padding-top: 6px;

  border-top:
    1px solid rgba(255,255,255,.045);
}

.vehicle-placement-control {
  width: 132px;
  min-width: 132px;
}

.vehicle-actions {
  display: grid;
  grid-template-columns:
    repeat(3, minmax(0, 1fr));

  gap: 5px;
}

.vehicle-actions button {
  height: 24px;
  padding: 0 4px;

  border: 1px solid #343434;
  border-radius: 5px;

  background: #101010;
  color: rgba(255,255,255,.62);

  font-size: 7px;
  font-weight: 950;
  letter-spacing: .28px;

  cursor: pointer;
}

.vehicle-actions button:disabled {
  opacity: .28;
  cursor: default;
}

.vehicle-actions .save-action {
  border-color: rgba(0,194,255,.42);
  color: rgba(0,194,255,.92);

  background:
    rgba(0,194,255,.045);
}

.vehicle-actions .save-action:hover {
  border-color: rgba(0,194,255,.72);
  color: #6fe8ff;
}

.vehicle-actions .danger-action:hover {
  border-color: rgba(229,62,62,.45);
  color: #e53e3e;
}

               @media (max-width: 850px) {
          .card.seller-mode {
            min-height: 450px;
          }

          .seller-actions {
            grid-template-columns: 1fr 1fr;
          }

          .price-row {
            flex-wrap: wrap;
          }

          .meta {
            width: 100%;
          }

                   .location-input {
            width: 100%;
            text-align: left;
          }
        }
      `}</style>
    </div>
  );
}
