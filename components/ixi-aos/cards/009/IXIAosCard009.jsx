import IXIAosGenericMediaDominant009 from "../generic/IXIAosGenericMediaDominant009";
import IXIAosDataContractCardAdapter from "../../card-runtime/IXIAosDataContractCardAdapter";
import IXIAosFace1CardRuntime from "../../card-runtime/modules/IXIAosFace1CardRuntime";

export const CARD_009 = Object.freeze({
  cardNumber: 9,
  templateSlug: "aos-card-009",
  nativeWidth: 298,
  nativeHeight: 471,
  railReserve: 23,
  version: 12,
  renderer: "schema-driven-generic"
});

function clean(value) {
  return String(value || "").trim();
}

function ixiNumberFor(object = {}) {
  const isPreview = object?.metadata?.source === "aos-card-catalog-preview";
  if (isPreview) return "XXXXXX";

  const explicit = clean(
    object?.ixiNumber ||
    object?.ixiId ||
    object?.metadata?.ixiNumber ||
    object?.metadata?.ixiId
  );
  if (explicit) return explicit.replace(/^IXI\s*[-#:]?\s*/i, "").toUpperCase();

  const objectId = clean(object?.objectId || object?.id);
  if (!objectId) return "XXXXXX";
  const compact = objectId.replace(/[^a-z0-9]/gi, "").toUpperCase();
  return compact.slice(-6).padStart(6, "X");
}

export default function IXIAosCard009(props) {
  return (
    <IXIAosDataContractCardAdapter {...props} minimumCustomFields={7}>
      {contractProps => {
        const ixiNumber = ixiNumberFor(contractProps.object);
        return (
          <div className="ixi-card009-runtime">
            <span className="ixi-card009-number">IXI - {ixiNumber}</span>
            <IXIAosFace1CardRuntime object={contractProps.object} onSaveObject={contractProps.onSaveObject} maxFields={6}>
              {face1 => <IXIAosGenericMediaDominant009 {...contractProps} object={face1.object} onSaveObject={face1.onSaveObject} />}
            </IXIAosFace1CardRuntime>
            <style jsx>{`
              .ixi-card009-runtime{position:relative;width:298px;height:471px}
              .ixi-card009-number{position:absolute;top:7px;right:9px;z-index:190;color:#858c87;font-family:Arial,Helvetica,sans-serif;font-size:6px;font-weight:950;line-height:1;letter-spacing:.08em;white-space:nowrap;pointer-events:none}
              :global(.ixi-card009-runtime .ixi-aos-card-header-controls){top:17px!important}
            `}</style>
          </div>
        );
      }}
    </IXIAosDataContractCardAdapter>
  );
}
