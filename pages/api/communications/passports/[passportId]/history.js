import { createInstance, types } from "sharetribe-flex-integration-sdk";

import resolveAosBrowserSession from "../../../../../lib/server/aos/resolveAosBrowserSession";
import { requestIxCorePassportCommunicationHistory } from "../../../../../lib/server/email/ixiPassportEmailClient.mjs";

function clean(value) { return String(value ?? "").trim(); }

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, private");
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ ok: false, error: "GET required." });
  }
  try {
    const session = await resolveAosBrowserSession(req, res);
    const passportId = clean(req.query.passportId).toUpperCase();
    const listingId = clean(req.query.listingId);
    if (!passportId || !/^[A-Za-z0-9-]{8,80}$/u.test(listingId)) {
      return res.status(400).json({ ok: false, error: "Passport and listing are required." });
    }
    const clientId = process.env.SHARETRIBE_CLIENT_ID;
    const clientSecret = process.env.SHARETRIBE_CLIENT_SECRET;
    if (!clientId || !clientSecret) throw Object.assign(new Error("Listing authority is not configured."), { status: 503 });
    const sdk = createInstance({ clientId, clientSecret });
    const response = await sdk.listings.show({ id: new types.UUID(listingId) });
    const listing = response?.data?.data;
    const authorId = clean(listing?.relationships?.author?.data?.id?.uuid || listing?.relationships?.author?.data?.id);
    const recordedPassportId = clean(listing?.attributes?.publicData?.passportId).toUpperCase();
    if (!authorId || authorId !== clean(session.userId)) {
      return res.status(403).json({ ok: false, error: "Communication history is available only to the machine owner." });
    }
    if (!recordedPassportId || recordedPassportId !== passportId) {
      return res.status(409).json({ ok: false, error: "The listing does not match this Passport." });
    }
    const payload = await requestIxCorePassportCommunicationHistory({
      passportId,
      principalId: session.userId,
      limit: req.query.limit
    });
    return res.status(200).json(payload);
  } catch (error) {
    return res.status(error?.status || 502).json({
      ok: false,
      code: error?.code || "IXI_COMMUNICATION_HISTORY_FAILED",
      error: error?.message || "Communication history could not be loaded."
    });
  }
}
