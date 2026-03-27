import { useState, useCallback } from 'react'
import type { Conversation, Message, SineModel, AppSettings } from '../types'
import { v4 as uuidv4 } from 'uuid'
import { generateTitle } from '../lib/utils'

const DEFAULT_SETTINGS: AppSettings = {
  language: 'no',
  model: 'sine-1',
  theme: 'dark',
}

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
  const [conversations, setConversations] = useState<Conversation[]>(() =>
    loadFromStorage<Conversation[]>('sine_conversations', []).map(c => ({
      ...c,
      createdAt: new Date(c.createdAt),
      updatedAt: new Date(c.updatedAt),
      messages: c.messages.map(m => ({ ...m, createdAt: new Date(m.createdAt) })),
    }))
  )
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [settings, setSettings] = useState<AppSettings>(() =>
    loadFromStorage<AppSettings>('sine_settings', DEFAULT_SETTINGS)
  )
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [settingsOpen, setSettingsOpen] = useState(false)

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
      saveToStorage('sine_conversations', updated)
      return updated
    })
    setActiveConversationId(id)
    return id
  }, [settings.model])

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
      saveToStorage('sine_conversations', updated)
      return updated
    })
    return id
  }, [])

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
      if (!isStreaming) saveToStorage('sine_conversations', updated)
      return updated
    })
  }, [])

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
      saveToStorage('sine_conversations', updated)
      return updated
    })
  }, [])

  const deleteConversation = useCallback((id: string) => {
    setConversations(prev => {
      const updated = prev.filter(c => c.id !== id)
      saveToStorage('sine_conversations', updated)
      return updated
    })
    if (activeConversationId === id) {
      setActiveConversationId(null)
    }
  }, [activeConversationId])

  const updateSettings = useCallback((updates: Partial<AppSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...updates }
      saveToStorage('sine_settings', updated)
      return updated
    })
  }, [])

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
  }
}

export type AppStore = ReturnType<typeof useAppStore>
