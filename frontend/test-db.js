import { createClient } from '@supabase/supabase-js'

// Need to simulate a user session
const supabaseUrl = 'https://iilsalffixonjrthnpjt.supabase.co'
const supabaseServiceRole = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlpbHNhbGZmaXhvbmpydGhucGp0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzEzNDI0MSwiZXhwIjoyMDk4NzEwMjQxfQ.GgtclTmWzIQC_VXH-yKwR2iJIMqWuRiy8KP4gdU0-q0'
const supabase = createClient(supabaseUrl, supabaseServiceRole)

async function run() {
  console.log('Fetching users...')
  const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers()
  if (usersError) throw usersError

  console.log('Total users:', usersData.users.length)
  for (const user of usersData.users) {
    console.log(`User ID: ${user.id}, Email: ${user.email}`)
    
    const { data: members, error: memError } = await supabase
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', user.id)
    
    console.log(' -> Memberships:', members, memError)
  }

  const { data: orgs, error: orgsError } = await supabase
    .from('organizations')
    .select('*')
  console.log('All organizations:', orgs, orgsError)

  // Query pg_proc via rpc? No, we don't have SQL execution rpc.
  // But wait, can we execute a query using supabase client? Only on tables.
  // Let's check if we can query pg_proc. By default RLS doesn't expose it, but maybe we can't.
  // Actually, we can't query pg_proc directly using PostgREST unless there is a view or table exposed.
}

run().catch(console.error)
