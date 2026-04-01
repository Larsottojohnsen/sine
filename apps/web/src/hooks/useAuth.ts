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
        // Do NOT use flowType:'pkce' — it breaks email/password login
      },
    })
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

// ── Read Supabase's own persisted session from localStorage synchronously ──
// Supabase stores the session under the key: sb-<project-ref>-auth-token
// This is available synchronously on page load — no network call needed.
const SUPABASE_SESSION_KEY = `sb-cauaqoqvpvjpeghejgvj-auth-token`

function readSessionUserSync(): AuthUser | null {
  try {
    // Dev bypass
    if (typeof localStorage !== 'undefined' && localStorage.getItem('sine_dev_bypass') === 'true') {
      return { id: 'dev-user', email: 'dev@sine.no', name: 'Dev User', role: 'admin', isAdmin: true }
    }
    const raw = localStorage.getItem(SUPABASE_SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    // Supabase stores { access_token, refresh_token, user, expires_at, ... }
    // It may also be nested under a 'currentSession' key in some versions
    const session = parsed?.currentSession ?? parsed
    const u: User | undefined = session?.user
    if (!u?.id) return null
    // Check token hasn't expired (expires_at is Unix seconds)
    const expiresAt: number | undefined = session?.expires_at
    if (expiresAt && expiresAt * 1000 < Date.now()) {
      // Token expired — but Supabase will refresh it via onAuthStateChange
      // Still return the user so we don't flash a spinner
      return mapUser(u)
    }
    return mapUser(u)
  } catch {
    return null
  }
}

async function fetchUserRole(supabaseUser: User): Promise<AuthUser> {
  const base = mapUser(supabaseUser)
  try {
    const { data } = await getSupabase()
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

// No-op export kept for backward compatibility
export function writeCachedUserFromLogin(_supabaseUser: User): void {
  // Supabase writes its own session to localStorage automatically.
  // onAuthStateChange will fire and update state.
}

export function useAuth() {
  // Synchronous init: read Supabase's own localStorage session.
  // This is INSTANT — no network, no spinner, no waiting.
  const [user, setUser] = useState<AuthUser | null>(() => readSessionUserSync())

  // loading is only true when there is NO cached session at all.
  // For returning users, loading starts as false → no spinner ever shown.
  const [loading, setLoading] = useState<boolean>(() => readSessionUserSync() === null)

  useEffect(() => {
    if (localStorage.getItem('sine_dev_bypass') === 'true') {
      setLoading(false)
      return
    }

    const supabase = getSupabase()
    let resolved = false

    const resolve = (authUser: AuthUser | null) => {
      resolved = true
      setUser(authUser)
      setLoading(false)
    }

    // onAuthStateChange is the single source of truth.
    // It fires for: INITIAL_SESSION, SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        // Immediately set user from session (no delay)
        setUser(mapUser(session.user))
        setLoading(false)
        // Enrich with role in background — don't block rendering
        fetchUserRole(session.user).then(enriched => {
          setUser(enriched)
        }).catch(() => {
          // ignore role fetch error
        })
        resolved = true
      } else {
        // SIGNED_OUT or no session
        resolve(null)
      }
    })

    // Hard safety net: if onAuthStateChange never fires within 4s,
    // stop loading and show the login page.
    const safetyTimeout = setTimeout(() => {
      if (!resolved) {
        setLoading(false)
      }
    }, 4000)

    return () => {
      clearTimeout(safetyTimeout)
      subscription.unsubscribe()
    }
  }, [])

  const signOut = async () => {
    localStorage.removeItem('sine_dev_bypass')

    // Clear all sine_ prefixed keys
    const keysToRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('sine_')) keysToRemove.push(key)
    }
    keysToRemove.forEach(k => localStorage.removeItem(k))

    // Also clear the Supabase session key to prevent stale cache reads
    localStorage.removeItem(SUPABASE_SESSION_KEY)

    try {
      await getSupabase().auth.signOut()
    } catch { /* ignore */ }

    setUser(null)
    window.location.href = '/'
  }

  return { user, loading, signOut }
}
