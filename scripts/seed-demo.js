const { Client } = require("pg")
const { v4: uuidv4 } = require("uuid")
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env.local") })

const client = new Client({ connectionString: process.env.SUPABASE_DB_CONNECTION })

const TOPICS = {
  7: { 1: { topic: "Kinematics", ref: "0893 Stage 7" }, 3: { topic: "Forces", ref: "0893 Stage 7" }, 5: { topic: "Energy", ref: "0893 Stage 7" }, 7: { topic: "Density", ref: "0893 Stage 7" } },
  8: { 1: { topic: "Kinematics", ref: "0893 Stage 8/9" }, 3: { topic: "Forces and Motion", ref: "0893 Stage 8/9" }, 5: { topic: "Energy Transfers", ref: "0893 Stage 8/9" } },
  9: { 1: { topic: "Kinematics", ref: "0625 (Half)" }, 3: { topic: "Acceleration", ref: "0625 (Half)" }, 5: { topic: "Forces", ref: "0625 (Half)" } },
  10: { 1: { topic: "Kinematics", ref: "0625 (Full)" }, 3: { topic: "Dynamics", ref: "0625 (Full)" }, 5: { topic: "Energy", ref: "0625 (Full)" } },
  11: { 1: { topic: "Kinematics", ref: "9702 AS" }, 3: { topic: "Dynamics", ref: "9702 AS" }, 5: { topic: "Work and Energy", ref: "9702 AS" } },
  12: { 1: { topic: "Thermal Physics", ref: "9702 A2 + TKA" }, 3: { topic: "Ideal Gases", ref: "9702 A2 + TKA" }, 5: { topic: "Oscillations", ref: "9702 A2 + TKA" } },
}

const SAMPLE_LP = JSON.stringify({
  title: "Flipped Classroom Lesson", grade: 10, duration_minutes: 40,
  phases: [
    { phase: "Entry Ticket & Hook", minutes: 5, hook_question: "Why do astronauts float inside the ISS when gravity is still 90% as strong as on Earth?", activity: "Students complete a 3-question entry quiz individually. Teacher presents the hook question.", mythbuster_or_analogy: "Heavier objects do NOT fall faster — without air resistance, all objects accelerate at 9.8 m/s².", differentiation: "Visual concept map for IEP students." },
    { phase: "Productive Struggle", minutes: 20, activity: "Students work in heterogeneous groups on a Level 2 worksheet. Each group receives a different intentional error.", group_rule: "Each member must contribute using 'talking chips'.", differentiation: "Support: prompt cards. Challenge: develop alternative solutions." },
    { phase: "CER Challenge", minutes: 10, phenomenon: "Why do astronauts float in the ISS?", cer_template: "CLAIM: Answer in one sentence.\nEVIDENCE: Supporting data.\nREASONING: Scientific explanation.", activity: "Students independently write CER. Two volunteers present." },
    { phase: "Wrap-up & Mistake Journal", minutes: 5, reflection_prompt: "1. Most confusing concept? 2. Errors made? 3. Rate 1-5.", activity: "Students write in Mistake Journal. Preview next week." },
  ],
})

const SAMPLE_WS = JSON.stringify({
  title: "Worksheet — Kinematics",
  levels: [
    { level: 1, name: "Sanity Check", minutes: 10, questions: [{ id: "l1-01", type: "multiple_choice", bloom: "remember", question: "What is the SI unit of displacement?", options: ["m", "m/s", "m/s²", "N"], correct: "m", mark_scheme: "1 mark" }] },
    { level: 2, name: "Mistake Hunter", minutes: 15, questions: [{ id: "l2-01", type: "long_answer", bloom: "analyze", question: "A car travels 100 m north in 5 s, then 60 m south in 3 s. Find the intentional error.", mark_scheme: "3 marks", solution_steps: ["Speed = 20 m/s", "Velocity = 5 m/s north"] }] },
    { level: 3, name: "CER Challenge", minutes: 10, questions: [{ id: "l3-01", type: "experimental_design", bloom: "evaluate", question: "A ball dropped from 2 m bounces to 1.2 m. Write a CER argument.", mark_scheme: "5 marks", model_answer: "CLAIM: Energy transforms to thermal + sound. EVIDENCE: EP difference = 0.8mg. REASONING: Conservation of energy." }] },
  ],
})

const SAMPLE_PC = JSON.stringify({
  video_resource: { title: "Intro to Kinematics", url: "https://www.youtube.com/watch?v=example", source: "YouTube", duration_minutes: 8, key_concepts: ["Displacement vs distance", "Speed vs velocity"], watch_guide: "Note scalar vs vector differences." },
  interactive_simulation: { title: "Moving Man", url: "https://phet.colorado.edu/sims/cheerpj/moving-man/latest/moving-man.html", platform: "PhET", instructions: "Experiment with constant velocity and acceleration.", inquiry_questions: ["What shape is the position-time graph for constant velocity?"] },
  entry_ticket_quiz: { questions: [{ question: "Which is a vector?", options: ["Distance", "Speed", "Displacement", "Time"], correct: 2, explanation: "Displacement has direction." }, { question: "Acceleration measures change of:", options: ["Distance", "Speed", "Velocity", "Time"], correct: 2, explanation: "Rate of change of velocity." }, { question: "Object at rest has:", options: ["Zero velocity and acceleration", "Zero velocity only", "Zero acceleration only", "Neither"], correct: 0, explanation: "Both are zero." }], passing_score: 2 },
})

const SAMPLE_LL = JSON.stringify({
  lab_required: true,
  equipment_list: [
    { item: "Ticker timer", quantity: 6, status: "available" },
    { item: "Dynamics trolley", quantity: 6, status: "available" },
    { item: "Ticker tape (roll)", quantity: 8, status: "available" },
    { item: "Metre ruler", quantity: 6, status: "available" },
    { item: "Stopwatch", quantity: 6, status: "available" },
  ],
  setup_instructions: ["Set up ticker timer at edge of each bench", "Attach ticker tape to trolley"],
  safety_notes: ["Ensure wires are insulated", "Closed-toe footwear mandatory"],
  lab_technician_message: "Prepare 6 sets of ticker timers and trolleys.",
})

const WA_MSG = "Greetings Physics Warriors! This week we explore Kinematics. Pre-class video on LMS. Complete Entry Ticket Quiz before class."

async function seed() {
  await client.connect()
  console.log("Seeding demo data...")

  const { rows: teachers } = await client.query("SELECT id FROM public.profiles WHERE role = 'teacher' LIMIT 1")
  const teacherId = teachers[0]?.id
  if (!teacherId) { console.log("No teacher found. Run seed-users.js first."); await client.end(); process.exit(1) }

  let totalPkg = 0, totalSyll = 0

  for (const gradeStr of Object.keys(TOPICS)) {
    const grade = parseInt(gradeStr)
    const weeks = TOPICS[grade]

    for (const weekStr of Object.keys(weeks)) {
      const week = parseInt(weekStr)
      const { topic, ref } = weeks[week]

      const pkgId = uuidv4()
      const month = 7 + Math.floor(week / 4)
      const day = 1 + (week % 4) * 7

      try {
        await client.query(`
          INSERT INTO public.weekly_packages (id, academic_year, grade, week_number, semester, date_range_start, date_range_end, topic, syllabus_ref, calendar_status, effective_days, lesson_plan, worksheet, pre_class, lab_logistics, wa_blast, status, created_by)
          VALUES ($1, '2026-2027', $2, $3, $4, $5, $6, $7, $8, 'normal', 5, $9, $10, $11, $12, $13, 'published', $14)
          ON CONFLICT (academic_year, grade, week_number) DO UPDATE SET status = 'published', lesson_plan = EXCLUDED.lesson_plan, worksheet = EXCLUDED.worksheet
        `, [
          pkgId, grade, week, week <= 22 ? 1 : 2,
          `2026-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
          `2026-${String(month).padStart(2, "0")}-${String(day + 4).padStart(2, "0")}`,
          topic, ref, SAMPLE_LP, SAMPLE_WS, SAMPLE_PC, SAMPLE_LL, WA_MSG, teacherId,
        ])
        totalPkg++
        process.stdout.write(".")
      } catch (e) { process.stdout.write("x") }

      try {
        await client.query(`
          INSERT INTO public.syllabus_planning (id, grade, week_number, academic_year, topic, subtopics, syllabus_ref, opening_ideas, activity_questions, problems, calendar_status, effective_days, status, created_by)
          VALUES ($1, $2, $3, '2026-2027', $4, $5, $6, $7, $8, $9, 'normal', 5, 'planned', $10)
          ON CONFLICT (academic_year, grade, week_number) DO UPDATE SET status = 'planned'
        `, [
          uuidv4(), grade, week, topic,
          JSON.stringify([`${topic} - Week ${week}`]), ref,
          `Why does ${topic.toLowerCase()} matter? Let us investigate.`,
          JSON.stringify([
            { question: `What principles govern ${topic.toLowerCase()}?`, bloom: "remember", timing: "10 min" },
            { question: `How to apply ${topic.toLowerCase()}?`, bloom: "apply", timing: "20 min" },
          ]),
          JSON.stringify([
            { problem: `Explain core concepts of ${topic}.`, level: "L1" },
            { problem: `Analyse a case study related to ${topic}.`, level: "L2" },
          ]),
          teacherId,
        ])
        totalSyll++
        process.stdout.write("+")
      } catch (e) { process.stdout.write("s") }
    }
  }

  console.log(`\n\nDone! ${totalPkg} packages + ${totalSyll} syllabus plans.`)
  await client.end()
}

seed().catch((e) => { console.error(e); process.exit(1) })
