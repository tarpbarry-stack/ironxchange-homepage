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

        .card002-variant .card001 .photo-rail {
          display: none !important;
        }

        .card002-variant .card001 .actions {
          bottom: 19px !important;
        }

        .card002-variant .card001 .body {
          bottom: 47px !important;
        }

        .card002-variant .card001 .relationships {
          margin-bottom: 0 !important;
        }
      `}</style>
    </div>
  );
}
