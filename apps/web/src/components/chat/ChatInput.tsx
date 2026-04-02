import { useState, useRef, useEffect, useCallback, type KeyboardEvent } from 'react'
import {
  Monitor, Mic, ArrowUp, Square,
  ChevronDown, Bot, BotOff,
  Plus, Paperclip, ChevronRight,
  Plug, Zap, ToggleRight, ToggleLeft, Settings,
  Brain, Trash2, BarChart2, BookOpen, Lightbulb
} from 'lucide-react'

// ─── Slash-kommandoer (inspirert av Claude Code) ────────────────────────────────────
const SLASH_COMMANDS = [
  {
    command: '/husk',
    description: 'Lagre noe i minnet. Eks: /husk Jeg jobber med React',
    icon: 'Brain',
    example: '/husk [nøkkel]: [verdi]',
  },
  {
    command: '/glem',
    description: 'Slett et minne. Eks: /glem navn',
    icon: 'Trash2',
    example: '/glem [nøkkel]',
  },
  {
    command: '/plan',
    description: 'Aktiver planleggingsmodus – Sine lager en plan før den handler',
    icon: 'Lightbulb',
    example: '/plan [oppgave]',
  },
  {
    command: '/bruk',
    description: 'Vis token-forbruk for denne samtalen',
    icon: 'BarChart2',
    example: '/bruk',
  },
  {
    command: '/skills',
    description: 'List opp alle tilgjengelige skills',
    icon: 'BookOpen',
    example: '/skills',
  },
] as const

type SlashCommand = typeof SLASH_COMMANDS[number]

const SLASH_ICONS: Record<string, React.ReactNode> = {
  Brain: <Brain size={14} />,
  Trash2: <Trash2 size={14} />,
  Lightbulb: <Lightbulb size={14} />,
  BarChart2: <BarChart2 size={14} />,
  BookOpen: <BookOpen size={14} />,
}

function SlashCommandMenu({
  commands,
  selectedIndex,
  onSelect,
}: {
  commands: readonly SlashCommand[]
  selectedIndex: number
  onSelect: (cmd: SlashCommand) => void
}) {
  if (commands.length === 0) return null
  return (
    <div style={{
      position: 'absolute',
      bottom: '100%',
      left: 0,
      right: 0,
      marginBottom: 6,
      background: '#1A1A1A',
      border: '1px solid #2A2A2A',
      borderRadius: 10,
      overflow: 'hidden',
      zIndex: 100,
      boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
    }}>
      <div style={{ padding: '6px 10px 4px', fontSize: 10, color: '#4A4A4A', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
        Kommandoer
      </div>
      {commands.map((cmd, i) => (
        <button
          key={cmd.command}
          onClick={() => onSelect(cmd)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            width: '100%',
            padding: '8px 12px',
            background: i === selectedIndex ? '#252525' : 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: '#E5E5E5',
            fontFamily: 'inherit',
            textAlign: 'left',
          }}
        >
          <span style={{ color: '#1A93FE', flexShrink: 0 }}>{SLASH_ICONS[cmd.icon]}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#1A93FE' }}>{cmd.command}</span>
              <span style={{ fontSize: 11, color: '#5A5A5A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cmd.description}</span>
            </div>
          </div>
        </button>
      ))}
    </div>
  )
}
import type { Skill } from '@/types'
import { getTranslations } from '@/i18n'
import type { AgentMode, AgentState } from '@/hooks/useAgent'
import { AgentSettingsPopover, type AgentSettings } from './AgentSettingsPopover'
import type { UserMemory } from '@/types'
import { useApp } from '@/store/AppContext'

interface ChatInputProps {
  onSend: (message: string, mode?: AgentMode) => void
  onStop?: () => void
  isStreaming?: boolean
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

// ─── Connectors popup i chat — matches reference design ──────
const APP_CONNECTORS_MINI = [
  { id: 'github',    name: 'GitHub',                      icon: '/connector-icons/github.svg',    hasSub: true },
  { id: 'gmail',     name: 'Gmail',                       icon: '/connector-icons/gmail.svg',     hasSub: false },
  { id: 'meta-ads',  name: 'Meta Ads Manager',            icon: '/connector-icons/meta.svg',      hasSub: false, beta: true },
  { id: 'instagram', name: 'Instagram',                   icon: '/connector-icons/instagram.svg', hasSub: false, beta: true },
  { id: 'instagram-creator', name: 'Instagram Creator Marketplace', icon: '/connector-icons/instagram.svg', hasSub: false, beta: true },
  { id: 'outlook-mail', name: 'Outlook Mail',             icon: '/connector-icons/outlook.svg',   hasSub: false },
  { id: 'google-calendar', name: 'Google Calendar',       icon: '/connector-icons/gcal.svg',      hasSub: false },
  { id: 'outlook-calendar', name: 'Outlook Calendar',     icon: '/connector-icons/outlook.svg',   hasSub: false },
]

// Emoji fallbacks for connectors (used if SVG not found)
const CONNECTOR_EMOJI: Record<string, string> = {
  github: '🐙',
  gmail: '✉️',
  'meta-ads': '📘',
  instagram: '📸',
  'instagram-creator': '⭐',
  'outlook-mail': '📨',
  'google-calendar': '📅',
  'outlook-calendar': '🗓️',
}

function ConnectorIcon({ id, size = 16 }: { id: string; size?: number }) {
  const [failed, setFailed] = useState(false)
  const src = `/connector-icons/${id}.svg`
  if (failed) {
    return <span style={{ fontSize: size - 2, lineHeight: 1 }}>{CONNECTOR_EMOJI[id] ?? '🔌'}</span>
  }
  return (
    <img
      src={src}
      alt={id}
      width={size}
      height={size}
      onError={() => setFailed(true)}
      style={{ objectFit: 'contain', flexShrink: 0 }}
    />
  )
}

function ConnectorsPopup({
  statuses,
  onClose,
  onOpenSettings,
}: {
  statuses: Record<string, string>
  onClose: () => void
  onOpenSettings: () => void
}) {
  return (
    <div className="connectors-mini-popup">
      {APP_CONNECTORS_MINI.map(c => {
        const isConnected = statuses[c.id] === 'connected'
        return (
          <div key={c.id} className="connectors-mini-row">
            <div className="connectors-mini-icon">
              <ConnectorIcon id={c.id} size={16} />
            </div>
            <span className="connectors-mini-name">
              {c.name}
              {c.beta && <span className="connectors-mini-beta">Beta</span>}
            </span>
            {isConnected ? (
              <div className="connectors-mini-right">
                {c.hasSub && (
                  <button className="connectors-mini-sub">
                    Repositories <ChevronRight size={11} />
                  </button>
                )}
                {/* Toggle switch */}
                <label className="connectors-mini-toggle">
                  <input
                    type="checkbox"
                    defaultChecked
                    onChange={() => {}}
                    style={{ display: 'none' }}
                  />
                  <span className="connectors-mini-toggle-track on" />
                </label>
              </div>
            ) : (
              <button
                className="connectors-mini-connect"
                onClick={() => { onOpenSettings(); onClose() }}
              >
                Connect
              </button>
            )}
          </div>
        )
      })}

      <div className="connectors-mini-divider" />

      <button
        className="connectors-mini-add"
        onClick={() => { onOpenSettings(); onClose() }}
      >
        <Plus size={13} />
        <span>Add connectors</span>
        <div className="connectors-mini-add-icons">
          <span style={{ fontSize: 11 }}>☁️</span>
          <span style={{ fontSize: 11 }}>📋</span>
          <span className="connectors-mini-add-count">+70</span>
        </div>
      </button>

      <button
        className="connectors-mini-manage"
        onClick={() => { onOpenSettings(); onClose() }}
      >
        <Settings size={12} />
        <span>Manage connectors</span>
      </button>

      {/* Bottom icons bar */}
      <div className="connectors-mini-footer">
        <button className="connectors-mini-footer-btn active">
          <ConnectorIcon id="github" size={14} />
        </button>
        <button className="connectors-mini-footer-btn">
          <Monitor size={14} />
        </button>
      </div>
    </div>
  )
}

export function ChatInput({
  onSend,
  onStop,
  isStreaming,
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
  const [slashMenuOpen, setSlashMenuOpen] = useState(false)
  const [slashSelectedIndex, setSlashSelectedIndex] = useState(0)
  const [planningMode, setPlanningMode] = useState(false)
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

  // ── Slash-kommando: filtrer basert på input ───────────────────────────────────
  const filteredSlashCommands = value.startsWith('/')
    ? SLASH_COMMANDS.filter(c => c.command.startsWith(value.split(' ')[0].toLowerCase()))
    : []

  // ── Slash-kommando: håndter utførelse ─────────────────────────────────────────
  const executeSlashCommand = useCallback((cmd: SlashCommand, fullInput: string) => {
    const args = fullInput.slice(cmd.command.length).trim()

    switch (cmd.command) {
      case '/husk': {
        // /husk [nøkkel]: [verdi] eller /husk [verdi]
        if (args) {
          const colonIdx = args.indexOf(':')
          if (colonIdx > 0) {
            const key = args.slice(0, colonIdx).trim()
            const val = args.slice(colonIdx + 1).trim()
            onAddMemory?.(key, val)
            onSend(`Jeg har lagret i minnet: **${key}** = ${val}`, agentMode)
          } else {
            onAddMemory?.('notat', args)
            onSend(`Jeg har lagret i minnet: ${args}`, agentMode)
          }
        } else {
          setValue('/husk ')
          textareaRef.current?.focus()
          return
        }
        break
      }
      case '/glem': {
        if (args) {
          const toRemove = memory.find(m => m.key.toLowerCase() === args.toLowerCase())
          if (toRemove) {
            onRemoveMemory?.(toRemove.id)
            onSend(`Jeg har slettet minnet: **${args}**`, agentMode)
          } else {
            onSend(`Fant ikke minnet "${args}". Tilgjengelige minner: ${memory.map(m => m.key).join(', ') || 'ingen'}`, agentMode)
          }
        } else {
          onClearMemory?.()
          onSend('Jeg har slettet alle lagrede minner.', agentMode)
        }
        break
      }
      case '/plan': {
        setPlanningMode(true)
        const task = args || 'Beskriv oppgaven'
        onSend(`/plan ${task}`, agentMode)
        break
      }
      case '/bruk': {
        const memCount = memory.length
        onSend(
          `**Minnestatus:** ${memCount} minner lagret.\n` +
          (memCount > 0
            ? `\n**Lagrede minner:**\n${memory.map(m => `- **${m.key}**: ${m.value}`).join('\n')}`
            : ''),
          agentMode
        )
        break
      }
      case '/skills': {
        const activeSkills = (settings.skills ?? []).filter(s => s.enabled)
        const allSkills = settings.skills ?? []
        onSend(
          `**Skills (${activeSkills.length}/${allSkills.length} aktive):**\n` +
          (allSkills.length > 0
            ? allSkills.map(s => `- ${s.enabled ? '✅' : '□'} **${s.name}**: ${s.description}`).join('\n')
            : 'Ingen skills lagt til ennå. Gå til Innstillinger for å legge til skills.'),
          agentMode
        )
        break
      }
    }

    setValue('')
    setSlashMenuOpen(false)
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
  }, [memory, onAddMemory, onRemoveMemory, onClearMemory, onSend, agentMode, settings.skills])

  const handleSend = useCallback(() => {
    const trimmed = value.trim()
    if (!trimmed || isStreaming || disabled) return

    // Sjekk om dette er en slash-kommando
    if (trimmed.startsWith('/')) {
      const matchedCmd = SLASH_COMMANDS.find(c => trimmed.startsWith(c.command))
      if (matchedCmd) {
        executeSlashCommand(matchedCmd, trimmed)
        return
      }
    }

    // Vanlig melding — legg til planleggingsmodus-flagg hvis aktivt
    if (planningMode) {
      onSend(`[PLANLEGGINGSMODUS] ${trimmed}`, agentMode)
    } else {
      onSend(trimmed, agentMode)
    }
    setValue('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }, [value, isStreaming, disabled, onSend, agentMode, planningMode, executeSlashCommand])

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Naviger slash-meny med piltaster
    if (slashMenuOpen && filteredSlashCommands.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSlashSelectedIndex(i => (i + 1) % filteredSlashCommands.length)
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSlashSelectedIndex(i => (i - 1 + filteredSlashCommands.length) % filteredSlashCommands.length)
        return
      }
      if (e.key === 'Tab' || (e.key === 'Enter' && !e.shiftKey)) {
        e.preventDefault()
        const cmd = filteredSlashCommands[slashSelectedIndex]
        if (cmd) {
          setValue(cmd.command + ' ')
          setSlashMenuOpen(false)
          textareaRef.current?.focus()
        }
        return
      }
      if (e.key === 'Escape') {
        setSlashMenuOpen(false)
        return
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }, [handleSend, slashMenuOpen, filteredSlashCommands, slashSelectedIndex])

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
            <div className="live-task-logs">
              {agentState?.logs?.slice(-3).map((log, i) => (
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
      <div className={`chat-input-box${useAgentMode ? ' agent-mode' : ''}`} style={{ position: 'relative' }}>
        {/* Slash-kommando meny */}
        {slashMenuOpen && filteredSlashCommands.length > 0 && (
          <SlashCommandMenu
            commands={filteredSlashCommands}
            selectedIndex={slashSelectedIndex}
            onSelect={(cmd) => {
              setValue(cmd.command + ' ')
              setSlashMenuOpen(false)
              textareaRef.current?.focus()
            }}
          />
        )}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={e => {
            const v = e.target.value
            setValue(v)
            adjustHeight()
            // Vis slash-meny når input starter med '/'
            if (v.startsWith('/') && v.length > 0) {
              setSlashMenuOpen(true)
              setSlashSelectedIndex(0)
            } else {
              setSlashMenuOpen(false)
            }
          }}
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

            {/* Skills-knapp — hidden unless skills are active */}
            {enabledSkillsCount > 0 && (
              <div style={{ position: 'relative' }} ref={skillsRef}>
                <button
                  className="toolbar-btn skill-active"
                  title="Skills"
                  onClick={() => {
                    setShowSkillsDropdown(v => !v)
                    setShowConnectorsPopup(false)
                  }}
                  style={{
                    background: showSkillsDropdown ? '#1A3A5C' : 'transparent',
                    color: '#1A93FE',
                    position: 'relative',
                  }}
                >
                  <Zap size={18} />
                  <span className="toolbar-badge">{enabledSkillsCount}</span>
                </button>
                {showSkillsDropdown && (
                  <SkillsDropdown
                    skills={skills}
                    onToggle={handleSkillToggle}
                    onClose={() => setShowSkillsDropdown(false)}
                    onOpenSettings={() => {
                      setSettingsOpen(true)
                      window.dispatchEvent(new CustomEvent('sine:open-settings-tab', { detail: { tab: 'skills' } }))
                    }}
                  />
                )}
              </div>
            )}

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

            {/* Planleggingsmodus-knapp (Claude Code-inspirert) */}
            <button
              className={`toolbar-mode-btn${planningMode ? ' active' : ''}`}
              onClick={() => setPlanningMode(v => !v)}
              title={planningMode
                ? 'Planleggingsmodus aktiv – Sine lager en plan før den handler. Klikk for å deaktivere.'
                : 'Aktiver planleggingsmodus – Sine lager en plan og viser den før den handler'
              }
              style={planningMode ? {
                background: 'rgba(234, 179, 8, 0.15)',
                color: '#EAB308',
                border: '1px solid rgba(234, 179, 8, 0.3)',
              } : undefined}
            >
              <Lightbulb size={12} />
              <span>Plan</span>
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

