import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://qfzynbevbxntktqldbld.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmenluYmV2YnhudGt0cWxkYmxkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDMyNzM4NSwiZXhwIjoyMDg5OTAzMzg1fQ.TFNFI0ld9ZgpAYUD0apgdrxJV8bdvNRw82epF7M2rEQ'
);

async function main() {
  console.log("Simulating Google OAuth signup...");
  
  const { data, error } = await supabase.auth.admin.createUser({
    email: 'test_db_error@example.com',
    password: 'password123',
    user_metadata: {
      provider: 'google', // App metadata isn't directly settable here, but user_metadata is
      full_name: 'Test User'
    },
    email_confirm: true
  });

  if (error) {
    console.error("Signup failed:", error);
  } else {
    console.log("Signup succeeded:", data.user?.id);
    
    // Clean up
    await supabase.auth.admin.deleteUser(data.user.id);
  }
}

main();
