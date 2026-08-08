import IXIFaceFrame
  from "../ixi-face-studio/IXIFaceFrame";

export default function IXIEntityObjectFace1({
  entity = {},
  faceSize = "tall",
  onOpen = null
}) {
  const displayName =
    entity?.displayName ||
    "IXI ENTITY";

  const officeLocation =
    entity?.officeLocation ||
    entity?.location ||
    "";

  return (
    <IXIFaceFrame
      size={faceSize}
      className="eof1"
    >
      <div className="entity-face">
        <div className="entity-type">
          ENTITY
        </div>

        <div className="entity-name">
          {displayName}
        </div>

        {officeLocation ? (
          <div className="entity-location">
            <i className="fa-solid fa-location-dot" />
            <span>
              {officeLocation}
            </span>
          </div>
        ) : null}

        <div className="entity-rule" />

        <div className="entity-object-mark">
          IXI AOS
        </div>

        <button
          type="button"
          className="entity-open"
          onClick={onOpen || undefined}
        >
          OPEN ENTITY
          <i className="fa-solid fa-arrow-right" />
        </button>
      </div>

      <style jsx>{`
        .entity-face {
          width: 100%;
          height: 100%;

          position: relative;

          display: flex;
          flex-direction: column;

          padding: 15px 5px 8px;

          text-align: left;
        }

        .entity-type {
          color:
            rgba(255,196,0,.72);

          font-size:
            var(--ixi-face-font-label);

          font-weight: 950;
          letter-spacing: .12em;

          text-transform: uppercase;
        }

        .entity-name {
          max-width: 100%;

          margin-top: 14px;

          color: #f2f2f2;

          font-size:
            var(--ixi-face-font-display);

          font-weight: 950;
          line-height: 1.02;

          letter-spacing: -.35px;

          text-transform: uppercase;
        }

        .entity-location {
          margin-top: 10px;

          display: flex;
          align-items: center;

          gap: 7px;

          color:
            rgba(255,255,255,.44);

          font-size:
            var(--ixi-face-font-value);

          font-weight: 800;

          letter-spacing: .03em;
        }

        .entity-location i {
          color:
            rgba(255,196,0,.52);

          font-size: 8px;
        }

        .entity-rule {
          width: 100%;
          height: 1px;

          margin-top: 18px;

          background:
            linear-gradient(
              90deg,
              rgba(255,196,0,.32),
              rgba(255,255,255,.06) 40%,
              transparent
            );
        }

        .entity-object-mark {
          margin-top: 12px;

          color:
            rgba(255,255,255,.18);

          font-size:
            var(--ixi-face-font-micro);

          font-weight: 950;

          letter-spacing: .14em;

          text-transform: uppercase;
        }

        .entity-open {
          width: 100%;
          height: 30px;

          margin-top: auto;

          display: flex;
          align-items: center;
          justify-content: space-between;

          padding: 0 10px;

          border:
            1px solid
            rgba(255,255,255,.07);

          border-radius: 6px;

          background:
            rgba(255,255,255,.025);

          color:
            rgba(255,255,255,.62);

          font-size:
            7px;

          font-weight: 950;

          letter-spacing: .08em;

          cursor: pointer;
        }

        .entity-open:hover {
          border-color:
            rgba(255,196,0,.26);

          background:
            rgba(255,196,0,.06);

          color: #ffc400;
        }

        .entity-open i {
          font-size: 8px;
        }
      `}</style>
    </IXIFaceFrame>
  );
}
