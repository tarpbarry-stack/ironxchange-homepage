import {
  resolveAosBrowserSession
} from "../../../../lib/server/aos/resolveAosBrowserSession";

import {
  resolveIxCoreAosContext
} from "../../../../lib/server/aos/ixiMosInternalClient";

function sendError(res, error) {
  const status = Number(error?.status || 500);
  return res.status(status >= 400 && status <= 599 ? status : 500).json({
    ok: false,
    error: {
      code: error?.code || "IXI_ONBOARDING_BOOTSTRAP_FAILED",
      message: error?.message || "IXI account setup could not be completed.",
      details: error?.details || null
    }
  });
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({
      ok: false,
      error: {
        code: "IXI_ONBOARDING_METHOD_NOT_ALLOWED",
        message: "Method not allowed."
      }
    });
  }

  try {
    const session = await resolveAosBrowserSession(req, res);
    const context = await resolveIxCoreAosContext({ session });

    return res.status(200).json({
      ok: true,
      onboarding: context.onboarding,
      environment: context.environment
    });
  } catch (error) {
    return sendError(res, error);
  }
}
