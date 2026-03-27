import { useEffect, useRef, useState, useCallback } from 'react'
import { ChatMessage } from './ChatMessage'
import { ChatInput } from './ChatInput'
import { AgentChatMessage, FilePopup } from './AgentChatMessage'
import AgentSidePanel from '../agent/AgentSidePanel'
import AgentTerminalPanel from '../agent/AgentTerminalPanel'
import { useApp } from '@/store/AppContext'
import { useChat } from '@/hooks/useChat'
import { useAgent, type AgentMode } from '@/hooks/useAgent'
import { useUserMemory } from '@/hooks/useUserMemory'
import { useNav } from '@/App'
import type { AgentFile } from '@/types'
import {
  Globe, Code2, FileText, BarChart3, Zap, Bot
} from 'lucide-react'
import { HyperspeedCanvas } from './HyperspeedCanvas'
import { type AgentSettings, type AgentType } from './AgentSettingsPopover'

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

const WRITING_SUGGESTIONS = [
  { icon: '📄', label: 'Skriv en rapport' },
  { icon: '📚', label: 'Skriv et kapittel' },
  { icon: '🎓', label: 'Hjelp med eksamen' },
  { icon: '✍️', label: 'Skriv en artikkel' },
  { icon: '📖', label: 'Start en bok' },
]

// (Aurora-bakgrunn fjernet fra chat)

// ─── Rainbow border agent-badge ───────────────────────────────
function AgentBadge({ agentType }: { agentType: AgentType }) {
  return (
    <div className="agent-rainbow-wrap">
      <div className="agent-rainbow-border">
        <div className="agent-rainbow-inner">
          <Bot size={13} />
          <span>{agentType === 'writing' ? 'Skrive-agent' : 'Agent-modus'}</span>
        </div>
      </div>
    </div>
  )
}

// ─── Velkomst-layout ──────────────────────────────────────────
function WelcomeLayout({
  title,
  subtitle,
  suggestions,
  onSuggestion,
  isAgent,
  agentType,
  chatInputProps,
  blobFadingOut: _blobFadingOut,
  showHyperspeed,
  onHyperspeedComplete,
}: {
  title: string
  subtitle?: string
  suggestions: { icon: React.ReactNode | string; label: string }[]
  onSuggestion: (text: string) => void
  isAgent: boolean
  agentType: AgentType
  chatInputProps: Parameters<typeof ChatInput>[0]
  blobFadingOut: boolean
  showHyperspeed: boolean
  onHyperspeedComplete: () => void
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
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* (ingen aurora-bakgrunn i chat) */}

      {/* Hyperspeed canvas (agent-modus) */}
      {isAgent && (
        <HyperspeedCanvas active={showHyperspeed} onFadeComplete={onHyperspeedComplete} />
      )}

      {/* Agent-badge med rainbow border */}
      {isAgent && (
        <div style={{ position: 'relative', zIndex: 2, marginBottom: 20 }}>
          <AgentBadge agentType={agentType} />
        </div>
      )}

      {/* Tittel */}
      <h1 style={{
        position: 'relative',
        zIndex: 2,
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
          position: 'relative',
          zIndex: 2,
          fontSize: 14,
          color: '#6B7280',
          textAlign: 'center',
          marginBottom: 28,
        }}>
          {subtitle}
        </p>
      )}

      {/* Chat-input */}
      <div style={{ width: '100%', maxWidth: 680, position: 'relative', zIndex: 2 }}>
        <ChatInput {...chatInputProps} compact />
      </div>

      {/* Forslag */}
      <div style={{
        position: 'relative',
        zIndex: 2,
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
  const { state: agentState, startAgent, stopAgent, approveAction, fetchFileContent } = useAgent()
  const { memory, addMemory, removeMemory, clearMemory, extractFromMessage } = useUserMemory()
  const [agentMode, setAgentMode] = useState<AgentMode>('safe')
  const [showSidePanel, setShowSidePanel] = useState(false)
  const [useAgentMode, setUseAgentMode] = useState(false)
  const [modeSwitching, setModeSwitching] = useState(false)
  const modeSwitchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [openFile, setOpenFile] = useState<AgentFile | null>(null)
  const [openFileAllFiles, setOpenFileAllFiles] = useState<AgentFile[]>([])
  const bottomRef = useRef<HTMLDivElement>(null)
  const { pendingAgentTask, setPendingAgentTask } = useNav()

  // Blob fade state (brukes for å fade ut ved melding)
  const [_blobFadingOut, setBlobFadingOut] = useState(false)

  // Hyperspeed state
  const [showHyperspeed, setShowHyperspeed] = useState(false)
  const [_hyperspeedDone, setHyperspeedDone] = useState(false)

  // Agent settings
  const [agentSettings, setAgentSettings] = useState<AgentSettings>({
    agentType: 'code',
    agentMode: 'safe',
    outputLanguage: 'auto',
    detailLevel: 'normal',
    documentType: 'report',
    autoSave: false,
  })

  // Sync agentMode from settings
  useEffect(() => {
    setAgentMode(agentSettings.agentMode)
  }, [agentSettings.agentMode])

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

  // Lytt på agent-complete event
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

  const handleSend = useCallback((text: string, mode?: AgentMode) => {
    // Trekk ut minne fra brukerens melding
    const convTitle = activeConversation?.title ?? 'Ny samtale'
    extractFromMessage(text, convTitle)

    if (useAgentMode) {
      // Start blob fade-out
      setBlobFadingOut(true)
      // Start hyperspeed
      setShowHyperspeed(true)
      setHyperspeedDone(false)
      startAgent(text, mode || agentMode)
    } else {
      // Fade out blobs
      setBlobFadingOut(true)
      sendMessage(text)
    }
  }, [useAgentMode, agentMode, startAgent, sendMessage, extractFromMessage, activeConversation?.title])

  const handleSuggestion = useCallback((text: string) => {
    if (useAgentMode) {
      setBlobFadingOut(true)
      setShowHyperspeed(true)
      setHyperspeedDone(false)
      startAgent(text, agentMode)
    } else {
      setBlobFadingOut(true)
      sendMessage(text)
    }
  }, [useAgentMode, agentMode, startAgent, sendMessage])

  const handleRegenerate = () => {
    if (!activeConversation) return
    const lastUserMsg = [...activeConversation.messages].reverse().find(m => m.role === 'user')
    if (lastUserMsg) sendMessage(lastUserMsg.content)
  }

  // Åpne fil-popup
  const handleOpenFile = async (file: AgentFile, allFiles?: AgentFile[]) => {
    let fileWithContent = file
    if (!file.content && file.path) {
      const runId = file.runId ?? agentState.runId ?? undefined
      const content = await fetchFileContent(file.path, runId)
      fileWithContent = { ...file, content: content || undefined }
    }
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

  const suggestions = useAgentMode
    ? (agentSettings.agentType === 'writing' ? WRITING_SUGGESTIONS : AGENT_SUGGESTIONS)
    : CHAT_SUGGESTIONS

  const chatInputProps = {
    onSend: handleSend,
    onStop: stopStreaming,
    isStreaming,
    model: settings.model,
    onModelChange: (m: typeof settings.model) => updateSettings({ model: m }),
    language: settings.language,
    agentMode,
    onAgentModeChange: (m: AgentMode) => setAgentSettings(s => ({ ...s, agentMode: m })),
    isAgentActive,
    useAgentMode,
    onToggleAgentMode: () => {
      // Fade-up animasjon ved bytte mellom chat og agent
      setModeSwitching(true)
      if (modeSwitchTimeout.current) clearTimeout(modeSwitchTimeout.current)
      modeSwitchTimeout.current = setTimeout(() => {
        setUseAgentMode(v => !v)
        setModeSwitching(false)
      }, 180)
    },
    agentState,
    onOpenTerminal: () => setShowSidePanel(true),
    agentSettings,
    onAgentSettingsChange: setAgentSettings,
    memory,
    onAddMemory: (key: string, value: string) => addMemory(key, value, activeConversation?.title ?? 'Manuelt'),
    onRemoveMemory: removeMemory,
    onClearMemory: clearMemory,
  }

   // ── Velkomstskjerm ────────────────────────────────────
  if (!hasMessages) {
    return (
      <div style={{
        display: 'flex', flex: 1, overflow: 'hidden', position: 'relative',
        opacity: modeSwitching ? 0 : 1,
        transform: modeSwitching ? 'translateY(12px)' : 'translateY(0)',
        transition: modeSwitching ? 'none' : 'opacity 0.28s ease, transform 0.28s ease',
      }}>
        <WelcomeLayout
          title={useAgentMode
            ? (agentSettings.agentType === 'writing' ? 'Hva skal jeg skrive?' : 'Hva skal agenten gjøre?')
            : 'Hva kan jeg gjøre for deg?'}
          subtitle={useAgentMode
            ? (agentSettings.agentType === 'writing'
              ? 'Skrive-agenten hjelper deg med dokumenter, rapporter og bøker'
              : 'Agenten planlegger, kjører kode og leverer resultater')
            : undefined}
          suggestions={suggestions}
          onSuggestion={handleSuggestion}
          isAgent={useAgentMode}
          agentType={agentSettings.agentType}
          chatInputProps={chatInputProps}
          blobFadingOut={_blobFadingOut}
          showHyperspeed={showHyperspeed}
          onHyperspeedComplete={() => setHyperspeedDone(true)}
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
        {isAgentActive && (
          <div style={{ padding: '12px 24px 0', maxWidth: 720, margin: '0 auto', width: '100%' }}>
            <AgentTerminalPanel
              state={agentState}
              onExpand={() => setShowSidePanel(true)}
              onStop={stopAgent}
              onApprove={approveAction}
            />
          </div>
        )}
        <div className="chat-messages-area">
          <div className="chat-messages-inner">
            {activeConversation.messages.map((msg, i) => {
              const isLast = i === activeConversation.messages.length - 1

              if (msg.isAgentMessage || msg.role === 'agent') {
                const isActiveAgentMsg = msg.id === agentState.agentMessageId
                const tasks = isActiveAgentMsg ? agentState.liveTasks : (msg.agentTasks ?? [])
                const files = isActiveAgentMsg ? agentState.liveFiles : (msg.agentFiles ?? [])
                const status = isActiveAgentMsg
                  ? (agentState.status === 'completed' ? 'completed'
                    : agentState.status === 'failed' ? 'failed'
                    : agentState.status === 'stopped' ? 'stopped'
                    : 'running')
                  : (msg.agentStatus ?? 'completed')

                const agentSuggestions = status === 'completed'
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
                      agentSuggestions: agentSuggestions,
                    }}
                    onOpenFile={handleOpenFile}
                    onSuggestion={(text) => startAgent(text, agentMode)}
                  />
                )
              }

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
                  fontFamily: 'inherit',
                }}
              >
                Avslå
              </button>
              <button
                onClick={() => approveAction(true)}
                style={{
                  padding: '6px 12px', borderRadius: 7, border: 'none',
                  background: '#F59E0B', color: '#000', fontSize: 12, cursor: 'pointer',
                  fontWeight: 600, fontFamily: 'inherit',
                }}
              >
                Godkjenn
              </button>
            </div>
          </div>
        )}

        <ChatInput
          onSend={handleSend}
          onStop={stopStreaming}
          isStreaming={isStreaming}
          model={settings.model}
          onModelChange={(m) => updateSettings({ model: m })}
          language={settings.language}
          agentMode={agentMode}
          onAgentModeChange={(m) => setAgentSettings(s => ({ ...s, agentMode: m }))}
          isAgentActive={isAgentActive}
          useAgentMode={useAgentMode}
          onToggleAgentMode={() => setUseAgentMode(v => !v)}
          agentState={agentState}
          onOpenTerminal={() => setShowSidePanel(true)}
          agentSettings={agentSettings}
          onAgentSettingsChange={setAgentSettings}
        />
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
