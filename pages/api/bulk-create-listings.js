const sharetribeSdk = require("sharetribe-flex-sdk");

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const clientId = process.env.SHARETRIBE_CLIENT_ID;

    return res.status(200).json({
      success: true,
      sdkLoaded: !!sharetribeSdk,
      clientIdExists: !!clientId
    });

  } catch (err) {
    return res.status(500).json({
      error: err?.message || "SDK load failed"
    });
  }
}
