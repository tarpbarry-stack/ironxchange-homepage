import {
  fetchMosCardTemplates,
  fetchMosCardTemplate
} from "../../lib/mos/ixiMosClient";


export async function loadAosCardCatalog({
  entityId = null,
  signal = null
} = {}) {
  const payload =
    await fetchMosCardTemplates({
      entityId,
      signal
    });

  return {
    templates:
      Array.isArray(
        payload?.templates
      )
        ? payload.templates
        : [],

    count:
      Number(
        payload?.count || 0
      )
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
