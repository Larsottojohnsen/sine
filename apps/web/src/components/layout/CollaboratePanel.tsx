import { useState, useRef, useEffect } from 'react'
import { HelpCircle } from 'lucide-react'

interface CollaboratePanelProps {
  open: boolean
  onClose: () => void
  anchorRef?: React.RefObject<HTMLElement>
}

export function CollaboratePanel({ open, onClose, anchorRef }: CollaboratePanelProps) {
  const [email, setEmail] = useState('')
  const [invited, setInvited] = useState<string[]>([])
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        ref.current && !ref.current.contains(e.target as Node) &&
        !(anchorRef?.current?.contains(e.target as Node))
      ) {
        onClose()
      }
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open, onClose, anchorRef])

  if (!open) return null

  const handleInvite = () => {
    if (!email.trim() || !email.includes('@')) return
    setInvited(prev => [...prev, email.trim()])
    setEmail('')
  }

  return (
    <div
      ref={ref}
      style={{
        position: 'fixed',
        top: 48,
        right: 16,
        width: 320,
        background: '#1C1C1C',
        border: '1px solid #2A2A2A',
        borderRadius: 12,
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        zIndex: 1000,
        padding: '16px',
        animation: 'fadeInDown 0.15s ease',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <span style={{ fontSize: 15, fontWeight: 600, color: '#E5E5E5' }}>Samarbeid</span>
        <button
          style={{ background: 'transparent', border: 'none', color: '#6B7280', cursor: 'pointer', padding: 2 }}
          title="Hjelp"
        >
          <HelpCircle size={15} />
        </button>
      </div>

      {/* E-post input + Inviter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleInvite()}
          placeholder="Skriv inn e-postadresse"
          style={{
            flex: 1,
            padding: '8px 12px',
            background: '#252525',
            border: '1px solid #2E2E2E',
            borderRadius: 8,
            color: '#E5E5E5',
            fontSize: 13,
            outline: 'none',
            fontFamily: 'inherit',
          }}
          onFocus={e => (e.currentTarget.style.borderColor = '#1A93FE')}
          onBlur={e => (e.currentTarget.style.borderColor = '#2E2E2E')}
        />
        <button
          onClick={handleInvite}
          style={{
            padding: '8px 14px',
            background: '#2A2A2A',
            border: '1px solid #3A3A3A',
            borderRadius: 8,
            color: '#E5E5E5',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            transition: 'background 0.1s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = '#333')}
          onMouseLeave={e => (e.currentTarget.style.background = '#2A2A2A')}
        >
          Inviter
        </button>
      </div>

      {/* Eksisterende brukere */}
      <div>
        {/* Eier */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0' }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #1A93FE, #6366F1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
            fontWeight: 700,
            color: 'white',
            flexShrink: 0,
          }}>
            LJ
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: '#E5E5E5' }}>Lars Johnsen</div>
            <div style={{ fontSize: 11, color: '#6B7280' }}>lars@loddo.no</div>
          </div>
          <span style={{ fontSize: 11, color: '#6B7280' }}>Eier</span>
        </div>

        {/* Inviterte */}
        {invited.map((e, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0' }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: '#2A2A2A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              color: '#9A9A9A',
              flexShrink: 0,
            }}>
              {e[0].toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, color: '#9A9A9A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e}</div>
            </div>
            <span style={{ fontSize: 11, color: '#F59E0B' }}>Invitert</span>
          </div>
        ))}
      </div>

      {/* Info-tekst */}
      <div style={{
        marginTop: 12,
        paddingTop: 12,
        borderTop: '1px solid #252525',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 6,
      }}>
        <span style={{ fontSize: 14, color: '#6B7280', flexShrink: 0 }}>ⓘ</span>
        <p style={{ fontSize: 11, color: '#6B7280', margin: 0, lineHeight: 1.5 }}>
          Samarbeidspartnere kan sende meldinger i denne oppgaven ved hjelp av dine kreditter
        </p>
      </div>
    </div>
  )
}
