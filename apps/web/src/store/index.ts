import { useState, useCallback } from 'react'
import type { Conversation, Message, SineModel, AppSettings } from '../types'
import { v4 as uuidv4 } from 'uuid'
import { generateTitle } from '../lib/utils'

const DEFAULT_SETTINGS: AppSettings = {
  language: 'no',
  model: 'sine-1',
  theme: 'dark',
}

// ─── User-scoped storage keys ─────────────────────────────────────────────────
// Conversations and settings are stored per-user so that different users
// on the same device cannot see each other's data.
function getUserId(): string {
  // Try to get the current user ID from localStorage (set by useAuth dev bypass)
  // or from Supabase session. Falls back to 'anon' for unauthenticated users.
  try {
    const bypass = localStorage.getItem('sine_dev_bypass')
    if (bypass === 'true') return 'dev-user'
    // Try to read Supabase session user id
    const sbKeys = Object.keys(localStorage).filter(k => k.startsWith('sb-') && k.endsWith('-auth-token'))
    if (sbKeys.length > 0) {
      const session = JSON.parse(localStorage.getItem(sbKeys[0]) || '{}')
      if (session?.user?.id) return session.user.id
    }
  } catch { /* ignore */ }
  return 'anon'
}

function convKey(): string { return `sine_conversations_${getUserId()}` }
function settingsKey(): string { return `sine_settings_${getUserId()}` }

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // ignore
  }
}

export function useAppStore() {
  // Compute user-scoped keys once at init time
  const [storageKeys] = useState(() => ({ conv: convKey(), settings: settingsKey() }))

  const [conversations, setConversations] = useState<Conversation[]>(() =>
    loadFromStorage<Conversation[]>(storageKeys.conv, []).map(c => ({
      ...c,
      createdAt: new Date(c.createdAt),
      updatedAt: new Date(c.updatedAt),
      messages: c.messages.map(m => ({ ...m, createdAt: new Date(m.createdAt) })),
    }))
  )
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [settings, setSettings] = useState<AppSettings>(() =>
    loadFromStorage<AppSettings>(storageKeys.settings, DEFAULT_SETTINGS)
  )
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settingsInitialTab, setSettingsInitialTab] = useState<string | undefined>(undefined)

  const openSettingsTab = useCallback((tab?: string) => {
    setSettingsInitialTab(tab)
    setSettingsOpen(true)
  }, [])

  const activeConversation = conversations.find(c => c.id === activeConversationId) ?? null

  const createConversation = useCallback((model: SineModel = settings.model): string => {
    const id = uuidv4()
    const now = new Date()
    const conv: Conversation = {
      id,
      title: 'Ny samtale',
      messages: [],
      createdAt: now,
      updatedAt: now,
      model,
    }
    setConversations(prev => {
      const updated = [conv, ...prev]
      saveToStorage(storageKeys.conv, updated)
      return updated
    })
    setActiveConversationId(id)
    return id
  }, [settings.model, storageKeys.conv])

  const addMessage = useCallback((conversationId: string, message: Omit<Message, 'id' | 'createdAt'>): string => {
    const id = uuidv4()
    const now = new Date()
    const newMsg: Message = { ...message, id, createdAt: now }

    setConversations(prev => {
      const updated = prev.map(c => {
        if (c.id !== conversationId) return c
        const msgs = [...c.messages, newMsg]
        const title = msgs.length === 1 && message.role === 'user'
          ? generateTitle(message.content)
          : c.title
        return { ...c, messages: msgs, updatedAt: now, title }
      })
      saveToStorage(storageKeys.conv, updated)
      return updated
    })
    return id
  }, [storageKeys.conv])

  const updateMessage = useCallback((conversationId: string, messageId: string, content: string, isStreaming = false) => {
    setConversations(prev => {
      const updated = prev.map(c => {
        if (c.id !== conversationId) return c
        return {
          ...c,
          messages: c.messages.map(m =>
            m.id === messageId ? { ...m, content, isStreaming } : m
          ),
          updatedAt: new Date(),
        }
      })
      // Ikke lagre til localStorage under streaming – kun når ferdig
      if (!isStreaming) saveToStorage(storageKeys.conv, updated)
      return updated
    })
  }, [storageKeys.conv])

  const updateAgentMessage = useCallback((
    conversationId: string,
    messageId: string,
    updates: Partial<Message>
  ) => {
    setConversations(prev => {
      const updated = prev.map(c => {
        if (c.id !== conversationId) return c
        return {
          ...c,
          messages: c.messages.map(m =>
            m.id === messageId ? { ...m, ...updates } : m
          ),
          updatedAt: new Date(),
        }
      })
      saveToStorage(storageKeys.conv, updated)
      return updated
    })
  }, [storageKeys.conv])

  const deleteConversation = useCallback((id: string) => {
    setConversations(prev => {
      const updated = prev.filter(c => c.id !== id)
      saveToStorage(storageKeys.conv, updated)
      return updated
    })
    if (activeConversationId === id) {
      setActiveConversationId(null)
    }
  }, [activeConversationId, storageKeys.conv])

  const updateSettings = useCallback((updates: Partial<AppSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...updates }
      saveToStorage(storageKeys.settings, updated)
      return updated
    })
  }, [storageKeys.settings])

  return {
    conversations,
    activeConversation,
    activeConversationId,
    setActiveConversationId,
    createConversation,
    addMessage,
    updateMessage,
    updateAgentMessage,
    deleteConversation,
    settings,
    updateSettings,
    sidebarOpen,
    setSidebarOpen,
    settingsOpen,
    setSettingsOpen,
    settingsInitialTab,
    setSettingsInitialTab,
    openSettingsTab,
  }
}

export type AppStore = ReturnType<typeof useAppStore>
