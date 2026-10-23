import { createClient } from '@supabase/supabase-js'

const DEFAULT_URL = 'https://hfbkrgitryajjwttyrbz.supabase.co'
const DEFAULT_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhmYmtyZ2l0cnlhamp3dHR5cmJ6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTU4MzcwMCwiZXhwIjoyMTA3MTU5NzAwfQ.f0PTwsjSxNajTCsQd57Ur8zkyCKbx5FyX1swlokJFq4'

const envUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

// Filter out broken dummy values from container env or Netlify settings like 'xyz.supabase.co' or 'your_supabase_anon_public_key'
const isInvalidUrl =
  !envUrl ||
  envUrl.includes('placeholder') ||
  envUrl.includes('xyz.supabase.co') ||
  envUrl.includes('your-project-id') ||
  envUrl.includes('example.com') ||
  !envUrl.startsWith('https://')

const isInvalidKey =
  !envKey ||
  envKey.includes('placeholder') ||
  envKey.includes('anon-key') ||
  envKey.includes('your_supabase') ||
  envKey.length < 50

export const supabaseUrl = isInvalidUrl ? DEFAULT_URL : envUrl
export const supabaseKey = isInvalidKey ? DEFAULT_KEY : envKey

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  },
})
