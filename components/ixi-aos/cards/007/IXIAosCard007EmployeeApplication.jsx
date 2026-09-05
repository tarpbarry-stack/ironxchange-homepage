import { useState } from "react";
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

export default function IXIAosCard007EmployeeApplication(props) {
  const [faceLabVariant, setFaceLabVariant] = useState("007A");
  const object = normalizePreviewFieldIdentity(props?.object || {});
  const isFaceLabPreview = object?.metadata?.source === "aos-card-catalog-preview" || String(object?.objectId || "").startsWith("preview-universal-007");

  return (
    <IXIAosDataContractCardAdapter
      {...props}
      object={object}
      minimumCustomFields={8}
      showBusinessIdentifier={false}
    >
      {contractProps => (
        <IXIAosCommercialEditorBridge object={contractProps.object} onSaveObject={contractProps.onSaveObject} persistenceAdapter={contractProps.hasPersistenceAdapter ? contractProps.onSaveObject : null} mediaEnabled>
          {({ object: runtimeObject }) => <IXIAosFace1CardRuntime cardNumber={7} object={runtimeObject} onSaveObject={contractProps.onSaveObject}>
          {face1 => {
            let CardLayout = IXIAosGenericUniversalLayout007;
            if (isFaceLabPreview && faceLabVariant === "007B") CardLayout = IXIAosGenericUniversalLayout007B;
            if (isFaceLabPreview && faceLabVariant === "007C") CardLayout = IXIAosGenericUniversalLayout007C;

            return (
              <IXIAosCardHeaderIdentity object={face1.object} className="u007-face-lab-variant-shell">
                {isFaceLabPreview ? (
                  <div className="u007-face-lab-variant-picker">
                    {["007A", "007B", "007C"].map(variant => (
                      <button key={variant} type="button" className={faceLabVariant === variant ? "active" : ""} onClick={() => setFaceLabVariant(variant)}>{variant}</button>
                    ))}
                  </div>
                ) : null}
                <CardLayout {...contractProps} object={face1.object} onSaveObject={face1.onSaveObject} />
                <style jsx>{`
                  .u007-face-lab-variant-picker{position:absolute;left:50%;top:-31px;z-index:500;display:flex;gap:4px;transform:translateX(-50%)}
                  .u007-face-lab-variant-picker button{height:23px;min-width:49px;padding:0 8px;border:1px solid rgba(255,255,255,.10);border-radius:4px;background:#111411;color:rgba(255,255,255,.46);font-size:10px;font-weight:800;letter-spacing:.03em;cursor:pointer}
                  .u007-face-lab-variant-picker button.active{border-color:rgba(255,196,0,.55);background:rgba(255,196,0,.10);color:#ffc400}
                `}</style>
              </IXIAosCardHeaderIdentity>
            );
          }}
          </IXIAosFace1CardRuntime>}
        </IXIAosCommercialEditorBridge>
      )}
    </IXIAosDataContractCardAdapter>
  );
}
