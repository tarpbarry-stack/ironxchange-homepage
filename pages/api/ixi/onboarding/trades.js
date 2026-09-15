import { types } from "sharetribe-flex-sdk";
import { resolveAosBrowserSession } from "../../../../lib/server/aos/resolveAosBrowserSession";
import {
  resolveIxCoreAosContext,
  requestIxCoreMos,
} from "../../../../lib/server/aos/ixiMosInternalClient";
import { normalizeOwnedMachineListing } from "../../../../lib/server/onboarding/normalizeOwnedMachineListing";
import {
  saveTradeMachine,
  finalizeTradeInventory,
} from "../../../../lib/server/onboarding/tradeMachineWorkflow";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (!["GET", "POST"].includes(req.method))
    return res.status(405).json({ error: "Method not allowed." });
  try {
    if (
      req.method === "POST" &&
      req.headers.origin &&
      new URL(req.headers.origin).host !== req.headers.host
    ) {
      return res.status(403).json({ error: "Same-origin request required." });
    }
    const session = await resolveAosBrowserSession(req, res);
    const context = await resolveIxCoreAosContext({ session });
    const core = (action, input) =>
      requestIxCoreMos({
        path: `/aos/trades/${action}`,
        method: "POST",
        principalId: context.userId,
        entityId: context.entityId,
        body: input,
      });
    const input = req.method === "GET" ? req.query : req.body;
    if (req.method === "GET" && input.mode === "existing") {
      const response = await session.sdk.ownListings.query({
        page: Math.max(1, Number(input.page) || 1),
        perPage: 50,
      });
      return res.json({
        listings: response.data.data.map((item) => ({
          ...normalizeOwnedMachineListing(item),
          publicData: item.attributes.publicData,
        })),
        meta: response.data.meta,
      });
    }
    if (req.method === "GET") {
      const result = await core("list", input);
      for (let index = 0; index < result.rows.length; index += 4) {
        await Promise.all(
          result.rows.slice(index, index + 4).map(async (row) => {
            if (!row.listingId) return;
            try {
              const listing = await session.sdk.ownListings.show({
                id: new types.UUID(row.listingId),
                include: ["images"],
              });
              row.listing = {
                id: row.listingId,
                ...listing.data.data.attributes,
                images: (listing.data.included || []).filter(
                  (item) => item.type === "image",
                ),
              };
            } catch {
              row.photoUnavailable = true;
            }
          }),
        );
      }
      return res.json(result);
    }
    const operation =
      input.action === "acquired" ? finalizeTradeInventory : saveTradeMachine;
    return res.json(
      await operation({
        sdk: session.sdk,
        types,
        core,
        normalizeListing: normalizeOwnedMachineListing,
        input,
      }),
    );
  } catch (error) {
    return res
      .status(
        [400, 401, 403, 404, 409, 422, 429].includes(error.status)
          ? error.status
          : 500,
      )
      .json({
        error:
          error.message || "Trade could not be saved. Retry the same trade.",
      });
  }
}
