const integrationSdk = require("sharetribe-flex-integration-sdk");

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const sdk = integrationSdk.createInstance({
      clientId: process.env.SHARETRIBE_CLIENT_ID,
      clientSecret: process.env.SHARETRIBE_CLIENT_SECRET
    });

    return res.status(200).json({
      success: true,
      integrationSdkLoaded: !!sdk
    });

  } catch (err) {
    return res.status(500).json({
      error: err?.message || "Integration SDK failed"
    });
  }
}
