import { useEffect, useRef, useState } from "react";
import { IXIMobileCardContext, useIXIMobileCards } from "../ixi-mobile/IXIMobileCardContext";
import { getMobileAssemblyGeometry } from "../../lib/ixiMobileCardGeometry";

import {
  getIXIObjectFootprint
} from "../../lib/ixiObjectGeometry";

export default function IXIScaledCardShell({
  size = "xl",

  objectFamily = "default",

  nativeWidth,
  nativeHeight,
  mobileNativeWidth,

  slotCount = 1,
  seamOverlap = 1,

  className = "",

  children
}) {
  const mobile = useIXIMobileCards();
  const hostRef = useRef(null);
  const planeRef = useRef(null);
  const [availableWidth, setAvailableWidth] = useState(1);
  const [measuredHeight, setMeasuredHeight] = useState(0);

  useEffect(() => {
    if (!mobile) return;
    const host = hostRef.current;
    const plane = planeRef.current;
    const sync = () => {
      setAvailableWidth(host.clientWidth || 1);
      setMeasuredHeight(plane.offsetHeight);
    };
    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(host);
    observer.observe(plane);
      return () => observer.disconnect();
  }, [mobile]);

  const footprint =
    getIXIObjectFootprint({
      scaleMode: size,
      objectFamily,

      nativeWidth,
      nativeHeight,

      slotCount,
      seamOverlap
    });

  const fitted = getMobileAssemblyGeometry({
    nativeWidth: mobileNativeWidth || footprint.nativeWidth,
    nativeHeight: footprint.nativeHeight,
    availableWidth,
    measuredHeight
  });
  const scale = mobile ? fitted.scale : footprint.scale;

  return (
    <div
      ref={hostRef}
      data-ixi-mobile-assembly={mobile ? "true" : undefined}
      className={[
        "ixi-scaled-object-shell",
        className
      ]
        .filter(Boolean)
        .join(" ")}
      style={{
        width:
          mobile ? "100%" : `${footprint.renderedWidth}px`,

        height:
          `${mobile ? fitted.renderedHeight : footprint.renderedHeight}px`,

        "--ixi-object-native-width":
          `${mobile ? fitted.width : footprint.nativeWidth}px`,

        "--ixi-object-native-height":
          `${footprint.nativeHeight}px`,

        "--ixi-object-scale":
          scale,
        "--ixi-mobile-inverse-scale": 1 / scale
      }}
      data-ixi-scale-mode={
        footprint.scaleMode
      }
      data-ixi-slot-count={
        footprint.slotCount
      }
    >
      <div
        ref={planeRef}
        className="ixi-scaled-object-inner"
      >
        <IXIMobileCardContext.Provider value={false}>{children}</IXIMobileCardContext.Provider>
      </div>

      <style jsx>{`
        .ixi-scaled-object-shell {
          position: relative;

          flex: 0 0 auto;

          min-width: 0;

          overflow: visible;
        }

        .ixi-scaled-object-inner {
          position: absolute;

          top: 0;
          left: 0;

          width:
            var(
              --ixi-object-native-width
            );

          height:
            var(
              --ixi-object-native-height
            );

          transform:
            scale(
              var(
                --ixi-object-scale
              )
            );

          transform-origin:
            top left;

          overflow: visible;
        }

        .ixi-scaled-object-shell[data-ixi-mobile-assembly="true"] {
          max-width: 100%;
          contain: inline-size;
          overflow-x: clip;
        }
        [data-ixi-mobile-assembly="true"] > .ixi-scaled-object-inner {
          height: auto;
          min-height: var(--ixi-object-native-height);
          left: 50%;
          transform: translateX(-50%) scale(var(--ixi-object-scale));
          transform-origin: top center;
        }
      `}</style>
      <style jsx global>{`
        /* Scope wrapping to opted-in mobile boards; native card internals stay intact. */
        [data-ixi-mobile-assembly="true"] :is(.ixi-marketplace-object-console, .ixi-private-object-console, .ixi-auction-object-console, .ixi-aos-object-console, .aos-numbered-object-console, .aos-generic-object-console, .ixi-system-index-object-console, .tx-console) {
          max-width: 100%;
          flex-wrap: wrap;
          height: auto;
          row-gap: 12px;
        }
        [data-ixi-mobile-assembly="true"] .ixi-private-object-console { width: 100% !important; }
        [data-ixi-mobile-assembly="true"] .ixi-private-console-listing-slot[data-transact-open="true"] {
          flex-basis: var(--ixi-mobile-transact-width);
          width: var(--ixi-mobile-transact-width);
          min-width: var(--ixi-mobile-transact-width);
          max-width: var(--ixi-mobile-transact-width);
          height: var(--ixi-mobile-transact-height);
          min-height: var(--ixi-mobile-transact-height);
          max-height: none;
        }
        [data-ixi-mobile-assembly="true"] .owned-private-runtime.transact-runtime {
          width: var(--ixi-mobile-transact-width, 298px);
          height: var(--ixi-mobile-transact-height, 471px);
        }
        [data-ixi-mobile-assembly="true"] .tx-console { row-gap: 0; }
        [data-ixi-mobile-assembly="true"] .ixi-aos-operating-card-runtime,
        [data-ixi-mobile-assembly="true"] .ixi-container-drop-target {
          width: 100%;
          height: auto;
          min-height: 475px;
          touch-action: pan-y pinch-zoom;
        }
      `}</style>
    </div>
  );
}
