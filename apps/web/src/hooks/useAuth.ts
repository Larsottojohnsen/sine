import { useState, useEffect } from 'react'
import { createClient, type User, type SupabaseClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://cauaqoqvpvjpeghejgvj.supabase.co'
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNhdWFxb3F2cHZqcGVnaGVqZ3ZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2Mzc3MDAsImV4cCI6MjA5MDIxMzcwMH0.eT_KvHh6ZoS5hlLILkhzTyogTP91OAX-pKwG57OeFHI'

// Dev-bypass: lagres i localStorage
const DEV_BYPASS_KEY = 'sine_dev_bypass'

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
  isDevUser?: boolean
}

const DEV_USER: AuthUser = {
  id: 'dev-user-local',
  email: 'dev@sine.no',
  name: 'Dev',
  isDevUser: true,
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Sjekk dev-bypass først
    if (localStorage.getItem(DEV_BYPASS_KEY) === 'true') {
      setUser(DEV_USER)
      setLoading(false)
      return
    }

    const supabase = getSupabase()

    // Hent nåværende sesjon
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(mapUser(session.user))
      }
      setLoading(false)
    })

    // Lytt på auth-endringer
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(mapUser(session.user))
      } else {
        // Sjekk dev-bypass igjen ved sign-out
        if (localStorage.getItem(DEV_BYPASS_KEY) === 'true') {
          setUser(DEV_USER)
        } else {
          setUser(null)
        }
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    localStorage.removeItem(DEV_BYPASS_KEY)
    const supabase = getSupabase()
    await supabase.auth.signOut()
    setUser(null)
  }

  const devLogin = () => {
    localStorage.setItem(DEV_BYPASS_KEY, 'true')
    setUser(DEV_USER)
  }

  return { user, loading, signOut, devLogin }
}

function mapUser(u: User): AuthUser {
  return {
    id: u.id,
    email: u.email || '',
    name: u.user_metadata?.full_name || u.user_metadata?.name || u.email?.split('@')[0],
    avatarUrl: u.user_metadata?.avatar_url,
  }
}
