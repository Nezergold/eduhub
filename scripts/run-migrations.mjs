/**
 * Apply setup-all.sql via direct Postgres connection.
 * Requires SUPABASE_DB_PASSWORD in .env.eduhub (Dashboard → Connect → Database password)
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

dotenv.config({ path: path.join(root, ".env.eduhub") });
dotenv.config({ path: path.join(root, ".env") });

const projectRef = "ptfwxyynivvtgpbqqstu";
const password = process.env.SUPABASE_DB_PASSWORD?.trim();
const dbUrl =
  process.env.SUPABASE_DB_URL?.trim() ||
  (password
    ? `postgresql://postgres.${projectRef}:${encodeURIComponent(password)}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`
    : null);

if (!dbUrl) {
  console.error("\n✗ Set SUPABASE_DB_PASSWORD in .env.eduhub");
  console.error("  Dashboard → Project Settings → Database → Database password\n");
  process.exit(1);
}

const sql = fs.readFileSync(path.join(root, "supabase", "setup-all.sql"), "utf8");
const regions = [
  "aws-0-us-east-1",
  "aws-0-eu-west-1",
  "aws-0-eu-central-1",
  "aws-0-ap-southeast-1",
];

async function tryConnect(url) {
  const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  await client.connect();
  return client;
}

async function main() {
  let client;
  if (process.env.SUPABASE_DB_URL) {
    client = await tryConnect(dbUrl);
  } else {
    let lastErr;
    for (const region of regions) {
      const url = `postgresql://postgres.${projectRef}:${encodeURIComponent(password!)}@${region}.pooler.supabase.com:6543/postgres`;
      try {
        console.log(`→ Trying pooler ${region}…`);
        client = await tryConnect(url);
        console.log(`✓ Connected via ${region}`);
        break;
      } catch (e) {
        lastErr = e;
      }
    }
    if (!client) {
      // Direct connection fallback
      const direct = `postgresql://postgres:${encodeURIComponent(password!)}@db.${projectRef}.supabase.co:5432/postgres`;
      try {
        console.log("→ Trying direct connection…");
        client = await tryConnect(direct);
        console.log("✓ Connected via direct host");
      } catch {
        throw lastErr;
      }
    }
  }

  console.log("→ Running setup-all.sql …");
  await client.query(sql);
  await client.end();
  console.log("✓ Database setup complete\n");
}

main().catch(err => {
  console.error("\n✗ Migration failed:", err.message);
  console.error("  Verify SUPABASE_DB_PASSWORD in .env.eduhub\n");
  process.exit(1);
});
