const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const envContent = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8');
const match = envContent.match(/^SUPABASE_DB_CONNECTION=(.+)$/m);
const conn = match ? match[1].trim() : null;

if (!conn) {
  console.error('SUPABASE_DB_CONNECTION not found in .env.local');
  process.exit(1);
}

const migrationFile = process.argv[2];
if (!migrationFile) {
  console.error('Usage: node scripts/run-fix-migration.js <migration-filename>');
  process.exit(1);
}

const sql = fs.readFileSync(path.join(__dirname, '..', migrationFile), 'utf8');
const stmts = sql.split(';').filter(s => s.trim());

async function run() {
  const client = new Client({ connectionString: conn });
  await client.connect();
  let ok = 0, skip = 0, fail = 0;
  for (const stmt of stmts) {
    const trimmed = stmt.trim();
    if (!trimmed) continue;
    try {
      await client.query(trimmed.endsWith(';') ? trimmed : trimmed + ';');
      ok++;
    } catch (e) {
      const msg = e.message;
      if (
        msg.includes("already exists") ||
        msg.includes("duplicate_object") ||
        msg.includes("42710") ||
        msg.includes("42723") ||
        msg.includes("42P07") ||
        msg.includes("42P16")
      ) {
        skip++;
      } else {
        console.error('FAIL:', msg.slice(0, 200));
        fail++;
      }
    }
  }
  console.log(ok + ' ok, ' + skip + ' skipped, ' + fail + ' failed');
  await client.end();
  process.exit(fail > 0 ? 1 : 0);
}

run().catch(e => { console.error(e.message); process.exit(1); });
