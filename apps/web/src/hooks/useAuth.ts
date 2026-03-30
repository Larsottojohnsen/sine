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
// Supabase stores the session under the key:
//   sb-<project-ref>-auth-token
// This is available synchronously on page load — no network call needed.
// We use this to render the app immediately without any spinner.
const SUPABASE_SESSION_KEY = `sb-cauaqoqvpvjpeghejgvj-auth-token`

function readSessionUserSync(): AuthUser | null {
  try {
    // Dev bypass
    if (localStorage.getItem('sine_dev_bypass') === 'true') {
      return { id: 'dev-user', email: 'dev@sine.no', name: 'Dev User', role: 'admin', isAdmin: true }
    }
    const raw = localStorage.getItem(SUPABASE_SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    // Supabase stores { access_token, refresh_token, user, expires_at, ... }
    const u: User | undefined = parsed?.user
    if (!u?.id) return null
    // Check token hasn't expired (expires_at is Unix seconds)
    const expiresAt: number | undefined = parsed?.expires_at
    if (expiresAt && expiresAt * 1000 < Date.now()) return null
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

// Exported so LoginPage can trigger an immediate re-render after signInWithPassword
export function writeCachedUserFromLogin(_supabaseUser: User): void {
  // No-op: Supabase writes its own session to localStorage automatically.
  // onAuthStateChange will fire and update state. Nothing extra needed here.
}

export function useAuth() {
  // ── Synchronous init: read Supabase's own localStorage session ──
  // This is INSTANT — no network, no spinner, no waiting.
  // The user sees the app immediately on every page refresh.
  const [user, setUser] = useState<AuthUser | null>(() => readSessionUserSync())

  // loading is NEVER true when we already have a session in localStorage.
  // It's only true for brand-new visitors who have never logged in.
  const [loading, setLoading] = useState<boolean>(() => readSessionUserSync() === null)

  useEffect(() => {
    if (localStorage.getItem('sine_dev_bypass') === 'true') return

    const supabase = getSupabase()

    // onAuthStateChange is the single source of truth going forward.
    // It fires for: INITIAL_SESSION, SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED.
    // We do NOT wait for it to render the app — the sync read above handles that.
    // Here we just keep state up-to-date and enrich with role info.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        // Enrich with role in background — don't block rendering
        fetchUserRole(session.user).then(enriched => {
          setUser(enriched)
          setLoading(false)
        }).catch(() => {
          setUser(mapUser(session.user))
          setLoading(false)
        })
      } else {
        // SIGNED_OUT — clear user
        setUser(null)
        setLoading(false)
      }
    })

    // Safety net: stop loading after 3s even if onAuthStateChange never fires
    const safetyTimeout = setTimeout(() => setLoading(false), 3000)

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

    try {
      await getSupabase().auth.signOut()
    } catch { /* ignore */ }

    setUser(null)
    window.location.href = '/sine/'
  }

  return { user, loading, signOut }
}
