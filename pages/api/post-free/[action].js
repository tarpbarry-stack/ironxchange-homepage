import { types } from "sharetribe-flex-sdk";
import { resolveAosBrowserSession } from "../../../lib/server/aos/resolveAosBrowserSession";
import { requestIxCoreMos, resolveIxCoreAosContext } from "../../../lib/server/aos/ixiMosInternalClient";
import { normalizeOwnedMachineListing } from "../../../lib/server/onboarding/normalizeOwnedMachineListing";
import { startPostFreePosting, finalizePostFreePosting } from "../../../lib/server/onboarding/postFreePostingWorkflow";
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") { res.setHeader("Allow", "POST"); return res.status(405).json({ error: "Method not allowed" }); }
  try {
    const action = String(req.query.action || "");
    if (!["start", "resume", "revise", "list", "state", "prepare", "process", "finalize"].includes(action)) return res.status(404).json({ error: "Unknown posting action" });
    const session = await resolveAosBrowserSession(req, res);
    const context = await resolveIxCoreAosContext({ session });
    const core = (operation, body) => requestIxCoreMos({ path: `/aos/post-free/${operation}`, method: "POST",
      principalId: context.userId, entityId: context.entityId, body });
    const input = req.body || {};
    let result;
    if (["start", "resume", "revise"].includes(action)) {
      if (action === "revise") await core("revise", { operationId: input.operationId, files: input.files });
      const saved = action !== "start" ? (await core("state", { operationId: input.operationId })).row : null;
      result = await startPostFreePosting({ sdk: session.sdk, types, core, normalizeListing: normalizeOwnedMachineListing,
        input: saved ? { operationId: saved.operationId, payload: saved.payload, files: saved.files } :
          { operationId: input.operationId, payload: input.payload, files: input.files } });
    } else if (action === "finalize") result = await finalizePostFreePosting({ sdk: session.sdk, types, core,
      input: { operationId: input.operationId, heroImageId: input.heroImageId } });
    else result = await core(action, { operationId: input.operationId, photoId: input.photoId, rendition: input.rendition === true });
    if (action === "state" && result.ready && result.row?.listingId && !result.row.heroImageId) {
      const listing = (await session.sdk.ownListings.show({ id: new types.UUID(result.row.listingId) }))?.data?.data;
      const receipt = listing?.attributes?.privateData?.ixiPostFree;
      if (receipt?.operationId === result.row.operationId && receipt.heroImageId) result.row.heroImageId = receipt.heroImageId;
    }
    res.status(200).json({ ok: true, ...result });
  } catch (error) {
    const status = Number(error.status || 500);
    res.status(status >= 400 && status <= 599 ? status : 500).json({ ok: false, error: { code: error.code || "POST_FREE_FAILED", message: error.message || "Posting could not finish. Resume this posting." } });
  }
}
