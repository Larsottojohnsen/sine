import { useEffect, useRef, useState } from 'react'
import { ChatMessage } from './ChatMessage'
import { ChatInput } from './ChatInput'
import { AgentChatMessage, FilePopup } from './AgentChatMessage'
import AgentSidePanel from '../agent/AgentSidePanel'
import { useApp } from '@/store/AppContext'
import { useChat } from '@/hooks/useChat'
import { useAgent, type AgentMode } from '@/hooks/useAgent'
import { useNav } from '@/App'
import type { AgentFile } from '@/types'
import {
  Globe, Code2, FileText, BarChart3, Zap, Bot
} from 'lucide-react'

// ─── Velkomst-forslag ─────────────────────────────────────────
const CHAT_SUGGESTIONS = [
  { icon: '💬', label: 'Forklar et konsept' },
  { icon: '⌨️', label: 'Skriv kode' },
  { icon: '📝', label: 'Lag et sammendrag' },
  { icon: '🔍', label: 'Analyser tekst' },
  { icon: '🌐', label: 'Oversett' },
]

const AGENT_SUGGESTIONS = [
  { icon: <Globe size={13} />, label: 'Søk og analyser nett' },
  { icon: <Code2 size={13} />, label: 'Bygg en app' },
  { icon: <BarChart3 size={13} />, label: 'Analyser data' },
  { icon: <FileText size={13} />, label: 'Skriv rapport' },
  { icon: <Zap size={13} />, label: 'Automatiser oppgave' },
  { icon: <Code2 size={13} />, label: 'Kjør skript' },
]

// ─── Velkomst-layout ──────────────────────────────────────────
function WelcomeLayout({
  title,
  subtitle,
  suggestions,
  onSuggestion,
  isAgent,
  chatInputProps,
}: {
  title: string
  subtitle?: string
  suggestions: { icon: React.ReactNode | string; label: string }[]
  onSuggestion: (text: string) => void
  isAgent: boolean
  chatInputProps: Parameters<typeof ChatInput>[0]
}) {
  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '0 24px 24px',
      minHeight: 0,
    }}>
      {/* Agent-badge */}
      {isAgent && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '4px 12px',
          background: 'rgba(99,102,241,0.12)',
          border: '1px solid rgba(99,102,241,0.25)',
          borderRadius: 20,
          marginBottom: 20,
          fontSize: 12,
          color: '#818CF8',
          fontWeight: 500,
        }}>
          <Bot size={13} />
          Agent-modus
        </div>
      )}

      {/* Tittel */}
      <h1 style={{
        fontSize: 'clamp(24px, 4vw, 36px)',
        fontWeight: 300,
        color: '#E5E5E5',
        textAlign: 'center',
        marginBottom: subtitle ? 8 : 28,
        letterSpacing: '-0.02em',
        fontFamily: '"Georgia", serif',
      }}>
        {title}
      </h1>

      {subtitle && (
        <p style={{
          fontSize: 14,
          color: '#6B7280',
          textAlign: 'center',
          marginBottom: 28,
        }}>
          {subtitle}
        </p>
      )}

      {/* Chat-input */}
      <div style={{ width: '100%', maxWidth: 680 }}>
        <ChatInput {...chatInputProps} compact />
      </div>

      {/* Forslag */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 8,
        justifyContent: 'center',
        marginTop: 16,
        maxWidth: 680,
      }}>
        {suggestions.map((s, i) => (
          <button
            key={i}
            onClick={() => onSuggestion(s.label)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '7px 14px',
              borderRadius: 20,
              border: '1px solid #2E2E2E',
              background: 'transparent',
              color: '#9A9A9A',
              fontSize: 13,
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'all 0.15s',
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
  const { activeConversation, settings, updateSettings, updateAgentMessage } = useApp()
  const { sendMessage, stopStreaming, isStreaming } = useChat()
  const { state: agentState, startAgent, approveAction, fetchFileContent } = useAgent()
  const [agentMode, setAgentMode] = useState<AgentMode>('safe')
  const [showSidePanel, setShowSidePanel] = useState(false)
  const [useAgentMode, setUseAgentMode] = useState(false)
  const [openFile, setOpenFile] = useState<AgentFile | null>(null)
  const [openFileAllFiles, setOpenFileAllFiles] = useState<AgentFile[]>([])
  const bottomRef = useRef<HTMLDivElement>(null)
  const { pendingAgentTask, setPendingAgentTask } = useNav()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeConversation?.messages, agentState.liveTasks.length])

  // Når bruker klikker agent i sidebar, aktiver agent-modus
  useEffect(() => {
    if (pendingAgentTask !== null) {
      setUseAgentMode(true)
      setPendingAgentTask(null)
    }
  }, [pendingAgentTask, setPendingAgentTask])

  // Lytt på agent-complete event for å oppdatere meldingen med filer og forslag
  useEffect(() => {
    const handler = (e: Event) => {
      const ev = e as CustomEvent<{
        convId: string
        msgId: string
        files: AgentFile[]
        suggestions: string[]
        message: string
      }>
      const { convId, msgId, files, suggestions, message } = ev.detail
      updateAgentMessage(convId, msgId, {
        agentStatus: 'completed',
        agentFiles: files,
        agentSuggestions: suggestions,
        content: message || '',
      })
    }
    window.addEventListener('agent-complete', handler)
    return () => window.removeEventListener('agent-complete', handler)
  }, [updateAgentMessage])

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
    const lastUserMsg = [...activeConversation.messages].reverse().find(m => m.role === 'user')
    if (lastUserMsg) sendMessage(lastUserMsg.content)
  }

  // Åpne fil-popup og last innhold fra backend
  const handleOpenFile = async (file: AgentFile, allFiles?: AgentFile[]) => {
    let fileWithContent = file
    // Last innhold hvis ikke allerede tilgjengelig
    if (!file.content && file.path) {
      // Bruk runId fra filen, eller fra agentState
      const runId = file.runId ?? agentState.runId ?? undefined
      const content = await fetchFileContent(file.path, runId)
      fileWithContent = { ...file, content: content || undefined }
    }
    // Last alle filer med innhold
    const allWithContent = await Promise.all(
      (allFiles ?? []).map(async (f) => {
        if (f.content) return f
        if (!f.path) return f
        const runId = f.runId ?? agentState.runId ?? undefined
        const content = await fetchFileContent(f.path, runId)
        return { ...f, content: content || undefined }
      })
    )
    setOpenFile(fileWithContent)
    setOpenFileAllFiles(allWithContent.length > 0 ? allWithContent : [fileWithContent])
    setShowSidePanel(false)
  }

  // Nedlasting via downloadUrl eller innhold
  const handleDownloadFile = (file: AgentFile) => {
    if (file.downloadUrl) {
      const a = document.createElement('a')
      a.href = file.downloadUrl
      a.download = file.name
      a.click()
    } else if (file.content) {
      const blob = new Blob([file.content], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = file.name
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  const isAgentActive = ['planning', 'running', 'waiting_approval'].includes(agentState.status)
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
    agentState,
    onOpenTerminal: () => setShowSidePanel(true),
  }

  // ── Velkomstskjerm ────────────────────────────────────────
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
        />
        {showSidePanel && (
          <AgentSidePanel
            state={agentState}
            onClose={() => setShowSidePanel(false)}
            onFetchFile={fetchFileContent}
          />
        )}
        {openFile && (
          <FilePopup
            file={openFile}
            allFiles={openFileAllFiles}
            onClose={() => setOpenFile(null)}
            onDownload={handleDownloadFile}
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
            {activeConversation.messages.map((msg, i) => {
              const isLast = i === activeConversation.messages.length - 1

              // Agent-melding
              if (msg.isAgentMessage || msg.role === 'agent') {
                // Bruk live-data fra agentState hvis dette er den aktive agent-meldingen
                const isActiveAgentMsg = msg.id === agentState.agentMessageId
                const tasks = isActiveAgentMsg ? agentState.liveTasks : (msg.agentTasks ?? [])
                const files = isActiveAgentMsg ? agentState.liveFiles : (msg.agentFiles ?? [])
                const status = isActiveAgentMsg
                  ? (agentState.status === 'completed' ? 'completed'
                    : agentState.status === 'failed' ? 'failed'
                    : agentState.status === 'stopped' ? 'stopped'
                    : 'running')
                  : (msg.agentStatus ?? 'completed')

                // Bruk backend-genererte forslag hvis tilgjengelig, ellers tom liste
                const suggestions = status === 'completed'
                  ? (msg.agentSuggestions && msg.agentSuggestions.length > 0
                    ? msg.agentSuggestions
                    : (isActiveAgentMsg && agentState.suggestions ? agentState.suggestions : []))
                  : []

                return (
                  <AgentChatMessage
                    key={msg.id}
                    message={{
                      ...msg,
                      agentTasks: tasks,
                      agentFiles: files,
                      agentStatus: status as 'running' | 'completed' | 'failed' | 'stopped',
                      agentSuggestions: suggestions,
                    }}
                    onOpenFile={handleOpenFile}
                    onSuggestion={(text) => startAgent(text, agentMode)}
                  />
                )
              }

              // Vanlig chat-melding
              return (
                <ChatMessage
                  key={msg.id}
                  message={msg}
                  isLast={isLast}
                  onRegenerate={isLast ? handleRegenerate : undefined}
                />
              )
            })}
            <div ref={bottomRef} style={{ height: 16 }} />
          </div>
        </div>

        {/* Godkjenning-banner */}
        {agentState.pendingApproval && (
          <div style={{
            margin: '0 24px 12px',
            padding: '12px 16px',
            background: 'rgba(245,158,11,0.1)',
            border: '1px solid rgba(245,158,11,0.3)',
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#F59E0B', marginBottom: 2 }}>
                Godkjenning kreves
              </div>
              <div style={{ fontSize: 12, color: '#9A9A9A' }}>
                {agentState.pendingApproval.description}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              <button
                onClick={() => approveAction(false)}
                style={{
                  padding: '6px 12px', borderRadius: 7, border: '1px solid #3A3A3A',
                  background: 'transparent', color: '#9A9A9A', fontSize: 12, cursor: 'pointer',
                }}
              >
                Avslå
              </button>
              <button
                onClick={() => approveAction(true)}
                style={{
                  padding: '6px 12px', borderRadius: 7, border: 'none',
                  background: '#F59E0B', color: '#141414', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                }}
              >
                Godkjenn
              </button>
            </div>
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

      {openFile && (
        <FilePopup
          file={openFile}
          allFiles={openFileAllFiles}
          onClose={() => setOpenFile(null)}
          onDownload={handleDownloadFile}
        />
      )}
    </div>
  )
}
