import { useState, useEffect } from 'react'
import { createClient, type User, type SupabaseClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://cauaqoqvpvjpeghejgvj.supabase.co'
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNhdWFxb3F2cHZqcGVnaGVqZ3ZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2Mzc3MDAsImV4cCI6MjA5MDIxMzcwMH0.eT_KvHh6ZoS5hlLILkhzTyogTP91OAX-pKwG57OeFHI'

let _supabase: SupabaseClient | null = null

export function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  }
  return _supabase
}

export interface AuthUser {
  id: string
  email: string
  name?: string
  avatarUrl?: string
  role?: string
  isAdmin?: boolean
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  async function fetchUserRole(supabaseUser: User): Promise<AuthUser> {
    const base = mapUser(supabaseUser)
    try {
      const supabase = getSupabase()
      const { data } = await supabase
        .from('users')
        .select('role, plan')
        .eq('id', supabaseUser.id)
        .single()
      if (data?.role) {
        return { ...base, role: data.role, isAdmin: data.role === 'admin' }
      }
    } catch {
      // If users table doesn't exist or no row, fall back to base user
    }
    return base
  }

  useEffect(() => {
    const supabase = getSupabase()

    // Hent nåværende sesjon
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const enriched = await fetchUserRole(session.user)
        setUser(enriched)
      }
      setLoading(false)
    })

    // Lytt på auth-endringer
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const enriched = await fetchUserRole(session.user)
        setUser(enriched)
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    const supabase = getSupabase()
    await supabase.auth.signOut()
    setUser(null)
  }

  return { user, loading, signOut }
}

function mapUser(u: User): AuthUser {
  return {
    id: u.id,
    email: u.email || '',
    name: u.user_metadata?.full_name || u.user_metadata?.name || u.email?.split('@')[0],
    avatarUrl: u.user_metadata?.avatar_url,
    role: 'user',
    isAdmin: false,
  }
}
