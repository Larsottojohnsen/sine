import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://cauaqoqvpvjpeghejgvj.supabase.co'
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNhdWFxb3F2cHZqcGVnaGVqZ3ZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU2MDQ4MjMsImV4cCI6MjA2MTE4MDgyM30.Vy5TkXMaXOHWqhIWFGALz_vZJKI_WfKqxfJQqRqyVJc'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
