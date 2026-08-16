import { useEffect, useMemo, useState } from "react";

import IXIAosCommandAwareObjectConsole from "../ixi-aos/console-runtime/IXIAosCommandAwareObjectConsole";
import IXIAosLocationObjectConsole from "../ixi-aos/console-runtime/IXIAosLocationObjectConsole";
import IXITransactObjectConsole from "../ixi-aos/transact/IXITransactObjectConsole";

import IXIAosCard004Personnel from "../ixi-aos/cards/004/IXIAosCard004Personnel";
import IXIAosCard005Personnel from "../ixi-aos/cards/005/IXIAosCard005Personnel";
import IXIAosCard006Personnel from "../ixi-aos/cards/006/IXIAosCard006Personnel";
import IXIAosCard007EmployeeApplication from "../ixi-aos/cards/007/IXIAosCard007EmployeeApplication";

import { adaptAosCardTemplate } from "../ixi-aos/card-runtime/IXIAosCardTemplateAdapter";

function clean(value) {
  return String(value || "").trim();
}

function safeObject(value) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value
    : {};
}

function previewObject(template = {}, sample = {}) {
  const sampleFields = safeObject(sample?.fields);
  const templateFieldSchema = Array.isArray(template?.fieldSchema)
    ? template.fieldSchema
    : [];

  const sampleFieldDefinitions = Array.isArray(sample?.fieldDefinitions)
    ? sample.fieldDefinitions
    : [];

  const fieldDefinitions = sampleFieldDefinitions.length
    ? sampleFieldDefinitions
    : templateFieldSchema
        .map(item => ({
          ...item,
          fieldId: clean(item?.fieldId || item?.field),
          label: clean(item?.label),
          fieldType: clean(item?.fieldType || item?.type),
          presentationRole: clean(
            item?.presentationRole ||
            item?.semanticRole ||
            item?.presentation?.role
          )
        }))
        .filter(item => item.fieldId);

  return {
    ...sample,
    objectId: clean(sample?.objectId) || "aos-card-catalog-preview",
    entityId: clean(sample?.entityId) || "aos-card-catalog-entity",
    objectType: clean(sample?.objectType) || clean(template?.baseObjectType) || "generic",
    templateType: clean(template?.baseObjectType) || clean(sample?.templateType) || "generic",
    templateSlug: clean(template?.templateSlug),
    templateVersion: Number(template?.version || 1),
    templateNumber: Number(template?.templateNumber || 0),
    displayName: clean(sample?.displayName) || clean(template?.label) || "AOS OBJECT",
    singularLabel: clean(sample?.singularLabel),
    pluralLabel: clean(sample?.pluralLabel),
    status: clean(sample?.status) || "active",
    value: sample?.value ?? null,
    currency: clean(sample?.currency) || "USD",
    fields: sampleFields,
    fieldDefinitions,
    relationships: Array.isArray(sample?.relationships) ? sample.relationships : [],
    infrastructure: Array.isArray(sample?.infrastructure) ? sample.infrastructure : [],
    media: Array.isArray(sample?.media) ? sample.media : [],
    presentation: {
      ...safeObject(template?.presentation),
      ...safeObject(sample?.presentation)
    },
    capabilities: {
      ...safeObject(template?.capabilities),
      ...safeObject(sample?.capabilities)
    },
    permissions: {
      ...safeObject(template?.permissions),
      ...safeObject(sample?.permissions)
    },
    effectivePermissions: {
      ...safeObject(template?.effectivePermissions),
      ...safeObject(sample?.effectivePermissions)
    },
    metadata: {
      source: "aos-card-catalog-preview",
      ...safeObject(sample?.metadata)
    }
  };
}

function resolveCatalogCardNumber(template = {}) {
  const direct = Number(
    template?.templateNumber ||
    template?.metadata?.cardNumber ||
    0
  );

  if (Number.isFinite(direct) && direct > 0) return direct;

  const match = clean(template?.templateSlug)
    .match(/(?:^|[-_])(\d{3})(?:$|[-_])/);

  return match ? Number(match[1]) : 0;
}

function getFaceConfig(object = {}, faceNumber = 1) {
  const faces = object?.presentation?.faces;

  if (Array.isArray(faces)) {
    return safeObject(
      faces.find(item => Number(item?.face || item?.faceNumber || item?.index) === Number(faceNumber))
    );
  }

  if (faces && typeof faces === "object") {
    return safeObject(faces[String(faceNumber)] || faces[faceNumber]);
  }

  return {};
}

function getFaceLabel(object = {}, faceNumber = 1) {
  if (faceNumber === 1) return "OVERVIEW";
  const config = getFaceConfig(object, faceNumber);
  return clean(config?.shortLabel || config?.title || config?.label) || `FACE ${faceNumber}`;
}

export default function IXIAosCardCatalogPreview({
  template = null,
  sampleData = {},
  projection = null,
  directItems = [],
  parentLabel = "",
  skinId = "ixi:skin:default",
  onSaveObject = null
}) {
  const [state, setState] = useState({});
  const [face, setFace] = useState(1);
  const [transactOpen, setTransactOpen] = useState(false);
  const [previewObjectOverride, setPreviewObjectOverride] = useState(null);

  const baseObject = useMemo(
    () => previewObject(template || {}, sampleData),
    [template, sampleData]
  );

  useEffect(() => {
    setPreviewObjectOverride(null);
    setTransactOpen(false);
    setFace(1);
  }, [template?.templateSlug, sampleData]);

  const object = previewObjectOverride || baseObject;

  const definition = useMemo(
    () => template ? adaptAosCardTemplate({ template, object }) : null,
    [template, object]
  );

  if (!template) {
    return <div className="preview-error">NO CARD SELECTED</div>;
  }

  function update(id, patch = {}) {
    const key = clean(id) || object.objectId;
    setState(current => ({
      ...current,
      [key]: {
        ...(current[key] || {}),
        ...patch
      }
    }));
  }

  async function savePreview(payload = {}) {
    const next = payload?.object && typeof payload.object === "object"
      ? payload.object
      : {
          ...object,
          displayName: payload?.displayName ?? object.displayName,
          fields: payload?.fields ?? object.fields,
          media: payload?.media ?? object.media
        };

    setPreviewObjectOverride(next);
    await onSaveObject?.(payload);
    return next;
  }

  const current = state[object.objectId] || {};
  const cardNumber = resolveCatalogCardNumber(template);

  const ContainerCard =
    cardNumber === 4
      ? IXIAosCard004Personnel
      : cardNumber === 5
        ? IXIAosCard005Personnel
        : cardNumber === 6
          ? IXIAosCard006Personnel
          : null;

  if (transactOpen) {
    return (
      <div className="native-card-preview">
        <IXITransactObjectConsole
          object={object}
          ixiState={current}
          onIxiStateChange={update}
          onClose={() => setTransactOpen(false)}
        />
        <style jsx>{`.native-card-preview{position:relative;width:298px;height:471px}`}</style>
      </div>
    );
  }

  if (ContainerCard) {
    return (
      <div className="native-card-preview">
        <ContainerCard
          object={object}
          children={Array.isArray(directItems) ? directItems : []}
          ixiState={current}
          onIxiStateChange={update}
          onSaveObject={savePreview}
          onOpenTransact={() => setTransactOpen(true)}
          skinId="v12"
        />
        <style jsx>{`.native-card-preview{position:relative;width:298px;height:471px}`}</style>
      </div>
    );
  }

  if (cardNumber === 7) {
    return (
      <div className="native-card-preview">
        <IXIAosCard007EmployeeApplication
          object={object}
          ixiState={current}
          onIxiStateChange={update}
          onSaveObject={savePreview}
          onOpenTransact={() => setTransactOpen(true)}
          skinId="v12"
        />
        <style jsx>{`.native-card-preview{position:relative;width:298px;height:471px}`}</style>
      </div>
    );
  }

  if ([1, 2, 3].includes(cardNumber)) {
    const faceNumbers = [1, 2, 3, 4, 5];
    const consoleDepth = Math.max(1, Number(current?.consoleDepth || 1));

    return (
      <div className="numbered-container-preview" style={{ width: `${consoleDepth * 298}px` }}>
        <div className="face-switch">
          {faceNumbers.map(faceNumber => (
            <button key={faceNumber} type="button" className={face === faceNumber ? "active" : ""} onClick={() => setFace(faceNumber)}>
              <b>F{faceNumber}</b>
              <small>{getFaceLabel(object, faceNumber)}</small>
            </button>
          ))}
        </div>

        <div className="console-stage">
          <IXIAosLocationObjectConsole
            cardNumber={cardNumber}
            object={object}
            projection={projection}
            objects={Array.isArray(directItems) ? directItems : []}
            ixiState={current}
            onIxiStateChange={update}
            onSaveObject={savePreview}
            primaryFace={face}
            onPrimaryFaceChange={setFace}
            onOpenTransact={() => setTransactOpen(true)}
          />
        </div>

        <style jsx>{`
          .numbered-container-preview{display:flex;flex-direction:column;gap:7px;overflow:visible}.face-switch{width:298px;height:35px;display:grid;grid-template-columns:repeat(5,1fr);gap:3px;padding:3px;border:1px solid #292d2b;border-radius:8px;background:#0d0f0e}.face-switch button{height:27px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;padding:2px 3px;border:1px solid transparent;border-radius:5px;background:transparent;color:#777}.face-switch b{font-size:6px}.face-switch small{max-width:100%;overflow:hidden;font-size:4.2px;font-weight:850;text-overflow:ellipsis;white-space:nowrap}.face-switch .active{border-color:rgba(255,196,0,.52);background:rgba(255,196,0,.07);color:#ffc400}.console-stage{position:relative;display:flex;width:298px;height:471px;overflow:visible}
        `}</style>
      </div>
    );
  }

  if (!definition) {
    return <div className="preview-error">CARD DEFINITION FAILED</div>;
  }

  return (
    <div className="generic-preview">
      <IXIAosCommandAwareObjectConsole
        object={object}
        objectId={object.objectId}
        projection={projection}
        objects={directItems}
        cardDefinition={definition}
        skinId={skinId}
        parentLabel={clean(parentLabel) || clean(template.librarySection) || "AOS"}
        ixiCardState={{}}
        updateIxiCardState={null}
        previewCardState={current}
        updatePreviewCardState={update}
        renderModule={null}
        studioEditing={false}
        selectedModuleId=""
        onSelectModule={null}
        onSelectFace={null}
        onCreateFace={null}
        enableCardScaling={false}
        cardScaleMode="xl"
        onOpenTransact={() => setTransactOpen(true)}
      />
    </div>
  );
}
