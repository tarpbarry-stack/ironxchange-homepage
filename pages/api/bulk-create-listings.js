const integrationSdk = require("sharetribe-flex-integration-sdk");
const sharetribeSdk = require("sharetribe-flex-sdk");

const { UUID, Money } = sharetribeSdk.types;

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

    const testUuid = new UUID(
      "11111111-1111-1111-1111-111111111111"
    );

    const testMoney = new Money(
      28500000,
      "USD"
    );

    return res.status(200).json({
      success: true,
      integrationSdkLoaded: !!sdk,
      uuidWorks: !!testUuid,
      moneyWorks: !!testMoney
    });

  } catch (err) {
    return res.status(500).json({
      error: err?.message || "Money failed"
    });
  }
}
