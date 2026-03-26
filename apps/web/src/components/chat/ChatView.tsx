import { useEffect, useRef } from 'react'
import { ChatMessage } from './ChatMessage'
import { ChatInput } from './ChatInput'
import { WelcomeScreen } from './WelcomeScreen'
import { useApp } from '@/store/AppContext'
import { useChat } from '@/hooks/useChat'

export function ChatView() {
  const { activeConversation, settings, updateSettings } = useApp()
  const { sendMessage, stopStreaming, isStreaming } = useChat()
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeConversation?.messages])

  const handleSend = (text: string) => {
    sendMessage(text)
  }

  const handleSuggestion = (text: string) => {
    sendMessage(text)
  }

  const handleRegenerate = () => {
    if (!activeConversation) return
    const messages = activeConversation.messages
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')
    if (lastUserMsg) {
      sendMessage(lastUserMsg.content)
    }
  }

  const hasMessages = activeConversation && activeConversation.messages.length > 0

  return (
    <div className="flex flex-col h-full" style={{ background: '#1C1C1C' }}>
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto">
        {!hasMessages ? (
          <div className="flex flex-col h-full">
            <div className="flex-1 flex flex-col items-center justify-center">
              <WelcomeScreen language={settings.language} onSuggestion={handleSuggestion} />
            </div>
            {/* Input centered on welcome screen */}
            <div className="w-full max-w-2xl mx-auto px-4 pb-6">
              <ChatInput
                onSend={handleSend}
                onStop={stopStreaming}
                isStreaming={isStreaming}
                model={settings.model}
                onModelChange={m => updateSettings({ model: m })}
                language={settings.language}
              />
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto py-4">
            {activeConversation.messages.map((msg, i) => (
              <ChatMessage
                key={msg.id}
                message={msg}
                isLast={i === activeConversation.messages.length - 1}
                onRegenerate={i === activeConversation.messages.length - 1 ? handleRegenerate : undefined}
              />
            ))}
            <div ref={bottomRef} className="h-4" />
          </div>
        )}
      </div>

      {/* Input at bottom when in conversation */}
      {hasMessages && (
        <div className="w-full max-w-3xl mx-auto">
          <ChatInput
            onSend={handleSend}
            onStop={stopStreaming}
            isStreaming={isStreaming}
            model={settings.model}
            onModelChange={m => updateSettings({ model: m })}
            language={settings.language}
          />
        </div>
      )}
    </div>
  )
}
