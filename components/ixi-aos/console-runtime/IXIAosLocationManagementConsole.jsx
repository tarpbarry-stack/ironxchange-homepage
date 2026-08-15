import { useState } from "react";

import IXIAosCard001Location from "../cards/001/IXIAosCard001Location";
import IXIAosCard002Location from "../cards/002/IXIAosCard002Location";
import IXIAosCard003Location from "../cards/003/IXIAosCard003Location";
import IXIAosLocationFace2Operations from "../cards/location/IXIAosLocationFace2Operations";
import IXIAosLocationFace3Financial from "../cards/location/IXIAosLocationFace3FinancialApp";
import IXIAosLocationFace4Obligations from "../cards/location/IXIAosLocationFace4Obligations";
import IXIAosLocationFace5Maintenance from "../cards/location/IXIAosLocationFace5Maintenance";

const FACE_LABELS = {
  1: "OVERVIEW",
  2: "OPERATIONS",
  3: "FINANCIAL",
  4: "EXPENSES",
  5: "MAINTENANCE"
};

export default function IXIAosLocationManagementConsole({
  templateSlug = "location-standard",
  object = {},
  shared = {},
  financialMode = "owned",
  f2skin = "v12",
  onF2SkinChange = null,
  initialFace = 2,
  onClose = null
}) {
  const [face, setFace] = useState(Math.min(5, Math.max(1, Number(initialFace) || 2)));

  const Card =
    templateSlug === "location-standard-003"
      ? IXIAosCard003Location
      : templateSlug === "location-standard-002"
        ? IXIAosCard002Location
        : IXIAosCard001Location;

  const financialObject = {
    ...object,
    fields: {
      ...(object.fields || {}),
      ownershipStatus: financialMode
    }
  };

  function previous() {
    setFace(current => (current <= 1 ? 5 : current - 1));
  }

  function next() {
    setFace(current => (current >= 5 ? 1 : current + 1));
  }

  return (
    <div className="location-management-console">
      <div className="console-controls">
        <button type="button" onClick={previous}>‹</button>
        <strong>AOS CONSOLE · F{face} {FACE_LABELS[face]}</strong>
        <button type="button" onClick={next}>›</button>
        <button type="button" className="close" onClick={() => onClose?.()}>×</button>
      </div>

      <div className="console-face">
        {face === 5 ? (
          <IXIAosLocationFace5Maintenance {...shared} object={financialObject} demoMode />
        ) : face === 4 ? (
          <IXIAosLocationFace4Obligations {...shared} object={financialObject} demoMode />
        ) : face === 3 ? (
          <IXIAosLocationFace3Financial {...shared} object={financialObject} />
        ) : face === 2 ? (
          <IXIAosLocationFace2Operations
            {...shared}
            object={financialObject}
            skinId={f2skin}
            onSkinChange={onF2SkinChange}
          />
        ) : (
          <Card {...shared} object={financialObject} />
        )}
      </div>

      <style jsx>{`
        .location-management-console,
        .location-management-console * { box-sizing: border-box; }
        .location-management-console {
          position: relative;
          width: 298px;
          height: 471px;
          flex: 0 0 298px;
          overflow: visible;
        }
        .console-face {
          position: absolute;
          inset: 0;
          width: 298px;
          height: 471px;
        }
        .console-controls {
          position: absolute;
          top: 45px;
          left: 7px;
          right: 7px;
          height: 22px;
          display: grid;
          grid-template-columns: 22px minmax(0,1fr) 22px 22px;
          gap: 3px;
          align-items: center;
          z-index: 900;
          pointer-events: auto;
        }
        .console-controls button,
        .console-controls strong {
          height: 22px;
          border: 1px solid rgba(255,255,255,.08);
          border-radius: 4px;
          background: rgba(6,7,7,.96);
        }
        .console-controls button {
          padding: 0;
          color: #ffc400;
          font-size: 13px;
          font-weight: 950;
          cursor: pointer;
        }
        .console-controls strong {
          min-width: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          padding: 0 5px;
          color: rgba(255,255,255,.66);
          font-size: 5.2px;
          font-weight: 950;
          letter-spacing: .045em;
          white-space: nowrap;
          text-overflow: ellipsis;
        }
        .console-controls .close {
          color: rgba(255,255,255,.52);
          font-size: 12px;
        }
      `}</style>
    </div>
  );
}
