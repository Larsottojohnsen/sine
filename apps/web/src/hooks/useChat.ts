import { useState, useCallback, useRef } from 'react'
import { useApp } from '@/store/AppContext'

// Backend API URL – bruker Railway i produksjon
const API_BASE = import.meta.env.VITE_API_URL || 'https://sineapi-production-8db6.up.railway.app'

// Batch-interval for smooth streaming (ms)
const BATCH_INTERVAL = 40

export function useChat() {
  const { activeConversation, activeConversationId, createConversation, addMessage, updateMessage, settings } = useApp()
  const [isStreaming, setIsStreaming] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  const sendMessage = useCallback(async (userInput: string) => {
    // Ensure we have an active conversation
    let convId = activeConversationId
    if (!convId) {
      convId = createConversation(settings.model)
    }

    // Add user message
    addMessage(convId, { role: 'user', content: userInput })

    // Add empty assistant message (will be streamed into)
    const assistantMsgId = addMessage(convId, { role: 'assistant', content: '', isStreaming: true })

    setIsStreaming(true)
    abortRef.current = new AbortController()

    // ── Batch-buffer for smooth streaming ──────────────────────────
    let batchTimer: ReturnType<typeof setTimeout> | null = null
    let accumulated = ''

    const flushToUI = (final: boolean) => {
      if (batchTimer) {
        clearTimeout(batchTimer)
        batchTimer = null
      }
      updateMessage(convId!, assistantMsgId, accumulated, !final)
    }

    const scheduleBatch = () => {
      if (batchTimer) return
      batchTimer = setTimeout(() => {
        batchTimer = null
        updateMessage(convId!, assistantMsgId, accumulated, true)
      }, BATCH_INTERVAL)
    }
    // ───────────────────────────────────────────────────────────────

    try {
      // Build message history from conversation
      const conv = activeConversation
      const history = conv?.messages
        .filter(m => m.role === 'user' || m.role === 'assistant')
        .filter(m => m.content && m.content.trim() !== '')
        .map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })) ?? []

      // Add the new user message at the end
      const messages = [
        ...history,
        { role: 'user' as const, content: userInput },
      ]

      // Hent brukerminne fra localStorage
      let userMemory: Array<{key: string, value: string}> = []
      try {
        const stored = localStorage.getItem('sine_user_memory')
        if (stored) userMemory = JSON.parse(stored)
      } catch { /* ignore */ }

      const response = await fetch(`${API_BASE}/api/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages,
          model: settings.model || 'sine-1',
          language: 'no',
          user_memory: userMemory,
          conversation_id: convId,
        }),
        signal: abortRef.current.signal,
      })

      if (!response.ok) {
        const err = await response.text()
        throw new Error(`API-feil: ${response.status} – ${err}`)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) throw new Error('Ingen response body')

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6).trim()
          if (!data) continue

          try {
            const parsed = JSON.parse(data)
            if (parsed.type === 'token') {
              accumulated += parsed.content
              scheduleBatch()
            } else if (parsed.type === 'done') {
              // Streaming ferdig
            } else if (parsed.type === 'error') {
              throw new Error(parsed.message)
            }
          } catch (parseErr) {
            // ignore JSON parse errors for partial chunks
          }
        }
      }

      // Mark streaming as done – flush final content
      flushToUI(true)
    } catch (err: unknown) {
      if (batchTimer) clearTimeout(batchTimer)
      if (err instanceof Error && err.name === 'AbortError') {
        // User stopped generation – keep what we have
        updateMessage(convId!, assistantMsgId, accumulated || '', false)
      } else {
        const msg = err instanceof Error ? err.message : 'Ukjent feil'
        updateMessage(convId!, assistantMsgId, `*Feil: ${msg}*`, false)
      }
    } finally {
      setIsStreaming(false)
      abortRef.current = null
    }
  }, [activeConversationId, activeConversation, createConversation, addMessage, updateMessage, settings.model])

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort()
  }, [])

  return { sendMessage, stopStreaming, isStreaming }
}
