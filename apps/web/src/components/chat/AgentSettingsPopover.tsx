import { useState, useRef, useEffect } from 'react'
import {
  Settings2, Code2, PenLine, Shield,
  ChevronDown, FileText, Languages, LayoutList, Check, Brain
} from 'lucide-react'
import type { AgentMode } from '@/hooks/useAgent'
import type { UserMemory } from '@/types'
import { UserMemoryPanel } from '@/components/settings/UserMemoryPanel'

export type AgentType = 'code' | 'writing'

export interface AgentSettings {
  agentType: AgentType
  agentMode: AgentMode
  outputLanguage: 'no' | 'en' | 'auto'
  detailLevel: 'compact' | 'normal' | 'detailed'
  // Writing-specific
  documentType?: 'essay' | 'report' | 'book' | 'exam' | 'article'
  autoSave?: boolean
}

interface AgentSettingsPopoverProps {
  settings: AgentSettings
  onSettingsChange: (s: AgentSettings) => void
  memory?: UserMemory[]
  onAddMemory?: (key: string, value: string) => void
  onRemoveMemory?: (id: string) => void
  onClearMemory?: () => void
}

const AGENT_TYPES: { id: AgentType; label: string; desc: string; icon: React.ReactNode }[] = [
  {
    id: 'code',
    label: 'Kode',
    desc: 'Kjører kode, bygger apper og automatiserer oppgaver',
    icon: <Code2 size={14} />,
  },
  {
    id: 'writing',
    label: 'Skriving',
    desc: 'Skriver dokumenter, rapporter, bøker og eksamener',
    icon: <PenLine size={14} />,
  },
]

const DOCUMENT_TYPES: { id: NonNullable<AgentSettings['documentType']>; label: string }[] = [
  { id: 'essay', label: 'Stil / Oppgave' },
  { id: 'report', label: 'Rapport' },
  { id: 'exam', label: 'Eksamen' },
  { id: 'article', label: 'Artikkel' },
  { id: 'book', label: 'Bok / Kapitler' },
]

const DETAIL_LEVELS: { id: AgentSettings['detailLevel']; label: string; desc: string }[] = [
  { id: 'compact', label: 'Kompakt', desc: 'Kortfattet og direkte' },
  { id: 'normal', label: 'Normal', desc: 'Balansert detaljnivå' },
  { id: 'detailed', label: 'Detaljert', desc: 'Grundig og utfyllende' },
]

const OUTPUT_LANGS: { id: AgentSettings['outputLanguage']; label: string }[] = [
  { id: 'auto', label: 'Auto (samme som input)' },
  { id: 'no', label: 'Norsk' },
  { id: 'en', label: 'English' },
]

export function AgentSettingsPopover({
  settings,
  onSettingsChange,
  memory = [],
  onAddMemory,
  onRemoveMemory,
  onClearMemory,
}: AgentSettingsPopoverProps) {
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'settings' | 'memory'>('settings')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const update = (partial: Partial<AgentSettings>) =>
    onSettingsChange({ ...settings, ...partial })

  const currentType = AGENT_TYPES.find(t => t.id === settings.agentType)
  const isSafe = settings.agentMode === 'safe'

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        className={`toolbar-mode-btn agent-settings-btn${open ? ' active' : ''}`}
        onClick={() => setOpen(v => !v)}
        title="Agent-innstillinger"
      >
        <Settings2 size={12} />
        <span>{currentType?.label ?? 'Kode'}</span>
        <ChevronDown size={10} style={{ opacity: 0.6 }} />
      </button>

      {open && (
        <div className="agent-settings-popover">
          {/* ── Tabs ── */}
          <div className="asp-tabs">
            <button
              className={`asp-tab${activeTab === 'settings' ? ' active' : ''}`}
              onClick={() => setActiveTab('settings')}
            >
              <Settings2 size={11} />
              <span>Innstillinger</span>
            </button>
            <button
              className={`asp-tab${activeTab === 'memory' ? ' active' : ''}`}
              onClick={() => setActiveTab('memory')}
            >
              <Brain size={11} />
              <span>Minne</span>
              {memory.length > 0 && (
                <span className="asp-memory-badge">{memory.length}</span>
              )}
            </button>
          </div>

          {activeTab === 'memory' && (
            <div className="asp-section">
              <UserMemoryPanel
                memory={memory}
                onAdd={(key, value) => onAddMemory?.(key, value)}
                onRemove={(id) => onRemoveMemory?.(id)}
                onClear={() => onClearMemory?.()}
              />
            </div>
          )}

          {activeTab === 'settings' && <>
          {/* ── Agent-type ── */}
          <div className="asp-section">
            <div className="asp-section-label">Type agent</div>
            <div className="asp-type-grid">
              {AGENT_TYPES.map(t => (
                <button
                  key={t.id}
                  className={`asp-type-btn${settings.agentType === t.id ? ' active' : ''}`}
                  onClick={() => update({ agentType: t.id })}
                >
                  <span className="asp-type-icon">{t.icon}</span>
                  <div>
                    <div className="asp-type-name">{t.label}</div>
                    <div className="asp-type-desc">{t.desc}</div>
                  </div>
                  {settings.agentType === t.id && (
                    <Check size={12} style={{ marginLeft: 'auto', color: '#1A93FE', flexShrink: 0 }} />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="asp-divider" />

          {/* ── Dokumenttype (kun for skriving) ── */}
          {settings.agentType === 'writing' && (
            <>
              <div className="asp-section">
                <div className="asp-section-label">Dokumenttype</div>
                <div className="asp-chip-row">
                  {DOCUMENT_TYPES.map(d => (
                    <button
                      key={d.id}
                      className={`asp-chip${settings.documentType === d.id ? ' active' : ''}`}
                      onClick={() => update({ documentType: d.id })}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="asp-divider" />
            </>
          )}

          {/* ── Safe mode ── */}
          <div className="asp-section">
            <div className="asp-row">
              <div>
                <div className="asp-row-label">
                  <Shield size={12} style={{ color: isSafe ? '#34D399' : '#F59E0B' }} />
                  Safe mode
                </div>
                <div className="asp-row-desc">
                  {isSafe
                    ? 'Agenten ber om godkjenning ved viktige handlinger'
                    : 'Agenten kjører uten å spørre (raskere, men mer risiko)'}
                </div>
              </div>
              <button
                className={`asp-toggle${isSafe ? ' on' : ' off'}`}
                onClick={() => update({ agentMode: isSafe ? 'power' : 'safe' })}
              >
                <div className="asp-toggle-knob" />
              </button>
            </div>
          </div>

          <div className="asp-divider" />

          {/* ── Detaljnivå ── */}
          <div className="asp-section">
            <div className="asp-section-label">
              <LayoutList size={12} />
              Detaljnivå i svar
            </div>
            <div className="asp-chip-row">
              {DETAIL_LEVELS.map(d => (
                <button
                  key={d.id}
                  className={`asp-chip${settings.detailLevel === d.id ? ' active' : ''}`}
                  onClick={() => update({ detailLevel: d.id })}
                  title={d.desc}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <div className="asp-divider" />

          {/* ── Output-språk ── */}
          <div className="asp-section">
            <div className="asp-section-label">
              <Languages size={12} />
              Svar-språk
            </div>
            <div className="asp-chip-row">
              {OUTPUT_LANGS.map(l => (
                <button
                  key={l.id}
                  className={`asp-chip${settings.outputLanguage === l.id ? ' active' : ''}`}
                  onClick={() => update({ outputLanguage: l.id })}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Auto-lagre (kun skriving) ── */}
          {settings.agentType === 'writing' && (
            <>
              <div className="asp-divider" />
              <div className="asp-section">
                <div className="asp-row">
                  <div>
                    <div className="asp-row-label">
                      <FileText size={12} />
                      Auto-lagre dokument
                    </div>
                    <div className="asp-row-desc">Lagrer dokumentet automatisk underveis</div>
                  </div>
                  <button
                    className={`asp-toggle${settings.autoSave ? ' on' : ' off'}`}
                    onClick={() => update({ autoSave: !settings.autoSave })}
                  >
                    <div className="asp-toggle-knob" />
                  </button>
                </div>
              </div>
            </>
          )}
          </> }
        </div>
      )}
    </div>
  )
}
