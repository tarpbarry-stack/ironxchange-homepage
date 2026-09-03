import IXIAosLocationOverviewCard from "../location/IXIAosLocationOverviewCard";
import IXIAosV12CardPolish from "../../card-runtime/modules/IXIAosV12CardPolish";
import IXIV12ReadabilityFoundation from "../../card-runtime/modules/IXIV12ReadabilityFoundation";
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
              <div className="aos-card001-v12-identity-shell ixi-v12-readable-card">
                <IXIAosLocationOverviewCard {...contractProps} object={object} variant="001" />

                {ixiIdentity ? (
                  <span className="aos-card001-ixi-identity" title={ixiIdentity}>
                    {ixiIdentity}
                  </span>
                ) : null}

                <div className="aos-card001-customer-identity" aria-label="Customer yard identity">
                  <small className="ixi-v12-customer-identity-label">{customerIdLine}</small>
                  <strong className="ixi-v12-customer-identity-value">{addressLineOne}</strong>
                  {addressLineTwo ? (
                    <strong className="ixi-v12-customer-identity-value">{addressLineTwo}</strong>
                  ) : null}
                </div>

                <IXIV12ReadabilityFoundation />
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
                    color: rgba(255,255,255,.50);
                    font-family: Arial, Helvetica, sans-serif;
                    font-size: 6px;
                    font-weight: 950;
                    letter-spacing: .08em;
                    text-overflow: ellipsis;
                    text-transform: uppercase;
                    white-space: nowrap;
                    pointer-events: none;
                  }
                  .aos-card001-v12-identity-shell .gov-001 .ixi-aos-card-header-controls {
                    top: 17px !important;
                  }

                  /* Text replacement only. Preserve the original V12 descriptor shell,
                     outline, yellow diamond, geometry and sizing exactly. */
                  .aos-card001-v12-identity-shell .gov-001 .gov-descriptor > div {
                    visibility: hidden !important;
                  }
                  .aos-card001-v12-identity-shell .gov-001 .gov-mark {
                    visibility: visible !important;
                  }
                  .aos-card001-customer-identity {
                    position: absolute;
                    top: 166px;
                    left: 31px;
                    right: 10px;
                    height: 52px;
                    z-index: 70;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    overflow: hidden;
                    background: transparent;
                    text-align: center;
                    pointer-events: none;
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
