const { getIXIAccessToken, mutationOriginIsValid } = require("../../../lib/ixi-authority/ixiAuthorityProxy");
const { normalizeAdminCommand } = require("../../../lib/admin-daddy/AdminDaddyContracts");

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: { code: "METHOD_NOT_ALLOWED", message: "POST required." } });
  }

  if (!mutationOriginIsValid(req)) {
    return res.status(403).json({
      ok: false,
      error: { code: "ADMIN_DADDY_ORIGIN_DENIED", message: "Cross-origin Admin Daddy command denied." }
    });
  }

  if (!getIXIAccessToken(req)) {
    return res.status(401).json({
      ok: false,
      error: { code: "IXI_AUTHENTICATION_REQUIRED", message: "IXI authenticated session is required." }
    });
  }

  let command;
  try {
    command = normalizeAdminCommand(req.body || {});
  } catch (error) {
    return res.status(400).json({
      ok: false,
      error: { code: "ADMIN_DADDY_INVALID_COMMAND", message: error.message }
    });
  }

  // Closed by default. Each production command type must be explicitly registered
  // against IXI Authority and a canonical subsystem command adapter.
  if (command.commandType === "admin.foundation.ping") {
    return res.status(200).json({
      ok: true,
      command,
      result: { status: "accepted", message: "Admin Daddy command gateway is online." }
    });
  }

  return res.status(501).json({
    ok: false,
    command,
    error: {
      code: "ADMIN_DADDY_COMMAND_NOT_REGISTERED",
      message: `Admin Daddy command is not registered: ${command.commandType}`
    }
  });
}
