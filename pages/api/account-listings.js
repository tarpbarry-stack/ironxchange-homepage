export default async function handler(req, res) {
  try {
    const { authorId } = req.query;

    if (!authorId) {
      return res.status(400).json({
        error: "Missing authorId"
      });
    }

    const protocol = req.headers["x-forwarded-proto"] || "https";
    const host = req.headers.host;

    const response = await fetch(`${protocol}://${host}/api/listings`);

    if (!response.ok) {
      throw new Error(`Listings API failed: ${response.status}`);
    }

    const listings = await response.json();

    const myListings = Array.isArray(listings)
      ? listings.filter((item) => {
          return (
            item.authorId === authorId ||
            item.sellerId === authorId ||
            item.author?.id === authorId ||
            item.author?.id?.uuid === authorId
          );
        })
      : [];

    const withAge = myListings.map((item) => {
      const createdAt =
        item.createdAt ||
        item.created_at ||
        item.attributes?.createdAt ||
        item.attributes?.created_at;

      let age = null;

      if (createdAt) {
        const created = new Date(createdAt);
        const now = new Date();

        age = Math.max(
          0,
          Math.floor((now - created) / (1000 * 60 * 60 * 24))
        );
      }

      return {
        ...item,
        age
      };
    });

    res.status(200).json(withAge);
  } catch (error) {
    console.error("ACCOUNT LISTINGS ERROR:", error);

    res.status(500).json({
      error: "Failed to load account listings"
    });
  }
}
