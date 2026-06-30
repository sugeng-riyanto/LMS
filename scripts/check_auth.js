const { Client } = require("pg")
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env.local") })

async function run() {
  const c = new Client({ connectionString: process.env.SUPABASE_DB_CONNECTION })
  await c.connect()
  
  const r = await c.query("SELECT id, email FROM auth.users WHERE email LIKE '%@shb.sch.id' ORDER BY email")
  console.log("Auth users:", JSON.stringify(r.rows, null, 2))
  
  const r2 = await c.query("SELECT email, encrypted_password IS NOT NULL as has_pw FROM auth.users WHERE email LIKE '%@shb.sch.id' ORDER BY email")
  console.log("\nPasswords:", JSON.stringify(r2.rows, null, 2))
  
  // Check profiles
  const r3 = await c.query("SELECT email, role FROM public.profiles WHERE email LIKE '%@shb.sch.id' ORDER BY email")
  console.log("\nProfiles:", JSON.stringify(r3.rows, null, 2))
  
  await c.end()
}
run()
