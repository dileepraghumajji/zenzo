const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:36@Dlp.kmr@Kmr@db.qfzynbevbxntktqldbld.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    await client.connect();
    console.log("Connected directly to Supabase DB via pg.");

    // Check columns of auth.users
    const res = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'auth' AND table_name = 'users';
    `);
    console.log("=== auth.users columns ===");
    console.log(res.rows.map(r => r.column_name).join(", "));

    // Check function definition
    const func = await client.query(`
      SELECT pg_get_functiondef(oid) 
      FROM pg_proc 
      WHERE proname = 'handle_new_user';
    `);
    console.log("\n=== HANDLE_NEW_USER function ===");
    console.log(func.rows[0]?.pg_get_functiondef || "Not found!");

  } catch (err) {
    if (err.message.includes('ENOTFOUND')) {
        console.error("DNS Resolution failed. Trying ipv4 pooler address...");
    } else {
        console.error("DB Error:", err);
    }
  } finally {
    await client.end();
  }
}

main();
