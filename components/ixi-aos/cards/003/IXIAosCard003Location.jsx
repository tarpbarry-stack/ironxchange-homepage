import IXIAosLocationOverviewCard from "../location/IXIAosLocationOverviewCard";
import IXIAosDataContractCardAdapter from "../../card-runtime/IXIAosDataContractCardAdapter";
import IXIAosCommercialEditorBridge from "../../card-runtime/modules/IXIAosCommercialEditorBridge";
import {
  clean,
  getFieldDisplayValue,
  getFieldsByRole,
  getObjectPresentation
} from "../../card-runtime/IXIAosSemanticObjectPresentation";

export const CARD_003_LOCATION = Object.freeze({
  cardNumber: 3,
  templateSlug: "location-standard-003",
  nativeWidth: 298,
  nativeHeight: 471,
  railReserve: 19,
  label: "Container Layout 003",
  section: "AOS CONTAINER LAYOUTS",
  version: 12,
  renderer: "schema-driven-generic"
});

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

export default function IXIAosCard003Location(props) {
  return (
    <IXIAosDataContractCardAdapter {...props} showBusinessIdentifier={false}>
      {contractProps => (
        <IXIAosCommercialEditorBridge object={contractProps.object} onSaveObject={contractProps.onSaveObject}>
          {({ object }) => {
            const customerIdLine = getCustomerIdLine(object);
            const [addressLineOne, addressLineTwo] = getAddressLines(object);

            return (
              <div className="aos-card003-customer-id-shell">
                <IXIAosLocationOverviewCard {...contractProps} object={object} variant="003" />

                <div className="aos-card003-customer-identity" aria-label="Customer yard identity">
                  <small>{customerIdLine}</small>
                  <strong>{addressLineOne}</strong>
                  {addressLineTwo ? <strong>{addressLineTwo}</strong> : null}
                </div>

                <style jsx global>{`
                  .aos-card003-customer-id-shell {
                    position: relative;
                    width: 298px;
                    height: 471px;
                  }

                  /* Text replacement only. Preserve Card 003's original V12 address shell,
                     border, fill, geometry, yellow marker and all sizing exactly. */
                  .aos-card003-customer-id-shell .gov-003 .gov-descriptor > div {
                    visibility: hidden !important;
                  }
                  .aos-card003-customer-id-shell .gov-003 .gov-mark {
                    visibility: visible !important;
                  }
                  .aos-card003-customer-identity {
                    position: absolute;
                    top: 48px;
                    left: 173px;
                    right: 10px;
                    height: 55px;
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
                  .aos-card003-customer-identity small {
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
                  .aos-card003-customer-identity strong {
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
