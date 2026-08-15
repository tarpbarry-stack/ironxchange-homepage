import {
  getAosObjectDisplayName,
  getAosObjectId,
  getAosObjectPrimaryImage,
  getSmartContainerPresentation,
  formatAosContainerMoney
} from "../../ixi-mos/system-index/IXISystemIndexPresentationEngine";

import IXICollectionThumbRail
  from "../../ixi-object-system/IXICollectionThumbRail";


export default function IXISmartContainerIdentityFace({
  container = {},
  children = [],

  selectedChildIndex = 0,
  onSelectedChildIndexChange,

  onExposeObject,

  onRecall,
  onBoard,
  onReturn,

  showHeader = false,

  eyebrow = "",
  title = "",

  onAddObject = null,
  onEdit = null,
  onMore = null
}) {
  const items =
    Array.isArray(children)
      ? children.filter(Boolean)
      : [];

  const presentation =
    getSmartContainerPresentation({
      container,
      children: items,
      selectedChildIndex
    });

  const selectedChild =
    presentation.selectedChild;

  const containerName =
    title ||
    presentation.containerName ||
    "OBJECT";

  const heroImage =
    presentation.heroImage || "";

  const childCount =
    presentation.directChildCount;

  const childLabel =
    presentation.directChildLabel ||
    "CHILDREN";

  const previewTitle =
    presentation.selectedChildName ||
    "";

  const previewPrimary =
    presentation
      .selectedChildPrimaryDescriptor ||
    "";

  const previewSecondary =
    presentation
      .selectedChildSecondaryDescriptor ||
    "";

  function previous(
    event
  ) {
    event?.preventDefault?.();
    event?.stopPropagation?.();

    if (!items.length) {
      return;
    }

    const next =
      selectedChildIndex <= 0
        ? items.length - 1
        : selectedChildIndex - 1;

    onSelectedChildIndexChange?.(
      next
    );
  }

  function next(
    event
  ) {
    event?.preventDefault?.();
    event?.stopPropagation?.();

    if (!items.length) {
      return;
    }

    const nextIndex =
      selectedChildIndex >=
      items.length - 1
        ? 0
        : selectedChildIndex + 1;

    onSelectedChildIndexChange?.(
      nextIndex
    );
  }

  return (
    <div className="ixi-smart-container-face">

      {showHeader ? (
        <div className="smart-topline">
          <div className="smart-heading">
            {eyebrow ? (
              <span>
                {eyebrow}
              </span>
            ) : null}

            <h3>
              {containerName}
            </h3>
          </div>

          <div className="smart-top-actions">
            {typeof onAddObject ===
            "function" ? (
              <button
                type="button"
                onClick={event => {
                  event.preventDefault();
                  event.stopPropagation();

                  onAddObject(
                    container
                  );
                }}
              >
                +
              </button>
            ) : null}

            {typeof onEdit ===
            "function" ? (
              <button
                type="button"
                className="text-action"
                onClick={event => {
                  event.preventDefault();
                  event.stopPropagation();

                  onEdit(
                    container
                  );
                }}
              >
                EDIT
              </button>
            ) : null}

            {typeof onMore ===
            "function" ? (
              <button
                type="button"
                onClick={event => {
                  event.preventDefault();
                  event.stopPropagation();

                  onMore(
                    container
                  );
                }}
              >
                ⋮
              </button>
            ) : null}
          </div>
        </div>
      ) : null}


      <div className="smart-preview">
        {selectedChild ? (
          <>
            <div className="smart-photo">
              {heroImage ? (
                <img
                  src={heroImage}
                  alt={previewTitle}
                  draggable={false}
                />
              ) : (
                <div className="smart-photo-empty">
                  {containerName}
                </div>
              )}

              <button
                type="button"
                className="smart-arrow smart-prev"
                onPointerDown={event => {
                  event.preventDefault();
                  event.stopPropagation();
                }}
                onClick={previous}
                aria-label="Previous child"
              >
                ‹
              </button>

              <button
                type="button"
                className="smart-arrow smart-next"
                onPointerDown={event => {
                  event.preventDefault();
                  event.stopPropagation();
                }}
                onClick={next}
                aria-label="Next child"
              >
                ›
              </button>

              <div className="smart-position">
                {presentation.selectedChildIndex + 1}
                {" / "}
                {items.length}
              </div>
            </div>

            <div className="smart-preview-info">
              <div className="smart-preview-copy">
                <strong>
                  {previewTitle}
                </strong>

                <div className="smart-preview-meta">
                  {previewPrimary ? (
                    <span>
                      {previewPrimary}
                    </span>
                  ) : null}

                  {previewSecondary ? (
                    <span>
                      {previewSecondary}
                    </span>
                  ) : null}
                </div>
              </div>

              {typeof onExposeObject ===
              "function" ? (
                <button
                  type="button"
                  className="smart-out"
                  onPointerDown={event => {
                    event.preventDefault();
                    event.stopPropagation();
                  }}
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
          </>
        ) : (
          <div className="smart-empty">
            <span>
              EMPTY
            </span>

            <strong>
              {containerName}
            </strong>
          </div>
        )}
      </div>


      <div className="smart-snapshot">
        <div className="smart-stat">
          <span>
            {childLabel}
          </span>

          <strong>
            {childCount}
          </strong>
        </div>

        {presentation.valueApplicable ? (
          <div className="smart-stat">
            <span>
              VALUE
            </span>

            <strong>
              {formatAosContainerMoney(
                presentation.aggregateValue
              )}
            </strong>
          </div>
        ) : null}
      </div>


      <div className="smart-command-strip">
        <button
          type="button"
          onClick={event => {
            event.preventDefault();
            event.stopPropagation();

            onRecall?.(
              container
            );
          }}
        >
          <span className="command-icon">
            ↻
          </span>

          <span>
            RECALL
          </span>
        </button>

        <button
          type="button"
          onClick={event => {
            event.preventDefault();
            event.stopPropagation();

            onBoard?.(
              container
            );
          }}
        >
          <span className="command-icon">
            ▦
          </span>

          <span>
            BOARD
          </span>
        </button>

        <button
          type="button"
          onClick={event => {
            event.preventDefault();
            event.stopPropagation();

            onReturn?.(
              container
            );
          }}
        >
          <span className="command-icon">
            ↩
          </span>

          <span>
            RETURN
          </span>
        </button>
      </div>


      <div className="smart-thumb-shell">
        <IXICollectionThumbRail
          items={
            items
          }

          activeItemIndex={
            presentation
              .selectedChildIndex
          }

          getItemId={item =>
            getAosObjectId(
              item
            )
          }

          getItemImage={item =>
            getAosObjectPrimaryImage(
              item
            )
          }

          getItemLabel={item =>
            getAosObjectDisplayName(
              item
            )
          }

          onSelectItem={(
            item,
            itemIndex
          ) => {
            onSelectedChildIndexChange?.(
              itemIndex
            );
          }}
        />
      </div>

      <style jsx>{`
        .ixi-smart-container-face,
        .ixi-smart-container-face * {
          box-sizing: border-box;
        }

        .ixi-smart-container-face {
          position: relative;

          width: 100%;
          height: 100%;

          min-height: 0;

          display: flex;
          flex-direction: column;
        }

        .smart-topline {
          height: 38px;
          min-height: 38px;

          display: flex;
          align-items: flex-start;

          border-bottom:
            1px solid
            var(
              --ixi-skin-divider,
              rgba(255,255,255,.045)
            );
        }

        .smart-heading {
          min-width: 0;
        }

        .smart-heading span {
          display: block;

          color:
            var(
              --ixi-skin-accent,
              #ffc400
            );

          font-size: 6.5px;
          font-weight: 950;

          letter-spacing: .09em;

          text-transform: uppercase;
        }

        .smart-heading h3 {
          margin: 4px 0 0;

          max-width: 220px;

          overflow: hidden;

          color:
            var(
              --ixi-skin-text-primary,
              #f4f4f4
            );

          font-size: 17px;
          font-weight: 950;

          line-height: 1;

          text-overflow: ellipsis;
          white-space: nowrap;

          text-transform: uppercase;
        }

        .smart-top-actions {
          margin-left: auto;

          display: flex;
          align-items: center;

          gap: 5px;
        }

        .smart-top-actions button {
          height: 20px;
          min-width: 20px;

          padding: 0 5px;

          border:
            1px solid
            rgba(255,255,255,.10);

          border-radius: 4px;

          background:
            rgba(255,255,255,.025);

          color:
            rgba(255,255,255,.56);

          font-size: 12px;
          font-weight: 950;

          cursor: pointer;

          position: relative;
          z-index: 100;
        }

        .smart-top-actions
        .text-action {
          font-size: 7.5px;
        }

        .smart-top-actions button:hover {
          color:
            var(
              --ixi-skin-accent,
              #ffc400
            );

          border-color:
            rgba(255,196,0,.38);

          background:
            rgba(255,196,0,.06);
        }


        /* ===============================================
           LARGE PREVIEW
           =============================================== */

        .smart-preview {
          height: 184px;
          min-height: 184px;

          margin-top: 8px;

          overflow: hidden;

          border:
            1px solid
            var(
              --ixi-skin-divider,
              rgba(255,255,255,.055)
            );

          border-radius: 8px;

          background:
            rgba(7,7,7,.78);
        }

        .smart-photo {
          position: relative;

          width: 100%;
          height: 141px;

          overflow: hidden;

          background:
            var(
              --ixi-skin-media-surface,
              #090909
            );
        }

        .smart-photo img {
          width: 100%;
          height: 100%;

          display: block;

          object-fit: cover;
        }

        .smart-photo-empty {
          width: 100%;
          height: 100%;

          display: flex;

          align-items: center;
          justify-content: center;

          color:
            var(
              --ixi-skin-text-muted,
              rgba(255,255,255,.12)
            );

          font-size: 10px;
          font-weight: 950;

          letter-spacing: .08em;
        }

        .smart-position {
          position: absolute;

          right: 7px;
          top: 7px;

          height: 17px;

          padding: 0 6px;

          display: flex;

          align-items: center;
          justify-content: center;

          border:
            1px solid
            rgba(255,255,255,.12);

          border-radius: 999px;

          background:
            rgba(0,0,0,.58);

          color:
            rgba(255,255,255,.72);

          font-size: 8px;
          font-weight: 950;
        }

        .smart-arrow {
          position: absolute;

          top: 50%;

          width: 22px;
          height: 92px;

          transform:
            translateY(-50%);

          border: 0;

          background:
            rgba(0,0,0,.06);

          color:
            rgba(255,255,255,.42);

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

        .smart-preview:hover
        .smart-arrow {
          opacity: 1;
        }

        .smart-prev {
          left: 0;

          border-radius:
            0 10px 10px 0;
        }

        .smart-next {
          right: 0;

          border-radius:
            10px 0 0 10px;
        }

        .smart-arrow:hover {
          background:
            rgba(0,0,0,.14);

          color:
            rgba(255,255,255,.68);
        }


        /* ===============================================
           PREVIEW INFO
           =============================================== */

        .smart-preview-info {
          height: 43px;

          display: flex;
          align-items: center;

          gap: 6px;

          padding: 0 8px;

          background:
            linear-gradient(
              180deg,
              rgba(255,255,255,.018),
              transparent
            ),
            #101010;
        }

        .smart-preview-copy {
          min-width: 0;

          flex: 1 1 auto;

          padding: 0;
        }

        .smart-preview-copy strong {
          display: block;

          overflow: hidden;

          color:
            var(
              --ixi-skin-text-primary,
              rgba(255,255,255,.82)
            );

          font-size: 11px;
          font-weight: 950;

          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .smart-preview-meta {
          margin-top: 4px;

          display: flex;

          align-items: center;

          gap: 8px;

          overflow: hidden;
        }

        .smart-preview-meta span {
          overflow: hidden;

          color:
            var(
              --ixi-skin-text-muted,
              rgba(255,255,255,.30)
            );

          font-size: 8px;
          font-weight: 900;

          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .smart-out {
          flex: 0 0 auto;

          border: 0;
          background: transparent;

          padding: 4px 0 4px 6px;

          color:
            var(
              --ixi-skin-interactive,
              rgba(0,194,255,.70)
            );

          font-size: 8px;
          font-weight: 950;

          letter-spacing: .04em;

          cursor: pointer;
        }

        .smart-out:hover {
          color:
            rgba(0,194,255,1);
        }


        /* ===============================================
           EMPTY
           =============================================== */

        .smart-empty {
          width: 100%;
          height: 100%;

          display: flex;

          flex-direction: column;

          align-items: center;
          justify-content: center;

          gap: 7px;
        }

        .smart-empty span {
          color:
            var(
              --ixi-skin-accent,
              rgba(255,196,0,.52)
            );

          font-size: 9px;
          font-weight: 950;

          letter-spacing: .08em;
        }

        .smart-empty strong {
          color:
            rgba(255,255,255,.20);

          font-size: 12px;
          font-weight: 950;
        }


        /* ===============================================
           SNAPSHOT
           =============================================== */

        .smart-snapshot {
          display: flex;

          align-items: stretch;

          gap: 6px;

          margin-top: 8px;
        }

        .smart-stat {
          min-width: 82px;

          height: 34px;

          padding: 5px 8px;

          display: flex;
          flex-direction: column;
          justify-content: center;

          border:
            1px solid
            var(
              --ixi-skin-divider,
              rgba(255,255,255,.055)
            );

          border-radius: 5px;

          background:
            rgba(255,255,255,.018);
        }

        .smart-stat span {
          color:
            var(
              --ixi-skin-text-muted,
              rgba(255,255,255,.34)
            );

          font-size: 8px;
          font-weight: 900;

          letter-spacing: .55px;
        }

        .smart-stat strong {
          margin-top: 2px;

          color:
            var(
              --ixi-skin-text-primary,
              rgba(255,255,255,.84)
            );

          font-size: 11px;
          font-weight: 950;

          line-height: 1;
        }


        /* ===============================================
           RECALL / BOARD / RETURN
           =============================================== */

        .smart-command-strip {
          height: 27px;
          min-height: 27px;

          margin-top: auto;

          display: grid;

          grid-template-columns:
            repeat(3, 1fr);

          border-top:
            1px solid
            var(
              --ixi-skin-divider,
              rgba(255,255,255,.045)
            );

          border-bottom:
            1px solid
            rgba(0,194,255,.10);

          background:
            rgba(10,10,10,.96);

          z-index: 31;
        }

        .smart-command-strip button {
          min-width: 0;

          display: flex;

          align-items: center;
          justify-content: center;

          gap: 5px;

          padding: 0 4px;

          border: 0;

          border-right:
            1px solid
            rgba(255,255,255,.045);

          background:
            transparent;

          color:
            rgba(255,255,255,.56);

          font-size: 8px;
          font-weight: 950;

          letter-spacing: .04em;

          cursor: pointer;
        }

        .smart-command-strip
        button:last-child {
          border-right: 0;
        }

        .smart-command-strip
        button:hover {
          background:
            rgba(0,194,255,.045);

          color:
            rgba(255,255,255,.92);
        }

        .smart-command-strip
        .command-icon {
          color:
            rgba(0,194,255,.82);

          font-size: 12px;
          font-weight: 950;
        }


        /* ===============================================
           THUMB FILMSTRIP
           =============================================== */

        .smart-thumb-shell {
          height: 64px;
          min-height: 64px;

          overflow: hidden;

          z-index: 25;
        }

        :global(
          .smart-thumb-shell
          .ixi-collection-thumb-rail
        ) {
          height: 64px;
        }
      `}</style>

    </div>
  );
}     
