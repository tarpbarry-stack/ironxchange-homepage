import {
  fetchMosCardTemplates,
  fetchMosCardTemplate
} from "../../lib/mos/ixiMosClient";


function clean(value) {
  return String(value || "").trim();
}


function withLocalCardDrafts(templates = []) {
  const source =
    (Array.isArray(templates) ? templates : [])
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


  const baseLocation =
    source.find(
      template =>
        clean(template?.templateSlug) ===
        "location-standard"
    );

  if (baseLocation) {
    [
      {
        templateNumber: 2,
        templateSlug: "location-standard-002"
      },
      {
        templateNumber: 3,
        templateSlug: "location-standard-003"
      }
    ].forEach(draft => {
      const exists =
        source.some(
          template =>
            clean(template?.templateSlug) ===
            draft.templateSlug
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


  const personnelDrafts = [
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

  personnelDrafts.forEach(draft => {
    const exists =
      source.some(
        template =>
          clean(template?.templateSlug) ===
          draft.templateSlug
      );

    if (exists) return;

    source.push({
      templateNumber: draft.templateNumber,
      templateSlug: draft.templateSlug,
      label: "Employees / Personnel Container",
      baseObjectType: "personnel-container",
      version: 12,
      fieldSchema: [],
      capabilities: {
        canContain: true,
        canOpenStack: true,
        canMoveToBoard: true
      },
      metadata: {
        localCardDraft: true,
        visualLanguage: "v12",
        variant: draft.variant
      }
    });
  });


  const employee007Exists =
    source.some(
      template =>
        clean(template?.templateSlug) ===
        "employee-basic-007"
    );

  if (!employee007Exists) {
    source.push({
      templateNumber: 7,
      templateSlug: "employee-basic-007",
      label: "Employee",
      librarySection: "Employees / Personnel",
      baseObjectType: "employee",
      version: 12,
      fieldSchema: [],
      capabilities: {
        canContain: false,
        canOpenStack: false,
        canMoveToBoard: true,
        canTransact: true
      },
      metadata: {
        localCardDraft: true,
        cardNumber: "007",
        visualLanguage: "v12",
        accessLevel: "basic",
        employeeCardFamily: true
      }
    });
  }


  return source;
}


export async function loadAosCardCatalog({
  entityId = null,
  signal = null
} = {}) {
  const payload =
    await fetchMosCardTemplates({
      entityId,
      signal
    });

  const templates =
    withLocalCardDrafts(
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
  const payload =
    await fetchMosCardTemplate({
      templateSlug,
      version,
      entityId,
      signal
    });

  return payload?.template || null;
}
