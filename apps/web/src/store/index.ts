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
      createConversationInDb(uid, id, 'Ny samtale', 'chat').catch(console.error)
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
      insertMessage(conversationId, newMsg).catch(console.error)
    }

    return id
  }, [])

  // ── Update message (called during streaming + on finish) ─────
  const updateMessage = useCallback((conversationId: string, messageId: string, content: string, isStreaming = false) => {
    setConversations(prev => {
      return prev.map(c => {
        if (c.id !== conversationId) return c
        return {
          ...c,
          messages: c.messages.map(m =>
            m.id === messageId ? { ...m, content, isStreaming } : m
          ),
          updatedAt: new Date(),
        }
      })
    })

    // Persist to Supabase only when streaming is finished
    if (!isStreaming) {
      updateMessageContent(messageId, content).catch(console.error)
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
