import { useEffect, useRef, useState } from 'react'
import { ChatMessage } from './ChatMessage'
import { ChatInput } from './ChatInput'
import { WelcomeScreen } from './WelcomeScreen'
import { useApp } from '@/store/AppContext'
import { useChat } from '@/hooks/useChat'
import { useAgent, type AgentMode } from '@/hooks/useAgent'
import AgentTerminalPanel from '../agent/AgentTerminalPanel'
import AgentSidePanel from '../agent/AgentSidePanel'

export function ChatView() {
  const { activeConversation, settings, updateSettings } = useApp()
  const { sendMessage, stopStreaming, isStreaming } = useChat()
  const { state: agentState, startAgent, stopAgent, approveAction, fetchFileContent } = useAgent()
  const [agentMode, setAgentMode] = useState<AgentMode>('safe')
  const [showSidePanel, setShowSidePanel] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeConversation?.messages])

  // Åpne sidepanel automatisk når agent starter
  useEffect(() => {
    if (agentState.status === 'running' || agentState.status === 'planning') {
      // Ikke åpne automatisk – brukeren klikker på terminal
    }
  }, [agentState.status])

  const handleSend = (text: string, mode?: AgentMode) => {
    // Sjekk om dette er en agent-oppgave (begynner med /, eller inneholder agent-nøkkelord)
    const isAgentTask = text.startsWith('/agent ') || text.startsWith('/run ')
    if (isAgentTask) {
      const task = text.replace(/^\/(agent|run)\s+/, '')
      startAgent(task, mode || agentMode)
    } else {
      sendMessage(text)
    }
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

  const isAgentActive = ['planning', 'running', 'waiting_approval'].includes(agentState.status)
  const showTerminal = isAgentActive || agentState.logs.length > 0
  const hasMessages = activeConversation && activeConversation.messages.length > 0

  const chatInputProps = {
    onSend: handleSend,
    onStop: stopStreaming,
    isStreaming,
    model: settings.model,
    onModelChange: (m: typeof settings.model) => updateSettings({ model: m }),
    language: settings.language,
    agentMode,
    onAgentModeChange: setAgentMode,
    isAgentActive,
  }

  if (!hasMessages) {
    return (
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <div className="chat-view" style={{ flex: 1 }}>
          <WelcomeScreen language={settings.language} onSuggestion={handleSuggestion} />

          {/* Mini-terminal over input */}
          {showTerminal && (
            <div style={{ padding: '0 24px' }}>
              <AgentTerminalPanel
                state={agentState}
                onExpand={() => setShowSidePanel(true)}
                onStop={stopAgent}
                onApprove={approveAction}
              />
            </div>
          )}

          <ChatInput {...chatInputProps} />
        </div>

        {/* Side panel */}
        {showSidePanel && (
          <AgentSidePanel
            state={agentState}
            onClose={() => setShowSidePanel(false)}
            onFetchFile={fetchFileContent}
          />
        )}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
      <div className="chat-view" style={{ flex: 1 }}>
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

        {/* Mini-terminal over input */}
        {showTerminal && (
          <div style={{ padding: '0 24px' }}>
            <AgentTerminalPanel
              state={agentState}
              onExpand={() => setShowSidePanel(true)}
              onStop={stopAgent}
              onApprove={approveAction}
            />
          </div>
        )}

        {/* Input */}
        <ChatInput {...chatInputProps} />
      </div>

      {/* Side panel */}
      {showSidePanel && (
        <AgentSidePanel
          state={agentState}
          onClose={() => setShowSidePanel(false)}
          onFetchFile={fetchFileContent}
        />
      )}
    </div>
  )
}
