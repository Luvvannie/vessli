import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

if (!url || !anon) {
  console.warn('Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY - see .env.example')
}

// Use placeholder so createClient never throws and preview stays visible.
// Real auth will fail gracefully with a message until keys are added.
export const supabase = createClient(
  url ?? 'https://placeholder.supabase.co',
  anon ?? 'placeholder-anon-key',
)
