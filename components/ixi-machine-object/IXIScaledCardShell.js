import { getIXICardScalePreset } from "../../lib/ixiCardScalePresets";

export default function IXIScaledCardShell({ size = "xl", children }) {
  const metrics = getIXICardScalePreset(size);

  return (
    <div
      className="ixi-scaled-card-shell"
      style={{
        width: `${metrics.width}px`,
        height: `${metrics.height}px`
      }}
    >
      <div
        className="ixi-scaled-card-inner"
        style={{
          width: "320px",
          height: "391px",
          transform: `scale(${metrics.scale})`,
          transformOrigin: "top left"
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
        }
      `}</style>
    </div>
  );
}
