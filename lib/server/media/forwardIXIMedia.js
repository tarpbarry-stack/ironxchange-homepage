import crypto from "crypto";
import { createInstance, tokenStore, types } from "sharetribe-flex-sdk";
import { resolveAosBrowserSession } from "../aos/resolveAosBrowserSession";
import { requestIxCoreMos, resolveExistingIxCoreAosContext } from "../aos/ixiMosInternalClient";
const base = () => (process.env.IX_CORE_BASE_URL || "http://3.131.46.49:4100").replace(/\/+$/, "");
export async function forwardIXIMedia(req, res, { action, path, method, body = {} }) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== method) { res.setHeader("Allow", method); return res.status(405).json({ ok: false, error: "Method not allowed" }); }
  try {
    const send = headers => fetch(`${base()}${path}`, { method, headers: { "Content-Type": "application/json", ...headers },
      ...(method === "GET" ? {} : { body: JSON.stringify(body) }), signal: AbortSignal.timeout(30000) });
    let response = await send();
    let payload = await response.json();
    if (payload?.error?.code !== "POST_FREE_GOVERNED_MEDIA_REQUIRED") return res.status(response.status).json(payload);
    if (action === "manifest" && payload.listingId) {
      // Fresh public visibility verification precedes each short-lived, key-bound
      // read ticket. No browser-supplied header or saved placement is authority.
      const sdk = createInstance({ clientId: process.env.NEXT_PUBLIC_SHARETRIBE_CLIENT_ID, tokenStore: tokenStore.memoryStore() });
      let listing;
      try { listing = (await sdk.listings.show({ id: new types.UUID(payload.listingId) }))?.data?.data; }
      catch (error) { if (![401,403,404].includes(Number(error.status || error.statusCode))) throw error; }
      const attributes = listing?.attributes;
      if (attributes?.state === "published" && attributes.publicData?.machineAccess === "public" && attributes.publicData?.machineChannel !== "private") {
        const secret = process.env.IXI_MOS_INTERNAL_SECRET;
        if (!secret) throw new Error("Media read authorization is not configured.");
        const expires = Date.now() + 30000;
        const signature = crypto.createHmac("sha256", secret).update(`ixi-media-read-v1\n${body.machineKey}\n${expires}`).digest("hex");
        response = await send({ "x-ixi-media-read-ticket": `${expires}.${signature}` });
        return res.status(response.status).json(await response.json());
      }
    }
    const session = await resolveAosBrowserSession(req, res);
    const context = await resolveExistingIxCoreAosContext({ session });
    payload = await requestIxCoreMos({ path: `/aos/post-free-media/${action}`, method: "POST",
      principalId: context.userId, entityId: context.entityId, body });
    return res.status(200).json(payload);
  } catch (error) {
    const status = Number(error.status || 502);
    return res.status(status >= 400 && status <= 599 ? status : 502).json({ ok: false, error: error.message || "Media request could not be verified." });
  }
}
