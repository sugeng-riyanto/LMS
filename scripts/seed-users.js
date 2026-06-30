const https = require("https");
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env.local") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const users = [
  { email: "admin@shb.sch.id", password: "admin123", fullName: "Pak Gita", role: "super_admin", grade: null },
  { email: "teacher@shb.sch.id", password: "teacher123", fullName: "Bu Sarah", role: "teacher", grade: null },
  { email: "lab@shb.sch.id", password: "lab123", fullName: "Mas Budi", role: "lab_assistant", grade: null },
  { email: "student1@shb.sch.id", password: "student123", fullName: "Adi Pratama", role: "student", grade: 10 },
  { email: "student2@shb.sch.id", password: "student123", fullName: "Bunga Citra", role: "student", grade: 10 },
  { email: "student3@shb.sch.id", password: "student123", fullName: "Cahyo Nugroho", role: "student", grade: 11 },
  { email: "student4@shb.sch.id", password: "student123", fullName: "Dewi Sartika", role: "student", grade: 12 },
];

async function createUser(usr) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      email: usr.email,
      password: usr.password,
      email_confirm: true,
      user_metadata: { full_name: usr.fullName, role: usr.role, grade: usr.grade },
    });

    const req = https.request(
      {
        hostname: SUPABASE_URL.replace("https://", ""),
        path: "/auth/v1/admin/users",
        method: "POST",
        headers: {
          apikey: ANON_KEY,
          Authorization: `Bearer ${SERVICE_KEY}`,
          "Content-Type": "application/json",
        },
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          if (res.statusCode === 201 || res.statusCode === 200) {
            const json = JSON.parse(body);
            console.log(`  ${usr.email} -> id: ${json.id}`);
            resolve(json);
          } else {
            const json = JSON.parse(body);
            if (json.msg && json.msg.toLowerCase().includes("already")) {
              console.log(`  ${usr.email} -> already exists (skipped)`);
              resolve(null);
            } else {
              reject(new Error(`${usr.email} (${res.statusCode}): ${JSON.stringify(json)}`));
            }
          }
        });
      }
    );
    req.write(data);
    req.end();
  });
}

async function getUsers() {
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: SUPABASE_URL.replace("https://", ""),
        path: "/auth/v1/admin/users",
        method: "GET",
        headers: {
          apikey: ANON_KEY,
          Authorization: `Bearer ${SERVICE_KEY}`,
        },
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          try {
            const json = JSON.parse(body);
            resolve(json.users || []);
          } catch {
            reject(new Error(body.slice(0, 500)));
          }
        });
      }
    );
    req.end();
  });
}

async function run() {
  console.log("Creating users...");
  for (const u of users) {
    try {
      await createUser(u);
    } catch (e) {
      console.error(e.message);
    }
  }

  // Update grade_assigned in profiles for students
  console.log("\nUpdating profiles...");
  const { Client } = require("pg");
  const client = new Client({
    connectionString: process.env.SUPABASE_DB_CONNECTION,
  });
  await client.connect();

  for (const u of users) {
    if (u.grade) {
      await client.query(
        "UPDATE public.profiles SET grade_assigned = $1 WHERE email = $2",
        [u.grade, u.email]
      );
      console.log(`  ${u.email} -> grade_assigned = ${u.grade}`);
    }
  }
  await client.end();
  console.log("\nDone!");
}
run();
