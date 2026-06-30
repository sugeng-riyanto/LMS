const { Client } = require("pg");
const fs = require("fs");
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env.local") });

const client = new Client({
  connectionString: process.env.SUPABASE_DB_CONNECTION,
});

// Statement patterns that are safe to skip on "already exists"
const SKIPABLE = [
  (s) =>
    s.startsWith("--")
      ? "comment"
      : null,
  (s) =>
    /^ALTER TABLE.*ENABLE ROW LEVEL SECURITY/i.test(s)
      ? "skip"
      : null,
  (s) =>
    /^CREATE TYPE/i.test(s)
      ? "skip"
      : null,
  (s) =>
    /^CREATE TABLE/i.test(s)
      ? "idempotent"
      : null,
  (s) =>
    /^CREATE INDEX/i.test(s) || /^CREATE UNIQUE INDEX/i.test(s)
      ? "idempotent"
      : null,
  (s) =>
    /^CREATE POLICY/i.test(s)
      ? "dropfirst"
      : null,
  (s) =>
    /^DROP POLICY/i.test(s)
      ? "skip-on-error"
      : null,
  (s) =>
    /^ALTER TABLE.*ADD (UNIQUE|PRIMARY KEY|FOREIGN KEY)/i.test(s)
      ? "safe-do-block"
      : null,
];

const stmts = splitSQL(fs.readFileSync("supabase/migrations/00000000000000_init.sql", "utf8"));
console.log(`Total statements: ${stmts.length}`);

async function run() {
  await client.connect();

  let ok = 0,
    skip = 0,
    fail = 0;

  for (let i = 0; i < stmts.length; i++) {
    const s = stmts[i].trim();
    if (!s || s.startsWith("--")) continue;

    const handler = classifyStatement(s);
    
    if (handler === "comment") continue;

    if (handler === "skip") {
      skip++;
      process.stdout.write("s");
      continue;
    }

    if (handler === "idempotent") {
      // Already has IF NOT EXISTS
      if (/CREATE TABLE/i.test(s) && !/IF NOT EXISTS/i.test(s)) {
        const newS = s.replace(/CREATE TABLE (\w+)/, "CREATE TABLE IF NOT EXISTS $1");
        await exec(newS, i);
        continue;
      }
      if (/CREATE INDEX/i.test(s) && !/IF NOT EXISTS/i.test(s)) {
        const newS = s.replace(/CREATE (UNIQUE )?INDEX (\w+)/, "CREATE $1INDEX IF NOT EXISTS $2");
        await exec(newS, i);
        continue;
      }
      await exec(s, i);
      continue;
    }

    if (handler === "dropfirst") {
      const m = s.match(/CREATE POLICY\s+"([^"]+)"\s+ON\s+(\S+)/i);
      if (m) {
        const dropStmt = `DROP POLICY IF EXISTS "${m[1]}" ON ${m[2]};`;
        try { await client.query(dropStmt); } catch (_) {}
        try { await client.query(s); ok++; process.stdout.write("."); continue; }
        catch (e) { console.error(`\nFAIL [${i+1}]: ${e.message.slice(0, 200)}\n${s.slice(0, 100)}`); fail++; continue; }
      }
      await exec(s, i);
      continue;
    }

    if (handler === "safe-do-block") {
      const newS = `DO $$ BEGIN ${s}; EXCEPTION WHEN duplicate_object THEN null; END $$;`;
      await exec(newS, i);
      continue;
    }

    if (handler === "skip-on-error") {
      try { await client.query(s); ok++; process.stdout.write("."); }
      catch (_) { skip++; process.stdout.write("s"); }
      continue;
    }

    await exec(s, i);
  }

  console.log(`\n\nResult: ${ok} ok, ${skip} skipped, ${fail} failed`);
  await client.end();
  process.exit(fail > 0 ? 1 : 0);

  async function exec(stmt, idx) {
    try {
      await client.query(stmt);
      ok++;
      process.stdout.write(".");
    } catch (e) {
      const msg = e.message;
      if (
        msg.includes("already exists") ||
        msg.includes("duplicate_object") ||
        msg.includes("42710") ||
        msg.includes("42723") ||
        msg.includes("42P07") || // relation already exists
        msg.includes("42P16") // cannot use IF NOT EXISTS on extension
      ) {
        skip++;
        process.stdout.write("s");
      } else {
        fail++;
        console.error(`\nFAIL [${idx + 1}]: ${msg.slice(0, 300)}\n${stmt.slice(0, 120)}`);
      }
    }
  }
}

function classifyStatement(s) {
  if (/^ALTER TABLE.*ENABLE ROW LEVEL SECURITY/i.test(s)) return "skip";
  if (/^CREATE TYPE/i.test(s)) return "skip";
  if (/^CREATE TABLE/i.test(s)) return "idempotent";
  if (/^CREATE (UNIQUE )?INDEX/i.test(s)) return "idempotent";
  if (/^CREATE POLICY/i.test(s)) return "dropfirst";
  if (/^DROP POLICY/i.test(s)) return "skip-on-error";
  if (/^ALTER TABLE.*ADD (UNIQUE|PRIMARY KEY|FOREIGN KEY)/i.test(s)) return "safe-do-block";
  if (/^--/i.test(s)) return "comment";
  return "execute";
}

function splitSQL(sql) {
  const stmts = [];
  let buf = "";
  let inDollar = false;

  for (let i = 0; i < sql.length; i++) {
    const c = sql[i];
    const n2 = sql.slice(i, i + 2);

    if (n2 === "$$") {
      inDollar = !inDollar;
      buf += "$$";
      i++;
      continue;
    }

    if (!inDollar && c === ";") {
      buf += ";";
      const trimmed = buf.trim();
      if (trimmed) stmts.push(trimmed);
      buf = "";
      continue;
    }

    buf += c;
  }

  const last = buf.trim();
  if (last) stmts.push(last);
  return stmts;
}

run();
