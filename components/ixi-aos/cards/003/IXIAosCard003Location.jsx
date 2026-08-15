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
  return (
    <div className="card003-variant">
      <IXIAosCard001Location {...props} />

      <style jsx global>{`
        .card003-variant {
          position: relative;
          width: 298px;
          height: 471px;
        }

        /* Keep 001 as the canonical implementation; 003 changes presentation only. */
        .card003-variant .card001 .body {
          display: grid !important;
          grid-template-columns: 149px 149px !important;
          grid-template-rows: 79px 22px 31px minmax(0, 1fr) !important;
          align-content: stretch !important;
        }

        /* Main Location media: half width, half height, left side. */
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

        /* Address occupies the matching right half. Contact sits beneath it. */
        .card003-variant .card001 .address {
          grid-column: 2 !important;
          grid-row: 1 !important;
          width: 149px !important;
          height: 79px !important;
          margin: 0 !important;
          padding: 8px 8px 27px !important;
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
          min-height: 26px !important;
          padding: 0 2px !important;
          overflow: visible !important;
          align-items: center !important;
        }

        .card003-variant .card001 .address .ixi-aos-inline-address strong {
          width: 100% !important;
          white-space: normal !important;
          overflow: visible !important;
          text-overflow: clip !important;
          line-height: 1.2 !important;
          text-align: center !important;
        }

        .card003-variant .card001 .address::after {
          content: "CONTACT  •  JOHN CARTER  •  432-555-0186";
          position: absolute;
          left: 7px;
          right: 7px;
          bottom: 8px;
          color: rgba(255,255,255,.52);
          font-size: 6.5px;
          font-weight: 900;
          line-height: 1;
          text-align: center;
          white-space: nowrap;
        }

        /* Selected contained-object header remains directly below the top viewer. */
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

        /* 001 contained-object viewer stays at the bottom for this variant. */
        .card003-variant .card001 .photo-rail {
          display: block !important;
        }
      `}</style>
    </div>
  );
}
