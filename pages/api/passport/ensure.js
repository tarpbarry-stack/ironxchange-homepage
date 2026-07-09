// /pages/api/passport/ensure.js

const IX_CORE_BASE_URL =
  process.env.IX_CORE_BASE_URL || "http://3.131.46.49:4100";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      ok: false,
      error: "Method not allowed"
    });
  }

  try {
    const response = await fetch(`${IX_CORE_BASE_URL}/passport/ensure`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(req.body || {})
    });

    const payload = await response.json();

    return res.status(response.status).json(payload);
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error.message
    });
  }
}
