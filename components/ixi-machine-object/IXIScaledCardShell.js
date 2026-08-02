import {
  getIXICardScalePreset
} from "../../lib/ixiCardScalePresets";

export default function IXIScaledCardShell({
  size = "xl",
  children,

  nativeWidth = 298,
  nativeHeight = 391,

  tight = false
}) {
  const metrics =
    getIXICardScalePreset(size);

  const scale =
    Number(metrics?.scale) || 1;

  const footprintWidth =
    tight
      ? nativeWidth * scale
      : metrics.width;

  const footprintHeight =
    tight
      ? nativeHeight * scale
      : metrics.height;

  return (
    <div
      className="ixi-scaled-card-shell"
      style={{
        width:
          `${footprintWidth}px`,

        height:
          `${footprintHeight}px`
      }}
    >
      <div
        className="ixi-scaled-card-inner"
        style={{
          width:
            `${nativeWidth}px`,

          height:
            `${nativeHeight}px`,

          transform:
            `scale(${scale})`,

          transformOrigin:
            "top left"
        }}
      >
        {children}
      </div>

      <style jsx>{`
        .ixi-scaled-card-shell {
          position: relative;

          flex: 0 0 auto;

          overflow: visible;
        }

        .ixi-scaled-card-inner {
          position: absolute;

          top: 0;
          left: 0;

          overflow: visible;
        }
      `}</style>
    </div>
  );
}
