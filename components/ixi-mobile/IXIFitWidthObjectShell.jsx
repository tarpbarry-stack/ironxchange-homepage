import { useEffect, useRef, useState } from "react";

import { getIXIScalePreset } from "../../lib/ixiObjectGeometry";

const MOBILE_VIEWPORT_GUTTER = 12;
const MOBILE_MAX_VIEWPORT_WIDTH = 430;

function getViewportAvailableWidth() {
  if (typeof window === "undefined") {
    return (
      MOBILE_MAX_VIEWPORT_WIDTH -
      MOBILE_VIEWPORT_GUTTER
    );
  }

  const viewportWidth =
    Number(
      window.visualViewport?.width
    ) ||
    Number(
      document.documentElement
        ?.clientWidth
    ) ||
    MOBILE_MAX_VIEWPORT_WIDTH;

  return Math.max(
    1,
    viewportWidth -
      MOBILE_VIEWPORT_GUTTER
  );
}

export default function IXIFitWidthObjectShell({
  size = "xl",
  nativeWidth = 300,
  nativeHeight = 400,
  className = "",
  children
}) {
  const hostRef = useRef(null);
  const preset = getIXIScalePreset(size);
  const maximumScale = preset.scale;
  const width = Math.max(1, Number(nativeWidth) || 300);
  const height = Math.max(1, Number(nativeHeight) || 400);
  const [availableWidth, setAvailableWidth] = useState(
    () =>
      Math.min(
        width * maximumScale,
        MOBILE_MAX_VIEWPORT_WIDTH -
          MOBILE_VIEWPORT_GUTTER
      )
  );

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;

    const sync = measuredWidth => {
      const nextWidth = Number(measuredWidth);
      if (!Number.isFinite(nextWidth) || nextWidth <= 0) return;
      const viewportAvailableWidth =
        getViewportAvailableWidth();

      const containedWidth =
        Math.min(
          nextWidth,
          viewportAvailableWidth
        );

      setAvailableWidth(current =>
        Math.abs(
          current - containedWidth
        ) < 0.5
          ? current
          : containedWidth
      );
    };

    sync(host.getBoundingClientRect().width);

    if (typeof ResizeObserver === "function") {
      const observer = new ResizeObserver(entries => {
        const entry = entries?.[0];
        const measuredWidth =
          entry?.borderBoxSize?.[0]?.inlineSize ??
          entry?.contentRect?.width;
        sync(measuredWidth);
      });
      observer.observe(host, { box: "border-box" });
      const visualViewport =
        window.visualViewport;

      const onViewportResize = () =>
        sync(
          host.getBoundingClientRect()
            .width
        );

      visualViewport?.addEventListener(
        "resize",
        onViewportResize,
        {
          passive: true
        }
      );

      return () => {
        observer.disconnect();
        visualViewport
          ?.removeEventListener(
            "resize",
            onViewportResize
          );
      };
    }

    const onResize = () => sync(host.getBoundingClientRect().width);
    window.addEventListener("resize", onResize, { passive: true });
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const scale = Math.min(maximumScale, availableWidth / width);
  const renderedWidth = width * scale;
  const renderedHeight = height * scale;

  return (
    <div
      ref={hostRef}
      className={`ixi-fit-width-object-shell ${className}`.trim()}
      style={{ height: renderedHeight }}
      data-ixi-fit-width-scale={scale.toFixed(4)}
      data-ixi-scale-mode={size}
    >
      <div
        className="ixi-fit-width-object-frame"
        style={{ width: renderedWidth, height: renderedHeight }}
      >
        <div
          className="ixi-fit-width-object-plane"
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
        .ixi-fit-width-object-shell {
          box-sizing: border-box;
          width: 100%;
          max-width:
            calc(
              100dvw -
              ${MOBILE_VIEWPORT_GUTTER}px
            );
          min-width: 0;
          position: relative;
          display: flex;
          justify-content: center;
          align-items: flex-start;
          overflow: visible;
          contain: inline-size;
        }

        .ixi-fit-width-object-frame {
          position: relative;
          flex: 0 0 auto;
          overflow: visible;
        }

        .ixi-fit-width-object-plane {
          position: absolute;
          top: 0;
          left: 0;
          transform-origin: top left;
          overflow: visible;
        }
      `}</style>
    </div>
  );
}
