import { useState, useRef, useEffect } from 'react'
import {
  LogOut, HelpCircle, ExternalLink,
  Sparkles, ChevronRight, ChevronDown,
  LayoutGrid, User, Settings, Home, BookOpen,
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useCredits } from '../../hooks/useCredits'
import { useApp } from '../../store/AppContext'
import { LogoutConfirmModal } from './LogoutConfirmModal'

interface Props {
  onOpenSettings: (tab?: string) => void
}

export function UserAvatarDropdown({ onOpenSettings }: Props) {
  const [open, setOpen] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const { user, signOut } = useAuth()
  const { profile } = useCredits(user?.id ?? null)
  const { settings } = useApp()

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const initial = (user?.name || user?.email || 'U')[0].toUpperCase()
  const displayName = user?.name || user?.email?.split('@')[0] || 'Bruker'
  const credits = profile?.credits ?? 0
  const plan = profile?.plan ?? 'free'
  const planLabel = plan === 'pro' ? 'Sine Pro' : 'Sine Free'

  const navigate = (tab: string) => {
    onOpenSettings(tab)
    setOpen(false)
  }

  return (
    <div ref={ref} className="uad-root">
      {/* Avatar trigger button */}
      <button
        className={`uad-trigger${open ? ' uad-trigger--open' : ''}`}
        onClick={() => setOpen(v => !v)}
        title={displayName}
      >
        <div className="uad-avatar uad-avatar--sm">
          {user?.avatarUrl
            ? <img src={user.avatarUrl} alt={displayName} />
            : <span>{initial}</span>
          }
          <span className="uad-avatar-badge">
            <span className="uad-avatar-badge-dot" />
          </span>
        </div>
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="uad-panel">

          {/* ── User header ─────────────────────────────────────── */}
          <div className="uad-header">
            <div className="uad-header-left">
              <div className="uad-avatar uad-avatar--lg">
                {user?.avatarUrl
                  ? <img src={user.avatarUrl} alt={displayName} />
                  : <span>{initial}</span>
                }
                <span className="uad-avatar-badge">
                  <span className="uad-avatar-badge-dot" />
                </span>
              </div>
              <div className="uad-header-info">
                <span className="uad-header-name">{displayName}</span>
                <span className="uad-header-email">{user?.email}</span>
              </div>
            </div>
            <button className="uad-header-chevron" onClick={() => setOpen(false)}>
              <ChevronDown size={14} />
            </button>
          </div>

          {/* ── Plan card ───────────────────────────────────────── */}
          <div className="uad-plan-card">
            <div className="uad-plan-card-top">
              <span className="uad-plan-name">{planLabel}</span>
              <button className="uad-add-credits-btn" onClick={() => navigate('billing')}>
                Legg til kreditter
              </button>
            </div>
            <div className="uad-plan-divider" />
            {/* Credits row */}
            <button className="uad-credits-row" onClick={() => navigate('billing')}>
              <div className="uad-credits-left">
                <Sparkles size={13} className="uad-credits-icon" />
                <span className="uad-credits-label">Kreditter</span>
                <button className="uad-credits-help" tabIndex={-1} title="Hva er kreditter?">?</button>
              </div>
              <div className="uad-credits-right">
                <span className="uad-credits-value">{credits.toLocaleString('no')}</span>
                <ChevronRight size={12} className="uad-credits-chevron" />
              </div>
            </button>
            {/* Explore plan row */}
            <button className="uad-explore-row" onClick={() => navigate('billing')}>
              <span className="uad-explore-text">
                {plan === 'free' ? 'Utforsk hva som er i Sine Pro' : 'Administrer abonnement'}
              </span>
              <ChevronRight size={12} className="uad-explore-chevron" />
            </button>
          </div>

          {/* ── Main menu items ──────────────────────────────────── */}
          <div className="uad-section">
            <UadItem
              icon={<LayoutGrid size={15} />}
              label="Personalisering"
              onClick={() => navigate('personalization')}
            />
            <UadItem
              icon={<User size={15} />}
              label="Konto"
              onClick={() => navigate('account')}
            />
            <UadItem
              icon={<Settings size={15} />}
              label="Innstillinger"
              onClick={() => navigate('settings')}
            />
          </div>

          <div className="uad-divider" />

          {/* ── External links ───────────────────────────────────── */}
          <div className="uad-section">
            <UadItem
              icon={<Home size={15} />}
              label="Hjemmeside"
              external
              onClick={() => { window.open('https://sine.no', '_blank'); setOpen(false) }}
            />
            <UadItem
              icon={<HelpCircle size={15} />}
              label="Få hjelp"
              external
              onClick={() => { window.open('mailto:support@sine.no', '_blank'); setOpen(false) }}
            />
            <UadItem
              icon={<BookOpen size={15} />}
              label="Dokumentasjon"
              external
              onClick={() => { window.open('https://sine.no', '_blank'); setOpen(false) }}
            />
          </div>

          <div className="uad-divider" />

          {/* ── Sign out ─────────────────────────────────────────── */}
          <div className="uad-section uad-section--last">
            <button
              className="uad-signout-btn"
              onClick={() => { setOpen(false); setShowLogoutConfirm(true) }}
            >
              <LogOut size={15} />
              <span>{settings.language === 'no' ? 'Logg ut' : 'Log out'}</span>
            </button>
          </div>

        </div>
      )}

      {/* Logout confirmation modal */}
      {showLogoutConfirm && (
        <LogoutConfirmModal
          email={user?.email ?? ''}
          language={settings.language}
          onConfirm={async () => { setShowLogoutConfirm(false); await signOut() }}
          onCancel={() => setShowLogoutConfirm(false)}
        />
      )}
    </div>
  )
}

function UadItem({
  icon, label, external, onClick,
}: {
  icon: React.ReactNode
  label: string
  external?: boolean
  onClick?: () => void
}) {
  return (
    <button className="uad-item" onClick={onClick}>
      <span className="uad-item-icon">{icon}</span>
      <span className="uad-item-label">{label}</span>
      {external && <ExternalLink size={12} className="uad-item-external" />}
    </button>
  )
}
