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

  if (!hasMessages) {
    return (
      <div className="chat-view">
        <WelcomeScreen language={settings.language} onSuggestion={handleSuggestion} />
        <ChatInput
          onSend={handleSend}
          onStop={stopStreaming}
          isStreaming={isStreaming}
          model={settings.model}
          onModelChange={m => updateSettings({ model: m })}
          language={settings.language}
        />
      </div>
    )
  }

  return (
    <div className="chat-view">
      {/* Messages */}
      <div className="chat-messages-area">
        <div className="chat-messages-inner">
          {activeConversation.messages.map((msg, i) => (
            <ChatMessage
              key={msg.id}
              message={msg}
              isLast={i === activeConversation.messages.length - 1}
              onRegenerate={i === activeConversation.messages.length - 1 ? handleRegenerate : undefined}
            />
          ))}
          <div ref={bottomRef} style={{ height: 16 }} />
        </div>
      </div>

      {/* Input */}
      <ChatInput
        onSend={handleSend}
        onStop={stopStreaming}
        isStreaming={isStreaming}
        model={settings.model}
        onModelChange={m => updateSettings({ model: m })}
        language={settings.language}
      />
    </div>
  )
}
