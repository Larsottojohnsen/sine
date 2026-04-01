import { useState, useEffect } from 'react'
import { X, Pencil, Check } from 'lucide-react'
import type { Conversation } from '@/types'

interface TaskDetailsModalProps {
  conversation: Conversation
  language: 'no' | 'en'
  onClose: () => void
  onRename: (newTitle: string) => void
}

const T = {
  no: {
    title: 'Oppgavedetaljer',
    createFrom: 'Opprettet fra',
    rateTask: 'Vurder denne oppgaven',
    credits: 'Antall kreditter',
    createdAt: 'Opprettet',
    save: 'Lagre',
    cancel: 'Avbryt',
    agentMode: 'Agentmodus',
    chatMode: 'Chat',
    creditsUnit: 'kreditter',
  },
  en: {
    title: 'Task details',
    createFrom: 'Created from',
    rateTask: 'Rate this task',
    credits: 'Credits count',
    createdAt: 'Created at',
    save: 'Save',
    cancel: 'Cancel',
    agentMode: 'Agent mode',
    chatMode: 'Chat',
    creditsUnit: 'credits',
  },
}

function formatDate(d: Date, lang: 'no' | 'en'): string {
  return d.toLocaleString(lang === 'no' ? 'nb-NO' : 'en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export function TaskDetailsModal({ conversation, language, onClose, onRename }: TaskDetailsModalProps) {
  const t = T[language]
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState(conversation.title)
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)

  // Close on backdrop click or Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const handleSaveTitle = () => {
    if (titleDraft.trim()) onRename(titleDraft.trim())
    setEditingTitle(false)
  }

  const modeLabel = conversation.type === 'agent' ? t.agentMode : t.chatMode
  const credits = conversation.creditsUsed ?? 0

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 99999,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(3px)',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: 'var(--td-bg, #1E1E1E)',
        border: '1px solid var(--td-border, #2E2E2E)',
        borderRadius: 14,
        width: 400,
        maxWidth: '92vw',
        padding: '20px 20px 24px',
        position: 'relative',
        boxShadow: '0 16px 48px rgba(0,0,0,0.4)',
      }}>
        {/* Close */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 14, right: 14,
            background: 'none', border: 'none',
            color: '#5A5A5A', cursor: 'pointer', padding: 4, borderRadius: 6,
          }}
          onMouseEnter={e => (e.currentTarget.style.color = '#A0A0A0')}
          onMouseLeave={e => (e.currentTarget.style.color = '#5A5A5A')}
        >
          <X size={16} />
        </button>

        {/* Title row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18, paddingRight: 28 }}>
          {editingTitle ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
              <input
                autoFocus
                value={titleDraft}
                onChange={e => setTitleDraft(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSaveTitle(); if (e.key === 'Escape') setEditingTitle(false) }}
                style={{
                  flex: 1, background: 'var(--td-input, #252525)',
                  border: '1px solid #3A3A3A', borderRadius: 7,
                  color: 'var(--td-text, #E5E5E5)', fontSize: 14, fontWeight: 600,
                  padding: '5px 10px', fontFamily: 'inherit', outline: 'none',
                }}
              />
              <button onClick={handleSaveTitle} style={{ background: 'none', border: 'none', color: '#1A93FE', cursor: 'pointer', padding: 2 }}>
                <Check size={15} />
              </button>
            </div>
          ) : (
            <>
              <span style={{
                fontSize: 14, fontWeight: 700,
                color: 'var(--td-text, #E5E5E5)',
                flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {conversation.title}
              </span>
              <button
                onClick={() => { setTitleDraft(conversation.title); setEditingTitle(true) }}
                style={{ background: 'none', border: 'none', color: '#5A5A5A', cursor: 'pointer', padding: 2, borderRadius: 5, flexShrink: 0 }}
                onMouseEnter={e => (e.currentTarget.style.color = '#A0A0A0')}
                onMouseLeave={e => (e.currentTarget.style.color = '#5A5A5A')}
              >
                <Pencil size={13} />
              </button>
            </>
          )}
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'var(--td-border, #2E2E2E)', marginBottom: 16 }} />

        {/* Create from */}
        <Row label={t.createFrom}>
          <span style={{ fontSize: 13, color: '#1A93FE', fontWeight: 500 }}>{modeLabel}</span>
        </Row>

        {/* Rate this task */}
        <Row label={t.rateTask}>
          <div style={{ display: 'flex', gap: 4 }}>
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                style={{
                  background: 'none', border: 'none', padding: 2, cursor: 'pointer',
                  color: star <= (hoverRating || rating) ? '#F59E0B' : '#3A3A3A',
                  transition: 'color 0.1s',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill={star <= (hoverRating || rating) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </button>
            ))}
          </div>
        </Row>

        {/* Divider */}
        <div style={{ height: 1, background: 'var(--td-border, #2E2E2E)', margin: '12px 0' }} />

        {/* Credits */}
        <Row label={t.credits}>
          <span style={{ fontSize: 13, color: 'var(--td-text-muted, #7A7A7A)', fontWeight: 500 }}>
            {credits.toLocaleString()} {t.creditsUnit}
          </span>
        </Row>

        {/* Created at */}
        <Row label={t.createdAt}>
          <span style={{ fontSize: 13, color: 'var(--td-text-muted, #7A7A7A)' }}>
            {formatDate(conversation.createdAt, language)}
          </span>
        </Row>
      </div>
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 0' }}>
      <span style={{ fontSize: 12, color: 'var(--td-text-muted, #7A7A7A)', fontWeight: 500 }}>{label}</span>
      {children}
    </div>
  )
}
