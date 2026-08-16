import {
  fetchMosCardTemplates,
  fetchMosCardTemplate
} from "../../lib/mos/ixiMosClient";

function clean(value) {
  return String(value || "").trim();
}

function genericContainerCapabilities(source = {}) {
  return {
    ...(source || {}),
    canContain: source?.canContain !== false,
    canCreate: source?.canCreate !== false,
    canOpenStack: source?.canOpenStack !== false,
    canMoveToBoard: source?.canMoveToBoard !== false,
    canTransact: source?.canTransact !== false,
    editable: source?.editable !== false,
    hasConsole: source?.hasConsole !== false,
    hasRail: source?.hasRail !== false,
    hasRelationships: source?.hasRelationships !== false
  };
}

function withLocalCardDrafts(templates = []) {
  const source = (Array.isArray(templates) ? templates : []).map(template => {
    const slug = clean(template?.templateSlug);

    if (slug === "location-standard") {
      return {
        ...template,
        templateNumber: 1,
        label: "Container Layout 001",
        librarySection: "AOS CONTAINER LAYOUTS",
        baseObjectType: "customer-defined-container",
        version: 12,
        capabilities: genericContainerCapabilities(template?.capabilities || {}),
        metadata: {
          ...(template?.metadata || {}),
          cardLocked: true,
          lockedCardId: "001-v12",
          renderer: "schema-driven-generic",
          sampleUse: "location"
        }
      };
    }

    return template;
  });

  const base001 = source.find(
    template => clean(template?.templateSlug) === "location-standard"
  );

  if (base001) {
    [
      { templateNumber: 2, templateSlug: "location-standard-002" },
      { templateNumber: 3, templateSlug: "location-standard-003" }
    ].forEach(draft => {
      const exists = source.some(
        template => clean(template?.templateSlug) === draft.templateSlug
      );
      if (exists) return;

      source.push({
        ...base001,
        templateNumber: draft.templateNumber,
        templateSlug: draft.templateSlug,
        label: `Container Layout ${String(draft.templateNumber).padStart(3, "0")}`,
        librarySection: "AOS CONTAINER LAYOUTS",
        baseObjectType: "customer-defined-container",
        version: 12,
        capabilities: genericContainerCapabilities(base001?.capabilities || {}),
        metadata: {
          ...(base001?.metadata || {}),
          cardLocked: false,
          localCardDraft: true,
          renderer: "schema-driven-generic",
          derivedFrom: "001-v12",
          sampleUse: "location"
        }
      });
    });
  }

  [
    { templateNumber: 4, templateSlug: "personnel-container-004", variant: "summary" },
    { templateNumber: 5, templateSlug: "personnel-container-005", variant: "analytic" },
    { templateNumber: 6, templateSlug: "personnel-container-006", variant: "dashboard" }
  ].forEach(draft => {
    const exists = source.some(
      template => clean(template?.templateSlug) === draft.templateSlug
    );
    if (exists) return;

    source.push({
      templateNumber: draft.templateNumber,
      templateSlug: draft.templateSlug,
      label: `Container Layout ${String(draft.templateNumber).padStart(3, "0")}`,
      librarySection: "AOS CONTAINER LAYOUTS",
      baseObjectType: "customer-defined-container",
      version: 12,
      fieldSchema: [],
      capabilities: genericContainerCapabilities({}),
      metadata: {
        localCardDraft: true,
        visualLanguage: "v12",
        renderer: "schema-driven-generic",
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
      librarySection: "AOS OBJECT LAYOUTS",
      baseObjectType: "customer-defined-object",
      version: 12,
      fieldSchema: [],
      capabilities: genericContainerCapabilities({}),
      metadata: {
        localCardDraft: true,
        cardNumber: "007",
        visualLanguage: "v12",
        renderer: "schema-driven-generic",
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
  const payload = await fetchMosCardTemplates({ entityId, signal });
  const templates = withLocalCardDrafts(payload?.templates || []);
  return { templates, count: templates.length };
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
