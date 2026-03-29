import { useState } from 'react'
import { Settings2, Download, Check, X, ChevronDown, Zap } from 'lucide-react'
import { useApp } from '@/store/AppContext'
import type { Skill } from '@/types'
import { v4 as uuidv4 } from 'uuid'

interface SaveSkillBoxProps {
  suggestedName?: string
  suggestedDescription?: string
  suggestedSystemPrompt?: string
  onDismiss: () => void
}

export function SaveSkillBox({
  suggestedName = '',
  suggestedDescription = '',
  suggestedSystemPrompt = '',
  onDismiss,
}: SaveSkillBoxProps) {
  const { settings, updateSettings } = useApp()
  const [expanded, setExpanded] = useState(false)
  const [name, setName] = useState(suggestedName)
  const [description, setDescription] = useState(suggestedDescription)
  const [systemPrompt, setSystemPrompt] = useState(suggestedSystemPrompt)
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    if (!name.trim()) return
    const newSkill: Skill = {
      id: uuidv4(),
      name: name.trim(),
      description: description.trim(),
      systemPrompt: systemPrompt.trim() || undefined,
      enabled: true,
      source: 'custom',
      icon: '⚙️',
      createdAt: new Date(),
    }
    const existing = settings.skills ?? []
    updateSettings({ skills: [...existing, newSkill] })
    setSaved(true)
    setTimeout(onDismiss, 1800)
  }

  if (saved) {
    return (
      <div className="skill-result-card saved">
        <div className="skill-result-icon-wrap">
          <Check size={16} style={{ color: '#4ADE80' }} />
        </div>
        <div className="skill-result-info">
          <span className="skill-result-name">{name || 'Skill'}</span>
          <span className="skill-result-label">Lagret og aktivert!</span>
        </div>
      </div>
    )
  }

  return (
    <div className="skill-result-card-wrapper">
      {/* Compact row — always visible */}
      <div className="skill-result-card">
        <div className="skill-result-icon-wrap">
          <Settings2 size={16} style={{ color: '#9A9A9A' }} />
        </div>
        <div className="skill-result-info">
          <span className="skill-result-name">
            {name || 'ny-skill'}
          </span>
          <span className="skill-result-label">Skill</span>
        </div>
        <div className="skill-result-actions">
          <button
            className="skill-result-download"
            title="Rediger detaljer"
            onClick={() => setExpanded(v => !v)}
          >
            <Download size={15} />
          </button>
          <button
            className="skill-result-add-btn"
            onClick={handleSave}
          >
            Legg til mine skills
          </button>
          <button className="skill-result-close" onClick={onDismiss}>
            <X size={13} />
          </button>
        </div>
      </div>

      {/* Expanded edit form */}
      {expanded && (
        <div className="skill-result-expand">
          <div className="save-skill-field">
            <label className="save-skill-label">Navn</label>
            <input
              className="save-skill-input"
              placeholder="min-skill-navn"
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
            />
          </div>
          <div className="save-skill-field">
            <label className="save-skill-label">Beskrivelse</label>
            <input
              className="save-skill-input"
              placeholder="Hva gjør denne skillen?"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>
          <button
            className="save-skill-advanced-toggle"
            onClick={() => {}}
            style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#5A5A5A', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0' }}
          >
            <ChevronDown size={12} />
            System prompt (valgfritt)
          </button>
          <textarea
            className="save-skill-textarea"
            placeholder="Instruksjoner til Sine når denne skillen er aktiv..."
            value={systemPrompt}
            onChange={e => setSystemPrompt(e.target.value)}
            rows={3}
            style={{ marginTop: 4 }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 10 }}>
            <button className="save-skill-cancel" onClick={() => setExpanded(false)}>Avbryt</button>
            <button
              className="save-skill-save"
              onClick={handleSave}
              disabled={!name.trim()}
            >
              <Zap size={12} />
              Lagre skill
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
