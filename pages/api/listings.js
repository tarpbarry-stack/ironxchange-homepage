export default async function handler(req, res) {
  try {
    const response = await fetch(
      "https://staging.ironxchange.com/s"
    );

    const html = await response.text();

    const listings = [];

    const matches = html.match(/<h3.*?>(.*?)<\/h3>/g);

    if (matches) {
      matches.forEach((m) => {
        const title = m.replace(/<[^>]+>/g, "");
        listings.push({
          title,
          type: "Equipment",
          hours: "",
          location: "",
          price: "Call",
          image: "/images/hero-equipment-yard.jpg",
          link: "https://staging.ironxchange.com/s"
        });
      });
    }

    res.status(200).json(listings);
  } catch (err) {
    res.status(500).json({ error: "failed" });
  }
}
