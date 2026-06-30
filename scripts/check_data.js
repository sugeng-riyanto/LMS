const { Client } = require("pg")
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env.local") })

async function run() {
  const c = new Client({ connectionString: process.env.SUPABASE_DB_CONNECTION })
  await c.connect()
  
  // Check student_work table
  const r1 = await c.query("SELECT id, student_id, question_id, status, score FROM public.student_work LIMIT 10")
  console.log("student_work:", JSON.stringify(r1.rows, null, 2))
  console.log("Count:", r1.rows.length)
  
  // Check students
  const r2 = await c.query("SELECT id, full_name, grade_assigned, role FROM public.profiles WHERE role = 'student' LIMIT 10")
  console.log("\nstudents:", JSON.stringify(r2.rows, null, 2))
  
  await c.end()
}
run()
