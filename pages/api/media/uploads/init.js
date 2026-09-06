const IX_CORE_BASE_URL = process.env.IX_CORE_BASE_URL || "http://3.131.46.49:4100";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Method not allowed" });

  try {
    const response = await fetch(`${IX_CORE_BASE_URL}/media/uploads/init`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body || {})
    });
    const text = await response.text();
    let payload;
    try { payload = JSON.parse(text); }
    catch { return res.status(502).json({ ok: false, error: "IX Core returned invalid upload initialization data." }); }
    return res.status(response.status).json(payload);
  } catch (error) {
    console.error("IXI DIRECT MEDIA INIT PROXY FAILED:", error);
    return res.status(502).json({ ok: false, error: "IXI Media is unavailable. The Object was not changed." });
  }
}
