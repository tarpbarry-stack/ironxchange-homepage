function clean(value) {
  return String(value || "").trim();
}

function upper(value) {
  return clean(value).toUpperCase();
}

function slugify(value) {
  return clean(value)
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/\//g, " ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
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

    if (!category) {
      return res.status(400).json({ ok: false, error: "Missing category." });
    }

    const fileBase = `${slugify(category)}Taxonomy`;
    const filePath = `lib/${fileBase}.js`;
    const branch = process.env.GITHUB_BRANCH || "main";

    const current = await githubRequest(filePath);

    await githubRequest(filePath, {
      method: "DELETE",
      query: `branch=${branch}`,
      body: {
        message: `Admin Daddy taxonomy delete category: ${category}`,
        sha: current.sha,
        branch
      }
    });

    return res.status(200).json({
      ok: true,
      changed: true,
      message: "Category taxonomy file deleted and committed to GitHub.",
      category,
      filePath
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error.message || "Server error"
    });
  }
}
