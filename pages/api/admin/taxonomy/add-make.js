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

function makeExists(fileContent, make) {
  return fileContent.includes(`make: "${make}"`) || fileContent.includes(`"make": "${make}"`);
}

function insertSeedRow(fileContent, make) {
  const row = `{ make: "${make}", model: "OTHER" },`;

  const exportIndex = fileContent.lastIndexOf("];");
  if (exportIndex === -1) {
    throw new Error("Could not find taxonomy array closing bracket.");
  }

  const before = fileContent.slice(0, exportIndex);
  const after = fileContent.slice(exportIndex);

  return `${before}${row}\n${after}`;
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

    if (!category || !make) {
      return res.status(400).json({ ok: false, error: "Missing category or make." });
    }

    const filePath = CATEGORY_TO_FILE[category];

    if (!filePath) {
      return res.status(400).json({ ok: false, error: `Unknown category: ${category}` });
    }

    const branch = process.env.GITHUB_BRANCH || "main";
    const current = await githubRequest(filePath);
    const decoded = Buffer.from(current.content, "base64").toString("utf8");

    if (makeExists(decoded, make)) {
      return res.status(200).json({
        ok: true,
        changed: false,
        message: "Make already exists.",
        category,
        make,
        filePath
      });
    }

    const nextContent = insertSeedRow(decoded, make);
    const encoded = Buffer.from(nextContent, "utf8").toString("base64");

    await githubRequest(filePath, {
      method: "PUT",
      query: `branch=${branch}`,
      body: {
        message: `Admin Daddy taxonomy add make: ${category} ${make}`,
        content: encoded,
        sha: current.sha,
        branch
      }
    });

    return res.status(200).json({
      ok: true,
      changed: true,
      message: "Make added with OTHER seed model and committed to GitHub.",
      category,
      make,
      seededModel: "OTHER",
      filePath
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error.message || "Server error"
    });
  }
}
