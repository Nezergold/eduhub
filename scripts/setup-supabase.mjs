/**
 * Verify Supabase config and optionally apply migrations via direct DB connection.
 *
 * Usage:
 *   node scripts/setup-supabase.mjs          # verify API key + tables
 *   node scripts/setup-supabase.mjs --migrate # run setup-all.sql (needs SUPABASE_DB_URL)
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function loadEnvFile(filename) {
  const file = path.join(root, filename);
  if (!fs.existsSync(file)) return {};
  const vars = {};
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    vars[key] = val;
  }
  return vars;
}

function isValidAnonKey(key) {
  if (!key?.trim()) return false;
  const k = key.trim();
  if (k.startsWith("eyJ") && k.length > 80) return true;
  if (k.startsWith("sb_publishable_")) return true;
  return false;
}

const env = { ...loadEnvFile(".env"), ...loadEnvFile(".env.eduhub") };
const url = env.VITE_SUPABASE_URL?.trim();
const anonKey = env.VITE_SUPABASE_ANON_KEY?.trim();
const dbUrl = env.SUPABASE_DB_URL?.trim();

console.log("\nEduhub — Supabase setup check\n");

if (!url) {
  console.error("✗ Missing VITE_SUPABASE_URL in .env.eduhub");
  process.exit(1);
}
console.log(`✓ URL: ${url}`);

if (!isValidAnonKey(anonKey)) {
  console.error("\n✗ Invalid VITE_SUPABASE_ANON_KEY");
  console.error("  You pasted the project ID, not the API key.");
  console.error("  Fix: Supabase Dashboard → Project Settings → API");
  console.error("  Copy the key labeled anon / public (starts with eyJ... or sb_publishable_...)");
  console.error("  Paste it into .env.eduhub as VITE_SUPABASE_ANON_KEY=\n");
  process.exit(1);
}
console.log("✓ Anon key format looks valid");

const sb = createClient(url, anonKey);

async function checkTables() {
  const { error } = await sb.from("app_sync").select("key").limit(1);
  if (!error) {
    console.log("✓ app_sync table exists and is reachable");
    return true;
  }
  if (error.code === "42P01" || error.message?.includes("does not exist") || error.code === "PGRST205") {
    console.error("\n✗ app_sync table not found — run database setup:");
    console.error("  Option A (recommended): Supabase Dashboard → SQL Editor → paste supabase/setup-all.sql → Run");
    console.error("  Option B: Add SUPABASE_DB_PASSWORD to .env.eduhub, then: npm run setup:migrate");
    return false;
  }
  if (error.message?.includes("Invalid API key") || error.status === 401) {
    console.error("\n✗ API key rejected by Supabase — double-check the anon key in Dashboard → Settings → API");
    return false;
  }
  console.error("\n✗ Supabase error:", error.message);
  return false;
}

async function runMigrations() {
  const { spawnSync } = await import("child_process");
  const result = spawnSync(process.execPath, [path.join(__dirname, "run-migrations.mjs")], {
    stdio: "inherit",
    env: process.env,
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

const migrate = process.argv.includes("--migrate");

if (migrate) {
  await runMigrations();
}

const ok = await checkTables();
if (ok) {
  console.log("\n✓ Cloud mode is ready. Restart dev server: npm run dev\n");
  process.exit(0);
}
process.exit(1);
