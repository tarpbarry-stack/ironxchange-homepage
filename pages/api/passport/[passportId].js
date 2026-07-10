// /pages/api/passport/[passportId].js

const IX_CORE_BASE_URL =
  process.env.IX_CORE_BASE_URL || "http://3.131.46.49:4100";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({
      ok: false,
      error: "Method not allowed"
    });
  }

  const { passportId } = req.query;

  if (!passportId) {
    return res.status(400).json({
      ok: false,
      error: "passportId is required"
    });
  }

  try {
    const response = await fetch(
      `${IX_CORE_BASE_URL}/passport/${encodeURIComponent(passportId)}`
    );

    const payload = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        ok: false,
        error: payload?.error || "Passport lookup failed"
      });
    }

    return res.status(200).json({
      ok: true,
      passport: payload.passport || payload.result || payload
    });
  } catch (error) {
    console.error("PASSPORT LOOKUP API ERROR:", error);

    return res.status(500).json({
      ok: false,
      error: error.message || "Passport lookup failed"
    });
  }
}
