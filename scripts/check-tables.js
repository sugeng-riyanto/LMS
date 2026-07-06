const { Client } = require('pg');
const client = new Client({
  host: 'db.yvnomvcmqsfbkqqjwzhi.supabase.co',
  port: 5432,
  user: 'postgres',
  password: '7A+J.&?#QLf&Zdf',
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
});
client.connect().then(() => {
  return client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name");
}).then(r => {
  console.log('Tables:', r.rows.map(x => x.table_name).join(', '));
  return client.end();
}).catch(e => { console.error(e.message); client.end(); });
