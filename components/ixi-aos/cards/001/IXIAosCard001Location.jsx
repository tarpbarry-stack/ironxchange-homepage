import IXIAosLocationOverviewCard from "../location/IXIAosLocationOverviewCard";
import { getFace1LocationValues } from "../location/IXIAosFace1LocationEditContract";
import IXIAosV12CardPolish from "../../card-runtime/modules/IXIAosV12CardPolish";
import IXIV12ReadabilityFoundation from "../../card-runtime/modules/IXIV12ReadabilityFoundation";
import IXIAosDataContractCardAdapter from "../../card-runtime/IXIAosDataContractCardAdapter";
import IXIAosCommercialEditorBridge from "../../card-runtime/modules/IXIAosCommercialEditorBridge";
import { getAosPassportDisplaySerial } from "../../../../lib/mos/ixiAosPassportPresentation.mjs";
import IXIAosFace1CardRuntime from "../../card-runtime/modules/IXIAosFace1CardRuntime";

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
  return `IXI - ${getAosPassportDisplaySerial(object)}`;
}

export default function IXIAosCard001Location(props) {
  return (
    <IXIAosDataContractCardAdapter {...props} showBusinessIdentifier={false}>
      {contractProps => {
        return (
          <IXIAosCommercialEditorBridge object={contractProps.object} onSaveObject={contractProps.onSaveObject} persistenceAdapter={contractProps.hasPersistenceAdapter ? contractProps.onSaveObject : null} onCancelDraft={contractProps.onDeleteObject} mediaEnabled>
            {({ object: runtimeObject }) => {
              return <IXIAosFace1CardRuntime cardNumber={1} object={runtimeObject} onSaveObject={contractProps.onSaveObject} includeBusinessIdentifier allowAddFields>{face1 => {
                const ixiIdentity = formatIxiIdentity(face1.object);
                const face1Values = getFace1LocationValues(face1.object);
                const customerIdLine = face1Values.customerId
                  ? `${face1Values.customerIdLabel} - ${face1Values.customerId}`
                  : face1Values.customerIdLabel;

                return <div className="aos-card001-v12-identity-shell ixi-v12-readable-card">
            <IXIAosLocationOverviewCard
              {...contractProps}
              object={face1.object}
              onSaveObject={face1.onSaveObject}
              variant="001"
            />

            {ixiIdentity ? (
              <span className="aos-card001-ixi-identity" title={ixiIdentity}>{ixiIdentity}</span>
            ) : null}

            <div className="aos-card001-customer-identity" aria-label="Customer yard identity">
              <small className="ixi-v12-customer-identity-label">{customerIdLine}</small>
              <strong className="ixi-v12-customer-identity-value">{face1Values.addressLine1}</strong>
              {face1Values.addressLine2 ? (
                <strong className="ixi-v12-customer-identity-value">{face1Values.addressLine2}</strong>
              ) : null}
            </div>

            <IXIV12ReadabilityFoundation />
            <IXIAosV12CardPolish />
            <style jsx global>{`
              .aos-card001-v12-identity-shell{position:relative;width:298px;height:471px}.aos-card001-ixi-identity{position:absolute;top:7px;right:10px;z-index:240;max-width:122px;overflow:hidden;color:rgba(255,255,255,.50);font-family:Arial,Helvetica,sans-serif;font-size:6px;font-weight:950;letter-spacing:.08em;text-overflow:ellipsis;text-transform:uppercase;white-space:nowrap;pointer-events:none}.aos-card001-v12-identity-shell .gov-001 .ixi-aos-card-header-controls{top:17px!important}.aos-card001-v12-identity-shell .gov-001[data-editing="false"] .gov-descriptor>div{visibility:hidden!important}.aos-card001-v12-identity-shell .gov-001 .gov-mark{visibility:visible!important}.aos-card001-v12-identity-shell .gov-001[data-editing="true"]~.aos-card001-customer-identity,.aos-card001-v12-identity-shell .gov-001[data-editing="true"]~.aos-card001-ixi-identity{display:none!important}.aos-card001-customer-identity{position:absolute;top:166px;left:31px;right:10px;height:52px;z-index:70;display:flex;flex-direction:column;align-items:center;justify-content:center;overflow:hidden;background:transparent;text-align:center;pointer-events:none}
              `}</style>
              </div>;
              }}</IXIAosFace1CardRuntime>;
            }}
          </IXIAosCommercialEditorBridge>
        );
      }}
    </IXIAosDataContractCardAdapter>
  );
}
