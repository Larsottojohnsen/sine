import { useState } from 'react'
import { X, Folder, Plus } from 'lucide-react'

export interface Project {
  id: string
  name: string
  instructions?: string
  connectors?: string[]
  createdAt: Date
}

interface CreateProjectModalProps {
  onClose: () => void
  onCreate: (project: Omit<Project, 'id' | 'createdAt'>) => void
}

export function CreateProjectModal({ onClose, onCreate }: CreateProjectModalProps) {
  const [name, setName] = useState('')
  const [instructions, setInstructions] = useState('')
  const [connectors, setConnectors] = useState<string[]>([])
  const [showConnectorPicker, setShowConnectorPicker] = useState(false)

  const handleCreate = () => {
    if (!name.trim()) return
    onCreate({ name: name.trim(), instructions: instructions.trim() || undefined, connectors })
    onClose()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose()
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
      }}
      onClick={onClose}
      onKeyDown={handleKeyDown}
    >
      <div
        style={{
          background: '#1c1c1e',
          border: '1px solid #3a3a3c',
          borderRadius: 16,
          padding: '28px 28px 24px',
          width: '100%',
          maxWidth: 520,
          boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
          position: 'relative',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 16, right: 16,
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: '#6A6A6A', display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 28, height: 28, borderRadius: 8,
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = '#2a2a2c')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <X size={16} />
        </button>

        {/* Title */}
        <h2 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 600, color: '#F0F0F0' }}>
          Create project
        </h2>

        {/* Folder icon */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
          <div style={{
            background: '#2c2c2e',
            borderRadius: 14,
            width: 64, height: 64,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Folder size={28} color="#A0A0A0" />
          </div>
        </div>

        {/* Project name */}
        <div style={{ marginBottom: 18 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#E0E0E0', marginBottom: 8 }}>
            Project name
          </label>
          <input
            autoFocus
            type="text"
            placeholder="Enter the name"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleCreate() }}
            style={{
              width: '100%',
              background: '#2c2c2e',
              border: '1px solid #3a3a3c',
              borderRadius: 10,
              padding: '10px 14px',
              fontSize: 14,
              color: '#F0F0F0',
              outline: 'none',
              boxSizing: 'border-box',
              transition: 'border-color 0.15s',
              fontFamily: 'inherit',
            }}
            onFocus={e => (e.currentTarget.style.borderColor = '#5A5A5E')}
            onBlur={e => (e.currentTarget.style.borderColor = '#3a3a3c')}
          />
        </div>

        {/* Instructions */}
        <div style={{ marginBottom: 18 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#E0E0E0', marginBottom: 8 }}>
            Instructions{' '}
            <span style={{ fontWeight: 400, color: '#7A7A7A' }}>(optional)</span>
          </label>
          <textarea
            placeholder={`e.g. "Focus on Python best practices", "Maintain a professional tone", or\n"Always provide sources for important conclusions".`}
            value={instructions}
            onChange={e => setInstructions(e.target.value)}
            rows={5}
            style={{
              width: '100%',
              background: '#2c2c2e',
              border: '1px solid #3a3a3c',
              borderRadius: 10,
              padding: '10px 14px',
              fontSize: 13,
              color: '#E0E0E0',
              outline: 'none',
              resize: 'vertical',
              boxSizing: 'border-box',
              lineHeight: 1.6,
              transition: 'border-color 0.15s',
              fontFamily: 'inherit',
            }}
            onFocus={e => (e.currentTarget.style.borderColor = '#5A5A5E')}
            onBlur={e => (e.currentTarget.style.borderColor = '#3a3a3c')}
          />
        </div>

        {/* Connectors */}
        <div style={{ marginBottom: 24, position: 'relative' }}>
          <button
            onClick={() => setShowConnectorPicker(v => !v)}
            style={{
              width: '100%',
              background: '#2c2c2e',
              border: '1px solid #3a3a3c',
              borderRadius: 10,
              padding: '10px 14px',
              fontSize: 13,
              color: connectors.length > 0 ? '#E0E0E0' : '#7A7A7A',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontFamily: 'inherit',
              transition: 'border-color 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = '#5A5A5E')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = '#3a3a3c')}
          >
            <span>
              {connectors.length > 0
                ? `Connectors: ${connectors.join(', ')}`
                : 'Connectors (optional)'}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#A0A0A0', fontSize: 12 }}>
              <Plus size={13} />
              Add connectors
            </span>
          </button>

          {/* Connector picker dropdown */}
          {showConnectorPicker && (
            <div
              style={{
                position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
                background: '#2c2c2e',
                border: '1px solid #3a3a3c',
                borderRadius: 10,
                padding: '8px',
                zIndex: 10,
                boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
              }}
            >
              {['Gmail', 'Google Calendar', 'GitHub', 'Slack', 'Notion', 'Meta Ads'].map(c => (
                <button
                  key={c}
                  onClick={() => {
                    setConnectors(prev =>
                      prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]
                    )
                  }}
                  style={{
                    width: '100%',
                    background: connectors.includes(c) ? '#3a3a3e' : 'transparent',
                    border: 'none',
                    borderRadius: 7,
                    padding: '8px 10px',
                    fontSize: 13,
                    color: connectors.includes(c) ? '#F0F0F0' : '#C0C0C0',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontFamily: 'inherit',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                  onMouseEnter={e => { if (!connectors.includes(c)) e.currentTarget.style.background = '#333336' }}
                  onMouseLeave={e => { if (!connectors.includes(c)) e.currentTarget.style.background = 'transparent' }}
                >
                  {connectors.includes(c) && (
                    <span style={{ color: '#1A93FE', fontSize: 11 }}>✓</span>
                  )}
                  {c}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '9px 20px',
              borderRadius: 9,
              border: '1px solid #3A3A3C',
              background: 'transparent',
              color: '#C0C0C0',
              fontSize: 13,
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontWeight: 500,
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#2a2a2c')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!name.trim()}
            style={{
              padding: '9px 20px',
              borderRadius: 9,
              border: 'none',
              background: name.trim() ? '#3a3a3e' : '#2a2a2c',
              color: name.trim() ? '#F0F0F0' : '#6A6A6A',
              fontSize: 13,
              cursor: name.trim() ? 'pointer' : 'not-allowed',
              fontFamily: 'inherit',
              fontWeight: 500,
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => { if (name.trim()) e.currentTarget.style.background = '#4a4a4e' }}
            onMouseLeave={e => { if (name.trim()) e.currentTarget.style.background = '#3a3a3e' }}
          >
            Create
          </button>
        </div>
      </div>
    </div>
  )
}
