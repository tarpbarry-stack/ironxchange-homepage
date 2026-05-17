import SharetribeSdk from "sharetribe-flex-sdk";

export default async function handler(req, res) {
  try {
    const sdk = SharetribeSdk.createInstance({
      clientId: process.env.NEXT_PUBLIC_SHARETRIBE_CLIENT_ID,
      clientSecret: process.env.SHARETRIBE_CLIENT_SECRET,
    });

    const response = await sdk.currentUser.show({
      include: ["profileImage"],
    });

    return res.status(200).json({
      ok: true,
      data: response.data,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error?.message || String(error),
    });
  }
}
