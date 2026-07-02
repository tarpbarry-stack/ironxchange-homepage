export async function fetchSandhillsHtml(url = "") {
  const apiKey = process.env.BROWSERLESS_API_KEY;

  if (!apiKey) {
    throw new Error("Sandhills browser fetch not configured.");
  }

  const response = await fetch(
    `https://production-sfo.browserless.io/content?token=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        url,
        gotoOptions: {
          waitUntil: "networkidle2",
          timeout: 45000
        }
      })
    }
  );

  if (!response.ok) {
    throw new Error(`Sandhills browser fetch failed: ${response.status}`);
  }

  return response.text();
}
