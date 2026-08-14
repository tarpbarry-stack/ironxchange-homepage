import {
  useEffect,
  useRef
} from "react";

export default function IXICollectionThumbRail({
  items = [],
  activeItemIndex = -1,

  getItemId,
  getItemImage,
  getItemLabel,

  onSelectItem
}) {
  const railRef =
    useRef(null);

  const itemRefs =
    useRef({});

  useEffect(() => {
    if (
      activeItemIndex < 0
    ) {
      return;
    }

    const node =
      itemRefs.current[
        activeItemIndex
      ];

    if (!node) {
      return;
    }

    node.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest"
    });
  }, [activeItemIndex]);

  return (
    <div
      ref={railRef}
      className="ixi-collection-thumb-rail"
    >
      {items.map(
        (
          item,
          itemIndex
        ) => {
          const id =
            getItemId?.(
              item,
              itemIndex
            ) ||
            String(itemIndex);

          const image =
            getItemImage?.(
              item,
              itemIndex
            ) || "";

          const label =
            getItemLabel?.(
              item,
              itemIndex
            ) ||
            String(
              itemIndex + 1
            );

          const active =
            itemIndex ===
            activeItemIndex;

          return (
            <button
              key={id}

              ref={node => {
                if (node) {
                  itemRefs.current[
                    itemIndex
                  ] = node;
                }
              }}

              type="button"

              className={[
                "ixi-collection-thumb",

                active
                  ? "active"
                  : ""
              ]
                .filter(Boolean)
                .join(" ")}

              title={label}

              aria-label={
                `Preview ${label}`
              }

              aria-pressed={
                active
              }

              onPointerDown={
                event => {
                  event.preventDefault();
                  event.stopPropagation();
                }
              }

              onClick={event => {
                event.preventDefault();
                event.stopPropagation();

                onSelectItem?.(
                  item,
                  itemIndex
                );
              }}
            >
              <div className="ixi-thumb-image">
                {image ? (
                  <img
                    src={image}
                    alt=""
                    draggable={false}
                  />
                ) : (
                  <div className="ixi-thumb-empty">
                    <span>
                      {String(
                        label
                      )
                        .trim()
                        .slice(
                          0,
                          2
                        )
                        .toUpperCase()}
                    </span>
                  </div>
                )}

                <div className="ixi-thumb-position">
                  {itemIndex + 1}
                </div>
              </div>

              <div className="ixi-thumb-label">
                {label}
              </div>
            </button>
          );
        }
      )}

      <style jsx>{`
        .ixi-collection-thumb-rail,
        .ixi-collection-thumb-rail * {
          box-sizing: border-box;
        }

        .ixi-collection-thumb-rail {
          width: 100%;
          height: 64px;

          display: flex;
          align-items: stretch;

          gap: 6px;

          padding:
            5px 7px 6px;

          overflow-x: auto;
          overflow-y: hidden;

          overscroll-behavior-x:
            contain;

          scroll-behavior:
            smooth;

          border-top:
            1px solid
            var(
              --ixi-skin-divider,
              rgba(
                255,
                255,
                255,
                .055
              )
            );

          background:
            var(
              --ixi-skin-deck-background,
              linear-gradient(
                180deg,
                rgba(
                  255,
                  255,
                  255,
                  .025
                ),
                rgba(
                  255,
                  255,
                  255,
                  0
                )
              ),
              rgba(
                7,
                7,
                7,
                .96
              )
            );

          scrollbar-width:
            none;

          -webkit-overflow-scrolling:
            touch;
        }

        .ixi-collection-thumb-rail::-webkit-scrollbar {
          display: none;
        }

        .ixi-collection-thumb {
          width: 70px;
          min-width: 70px;

          height: 53px;

          padding: 0;

          position: relative;

          display: grid;

          grid-template-rows:
            minmax(0, 1fr)
            15px;

          overflow: hidden;

          border:
            1px solid
            var(
              --ixi-skin-thumb-border,
              rgba(
                255,
                255,
                255,
                .10
              )
            );

          border-radius:
            var(
              --ixi-skin-thumb-radius,
              5px
            );

          background:
            var(
              --ixi-skin-thumb-surface,
              rgba(
                255,
                255,
                255,
                .028
              )
            );

          color:
            var(
              --ixi-skin-text-primary,
              rgba(
                255,
                255,
                255,
                .86
              )
            );

          cursor: pointer;

          opacity: .76;

          transition:
            opacity .12s ease,
            border-color .12s ease,
            box-shadow .12s ease,
            transform .12s ease,
            background .12s ease;
        }

        .ixi-collection-thumb:hover {
          opacity: 1;

          border-color:
            var(
              --ixi-skin-interactive-border,
              rgba(
                0,
                194,
                255,
                .48
              )
            );

          background:
            var(
              --ixi-skin-thumb-hover-surface,
              rgba(
                255,
                255,
                255,
                .045
              )
            );

          transform:
            translateY(-1px);
        }

        .ixi-collection-thumb.active {
          opacity: 1;

          border-color:
            var(
              --ixi-skin-accent,
              rgba(
                255,
                196,
                0,
                .82
              )
            );

          box-shadow:
            0 0 0 1px
              var(
                --ixi-skin-accent-soft,
                rgba(
                  255,
                  196,
                  0,
                  .12
                )
              ),
            0 0 10px
              var(
                --ixi-skin-accent-glow,
                rgba(
                  255,
                  196,
                  0,
                  .18
                )
              );
        }

        .ixi-thumb-image {
          min-width: 0;
          min-height: 0;

          position: relative;

          overflow: hidden;

          background:
            var(
              --ixi-skin-media-surface,
              #090909
            );
        }

        .ixi-thumb-image img {
          width: 100%;
          height: 100%;

          display: block;

          object-fit: cover;
        }

        .ixi-thumb-empty {
          width: 100%;
          height: 100%;

          display: flex;
          align-items: center;
          justify-content: center;

          background:
            var(
              --ixi-skin-media-empty-surface,
              radial-gradient(
                circle
                  at center,
                rgba(
                  255,
                  196,
                  0,
                  .055
                ),
                transparent
                  70%
              ),
              #0b0b0b
            );
        }

        .ixi-thumb-empty span {
          color:
            var(
              --ixi-skin-text-muted,
              rgba(
                255,
                255,
                255,
                .28
              )
            );

          font-size: 10px;
          font-weight: 950;
          line-height: 1;

          letter-spacing:
            .06em;
        }

        .ixi-thumb-position {
          position: absolute;

          top: 3px;
          right: 3px;

          min-width: 13px;
          height: 13px;

          padding: 0 3px;

          display: flex;
          align-items: center;
          justify-content: center;

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              .14
            );

          border-radius:
            999px;

          background:
            rgba(
              0,
              0,
              0,
              .68
            );

          color:
            rgba(
              255,
              255,
              255,
              .76
            );

          font-size: 7px;
          font-weight: 950;
          line-height: 1;
        }

        .ixi-thumb-label {
          min-width: 0;

          height: 15px;

          padding:
            0 5px;

          display: flex;
          align-items: center;

          overflow: hidden;

          border-top:
            1px solid
            var(
              --ixi-skin-divider,
              rgba(
                255,
                255,
                255,
                .045
              )
            );

          background:
            var(
              --ixi-skin-thumb-label-surface,
              rgba(
                14,
                14,
                14,
                .98
              )
            );

          color:
            var(
              --ixi-skin-text-secondary,
              rgba(
                255,
                255,
                255,
                .62
              )
            );

          font-size: 7.5px;
          font-weight: 900;

          line-height: 1;

          text-overflow:
            ellipsis;

          white-space:
            nowrap;

          text-transform:
            uppercase;
        }

        .ixi-collection-thumb.active
        .ixi-thumb-label {
          color:
            var(
              --ixi-skin-text-primary,
              rgba(
                255,
                255,
                255,
                .92
              )
            );
        }
      `}</style>
    </div>
  );
}
