import {
  getIXIObjectFootprint
} from "../../lib/ixiObjectGeometry";

export default function IXIScaledCardShell({
  size = "xl",

  objectFamily = "default",

  nativeWidth,
  nativeHeight,

  slotCount = 1,
  seamOverlap = 1,

  className = "",

  children
}) {
  const footprint =
    getIXIObjectFootprint({
      scaleMode: size,
      objectFamily,

      nativeWidth,
      nativeHeight,

      slotCount,
      seamOverlap
    });

  return (
    <div
      className={[
        "ixi-scaled-object-shell",
        className
      ]
        .filter(Boolean)
        .join(" ")}
      style={{
        width:
          `${footprint.renderedWidth}px`,

        height:
          `${footprint.renderedHeight}px`,

        "--ixi-object-native-width":
          `${footprint.nativeWidth}px`,

        "--ixi-object-native-height":
          `${footprint.nativeHeight}px`,

        "--ixi-object-scale":
          footprint.scale
      }}
      data-ixi-scale-mode={
        footprint.scaleMode
      }
      data-ixi-slot-count={
        footprint.slotCount
      }
    >
      <div
        className="ixi-scaled-object-inner"
      >
        {children}
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
      `}</style>
    </div>
  );
}
