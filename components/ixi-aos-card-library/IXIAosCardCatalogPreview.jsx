import IXIMosObjectCard
  from "../ixi-mos/IXIMosObjectCard";

import {
  getAosFaceRenderer
} from "../ixi-face-studio/IXIAosFaceRendererRegistry";


function clean(
  value
) {
  return String(
    value || ""
  ).trim();
}


function getPrimaryFace(
  template = {}
) {
  const faceSchema =
    Array.isArray(
      template?.faceSchema
    )
      ? template.faceSchema
      : [];

  return (
    faceSchema.find(
      face =>
        Number(face?.face) === 1
    ) ||
    faceSchema[0] ||
    null
  );
}


function createPreviewObject({
  template = {},
  sampleData = {}
}) {
  const fields =
    sampleData?.fields &&
    typeof sampleData.fields ===
      "object"
      ? sampleData.fields
      : {};

  return {
    objectId:
      clean(
        sampleData?.objectId
      ) ||
      "aos-card-catalog-preview",

    entityId:
      clean(
        sampleData?.entityId
      ) ||
      "aos-card-catalog-entity",

    objectType:
      clean(
        template?.baseObjectType
      ) ||
      "generic",

    templateType:
      clean(
        template?.baseObjectType
      ) ||
      "generic",

    templateSlug:
      clean(
        template?.templateSlug
      ),

    templateVersion:
      Number(
        template?.version || 1
      ),

    templateNumber:
      Number(
        template?.templateNumber || 0
      ),

    displayName:
      clean(
        sampleData?.displayName
      ) ||
      clean(
        template?.label
      ) ||
      "AOS OBJECT",

    status:
      clean(
        sampleData?.status
      ) ||
      "active",

    value:
      sampleData?.value ??
      null,

    currency:
      clean(
        sampleData?.currency
      ) ||
      "USD",

    fields,

    media:
      Array.isArray(
        sampleData?.media
      )
        ? sampleData.media
        : [],

    metadata: {
      creationState:
        clean(
          sampleData?.creationState
        ),

      source:
        "aos-card-catalog-preview",

      ...(
        sampleData?.metadata &&
        typeof sampleData.metadata ===
          "object"
          ? sampleData.metadata
          : {}
      )
    }
  };
}


function PreviewError({
  title,
  detail
}) {
  return (
    <div className="aos-card-preview-error">
      <strong>
        {title}
      </strong>

      <span>
        {detail}
      </span>

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

          border:
            1px solid
            rgba(255,255,255,.08);

          background:
            #101010;

          text-align: center;
        }

        .aos-card-preview-error strong {
          color:
            #ffc400;

          font-size:
            9px;

          font-weight:
            950;

          letter-spacing:
            .08em;

          text-transform:
            uppercase;
        }

        .aos-card-preview-error span {
          color:
            rgba(255,255,255,.42);

          font-size:
            8px;

          font-weight:
            800;

          line-height:
            1.45;
        }
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

  onAddChild = null,
  onSaveObject = null,
  onAddMedia = null,

  onExposeContents = null,
  onGatherContents = null,
  onReturnContents = null,

  onOpenConsole = null,
  onOpenMenu = null
}) {
  if (!template) {
    return (
      <PreviewError
        title="No Card Selected"
        detail="Select an AOS Card Template from the catalog."
      />
    );
  }

  const primaryFace =
    getPrimaryFace(
      template
    );

  if (!primaryFace) {
    return (
      <PreviewError
        title="No Face Registered"
        detail={
          `${clean(
            template?.templateSlug
          ) || "This template"} has no faceSchema entry.`
        }
      />
    );
  }

  const rendererSlug =
    clean(
      primaryFace?.rendererSlug
    );

  if (!rendererSlug) {
    return (
      <PreviewError
        title="Renderer Missing"
        detail="The selected face does not define rendererSlug."
      />
    );
  }

  const Renderer =
    getAosFaceRenderer(
      rendererSlug
    );

  if (!Renderer) {
    return (
      <PreviewError
        title="Renderer Not Registered"
        detail={
          rendererSlug
        }
      />
    );
  }

  const object =
    createPreviewObject({
      template,
      sampleData
    });

  const resolvedParentLabel =
    clean(
      parentLabel
    ) ||
    clean(
      template?.librarySection
    ) ||
    "AOS";

  return (
  <IXIMosObjectCard
    object={
      object
    }

    items={
      Array.isArray(
        directItems
      )
        ? directItems
        : []
    }

    projection={
      projection
    }

    parentLabel={
      resolvedParentLabel
    }

    ixiState={{
      face: 1,
      color: "none",
      outline: 1
    }}

    ixiCardState={{}}

    onIxiStateChange={() => {}}

    saved={
      false
    }

    armedDestination=""

    onSendFront={() => {}}
    onSendBack={() => {}}

    onCycleColor={() => {}}
    onCycleOutline={() => {}}

    onSendToArmedDestination={() => {}}

    onExposeObject={() => {}}

    onExposeContents={
      onExposeContents
    }

    onGatherContents={
      onGatherContents
    }

    onAddChild={
      onAddChild
    }

    onSaveName={
      onSaveObject
    }

    onDelete={null}

    onOpen={() => {}}

    onOpenConsole={
      onOpenConsole
    }

    onAddMedia={
      onAddMedia
    }

    renderIdentityFace={() => (
      <Renderer
        object={
          object
        }

        parentLabel={
          resolvedParentLabel
        }

        projection={
          projection
        }

        directItems={
          Array.isArray(
            directItems
          )
            ? directItems
            : []
        }

        onAddChild={
          onAddChild
        }

        onSaveLocation={
          onSaveObject
        }

        onSaveObject={
          onSaveObject
        }

        onAddMedia={
          onAddMedia
        }

        onExposeContents={
          onExposeContents
        }

        onGatherContents={
          onGatherContents
        }

        onReturnContents={
          onReturnContents
        }

        onOpenConsole={
          onOpenConsole
        }

        onOpenMenu={
          onOpenMenu
        }
      />
    )}
  />
);
}
