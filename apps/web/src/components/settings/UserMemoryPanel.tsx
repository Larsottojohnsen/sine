import { useState } from 'react'
import { Brain, Trash2, Plus, X } from 'lucide-react'
import type { UserMemory } from '@/types'

interface UserMemoryPanelProps {
  memory: UserMemory[]
  onAdd: (key: string, value: string) => void
  onRemove: (id: string) => void
  onClear: () => void
}

export function UserMemoryPanel({ memory, onAdd, onRemove, onClear }: UserMemoryPanelProps) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [newKey, setNewKey] = useState('')
  const [newValue, setNewValue] = useState('')

  const handleAdd = () => {
    if (newKey.trim() && newValue.trim()) {
      onAdd(newKey.trim(), newValue.trim())
      setNewKey('')
      setNewValue('')
      setShowAddForm(false)
    }
  }

  return (
    <div className="memory-panel">
      {/* Header */}
      <div className="memory-panel-header">
        <div className="memory-panel-title">
          <Brain size={14} />
          <span>Minne</span>
        </div>
        <p className="memory-panel-desc">
          Sine husker dette på tvers av alle samtaler og bruker det for bedre svar.
        </p>
      </div>

      {/* Minne-liste */}
      {memory.length === 0 ? (
        <div className="memory-empty">
          <Brain size={24} className="memory-empty-icon" />
          <p>Ingen lagret informasjon ennå.</p>
          <p className="memory-empty-hint">
            Fortell Sine om deg selv — f.eks. "Jeg studerer informatikk ved NTNU" — og den vil huske det.
          </p>
        </div>
      ) : (
        <div className="memory-list">
          {memory.map(item => (
            <div key={item.id} className="memory-item">
              <div className="memory-item-content">
                <span className="memory-item-key">{item.key}</span>
                <span className="memory-item-value">{item.value}</span>
              </div>
              <button
                className="memory-item-remove"
                onClick={() => onRemove(item.id)}
                title="Fjern"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Legg til-form */}
      {showAddForm && (
        <div className="memory-add-form">
          <input
            className="memory-input"
            placeholder="Nøkkel (f.eks. studiested)"
            value={newKey}
            onChange={e => setNewKey(e.target.value)}
          />
          <input
            className="memory-input"
            placeholder="Verdi (f.eks. NTNU)"
            value={newValue}
            onChange={e => setNewValue(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
          />
          <div className="memory-add-actions">
            <button className="memory-btn-cancel" onClick={() => setShowAddForm(false)}>Avbryt</button>
            <button className="memory-btn-save" onClick={handleAdd}>Lagre</button>
          </div>
        </div>
      )}

      {/* Handlinger */}
      <div className="memory-actions">
        <button
          className="memory-btn-add"
          onClick={() => setShowAddForm(true)}
        >
          <Plus size={12} />
          <span>Legg til</span>
        </button>
        {memory.length > 0 && (
          <button
            className="memory-btn-clear"
            onClick={onClear}
          >
            <Trash2 size={12} />
            <span>Slett alt</span>
          </button>
        )}
      </div>
    </div>
  )
}
