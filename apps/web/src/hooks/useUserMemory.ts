import { useState, useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'
import type { UserMemory } from '@/types'

const STORAGE_KEY = 'sine_user_memory'

function loadMemory(): UserMemory[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as UserMemory[]
    return parsed.map(m => ({ ...m, createdAt: new Date(m.createdAt) }))
  } catch {
    return []
  }
}

function saveMemory(memory: UserMemory[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(memory))
  } catch {
    // ignore
  }
}

export function useUserMemory() {
  const [memory, setMemory] = useState<UserMemory[]>(loadMemory)

  const addMemory = useCallback((key: string, value: string, source: string) => {
    setMemory(prev => {
      // Oppdater eksisterende nøkkel eller legg til ny
      const existing = prev.findIndex(m => m.key.toLowerCase() === key.toLowerCase())
      let updated: UserMemory[]
      if (existing >= 0) {
        updated = prev.map((m, i) => i === existing ? { ...m, value, source, createdAt: new Date() } : m)
      } else {
        const newEntry: UserMemory = {
          id: uuidv4(),
          key,
          value,
          source,
          createdAt: new Date(),
        }
        updated = [...prev, newEntry]
      }
      saveMemory(updated)
      return updated
    })
  }, [])

  const removeMemory = useCallback((id: string) => {
    setMemory(prev => {
      const updated = prev.filter(m => m.id !== id)
      saveMemory(updated)
      return updated
    })
  }, [])

  const clearMemory = useCallback(() => {
    setMemory([])
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  // Bygg en kontekst-streng for system prompt
  const buildMemoryContext = useCallback((): string => {
    if (memory.length === 0) return ''
    const lines = memory.map(m => `- ${m.key}: ${m.value}`)
    return `\n\nBruker-kontekst (husk dette):\n${lines.join('\n')}`
  }, [memory])

  // Forsøk å trekke ut minne-verdier fra en melding
  const extractFromMessage = useCallback((message: string, conversationTitle: string) => {
    const patterns: Array<{ regex: RegExp; key: string }> = [
      { regex: /(?:jeg er|jeg studerer|jeg går på|jeg tar)\s+(.+?)(?:\s+ved|\s+på|\s+i|\.|,|$)/i, key: 'utdanning' },
      { regex: /(?:jeg jobber|jeg er ansatt|jeg er utvikler|jeg er designer)\s+(?:som\s+)?(.+?)(?:\s+ved|\s+hos|\s+i|\.|,|$)/i, key: 'jobb' },
      { regex: /(?:jeg heter|mitt navn er)\s+([A-ZÆØÅ][a-zæøå]+)/i, key: 'navn' },
      { regex: /(?:jeg bruker|jeg foretrekker|mitt favoritt)\s+(.+?)(?:\s+som|\s+til|\.|,|$)/i, key: 'preferanse' },
      { regex: /(?:prosjektet mitt|min app|min nettside)\s+(?:heter|kalles)\s+([^.,]+)/i, key: 'prosjekt' },
    ]

    for (const { regex, key } of patterns) {
      const match = message.match(regex)
      if (match && match[1] && match[1].trim().length > 2) {
        addMemory(key, match[1].trim(), conversationTitle)
      }
    }
  }, [addMemory])

  return { memory, addMemory, removeMemory, clearMemory, buildMemoryContext, extractFromMessage }
}
