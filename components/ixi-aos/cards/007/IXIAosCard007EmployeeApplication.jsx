import IXIAosGenericUniversalLayout007 from "../generic/IXIAosGenericUniversalLayout007";
import IXIAosGenericUniversalLayout007B from "../generic/IXIAosGenericUniversalLayout007B";
import IXIAosGenericUniversalLayout007C from "../generic/IXIAosGenericUniversalLayout007C";
import IXIAosDataContractCardAdapter from "../../card-runtime/IXIAosDataContractCardAdapter";
import IXIAosFace1CardRuntime from "../../card-runtime/modules/IXIAosFace1CardRuntime";
import IXIAosCardHeaderIdentity from "../../card-runtime/modules/IXIAosCardHeaderIdentity";
import IXIAosCommercialEditorBridge from "../../card-runtime/modules/IXIAosCommercialEditorBridge";

function fieldIdFromLabel(label = "", fallback = "field") {
  const words = String(label || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!words.length) return fallback;

  return words
    .map((word, index) => index === 0 ? word : `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join("");
}

function normalizePreviewFieldIdentity(object = {}) {
  const isFaceLabPreview =
    object?.metadata?.source === "aos-card-catalog-preview" ||
    String(object?.objectId || "").startsWith("preview-universal-007");

  if (!isFaceLabPreview) return object;

  const sourceDefinitions = Array.isArray(object?.fieldDefinitions)
    ? object.fieldDefinitions
    : Array.isArray(object?.metadata?.fieldDefinitions)
      ? object.metadata.fieldDefinitions
      : [];

  const sourceFields = object?.fields && typeof object.fields === "object"
    ? object.fields
    : {};

  const usedIds = new Set();
  const idMap = new Map();

  const fieldDefinitions = sourceDefinitions.map((definition, index) => {
    const oldId = String(definition?.fieldId || `field_${index + 1}`).trim();
    const label = String(definition?.label || definition?.displayLabel || oldId).trim();

    let nextId = /^field_\d+$/i.test(oldId)
      ? fieldIdFromLabel(label, oldId)
      : oldId;

    let sequence = 2;
    const baseId = nextId;
    while (usedIds.has(nextId)) nextId = `${baseId}${sequence++}`;

    usedIds.add(nextId);
    idMap.set(oldId, nextId);

    return {
      ...definition,
      fieldId: nextId,
      label
    };
  });

  const fields = { ...sourceFields };
  idMap.forEach((nextId, oldId) => {
    if (nextId === oldId || !Object.prototype.hasOwnProperty.call(sourceFields, oldId)) return;
    fields[nextId] = sourceFields[oldId];
    delete fields[oldId];
  });

  return {
    ...object,
    fields,
    fieldDefinitions,
    metadata: {
      ...(object?.metadata || {}),
      fieldDefinitions
    }
  };
}

function resolveCard007Variant(object = {}) {
  const slug = String(
    object?.cardTemplateSlug ||
    object?.templateSlug ||
    object?.metadata?.cardTemplateSlug ||
    object?.metadata?.templateSlug ||
    ""
  ).trim().toLowerCase();
  const metadataVariant = String(object?.metadata?.cardVariant || "").trim().toUpperCase();

  if (slug === "universal-object-007b" || metadataVariant === "B") return "B";
  if (slug === "universal-object-007c" || metadataVariant === "C") return "C";
  return "A";
}

export default function IXIAosCard007EmployeeApplication(props) {
  const object = normalizePreviewFieldIdentity(props?.object || {});
  const selectedVariant = resolveCard007Variant(object);

  return (
    <IXIAosDataContractCardAdapter
      {...props}
      object={object}
      minimumCustomFields={8}
      showBusinessIdentifier={false}
    >
      {contractProps => (
        <IXIAosCommercialEditorBridge object={contractProps.object} onSaveObject={contractProps.onSaveObject} persistenceAdapter={contractProps.hasPersistenceAdapter ? contractProps.onSaveObject : null} onCancelDraft={contractProps.onDeleteObject} mediaEnabled>
          {({ object: runtimeObject }) => <IXIAosFace1CardRuntime cardNumber={7} object={runtimeObject} onSaveObject={contractProps.onSaveObject}>
          {face1 => {
            let CardLayout = IXIAosGenericUniversalLayout007;
            if (selectedVariant === "B") CardLayout = IXIAosGenericUniversalLayout007B;
            if (selectedVariant === "C") CardLayout = IXIAosGenericUniversalLayout007C;

            return (
              <IXIAosCardHeaderIdentity object={runtimeObject} className="u007-face-lab-variant-shell">
                <CardLayout {...contractProps} object={runtimeObject} onSaveObject={face1.onSaveObject} />
              </IXIAosCardHeaderIdentity>
            );
          }}
          </IXIAosFace1CardRuntime>}
        </IXIAosCommercialEditorBridge>
      )}
    </IXIAosDataContractCardAdapter>
  );
}
