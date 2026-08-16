import {
  fetchMosCardTemplates,
  fetchMosCardTemplate
} from "../../lib/mos/ixiMosClient";

function clean(value) {
  return String(value || "").trim();
}

function withLocalCardDrafts(templates = []) {
  const source = (Array.isArray(templates) ? templates : [])
    .map(template => {
      const slug = clean(template?.templateSlug);

      if (slug === "location-standard") {
        return {
          ...template,
          templateNumber: 1,
          version: 12,
          metadata: {
            ...(template?.metadata || {}),
            cardLocked: true,
            lockedCardId: "001-v12"
          }
        };
      }

      return template;
    });

  const baseLocation = source.find(
    template => clean(template?.templateSlug) === "location-standard"
  );

  if (baseLocation) {
    [
      { templateNumber: 2, templateSlug: "location-standard-002" },
      { templateNumber: 3, templateSlug: "location-standard-003" }
    ].forEach(draft => {
      const exists = source.some(
        template => clean(template?.templateSlug) === draft.templateSlug
      );

      if (exists) return;

      source.push({
        ...baseLocation,
        templateNumber: draft.templateNumber,
        templateSlug: draft.templateSlug,
        label: "Location",
        version: 12,
        metadata: {
          ...(baseLocation?.metadata || {}),
          cardLocked: false,
          localCardDraft: true,
          derivedFrom: "001-v12"
        }
      });
    });
  }

  const containerDrafts = [
    {
      templateNumber: 4,
      templateSlug: "personnel-container-004",
      variant: "summary"
    },
    {
      templateNumber: 5,
      templateSlug: "personnel-container-005",
      variant: "analytic"
    },
    {
      templateNumber: 6,
      templateSlug: "personnel-container-006",
      variant: "dashboard"
    }
  ];

  containerDrafts.forEach(draft => {
    const exists = source.some(
      template => clean(template?.templateSlug) === draft.templateSlug
    );

    if (exists) return;

    source.push({
      templateNumber: draft.templateNumber,
      templateSlug: draft.templateSlug,
      label: `Container Layout ${String(draft.templateNumber).padStart(3, "0")}`,
      librarySection: "Generic Containers · Personnel Sample",
      baseObjectType: "customer-defined-container",
      version: 12,
      fieldSchema: [],
      capabilities: {
        canContain: true,
        canCreate: true,
        canOpenStack: true,
        canMoveToBoard: true,
        canTransact: true,
        editable: true,
        hasConsole: true
      },
      metadata: {
        localCardDraft: true,
        visualLanguage: "v12",
        variant: draft.variant,
        sampleUse: "personnel"
      }
    });
  });

  const layout007Exists = source.some(
    template => clean(template?.templateSlug) === "employee-basic-007"
  );

  if (!layout007Exists) {
    source.push({
      templateNumber: 7,
      templateSlug: "employee-basic-007",
      label: "Object Layout 007",
      librarySection: "Generic Objects · Personnel Sample",
      baseObjectType: "customer-defined-object",
      version: 12,
      fieldSchema: [],
      capabilities: {
        canContain: true,
        canCreate: true,
        canOpenStack: true,
        canMoveToBoard: true,
        canTransact: true,
        editable: true,
        hasConsole: true
      },
      metadata: {
        localCardDraft: true,
        cardNumber: "007",
        visualLanguage: "v12",
        sampleUse: "personnel"
      }
    });
  }

  return source;
}

export async function loadAosCardCatalog({
  entityId = null,
  signal = null
} = {}) {
  const payload = await fetchMosCardTemplates({
    entityId,
    signal
  });

  const templates = withLocalCardDrafts(
    payload?.templates || []
  );

  return {
    templates,
    count: templates.length
  };
}

export async function loadAosCardTemplate({
  templateSlug,
  version = null,
  entityId = null,
  signal = null
}) {
  const payload = await fetchMosCardTemplate({
    templateSlug,
    version,
    entityId,
    signal
  });

  return payload?.template || null;
}
