const CATEGORY_TO_FILE = {
  "AERIAL LIFTS": "lib/aerialTaxonomy.js",
  "AGGREGATE": "lib/aggregateTaxonomy.js",
  "AGGREGATE EQUIPMENT": "lib/aggregateTaxonomy.js",
  "AGRICULTURE HARVESTERS": "lib/agricultureHarvestersTaxonomy.js",
  "AGRICULTURE TRACTORS": "lib/agricultureTractorsTaxonomy.js",
  "ASPHALT EQUIPMENT": "lib/asphaltEquipmentTaxonomy.js",
  "ATTACHMENTS / PARTS": "lib/attachmentsPartsTaxonomy.js",
  "BACKHOE LOADERS": "lib/backhoeLoadersTaxonomy.js",
  "COMPACTION ROLLERS": "lib/compactionRollersTaxonomy.js",
  "COMPACTION / ROLLERS": "lib/compactionRollersTaxonomy.js",
  "CRANES": "lib/cranesTaxonomy.js",
  "CRAWLER CARRIERS": "lib/crawlerCarriersTaxonomy.js",
  "DOZERS": "lib/dozersTaxonomy.js",
  "DRILLS AND PILING": "lib/drillsAndPilingTaxonomy.js",
  "DRILLS / PILING": "lib/drillsAndPilingTaxonomy.js",
  "DUMP TRUCKS": "lib/dumpTrucksTaxonomy.js",
  "EXCAVATORS": "lib/excavatorsTaxonomy.js",
  "FORKLIFTS": "lib/forkliftsTaxonomy.js",
  "MOTOR GRADERS": "lib/motorGradersTaxonomy.js",
  "SCRAPERS": "lib/scraperTaxonomy.js",
  "SKID STEER / CTL": "lib/skidSteerCtlTaxonomy.js",
  "SUPPORT EQUIPMENT": "lib/supportEquipmentTaxonomy.js",
  "TELEHANDLERS": "lib/telehandlersTaxonomy.js",
  "TRAILERS": "lib/trailersTaxonomy.js",
  "TRENCHERS": "lib/trenchersTaxonomy.js",
  "TRUCKS": "lib/trucksTaxonomy.js",
  "UTILITY CARTS": "lib/utilityCartsTaxonomy.js",
  "UTILITY CARTS / UTV": "lib/utilityCartsTaxonomy.js",
  "WHEEL LOADERS": "lib/wheelLoadersTaxonomy.js"
};

function clean(value) {
  return String(value || "").trim();
}

function upper(value) {
  return clean(value).toUpperCase();
}

function normalizeMake(make) {
  const value = upper(make);
  if (value === "CAT") return "CATERPILLAR";
  return value;
}

function normalizeModel(model) {
  return upper(model);
}

async function githubRequest(path, options = {}) {
  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  const branch = process.env.GITHUB_BRANCH || "main";

  if (!token || !owner || !repo) {
    throw new Error("Missing GitHub env vars.");
  }

  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;

  const response = await fetch(
    options.query ? `${url}?${options.query}` : `${url}?ref=${branch}`,
    {
      method: options.method || "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
        "X-GitHub-Api-Version": "2022-11-28"
      },
      body: options.body ? JSON.stringify(options.body) : undefined
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message || "GitHub request failed.");
  }

  return data;
}

function deleteTaxonomyRow(fileContent, make, model) {
  const escapedMake = make.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const escapedModel = model.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const patterns = [
    new RegExp(`\\n\\s*\\{\\s*make:\\s*"${escapedMake}",\\s*model:\\s*"${escapedModel}"\\s*\\},?`, "g"),
    new RegExp(`\\n\\s*\\{\\s*"make":\\s*"${escapedMake}",\\s*"model":\\s*"${escapedModel}"\\s*\\},?`, "g")
  ];

  let content = fileContent;
  let changed = false;

  patterns.forEach(pattern => {
    const next = content.replace(pattern, "");
    if (next !== content) {
      changed = true;
      content = next;
    }
  });

  return { changed, content };
}

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ ok: false, error: "Method not allowed" });
    }

    const adminKey = req.headers["x-admin-key"];
    if (!process.env.ADMIN_DADDY_KEY || adminKey !== process.env.ADMIN_DADDY_KEY) {
      return res.status(401).json({ ok: false, error: "Unauthorized" });
    }

    const category = upper(req.body.category);
    const make = normalizeMake(req.body.make);
    const model = normalizeModel(req.body.model);

    if (!category || !make || !model) {
      return res.status(400).json({ ok: false, error: "Missing category, make, or model." });
    }

    const filePath = CATEGORY_TO_FILE[category];

    if (!filePath) {
      return res.status(400).json({ ok: false, error: `Unknown category: ${category}` });
    }

    const branch = process.env.GITHUB_BRANCH || "main";
    const current = await githubRequest(filePath);

    const decoded = Buffer.from(current.content, "base64").toString("utf8");
    const result = deleteTaxonomyRow(decoded, make, model);

    if (!result.changed) {
      return res.status(404).json({
        ok: false,
        changed: false,
        error: "Model row not found.",
        category,
        make,
        model,
        filePath
      });
    }

    const encoded = Buffer.from(result.content, "utf8").toString("base64");

    await githubRequest(filePath, {
      method: "PUT",
      query: `branch=${branch}`,
      body: {
        message: `Admin Daddy taxonomy delete: ${category} ${make} ${model}`,
        content: encoded,
        sha: current.sha,
        branch
      }
    });

    return res.status(200).json({
      ok: true,
      changed: true,
      message: "Model deleted and committed to GitHub.",
      category,
      make,
      model,
      filePath
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error.message || "Server error"
    });
  }
}
