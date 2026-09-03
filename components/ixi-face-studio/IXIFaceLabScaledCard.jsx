import {
  useEffect,
  useState
} from "react";

import IXICardScaleControl
  from "../ixi-chassis/IXICardScaleControl";

import {
  readSitewideCardScaleMode,
  writeSitewideCardScaleMode
} from "../ixi-chassis/IXIScaleEngine";

import IXIScaledCardShell
  from "../ixi-machine-object/IXIScaledCardShell";

import {
  getIXIObjectFootprint
} from "../../lib/ixiObjectGeometry";

function formatDimension(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "0";
  }

  return Number.isInteger(number)
    ? String(number)
    : number.toFixed(1);
}

export default function IXIFaceLabScaledCard({
  children,
  surfaceLabel = "Face Lab",
  objectFamily = "private",
  scaleMode: controlledScaleMode,
  onScaleModeChange,
  showScaleControl = true
}) {
  const geometryFamily =
    objectFamily === "marketplace"
      ? "marketplace"
      : "private";

  const [
    localScaleMode,
    setLocalScaleMode
  ] = useState("xl");

  const scaleMode =
    controlledScaleMode ||
    localScaleMode;

  useEffect(() => {
    if (controlledScaleMode) {
      return;
    }

    const savedMode =
      readSitewideCardScaleMode();

    if (savedMode) {
      setLocalScaleMode(savedMode);
    }
  }, [controlledScaleMode]);

  const footprint =
    getIXIObjectFootprint({
      scaleMode,
      objectFamily: geometryFamily
    });

  const nativeWidth =
    footprint.nativePanelWidth;

  const nativeHeight =
    footprint.nativeHeight;

  function updateScaleMode(nextMode) {
    const savedMode =
      writeSitewideCardScaleMode(
        nextMode
      );

    if (
      typeof onScaleModeChange ===
      "function"
    ) {
      onScaleModeChange(savedMode);
      return;
    }

    setLocalScaleMode(savedMode);
  }

  return (
    <div
      className="ixi-face-lab-scaled-preview"
      data-ixi-face-lab-scale-mode={scaleMode}
      data-ixi-face-lab-rendered-width={
        footprint.renderedWidth
      }
      data-ixi-face-lab-rendered-height={
        footprint.renderedHeight
      }
      data-ixi-face-lab-native-width={
        nativeWidth
      }
      data-ixi-face-lab-native-height={
        nativeHeight
      }
      data-ixi-face-lab-object-family={
        geometryFamily
      }
    >
      <div className="ixi-face-lab-size-label">
        {footprint.label} CARD ·{
          " "
        }
        {formatDimension(
          footprint.renderedWidth
        )} × {formatDimension(
          footprint.renderedHeight
        )} · NATIVE {formatDimension(
          nativeWidth
        )} × {formatDimension(
          nativeHeight
        )}
      </div>

      <IXIScaledCardShell
        size={scaleMode}
        objectFamily={geometryFamily}
        nativeWidth={
          nativeWidth
        }
        nativeHeight={
          nativeHeight
        }
        className="ixi-face-lab-footprint"
      >
        <div className="ixi-face-lab-card-shell">
          <div className="ixi-face-lab-card-datum">
            {children}
          </div>
        </div>
      </IXIScaledCardShell>

      {showScaleControl ? (
        <IXICardScaleControl
          value={scaleMode}
          onChange={updateScaleMode}
          surfaceLabel={surfaceLabel}
        />
      ) : null}

      <style jsx>{`
        .ixi-face-lab-scaled-preview {
          width: max-content;
          max-width: none;

          display: flex;
          flex-direction: column;
          align-items: center;

          gap: 10px;
        }

        .ixi-face-lab-size-label {
          color: rgba(255,255,255,.48);
          font-size: 10px;
          font-weight: 800;
          line-height: 13px;
          letter-spacing: .06em;
          text-transform: uppercase;
          white-space: nowrap;
        }

        .ixi-face-lab-card-shell {
          box-sizing: border-box;

          width: ${nativeWidth}px;
          height: ${nativeHeight}px;

          display: flex;
          align-items: center;
          justify-content: center;

          overflow: visible;
        }

        .ixi-face-lab-card-datum {
          position: relative;

          width: ${nativeWidth}px;
          min-width: ${nativeWidth}px;
          max-width: ${nativeWidth}px;

          height: ${nativeHeight}px;
          min-height: ${nativeHeight}px;
          max-height: ${nativeHeight}px;

          overflow: visible;
        }

        .ixi-face-lab-card-datum > :global(*) {
          box-sizing: border-box;

          width: 100% !important;
          min-width: 100% !important;
          max-width: 100% !important;

          height: 100% !important;
          min-height: 100% !important;
          max-height: 100% !important;

          margin: 0;
        }
      `}</style>
    </div>
  );
}
