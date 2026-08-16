import IXIAosCard001Location from "../001/IXIAosCard001Location";

export const CARD_002_LOCATION = Object.freeze({
  cardNumber: 2,
  templateSlug: "location-standard-002",
  nativeWidth: 298,
  nativeHeight: 471,
  railReserve: 19,
  label: "Location",
  section: "LOCATIONS & FACILITIES",
  version: 12
});

export default function IXIAosCard002Location(props) {
  return (
    <div className="card002-variant">
      <IXIAosCard001Location {...props} />

      <style jsx global>{`
        .card002-variant {
          position: relative;
          width: 298px;
          height: 471px;
        }

        .card002-variant .card001 {
          background:
            radial-gradient(130% 72% at 50% -10%, rgba(255,255,255,.05), transparent 44%),
            linear-gradient(180deg,#111214 0%,#0d0e0f 58%,#0a0b0c 100%) !important;
        }

        .card002-variant .card001 .photo-rail {
          display: none !important;
        }

        .card002-variant .card001 .actions {
          left: 12px !important;
          right: 12px !important;
          bottom: 20px !important;
        }

        .card002-variant .card001 .body {
          bottom: 47px !important;
        }

        .card002-variant .card001 .relationships {
          margin: 8px 12px 0 !important;
          margin-bottom: 0 !important;
        }

        .card002-variant .card001 .relationships .ixi-face-section {
          padding-bottom: 2px !important;
        }

        .card002-variant .card001 .relationships .relationship-row {
          height: 25px !important;
        }

        .card002-variant .card001 .metrics .ixi-aos-inline-metrics {
          width: 276px !important;
        }
      `}</style>
    </div>
  );
}
