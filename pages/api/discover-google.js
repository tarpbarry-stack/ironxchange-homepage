function cleanNameFromUrl(url) {
  return url
    .replace("https://", "")
    .replace("http://", "")
    .replace("www.", "")
    .split("/")[0]
    .replace(".com", "")
    .replace(/[-_]/g, " ")
    .toUpperCase();
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      message: "Method not allowed"
    });
  }

  const searches = [
    "https://www.google.com/search?q=used+equipment+dealer+texas",
    "https://www.google.com/search?q=heavy+equipment+dealer+oklahoma",
    "https://www.google.com/search?q=crane+dealer+texas",
    "https://www.google.com/search?q=forklift+dealer+dallas"
  ];

  const targets = searches.map((search) => ({
    company: cleanNameFromUrl(search),
    website: search,
    category: "Google Discovery",
    state: "US"
  }));

  return res.status(200).json({
    success: true,
    message: `Prepared ${targets.length} Google discovery targets.`,
    targets
  });
}
