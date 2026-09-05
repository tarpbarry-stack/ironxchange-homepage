import { useEffect, useRef, useState } from "react";

export default function IXIImmutableScaledSurface({
  nativeWidth,
  nativeHeight,
  children,
  horizontalPadding = 16,
  className = ""
}) {
  const hostRef = useRef(null);
  const [availableWidth, setAvailableWidth] = useState(Number(nativeWidth) || 1);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;

    const sync = width => {
      const safeWidth = Math.max(1, Number(width) - Number(horizontalPadding || 0));
      setAvailableWidth(safeWidth);
    };

    sync(host.getBoundingClientRect().width);

    if (typeof ResizeObserver === "function") {
      const observer = new ResizeObserver(entries => {
        const entry = entries?.[0];
        const inlineSize = entry?.borderBoxSize?.[0]?.inlineSize ?? entry?.contentRect?.width;
        if (Number.isFinite(Number(inlineSize))) sync(Number(inlineSize));
      });
      observer.observe(host, { box: "border-box" });
      return () => observer.disconnect();
    }

    const onResize = () => sync(host.getBoundingClientRect().width);
    window.addEventListener("resize", onResize, { passive: true });
    return () => window.removeEventListener("resize", onResize);
  }, [horizontalPadding]);

  const width = Number(nativeWidth) || 1;
  const height = Number(nativeHeight) || 1;
  const scale = availableWidth / width;
  const renderedWidth = width * scale;
  const renderedHeight = height * scale;

  return (
    <div
      ref={hostRef}
      className={`ixi-immutable-surface-host ${className}`.trim()}
      data-native-width={width}
      data-native-height={height}
      data-ixi-scale={scale.toFixed(4)}
    >
      <div
        className="ixi-immutable-surface-frame"
        style={{ width: renderedWidth, height: renderedHeight }}
      >
        <div
          className="ixi-immutable-surface-plane"
          style={{
            width,
            height,
            transform: `scale(${scale})`
          }}
        >
          {children}
        </div>
      </div>

      <style jsx>{`
        .ixi-immutable-surface-host {
          box-sizing: border-box;
          width: 100%;
          min-width: 0;
          display: flex;
          justify-content: center;
          align-items: flex-start;
          overflow: visible;
        }

        .ixi-immutable-surface-frame {
          position: relative;
          flex: 0 0 auto;
          overflow: visible;
        }

        .ixi-immutable-surface-plane {
          position: absolute;
          top: 0;
          left: 0;
          transform-origin: top left;
          overflow: visible;
        }
      `}</style>

      <style jsx global>{`
        /*
         * IMMUTABLE AOS SURFACE FIREWALL
         * Mobile may scale the outer coordinate system, but it must not trigger
         * a second responsive redesign inside the canonical desktop card.
         */
        .ixi-immutable-surface-host .private-listing-card .location-input {
          text-align: right !important;
        }

        .ixi-immutable-surface-host .private-listing-card .city-input {
          width: 100% !important;
          min-width: 0 !important;
          text-align: right !important;
        }

        .ixi-immutable-surface-host .private-listing-card .state-input {
          width: 27px !important;
          min-width: 27px !important;
          max-width: 27px !important;
          padding-left: 3px !important;
          padding-right: 3px !important;
          text-align: center !important;
        }

        .ixi-immutable-surface-host .private-listing-card .price-row {
          flex-wrap: nowrap !important;
        }

        .ixi-immutable-surface-host .private-listing-card .meta {
          width: auto !important;
        }

        .ixi-immutable-surface-host .owned-private-runtime .private-listing-card .seller-actions {
          display: none !important;
        }
      `}</style>
    </div>
  );
}
