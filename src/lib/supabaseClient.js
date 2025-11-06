import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

if (import.meta.env.DEV) {
    console.log('Testing Supabase connection...')
    supabase
    .from('confessions')
    .select('*')
    .limit(1)
    .then(({ data, error }) => {
        if (error) console.error('❌ Supabase test failed:', error.message)
        else console.log('✅ Supabase connected. Example row:', data?.[0])
    })
}

