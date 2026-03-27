import { useState, useRef, useCallback, type KeyboardEvent, useEffect } from 'react'
import {
  GitBranch, Monitor, Mic, ArrowUp, Square,
  ChevronDown, Globe, Cpu, Shield, ShieldOff, Bot, BotOff,
  Plus, Settings2, Paperclip, ChevronRight
} from 'lucide-react'
import type { SineModel } from '@/types'
import { getTranslations } from '@/i18n'
import type { AgentMode, AgentState } from '@/hooks/useAgent'

interface ChatInputProps {
  onSend: (message: string, mode?: AgentMode) => void
  onStop?: () => void
  isStreaming?: boolean
  model: SineModel
  onModelChange: (model: SineModel) => void
  language: 'no' | 'en'
  disabled?: boolean
  agentMode?: AgentMode
  onAgentModeChange?: (mode: AgentMode) => void
  isAgentActive?: boolean
  useAgentMode?: boolean
  onToggleAgentMode?: () => void
  // Når true, fjernes padding (brukt i sentrert velkomst-layout)
  compact?: boolean
  // Agent-state for live task-boks
  agentState?: AgentState
  onOpenTerminal?: () => void
}

export function ChatInput({
  onSend,
  onStop,
  isStreaming,
  model,
  onModelChange,
  language,
  disabled,
  agentMode = 'safe',
  onAgentModeChange,
  isAgentActive,
  useAgentMode = false,
  onToggleAgentMode,
  compact = false,
  agentState,
  onOpenTerminal,
}: ChatInputProps) {
  const [value, setValue] = useState('')
  const [showPlusMenu, setShowPlusMenu] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const plusMenuRef = useRef<HTMLDivElement>(null)
  const t = getTranslations(language)
  const isSafeMode = agentMode === 'safe'

  // Lukk plus-meny ved klikk utenfor
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (plusMenuRef.current && !plusMenuRef.current.contains(e.target as Node)) {
        setShowPlusMenu(false)
      }
    }
    if (showPlusMenu) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showPlusMenu])

  const adjustHeight = useCallback(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 200) + 'px'
  }, [])

  const handleSend = useCallback(() => {
    const trimmed = value.trim()
    if (!trimmed || isStreaming || disabled) return
    onSend(trimmed, agentMode)
    setValue('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }, [value, isStreaming, disabled, onSend, agentMode])

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }, [handleSend])

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    const fileNames = Array.from(files).map(f => f.name).join(', ')
    setValue(prev => prev ? `${prev} [${fileNames}]` : `[${fileNames}]`)
    setShowPlusMenu(false)
    textareaRef.current?.focus()
  }

  const canSend = value.trim().length > 0 && !disabled

  const placeholder = isAgentActive
    ? 'Gi agenten en ny oppgave...'
    : useAgentMode
      ? 'Beskriv hva agenten skal gjøre...'
      : t.app.placeholder

  // Live task-boks: vis når agent er aktiv (uavhengig av om tasks er lastet ennå)
  const showLiveTask = isAgentActive || (agentState && ['planning', 'running'].includes(agentState.status))
  const lastTask = agentState?.liveTasks?.slice(-1)[0]
  const totalTasks = agentState?.liveTasks?.length ?? 0
  const doneTasks = agentState?.liveTasks?.filter(t => t.status === 'done').length ?? 0
  const currentTaskLabel = lastTask?.label ?? agentState?.currentTask ?? 'Planlegger...'

  return (
    <div
      className="chat-input-area"
      style={compact ? { padding: 0, margin: 0 } : undefined}
    >
      {/* ── Live task-boks (vises over input når agent er aktiv) ── */}
      {showLiveTask && !compact && (
        <div className="live-task-bar" onClick={onOpenTerminal}>
          {/* Thumbnail / terminal-preview */}
          <div className="live-task-thumb">
            <div className="live-task-thumb-inner">
              {agentState?.logs.slice(-3).map((log, i) => (
                <div key={i} style={{
                  fontSize: 9,
                  color: log.type === 'tool_result' && log.success ? '#4ADE80'
                    : log.type === 'error' ? '#F87171'
                    : '#60A5FA',
                  fontFamily: 'monospace',
                  lineHeight: 1.4,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {log.message.slice(0, 40)}
                </div>
              ))}
            </div>
          </div>

          {/* Oppgave-tekst */}
          <div className="live-task-content">
            {/* Tittel-rad med pulserende dot */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                background: '#1A93FE', flexShrink: 0,
                animation: 'pulse-dot 1.5s ease-in-out infinite',
              }} />
              <span className="live-task-label">
                {currentTaskLabel}
              </span>
            </div>
            {/* Sublabel: siste log-melding */}
            {agentState?.logs && agentState.logs.length > 0 && (
              <span className="live-task-sublabel">
                {agentState.logs[agentState.logs.length - 1].message.slice(0, 60)}
              </span>
            )}
          </div>

          {/* Teller + pil */}
          <div className="live-task-right">
            {totalTasks > 0 && (
              <span className="live-task-counter">{doneTasks}/{totalTasks}</span>
            )}
            <ChevronDown size={14} style={{ color: '#6B7280' }} />
          </div>
        </div>
      )}

      {/* ── Hoved input-boks ─────────────────────────────────── */}
      <div
        className={`chat-input-box${useAgentMode ? ' agent-mode' : ''}`}
      >
        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={e => { setValue(e.target.value); adjustHeight() }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className="chat-textarea"
          style={{ opacity: disabled ? 0.5 : 1, cursor: disabled ? 'not-allowed' : 'text' }}
        />

        {/* Bottom toolbar */}
        <div className="chat-toolbar">
          <div className="chat-toolbar-left">

            {/* ── Plus-knapp med dropdown ── */}
            <div style={{ position: 'relative' }} ref={plusMenuRef}>
              <button
                className="toolbar-btn"
                title="Legg til"
                onClick={() => setShowPlusMenu(v => !v)}
                style={{
                  background: showPlusMenu ? '#2E2E2E' : undefined,
                  color: showPlusMenu ? '#C0C0C0' : undefined,
                }}
              >
                <Plus size={18} />
              </button>

              {/* Plus-meny */}
              {showPlusMenu && (
                <div className="plus-menu">
                  <button
                    className="plus-menu-item"
                    onClick={() => {
                      setShowPlusMenu(false)
                      // Skills er en fremtidig funksjon
                    }}
                  >
                    <Settings2 size={14} className="plus-menu-icon" />
                    <span>Bruk Skills</span>
                    <ChevronRight size={12} style={{ marginLeft: 'auto', color: '#4A4A4A' }} />
                  </button>
                  <button
                    className="plus-menu-item"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Paperclip size={14} className="plus-menu-icon" />
                    <span>Last opp filer</span>
                  </button>
                </div>
              )}
            </div>

            {/* Skjult fil-input */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              style={{ display: 'none' }}
              onChange={handleFileUpload}
              accept="*/*"
            />

            <button className="toolbar-btn" title="GitHub">
              <GitBranch size={18} />
            </button>

            {/* Terminal-knapp */}
            <button
              className="toolbar-btn"
              title="Terminal"
              onClick={onOpenTerminal}
              style={
                agentState && ['planning', 'running'].includes(agentState.status)
                  ? { color: '#60A5FA' }
                  : undefined
              }
            >
              <Monitor size={18} />
            </button>

            {/* Agent/Chat-modus toggle */}
            {onToggleAgentMode && (
              <button
                className={`toolbar-mode-btn${useAgentMode ? ' active' : ''}`}
                onClick={onToggleAgentMode}
                title={useAgentMode ? 'Agent-modus aktiv – klikk for chat' : 'Chat-modus – klikk for agent'}
              >
                {useAgentMode ? <Bot size={12} /> : <BotOff size={12} />}
                <span>{useAgentMode ? 'Agent' : 'Chat'}</span>
              </button>
            )}

            {/* Safe Mode – kun i agent-modus */}
            {useAgentMode && onAgentModeChange && (
              <button
                className={`toolbar-mode-btn${isSafeMode ? ' safe' : ' power'}`}
                onClick={() => onAgentModeChange(isSafeMode ? 'power' : 'safe')}
                title={isSafeMode ? 'Safe Mode PÅ' : 'Power Mode'}
              >
                {isSafeMode ? <Shield size={12} /> : <ShieldOff size={12} />}
                <span>{isSafeMode ? 'Safe' : 'Power'}</span>
              </button>
            )}
          </div>

          <div className="chat-toolbar-right">
            <ModelSelector model={model} onModelChange={onModelChange} />

            <button className="mic-btn" title={t.chat.voiceInput}>
              <Mic size={18} />
            </button>

            {isStreaming ? (
              <button onClick={onStop} className="send-btn" title={t.chat.stop}>
                <Square size={12} fill="#1C1C1C" style={{ color: '#1C1C1C' }} />
              </button>
            ) : (
              <button
                onClick={handleSend}
                disabled={!canSend}
                className={`send-btn${canSend ? ' active' : ''}`}
                title={t.chat.send}
              >
                <ArrowUp size={16} strokeWidth={2.5} />
              </button>
            )}
          </div>
        </div>
      </div>

      {!compact && (
        <p className="chat-disclaimer">
          Sine kan gjøre feil. Sjekk viktig informasjon.
        </p>
      )}
    </div>
  )
}

function ModelSelector({ model, onModelChange }: { model: SineModel; onModelChange: (m: SineModel) => void }) {
  const [open, setOpen] = useState(false)
  const labels: Record<SineModel, { name: string; desc: string; icon: React.ReactNode }> = {
    'sine-1':   { name: 'Sine 1.0',  desc: 'Rask og effektiv',    icon: <Cpu size={12} /> },
    'sine-pro': { name: 'Sine Pro',  desc: 'Kraftfull og presis',  icon: <Globe size={12} /> },
  }
  return (
    <div style={{ position: 'relative' }}>
      <button className="model-select-btn" onClick={() => setOpen(!open)}>
        <span>{labels[model].name}</span>
        <ChevronDown size={10} />
      </button>
      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setOpen(false)} />
          <div style={{
            position: 'absolute',
            bottom: '100%',
            marginBottom: 8,
            right: 0,
            borderRadius: 10,
            overflow: 'hidden',
            zIndex: 50,
            minWidth: 200,
            background: '#1A1A1A',
            border: '1px solid #2E2E2E',
            boxShadow: '0 8px 32px rgba(0,0,0,0.7)',
            padding: '4px 0',
          }}>
            {(['sine-1', 'sine-pro'] as SineModel[]).map(m => (
              <button
                key={m}
                onClick={() => { onModelChange(m); setOpen(false) }}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '9px 14px',
                  background: model === m ? '#242424' : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  fontFamily: 'inherit',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => { if (model !== m) e.currentTarget.style.background = '#1E1E1E' }}
                onMouseLeave={e => { if (model !== m) e.currentTarget.style.background = 'transparent' }}
              >
                <span style={{ color: model === m ? '#1A93FE' : '#5A5A5A' }}>{labels[m].icon}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: model === m ? '#E5E5E5' : '#C0C0C0' }}>
                    {labels[m].name}
                  </div>
                  <div style={{ fontSize: 11, color: '#5A5A5A', marginTop: 1 }}>{labels[m].desc}</div>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
