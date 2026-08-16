import IXIAosCard001Location from "../001/IXIAosCard001Location";

export const CARD_003_LOCATION = Object.freeze({
  cardNumber: 3,
  templateSlug: "location-standard-003",
  nativeWidth: 298,
  nativeHeight: 471,
  railReserve: 19,
  label: "Location",
  section: "LOCATIONS & FACILITIES",
  version: 12
});

export default function IXIAosCard003Location(props) {
  const contactName = String(props?.object?.fields?.yardContact || "JOHN CARTER").trim();
  const contactPhone = String(props?.object?.fields?.yardPhone || "432-555-0186").trim();

  return (
    <div className="card003-variant">
      <IXIAosCard001Location {...props} />

      <div className="card003-contact-overlay">
        <strong>{contactName}</strong>
        <span>{contactPhone}</span>
      </div>

      <style jsx>{`
        .card003-contact-overlay {
          position: absolute;
          top: 95px;
          left: 157px;
          width: 132px;
          height: 22px;
          display: grid;
          grid-template-columns: minmax(0,1fr) auto;
          align-items: center;
          gap: 7px;
          padding: 4px 4px 0;
          border-top: 1px solid rgba(255,255,255,.07);
          pointer-events: none;
          z-index: 24;
          font-family: inherit;
        }

        .card003-contact-overlay strong,
        .card003-contact-overlay span {
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .card003-contact-overlay strong {
          color: rgba(255,255,255,.76);
          font-size: 7.6px;
          font-weight: 780;
          letter-spacing: .01em;
        }

        .card003-contact-overlay span {
          color: rgba(255,255,255,.38);
          font-size: 6.5px;
          font-weight: 700;
          text-align: right;
        }
      `}</style>

      <style jsx global>{`
        .card003-variant {
          position: relative;
          width: 298px;
          height: 471px;
        }

        .card003-variant .card001 {
          background:
            radial-gradient(130% 72% at 50% -9%, rgba(255,255,255,.052), transparent 44%),
            linear-gradient(180deg,#111214 0%,#0d0e0f 58%,#0a0b0c 100%) !important;
        }

        .card003-variant .card001 .body {
          display: grid !important;
          grid-template-columns: 149px 149px !important;
          grid-template-rows: 79px 22px 31px minmax(0, 1fr) !important;
          align-content: stretch !important;
        }

        .card003-variant .card001 .photo {
          grid-column: 1 !important;
          grid-row: 1 !important;
          width: 149px !important;
          height: 79px !important;
          overflow: hidden !important;
          border-right: 1px solid rgba(255,255,255,.055) !important;
          background: #08090a !important;
        }

        .card003-variant .card001 .photo .ixi-aos-primary-media-panel {
          width: 149px !important;
          height: 79px !important;
          min-height: 79px !important;
          max-height: 79px !important;
          margin-top: 0 !important;
          border: 0 !important;
          box-shadow: none !important;
        }

        .card003-variant .card001 .address {
          grid-column: 2 !important;
          grid-row: 1 !important;
          width: 149px !important;
          height: 79px !important;
          margin: 0 !important;
          padding: 8px 10px 28px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          overflow: hidden !important;
          position: relative !important;
          background: linear-gradient(180deg,rgba(255,255,255,.012),rgba(255,255,255,0)) !important;
        }

        .card003-variant .card001 .address .ixi-aos-inline-address {
          width: 100% !important;
          height: auto !important;
          min-height: 32px !important;
          padding: 0 2px !important;
          overflow: visible !important;
          align-items: center !important;
          justify-content: center !important;
          background: transparent !important;
          border: 0 !important;
        }

        .card003-variant .card001 .address .ixi-aos-inline-address strong {
          width: 100% !important;
          white-space: normal !important;
          overflow: visible !important;
          text-overflow: clip !important;
          color: rgba(255,255,255,.82) !important;
          font-size: 8.1px !important;
          font-weight: 760 !important;
          line-height: 1.22 !important;
          letter-spacing: -.005em !important;
          text-align: center !important;
        }

        .card003-variant .card001 .preview-info-strip {
          grid-column: 1 / 3 !important;
          grid-row: 2 !important;
          width: 298px !important;
        }

        .card003-variant .card001 .metrics {
          grid-column: 1 / 3 !important;
          grid-row: 3 !important;
          width: 272px !important;
          margin: -4px auto 0 !important;
        }

        .card003-variant .card001 .relationships {
          grid-column: 1 / 3 !important;
          grid-row: 4 !important;
          min-height: 0 !important;
          margin: 7px 9px 0 !important;
        }

        .card003-variant .card001 .photo-rail {
          display: block !important;
        }
      `}</style>
    </div>
  );
}
