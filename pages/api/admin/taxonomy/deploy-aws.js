import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

const RAW_CONFIG_URL =
  "https://raw.githubusercontent.com/tarpbarry-stack/ironxchange-homepage/main/config/configCategories.js";

async function run(command, args) {
  const { stdout, stderr } = await execFileAsync(command, args, {
    timeout: 120000,
    maxBuffer: 1024 * 1024 * 10
  });

  return { stdout, stderr };
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

    const ts = new Date().toISOString().replace(/[:.]/g, "-");

    const script = `
set -e
cd /var/www/ironxchange/src/config

sudo cp configCategories.js configCategories.BACKUP-admin-daddy-${ts}.js

sudo curl -L "${RAW_CONFIG_URL}" -o configCategories.NEW.js

sudo mv configCategories.js configCategories.OLD-admin-daddy-${ts}.js
sudo mv configCategories.NEW.js configCategories.js

cd /var/www/ironxchange

OLD_PID=$(sudo lsof -t -i :3000 || true)

if [ ! -z "$OLD_PID" ]; then
  sudo kill $OLD_PID || true
fi

nohup node server/index.js > server.log 2>&1 &

sleep 3

NEW_PID=$(sudo lsof -t -i :3000 || true)
ID_COUNT=$(grep -c '"id": "' /var/www/ironxchange/src/config/configCategories.js || true)

echo "OLD_PID=$OLD_PID"
echo "NEW_PID=$NEW_PID"
echo "ID_COUNT=$ID_COUNT"
`;

    const result = await run("bash", ["-lc", script]);

    return res.status(200).json({
      ok: true,
      message: "AWS taxonomy deployed and app restarted.",
      stdout: result.stdout,
      stderr: result.stderr
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error.message || "Deploy failed"
    });
  }
}
