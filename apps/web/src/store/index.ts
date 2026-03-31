import { useState, useCallback, useEffect, useRef } from 'react'
import { v4 as uuidv4 } from 'uuid'
import type { Conversation, Message, SineModel, AppSettings } from '../types'
import { generateTitle } from '../lib/utils'
import { useAuth } from '../hooks/useAuth'
import {
  fetchConversations,
  createConversationInDb,
  updateConversationTitle,
  deleteConversationFromDb,
  insertMessage,
  updateMessageContent,
  toggleFavoriteInDb,
} from '../services/conversationService'

const DEFAULT_SETTINGS: AppSettings = {
  language: 'no',
  model: 'sine-1',
  theme: 'dark',
}

// ── Settings: still localStorage (not sensitive) ─────────────
function settingsKey(userId?: string | null): string {
  return userId ? `sine_settings_${userId}` : 'sine_settings'
}
function loadSettings(userId?: string | null): AppSettings {
  try {
    const raw = localStorage.getItem(settingsKey(userId))
    if (!raw) return DEFAULT_SETTINGS
    return JSON.parse(raw) as AppSettings
  } catch {
    return DEFAULT_SETTINGS
  }
}
function saveSettings(s: AppSettings, userId?: string | null) {
  try {
    localStorage.setItem(settingsKey(userId), JSON.stringify(s))
  } catch { /* ignore */ }
}

// ── Store ─────────────────────────────────────────────────────
export function useAppStore() {
  const { user } = useAuth()

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [conversationsLoaded, setConversationsLoaded] = useState(false)
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings(null))
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settingsInitialTab, setSettingsInitialTab] = useState<string | undefined>(undefined)

  // Keep userId in a ref so async callbacks can read it without stale closures
  const userIdRef = useRef<string | null>(null)
  useEffect(() => {
    userIdRef.current = user?.id ?? null
  }, [user?.id])

  // ── Track pending DB conversation creations to avoid FK race ──
  // When createConversation fires, the DB insert is async. addMessage
  // must wait for it before inserting messages or the FK constraint fails.
  const pendingConvCreates = useRef<Map<string, Promise<void>>>(new Map())

  // ── Load conversations from Supabase when user changes ───────
  useEffect(() => {
    if (!user?.id) {
      setConversations([])
      setActiveConversationId(null)
      setConversationsLoaded(false)
      return
    }

    // Reload settings scoped to this user
    setSettings(loadSettings(user.id))

    setConversationsLoaded(false)
    fetchConversations(user.id)
      .then(convs => {
        setConversations(convs)
        setConversationsLoaded(true)
      })
      .catch(() => {
        setConversationsLoaded(true)
      })
  }, [user?.id])

  const openSettingsTab = useCallback((tab?: string) => {
    setSettingsInitialTab(tab)
    setSettingsOpen(true)
  }, [])

  const activeConversation = conversations.find(c => c.id === activeConversationId) ?? null

  // ── Create conversation ───────────────────────────────────────
  const createConversation = useCallback((model: SineModel = DEFAULT_SETTINGS.model): string => {
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
    setConversations(prev => [conv, ...prev])
    setActiveConversationId(id)

    const uid = userIdRef.current
    if (uid) {
      // Register pending promise so addMessage can wait before inserting (FK constraint)
      const p = createConversationInDb(uid, id, 'Ny samtale', 'chat')
        .catch(console.error)
        .finally(() => pendingConvCreates.current.delete(id)) as Promise<void>
      pendingConvCreates.current.set(id, p)
    }

    return id
  }, [])

  // ── Add message ───────────────────────────────────────────────
  const addMessage = useCallback((conversationId: string, message: Omit<Message, 'id' | 'createdAt'>): string => {
    const id = uuidv4()
    const now = new Date()
    const newMsg: Message = { ...message, id, createdAt: now }

    let titleChanged = false
    let newTitle = ''

    setConversations(prev => {
      return prev.map(c => {
        if (c.id !== conversationId) return c
        const msgs = [...c.messages, newMsg]
        const title = msgs.length === 1 && message.role === 'user'
          ? generateTitle(message.content)
          : c.title
        if (title !== c.title) {
          titleChanged = true
          newTitle = title
        }
        return { ...c, messages: msgs, updatedAt: now, title }
      })
    })

    if (titleChanged) {
      updateConversationTitle(conversationId, newTitle).catch(console.error)
    }

    // Persist to Supabase — skip streaming placeholder (empty assistant messages)
    if (!message.isStreaming) {
      // Wait for conversation row to exist in DB before inserting message
      // (avoids FK constraint violation when conversation was just created)
      const pending = pendingConvCreates.current.get(conversationId)
      if (pending) {
        pending.then(() => insertMessage(conversationId, newMsg)).catch(console.error)
      } else {
        insertMessage(conversationId, newMsg).catch(console.error)
      }
    }

    return id
  }, [])

  // ── Update message (called during streaming + on finish) ─────
  const updateMessage = useCallback((conversationId: string, messageId: string, content: string, isStreaming = false) => {
    let msgCreatedAt: Date = new Date()
    let msgRole = 'assistant'

    setConversations(prev => {
      return prev.map(c => {
        if (c.id !== conversationId) return c
        return {
          ...c,
          messages: c.messages.map(m => {
            if (m.id !== messageId) return m
            // Capture metadata for upsert fallback
            msgCreatedAt = m.createdAt
            msgRole = m.role
            return { ...m, content, isStreaming }
          }),
          updatedAt: new Date(),
        }
      })
    })

    // Persist to Supabase only when streaming is finished.
    // Pass fallback so the row is upserted even if the placeholder was never inserted.
    if (!isStreaming) {
      updateMessageContent(messageId, content, undefined, {
        conversationId,
        role: msgRole,
        createdAt: msgCreatedAt,
      }).catch(console.error)
    }
  }, [])

  // ── Update agent message (tasks, files, plan, events) ────────
  const updateAgentMessage = useCallback((
    conversationId: string,
    messageId: string,
    updates: Partial<Message>
  ) => {
    setConversations(prev => {
      return prev.map(c => {
        if (c.id !== conversationId) return c
        return {
          ...c,
          messages: c.messages.map(m =>
            m.id === messageId ? { ...m, ...updates } : m
          ),
          updatedAt: new Date(),
        }
      })
    })

    // Build metadata object for Supabase
    const meta: Record<string, unknown> = {}
    if (updates.agentTasks)     meta.agentTasks     = updates.agentTasks
    if (updates.agentFiles)     meta.agentFiles     = updates.agentFiles
    if (updates.agentStatus)    meta.agentStatus    = updates.agentStatus
    if (updates.agentPlan)      meta.agentPlan      = updates.agentPlan
    if (updates.agentEvents)    meta.agentEvents    = updates.agentEvents
    if (updates.isAgentMessage) meta.isAgentMessage = updates.isAgentMessage

    if (Object.keys(meta).length > 0) {
      updateMessageContent(messageId, updates.content ?? '', meta).catch(console.error)
    }
  }, [])

  // ── Delete conversation ───────────────────────────────────────
  const deleteConversation = useCallback((id: string) => {
    setConversations(prev => prev.filter(c => c.id !== id))
    if (activeConversationId === id) setActiveConversationId(null)
    deleteConversationFromDb(id).catch(console.error)
  }, [activeConversationId])

  // ── Toggle favourite ──────────────────────────────────────────
  const toggleFavorite = useCallback((id: string) => {
    let newVal = false
    setConversations(prev => prev.map(c => {
      if (c.id !== id) return c
      newVal = !c.isFavorite
      return { ...c, isFavorite: newVal }
    }))
    toggleFavoriteInDb(id, newVal).catch(console.error)
  }, [])

  // ── Rename conversation ───────────────────────────────────────
  const renameConversation = useCallback((id: string, newTitle: string) => {
    if (!newTitle.trim()) return
    setConversations(prev => prev.map(c =>
      c.id === id ? { ...c, title: newTitle.trim() } : c
    ))
    updateConversationTitle(id, newTitle.trim()).catch(console.error)
  }, [])

  // ── Settings ──────────────────────────────────────────────────
  const updateSettings = useCallback((updates: Partial<AppSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...updates }
      saveSettings(updated, userIdRef.current)
      return updated
    })
  }, [])

  return {
    conversations,
    conversationsLoaded,
    activeConversation,
    activeConversationId,
    setActiveConversationId,
    createConversation,
    addMessage,
    updateMessage,
    updateAgentMessage,
    deleteConversation,
    toggleFavorite,
    renameConversation,
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
