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
          left: 156px;
          width: 135px;
          height: 22px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          align-items: center;
          gap: 5px;
          padding-top: 4px;
          border-top: 1px solid rgba(255,255,255,.10);
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
          text-align: center;
        }

        .card003-contact-overlay strong {
          color: rgba(255,255,255,.82);
          font-size: 8px;
          font-weight: 950;
        }

        .card003-contact-overlay span {
          color: rgba(255,255,255,.56);
          font-size: 7px;
          font-weight: 900;
        }
      `}</style>

      <style jsx global>{`
        .card003-variant {
          position: relative;
          width: 298px;
          height: 471px;
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
        }

        .card003-variant .card001 .photo .ixi-aos-primary-media-panel {
          width: 149px !important;
          height: 79px !important;
          min-height: 79px !important;
          max-height: 79px !important;
          margin-top: 0 !important;
        }

        .card003-variant .card001 .address {
          grid-column: 2 !important;
          grid-row: 1 !important;
          width: 149px !important;
          height: 79px !important;
          margin: 0 !important;
          padding: 5px 8px 28px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          overflow: visible !important;
          position: relative !important;
          border-left: 1px solid rgba(255,255,255,.05) !important;
        }

        .card003-variant .card001 .address .ixi-aos-inline-address {
          width: 100% !important;
          height: auto !important;
          min-height: 34px !important;
          padding: 0 2px !important;
          overflow: visible !important;
          align-items: center !important;
        }

        .card003-variant .card001 .address .ixi-aos-inline-address strong {
          width: 100% !important;
          white-space: normal !important;
          overflow: visible !important;
          text-overflow: clip !important;
          line-height: 1.18 !important;
          text-align: center !important;
        }

        /* Remove the bullet between street and city so copy/paste reads as an address. */
        .card003-variant .card001 .address .ixi-aos-inline-address strong {
          font-size: 0 !important;
        }

        .card003-variant .card001 .address .ixi-aos-inline-address strong::before {
          content: "2400 AVIATION DRIVE\\A DFW AIRPORT, TX 75261";
          white-space: pre-line;
          color: rgba(255,255,255,.86);
          font-size: 9px;
          font-weight: 900;
          font-family: inherit;
          line-height: 1.25;
        }

        .card003-variant .card001 .preview-info-strip {
          grid-column: 1 / 3 !important;
          grid-row: 2 !important;
          width: 298px !important;
        }

        .card003-variant .card001 .metrics {
          grid-column: 1 / 3 !important;
          grid-row: 3 !important;
          width: 270px !important;
          margin: -5px auto 0 !important;
        }

        .card003-variant .card001 .relationships {
          grid-column: 1 / 3 !important;
          grid-row: 4 !important;
          min-height: 0 !important;
          margin: 5px 6px 0 !important;
        }

        .card003-variant .card001 .photo-rail {
          display: block !important;
        }
      `}</style>
    </div>
  );
}
