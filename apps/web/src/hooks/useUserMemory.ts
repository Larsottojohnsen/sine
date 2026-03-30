import { useState, useCallback, useEffect, useRef } from 'react'
import { v4 as uuidv4 } from 'uuid'
import type { UserMemory } from '@/types'
import { supabase } from '@/lib/supabaseClient'

const API_BASE = import.meta.env.VITE_API_URL || 'https://sineapi-production-8db6.up.railway.app'

// ── Fallback: localStorage for uinnloggede brukere ────────────
const LS_KEY = 'sine_user_memory'

function loadLocalMemory(): UserMemory[] {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as UserMemory[]
    return parsed.map(m => ({ ...m, createdAt: new Date(m.createdAt) }))
  } catch {
    return []
  }
}

function saveLocalMemory(memory: UserMemory[]): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(memory))
  } catch { /* ignore */ }
}

// ── Konverter Supabase-rad til UserMemory ─────────────────────
function rowToMemory(row: Record<string, unknown>): UserMemory {
  return {
    id: row.id as string,
    key: row.key as string,
    value: row.value as string,
    source: (row.source as string) || 'manuelt',
    createdAt: new Date(row.created_at as string),
  }
}

export function useUserMemory() {
  const [memory, setMemory] = useState<UserMemory[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)
  const extractDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Hent bruker-ID fra Supabase Auth ─────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const uid = data.session?.user?.id ?? null
      setUserId(uid)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  // ── Last minne fra Supabase (eller localStorage som fallback) ─
  useEffect(() => {
    if (userId === undefined) return // venter på auth-sjekk

    if (userId) {
      // Innlogget: hent fra Supabase
      fetch(`${API_BASE}/api/memory`, {
        headers: { 'x-user-id': userId },
      })
        .then(r => r.json())
        .then(data => {
          const rows: UserMemory[] = (data.memory ?? []).map(rowToMemory)
          setMemory(rows)
          setLoaded(true)
        })
        .catch(() => {
          // Fallback til localStorage
          setMemory(loadLocalMemory())
          setLoaded(true)
        })
    } else {
      // Ikke innlogget: bruk localStorage
      setMemory(loadLocalMemory())
      setLoaded(true)
    }
  }, [userId])

  // ── Legg til minne ────────────────────────────────────────────
  const addMemory = useCallback(async (key: string, value: string, source: string) => {
    if (userId) {
      try {
        const res = await fetch(`${API_BASE}/api/memory`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
          body: JSON.stringify({ key, value, source }),
        })
        const data = await res.json()
        const newEntry = rowToMemory(data.memory)
        setMemory(prev => {
          const existing = prev.findIndex(m => m.key.toLowerCase() === key.toLowerCase())
          if (existing >= 0) {
            return prev.map((m, i) => i === existing ? newEntry : m)
          }
          return [...prev, newEntry]
        })
      } catch {
        // Fallback til lokal
        setMemory(prev => {
          const existing = prev.findIndex(m => m.key.toLowerCase() === key.toLowerCase())
          let updated: UserMemory[]
          if (existing >= 0) {
            updated = prev.map((m, i) => i === existing ? { ...m, value, source, createdAt: new Date() } : m)
          } else {
            updated = [...prev, { id: uuidv4(), key, value, source, createdAt: new Date() }]
          }
          saveLocalMemory(updated)
          return updated
        })
      }
    } else {
      setMemory(prev => {
        const existing = prev.findIndex(m => m.key.toLowerCase() === key.toLowerCase())
        let updated: UserMemory[]
        if (existing >= 0) {
          updated = prev.map((m, i) => i === existing ? { ...m, value, source, createdAt: new Date() } : m)
        } else {
          updated = [...prev, { id: uuidv4(), key, value, source, createdAt: new Date() }]
        }
        saveLocalMemory(updated)
        return updated
      })
    }
  }, [userId])

  // ── Fjern minne ───────────────────────────────────────────────
  const removeMemory = useCallback(async (id: string) => {
    setMemory(prev => prev.filter(m => m.id !== id))

    if (userId) {
      try {
        await fetch(`${API_BASE}/api/memory/${id}`, {
          method: 'DELETE',
          headers: { 'x-user-id': userId },
        })
      } catch { /* ignore */ }
    } else {
      setMemory(prev => {
        const updated = prev.filter(m => m.id !== id)
        saveLocalMemory(updated)
        return updated
      })
    }
  }, [userId])

  // ── Slett alt minne ───────────────────────────────────────────
  const clearMemory = useCallback(async () => {
    setMemory([])
    if (userId) {
      try {
        await fetch(`${API_BASE}/api/memory`, {
          method: 'DELETE',
          headers: { 'x-user-id': userId },
        })
      } catch { /* ignore */ }
    } else {
      localStorage.removeItem(LS_KEY)
    }
  }, [userId])

  // ── Bygg kontekst-streng for system prompt ────────────────────
  const buildMemoryContext = useCallback((): string => {
    if (memory.length === 0) return ''
    const lines = memory.map(m => `- ${m.key}: ${m.value}`)
    return `\n\nBruker-kontekst (husk dette):\n${lines.join('\n')}`
  }, [memory])

  // ── LLM-basert ekstraksjon via backend (debounced) ────────────
  const extractFromMessage = useCallback((message: string, _conversationTitle: string) => {
    if (!userId) {
      // Fallback: regex-basert ekstraksjon for uinnloggede
      const patterns: Array<{ regex: RegExp; key: string }> = [
        { regex: /(?:jeg er|jeg studerer|jeg går på|jeg tar)\s+(.+?)(?:\s+ved|\s+på|\s+i|\.|,|$)/i, key: 'utdanning' },
        { regex: /(?:jeg jobber|jeg er ansatt|jeg er utvikler|jeg er designer)\s+(?:som\s+)?(.+?)(?:\s+ved|\s+hos|\s+i|\.|,|$)/i, key: 'jobb' },
        { regex: /(?:jeg heter|mitt navn er)\s+([A-ZÆØÅ][a-zæøå]+)/i, key: 'navn' },
        { regex: /(?:jeg bruker|jeg foretrekker|mitt favoritt)\s+(.+?)(?:\s+som|\s+til|\.|,|$)/i, key: 'preferanse' },
        { regex: /(?:prosjektet mitt|min app|min nettside)\s+(?:heter|kalles)\s+([^.,]+)/i, key: 'prosjekt' },
      ]
      for (const { regex, key } of patterns) {
        const match = message.match(regex)
        if (match?.[1] && match[1].trim().length > 2) {
          addMemory(key, match[1].trim(), 'auto-regex')
        }
      }
      return
    }

    // Debounce: vent 2s etter siste melding før ekstraksjon
    if (extractDebounceRef.current) clearTimeout(extractDebounceRef.current)
    extractDebounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/memory/extract`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
          body: JSON.stringify({ message, user_id: userId }),
        })
        const data = await res.json()
        if (data.added > 0) {
          // Oppdater lokal state med nye minne-oppføringer
          const newEntries: UserMemory[] = (data.extracted ?? []).map(rowToMemory)
          setMemory(prev => {
            const updated = [...prev]
            for (const entry of newEntries) {
              const existing = updated.findIndex(m => m.key.toLowerCase() === entry.key.toLowerCase())
              if (existing >= 0) {
                updated[existing] = entry
              } else {
                updated.push(entry)
              }
            }
            return updated
          })
        }
      } catch { /* ignore */ }
    }, 2000)
  }, [userId, addMemory])

  return { memory, addMemory, removeMemory, clearMemory, buildMemoryContext, extractFromMessage, loaded }
}
