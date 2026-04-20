import postgres from 'postgres';

const sql = postgres('postgresql://postgres:36@Dlp.kmr@Kmr@db.qfzynbevbxntktqldbld.supabase.co:5432/postgres', { ssl: 'require' });

async function main() {
  try {
    // Check function definition
    const func = await sql`
      SELECT pg_get_functiondef(oid) 
      FROM pg_proc 
      WHERE proname = 'handle_new_user';
    `;
    console.log("=== HANDLE_NEW_USER ===");
    console.log(func[0]?.pg_get_functiondef || "Function not found!");
    
    // Check triggers on auth.users
    const triggers = await sql`
      SELECT trigger_name, event_object_table, action_statement
      FROM information_schema.triggers
      WHERE event_object_table = 'users' AND event_object_schema = 'auth';
    `;
    console.log("=== TRIGGERS ON auth.users ===");
    console.log(triggers);
    
    // Check migrations applied
    const migrations = await sql`
      SELECT * FROM supabase_migrations.schema_migrations ORDER BY version DESC LIMIT 5;
    `;
    console.log("=== RECENT MIGRATIONS ===");
    console.log(migrations);
    
  } catch (err) {
    console.error("DB Error:", err);
  } finally {
    await sql.end();
  }
}

main();
