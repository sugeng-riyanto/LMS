const { Client } = require("pg")
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env.local") })

const client = new Client({ connectionString: process.env.SUPABASE_DB_CONNECTION })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const USERS = [
  { email: "admin@shb.sch.id", password: "admin123", full_name: "Super Admin", role: "super_admin", grade: null },
  { email: "sugeng@shb.sch.id", password: "teacher123", full_name: "Sugeng Riyanto", role: "teacher", grade: null },
  { email: "aji@shb.sch.id", password: "teacher123", full_name: "Aji Wahyu Budiyanto, M.Si", role: "teacher", grade: null },
  { email: "lab@shb.sch.id", password: "lab123", full_name: "Lab Assistant", role: "lab_assistant", grade: null },
  { email: "student7@shb.sch.id", password: "student123", full_name: "Ahmad Fauzi", role: "student", grade: 7 },
  { email: "student8@shb.sch.id", password: "student123", full_name: "Bunga Lestari", role: "student", grade: 8 },
  { email: "student9@shb.sch.id", password: "student123", full_name: "Citra Dewi", role: "student", grade: 9 },
  { email: "student10@shb.sch.id", password: "student123", full_name: "Dimas Prayoga", role: "student", grade: 10 },
  { email: "student11@shb.sch.id", password: "student123", full_name: "Eka Putri Sari", role: "student", grade: 11 },
  { email: "student12@shb.sch.id", password: "student123", full_name: "Farhan Maulana", role: "student", grade: 12 },
]

async function createAuthUser(email, password) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SERVICE_KEY,
      "Authorization": `Bearer ${SERVICE_KEY}`,
    },
    body: JSON.stringify({ email, password, email_confirm: true }),
  })
  if (!res.ok) {
    const err = await res.json()
    if (err.msg?.includes("already exists")) return { alreadyExists: true }
    throw new Error(err.msg || `HTTP ${res.status}`)
  }
  return await res.json()
}

async function seed() {
  await client.connect()
  console.log("Seeding users...\n")

  // Clean assignments
  await client.query("DELETE FROM public.teacher_assignments").catch(() => {})

  let created = 0, skipped = 0, failed = 0
  const teacherIds = []

  for (const u of USERS) {
    try {
      // Check if profile already exists
      const { rows } = await client.query("SELECT id FROM public.profiles WHERE email = $1", [u.email])
      if (rows.length > 0) {
        console.log(`  ${u.email} already exists (id: ${rows[0].id})`)
        await client.query("UPDATE public.profiles SET full_name = $1, role = $2, grade_assigned = $3, is_active = true WHERE id = $4",
          [u.full_name, u.role, u.grade, rows[0].id])
        if (u.role === "teacher") teacherIds.push({ name: u.full_name, id: rows[0].id })
        skipped++
        continue
      }

      // Create via Supabase admin API
      const result = await createAuthUser(u.email, u.password)

      if (result.alreadyExists) {
        const { rows: r } = await client.query("SELECT id FROM public.profiles WHERE email = $1", [u.email])
        if (r.length > 0) {
          if (u.role === "teacher") teacherIds.push({ name: u.full_name, id: r[0].id })
        }
        skipped++
        continue
      }

      const userId = result.id
      // Update profile
      await client.query(
        "UPDATE public.profiles SET full_name = $1, role = $2, grade_assigned = $3, is_active = true WHERE id = $4",
        [u.full_name, u.role, u.grade, userId]
      )

      console.log(`  ${u.email} (${u.role})${u.grade ? ` G${u.grade}` : ""}`)
      created++
      if (u.role === "teacher") teacherIds.push({ name: u.full_name, id: userId })
    } catch (e) {
      console.log(`  FAIL ${u.email}: ${e.message}`)
      failed++
    }
  }

  // Assign teachers to grades
  const allGrades = [7, 8, 9, 10, 11, 12]
  for (const t of teacherIds) {
    const subject = t.name.includes("Aji") ? "Chemistry" : "Physics"
    for (const g of allGrades) {
      try {
        await client.query(
          "INSERT INTO public.teacher_assignments (teacher_id, grade, subject) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING",
          [t.id, g, subject]
        )
      } catch {}
    }
    console.log(`  ${t.name} → ${subject} G7-12`)
  }

  console.log(`\nDone! ${created} created, ${skipped} skipped, ${failed} failed.`)
  await client.end()
}

seed().catch((e) => { console.error(e); process.exit(1) })
