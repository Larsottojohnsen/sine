import { useEffect } from 'react'
import { X } from 'lucide-react'

interface LogoutConfirmModalProps {
  email: string
  language: 'no' | 'en'
  onConfirm: () => void
  onCancel: () => void
}

const T = {
  no: {
    title: 'Er du sikker på at du vil logge ut?',
    subtitle: (email: string) => `Logg ut av Sine som ${email}?`,
    stay: 'Bli innlogget',
    logout: 'Logg ut',
  },
  en: {
    title: 'Are you sure you want to log out?',
    subtitle: (email: string) => `Log out of Sine as ${email}?`,
    stay: 'Stay logged in',
    logout: 'Log out',
  },
}

export function LogoutConfirmModal({ email, language, onConfirm, onCancel }: LogoutConfirmModalProps) {
  const t = T[language]

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
      if (e.key === 'Enter') onConfirm()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onCancel, onConfirm])

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 999999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={e => { if (e.target === e.currentTarget) onCancel() }}
    >
      <div
        style={{
          background: 'var(--logout-bg, #1E1E1E)',
          border: '1px solid var(--logout-border, #2E2E2E)',
          borderRadius: 16,
          padding: '24px 24px 20px',
          width: 400,
          maxWidth: '92vw',
          position: 'relative',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        }}
      >
        {/* Close button */}
        <button
          onClick={onCancel}
          style={{
            position: 'absolute', top: 14, right: 14,
            background: 'none', border: 'none',
            color: 'var(--logout-muted, #5A5A5A)',
            cursor: 'pointer', padding: 4, borderRadius: 6,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--logout-text, #C0C0C0)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--logout-muted, #5A5A5A)')}
        >
          <X size={16} />
        </button>

        {/* Title */}
        <h2 style={{
          margin: '0 28px 6px 0',
          fontSize: 16, fontWeight: 700,
          color: 'var(--logout-text, #E5E5E5)',
          lineHeight: 1.3,
        }}>
          {t.title}
        </h2>

        {/* Subtitle */}
        <p style={{
          margin: '0 0 24px',
          fontSize: 13,
          color: 'var(--logout-muted, #7A7A7A)',
          lineHeight: 1.5,
        }}>
          {t.subtitle(email)}
        </p>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '9px 20px', borderRadius: 10,
              background: 'transparent',
              border: '1px solid var(--logout-btn-border, #3A3A3A)',
              color: 'var(--logout-text, #D0D0D0)',
              fontSize: 13, fontWeight: 500,
              cursor: 'pointer', fontFamily: 'inherit',
              transition: 'background 0.15s, border-color 0.15s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'var(--logout-btn-hover, #2A2A2A)'
              e.currentTarget.style.borderColor = 'var(--logout-btn-border-hover, #4A4A4A)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.borderColor = 'var(--logout-btn-border, #3A3A3A)'
            }}
          >
            {t.stay}
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: '9px 20px', borderRadius: 10,
              background: 'var(--logout-confirm-bg, #FFFFFF)',
              border: '1px solid transparent',
              color: 'var(--logout-confirm-text, #111111)',
              fontSize: 13, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit',
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            {t.logout}
          </button>
        </div>
      </div>
    </div>
  )
}
