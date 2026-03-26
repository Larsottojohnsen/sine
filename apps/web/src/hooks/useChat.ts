import { useState, useCallback, useRef } from 'react'
import { useApp } from '@/store/AppContext'
import type { SineModel } from '@/types'

const MODEL_MAP: Record<SineModel, string> = {
  'sine-1': 'claude-haiku-4-5-20251001',
  'sine-pro': 'claude-sonnet-4-6',
}

const SYSTEM_PROMPT = `Du er Sine, en norsk AI-assistent. Du er hjelpsom, presis og vennlig. 
Du svarer alltid på norsk med mindre brukeren skriver på et annet språk.
Du er laget for norske brukere og har god kunnskap om norske forhold, regler og kultur.
Du er ærlig om usikkerhet og sier tydelig fra når du ikke vet noe sikkert.
Formater svarene dine med markdown der det er hensiktsmessig.`

export function useChat() {
  const { activeConversation, activeConversationId, createConversation, addMessage, updateMessage, settings } = useApp()
  const [isStreaming, setIsStreaming] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  const sendMessage = useCallback(async (userInput: string) => {
    const apiKey = import.meta.env.VITE_CLAUDE_API_KEY
    if (!apiKey) {
      console.error('VITE_CLAUDE_API_KEY mangler')
      return
    }

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

    try {
      // Build message history from conversation
      const conv = activeConversation
      const history = conv?.messages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })) ?? []

      // Add the new user message
      const messages = [
        ...history.filter(m => m.role === 'user' || m.role === 'assistant'),
        { role: 'user' as const, content: userInput },
      ]

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: MODEL_MAP[settings.model],
          max_tokens: 4096,
          system: SYSTEM_PROMPT,
          messages,
          stream: true,
        }),
        signal: abortRef.current.signal,
      })

      if (!response.ok) {
        const err = await response.text()
        throw new Error(`API-feil: ${response.status} – ${err}`)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''

      if (!reader) throw new Error('Ingen response body')

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6).trim()
          if (data === '[DONE]') continue

          try {
            const parsed = JSON.parse(data)
            if (parsed.type === 'content_block_delta' && parsed.delta?.type === 'text_delta') {
              accumulated += parsed.delta.text
              updateMessage(convId!, assistantMsgId, accumulated, true)
            }
          } catch {
            // ignore parse errors
          }
        }
      }

      // Mark streaming as done
      updateMessage(convId!, assistantMsgId, accumulated, false)
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        // User stopped generation – keep what we have
        updateMessage(convId!, assistantMsgId, '', false)
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
