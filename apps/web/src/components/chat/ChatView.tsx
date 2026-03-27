import { useEffect, useRef, useState } from 'react'
import { ChatMessage } from './ChatMessage'
import { ChatInput } from './ChatInput'
import { useApp } from '@/store/AppContext'
import { useChat } from '@/hooks/useChat'
import { useAgent, type AgentMode } from '@/hooks/useAgent'
import AgentTerminalPanel from '../agent/AgentTerminalPanel'
import AgentSidePanel from '../agent/AgentSidePanel'
import { useNav } from '@/App'
import {
  Globe, Code2, BarChart3, FileText, Zap,
  Terminal, Search, GitBranch, Bot
} from 'lucide-react'

// ─── Chat velkomst-forslag ────────────────────────────────────
const CHAT_SUGGESTIONS = [
  { icon: <Globe size={13} />, label: 'Forklar et konsept', prompt: 'Forklar meg ' },
  { icon: <Code2 size={13} />, label: 'Skriv kode', prompt: 'Skriv kode for ' },
  { icon: <FileText size={13} />, label: 'Lag et sammendrag', prompt: 'Lag et sammendrag av ' },
  { icon: <Search size={13} />, label: 'Analyser tekst', prompt: 'Analyser denne teksten: ' },
  { icon: <GitBranch size={13} />, label: 'Oversett', prompt: 'Oversett dette til norsk: ' },
]

// ─── Agent velkomst-forslag ───────────────────────────────────
const AGENT_SUGGESTIONS = [
  { icon: <Globe size={13} />, label: 'Søk og analyser nett', prompt: 'Søk etter informasjon om ' },
  { icon: <Code2 size={13} />, label: 'Bygg en app', prompt: 'Bygg en enkel app som ' },
  { icon: <BarChart3 size={13} />, label: 'Analyser data', prompt: 'Analyser dette datasettet og lag visualiseringer: ' },
  { icon: <FileText size={13} />, label: 'Skriv rapport', prompt: 'Skriv en detaljert rapport om ' },
  { icon: <Zap size={13} />, label: 'Automatiser oppgave', prompt: 'Automatiser denne oppgaven: ' },
  { icon: <Terminal size={13} />, label: 'Kjør skript', prompt: 'Skriv og kjør et Python-skript som ' },
]

// ─── Velkomst-skjerm (sentrert layout) ───────────────────────
function WelcomeLayout({
  title,
  subtitle,
  suggestions,
  onSuggestion,
  isAgent,
  chatInputProps,
  showTerminal,
  agentState,
  onExpand,
  onStop,
  onApprove,
}: {
  title: string
  subtitle?: string
  suggestions: { icon: React.ReactNode; label: string; prompt: string }[]
  onSuggestion: (text: string) => void
  isAgent: boolean
  chatInputProps: React.ComponentProps<typeof ChatInput>
  showTerminal: boolean
  agentState: Parameters<typeof AgentTerminalPanel>[0]['state']
  onExpand: () => void
  onStop: () => void
  onApprove: (approved: boolean) => void
}) {
  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#1C1C1C',
      padding: '0 24px 24px',
    }}>
      {/* Tittel */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        {isAgent && (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 12,
            padding: '5px 12px',
            borderRadius: 20,
            background: 'rgba(26,147,254,0.1)',
            border: '1px solid rgba(26,147,254,0.2)',
          }}>
            <Bot size={13} style={{ color: '#1A93FE' }} />
            <span style={{ fontSize: 12, color: '#1A93FE', fontWeight: 500 }}>Agent-modus</span>
          </div>
        )}
        <h1 style={{
          fontSize: 32,
          fontWeight: 300,
          color: '#E5E5E5',
          letterSpacing: '-0.5px',
          lineHeight: 1.2,
          margin: 0,
        }}>
          {title}
        </h1>
        {subtitle && (
          <p style={{ fontSize: 14, color: '#555', marginTop: 8 }}>{subtitle}</p>
        )}
      </div>

      {/* Chat-input */}
      <div style={{ width: '100%', maxWidth: 720 }}>
        {showTerminal && (
          <div style={{ marginBottom: 8 }}>
            <AgentTerminalPanel
              state={agentState}
              onExpand={onExpand}
              onStop={onStop}
              onApprove={onApprove}
            />
          </div>
        )}
        <ChatInput {...chatInputProps} compact />
      </div>

      {/* Forslag under input */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 8,
        justifyContent: 'center',
        maxWidth: 680,
        marginTop: 16,
      }}>
        {suggestions.map((s, i) => (
          <button
            key={i}
            onClick={() => onSuggestion(s.prompt)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              padding: '7px 14px',
              borderRadius: 20,
              border: '1px solid #2E2E2E',
              background: 'transparent',
              color: '#9A9A9A',
              cursor: 'pointer',
              fontSize: 13,
              fontFamily: 'inherit',
              transition: 'background 0.15s, color 0.15s, border-color 0.15s',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = '#252525'
              e.currentTarget.style.color = '#E5E5E5'
              e.currentTarget.style.borderColor = '#3A3A3A'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = '#9A9A9A'
              e.currentTarget.style.borderColor = '#2E2E2E'
            }}
          >
            <span style={{ opacity: 0.7 }}>{s.icon}</span>
            <span>{s.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Hoved ChatView ───────────────────────────────────────────
export function ChatView() {
  const { activeConversation, settings, updateSettings } = useApp()
  const { sendMessage, stopStreaming, isStreaming } = useChat()
  const { state: agentState, startAgent, stopAgent, approveAction, fetchFileContent } = useAgent()
  const [agentMode, setAgentMode] = useState<AgentMode>('safe')
  const [showSidePanel, setShowSidePanel] = useState(false)
  const [useAgentMode, setUseAgentMode] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const { pendingAgentTask, setPendingAgentTask } = useNav()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeConversation?.messages])

  // Når bruker klikker agent i sidebar, aktiver agent-modus
  useEffect(() => {
    if (pendingAgentTask !== null) {
      setUseAgentMode(true)
      setPendingAgentTask(null)
    }
  }, [pendingAgentTask, setPendingAgentTask])

  const handleSend = (text: string, mode?: AgentMode) => {
    if (useAgentMode) {
      startAgent(text, mode || agentMode)
    } else {
      sendMessage(text)
    }
  }

  const handleSuggestion = (text: string) => {
    if (useAgentMode) {
      startAgent(text, agentMode)
    } else {
      sendMessage(text)
    }
  }

  const handleRegenerate = () => {
    if (!activeConversation) return
    const messages = activeConversation.messages
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')
    if (lastUserMsg) sendMessage(lastUserMsg.content)
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
    useAgentMode,
    onToggleAgentMode: () => setUseAgentMode(v => !v),
  }

  // ── Velkomstskjerm (ingen meldinger) ──────────────────────
  if (!hasMessages) {
    return (
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <WelcomeLayout
          title={useAgentMode ? 'Hva skal agenten gjøre?' : 'Hva kan jeg gjøre for deg?'}
          subtitle={useAgentMode ? 'Agenten planlegger, kjører kode og leverer resultater' : undefined}
          suggestions={useAgentMode ? AGENT_SUGGESTIONS : CHAT_SUGGESTIONS}
          onSuggestion={handleSuggestion}
          isAgent={useAgentMode}
          chatInputProps={chatInputProps}
          showTerminal={showTerminal}
          agentState={agentState}
          onExpand={() => setShowSidePanel(true)}
          onStop={stopAgent}
          onApprove={approveAction}
        />
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

  // ── Chat med meldinger ────────────────────────────────────
  return (
    <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
      <div className="chat-view" style={{ flex: 1 }}>
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
