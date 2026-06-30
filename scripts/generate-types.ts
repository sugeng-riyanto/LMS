#!/usr/bin/env node
/**
 * Generate Supabase TypeScript types from the linked Supabase project.
 *
 * Prerequisites:
 *   1. Install Supabase CLI: npm install -g supabase
 *   2. Login: supabase login
 *   3. Link project: supabase link --project-ref your-project-ref
 *
 * Run: npx tsx scripts/generate-types.ts
 */

import { execSync } from "node:child_process";

const OUT_FILE = "src/types/database.ts";

try {
  console.log("Generating Supabase TypeScript types...");
  execSync(`npx supabase gen types typescript --linked > ${OUT_FILE}`, {
    stdio: "inherit",
    cwd: new URL("..", import.meta.url).pathname,
  });
  console.log(`\nTypes generated successfully → ${OUT_FILE}`);
} catch (error) {
  console.error("Failed to generate types.");
  console.error("Make sure you have:");
  console.error("  1. Supabase CLI installed (npx supabase --version)");
  console.error("  2. Run: supabase login");
  console.error("  3. Run: supabase link --project-ref your-project-ref");
  console.error("\nOr generate manually:");
  console.error("  npx supabase gen types typescript --linked > src/types/database.ts");
  process.exit(1);
}
