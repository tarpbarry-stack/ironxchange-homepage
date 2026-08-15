import {
  useMemo
} from "react";

import IXICollectionThumbRail
  from "../../../ixi-object-system/IXICollectionThumbRail";

import IXIAosContainerCommandStrip
  from "./IXIAosContainerCommandStrip";

import {
  getAosObjectDisplayName,
  getAosObjectId,
  getAosObjectPrimaryImage,
  getSmartContainerPresentation
} from "../../../ixi-mos/system-index/IXISystemIndexPresentationEngine";


function clean(value) {
  return String(value || "").trim();
}


export default function IXIAosContainerDeckDock({
  container = {},
  objects = [],
  selectedIndex = 0,
  onSelectedIndexChange = null,
  onExposeObject = null,
  onRecall = null,
  onBoard = null,
  onReturn = null,
  bottom = 20
}) {
  const children =
    useMemo(
      () => {
        const containerId =
          clean(
            container?.objectId ||
            container?.id
          );

        return Array.isArray(objects)
          ? objects.filter(child =>
              clean(
                child?.directContainerId
              ) === containerId
            )
          : [];
      },
      [container, objects]
    );

  const presentation =
    getSmartContainerPresentation({
      container,
      children,
      selectedChildIndex:
        selectedIndex
    });

  const selectedChild =
    presentation?.selectedChild ||
    children[selectedIndex] ||
    null;

  const activeIndex =
    Math.max(
      0,
      Number(
        presentation?.selectedChildIndex ??
        selectedIndex ??
        0
      )
    );

  const count = children.length;

  function setIndex(nextIndex) {
    if (!count) {
      return;
    }

    const normalized =
      ((nextIndex % count) + count) % count;

    onSelectedIndexChange?.(
      normalized
    );
  }

  function previous(event) {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    setIndex(activeIndex - 1);
  }

  function next(event) {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    setIndex(activeIndex + 1);
  }

  const title =
    selectedChild
      ? clean(
          presentation?.selectedChildName ||
          getAosObjectDisplayName(selectedChild)
        )
      : "EMPTY";

  const primary =
    clean(
      presentation?.selectedChildPrimaryDescriptor
    );

  const secondary =
    clean(
      presentation?.selectedChildSecondaryDescriptor
    );

  const selectedImage =
    selectedChild
      ? clean(
          presentation?.heroImage ||
          getAosObjectPrimaryImage(selectedChild)
        )
      : "";

  return (
    <div
      className="ixi-aos-container-deck-dock"
      style={{
        bottom:
          `${Number(bottom) || 20}px`
      }}
    >
      <IXIAosContainerCommandStrip
        object={container}
        onRecall={onRecall}
        onBoard={onBoard}
        onReturn={onReturn}
      />

      <div className="deck-preview-row">
        <button
          type="button"
          className="deck-arrow deck-prev"
          disabled={count < 2}
          onPointerDown={event =>
            event.stopPropagation()
          }
          onClick={previous}
          aria-label="Previous contained object"
        >
          ‹
        </button>

        <div className="deck-selected-photo">
          {selectedImage ? (
            <img
              src={selectedImage}
              alt={title}
              draggable={false}
            />
          ) : (
            <div className="deck-photo-empty">
              {count ? "NO MEDIA" : "EMPTY"}
            </div>
          )}
        </div>

        <div className="deck-preview-copy">
          <div className="deck-title-line">
            <strong>{title}</strong>
            {count ? (
              <span>
                {activeIndex + 1}/{count}
              </span>
            ) : null}
          </div>

          {(primary || secondary) ? (
            <div className="deck-meta">
              {[primary, secondary]
                .filter(Boolean)
                .join(" • ")}
            </div>
          ) : null}
        </div>

        {selectedChild &&
        typeof onExposeObject ===
          "function" ? (
          <button
            type="button"
            className="deck-out"
            title="Put this object on Board"
            onPointerDown={event =>
              event.stopPropagation()
            }
            onClick={event => {
              event.preventDefault();
              event.stopPropagation();
              onExposeObject(
                selectedChild,
                container
              );
            }}
          >
            OUT ↗
          </button>
        ) : null}

        <button
          type="button"
          className="deck-arrow deck-next"
          disabled={count < 2}
          onPointerDown={event =>
            event.stopPropagation()
          }
          onClick={next}
          aria-label="Next contained object"
        >
          ›
        </button>
      </div>

      <div className="deck-thumb-shell">
        <IXICollectionThumbRail
          items={children}
          activeItemIndex={
            count ? activeIndex : -1
          }
          getItemId={item =>
            getAosObjectId(item)
          }
          getItemImage={item =>
            getAosObjectPrimaryImage(item)
          }
          getItemLabel={item =>
            getAosObjectDisplayName(item)
          }
          onSelectItem={(
            item,
            itemIndex
          ) =>
            onSelectedIndexChange?.(
              itemIndex
            )
          }
        />
      </div>

      <style jsx>{`
        .ixi-aos-container-deck-dock,
        .ixi-aos-container-deck-dock * {
          box-sizing: border-box;
        }

        .ixi-aos-container-deck-dock {
          position: absolute;
          left: 0;
          right: 0;
          height: 88px;
          overflow: hidden;
          z-index: 45;
          border-top: 1px solid rgba(255,255,255,.035);
          background: #0c0c0c;
          box-shadow: 0 -5px 14px rgba(0,0,0,.22);
        }

        .deck-preview-row {
          width: 100%;
          height: 29px;
          min-height: 29px;
          display: grid;
          grid-template-columns:
            18px 38px minmax(0,1fr) auto 18px;
          align-items: stretch;
          border-bottom: 1px solid rgba(255,255,255,.04);
          background:
            linear-gradient(
              180deg,
              rgba(255,255,255,.018),
              rgba(255,255,255,0)
            ),
            #0f0f0f;
        }

        .deck-selected-photo {
          width: 38px;
          height: 29px;
          overflow: hidden;
          border-left: 1px solid rgba(255,255,255,.035);
          border-right: 1px solid rgba(255,255,255,.045);
          background: #080808;
        }

        .deck-selected-photo img {
          width: 100%;
          height: 100%;
          display: block;
          object-fit: cover;
        }

        .deck-photo-empty {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(255,255,255,.14);
          font-size: 4.5px;
          font-weight: 950;
          letter-spacing: .04em;
        }

        .deck-preview-copy {
          min-width: 0;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 0 5px;
        }

        .deck-title-line {
          min-width: 0;
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .deck-title-line strong {
          min-width: 0;
          flex: 1 1 auto;
          overflow: hidden;
          color: rgba(255,255,255,.86);
          font-size: 6.5px;
          font-weight: 950;
          line-height: 1;
          text-overflow: ellipsis;
          white-space: nowrap;
          text-transform: uppercase;
        }

        .deck-title-line span {
          flex: none;
          color: rgba(255,255,255,.34);
          font-size: 5px;
          font-weight: 900;
        }

        .deck-meta {
          margin-top: 3px;
          overflow: hidden;
          color: rgba(255,255,255,.29);
          font-size: 4.7px;
          font-weight: 850;
          line-height: 1;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .deck-arrow,
        .deck-out {
          min-width: 0;
          height: 29px;
          border: 0;
          background: transparent;
          cursor: pointer;
        }

        .deck-arrow {
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(255,255,255,.50);
          font-size: 18px;
          font-weight: 300;
          line-height: 1;
        }

        .deck-prev {
          border-right: 1px solid rgba(255,255,255,.035);
        }

        .deck-next {
          border-left: 1px solid rgba(255,255,255,.035);
        }

        .deck-arrow:not(:disabled):hover {
          background: rgba(0,194,255,.045);
          color: rgba(255,255,255,.90);
        }

        .deck-arrow:disabled {
          opacity: .14;
          cursor: default;
        }

        .deck-out {
          padding: 0 6px;
          color: rgba(0,194,255,.80);
          font-size: 6px;
          font-weight: 950;
          letter-spacing: .04em;
          white-space: nowrap;
        }

        .deck-out:hover {
          color: rgba(0,194,255,1);
          background: rgba(0,194,255,.035);
        }

        .deck-thumb-shell {
          height: 32px;
          min-height: 32px;
          overflow: hidden;
          border-bottom: 1px solid rgba(255,255,255,.025);
        }

        :global(
          .deck-thumb-shell
          .ixi-collection-thumb-rail
        ) {
          height: 32px;
          min-height: 32px;
          max-height: 32px;
        }
      `}</style>
    </div>
  );
}
