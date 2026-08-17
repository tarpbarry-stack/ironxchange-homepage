import IXIAosBusinessIdentifierSlot from "./modules/IXIAosBusinessIdentifierSlot";
import {
  AOS_OBJECT_DATA_CONTRACT_VERSION,
  BUSINESS_IDENTIFIER_FIELD_ID,
  BUSINESS_IDENTIFIER_ROLE,
  buildAosObjectSavePayload,
  createStableCustomFieldDefinition,
  ensureBusinessIdentifierDefinition
} from "./IXIAosObjectDataContract";

/*
 * Shared adapter for every numbered AOS card.
 *
 * It does NOT decide what the object is and it does NOT inherit business meaning
 * from a parent/container. It only guarantees that every card reads/writes the
 * same portable object shape used by manual create, Excel/CSV, API and AWS.
 *
 * HARD CONTRACT:
 * Every numbered card exposes the customer's durable business identifier in a
 * dedicated visible slot. The label remains customer-defined (ID, UNIT #,
 * ASSET #, EMPLOYEE #, etc.). IXI never derives business meaning from that label.
 */
export default function IXIAosDataContractCardAdapter({
  children,
  minimumCustomFields = 0,
  showBusinessIdentifier = true,
  ...props
}) {
  const sourceObject = props?.object || {};
  let fieldDefinitions = ensureBusinessIdentifierDefinition(sourceObject);

  const isBusinessIdentifier = definition =>
    definition?.fieldId === BUSINESS_IDENTIFIER_FIELD_ID ||
    definition?.presentationRole === BUSINESS_IDENTIFIER_ROLE ||
    definition?.semanticRole === BUSINESS_IDENTIFIER_ROLE;

  let customCount = fieldDefinitions.filter(definition => !isBusinessIdentifier(definition)).length;
  while (customCount < minimumCustomFields) {
    fieldDefinitions = [
      ...fieldDefinitions,
      createStableCustomFieldDefinition(fieldDefinitions, customCount)
    ];
    customCount += 1;
  }

  const object = {
    ...sourceObject,
    fieldDefinitions,
    metadata: {
      ...(sourceObject?.metadata || {}),
      aosDataContractVersion: AOS_OBJECT_DATA_CONTRACT_VERSION,
      fieldDefinitions
    }
  };

  async function onSaveObject(payload = {}) {
    const incomingObject = payload?.object || {};

    const nextObject = {
      ...object,
      ...incomingObject,

      displayName:
        payload?.displayName ??
        incomingObject?.displayName ??
        object?.displayName,

      businessIdentifiers:
        payload?.businessIdentifiers ??
        incomingObject?.businessIdentifiers ??
        object?.businessIdentifiers ??
        [],

      fields:
        payload?.fields ||
        incomingObject?.fields ||
        object?.fields ||
        {},

      media:
        payload?.media ||
        incomingObject?.media ||
        object?.media ||
        [],

      fieldDefinitions:
        payload?.fieldDefinitions ||
        incomingObject?.fieldDefinitions ||
        fieldDefinitions,

      metadata: {
        ...(object?.metadata || {}),
        ...(incomingObject?.metadata || {}),
        ...(payload?.metadata || {})
      }
    };

    const contractPayload = buildAosObjectSavePayload(
      nextObject,
      nextObject.fieldDefinitions
    );

    return props?.onSaveObject?.({
      ...payload,
      ...contractPayload
    });
  }

  const contractProps = {
    ...props,
    object,
    onSaveObject,
    aosDataContractVersion: AOS_OBJECT_DATA_CONTRACT_VERSION
  };

  const rendered = typeof children === "function" ? children(contractProps) : null;

  if (!showBusinessIdentifier) return rendered;

  return (
    <div className="ixi-aos-data-contract-card-shell">
      {rendered}
      <div className="ixi-aos-data-contract-business-id">
        <IXIAosBusinessIdentifierSlot object={object} compact />
      </div>

      <style jsx>{`
        .ixi-aos-data-contract-card-shell {
          position: relative;
          width: 298px;
          height: 471px;
        }
        .ixi-aos-data-contract-business-id {
          position: absolute;
          top: 46px;
          right: 9px;
          z-index: 75;
          width: 76px;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}
