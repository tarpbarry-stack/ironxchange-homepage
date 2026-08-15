import {
  useMemo,
  useState
} from "react";

import IXIAosObjectConsole
  from "../ixi-aos/console-runtime/IXIAosObjectConsole";

import IXIAosCard001Location
  from "../ixi-aos/cards/001/IXIAosCard001Location";

import IXIAosCard002Location
  from "../ixi-aos/cards/002/IXIAosCard002Location";

import IXIAosCard003Location
  from "../ixi-aos/cards/003/IXIAosCard003Location";

import {
  adaptAosCardTemplate
} from "../ixi-aos/card-runtime/IXIAosCardTemplateAdapter";

function clean(value) {
  return String(value || "").trim();
}

function createPreviewObject({ template = {}, sampleData = {} }) {
  const fields = sampleData?.fields && typeof sampleData.fields === "object" && !Array.isArray(sampleData.fields)
    ? sampleData.fields
    : {};

  const fieldDefinitions = Array.isArray(template?.fieldSchema)
    ? template.fieldSchema.map(field => ({
        fieldId: clean(field?.field || field?.fieldId),
        label: clean(field?.label),
        fieldType: clean(field?.type)
      })).filter(field => Boolean(field.fieldId))
    : [];

  return {
    objectId: clean(sampleData?.objectId) || "aos-card-catalog-preview",
    entityId: clean(sampleData?.entityId) || "aos-card-catalog-entity",
    objectType: clean(template?.baseObjectType) || "generic",
    templateType: clean(template?.baseObjectType) || "generic",
    templateSlug: clean(template?.templateSlug),
    templateVersion: Number(template?.version || 1),
    templateNumber: Number(template?.templateNumber || 0),
    displayName: clean(sampleData?.displayName) || clean(template?.label) || "AOS OBJECT",
    status: clean(sampleData?.status) || "active",
    value: sampleData?.value ?? null,
    currency: clean(sampleData?.currency) || "USD",
    fields,
    fieldDefinitions,
    relationships: Array.isArray(sampleData?.relationships) ? sampleData.relationships : [],
    infrastructure: Array.isArray(sampleData?.infrastructure) ? sampleData.infrastructure : [],
    media: Array.isArray(sampleData?.media) ? sampleData.media : [],
    capabilities: {
      ...(template?.capabilities && typeof template.capabilities === "object" ? template.capabilities : {})
    },
    metadata: {
      source: "aos-card-catalog-preview",
      ...(sampleData?.metadata && typeof sampleData.metadata === "object" ? sampleData.metadata : {})
    }
  };
}

function PreviewError({ title, detail }) {
  return (
    <div className="aos-card-preview-error">
      <strong>{title}</strong>
      <span>{detail}</span>
      <style jsx>{`
        .aos-card-preview-error {
          box-sizing: border-box;
          width: 298px;
          height: 471px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 24px;
          border: 1px solid rgba(255,255,255,.08);
          border-radius: 14px;
          background: #101010;
          text-align: center;
        }
        .aos-card-preview-error strong { color: #ffc400; font-size: 9px; font-weight: 950; }
        .aos-card-preview-error span { color: rgba(255,255,255,.42); font-size: 8px; font-weight: 800; }
      `}</style>
    </div>
  );
}

export default function IXIAosCardCatalogPreview({
  template = null,
  sampleData = {},
  projection = null,
  directItems = [],
  parentLabel = "",
  skinId = "ixi:skin:default"
}) {
  const [previewCardState, setPreviewCardState] = useState({});

  const object = useMemo(
    () => createPreviewObject({ template: template || {}, sampleData }),
    [template, sampleData]
  );

  const cardDefinition = useMemo(
    () => template ? adaptAosCardTemplate({ template, object }) : null,
    [template, object]
  );

  if (!template) {
    return <PreviewError title="NO CARD SELECTED" detail="Select a Card Template from the AOS Card Library." />;
  }

  function updatePreviewState(objectId, patch = {}) {
    const id = clean(objectId) || object.objectId;
    setPreviewCardState(current => ({
      ...current,
      [id]: {
        ...(current?.[id] || {}),
        ...patch
      }
    }));
  }

  const currentState = previewCardState[object.objectId] || {};
  const templateSlug = clean(template?.templateSlug);

  const sharedLocationProps = {
    object,
    projection,
    objects: Array.isArray(directItems) ? directItems : [],
    ixiState: currentState,
    onIxiStateChange: updatePreviewState,
    onAddObject: () => {},
    onHideObject: () => {},
    onDeleteObject: () => {},
    onOpenConsole: () => {},
    onRecall: () => {},
    onBoard: () => {},
    onReturn: () => {},
    onExposeObject: () => {}
  };

  if (
    templateSlug === "location-standard" ||
    templateSlug === "location-standard-002" ||
    templateSlug === "location-standard-003"
  ) {
    const LocationCard =
      templateSlug === "location-standard-003"
        ? IXIAosCard003Location
        : templateSlug === "location-standard-002"
          ? IXIAosCard002Location
          : IXIAosCard001Location;

    return (
      <div className="aos-card-catalog-console">
        <LocationCard {...sharedLocationProps} />
        <style jsx>{`
          .aos-card-catalog-console {
            position: relative;
            width: 298px;
            height: 471px;
            overflow: hidden;
          }
        `}</style>
      </div>
    );
  }

  if (!cardDefinition) {
    return <PreviewError title="CARD DEFINITION FAILED" detail={templateSlug || "Unknown template"} />;
  }

  return (
    <div className="aos-card-catalog-console generic">
      <IXIAosObjectConsole
        object={object}
        objectId={object.objectId}
        projection={projection}
        objects={Array.isArray(directItems) ? directItems : []}
        cardDefinition={cardDefinition}
        skinId={skinId}
        parentLabel={clean(parentLabel) || clean(template?.librarySection) || "AOS"}
        ixiCardState={{}}
        updateIxiCardState={null}
        previewCardState={currentState}
        updatePreviewCardState={updatePreviewState}
        renderModule={null}
        studioEditing={false}
        selectedModuleId=""
        onSelectModule={null}
        onSelectFace={null}
        onCreateFace={null}
        enableCardScaling={false}
        cardScaleMode="xl"
      />
      <style jsx>{`
        .aos-card-catalog-console.generic {
          position: relative;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          overflow: visible;
        }
      `}</style>
    </div>
  );
}
