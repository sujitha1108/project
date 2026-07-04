import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://iilsalffixonjrthnpjt.supabase.co'
const supabaseAnon = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlpbHNhbGZmaXhvbmpydGhucGp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMxMzQyNDEsImV4cCI6MjA5ODcxMDI0MX0.JXJvddCaqRrrKyediR2OA_G_WxbHxHMVpnPslsEZqCQ'

const supabase = createClient(supabaseUrl, supabaseAnon)

async function run() {
  console.log('Logging in...')
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'nagarajuborra94@gmail.com',
    password: 'password123' // hope this works or try to create a new user
  })
  if (authError) {
    console.log('Auth error:', authError)
    // let's create a new user
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: 'test' + Date.now() + '@example.com',
      password: 'password123'
    })
    console.log('Signup result:', signUpError ? signUpError : signUpData.user?.id)
  } else {
    console.log('Logged in:', authData.user?.id)
  }

  const { data, error } = await supabase.rpc('ensure_user_workspace')
  
  console.log('RPC Call:', { data, error })
}

run().catch(console.error)
