import { useState, useEffect, useRef } from 'react'
import { Search, Plus, X, MessageSquare, Bot } from 'lucide-react'
import { useApp } from '@/store/AppContext'
import type { Conversation } from '@/types'

interface SearchModalProps {
  open: boolean
  onClose: () => void
  onSelectConversation: (id: string) => void
  onNewChat: () => void
}

export function SearchModal({ open, onClose, onSelectConversation, onNewChat }: SearchModalProps) {
  const { conversations } = useApp()
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setQuery('')
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  // Keyboard shortcut Cmd+K / Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        if (!open) onClose() // toggle handled by parent
      }
      if (e.key === 'Escape' && open) onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  // Filter conversations based on query
  const filtered = query.trim()
    ? conversations.filter(c =>
        c.title.toLowerCase().includes(query.toLowerCase()) ||
        c.messages.some(m => m.content.toLowerCase().includes(query.toLowerCase()))
      )
    : conversations

  // Group by time
  const now = new Date()
  const groups: { label: string; items: Conversation[] }[] = []
  const today: Conversation[] = []
  const last7: Conversation[] = []
  const last30: Conversation[] = []
  const older: Conversation[] = []

  for (const c of filtered) {
    const diff = (now.getTime() - new Date(c.updatedAt).getTime()) / (1000 * 60 * 60 * 24)
    if (diff < 1) today.push(c)
    else if (diff < 7) last7.push(c)
    else if (diff < 30) last30.push(c)
    else older.push(c)
  }

  if (today.length) groups.push({ label: 'I dag', items: today })
  if (last7.length) groups.push({ label: 'Siste 7 dager', items: last7 })
  if (last30.length) groups.push({ label: 'Siste 30 dager', items: last30 })
  if (older.length) groups.push({ label: 'Eldre', items: older })

  const formatTime = (date: Date) => {
    const d = new Date(date)
    const diff = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)
    if (diff < 1) return d.toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' })
    if (diff < 7) return d.toLocaleDateString('no-NO', { weekday: 'long' })
    return d.toLocaleDateString('no-NO', { day: '2-digit', month: '2-digit' })
  }

  const getPreview = (c: Conversation) => {
    const lastMsg = [...c.messages].reverse().find(m => m.role === 'assistant' || m.role === 'agent')
    return lastMsg?.content?.slice(0, 80) || ''
  }

  const handleNewChat = () => {
    onNewChat()
    onClose()
  }

  const handleSelect = (id: string) => {
    onSelectConversation(id)
    onClose()
  }

  return (
    <div className="search-modal-overlay" onClick={onClose}>
      <div className="search-modal" onClick={e => e.stopPropagation()}>
        {/* Search input */}
        <div className="search-modal-input-row">
          <Search size={18} className="search-modal-icon" />
          <input
            ref={inputRef}
            className="search-modal-input"
            placeholder="Søk i oppgaver..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <button className="search-modal-close" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="search-modal-divider" />

        {/* New task button */}
        <div className="search-modal-results">
          <button className="search-modal-new-task" onClick={handleNewChat}>
            <div className="search-modal-new-icon">
              <Plus size={16} />
            </div>
            <span>Ny oppgave</span>
          </button>

          {/* Grouped conversations */}
          {groups.map(group => (
            <div key={group.label}>
              <div className="search-modal-group-label">{group.label}</div>
              {group.items.map(c => (
                <button
                  key={c.id}
                  className="search-modal-item"
                  onClick={() => handleSelect(c.id)}
                >
                  <div className="search-modal-item-icon">
                    {c.type === 'agent' ? <Bot size={14} /> : <MessageSquare size={14} />}
                  </div>
                  <div className="search-modal-item-content">
                    <div className="search-modal-item-title">{c.title}</div>
                    {getPreview(c) && (
                      <div className="search-modal-item-preview">{getPreview(c)}</div>
                    )}
                  </div>
                  <div className="search-modal-item-time">{formatTime(c.updatedAt)}</div>
                </button>
              ))}
            </div>
          ))}

          {filtered.length === 0 && query && (
            <div className="search-modal-empty">
              Ingen resultater for "{query}"
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
