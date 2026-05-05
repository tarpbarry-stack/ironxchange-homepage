export default async function handler(req, res) {
  try {
    const response = await fetch(
      "https://flex-api.sharetribe.com/v1/integration_api/listings/query",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.SHARETRIBE_API_KEY}`,
        },
        body: JSON.stringify({
          perPage: 20,
          pub_status: "published",
        }),
      }
    );

    const data = await response.json();

    if (!data.data) {
      return res.status(200).json([]);
    }

    const listings = data.data.map((item) => {
      const attrs = item.attributes;

      return {
        title: attrs.title || "Equipment",
        type: "Equipment",
        hours: "",
        location: "",
        price: "Call",
        image: "/images/hero-equipment-yard.jpg",
        link: `https://staging.ironxchange.com/l/${item.id.uuid}`,
      };
    });

    res.status(200).json(listings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "failed" });
  }
}
