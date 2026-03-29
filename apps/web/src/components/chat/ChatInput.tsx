import { useState, useRef, useEffect, useCallback, type KeyboardEvent } from 'react'
import {
  GitBranch, Monitor, Mic, ArrowUp, Square,
  ChevronDown, Globe, Cpu, Bot, BotOff,
  Plus, Paperclip, ChevronRight,
  Plug, Zap, Check, ToggleRight, ToggleLeft
} from 'lucide-react'
import type { SineModel, Skill } from '@/types'
import { getTranslations } from '@/i18n'
import type { AgentMode, AgentState } from '@/hooks/useAgent'
import { AgentSettingsPopover, type AgentSettings } from './AgentSettingsPopover'
import type { UserMemory } from '@/types'
import { useApp } from '@/store/AppContext'

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
  compact?: boolean
  agentState?: AgentState
  onOpenTerminal?: () => void
  agentSettings?: AgentSettings
  onAgentSettingsChange?: (s: AgentSettings) => void
  memory?: UserMemory[]
  onAddMemory?: (key: string, value: string) => void
  onRemoveMemory?: (id: string) => void
  onClearMemory?: () => void
}

// ─── Skills dropdown i chat ───────────────────────────────────
function SkillsDropdown({
  skills,
  onToggle,
  onClose,
  onOpenSettings,
}: {
  skills: Skill[]
  onToggle: (id: string) => void
  onClose: () => void
  onOpenSettings: () => void
}) {
  return (
    <div className="chat-skills-dropdown">
      <div className="chat-skills-header">
        <span>Aktive Skills</span>
        <button
          className="chat-skills-manage"
          onClick={() => { onOpenSettings(); onClose() }}
        >
          Administrer
        </button>
      </div>
      {skills.length === 0 ? (
        <div className="chat-skills-empty">
          <p>Ingen skills lagt til ennå.</p>
          <button
            className="chat-skills-add-link"
            onClick={() => { onOpenSettings(); onClose() }}
          >
            Legg til skills →
          </button>
        </div>
      ) : (
        <div className="chat-skills-list">
          {skills.map(skill => (
            <button
              key={skill.id}
              className={`chat-skill-item${skill.enabled ? ' active' : ''}`}
              onClick={() => onToggle(skill.id)}
            >
              <span className="chat-skill-icon">
                {skill.icon ? <span style={{ fontSize: 14 }}>{skill.icon}</span> : <Zap size={13} />}
              </span>
              <span className="chat-skill-name">{skill.name}</span>
              {skill.enabled
                ? <ToggleRight size={16} style={{ color: '#1A93FE', marginLeft: 'auto', flexShrink: 0 }} />
                : <ToggleLeft size={16} style={{ color: '#3A3A3A', marginLeft: 'auto', flexShrink: 0 }} />
              }
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Connectors popup i chat ──────────────────────────────────
const APP_CONNECTORS_MINI = [
  { id: 'github', name: 'GitHub', icon: '🐙' },
  { id: 'gmail', name: 'Gmail', icon: '📧' },
  { id: 'meta-ads', name: 'Meta Ads', icon: '📘' },
  { id: 'instagram', name: 'Instagram', icon: '📸' },
  { id: 'google-calendar', name: 'Google Kalender', icon: '📅' },
  { id: 'outlook-mail', name: 'Outlook Mail', icon: '📨' },
  { id: 'outlook-calendar', name: 'Outlook Kalender', icon: '🗓️' },
]

function ConnectorsPopup({
  statuses,
  onClose,
  onOpenSettings,
}: {
  statuses: Record<string, string>
  onClose: () => void
  onOpenSettings: () => void
}) {
  const connected = APP_CONNECTORS_MINI.filter(c => statuses[c.id] === 'connected')
  const disconnected = APP_CONNECTORS_MINI.filter(c => statuses[c.id] !== 'connected')

  return (
    <div className="chat-connectors-popup">
      <div className="chat-skills-header">
        <span>Tilkoblinger</span>
        <button
          className="chat-skills-manage"
          onClick={() => { onOpenSettings(); onClose() }}
        >
          Administrer
        </button>
      </div>
      {connected.length > 0 && (
        <div>
          <p className="chat-connector-section-label">Tilkoblet</p>
          {connected.map(c => (
            <div key={c.id} className="chat-connector-item">
              <span style={{ fontSize: 14 }}>{c.icon}</span>
              <span className="chat-skill-name">{c.name}</span>
              <Check size={12} style={{ color: '#4ADE80', marginLeft: 'auto' }} />
            </div>
          ))}
        </div>
      )}
      {disconnected.length > 0 && (
        <div>
          <p className="chat-connector-section-label">Ikke tilkoblet</p>
          {disconnected.map(c => (
            <div key={c.id} className="chat-connector-item" style={{ opacity: 0.5 }}>
              <span style={{ fontSize: 14 }}>{c.icon}</span>
              <span className="chat-skill-name">{c.name}</span>
            </div>
          ))}
        </div>
      )}
      <button
        className="chat-connector-manage-btn"
        onClick={() => { onOpenSettings(); onClose() }}
      >
        Koble til apper →
      </button>
    </div>
  )
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
  agentSettings,
  onAgentSettingsChange,
  memory = [],
  onAddMemory,
  onRemoveMemory,
  onClearMemory,
}: ChatInputProps) {
  const [value, setValue] = useState('')
  const [showPlusMenu, setShowPlusMenu] = useState(false)
  const [showSkillsDropdown, setShowSkillsDropdown] = useState(false)
  const [showConnectorsPopup, setShowConnectorsPopup] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const plusMenuRef = useRef<HTMLDivElement>(null)
  const skillsRef = useRef<HTMLDivElement>(null)
  const connectorsRef = useRef<HTMLDivElement>(null)
  const t = getTranslations(language)

  const { settings, updateSettings, setSettingsOpen } = useApp()
  const skills: Skill[] = settings.skills ?? []
  const connectorStatuses = settings.connectorStatuses ?? {}
  const connectedCount = Object.values(connectorStatuses).filter(s => s === 'connected').length
  const enabledSkillsCount = skills.filter(s => s.enabled).length

  const effectiveAgentSettings: AgentSettings = agentSettings ?? {
    agentType: 'code',
    agentMode: agentMode,
    outputLanguage: 'auto',
    detailLevel: 'normal',
    documentType: 'report',
    autoSave: false,
  }

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (plusMenuRef.current && !plusMenuRef.current.contains(e.target as Node)) {
        setShowPlusMenu(false)
      }
      if (skillsRef.current && !skillsRef.current.contains(e.target as Node)) {
        setShowSkillsDropdown(false)
      }
      if (connectorsRef.current && !connectorsRef.current.contains(e.target as Node)) {
        setShowConnectorsPopup(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Listen for prefill-chat event (from "Build with Sine")
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (detail?.prompt) {
        setValue(detail.prompt)
        setTimeout(() => textareaRef.current?.focus(), 100)
      }
    }
    window.addEventListener('sine:prefill-chat', handler)
    return () => window.removeEventListener('sine:prefill-chat', handler)
  }, [])

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

  const handleSkillToggle = (id: string) => {
    const updated = skills.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s)
    updateSettings({ skills: updated })
  }

  const canSend = value.trim().length > 0 && !disabled

  const placeholder = isAgentActive
    ? 'Gi agenten en ny oppgave...'
    : useAgentMode
      ? (effectiveAgentSettings.agentType === 'writing'
        ? 'Beskriv hva du vil skrive...'
        : 'Beskriv hva agenten skal gjøre...')
      : t.app.placeholder

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
      {/* ── Live task-boks ── */}
      {showLiveTask && !compact && (
        <div className="live-task-bar" onClick={onOpenTerminal}>
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

          <div className="live-task-content">
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
            {agentState?.logs && agentState.logs.length > 0 && (
              <span className="live-task-sublabel">
                {agentState.logs[agentState.logs.length - 1].message.slice(0, 60)}
              </span>
            )}
          </div>

          <div className="live-task-right">
            {totalTasks > 0 && (
              <span className="live-task-counter">{doneTasks}/{totalTasks}</span>
            )}
            <ChevronDown size={14} style={{ color: '#6B7280' }} />
          </div>
        </div>
      )}

      {/* ── Hoved input-boks ── */}
      <div className={`chat-input-box${useAgentMode ? ' agent-mode' : ''}`}>
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

        <div className="chat-toolbar">
          <div className="chat-toolbar-left">

            {/* Plus-knapp */}
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

              {showPlusMenu && (
                <div className="plus-menu">
                  <button
                    className="plus-menu-item"
                    onClick={() => {
                      setShowPlusMenu(false)
                      setShowSkillsDropdown(v => !v)
                    }}
                  >
                    <Zap size={14} className="plus-menu-icon" />
                    <span>Bruk Skills</span>
                    {enabledSkillsCount > 0 && (
                      <span className="plus-menu-badge">{enabledSkillsCount}</span>
                    )}
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

            <input
              ref={fileInputRef}
              type="file"
              multiple
              style={{ display: 'none' }}
              onChange={handleFileUpload}
              accept="*/*"
            />

            {/* Skills-knapp */}
            <div style={{ position: 'relative' }} ref={skillsRef}>
              <button
                className={`toolbar-btn${enabledSkillsCount > 0 ? ' skill-active' : ''}`}
                title="Skills"
                onClick={() => {
                  setShowSkillsDropdown(v => !v)
                  setShowConnectorsPopup(false)
                }}
                style={{
                  background: showSkillsDropdown ? '#2E2E2E' : undefined,
                  color: showSkillsDropdown ? '#C0C0C0' : enabledSkillsCount > 0 ? '#1A93FE' : undefined,
                  position: 'relative',
                }}
              >
                <Zap size={18} />
                {enabledSkillsCount > 0 && (
                  <span className="toolbar-badge">{enabledSkillsCount}</span>
                )}
              </button>
              {showSkillsDropdown && (
                <SkillsDropdown
                  skills={skills}
                  onToggle={handleSkillToggle}
                  onClose={() => setShowSkillsDropdown(false)}
                  onOpenSettings={() => {
                    setSettingsOpen(true)
                    // Navigate to skills tab via event
                    window.dispatchEvent(new CustomEvent('sine:open-settings-tab', { detail: { tab: 'skills' } }))
                  }}
                />
              )}
            </div>

            {/* Connectors-knapp */}
            <div style={{ position: 'relative' }} ref={connectorsRef}>
              <button
                className={`toolbar-btn${connectedCount > 0 ? ' connector-active' : ''}`}
                title="Tilkoblinger"
                onClick={() => {
                  setShowConnectorsPopup(v => !v)
                  setShowSkillsDropdown(false)
                }}
                style={{
                  background: showConnectorsPopup ? '#2E2E2E' : undefined,
                  color: showConnectorsPopup ? '#C0C0C0' : connectedCount > 0 ? '#4ADE80' : undefined,
                  position: 'relative',
                }}
              >
                <Plug size={18} />
                {connectedCount > 0 && (
                  <span className="toolbar-badge connector-badge">{connectedCount}</span>
                )}
              </button>
              {showConnectorsPopup && (
                <ConnectorsPopup
                  statuses={connectorStatuses}
                  onClose={() => setShowConnectorsPopup(false)}
                  onOpenSettings={() => {
                    setSettingsOpen(true)
                    window.dispatchEvent(new CustomEvent('sine:open-settings-tab', { detail: { tab: 'connectors' } }))
                  }}
                />
              )}
            </div>

            <button className="toolbar-btn" title="GitHub">
              <GitBranch size={18} />
            </button>

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

            {/* Agent-innstillinger */}
            {useAgentMode && onAgentSettingsChange && (
              <AgentSettingsPopover
                settings={effectiveAgentSettings}
                onSettingsChange={(s) => {
                  onAgentSettingsChange(s)
                  onAgentModeChange?.(s.agentMode)
                }}
                memory={memory}
                onAddMemory={onAddMemory}
                onRemoveMemory={onRemoveMemory}
                onClearMemory={onClearMemory}
              />
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
            right: 0,
            marginBottom: 6,
            background: '#1E1E1E',
            border: '1px solid #2A2A2A',
            borderRadius: 10,
            padding: 4,
            zIndex: 50,
            minWidth: 180,
          }}>
            {(Object.entries(labels) as [SineModel, typeof labels[SineModel]][]).map(([id, info]) => (
              <button
                key={id}
                onClick={() => { onModelChange(id); setOpen(false) }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  width: '100%', padding: '8px 12px', borderRadius: 7,
                  background: model === id ? '#252525' : 'transparent',
                  border: 'none', cursor: 'pointer', color: '#E5E5E5',
                  fontFamily: 'inherit', textAlign: 'left',
                }}
              >
                <span style={{ color: '#5A5A5A' }}>{info.icon}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{info.name}</div>
                  <div style={{ fontSize: 11, color: '#5A5A5A' }}>{info.desc}</div>
                </div>
                {model === id && <Check size={12} style={{ marginLeft: 'auto', color: '#1A93FE' }} />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
