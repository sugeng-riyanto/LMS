#!/usr/bin/env node
/**
 * Backup the Supabase database.
 *
 * Method 1: Via Supabase CLI (recommended when linked)
 *   Requires: supabase login + supabase link
 *
 * Method 2: Via pg_dump directly using connection string
 *   Requires: SUPABASE_DB_URL env var
 *
 * Run: npx tsx scripts/backup-database.ts
 */

const BACKUP_DIR = "backups";

function getTimestamp(): string {
  return new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
}

async function main() {
  const fs = await import("node:fs");
  const { execSync } = await import("node:child_process");

  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  const timestamp = getTimestamp();
  const filename = `physics-cc-${timestamp}.sql`;
  const filepath = `${BACKUP_DIR}/${filename}`;

  const dbUrl = process.env.SUPABASE_DB_URL;
  const usePgDump = !!dbUrl;

  if (usePgDump) {
    console.log(`Backing up via pg_dump → ${filepath}`);
    execSync(
      `pg_dump "${dbUrl}" --no-owner --no-privileges --no-comments --file "${filepath}"`,
      { stdio: "inherit" },
    );
  } else {
    console.log("=== MANUAL BACKUP INSTRUCTIONS ===");
    console.log("Option A: Supabase CLI");
    console.log("  supabase db dump --linked > backups/latest.sql");
    console.log("");
    console.log("Option B: pg_dump with connection string");
    console.log("  Set SUPABASE_DB_URL env var, then re-run this script.");
    console.log("  Get the connection string from:");
    console.log("    Supabase Dashboard → Project Settings → Database → Connection string");
    console.log("");
    console.log("Option C: Supabase Dashboard");
    console.log("    Database → Backup → Download backup");
    console.log("");
    console.log(`Backup file would be: ${filepath}`);
    console.log(`Timestamp: ${timestamp}`);
  }

  console.log("\nDone.");
}

main().catch(console.error);
