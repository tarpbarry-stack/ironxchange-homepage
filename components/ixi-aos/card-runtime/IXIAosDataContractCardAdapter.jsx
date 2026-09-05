import IXIAosBusinessIdentifierSlot from "./modules/IXIAosBusinessIdentifierSlot";
import { getAosParentDisplayName } from "./IXIAosParentIdentity";
import {
  AOS_OBJECT_DATA_CONTRACT_VERSION,
  buildAosObjectSavePayload,
  ensureBusinessIdentifierDefinition
} from "./IXIAosObjectDataContract";

/*
 * Shared adapter for every numbered AOS card.
 *
 * It does NOT decide what the object is and it does NOT inherit business meaning
 * from a parent/container. It only guarantees that every card reads/writes the
 * same portable object shape used by manual create, Excel/CSV, API and AWS.
 *
 * HARD CONTRACTS:
 * 1) Every numbered card exposes the customer's durable business identifier.
 * 2) In AOS/Work only, a real runtime parent name replaces the stock top-line
 *    noun in the exact existing visual slot. FaceLab has no real parent and is
 *    therefore left visually untouched.
 * 3) A real AOS parent is rendered in the canonical IXI yellow identity treatment.
 */
export default function IXIAosDataContractCardAdapter({
  children,
  showBusinessIdentifier = true,
  ...props
}) {
  const sourceObject = props?.object || {};
  const fieldDefinitions = ensureBusinessIdentifierDefinition(sourceObject);

  const object = {
    ...sourceObject,
    fieldDefinitions,
    metadata: {
      ...(sourceObject?.metadata || {}),
      aosDataContractVersion: AOS_OBJECT_DATA_CONTRACT_VERSION,
      fieldDefinitions
    }
  };

  const parentDisplayName = getAosParentDisplayName(object, props?.parentLabel);

  async function onSaveObject(payload = {}) {
    const incomingObject = payload?.object || {};
    const nextObject = {
      ...object,
      ...incomingObject,
      displayName: payload?.displayName ?? incomingObject?.displayName ?? object?.displayName,
      businessIdentifiers: payload?.businessIdentifiers ?? incomingObject?.businessIdentifiers ?? object?.businessIdentifiers ?? [],
      fields: payload?.fields || incomingObject?.fields || object?.fields || {},
      media: payload?.media || incomingObject?.media || object?.media || [],
      fieldDefinitions: payload?.fieldDefinitions || incomingObject?.fieldDefinitions || fieldDefinitions,
      metadata: {
        ...(object?.metadata || {}),
        ...(incomingObject?.metadata || {}),
        ...(payload?.metadata || {})
      }
    };

    const contractPayload = buildAosObjectSavePayload(nextObject, nextObject.fieldDefinitions);
    return props?.onSaveObject?.({ ...payload, ...contractPayload });
  }

  const contractProps = {
    ...props,
    object,
    onSaveObject,
    hasPersistenceAdapter: typeof props?.onSaveObject === "function",
    aosDataContractVersion: AOS_OBJECT_DATA_CONTRACT_VERSION
  };

  const rendered = typeof children === "function" ? children(contractProps) : null;
  if (!showBusinessIdentifier && !parentDisplayName) return rendered;

  return (
    <div className={["ixi-aos-data-contract-card-shell", parentDisplayName ? "has-real-parent" : ""].filter(Boolean).join(" ")}>
      {rendered}

      {parentDisplayName ? (
        <div className="ixi-aos-runtime-parent-line" aria-label="Parent" title={parentDisplayName}>
          {parentDisplayName}
        </div>
      ) : null}

      {showBusinessIdentifier ? (
        <div className="ixi-aos-data-contract-business-id">
          <IXIAosBusinessIdentifierSlot object={object} compact />
        </div>
      ) : null}

      <style jsx global>{`
        .ixi-aos-data-contract-card-shell {
          position: relative;
          width: 298px;
          height: 471px;
        }

        /*
         * Canonical AOS parent identity. This value exists only when the runtime
         * supplies a real parent relationship; FaceLab stock remains untouched.
         */
        .ixi-aos-runtime-parent-line {
          position: absolute;
          top: 7px;
          left: 10px;
          z-index: 195;
          max-width: 176px;
          overflow: hidden;
          color: #ffc400;
          font-size: 6px;
          font-weight: 950;
          line-height: 1;
          letter-spacing: .08em;
          text-overflow: ellipsis;
          text-transform: uppercase;
          white-space: nowrap;
          pointer-events: none;
        }

        .ixi-aos-data-contract-card-shell.has-real-parent article > header > div:first-child > span:first-child,
        .ixi-aos-data-contract-card-shell.has-real-parent .location-face1-heading > span:first-child {
          visibility: hidden !important;
        }

        .ixi-aos-data-contract-business-id {
          position: absolute;
          top: 49px;
          right: 10px;
          z-index: 75;
          width: 136px;
          max-width: calc(100% - 20px);
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}
