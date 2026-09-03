import { resolveAosBrowserSession } from "../../../lib/server/aos/resolveAosBrowserSession";
import { requestIxCoreMos, resolveIxCoreAosContext } from "../../../lib/server/aos/ixiMosInternalClient";

function clean(value) { return String(value ?? "").trim(); }
function lower(value) { return clean(value).toLowerCase(); }
function objectId(object = {}) { return clean(object.objectId || object.id || object.uuid); }
function passportId(object = {}) { return clean(object.passportId || object.passport?.passportId || object.metadata?.passportId); }
function displayName(object = {}) { return clean(object.displayName || object.label || object.name || object.title || object.definitionKey || objectId(object)); }
function searchable(object = {}) {
  return lower([
    objectId(object), passportId(object), displayName(object), object.definitionId, object.definitionKey,
    object.objectType, object.businessIdentifiers && JSON.stringify(object.businessIdentifiers),
    object.identities && JSON.stringify(object.identities), object.fields && JSON.stringify(object.fields)
  ].filter(Boolean).join(" "));
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ ok: false, error: { code: "METHOD_NOT_ALLOWED", message: "GET required." } });
  }

  const q = clean(req.query.q);
  if (q.length < 2) return res.status(200).json({ ok: true, query: q, results: [] });

  try {
    const session = await resolveAosBrowserSession(req, res);
    const context = await resolveIxCoreAosContext({ session });
    const [objectsPayload, jobsPayload] = await Promise.all([
      requestIxCoreMos({ path: `/entities/${encodeURIComponent(context.entityId)}/objects?status=active`, principalId: context.userId, entityId: context.entityId }),
      requestIxCoreMos({ path: `/imports/jobs?entityId=${encodeURIComponent(context.entityId)}`, principalId: context.userId, entityId: context.entityId }).catch(() => ({ jobs: [] }))
    ]);

    const needle = lower(q);
    const objects = (Array.isArray(objectsPayload?.objects) ? objectsPayload.objects : [])
      .filter(object => searchable(object).includes(needle))
      .slice(0, 40)
      .map(object => ({ resultType: "object", id: objectId(object), passportId: passportId(object), label: displayName(object), subtitle: clean(object.definitionKey || object.objectType || object.definitionId), status: clean(object.status || "active"), source: "aos", deepLink: `/aos/work?objectId=${encodeURIComponent(objectId(object))}` }));

    const jobs = (Array.isArray(jobsPayload?.jobs) ? jobsPayload.jobs : [])
      .filter(job => lower(JSON.stringify({ jobId: job.jobId, status: job.status, sourceFile: job.sourceFile, definitionKey: job.definitionKey })).includes(needle))
      .slice(0, 20)
      .map(job => ({ resultType: "job", id: clean(job.jobId), passportId: "", label: clean(job.sourceFile?.name || job.jobId), subtitle: clean(job.definitionKey || "AOS Import Job"), status: clean(job.status), source: "aos-import", deepLink: "" }));

    return res.status(200).json({ ok: true, query: q, entityId: context.entityId, results: [...objects, ...jobs].slice(0, 50) });
  } catch (error) {
    return res.status(Number(error?.status || 500)).json({ ok: false, error: { code: error?.code || "ADMIN_DADDY_SEARCH_FAILED", message: error?.message || "Admin Daddy search failed." } });
  }
}
