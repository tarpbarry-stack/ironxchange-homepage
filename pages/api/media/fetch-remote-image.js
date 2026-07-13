const ALLOWED_HOSTS = new Set([
  "www-ironplanet.s3-us-west-2.amazonaws.com",
  "cdn.ironpla.net"
]);

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({
      ok: false,
      error: "Method not allowed"
    });
  }

  const rawUrl = String(req.query.url || "").trim();

  if (!rawUrl) {
    return res.status(400).json({
      ok: false,
      error: "Missing image URL"
    });
  }

  let parsedUrl;

  try {
    parsedUrl = new URL(rawUrl);
  } catch {
    return res.status(400).json({
      ok: false,
      error: "Invalid image URL"
    });
  }

  if (
    parsedUrl.protocol !== "https:" ||
    !ALLOWED_HOSTS.has(parsedUrl.hostname.toLowerCase())
  ) {
    return res.status(403).json({
      ok: false,
      error: "Image host not allowed"
    });
  }

  try {
    const upstream = await fetch(parsedUrl.toString(), {
      headers: {
        "User-Agent":
          "Mozilla/5.0 IronXchange Image Importer",
        Accept: "image/avif,image/webp,image/*,*/*;q=0.8"
      }
    });

    if (!upstream.ok) {
      return res.status(upstream.status).json({
        ok: false,
        error: `Upstream image failed: ${upstream.status}`
      });
    }

    const contentType =
      upstream.headers.get("content-type") ||
      "image/jpeg";

    if (!contentType.startsWith("image/")) {
      return res.status(415).json({
        ok: false,
        error: "URL did not return an image"
      });
    }

    const buffer = Buffer.from(
      await upstream.arrayBuffer()
    );

    res.setHeader("Content-Type", contentType);
    res.setHeader(
      "Cache-Control",
      "private, max-age=300"
    );

    return res.status(200).send(buffer);
  } catch (error) {
    console.error(
      "RB REMOTE IMAGE FETCH FAILED:",
      error
    );

    return res.status(502).json({
      ok: false,
      error:
        error?.message ||
        "Remote image fetch failed"
    });
  }
}
