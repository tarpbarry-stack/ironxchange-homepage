import {
  fetchMosCardTemplates,
  fetchMosCardTemplate
} from "../../lib/mos/ixiMosClient";


function withLocalCardDrafts(
  templates = []
) {
  const source =
    Array.isArray(templates)
      ? [...templates]
      : [];

  const has002 =
    source.some(
      template =>
        String(
          template?.templateSlug || ""
        ).trim() ===
        "location-standard-002"
    );

  if (has002) {
    return source;
  }

  const baseLocation =
    source.find(
      template =>
        String(
          template?.templateSlug || ""
        ).trim() ===
        "location-standard"
    );

  if (!baseLocation) {
    return source;
  }

  source.push({
    ...baseLocation,
    templateNumber: 2,
    templateSlug:
      "location-standard-002",
    label:
      "Location",
    version: 12,
    metadata: {
      ...(baseLocation?.metadata || {}),
      localCardDraft: true,
      derivedFrom:
        "location-standard"
    }
  });

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
    count:
      templates.length
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

  return (
    payload?.template ||
    null
  );
}
