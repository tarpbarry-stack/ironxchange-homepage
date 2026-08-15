import {
  useMemo
} from "react";

import IXICollectionThumbRail
  from "../../../ixi-object-system/IXICollectionThumbRail";

import {
  getAosObjectDisplayName,
  getAosObjectId,
  getAosObjectPrimaryImage,
  getSmartContainerPresentation
} from "../../../ixi-mos/system-index/IXISystemIndexPresentationEngine";


function clean(value) {
  return String(value || "").trim();
}


export default function IXIAosContainerViewer({
  container = {},
  objects = [],
  selectedIndex = 0,
  onSelectedIndexChange = null,
  onExposeObject = null
}) {
  const children =
    useMemo(
      () => {
        const containerId =
          String(
            container?.objectId ||
            container?.id ||
            ""
          );

        return Array.isArray(objects)
          ? objects.filter(child =>
              String(
                child?.directContainerId ||
                ""
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
    presentation?.selectedChild || null;

  const selectedChildIndex =
    Number(
      presentation?.selectedChildIndex || 0
    );

  const itemCount = children.length;

  function setIndex(nextIndex) {
    if (!itemCount) {
      return;
    }

    const normalized =
      ((nextIndex % itemCount) +
        itemCount) % itemCount;

    onSelectedIndexChange?.(normalized);
  }

  function previous(event) {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    setIndex(selectedChildIndex - 1);
  }

  function next(event) {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    setIndex(selectedChildIndex + 1);
  }

  if (!selectedChild) {
    return (
      <div className="ixi-aos-container-viewer empty">
        <strong>EMPTY</strong>
        <span>NO OBJECTS</span>

        <style jsx>{`
          .ixi-aos-container-viewer {
            width: 100%;
            height: 84px;
            min-height: 84px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 4px;
            border: 1px solid rgba(255,255,255,.055);
            border-radius: 6px;
            background: rgba(7,7,7,.78);
          }

          strong {
            color: rgba(255,196,0,.48);
            font-size: 8px;
            font-weight: 950;
          }

          span {
            color: rgba(255,255,255,.18);
            font-size: 6px;
            font-weight: 900;
          }
        `}</style>
      </div>
    );
  }

  const imageUrl =
    clean(
      presentation?.heroImage ||
      getAosObjectPrimaryImage(selectedChild)
    );

  const title =
    clean(
      presentation?.selectedChildName ||
      getAosObjectDisplayName(selectedChild)
    );

  const primary =
    clean(
      presentation
        ?.selectedChildPrimaryDescriptor
    );

  const secondary =
    clean(
      presentation
        ?.selectedChildSecondaryDescriptor
    );

  return (
    <div className="ixi-aos-container-viewer">
      <div className="viewer-stage">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            draggable={false}
          />
        ) : (
          <div className="viewer-no-media">
            NO MEDIA
          </div>
        )}

        {itemCount > 1 ? (
          <>
            <button
              type="button"
              className="viewer-arrow previous"
              onPointerDown={event =>
                event.stopPropagation()
              }
              onClick={previous}
              aria-label="Previous object"
            >
              ‹
            </button>

            <button
              type="button"
              className="viewer-arrow next"
              onPointerDown={event =>
                event.stopPropagation()
              }
              onClick={next}
              aria-label="Next object"
            >
              ›
            </button>
          </>
        ) : null}

        <span className="viewer-position">
          {selectedChildIndex + 1}/{itemCount}
        </span>
      </div>

      <div className="viewer-info">
        <div className="viewer-copy">
          <strong>{title}</strong>

          {(primary || secondary) ? (
            <span>
              {[primary, secondary]
                .filter(Boolean)
                .join(" • ")}
            </span>
          ) : null}
        </div>

        {typeof onExposeObject ===
        "function" ? (
          <button
            type="button"
            className="viewer-out"
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
      </div>

      <div className="viewer-thumbs">
        <IXICollectionThumbRail
          items={children}
          activeItemIndex={selectedChildIndex}
          getItemId={item =>
            getAosObjectId(item)
          }
          getItemImage={item =>
            getAosObjectPrimaryImage(item)
          }
          getItemLabel={item =>
            getAosObjectDisplayName(item)
          }
          onSelectItem={(item, itemIndex) =>
            onSelectedIndexChange?.(itemIndex)
          }
        />
      </div>

      <style jsx>{`
        .ixi-aos-container-viewer,
        .ixi-aos-container-viewer * {
          box-sizing: border-box;
        }

        .ixi-aos-container-viewer {
          width: 100%;
          min-width: 0;
          height: 84px;
          min-height: 84px;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,.055);
          border-radius: 6px;
          background: rgba(7,7,7,.78);
        }

        .viewer-stage {
          position: relative;
          width: 100%;
          height: 38px;
          overflow: hidden;
          background: var(--ixi-skin-media-surface, #090909);
        }

        .viewer-stage img {
          width: 100%;
          height: 100%;
          display: block;
          object-fit: cover;
        }

        .viewer-no-media {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(255,255,255,.13);
          font-size: 6px;
          font-weight: 950;
          letter-spacing: .08em;
        }

        .viewer-position {
          position: absolute;
          top: 4px;
          right: 5px;
          min-width: 28px;
          height: 14px;
          padding: 0 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(255,255,255,.12);
          border-radius: 999px;
          background: rgba(0,0,0,.60);
          color: rgba(255,255,255,.72);
          font-size: 6px;
          font-weight: 950;
        }

        .viewer-arrow {
          position: absolute;
          top: 50%;
          width: 18px;
          height: 32px;
          transform: translateY(-50%);
          border: 0;
          background: rgba(0,0,0,.12);
          color: rgba(255,255,255,.48);
          font-size: 19px;
          cursor: pointer;
          opacity: 0;
          transition: opacity .16s ease;
        }

        .viewer-stage:hover .viewer-arrow {
          opacity: 1;
        }

        .viewer-arrow.previous {
          left: 0;
        }

        .viewer-arrow.next {
          right: 0;
        }

        .viewer-info {
          height: 22px;
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 0 6px;
          border-top: 1px solid rgba(255,255,255,.04);
          background: #101010;
        }

        .viewer-copy {
          flex: 1 1 auto;
          min-width: 0;
        }

        .viewer-copy strong,
        .viewer-copy span {
          display: block;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .viewer-copy strong {
          color: rgba(255,255,255,.84);
          font-size: 7px;
          font-weight: 950;
        }

        .viewer-copy span {
          margin-top: 1px;
          color: rgba(255,255,255,.30);
          font-size: 5.5px;
          font-weight: 900;
        }

        .viewer-out {
          flex: none;
          border: 0;
          background: transparent;
          color: var(--ixi-skin-interactive, rgba(0,194,255,.72));
          font-size: 6px;
          font-weight: 950;
          cursor: pointer;
        }

        .viewer-thumbs {
          height: 24px;
          overflow: hidden;
          border-top: 1px solid rgba(255,255,255,.04);
        }

        :global(
          .viewer-thumbs
          .ixi-collection-thumb-rail
        ) {
          height: 24px;
        }
      `}</style>
    </div>
  );
}
