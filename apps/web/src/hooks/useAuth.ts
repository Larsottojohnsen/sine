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
        // Store session in localStorage so it survives page refresh
        persistSession: true,
        // Detect OAuth tokens in URL hash automatically
        detectSessionInUrl: true,
        // Use PKCE flow for better security
        flowType: 'pkce',
      },
    })
  }
  return _supabase
}

// ── Cached user in memory (survives React re-renders) ─────────
// This is populated synchronously from localStorage on first load
// so the app can render immediately without waiting for Supabase.
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
  // ── Initialise synchronously from cache so loading=false immediately ──
  const [user, setUser] = useState<AuthUser | null>(() => {
    // Dev bypass
    if (typeof window !== 'undefined' && localStorage.getItem('sine_dev_bypass') === 'true') {
      return {
        id: 'dev-user',
        email: 'dev@sine.no',
        name: 'Dev User',
        role: 'admin',
        isAdmin: true,
      }
    }
    return readCachedUser()
  })

  // loading=false immediately if we have a cached user, otherwise true
  const [loading, setLoading] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('sine_dev_bypass') === 'true') {
      return false
    }
    // If there is a cached user we can show the app right away
    return readCachedUser() === null
  })

  useEffect(() => {
    // Dev bypass — nothing to do
    if (localStorage.getItem('sine_dev_bypass') === 'true') return

    const supabase = getSupabase()

    // ── Background verification: confirm the cached session is still valid ──
    // We do NOT block rendering on this — the app is already visible.
    // A short timeout ensures we don't hang forever if Supabase is slow.
    const verifyTimeout = setTimeout(() => {
      // If Supabase still hasn't responded after 5s, trust the cache and stop loading
      setLoading(false)
    }, 5000)

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      clearTimeout(verifyTimeout)
      if (session?.user) {
        // Session is valid — enrich with role (non-blocking, best-effort)
        const enriched = await fetchUserRole(session.user)
        setUser(enriched)
        writeCachedUser(enriched)
      } else {
        // No active session — clear cache and show unauthenticated state
        setUser(null)
        writeCachedUser(null)
      }
      setLoading(false)
    }).catch(() => {
      clearTimeout(verifyTimeout)
      // Network error — keep cached user visible, stop loading
      setLoading(false)
    })

    // ── Listen for auth state changes (login, logout, token refresh) ──
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const enriched = await fetchUserRole(session.user)
        setUser(enriched)
        writeCachedUser(enriched)
      } else {
        setUser(null)
        writeCachedUser(null)
      }
      setLoading(false)
    })

    return () => {
      clearTimeout(verifyTimeout)
      subscription.unsubscribe()
    }
  }, [])

  const signOut = async () => {
    // Clear dev bypass and all sine_* localStorage keys
    localStorage.removeItem('sine_dev_bypass')
    writeCachedUser(null)

    const keysToRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('sine_')) keysToRemove.push(key)
    }
    keysToRemove.forEach(k => localStorage.removeItem(k))

    try {
      const supabase = getSupabase()
      await supabase.auth.signOut()
    } catch {
      // Ignore Supabase errors on sign out
    }

    setUser(null)
    window.location.href = '/sine/'
  }

  return { user, loading, signOut }
}
