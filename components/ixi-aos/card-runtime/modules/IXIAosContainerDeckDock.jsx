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

      <div className="deck-preview-header">
        <button
          type="button"
          className="deck-arrow"
          disabled={count < 2}
          onPointerDown={event =>
            event.stopPropagation()
          }
          onClick={previous}
          aria-label="Previous contained object"
        >
          ‹
        </button>

        <div className="deck-preview-copy">
          <strong>{title}</strong>
          {count ? (
            <span>
              {activeIndex + 1}/{count}
            </span>
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
          className="deck-arrow"
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
          height: 91px;
          z-index: 45;
          background: #0c0c0c;
        }

        .deck-preview-header {
          height: 20px;
          display: grid;
          grid-template-columns: 20px minmax(0,1fr) auto 20px;
          align-items: center;
          border-bottom: 1px solid rgba(255,255,255,.04);
          background: rgba(12,12,12,.98);
        }

        .deck-preview-copy {
          min-width: 0;
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 0 4px;
        }

        .deck-preview-copy strong {
          min-width: 0;
          overflow: hidden;
          color: rgba(255,255,255,.82);
          font-size: 7px;
          font-weight: 950;
          text-overflow: ellipsis;
          white-space: nowrap;
          text-transform: uppercase;
        }

        .deck-preview-copy span {
          flex: none;
          color: rgba(255,255,255,.30);
          font-size: 6px;
          font-weight: 900;
        }

        .deck-arrow,
        .deck-out {
          height: 20px;
          border: 0;
          background: transparent;
          cursor: pointer;
        }

        .deck-arrow {
          color: rgba(255,255,255,.48);
          font-size: 17px;
          line-height: 1;
        }

        .deck-arrow:disabled {
          opacity: .16;
          cursor: default;
        }

        .deck-out {
          padding: 0 5px;
          color: rgba(0,194,255,.78);
          font-size: 6.5px;
          font-weight: 950;
          letter-spacing: .04em;
        }

        .deck-thumb-shell {
          height: 44px;
          overflow: hidden;
        }

        :global(
          .deck-thumb-shell
          .ixi-collection-thumb-rail
        ) {
          height: 44px;
        }
      `}</style>
    </div>
  );
}
