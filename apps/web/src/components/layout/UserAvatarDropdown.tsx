import { useState, useRef, useEffect } from 'react'
import {
  Settings, LogOut, HelpCircle, ExternalLink,
  Zap, CreditCard, Calendar, Mail, Database,
  Palette, Globe, Share2, ChevronRight,
  Plug, BookOpen, BarChart2, Copy, Check,
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useCredits } from '../../hooks/useCredits'

interface Props {
  onOpenSettings: (tab?: string) => void
}

export function UserAvatarDropdown({ onOpenSettings }: Props) {
  const [open, setOpen] = useState(false)
  const [showReferral, setShowReferral] = useState(false)
  const [copied, setCopied] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const { user, signOut } = useAuth()
  const { profile } = useCredits(user?.id ?? null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setShowReferral(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const initial = (user?.name || user?.email || 'U')[0].toUpperCase()
  const displayName = user?.name || user?.email?.split('@')[0] || 'Bruker'
  const credits = profile?.credits ?? 1000
  const plan = profile?.plan ?? 'free'
  const referralCode = profile?.referral_code ?? 'SINE0000'
  const referralUrl = `https://larsottojohnsen.github.io/sine/?ref=${referralCode}`

  const handleCopyReferral = () => {
    navigator.clipboard.writeText(referralUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const navigate = (tab: string) => {
    onOpenSettings(tab)
    setOpen(false)
    setShowReferral(false)
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Avatar button */}
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: 30, height: 30, borderRadius: '50%',
          background: user?.avatarUrl ? 'transparent' : 'linear-gradient(135deg, #1A93FE, #0055CC)',
          border: open ? '2px solid #1A93FE' : '2px solid transparent',
          cursor: 'pointer', overflow: 'hidden', padding: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'border-color 0.15s', flexShrink: 0,
        }}
        title={displayName}
      >
        {user?.avatarUrl ? (
          <img src={user.avatarUrl} alt={displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <span style={{ fontSize: 12, fontWeight: 700, color: 'white', lineHeight: 1 }}>{initial}</span>
        )}
      </button>

      {/* Main dropdown */}
      {open && !showReferral && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', right: 0,
          width: 260, background: '#1C1C1C', border: '1px solid #2A2A2A',
          borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          zIndex: 1000, overflow: 'hidden', animation: 'fadeInDown 0.15s ease',
        }}>
          {/* User header */}
          <div style={{ padding: '14px 14px 10px', borderBottom: '1px solid #252525' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                background: user?.avatarUrl ? 'transparent' : 'linear-gradient(135deg, #1A93FE, #0055CC)',
                overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {user?.avatarUrl
                  ? <img src={user.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ fontSize: 14, fontWeight: 700, color: 'white' }}>{initial}</span>
                }
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#E5E5E5', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {displayName}
                </div>
                <div style={{ fontSize: 11, color: '#5A5A5A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user?.email}
                </div>
              </div>
            </div>

            {/* Credits row */}
            <button
              onClick={() => navigate('billing')}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '8px 10px', borderRadius: 8, background: '#222222',
                border: '1px solid #2A2A2A', cursor: 'pointer', transition: 'background 0.1s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#272727')}
              onMouseLeave={e => (e.currentTarget.style.background = '#222222')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Zap size={13} style={{ color: '#F59E0B' }} />
                <span style={{ fontSize: 12, color: '#9A9A9A' }}>Kreditter</span>
                {plan === 'pro' && (
                  <span style={{
                    fontSize: 9, fontWeight: 700, color: '#1A93FE',
                    background: 'rgba(26,147,254,0.12)', borderRadius: 4,
                    padding: '1px 5px', textTransform: 'uppercase' as const, letterSpacing: '0.05em',
                  }}>PRO</span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#E5E5E5' }}>{credits.toLocaleString('no')}</span>
                <ChevronRight size={12} style={{ color: '#4A4A4A' }} />
              </div>
            </button>

            {plan === 'free' && (
              <button
                onClick={() => navigate('billing')}
                style={{
                  width: '100%', marginTop: 6, padding: '7px 10px', borderRadius: 8,
                  background: 'linear-gradient(135deg, rgba(26,147,254,0.15), rgba(0,85,204,0.1))',
                  border: '1px solid rgba(26,147,254,0.2)', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(26,147,254,0.2)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'linear-gradient(135deg, rgba(26,147,254,0.15), rgba(0,85,204,0.1))')}
              >
                <span style={{ fontSize: 11, color: '#1A93FE', fontWeight: 500 }}>Oppgrader til Sine Pro</span>
                <ChevronRight size={11} style={{ color: '#1A93FE' }} />
              </button>
            )}
          </div>

          {/* Menu items */}
          <div style={{ padding: '4px 6px' }}>
            {[
              { icon: <Settings size={14} />, label: 'Innstillinger', tab: 'settings' },
              { icon: <BarChart2 size={14} />, label: 'Bruk', tab: 'usage' },
              { icon: <CreditCard size={14} />, label: 'Fakturering', tab: 'billing' },
              { icon: <Calendar size={14} />, label: 'Planlagte oppgaver', tab: 'scheduled' },
              { icon: <Mail size={14} />, label: 'E-post Sine', tab: 'mail' },
              { icon: <Database size={14} />, label: 'Datakontroll', tab: 'data' },
              { icon: <Palette size={14} />, label: 'Personalisering', tab: 'personalization' },
              { icon: <Zap size={14} />, label: 'Ferdigheter', tab: 'skills' },
              { icon: <Plug size={14} />, label: 'Tilkoblinger', tab: 'connectors' },
              { icon: <Globe size={14} />, label: 'Integrasjoner', tab: 'integrations' },
            ].map((item, i) => (
              <MenuItem key={i} icon={item.icon} label={item.label} onClick={() => navigate(item.tab)} />
            ))}
          </div>

          <div style={{ height: 1, background: '#252525', margin: '2px 6px' }} />

          <div style={{ padding: '4px 6px' }}>
            <MenuItem
              icon={<Share2 size={14} />}
              label="Del Sine med en venn"
              badge="+ 100 kreditter"
              onClick={() => setShowReferral(true)}
            />
            <MenuItem
              icon={<HelpCircle size={14} />}
              label="Få hjelp"
              external
              onClick={() => window.open('mailto:support@sine.no', '_blank')}
            />
            <MenuItem
              icon={<BookOpen size={14} />}
              label="Dokumentasjon"
              external
              onClick={() => window.open('https://larsottojohnsen.github.io/sine/', '_blank')}
            />
          </div>

          <div style={{ height: 1, background: '#252525', margin: '2px 6px' }} />

          <div style={{ padding: '4px 6px 6px' }}>
            <button
              onClick={async () => { await signOut(); setOpen(false) }}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 10px', borderRadius: 7, background: 'transparent',
                border: 'none', color: '#EF4444', fontSize: 13, cursor: 'pointer',
                textAlign: 'left', transition: 'background 0.1s', fontFamily: 'inherit',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.08)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <LogOut size={14} />
              <span>Logg ut</span>
            </button>
          </div>
        </div>
      )}

      {/* Referral panel */}
      {open && showReferral && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', right: 0,
          width: 280, background: '#1C1C1C', border: '1px solid #2A2A2A',
          borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          zIndex: 1000, overflow: 'hidden', animation: 'fadeInDown 0.15s ease',
        }}>
          <div style={{ padding: '12px 14px', borderBottom: '1px solid #252525', display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={() => setShowReferral(false)}
              style={{ background: 'none', border: 'none', color: '#5A5A5A', cursor: 'pointer', padding: 0, display: 'flex' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 5l-7 7 7 7"/>
              </svg>
            </button>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#E5E5E5' }}>Del Sine med en venn</span>
          </div>

          <div style={{ padding: 14 }}>
            <div style={{
              padding: '12px 14px', borderRadius: 10,
              background: 'linear-gradient(135deg, rgba(26,147,254,0.12), rgba(0,85,204,0.08))',
              border: '1px solid rgba(26,147,254,0.2)', marginBottom: 14,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <Zap size={14} style={{ color: '#F59E0B' }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: '#E5E5E5' }}>Begge får 100 kreditter</span>
              </div>
              <p style={{ fontSize: 12, color: '#6B7280', margin: 0, lineHeight: 1.5 }}>
                Del din unike lenke. Når vennen din registrerer seg, får dere begge 100 kreditter.
              </p>
            </div>

            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 11, color: '#5A5A5A', marginBottom: 6, textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>
                Din referral-lenke
              </div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 10px', borderRadius: 8, background: '#222222', border: '1px solid #2A2A2A',
              }}>
                <span style={{ flex: 1, fontSize: 12, color: '#9A9A9A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {referralUrl}
                </span>
                <button
                  onClick={handleCopyReferral}
                  style={{
                    flexShrink: 0, background: copied ? 'rgba(34,197,94,0.15)' : '#2A2A2A',
                    border: 'none', borderRadius: 6, padding: '4px 8px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 4,
                    color: copied ? '#22C55E' : '#9A9A9A', fontSize: 11, transition: 'all 0.2s',
                  }}
                >
                  {copied ? <Check size={12} /> : <Copy size={12} />}
                  {copied ? 'Kopiert!' : 'Kopier'}
                </button>
              </div>
            </div>

            <div style={{ fontSize: 11, color: '#5A5A5A', marginBottom: 6, textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>
              Din kode
            </div>
            <div style={{
              padding: '8px 10px', borderRadius: 8, background: '#222222',
              border: '1px solid #2A2A2A', textAlign: 'center' as const,
              fontSize: 16, fontWeight: 700, color: '#E5E5E5', letterSpacing: '0.1em',
            }}>
              {referralCode}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function MenuItem({
  icon, label, badge, external, onClick,
}: {
  icon: React.ReactNode
  label: string
  badge?: string
  external?: boolean
  onClick?: () => void
}) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 10,
        padding: '7px 10px', borderRadius: 7, background: 'transparent',
        border: 'none', color: '#C5C5C5', fontSize: 13, cursor: 'pointer',
        textAlign: 'left', transition: 'background 0.1s', fontFamily: 'inherit',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = '#252525')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      <span style={{ color: '#5A5A5A', flexShrink: 0 }}>{icon}</span>
      <span style={{ flex: 1 }}>{label}</span>
      {badge && (
        <span style={{
          fontSize: 10, color: '#F59E0B', background: 'rgba(245,158,11,0.1)',
          borderRadius: 4, padding: '1px 6px', fontWeight: 500,
        }}>{badge}</span>
      )}
      {external && <ExternalLink size={11} style={{ color: '#3A3A3A', flexShrink: 0 }} />}
    </button>
  )
}
