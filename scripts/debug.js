const { Client } = require("pg");
const https = require("https");
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env.local") });

// Test 1: Direct DB - can admin query own profile?
async function testDirectDB() {
  const client = new Client({
    connectionString: process.env.SUPABASE_DB_CONNECTION,
  });
  await client.connect();

  // This bypasses RLS (superuser)
  const { rows } = await client.query("SELECT count(*) FROM public.profiles");
  console.log(`Profiles in DB: ${rows[0].count}`);

  await client.end();
}

// Test 2: Supabase Auth Admin API - check if admin user exists
async function testAuthAdmin() {
  return new Promise((resolve) => {
    const req = https.request(
      {
        hostname: new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname,
        path: "/auth/v1/admin/users",
        method: "GET",
        headers: {
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          Authorization: "Bearer " + process.env.SUPABASE_SERVICE_ROLE_KEY,
        },
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          const data = JSON.parse(body);
          const admin = data.users?.find((u) => u.email === "admin@shb.sch.id");
          console.log(`Admin user in Auth: ${admin ? "YES (id: " + admin.id + ")" : "NO"}`);
          console.log(`Total auth users: ${data.users?.length ?? 0}`);
          console.log(`User metadata: ${JSON.stringify(admin?.user_metadata)}`);
          resolve();
        });
      }
    );
    req.end();
  });
}

async function main() {
  await testDirectDB();
  await testAuthAdmin();
}
main();
