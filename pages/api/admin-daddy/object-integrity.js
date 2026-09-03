import { resolveAosBrowserSession } from "../../../lib/server/aos/resolveAosBrowserSession";
import { requestIxCoreMos, resolveIxCoreAosContext } from "../../../lib/server/aos/ixiMosInternalClient";
const { auditObjectIntegrity } = require("../../../lib/admin-daddy/AdminDaddyIntegrity");

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ ok: false, error: { code: "METHOD_NOT_ALLOWED", message: "GET required." } });
  }

  try {
    const session = await resolveAosBrowserSession(req, res);
    const context = await resolveIxCoreAosContext({ session });

    const [objectsPayload, definitionsPayload] = await Promise.all([
      requestIxCoreMos({
        path: `/entities/${encodeURIComponent(context.entityId)}/objects?status=active`,
        principalId: context.userId,
        entityId: context.entityId
      }),
      requestIxCoreMos({
        path: `/entities/${encodeURIComponent(context.entityId)}/object-definitions?status=active`,
        principalId: context.userId,
        entityId: context.entityId
      })
    ]);

    const objects = Array.isArray(objectsPayload?.objects) ? objectsPayload.objects : [];
    const definitions = Array.isArray(definitionsPayload?.definitions) ? definitionsPayload.definitions : [];
    const integrity = auditObjectIntegrity({ objects, definitions });

    return res.status(200).json({ ok: true, entityId: context.entityId, ...integrity });
  } catch (error) {
    return res.status(Number(error?.status || 500)).json({ ok: false, error: { code: error?.code || "ADMIN_DADDY_INTEGRITY_FAILED", message: error?.message || "Admin Daddy could not audit object integrity." } });
  }
}
