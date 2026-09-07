import {
  useEffect,
  useState
} from "react";

import {
  useDraggable
} from "@dnd-kit/core";

import IXIAosWorkspaceChildCard
  from "./workspace/IXIAosWorkspaceChildCard";

import IXIObjectDropTarget
  from "../ixi-chassis/IXIObjectDropTarget";

import IXIMachineRail
  from "../IXIMachineRail";

import IXICollectionThumbRail
  from "../ixi-object-system/IXICollectionThumbRail";

import {
  getCollectionDeckState,
  getNextCollectionFace,
  getPreviousCollectionFace,
  getFirstCollectionFace,
  getLastCollectionFace,
  getCollectionFaceForItemIndex
} from "../ixi-object-system/IXICollectionDeckEngine";

import {
  getListingId
} from "../../lib/listingFormatters";

import {
  formatAosContainerMoney,
  getAosObjectDisplayName,
  getAosObjectId,
  getAosObjectPrimaryImage,
  getSmartContainerPresentation
} from "./system-index/IXISystemIndexPresentationEngine";


function clean(value) {
  return String(
    value || ""
  ).trim();
}


function formatMoney(value) {
  return formatAosContainerMoney(value);
}

function getObjectId(
  object = {}
) {
  return (
    getAosObjectId(object) ||
    String(
      getListingId(object) || ""
    ).trim()
  );
}

function getObjectTitle(
  object = {}
) {
  return getAosObjectDisplayName(
    object
  );
}

function getObjectImage(
  object = {}
) {
  return getAosObjectPrimaryImage(
    object
  );
}


export default function IXISystemIndexCard({
  index,
  objectId,
  dragHandleProps,
  ixiState = {},
  ixiCardState = {},
  onIxiStateChange,
  saved = false,
  armedDestination,
  onSendFront,
  onSendBack,
  onCycleColor,
  onCycleOutline,
  onSendToArmedDestination,
  onExposeObject,
  onOpenConsole,
  onExposeContents,
  onGatherContents,
  onReturnContents,
  onAddObject,
  onSavePresentation,
  childCardMode = "object",
  loopChildDeck = false,
  workspaceDropPolicy = null,
  workspaceDropSurface = ""
}) {
  const [isDropAccepting, setIsDropAccepting] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  const id = String(
    objectId ||
    index?.objectId ||
    ""
  );

  const items = Array.isArray(index?.items)
    ? index.items
    : [];

  const dropTargetObject = {
    ...index,
    objectId: id,
    workspaceDropPolicy:
      workspaceDropPolicy ||
      index?.workspaceDropPolicy ||
      null
  };

  const boardColor = ixiState?.color || "none";
  const boardOutline = Number(ixiState?.outline ?? 1);
  const storedFace = Math.max(1, Number(ixiState?.face || 1));
  const lastChildFace = items.length
    ? getCollectionFaceForItemIndex(items.length - 1)
    : getFirstCollectionFace();
  const face =
    loopChildDeck && storedFace > lastChildFace
      ? getFirstCollectionFace()
      : storedFace;

  const {
    isIdentityFace,
    isEndDeckFace,
    activeItemIndex,
    activeItem
  } = getCollectionDeckState({
    face,
    items
  });

  const [previewItemIndex, setPreviewItemIndex] = useState(0);

  useEffect(() => {
    if (activeItemIndex >= 0) {
      setPreviewItemIndex(activeItemIndex);
    }
  }, [activeItemIndex]);

  useEffect(() => {
    if (!items.length) {
      setPreviewItemIndex(0);
      return;
    }

    setPreviewItemIndex(current =>
      Math.min(
        Math.max(current, 0),
        items.length - 1
      )
    );
  }, [items.length]);

  const previewItem = items[previewItemIndex] || null;

  const presentation = getSmartContainerPresentation({
    container: index || {},
    children: items,
    selectedChildIndex: previewItemIndex
  });

  const containerName =
    presentation.containerName ||
    index?.displayName ||
    index?.label ||
    "INDEX";

  const heroImage = presentation.heroImage || "";
  const childCount = presentation.directChildCount;
  const childLabel = presentation.directChildLabel || "CHILDREN";
  const valueApplicable = presentation.valueApplicable;
  const aggregateValue = presentation.aggregateValue;
  const previewTitle = presentation.selectedChildName || "";
  const previewPrimary =
    presentation.selectedChildPrimaryDescriptor || "";
  const previewSecondary =
    presentation.selectedChildSecondaryDescriptor || "";

  const thumbActiveIndex = isIdentityFace
    ? (items.length ? previewItemIndex : -1)
    : activeItemIndex;

  const activeItemId = activeItem
    ? getObjectId(activeItem)
    : "";

  const activeItemIxiState = activeItemId
    ? (ixiCardState[activeItemId] || {})
    : {};

  const {
    attributes: childDragAttributes,
    listeners: childDragListeners,
    setNodeRef: setChildDragNodeRef,
    isDragging: isChildDragging
  } = useDraggable({
    id: activeItemId || `${id}-inactive-child`,
    disabled:
      isIdentityFace ||
      isEndDeckFace ||
      !activeItemId,
    data: {
      type: "collection-child",
      objectId: activeItemId,
      sourceContainer: "system-index",
      sourceParentId: id,
      sourceParentType: "system-index",
      action: "expose"
    }
  });

  function setFace(nextFace) {
    if (!id) return;

    onIxiStateChange?.(
      id,
      {
        face: Number(nextFace || 1)
      }
    );
  }

  function goHome() {
    setFace(getFirstCollectionFace());
  }

  function goEnd() {
    setFace(
      loopChildDeck
        ? lastChildFace
        : getLastCollectionFace({ items })
    );
  }

  function goForward() {
    if (isIdentityFace && items.length) {
      setFace(
        getCollectionFaceForItemIndex(
          previewItemIndex
        )
      );
      return;
    }

    if (
      loopChildDeck &&
      activeItemIndex === items.length - 1
    ) {
      setFace(getFirstCollectionFace());
      return;
    }

    setFace(
      getNextCollectionFace({ face, items })
    );
  }

  function goBackward() {
    setFace(
      getPreviousCollectionFace({ face, items })
    );
  }

  function selectThumb(item, itemIndex) {
    if (isIdentityFace) {
      setPreviewItemIndex(itemIndex);
      return;
    }

    setFace(
      getCollectionFaceForItemIndex(itemIndex)
    );
  }

  function previewPrevious(event) {
    event?.preventDefault?.();
    event?.stopPropagation?.();

    if (!items.length) return;

    setPreviewItemIndex(current =>
      current <= 0
        ? items.length - 1
        : current - 1
    );
  }

  function previewNext(event) {
    event?.preventDefault?.();
    event?.stopPropagation?.();

    if (!items.length) return;

    setPreviewItemIndex(current =>
      current >= items.length - 1
        ? 0
        : current + 1
    );
  }

  function openConsole(event) {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    onOpenConsole?.(index);
  }

  function exposeContents(event) {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    onExposeContents?.(index);
  }

  function gatherContents(event) {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    onGatherContents?.(index);
  }

  function returnContents(event) {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    onReturnContents?.(index);
  }

  return (
    <section
      className={[
        "system-index-card",
        "card",
        isDropAccepting
          ? "ixi-container-drop-accepting"
          : "",
        `board-color-${boardColor || "none"}`,
        `board-outline-${boardOutline || 1}`
      ]
        .filter(Boolean)
        .join(" ")}
      {...(
        isIdentityFace
          ? dragHandleProps || {}
          : {}
      )}
    >
      <div className="system-index-face">
        <IXIObjectDropTarget
          targetObject={dropTargetObject}
          targetObjectId={id}
          targetSurface={workspaceDropSurface}
          className="system-index-drop-on-zone"
          onDropStateChange={({ accepting }) => {
            setIsDropAccepting(accepting);
          }}
        />

        {isIdentityFace ? (
          <div className="system-index-identity">
            <div className="index-topline">
              <div className="index-heading">
                <span>SYSTEM INDEX</span>
                <h3>{containerName}</h3>
              </div>

              <div className="index-top-actions">
                {typeof onAddObject === "function" ? (
                  <button
                    type="button"
                    className="index-add-button"
                    title="Add object to this Index"
                    onPointerDown={event => {
                      event.stopPropagation();
                    }}
                    onClick={event => {
                      event.preventDefault();
                      event.stopPropagation();
                      onAddObject(index);
                    }}
                  >
                    +
                  </button>
                ) : null}

                <button
                  type="button"
                  className="index-edit-button"
                  title="Edit Face 1 presentation"
                  onPointerDown={event => {
                    event.stopPropagation();
                  }}
                  onClick={event => {
                    event.preventDefault();
                    event.stopPropagation();
                    setMoreOpen(false);
                    onSavePresentation?.(
                      index,
                      { intent: "edit-face-1" }
                    );
                  }}
                >
                  EDIT
                </button>

                <div className="index-more-wrap">
                  <button
                    type="button"
                    className="index-more-button"
                    title="More"
                    aria-expanded={moreOpen}
                    onPointerDown={event => {
                      event.stopPropagation();
                    }}
                    onClick={event => {
                      event.preventDefault();
                      event.stopPropagation();
                      setMoreOpen(current => !current);
                    }}
                  >
                    ⋮
                  </button>

                  {moreOpen ? (
                    <div
                      className="index-more-menu"
                      onPointerDown={event => {
                        event.stopPropagation();
                      }}
                    >
                      <button
                        type="button"
                        onClick={event => {
                          event.preventDefault();
                          event.stopPropagation();
                          setMoreOpen(false);
                          openConsole(event);
                        }}
                      >
                        OPEN CONSOLE
                      </button>

                      <button
                        type="button"
                        onClick={event => {
                          event.preventDefault();
                          event.stopPropagation();
                          setMoreOpen(false);
                          onSavePresentation?.(
                            index,
                            { intent: "open-skin-library" }
                          );
                        }}
                      >
                        SKIN LIBRARY
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="index-preview">
              {previewItem ? (
                <>
                  <div className="preview-photo">
                    {heroImage ? (
                      <img
                        src={heroImage}
                        alt={containerName}
                        draggable={false}
                      />
                    ) : (
                      <div className="preview-photo-empty">
                        {containerName}
                      </div>
                    )}

                    <button
                      type="button"
                      className="preview-arrow preview-prev"
                      onPointerDown={event => {
                        event.preventDefault();
                        event.stopPropagation();
                      }}
                      onClick={previewPrevious}
                      aria-label="Previous child"
                    >
                      ‹
                    </button>

                    <button
                      type="button"
                      className="preview-arrow preview-next"
                      onPointerDown={event => {
                        event.preventDefault();
                        event.stopPropagation();
                      }}
                      onClick={previewNext}
                      aria-label="Next child"
                    >
                      ›
                    </button>

                    <div className="preview-position">
                      {previewItemIndex + 1} / {items.length}
                    </div>
                  </div>

                  <div className="preview-info">
                    <div className="preview-copy">
                      <strong>{previewTitle}</strong>

                      <div className="preview-meta">
                        {previewPrimary ? (
                          <span>{previewPrimary}</span>
                        ) : null}

                        {previewSecondary ? (
                          <span>{previewSecondary}</span>
                        ) : null}
                      </div>
                    </div>

                    <button
                      type="button"
                      className="preview-out"
                      title="Put this child on Board"
                      onPointerDown={event => {
                        event.preventDefault();
                        event.stopPropagation();
                      }}
                      onClick={event => {
                        event.preventDefault();
                        event.stopPropagation();
                        if (!previewItem) return;
                        onExposeObject?.(
                          previewItem,
                          index
                        );
                      }}
                    >
                      OUT ↗
                    </button>
                  </div>
                </>
              ) : (
                <div className="index-empty">
                  <span>EMPTY</span>
                  <strong>{containerName}</strong>
                </div>
              )}
            </div>

            <div className="index-snapshot">
              <div className="index-stat">
                <span>{childLabel}</span>
                <strong>{childCount}</strong>
              </div>

              {valueApplicable ? (
                <div className="index-stat">
                  <span>VALUE</span>
                  <strong>
                    {formatMoney(aggregateValue)}
                  </strong>
                </div>
              ) : null}
            </div>

            <div className="system-index-command-strip">
              <button
                type="button"
                onPointerDown={event => {
                  event.stopPropagation();
                }}
                onClick={gatherContents}
                title="Recall direct children"
              >
                <span className="command-icon">↻</span>
                <span>RECALL</span>
              </button>

              <button
                type="button"
                onPointerDown={event => {
                  event.stopPropagation();
                }}
                onClick={exposeContents}
                title="Put direct children on Board"
              >
                <span className="command-icon">▦</span>
                <span>BOARD</span>
              </button>

              <button
                type="button"
                onPointerDown={event => {
                  event.stopPropagation();
                }}
                onClick={returnContents}
                title="Restore previous workspace arrangement"
              >
                <span className="command-icon">↩</span>
                <span>RETURN</span>
              </button>
            </div>
          </div>
        ) : activeItem ? (
          <div
            ref={setChildDragNodeRef}
            className={`system-index-child ${
              isChildDragging
                ? "is-dragging"
                : ""
            }`}
            {...childDragAttributes}
            {...childDragListeners}
          >
            <IXIAosWorkspaceChildCard
              key={getObjectId(activeItem)}
              object={activeItem}
              parentLabel={containerName}
              ixiState={activeItemIxiState}
              ixiCardState={ixiCardState}
              onIxiStateChange={onIxiStateChange}
              forceMachineCard={childCardMode === "machine"}
            />
          </div>
        ) : (
          <div className="system-index-end">
            <span>END DECK</span>
            <strong>{items.length}</strong>
            <p>OBJECTS REVIEWED</p>

            <button
              type="button"
              onPointerDown={event =>
                event.stopPropagation()
              }
              onClick={openConsole}
            >
              OPEN INDEX
            </button>
          </div>
        )}
      </div>

      <div className="system-index-thumb-shell">
        <IXICollectionThumbRail
          items={items}
          activeItemIndex={thumbActiveIndex}
          getItemId={item => getObjectId(item)}
          getItemImage={getObjectImage}
          getItemLabel={getObjectTitle}
          onSelectItem={selectThumb}
        />
      </div>

      <IXIMachineRail
        listing={index}
        saved={saved}
        boardColor={boardColor}
        boardOutline={boardOutline}
        machineFace={face}
        railMode={
          isIdentityFace
            ? "next-lit"
            : "home-lit next-lit prev-lit end-lit"
        }
        onCycleMachineFace={goForward}
        onRailSend={goBackward}
        onSendFront={
          isIdentityFace
            ? onSendFront
            : goHome
        }
        onSendBack={
          isIdentityFace
            ? onSendBack
            : goEnd
        }
        onCycleColor={onCycleColor}
        onCycleOutline={onCycleOutline}
        armedDestination={armedDestination}
        onSendToArmedDestination={() => {
          if (!activeItem) return;
          onSendToArmedDestination?.(activeItem);
          onExposeObject?.(activeItem, index);
        }}
      />

      <style jsx>{`
        .system-index-card,
        .system-index-card * {
          box-sizing: border-box;
        }

        .system-index-card {
          position: relative;
          width: 298px;
          min-width: 298px;
          max-width: 298px;
          height: 471px;
          min-height: 471px;
          max-height: 471px;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,.08);
          outline: 1px solid rgba(255,255,255,.018);
          outline-offset: 0;
          border-radius: 14px;
          background:
            linear-gradient(180deg,rgba(255,255,255,.035),rgba(255,255,255,.006)),
            radial-gradient(circle at top left,rgba(255,196,0,.055),transparent 55%),
            #101010;
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,.04),
            0 18px 34px rgba(0,0,0,.42);
          cursor: grab;
        }

        .system-index-card.board-outline-1 { outline-width: 1px; }
        .system-index-card.board-outline-3 { outline-width: 3px; }
        .system-index-card.board-outline-5 { outline-width: 5px; }
        .system-index-card.board-outline-0 { outline-width: 0; }
        .system-index-card.board-color-none { outline-color: rgba(255,255,255,.018); }
        .system-index-card.board-color-green { outline-color: rgba(56,161,105,.95); }
        .system-index-card.board-color-yellow { outline-color: rgba(255,196,0,.95); }
        .system-index-card.board-color-red { outline-color: rgba(229,62,62,.95); }
        .system-index-card.board-color-cyan { outline-color: rgba(0,194,255,.95); }
        .system-index-card.board-color-white { outline-color: rgba(255,255,255,.85); }
        .system-index-card.board-color-blue { outline-color: rgba(49,130,206,.95); }
        .system-index-card.board-color-orange { outline-color: rgba(249,133,18,.95); }

        .system-index-face {
          position: absolute;
          left: 0;
          right: 0;
          top: 0;
          bottom: 80px;
          overflow: hidden;
        }

        .system-index-identity {
          width: 100%;
          height: 100%;
          padding: 12px 12px 8px;
          display: flex;
          flex-direction: column;
          min-height: 0;
        }

        .index-topline {
          height: 38px;
          min-height: 38px;
          position: relative;
          display: flex;
          align-items: flex-start;
          border-bottom: 1px solid rgba(255,255,255,.045);
        }

        .index-top-actions {
          margin-left: auto;
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .index-add-button {
          width: 20px;
          height: 20px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          border: 1px solid rgba(255,255,255,.10);
          border-radius: 4px;
          background: rgba(255,255,255,.025);
          color: rgba(255,255,255,.52);
          font-size: 15px;
          font-weight: 900;
          line-height: 1;
          cursor: pointer;
          position: relative;
          z-index: 100;
        }

        .index-add-button:hover {
          color: #ffc400;
          border-color: rgba(255,196,0,.38);
          background: rgba(255,196,0,.06);
          box-shadow: 0 0 8px rgba(255,196,0,.10);
        }

        .index-edit-button,
        .index-more-button {
          height: 20px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0 5px;
          border: 1px solid rgba(255,255,255,.10);
          border-radius: 4px;
          background: rgba(255,255,255,.025);
          color: rgba(255,255,255,.56);
          font-size: 7.5px;
          font-weight: 950;
          line-height: 1;
          cursor: pointer;
          position: relative;
          z-index: 100;
        }

        .index-more-button {
          width: 20px;
          padding: 0;
          font-size: 15px;
        }

        .index-edit-button:hover,
        .index-more-button:hover {
          color: #ffc400;
          border-color: rgba(255,196,0,.38);
          background: rgba(255,196,0,.06);
        }

        .index-heading { min-width: 0; }

        .index-heading span {
          display: block;
          color: #ffc400;
          font-size: 6.5px;
          font-weight: 950;
          letter-spacing: .09em;
          text-transform: uppercase;
        }

        .index-heading h3 {
          margin: 4px 0 0;
          max-width: 220px;
          overflow: hidden;
          color: #f4f4f4;
          font-size: 17px;
          font-weight: 950;
          line-height: 1;
          text-overflow: ellipsis;
          white-space: nowrap;
          text-transform: uppercase;
        }

        .index-preview {
          height: 184px;
          min-height: 184px;
          margin-top: 8px;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,.055);
          border-radius: 8px;
          background: rgba(7,7,7,.78);
        }

        .preview-photo {
          position: relative;
          width: 100%;
          height: 141px;
          overflow: hidden;
          background: #090909;
        }

        .preview-photo img {
          width: 100%;
          height: 100%;
          display: block;
          object-fit: cover;
        }

        .preview-photo-empty {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(255,255,255,.12);
          font-size: 10px;
          font-weight: 950;
          letter-spacing: .08em;
        }

        .preview-position {
          position: absolute;
          right: 7px;
          top: 7px;
          height: 17px;
          padding: 0 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(255,255,255,.12);
          border-radius: 999px;
          background: rgba(0,0,0,.58);
          color: rgba(255,255,255,.72);
          font-size: 8px;
          font-weight: 950;
        }

        .preview-info {
          height: 43px;
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 0 8px;
          background:
            linear-gradient(180deg,rgba(255,255,255,.018),transparent),
            #101010;
        }

        .preview-out {
          flex: 0 0 auto;
          border: 0;
          background: transparent;
          padding: 4px 0 4px 6px;
          color: rgba(0,194,255,.70);
          font-size: 8px;
          font-weight: 950;
          letter-spacing: .04em;
          cursor: pointer;
        }

        .preview-out:hover { color: rgba(0,194,255,1); }
        .preview-copy { min-width: 0; flex: 1 1 auto; padding: 0; }

        .preview-copy strong {
          display: block;
          overflow: hidden;
          color: rgba(255,255,255,.82);
          font-size: 11px;
          font-weight: 950;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .preview-meta {
          margin-top: 4px;
          display: flex;
          align-items: center;
          gap: 8px;
          overflow: hidden;
        }

        .preview-meta span {
          overflow: hidden;
          color: rgba(255,255,255,.30);
          font-size: 8px;
          font-weight: 900;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .preview-arrow {
          position: absolute;
          top: 92%;
          width: 22px;
          height: 92px;
          transform: translateY(-50%);
          border: none;
          background: rgba(0,0,0,.06);
          color: rgba(255,255,255,.42);
          font-size: 28px;
          font-weight: 300;
          cursor: pointer;
          z-index: 5;
          opacity: 0;
          transition: opacity .18s ease,background .18s ease,color .18s ease;
        }

        .system-index-card:hover .preview-arrow { opacity: 1; }
        .preview-prev { left: 0; border-radius: 0 10px 10px 0; }
        .preview-next { right: 0; border-radius: 10px 0 0 10px; }
        .preview-arrow:hover { background: rgba(0,0,0,.14); color: rgba(255,255,255,.68); }

        .index-snapshot {
          display: flex;
          align-items: stretch;
          gap: 6px;
          margin-top: 8px;
        }

        .index-stat {
          min-width: 82px;
          height: 34px;
          padding: 5px 8px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          border: 1px solid rgba(255,255,255,.055);
          border-radius: 5px;
          background: rgba(255,255,255,.018);
        }

        .index-stat span {
          color: rgba(255,255,255,.34);
          font-size: 8px;
          font-weight: 900;
          letter-spacing: .55px;
        }

        .index-stat strong {
          margin-top: 2px;
          color: rgba(255,255,255,.84);
          font-size: 11px;
          font-weight: 950;
          line-height: 1;
        }

        .system-index-command-strip {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          height: 27px;
          display: grid;
          grid-template-columns: repeat(3,1fr);
          border-top: 1px solid rgba(255,255,255,.045);
          border-bottom: 1px solid rgba(0,194,255,.10);
          background: rgba(10,10,10,.96);
          z-index: 31;
        }

        .system-index-command-strip button {
          min-width: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          padding: 0 4px;
          border: 0;
          border-right: 1px solid rgba(255,255,255,.045);
          background: transparent;
          color: rgba(255,255,255,.56);
          font-size: 8px;
          font-weight: 950;
          letter-spacing: .04em;
          cursor: pointer;
        }

        .system-index-command-strip button:last-child { border-right: 0; }
        .system-index-command-strip button:hover { background: rgba(0,194,255,.045); color: rgba(255,255,255,.92); }
        .system-index-command-strip .command-icon { color: rgba(0,194,255,.82); font-size: 12px; font-weight: 950; }

        .index-more-wrap { position: relative; z-index: 140; }

        .index-more-menu {
          position: absolute;
          top: 24px;
          right: 0;
          width: 104px;
          padding: 4px;
          display: grid;
          gap: 3px;
          border: 1px solid rgba(255,255,255,.10);
          border-radius: 6px;
          background: rgba(12,12,12,.98);
          box-shadow: 0 10px 24px rgba(0,0,0,.52);
          z-index: 300;
        }

        .index-more-menu button {
          width: 100%;
          height: 25px;
          padding: 0 7px;
          border: 1px solid transparent;
          border-radius: 4px;
          background: transparent;
          color: rgba(255,255,255,.62);
          font-size: 7.5px;
          font-weight: 950;
          text-align: left;
          cursor: pointer;
        }

        .index-more-menu button:hover {
          border-color: rgba(0,194,255,.18);
          background: rgba(0,194,255,.045);
          color: rgba(255,255,255,.94);
        }

        .index-empty {
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 7px;
        }

        .index-empty span { color: rgba(255,196,0,.52); font-size: 9px; font-weight: 950; }
        .index-empty strong { color: rgba(255,255,255,.20); font-size: 12px; font-weight: 950; }

        .system-index-child {
          width: 100%;
          height: 100%;
          overflow: hidden;
          cursor: grab;
          touch-action: none;
        }

        .system-index-child.is-dragging { opacity: .42; }

        .system-index-child :global(.card) {
          width: 100% !important;
          max-width: none !important;
          height: 100% !important;
          min-height: 100% !important;
          border-radius: 13px 13px 0 0 !important;
        }

        .system-index-end {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background:
            radial-gradient(circle at center,rgba(255,196,0,.08),transparent 55%),
            #101010;
          text-align: center;
        }

        .system-index-end span { color: #ffc400; font-size: 9px; font-weight: 950; letter-spacing: .12em; }
        .system-index-end strong { color: #f4f4f4; font-size: 42px; font-weight: 950; line-height: 1; }
        .system-index-end p { margin: 0; color: rgba(255,255,255,.34); font-size: 9px; font-weight: 950; letter-spacing: .08em; }

        .system-index-end button {
          margin-top: 8px;
          height: 25px;
          padding: 0 10px;
          border: 1px solid rgba(255,196,0,.18);
          border-radius: 5px;
          background: rgba(255,196,0,.04);
          color: rgba(255,196,0,.62);
          font-size: 8px;
          font-weight: 950;
          cursor: pointer;
        }

        .system-index-end button:hover { color: #ffc400; border-color: rgba(255,196,0,.42); }

        .system-index-thumb-shell {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 16px;
          height: 64px;
          overflow: hidden;
          z-index: 25;
        }

        :global(.system-index-drop-on-zone) {
          position: absolute;
          left: 4%;
          right: 4%;
          top: 8%;
          bottom: 8%;
          z-index: 18;
          pointer-events: none;
          background: transparent;
        }

        .system-index-card.ixi-container-drop-accepting {
          border-color: rgba(255,196,0,.92);
          outline: 1px solid rgba(255,196,0,.36);
          box-shadow:
            0 0 0 1px rgba(255,196,0,.20),
            0 0 18px rgba(255,196,0,.24),
            0 0 36px rgba(255,196,0,.10),
            inset 0 0 18px rgba(255,196,0,.035),
            inset 0 1px 0 rgba(255,255,255,.05);
        }

        :global(.system-index-thumb-shell .ixi-collection-thumb-rail) {
          height: 64px;
        }
      `}</style>
    </section>
  );
}
