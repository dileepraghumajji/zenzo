import { createClient } from '@supabase/supabase-js';

// Use the web package instance
const supabase = createClient(
  'https://qfzynbevbxntktqldbld.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmenluYmV2YnhudGt0cWxkYmxkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDMyNzM4NSwiZXhwIjoyMDg5OTAzMzg1fQ.TFNFI0ld9ZgpAYUD0apgdrxJV8bdvNRw82epF7M2rEQ'
);

async function main() {
  console.log("Simulating Google OAuth signup via GoTrue...");
  
  const { data, error } = await supabase.auth.admin.createUser({
    email: 'test_db_auth_trigger_' + Date.now() + '@example.com',
    password: 'password123',
    user_metadata: {
      name: 'Google User', // Google gives name 
      provider: 'google'
    },
    email_confirm: true
  });

  if (error) {
    console.error("Signup failed:", error);
  } else {
    console.log("Signup succeeded:", data.user?.id);
    await supabase.auth.admin.deleteUser(data.user.id);
  }
}

main();
