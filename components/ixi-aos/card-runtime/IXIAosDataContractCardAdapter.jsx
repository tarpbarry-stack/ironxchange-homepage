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
 */
export default function IXIAosDataContractCardAdapter({ children, ...props }) {
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

  async function onSaveObject(payload = {}) {
    const incomingObject = payload?.object || {};
    const nextObject = {
      ...object,
      ...incomingObject,
      displayName: payload?.displayName ?? incomingObject?.displayName ?? object?.displayName,
      fields: payload?.fields || incomingObject?.fields || object?.fields || {},
      media: payload?.media || incomingObject?.media || object?.media || [],
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

  return typeof children === "function" ? children(contractProps) : null;
}
