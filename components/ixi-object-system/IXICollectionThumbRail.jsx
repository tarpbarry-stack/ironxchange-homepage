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
              item
            ) || "";

          const label =
            getItemLabel?.(
              item
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

              className={`ixi-collection-thumb ${
                active
                  ? "active"
                  : ""
              }`}

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
              {image ? (
                <img
                  src={image}
                  alt={label}
                  draggable={false}
                />
              ) : (
                <span>
                  {label}
                </span>
              )}
            </button>
          );
        }
      )}

      <style jsx>{`
        .ixi-collection-thumb-rail {
          width: 100%;
          height: 48px;

          display: flex;
          align-items: center;

          gap: 5px;

          padding: 5px 7px;

          overflow-x: auto;
          overflow-y: hidden;

          border-top:
            1px solid
            rgba(255,255,255,.045);

          background:
            linear-gradient(
              180deg,
              rgba(255,255,255,.018),
              rgba(255,255,255,0)
            ),
            rgba(8,8,8,.82);

          scrollbar-width: none;
        }

        .ixi-collection-thumb-rail::-webkit-scrollbar {
          display: none;
        }

        .ixi-collection-thumb {
          width: 49px;
          min-width: 49px;

          height: 35px;

          padding: 0;

          position: relative;

          overflow: hidden;

          border:
            1px solid
            rgba(255,255,255,.08);

          border-radius: 4px;

          background:
            rgba(255,255,255,.025);

          cursor: pointer;

          opacity: .68;

          transition:
            opacity .12s ease,
            border-color .12s ease,
            box-shadow .12s ease,
            transform .12s ease;
        }

        .ixi-collection-thumb:hover {
          opacity: 1;

          border-color:
            rgba(0,194,255,.42);

          transform:
            translateY(-1px);
        }

        .ixi-collection-thumb.active {
          opacity: 1;

          border-color:
            rgba(255,196,0,.70);

          box-shadow:
            0 0 8px
            rgba(255,196,0,.18);
        }

        .ixi-collection-thumb img {
          width: 100%;
          height: 100%;

          display: block;

          object-fit: cover;
        }

        .ixi-collection-thumb span {
          width: 100%;
          height: 100%;

          display: flex;
          align-items: center;
          justify-content: center;

          color:
            rgba(255,255,255,.42);

          font-size: 6.5px;
          font-weight: 950;
          letter-spacing: .35px;

          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      `}</style>
    </div>
  );
}
