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

const FACE_LAB_SHELL_WIDTH = 300;
const FACE_LAB_SHELL_HEIGHT = 475;
const FACE_LAB_DATUM_WIDTH = 298;
const FACE_LAB_DATUM_HEIGHT = 471;

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
  surfaceLabel = "Face Lab"
}) {
  const [
    scaleMode,
    setScaleMode
  ] = useState("xl");

  useEffect(() => {
    const savedMode =
      readSitewideCardScaleMode();

    if (savedMode) {
      setScaleMode(savedMode);
    }
  }, []);

  const footprint =
    getIXIObjectFootprint({
      scaleMode,
      objectFamily: "private"
    });

  function updateScaleMode(nextMode) {
    setScaleMode(
      writeSitewideCardScaleMode(
        nextMode
      )
    );
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
    >
      <div className="ixi-face-lab-size-label">
        {footprint.label} CARD ·{
          " "
        }
        {formatDimension(
          footprint.renderedWidth
        )} × {formatDimension(
          footprint.renderedHeight
        )} · DATUM 298 × 471
      </div>

      <IXIScaledCardShell
        size={scaleMode}
        objectFamily="private"
        nativeWidth={
          FACE_LAB_SHELL_WIDTH
        }
        nativeHeight={
          FACE_LAB_SHELL_HEIGHT
        }
        className="ixi-face-lab-footprint"
      >
        <div className="ixi-face-lab-card-shell">
          <div className="ixi-face-lab-card-datum">
            {children}
          </div>
        </div>
      </IXIScaledCardShell>

      <IXICardScaleControl
        value={scaleMode}
        onChange={updateScaleMode}
        surfaceLabel={surfaceLabel}
      />

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

          width: ${FACE_LAB_SHELL_WIDTH}px;
          height: ${FACE_LAB_SHELL_HEIGHT}px;

          display: flex;
          align-items: center;
          justify-content: center;

          overflow: visible;
        }

        .ixi-face-lab-card-datum {
          position: relative;

          width: ${FACE_LAB_DATUM_WIDTH}px;
          min-width: ${FACE_LAB_DATUM_WIDTH}px;
          max-width: ${FACE_LAB_DATUM_WIDTH}px;

          height: ${FACE_LAB_DATUM_HEIGHT}px;
          min-height: ${FACE_LAB_DATUM_HEIGHT}px;
          max-height: ${FACE_LAB_DATUM_HEIGHT}px;

          overflow: visible;
        }

        .ixi-face-lab-card-datum > :global(*) {
          margin: 0;
        }
      `}</style>
    </div>
  );
}
