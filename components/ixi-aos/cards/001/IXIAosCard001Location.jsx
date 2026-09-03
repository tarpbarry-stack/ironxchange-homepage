import IXIAosLocationOverviewCard from "../location/IXIAosLocationOverviewCard";
import IXIAosV12CardPolish from "../../card-runtime/modules/IXIAosV12CardPolish";
import IXIAosDataContractCardAdapter from "../../card-runtime/IXIAosDataContractCardAdapter";
import IXIAosCommercialEditorBridge from "../../card-runtime/modules/IXIAosCommercialEditorBridge";
import { clean, getObjectId } from "../../card-runtime/IXIAosSemanticObjectPresentation";

export const CARD_001_LOCATION = Object.freeze({
  cardNumber: 1,
  templateSlug: "location-standard",
  nativeWidth: 298,
  nativeHeight: 471,
  railReserve: 19,
  label: "Container Layout 001",
  section: "AOS CONTAINER LAYOUTS",
  version: 12,
  renderer: "schema-driven-generic"
});

function formatIxiIdentity(object = {}) {
  const id = clean(getObjectId(object) || object?.uuid || object?.passportId);
  if (!id) return "";
  return /^IXI(?:\s|[-#])/i.test(id) ? id.toUpperCase() : `IXI ${id}`;
}

export default function IXIAosCard001Location(props) {
  return (
    <IXIAosDataContractCardAdapter {...props}>
      {contractProps => (
        <IXIAosCommercialEditorBridge
          object={contractProps.object}
          onSaveObject={contractProps.onSaveObject}
        >
          {({ object }) => {
            const ixiIdentity = formatIxiIdentity(object);
            return (
              <div className="aos-card001-v12-identity-shell">
                <IXIAosLocationOverviewCard {...contractProps} object={object} variant="001" />
                {ixiIdentity ? (
                  <span className="aos-card001-ixi-identity" title={ixiIdentity}>
                    {ixiIdentity}
                  </span>
                ) : null}
                <IXIAosV12CardPolish />
                <style jsx global>{`
                  .aos-card001-v12-identity-shell {
                    position: relative;
                    width: 298px;
                    height: 471px;
                  }
                  .aos-card001-ixi-identity {
                    position: absolute;
                    top: 7px;
                    right: 10px;
                    z-index: 190;
                    max-width: 122px;
                    overflow: hidden;
                    color: rgba(255,255,255,.42);
                    font-size: 6px;
                    font-weight: 950;
                    line-height: 1;
                    letter-spacing: .08em;
                    text-overflow: ellipsis;
                    text-transform: uppercase;
                    white-space: nowrap;
                    pointer-events: none;
                  }
                  .aos-card001-v12-identity-shell .gov-001 .ixi-aos-card-header-controls {
                    top: 18px;
                  }
                `}</style>
              </div>
            );
          }}
        </IXIAosCommercialEditorBridge>
      )}
    </IXIAosDataContractCardAdapter>
  );
}
