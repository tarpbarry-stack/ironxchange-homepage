let discoveryTargets = [];

export default function handler(req, res) {
  if (req.method === "GET") {
    return res.status(200).json({
      success: true,
      targets: discoveryTargets
    });
  }

  if (req.method === "POST") {
    const { targets } = req.body;

    if (!Array.isArray(targets)) {
      return res.status(400).json({
        message: "Invalid targets"
      });
    }

    discoveryTargets = targets;

    return res.status(200).json({
      success: true,
      saved: targets.length
    });
  }

  return res.status(405).json({
    message: "Method not allowed"
  });
}
