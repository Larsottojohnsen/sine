import { useState, useEffect } from 'react'
import { createClient, type User, type SupabaseClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://cauaqoqvpvjpeghejgvj.supabase.co'
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNhdWFxb3F2cHZqcGVnaGVqZ3ZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2Mzc3MDAsImV4cCI6MjA5MDIxMzcwMH0.eT_KvHh6ZoS5hlLILkhzTyogTP91OAX-pKwG57OeFHI'

// ── Supabase singleton ────────────────────────────────────────
let _supabase: SupabaseClient | null = null

export function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        detectSessionInUrl: true,
        // NOTE: Do NOT set flowType:'pkce' here — it breaks email/password login
        // because PKCE requires a server-side callback redirect, which
        // signInWithPassword does not use.
      },
    })
  }
  return _supabase
}

// ── User cache ────────────────────────────────────────────────
// Stored in localStorage so we can restore the user synchronously
// on page refresh without waiting for a network round-trip.
const CACHE_KEY = 'sine_auth_user_cache'

function readCachedUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as AuthUser
  } catch {
    return null
  }
}

function writeCachedUser(user: AuthUser | null): void {
  try {
    if (user) {
      localStorage.setItem(CACHE_KEY, JSON.stringify(user))
    } else {
      localStorage.removeItem(CACHE_KEY)
    }
  } catch { /* ignore */ }
}

// Exported so LoginPage can write the cache immediately after signInWithPassword
// without waiting for onAuthStateChange to fire (belt-and-suspenders).
export function writeCachedUserFromLogin(supabaseUser: User): void {
  writeCachedUser(mapUser(supabaseUser))
}

export interface AuthUser {
  id: string
  email: string
  name?: string
  avatarUrl?: string
  role?: string
  isAdmin?: boolean
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
    // profiles table missing or no row — fall back to base user
  }
  return base
}

export function useAuth() {
  // Initialise synchronously from cache — no spinner on repeat visits
  const [user, setUser] = useState<AuthUser | null>(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('sine_dev_bypass') === 'true') {
      return { id: 'dev-user', email: 'dev@sine.no', name: 'Dev User', role: 'admin', isAdmin: true }
    }
    return readCachedUser()
  })

  // loading=false immediately when we have a cached user
  const [loading, setLoading] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('sine_dev_bypass') === 'true') {
      return false
    }
    return readCachedUser() === null
  })

  useEffect(() => {
    if (localStorage.getItem('sine_dev_bypass') === 'true') return

    const supabase = getSupabase()

    // ── onAuthStateChange fires for EVERY auth event:
    //    INITIAL_SESSION, SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED, etc.
    //    This is the single source of truth for auth state.
    //    It fires synchronously with the cached session on mount,
    //    and again whenever signInWithPassword / signOut is called.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        // Best-effort role fetch — don't block on it
        fetchUserRole(session.user).then(enriched => {
          setUser(enriched)
          writeCachedUser(enriched)
          setLoading(false)
        }).catch(() => {
          const base = mapUser(session.user)
          setUser(base)
          writeCachedUser(base)
          setLoading(false)
        })
      } else {
        // SIGNED_OUT or no session
        setUser(null)
        writeCachedUser(null)
        setLoading(false)
      }
    })

    // Safety net: if onAuthStateChange never fires (network issue), stop loading after 5s
    const safetyTimeout = setTimeout(() => setLoading(false), 5000)

    return () => {
      clearTimeout(safetyTimeout)
      subscription.unsubscribe()
    }
  }, [])

  const signOut = async () => {
    localStorage.removeItem('sine_dev_bypass')
    writeCachedUser(null)

    const keysToRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('sine_')) keysToRemove.push(key)
    }
    keysToRemove.forEach(k => localStorage.removeItem(k))

    try {
      await getSupabase().auth.signOut()
    } catch { /* ignore */ }

    setUser(null)
    window.location.href = '/sine/'
  }

  return { user, loading, signOut }
}
