const url = 'https://qfzynbevbxntktqldbld.supabase.co/rest/v1/users';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmenluYmV2YnhudGt0cWxkYmxkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDMyNzM4NSwiZXhwIjoyMDg5OTAzMzg1fQ.TFNFI0ld9ZgpAYUD0apgdrxJV8bdvNRw82epF7M2rEQ';

async function main() {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'apikey': key,
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({
      id: '00000000-0000-0000-0000-000000000000', // Need a valid UUID that exists in auth.users ideally, but wait if it references auth.users(id), this will fail with foreign key violation!
      full_name: 'Test',
      phone: '',
      email: 'test@example.com',
      auth_provider: 'google'
    })
  });
  
  const text = await res.text();
  console.log("REST API Response:", res.status, text);
}

main();
