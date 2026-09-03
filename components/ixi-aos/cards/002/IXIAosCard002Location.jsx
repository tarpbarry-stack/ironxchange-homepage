import IXIAosLocationOverviewCard from "../location/IXIAosLocationOverviewCard";
import {
  buildFace1LocationEditObject,
  getFace1LocationValues,
  restoreFace1LocationSave
} from "../location/IXIAosFace1LocationEditContract";
import IXIV12ReadabilityFoundation from "../../card-runtime/modules/IXIV12ReadabilityFoundation";
import IXIAosDataContractCardAdapter from "../../card-runtime/IXIAosDataContractCardAdapter";
import { clean, getObjectId } from "../../card-runtime/IXIAosSemanticObjectPresentation";

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

export default function IXIAosCard002Location(props) {
  return (
    <IXIAosDataContractCardAdapter {...props} showBusinessIdentifier={false}>
      {contractProps => {
        const object = contractProps.object;
        const ixiIdentity = formatIxiIdentity(object);
        const face1Values = getFace1LocationValues(object);
        const face1EditObject = buildFace1LocationEditObject(object);
        const customerIdLine = face1Values.customerId
          ? `${face1Values.customerIdLabel} - ${face1Values.customerId}`
          : face1Values.customerIdLabel;
        const handleFace1Save = payload =>
          contractProps.onSaveObject?.(restoreFace1LocationSave(object, payload));

        return (
          <div className="aos-card002-customer-id-shell ixi-v12-readable-card">
            <IXIAosLocationOverviewCard
              {...contractProps}
              object={face1EditObject}
              onSaveObject={handleFace1Save}
              variant="002"
            />
            {ixiIdentity ? <span className="aos-card002-ixi-identity" title={ixiIdentity}>{ixiIdentity}</span> : null}
            <div className="aos-card002-customer-identity" aria-label="Customer yard identity">
              <small className="ixi-v12-customer-identity-label">{customerIdLine}</small>
              <strong className="ixi-v12-customer-identity-value">{face1Values.addressLine1}</strong>
              {face1Values.addressLine2 ? <strong className="ixi-v12-customer-identity-value">{face1Values.addressLine2}</strong> : null}
            </div>
            <IXIV12ReadabilityFoundation />
            <style jsx global>{`
              .aos-card002-customer-id-shell{position:relative;width:298px;height:471px}.aos-card002-ixi-identity{position:absolute;top:7px;right:10px;z-index:240;max-width:122px;overflow:hidden;color:rgba(255,255,255,.50);font-family:Arial,Helvetica,sans-serif;font-size:6px;font-weight:950;letter-spacing:.08em;text-overflow:ellipsis;text-transform:uppercase;white-space:nowrap;pointer-events:none}.aos-card002-customer-id-shell .gov-002 .ixi-aos-card-header-controls{top:17px!important}.aos-card002-customer-id-shell .gov-002[data-editing="false"] .gov-descriptor>div{visibility:hidden!important}.aos-card002-customer-id-shell .gov-002 .gov-mark{visibility:visible!important}.aos-card002-customer-id-shell .gov-002[data-editing="true"]~.aos-card002-customer-identity,.aos-card002-customer-id-shell .gov-002[data-editing="true"]~.aos-card002-ixi-identity{display:none!important}.aos-card002-customer-identity{position:absolute;top:48px;left:31px;right:10px;height:57px;z-index:70;display:flex;flex-direction:column;align-items:center;justify-content:center;overflow:hidden;background:transparent;text-align:center;pointer-events:none}
            `}</style>
          </div>
        );
      }}
    </IXIAosDataContractCardAdapter>
  );
}
