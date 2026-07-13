// /pages/api/media/jobs/[jobId].js

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

  const jobId =
    typeof req.query.jobId === "string"
      ? req.query.jobId.trim()
      : "";

  if (!jobId) {
    return res.status(400).json({
      ok: false,
      error: "Missing media job ID"
    });
  }

  try {
    const response = await fetch(
      `${IX_CORE_BASE_URL}/media/jobs/${encodeURIComponent(jobId)}`
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
    console.error("IXI MEDIA JOB STATUS PROXY FAILED:", error);

    return res.status(500).json({
      ok: false,
      error:
        error?.message ||
        "Unable to read IXI media job"
    });
  }
}
