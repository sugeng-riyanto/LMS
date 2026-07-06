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
  return client.query("SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'teacher_assignments' ORDER BY ordinal_position");
}).then(r => {
  console.log('Columns:', r.rows.map(x => `${x.column_name} (${x.data_type}, nullable=${x.is_nullable})`).join(', '));
  return client.end();
}).catch(e => { console.error(e.message); client.end(); });
