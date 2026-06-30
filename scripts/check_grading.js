const { Client } = require("pg")
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env.local") })

async function run() {
  const c = new Client({ connectionString: process.env.SUPABASE_DB_CONNECTION })
  await c.connect()
  
  // Simulate the grading API query
  const r = await c.query(`
    SELECT sw.id, sw.student_id, sw.question_id, sw.status, sw.score,
           jsonb_build_object('id', p.id, 'full_name', p.full_name, 'grade_assigned', p.grade_assigned) as student
    FROM public.student_work sw
    LEFT JOIN public.profiles p ON p.id = sw.student_id
    WHERE p.grade_assigned = 10
    LIMIT 10
  `)
  console.log("Results:", JSON.stringify(r.rows, null, 2))
  console.log("Count:", r.rows.length)
  
  await c.end()
}
run()
