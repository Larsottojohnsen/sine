import { useState, useRef, useEffect } from 'react'
import {
  Palette, User, Settings, Home, HelpCircle,
  BookOpen, LogOut, ArrowLeftRight, ChevronRight, Sparkles
} from 'lucide-react'

interface UserAvatarDropdownProps {
  onOpenSettings?: () => void
}

export function UserAvatarDropdown({ onOpenSettings }: UserAvatarDropdownProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Avatar-knapp */}
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #1A93FE, #6366F1)',
          border: '2px solid transparent',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: 13,
          fontWeight: 600,
          transition: 'border-color 0.15s',
          outline: 'none',
          position: 'relative',
        }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = '#1A93FE')}
        onMouseLeave={e => (e.currentTarget.style.borderColor = 'transparent')}
        title="Profil"
      >
        LJ
        {/* Online-indikator */}
        <span style={{
          position: 'absolute',
          bottom: -1,
          right: -1,
          width: 9,
          height: 9,
          borderRadius: '50%',
          background: '#22C55E',
          border: '2px solid #141414',
        }} />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: 260,
            background: '#1C1C1C',
            border: '1px solid #2A2A2A',
            borderRadius: 12,
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            zIndex: 1000,
            overflow: 'hidden',
            animation: 'fadeInDown 0.15s ease',
          }}
        >
          {/* Bruker-info */}
          <div style={{
            padding: '14px 16px 12px',
            borderBottom: '1px solid #252525',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #1A93FE, #6366F1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 15,
              fontWeight: 700,
              color: 'white',
              flexShrink: 0,
              position: 'relative',
            }}>
              LJ
              <button style={{
                position: 'absolute',
                bottom: -2,
                right: -2,
                width: 16,
                height: 16,
                borderRadius: '50%',
                background: '#252525',
                border: '1px solid #3A3A3A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}>
                <span style={{ fontSize: 9, color: '#9A9A9A' }}>+</span>
              </button>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#E5E5E5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                Lars Johnsen
              </div>
              <div style={{ fontSize: 11, color: '#6B7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                lars@loddo.no
              </div>
            </div>
            <button style={{
              background: 'transparent',
              border: 'none',
              color: '#6B7280',
              cursor: 'pointer',
              padding: 4,
              borderRadius: 6,
            }}>
              <ArrowLeftRight size={13} />
            </button>
          </div>

          {/* Pro-seksjon */}
          <div style={{
            margin: '8px 10px',
            padding: '10px 12px',
            background: '#252525',
            borderRadius: 8,
            border: '1px solid #2E2E2E',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#E5E5E5' }}>Sine Pro</span>
              <button style={{
                padding: '3px 10px',
                borderRadius: 20,
                background: '#E5E5E5',
                color: '#141414',
                fontSize: 11,
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
              }}>
                Legg til kreditter
              </button>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Sparkles size={13} color="#F59E0B" />
                <span style={{ fontSize: 12, color: '#9A9A9A' }}>Kreditter</span>
                <span style={{ fontSize: 10, color: '#6B7280', background: '#2A2A2A', borderRadius: 4, padding: '1px 5px' }}>?</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#E5E5E5' }}>1 000</span>
                <ChevronRight size={12} color="#6B7280" />
              </div>
            </div>
            <div style={{
              marginTop: 8,
              paddingTop: 8,
              borderTop: '1px solid #2E2E2E',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
            }}>
              <span style={{ fontSize: 11, color: '#6B7280' }}>Utforsk hva som er i Sine Pro</span>
              <ChevronRight size={11} color="#6B7280" />
            </div>
          </div>

          {/* Meny-elementer */}
          <div style={{ padding: '4px 6px 6px' }}>
            {[
              { icon: <Palette size={15} />, label: 'Personalisering' },
              { icon: <User size={15} />, label: 'Konto' },
              { icon: <Settings size={15} />, label: 'Innstillinger', onClick: onOpenSettings },
            ].map((item, i) => (
              <button
                key={i}
                onClick={() => { item.onClick?.(); setOpen(false) }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 10px',
                  borderRadius: 7,
                  background: 'transparent',
                  border: 'none',
                  color: '#C5C5C5',
                  fontSize: 13,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#252525')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <span style={{ color: '#9A9A9A', flexShrink: 0 }}>{item.icon}</span>
                <span style={{ flex: 1 }}>{item.label}</span>
              </button>
            ))}

            <div style={{ height: 1, background: '#252525', margin: '4px 4px' }} />

            {[
              { icon: <Home size={15} />, label: 'Hjemmeside', external: true },
              { icon: <HelpCircle size={15} />, label: 'Få hjelp', external: true },
              { icon: <BookOpen size={15} />, label: 'Dokumentasjon', external: true },
            ].map((item, i) => (
              <button
                key={i}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 10px',
                  borderRadius: 7,
                  background: 'transparent',
                  border: 'none',
                  color: '#C5C5C5',
                  fontSize: 13,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#252525')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <span style={{ color: '#9A9A9A', flexShrink: 0 }}>{item.icon}</span>
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.external && <span style={{ fontSize: 10, color: '#6B7280' }}>↗</span>}
              </button>
            ))}

            <div style={{ height: 1, background: '#252525', margin: '4px 4px' }} />

            <button
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 10px',
                borderRadius: 7,
                background: 'transparent',
                border: 'none',
                color: '#EF4444',
                fontSize: 13,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background 0.1s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.08)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <LogOut size={15} />
              <span>Logg ut</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
