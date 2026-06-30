const { Client } = require("pg")
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env.local") })

async function run() {
  const c = new Client({ connectionString: process.env.SUPABASE_DB_CONNECTION })
  await c.connect()
  const r = await c.query("SELECT policyname, cmd, qual FROM pg_policies WHERE tablename = 'profiles'")
  r.rows.forEach((row) => console.log(`${row.policyname}: ${row.cmd}`))
  await c.end()
}
run()
