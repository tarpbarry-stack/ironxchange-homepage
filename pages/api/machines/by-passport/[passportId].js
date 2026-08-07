// /pages/api/media/machines/[machineKey].js

const IX_CORE_BASE_URL =
  process.env.IX_CORE_BASE_URL ||
  "http://3.131.46.49:4100";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({
      ok: false,
      error: "Method not allowed"
    });
  }

  const machineKey =
    typeof req.query.machineKey === "string"
      ? req.query.machineKey.trim()
      : "";

  if (!machineKey) {
    return res.status(400).json({
      ok: false,
      error: "Missing machine key"
    });
  }

  try {
    const response = await fetch(
      `${IX_CORE_BASE_URL}/media/machines/${encodeURIComponent(machineKey)}`
    );

    const text = await response.text();

    let payload;

    try {
      payload = JSON.parse(text);
    } catch {
      return res.status(502).json({
        ok: false,
        error: "IX-Core returned invalid JSON",
        upstreamStatus: response.status,
        upstreamBody: text.slice(0, 500)
      });
    }

    return res.status(response.status).json(payload);
  } catch (error) {
    console.error("IXI MEDIA MANIFEST PROXY FAILED:", error);

    return res.status(500).json({
      ok: false,
      error:
        error?.message ||
        "Unable to read IXI machine media"
    });
  }
}
