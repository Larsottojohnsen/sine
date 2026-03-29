import { useState } from 'react'
import { Zap, X, Check, ChevronDown } from 'lucide-react'
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
  const [name, setName] = useState(suggestedName)
  const [description, setDescription] = useState(suggestedDescription)
  const [systemPrompt, setSystemPrompt] = useState(suggestedSystemPrompt)
  const [showAdvanced, setShowAdvanced] = useState(false)
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
      icon: '⚡',
      createdAt: new Date(),
    }
    const existing = settings.skills ?? []
    updateSettings({ skills: [...existing, newSkill] })
    setSaved(true)
    setTimeout(onDismiss, 1500)
  }

  if (saved) {
    return (
      <div className="save-skill-box saved">
        <Check size={16} style={{ color: '#4ADE80' }} />
        <span>Skill lagret! Aktiv i neste samtale.</span>
      </div>
    )
  }

  return (
    <div className="save-skill-box">
      <div className="save-skill-box-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div className="save-skill-box-icon">
            <Zap size={14} style={{ color: '#1A93FE' }} />
          </div>
          <div>
            <div className="save-skill-box-title">Lagre som skill</div>
            <div className="save-skill-box-sub">Gjør denne samtalen om til en gjenbrukbar skill</div>
          </div>
        </div>
        <button className="save-skill-box-close" onClick={onDismiss}>
          <X size={14} />
        </button>
      </div>

      <div className="save-skill-box-body">
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
          onClick={() => setShowAdvanced(v => !v)}
        >
          <ChevronDown
            size={13}
            style={{
              transform: showAdvanced ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.15s',
            }}
          />
          Avansert (system prompt)
        </button>

        {showAdvanced && (
          <div className="save-skill-field">
            <label className="save-skill-label">System prompt</label>
            <textarea
              className="save-skill-textarea"
              placeholder="Instruksjoner til Sine når denne skillen er aktiv..."
              value={systemPrompt}
              onChange={e => setSystemPrompt(e.target.value)}
              rows={4}
            />
          </div>
        )}
      </div>

      <div className="save-skill-box-footer">
        <button className="save-skill-cancel" onClick={onDismiss}>Avbryt</button>
        <button
          className="save-skill-save"
          onClick={handleSave}
          disabled={!name.trim()}
        >
          <Zap size={13} />
          Lagre skill
        </button>
      </div>
    </div>
  )
}
