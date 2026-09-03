import IXIAosLocationOverviewCard from "../location/IXIAosLocationOverviewCard";
import IXIAosV12CardPolish from "../../card-runtime/modules/IXIAosV12CardPolish";
import IXIAosDataContractCardAdapter from "../../card-runtime/IXIAosDataContractCardAdapter";
import IXIAosCommercialEditorBridge from "../../card-runtime/modules/IXIAosCommercialEditorBridge";
import {
  clean,
  getFieldDisplayValue,
  getFieldsByRole,
  getObjectId,
  getObjectPresentation
} from "../../card-runtime/IXIAosSemanticObjectPresentation";

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

const FACELAB_IXI_ID_PREVIEW = "IXI - 482917";

function formatIxiIdentity(object = {}) {
  const rawId = clean(getObjectId(object) || object?.uuid || object?.passportId);
  const isFaceLabPreview =
    clean(object?.metadata?.source) === "aos-card-catalog-preview" ||
    /^aos-card-(?:catalog-)?preview/i.test(rawId) ||
    /^preview-/i.test(rawId);

  if (isFaceLabPreview) return FACELAB_IXI_ID_PREVIEW;
  if (!rawId) return "";

  const normalizedId = rawId.replace(/^IXI\s*[-#:]?\s*/i, "").trim();
  return normalizedId ? `IXI - ${normalizedId.toUpperCase()}` : "";
}

function getCustomerIdLine(object = {}) {
  const definition = getFieldsByRole(object, "business-identifier")?.[0];
  const label = clean(definition?.label) || "CUSTOMER YARD ID";
  const value = definition ? clean(getFieldDisplayValue(object, definition)) : "";
  return value ? `${label} - ${value}` : label;
}

function getAddressLines(object = {}) {
  const presentation = getObjectPresentation(object);
  const raw = clean(presentation?.primaryDescriptor);
  if (!raw) return ["", ""];

  const dotParts = raw.split(/\s*[·•]\s*/).map(clean).filter(Boolean);
  if (dotParts.length >= 2) return [dotParts[0], dotParts.slice(1).join(" · ")];

  const commaParts = raw.split(",").map(clean).filter(Boolean);
  if (commaParts.length >= 2) return [commaParts[0], commaParts.slice(1).join(", ")];

  return [raw, ""];
}

export default function IXIAosCard001Location(props) {
  return (
    <IXIAosDataContractCardAdapter {...props} showBusinessIdentifier={false}>
      {contractProps => (
        <IXIAosCommercialEditorBridge
          object={contractProps.object}
          onSaveObject={contractProps.onSaveObject}
        >
          {({ object }) => {
            const ixiIdentity = formatIxiIdentity(object);
            const customerIdLine = getCustomerIdLine(object);
            const [addressLineOne, addressLineTwo] = getAddressLines(object);

            return (
              <div className="aos-card001-v12-identity-shell">
                <IXIAosLocationOverviewCard {...contractProps} object={object} variant="001" />

                {ixiIdentity ? (
                  <span className="aos-card001-ixi-identity" title={ixiIdentity}>
                    {ixiIdentity}
                  </span>
                ) : null}

                <div className="aos-card001-customer-identity" aria-label="Customer yard identity">
                  <small>{customerIdLine}</small>
                  <strong>{addressLineOne}</strong>
                  {addressLineTwo ? <strong>{addressLineTwo}</strong> : null}
                </div>

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
                    z-index: 240;
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
                    top: 17px !important;
                  }
                  .aos-card001-v12-identity-shell .gov-001 .gov-descriptor > * {
                    visibility: hidden !important;
                  }
                  .aos-card001-customer-identity {
                    position: absolute;
                    top: 166px;
                    left: 8px;
                    right: 8px;
                    height: 52px;
                    z-index: 70;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    overflow: hidden;
                    background: #111411;
                    text-align: center;
                    pointer-events: none;
                  }
                  .aos-card001-customer-identity small {
                    display: block;
                    max-width: 94%;
                    margin-bottom: 4px;
                    overflow: hidden;
                    color: #969d98;
                    font-size: 6px;
                    font-weight: 900;
                    line-height: 1;
                    text-overflow: ellipsis;
                    text-transform: uppercase;
                    white-space: nowrap;
                  }
                  .aos-card001-customer-identity strong {
                    display: block;
                    max-width: 94%;
                    overflow: hidden;
                    color: #eef1ef;
                    font-size: 8px;
                    font-weight: 900;
                    line-height: 1.18;
                    text-overflow: ellipsis;
                    text-transform: uppercase;
                    white-space: nowrap;
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
