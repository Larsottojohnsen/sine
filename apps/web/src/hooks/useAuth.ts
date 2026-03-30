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
        .from('profiles')
        .select('role')
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
    // Dev bypass: if localStorage has sine_dev_bypass=true, skip Supabase auth
    if (localStorage.getItem('sine_dev_bypass') === 'true') {
      setUser({
        id: 'dev-user',
        email: 'dev@sine.no',
        name: 'Dev User',
        role: 'admin',
        isAdmin: true,
      })
      setLoading(false)
      return
    }

    const supabase = getSupabase()

    // Hent nåværende sesjon med timeout
    const sessionTimeout = setTimeout(() => {
      // If Supabase doesn't respond within 8s, stop loading
      setLoading(false)
    }, 8000)

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      clearTimeout(sessionTimeout)
      if (session?.user) {
        const enriched = await fetchUserRole(session.user)
        setUser(enriched)
      }
      setLoading(false)
    }).catch(() => {
      clearTimeout(sessionTimeout)
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

    return () => {
      clearTimeout(sessionTimeout)
      subscription.unsubscribe()
    }
  }, [])

  const signOut = async () => {
    // Remove dev bypass flag so the user is not auto-logged-in again
    localStorage.removeItem('sine_dev_bypass')

    // Also clear all sine_* keys so conversations/settings are not leaked
    const keysToRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('sine_')) keysToRemove.push(key)
    }
    keysToRemove.forEach(k => localStorage.removeItem(k))

    // Sign out from Supabase (no-op if using dev bypass)
    try {
      const supabase = getSupabase()
      await supabase.auth.signOut()
    } catch {
      // Ignore Supabase errors on sign out
    }

    setUser(null)

    // Redirect to landing page
    window.location.href = '/sine/'
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
