import IXIAosLocationOverviewCard from "../location/IXIAosLocationOverviewCard";
import IXIV12ReadabilityFoundation from "../../card-runtime/modules/IXIV12ReadabilityFoundation";
import IXIAosDataContractCardAdapter from "../../card-runtime/IXIAosDataContractCardAdapter";
import IXIAosCommercialEditorBridge from "../../card-runtime/modules/IXIAosCommercialEditorBridge";
import {
  clean,
  getFieldDisplayValue,
  getFieldsByRole,
  getObjectPresentation
} from "../../card-runtime/IXIAosSemanticObjectPresentation";

export const CARD_002_LOCATION = Object.freeze({
  cardNumber: 2,
  templateSlug: "location-standard-002",
  nativeWidth: 298,
  nativeHeight: 471,
  railReserve: 19,
  label: "Container Layout 002",
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

export default function IXIAosCard002Location(props) {
  return (
    <IXIAosDataContractCardAdapter {...props} showBusinessIdentifier={false}>
      {contractProps => (
        <IXIAosCommercialEditorBridge object={contractProps.object} onSaveObject={contractProps.onSaveObject}>
          {({ object }) => {
            const customerIdLine = getCustomerIdLine(object);
            const [addressLineOne, addressLineTwo] = getAddressLines(object);

            return (
              <div className="aos-card002-customer-id-shell ixi-v12-readable-card">
                <IXIAosLocationOverviewCard {...contractProps} object={object} variant="002" />

                <div className="aos-card002-customer-identity" aria-label="Customer yard identity">
                  <small className="ixi-v12-customer-identity-label">{customerIdLine}</small>
                  <strong className="ixi-v12-customer-identity-value">{addressLineOne}</strong>
                  {addressLineTwo ? (
                    <strong className="ixi-v12-customer-identity-value">{addressLineTwo}</strong>
                  ) : null}
                </div>

                <IXIV12ReadabilityFoundation />
                <style jsx global>{`
                  .aos-card002-customer-id-shell {
                    position: relative;
                    width: 298px;
                    height: 471px;
                  }

                  /* Text replacement only. Preserve Card 002's original V12 shell,
                     border, fill, geometry and yellow diamond exactly. */
                  .aos-card002-customer-id-shell .gov-002 .gov-descriptor > div {
                    visibility: hidden !important;
                  }
                  .aos-card002-customer-id-shell .gov-002 .gov-mark {
                    visibility: visible !important;
                  }
                  .aos-card002-customer-identity {
                    position: absolute;
                    top: 48px;
                    left: 31px;
                    right: 10px;
                    height: 57px;
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
