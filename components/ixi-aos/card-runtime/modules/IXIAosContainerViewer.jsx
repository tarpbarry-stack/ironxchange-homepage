import {
  useMemo
} from "react";

import IXICollectionThumbRail
  from "../../../ixi-object-system/IXICollectionThumbRail";

import {
  getAosObjectDisplayName,
  getAosObjectId,
  getAosObjectPrimaryImage
} from "../../../ixi-mos/system-index/IXISystemIndexPresentationEngine";


export default function IXIAosContainerViewer({
  container = {},
  objects = [],
  selectedIndex = 0,
  onSelectedIndexChange = null
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


  const safeIndex =
    children.length
      ? Math.min(
          children.length - 1,
          Math.max(
            0,
            Number(selectedIndex || 0)
          )
        )
      : 0;


  return (
    <div className="ixi-aos-container-viewer">
      {children.length ? (
        <IXICollectionThumbRail
          items={children}
          activeItemIndex={safeIndex}
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
      ) : (
        <div className="viewer-empty">
          NO CONTAINED OBJECTS
        </div>
      )}

      <style jsx>{`
        .ixi-aos-container-viewer,
        .ixi-aos-container-viewer * {
          box-sizing: border-box;
        }

        .ixi-aos-container-viewer {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 2px;

          width: auto;
          height: 52px;
          min-height: 52px;

          overflow: hidden;

          border-top:
            1px solid
            rgba(255,255,255,.045);

          border-bottom:
            1px solid
            rgba(255,255,255,.045);

          background:
            rgba(7,7,7,.96);

          z-index: 40;
        }

        .viewer-empty {
          width: 100%;
          height: 100%;

          display: flex;
          align-items: center;
          justify-content: center;

          color:
            rgba(255,255,255,.16);

          font-size: 6px;
          font-weight: 900;

          letter-spacing: .05em;
        }

        :global(
          .ixi-aos-container-viewer
          .ixi-collection-thumb-rail
        ) {
          height: 52px;
          min-height: 52px;
        }
      `}</style>
    </div>
  );
}
