import { useState, useEffect } from 'react'
import {
  X, User, Settings, BarChart2, CreditCard, HelpCircle,
  Calendar, Mail, Database, Globe, Zap, Plug,
  ExternalLink, ChevronDown, Cloud, Palette, Monitor,
  AlertCircle, LogOut
} from 'lucide-react'
import { useApp } from '@/store/AppContext'
import { getTranslations } from '@/i18n'
import { SkillsContent } from './SkillsContent'
import { ConnectorsContent } from './ConnectorsContent'
import { BillingContent as BillingContentExternal } from './BillingContent'
import { useAuth } from '@/hooks/useAuth'
import { useCredits } from '@/hooks/useCredits'

type SettingsTab =
  | 'account' | 'settings' | 'usage' | 'billing'
  | 'scheduled' | 'mail' | 'data' | 'personalization'
  | 'skills' | 'connectors' | 'integrations'

export function SettingsModal() {
  const { settingsOpen, setSettingsOpen, settings, updateSettings, settingsInitialTab, setSettingsInitialTab } = useApp()
  const t = getTranslations(settings.language)
  const [activeTab, setActiveTab] = useState<SettingsTab>('settings')
  const { user } = useAuth()
  const { profile } = useCredits(user?.id ?? null)
  const displayName = user?.name || user?.email?.split('@')[0] || 'Bruker'
  const initial = (user?.name || user?.email || 'U')[0].toUpperCase()
  const isPro = profile?.plan === 'pro'

  useEffect(() => {
    if (settingsOpen && settingsInitialTab) {
      setActiveTab(settingsInitialTab as SettingsTab)
      setSettingsInitialTab(undefined)
    }
  }, [settingsOpen, settingsInitialTab, setSettingsInitialTab])

  if (!settingsOpen) return null

  const tabs: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
    { id: 'account',         label: t.app.account,        icon: <User size={14} /> },
    { id: 'settings',        label: t.app.settings,       icon: <Settings size={14} /> },
    { id: 'usage',           label: t.app.usage,          icon: <BarChart2 size={14} /> },
    { id: 'billing',         label: t.app.billing,        icon: <CreditCard size={14} /> },
    { id: 'scheduled',       label: 'Planlagte oppgaver', icon: <Calendar size={14} /> },
    { id: 'mail',            label: 'E-post Sine',        icon: <Mail size={14} /> },
    { id: 'data',            label: 'Datakontroll',       icon: <Database size={14} /> },
    { id: 'personalization', label: 'Personalisering',    icon: <Palette size={14} /> },
    { id: 'skills',          label: 'Ferdigheter',        icon: <Zap size={14} /> },
    { id: 'connectors',      label: 'Tilkoblinger',       icon: <Plug size={14} /> },
    { id: 'integrations',    label: 'Integrasjoner',      icon: <Globe size={14} /> },
  ]

  return (
    <div
      className="modal-overlay"
      onClick={e => { if (e.target === e.currentTarget) setSettingsOpen(false) }}
    >
      <div className="modal-panel animate-fade-in">
        {/* Close button */}
        <button className="modal-close" onClick={() => setSettingsOpen(false)}>
          <X size={15} />
        </button>

        {/* Left sidebar */}
        <div className="modal-sidebar">
          {/* User header */}
          <div className="modal-sidebar-user">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                background: user?.avatarUrl ? 'transparent' : 'linear-gradient(135deg, #1A93FE, #0066CC)',
                overflow: 'hidden',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 700, color: 'white',
              }}>
                {user?.avatarUrl
                  ? <img src={user.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : initial
                }
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className="modal-sidebar-username" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName}</span>
                  {isPro && (
                    <span style={{ fontSize: 9, fontWeight: 700, color: '#1A93FE', background: 'rgba(26,147,254,0.12)', borderRadius: 4, padding: '1px 5px', flexShrink: 0 }}>PRO</span>
                  )}
                </div>
                <div style={{ fontSize: 10, color: '#5A5A5A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</div>
              </div>
            </div>
            <ChevronDown size={13} style={{ color: '#4A4A4A', flexShrink: 0 }} />
          </div>

          {/* Nav items */}
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`modal-sidebar-item${activeTab === tab.id ? ' active' : ''}`}
            >
              <span style={{ color: activeTab === tab.id ? '#E5E5E5' : '#5A5A5A', flexShrink: 0 }}>
                {tab.icon}
              </span>
              <span>{tab.label}</span>
            </button>
          ))}

          {/* Get help */}
          <div style={{ marginTop: 'auto', paddingTop: 8 }}>
            <button className="modal-sidebar-item">
              <HelpCircle size={14} style={{ color: '#5A5A5A', flexShrink: 0 }} />
              <span>{t.app.getHelp}</span>
              <ExternalLink size={11} style={{ color: '#3A3A3A', marginLeft: 'auto' }} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="modal-content">
          {activeTab === 'settings' && (
            <SettingsContent settings={settings} updateSettings={updateSettings} />
          )}
          {activeTab === 'account' && (
            <AccountContent />
          )}
          {activeTab === 'usage' && (
            <UsageContent />
          )}
          {activeTab === 'billing' && (
            <BillingContentExternal />
          )}
          {activeTab === 'personalization' && (
            <PersonalizationContent />
          )}
          {activeTab === 'skills' && (
            <SkillsContent onNavigateToChat={(prompt) => {
              setSettingsOpen(false)
              // Dispatch custom event to pre-fill chat
              window.dispatchEvent(new CustomEvent('sine:prefill-chat', { detail: { prompt } }))
            }} />
          )}
          {activeTab === 'connectors' && (
            <ConnectorsContent />
          )}
          {(activeTab === 'scheduled' || activeTab === 'mail' || activeTab === 'data' ||
            activeTab === 'integrations') && (
            <PlaceholderContent
              title={tabs.find(t => t.id === activeTab)?.label ?? ''}
              description="Denne funksjonen er under utvikling og kommer snart."
            />
          )}
        </div>
      </div>
    </div>
  )
}

function SettingsContent({
  settings,
  updateSettings,
}: {
  settings: { language: 'no' | 'en'; theme: 'dark' | 'light' | 'system' }
  updateSettings: (u: Partial<{ language: 'no' | 'en'; theme: 'dark' | 'light' | 'system' }>) => void
}) {
  const [emailUpdates, setEmailUpdates] = useState(true)
  const [emailTask, setEmailTask] = useState(true)
  const appearance = settings.theme ?? 'dark'
  const [autoApproveCalendar, setAutoApproveCalendar] = useState(false)
  const [pushNotifications, setPushNotifications] = useState(true)
  const effectiveTheme = settings.theme === 'system'
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : settings.theme
  const settingsLogoSrc = effectiveTheme === 'light' ? '/sine/Sine-sort.svg' : '/sine/Sinev6.svg'

  return (
    <div>
      {/* Logo header — Manus style */}
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        paddingTop: 8, paddingBottom: 24, gap: 10,
      }}>
        <img
          src={settingsLogoSrc}
          alt="Sine"
          style={{ width: 120, height: 'auto', opacity: 0.9 }}
        />
        <span style={{
          fontSize: 11, color: '#4A4A4A', letterSpacing: '0.05em',
          fontWeight: 500,
        }}>versjon 1.0</span>
      </div>

      <h2 className="settings-title">Innstillinger</h2>

      {/* General section */}
      <div className="settings-section">
        <p className="settings-section-label">Generelt</p>

        {/* Language */}
        <div className="settings-row">
          <div>
            <div className="settings-row-label">Språk</div>
          </div>
          <div style={{ position: 'relative' }}>
            <select
              value={settings.language}
              onChange={e => updateSettings({ language: e.target.value as 'no' | 'en' })}
              className="settings-select"
              style={{ paddingRight: 32, appearance: 'none' as const }}
            >
              <option value="no">Norsk</option>
              <option value="en">English</option>
            </select>
            <ChevronDown size={12} style={{
              position: 'absolute', right: 10, top: '50%',
              transform: 'translateY(-50%)', color: '#5A5A5A', pointerEvents: 'none',
            }} />
          </div>
        </div>

        {/* Appearance */}
        <div style={{ paddingTop: 16 }}>
          <div className="settings-row-label" style={{ marginBottom: 12 }}>Utseende</div>
          <div style={{ display: 'flex', gap: 12 }}>
            {[
              { id: 'light' as const,  label: 'Lys',    icon: <Monitor size={16} /> },
              { id: 'dark' as const,   label: 'Mørk',   icon: <Monitor size={16} /> },
              { id: 'system' as const, label: 'System', icon: <Cloud size={16} /> },
            ].map(theme => (
              <button
                key={theme.id}
                onClick={() => updateSettings({ theme: theme.id })}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 6,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                <div style={{
                  width: 80,
                  height: 56,
                  borderRadius: 10,
                  overflow: 'hidden',
                  border: appearance === theme.id ? '2px solid #1A93FE' : '2px solid #3A3A3A',
                  transition: 'border-color 0.15s',
                  background: theme.id === 'light' ? '#F0F0F0' : '#1A1A1A',
                  display: 'flex',
                  flexDirection: 'column',
                }}>
                  {theme.id === 'system' ? (
                    <div style={{ display: 'flex', height: '100%' }}>
                      <div style={{ width: '50%', background: '#F0F0F0' }} />
                      <div style={{ width: '50%', background: '#1A1A1A' }} />
                    </div>
                  ) : (
                    <div style={{ padding: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div style={{ height: 6, borderRadius: 3, background: theme.id === 'light' ? '#D0D0D0' : '#2E2E2E', width: '75%' }} />
                      <div style={{ height: 4, borderRadius: 2, background: theme.id === 'light' ? '#E0E0E0' : '#252525', width: '50%' }} />
                      <div style={{ height: 4, borderRadius: 2, background: theme.id === 'light' ? '#E0E0E0' : '#252525', width: '65%' }} />
                    </div>
                  )}
                </div>
                <span style={{
                  fontSize: 12,
                  color: appearance === theme.id ? '#1A93FE' : '#5A5A5A',
                  fontWeight: appearance === theme.id ? 500 : 400,
                }}>
                  {theme.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ height: 1, background: '#222222', margin: '8px 0 24px' }} />

      {/* Communication preferences */}
      <div className="settings-section">
        <p className="settings-section-label">Kommunikasjonspreferanser</p>

        <ToggleSetting
          label="Motta produktoppdateringer"
          description="Få tidlig tilgang til nye funksjoner og suksesshistorier for å optimalisere arbeidsflyten din."
          value={emailUpdates}
          onChange={setEmailUpdates}
        />
        <ToggleSetting
          label="E-post når oppgave starter"
          description="Når aktivert sender vi deg en e-post når oppgaven din er ferdig i kø og begynner å behandles."
          value={emailTask}
          onChange={setEmailTask}
        />
        <ToggleSetting
          label="Push-varsler for kalenderoppgaver"
          description="Motta varsler i appen når en agentisk oppgave er i ferd med å kjøre eller er fullført."
          value={pushNotifications}
          onChange={setPushNotifications}
        />
      </div>

      <div style={{ height: 1, background: '#222222', margin: '8px 0 24px' }} />

      {/* Agentic calendar */}
      <div className="settings-section">
        <p className="settings-section-label">Agentisk kalender</p>
        <ToggleSetting
          label="Automatisk godkjenning av kalenderoppgaver"
          description="Når aktivert kan Sine automatisk legge til repeterende oppgaver i kalenderen uten manuell bekreftelse. Anbefales kun for erfarne brukere."
          value={autoApproveCalendar}
          onChange={setAutoApproveCalendar}
        />
      </div>

      <div style={{ height: 1, background: '#222222', margin: '8px 0 24px' }} />

      {/* Cookies */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 14, color: '#E5E5E5' }}>Administrer informasjonskapsler</span>
        <button
          style={{
            padding: '6px 14px',
            borderRadius: 8,
            border: '1px solid #2E2E2E',
            background: 'transparent',
            color: '#9A9A9A',
            fontSize: 13,
            cursor: 'pointer',
            fontFamily: 'inherit',
            transition: 'background 0.1s, color 0.1s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#252525'; e.currentTarget.style.color = '#E5E5E5' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9A9A9A' }}
        >
          Administrer
        </button>
      </div>
    </div>
  )
}

function ToggleSetting({
  label, description, value, onChange,
}: {
  label: string
  description: string
  value: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="settings-row">
      <div style={{ flex: 1, paddingRight: 24 }}>
        <div className="settings-row-label">{label}</div>
        <div className="settings-row-desc">{description}</div>
      </div>
      <label className="toggle">
        <input type="checkbox" checked={value} onChange={e => onChange(e.target.checked)} />
        <span className="toggle-slider" />
      </label>
    </div>
  )
}

function AccountContent() {
  const { user, signOut } = useAuth()
  const { profile } = useCredits(user?.id ?? null)
  const displayName = user?.name || user?.email?.split('@')[0] || 'Bruker'
  const initial = (user?.name || user?.email || 'U')[0].toUpperCase()
  const joinDate = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('no-NO', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'Ukjent'

  return (
    <div>
      <h2 className="settings-title">Konto</h2>

      {/* Profile card */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px',
        background: '#222222', borderRadius: 12, border: '1px solid #2A2A2A', marginBottom: 20,
      }}>
        <div style={{
          width: 52, height: 52, borderRadius: '50%', flexShrink: 0,
          background: user?.avatarUrl ? 'transparent' : 'linear-gradient(135deg, #1A93FE, #0055CC)',
          overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {user?.avatarUrl
            ? <img src={user.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <span style={{ fontSize: 20, fontWeight: 700, color: 'white' }}>{initial}</span>
          }
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#E5E5E5' }}>{displayName}</div>
          <div style={{ fontSize: 12, color: '#5A5A5A', marginTop: 2 }}>{user?.email}</div>
          <div style={{ fontSize: 11, color: '#3A3A3A', marginTop: 4 }}>Medlem siden {joinDate}</div>
        </div>
      </div>

      <div className="settings-section">
        <p className="settings-section-label">Profilinformasjon</p>
        <div className="settings-row">
          <div>
            <div className="settings-row-label">E-postadresse</div>
            <div className="settings-row-desc">{user?.email || 'Ikke tilgjengelig'}</div>
          </div>
          <button style={{
            padding: '6px 14px', borderRadius: 8, border: '1px solid #2E2E2E',
            background: 'transparent', color: '#9A9A9A', fontSize: 13,
            cursor: 'pointer', fontFamily: 'inherit',
          }}>
            Endre
          </button>
        </div>
        <div className="settings-row">
          <div>
            <div className="settings-row-label">Passord</div>
            <div className="settings-row-desc">Endre kontopassordet ditt</div>
          </div>
          <button style={{
            padding: '6px 14px', borderRadius: 8, border: '1px solid #2E2E2E',
            background: 'transparent', color: '#9A9A9A', fontSize: 13,
            cursor: 'pointer', fontFamily: 'inherit',
          }}>
            Endre
          </button>
        </div>
      </div>

      <div style={{ height: 1, background: '#222222', margin: '8px 0 24px' }} />

      <div className="settings-section">
        <p className="settings-section-label">Økt</p>
        <div className="settings-row">
          <div>
            <div className="settings-row-label">Logg ut</div>
            <div className="settings-row-desc">Logg ut av Sine på denne enheten</div>
          </div>
          <button
            onClick={() => signOut()}
            style={{
              padding: '6px 14px', borderRadius: 8, border: '1px solid #2E2E2E',
              background: 'transparent', color: '#9A9A9A', fontSize: 13,
              cursor: 'pointer', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            <LogOut size={13} />
            Logg ut
          </button>
        </div>
      </div>

      <div style={{ height: 1, background: '#222222', margin: '8px 0 24px' }} />

      <div className="settings-section">
        <p className="settings-section-label">Faresone</p>
        <div className="settings-row">
          <div>
            <div className="settings-row-label" style={{ color: '#ef4444' }}>Slett konto</div>
            <div className="settings-row-desc">Permanent sletting av konto og alle data.</div>
          </div>
          <button style={{
            padding: '6px 14px', borderRadius: 8, border: '1px solid #3A1A1A',
            background: 'transparent', color: '#ef4444', fontSize: 13,
            cursor: 'pointer', fontFamily: 'inherit',
          }}>
            Slett
          </button>
        </div>
      </div>
    </div>
  )
}

function UsageContent() {
  const { user } = useAuth()
  const { profile, transactions } = useCredits(user?.id ?? null)
  const totalCredits = profile?.plan === 'pro' ? profile.credits : 1000
  const usedCredits = profile ? (profile.plan === 'free' ? 1000 - profile.credits : 0) : 0
  const usedPct = totalCredits > 0 ? Math.min(100, (usedCredits / totalCredits) * 100) : 0

  return (
    <div>
      <h2 className="settings-title">Bruk</h2>

      {/* Credit balance card */}
      <div style={{
        padding: 20, borderRadius: 12, background: '#222222',
        border: '1px solid #2A2A2A', marginBottom: 16,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 13, color: '#9A9A9A', marginBottom: 4 }}>Tilgjengelige kreditter</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#E5E5E5' }}>
              {(profile?.credits ?? 0).toLocaleString('no-NO')}
            </div>
          </div>
          <div style={{
            padding: '4px 10px', borderRadius: 20,
            background: profile?.plan === 'pro' ? 'rgba(26,147,254,0.15)' : '#1A1A1A',
            border: `1px solid ${profile?.plan === 'pro' ? '#1A93FE' : '#2E2E2E'}`,
            fontSize: 11, color: profile?.plan === 'pro' ? '#1A93FE' : '#9A9A9A',
            fontWeight: 600,
          }}>
            {profile?.plan === 'pro' ? 'Pro' : 'Gratis'}
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 12, color: '#5A5A5A' }}>Brukt denne måneden</span>
          <span style={{ fontSize: 12, color: '#9A9A9A' }}>{usedCredits.toLocaleString('no-NO')} / {totalCredits.toLocaleString('no-NO')}</span>
        </div>
        <div style={{ height: 6, borderRadius: 3, background: '#2E2E2E', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${usedPct}%`, background: usedPct > 80 ? '#ef4444' : '#1A93FE', borderRadius: 3, transition: 'width 0.5s' }} />
        </div>
        {usedPct > 80 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
            <AlertCircle size={12} style={{ color: '#ef4444' }} />
            <span style={{ fontSize: 11, color: '#ef4444' }}>Du nærmer deg grensen for denne måneden</span>
          </div>
        )}
      </div>

      {/* Transaction history */}
      <div className="settings-section">
        <p className="settings-section-label">Transaksjonshistorikk</p>
        {transactions.length === 0 ? (
          <div style={{ padding: '24px 0', textAlign: 'center', color: '#5A5A5A', fontSize: 13 }}>
            Ingen transaksjoner ennå
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {transactions.map(tx => (
              <div key={tx.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 14px', borderRadius: 8, background: '#222222',
                border: '1px solid #2A2A2A',
              }}>
                <div>
                  <div style={{ fontSize: 13, color: '#E5E5E5' }}>{tx.description || tx.type}</div>
                  <div style={{ fontSize: 11, color: '#5A5A5A', marginTop: 2 }}>
                    {new Date(tx.created_at).toLocaleDateString('no-NO', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                </div>
                <div style={{
                  fontSize: 14, fontWeight: 600,
                  color: tx.amount > 0 ? '#22c55e' : '#ef4444',
                }}>
                  {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString('no-NO')}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function PersonalizationContent() {
  const { settings, updateSettings } = useApp()
  const [name, setName] = useState(settings.userName ?? '')
  const [instructions, setInstructions] = useState(settings.customInstructions ?? '')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setName(settings.userName ?? '')
    setInstructions(settings.customInstructions ?? '')
  }, [settings.userName, settings.customInstructions])

  const handleSave = () => {
    updateSettings({ userName: name.trim(), customInstructions: instructions.trim() })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div>
      <h2 className="settings-title">Personalisering</h2>
      <div className="settings-section">
        <p className="settings-section-label">Om deg</p>
        <div className="settings-row">
          <div>
            <div className="settings-row-label">Navn</div>
            <div className="settings-row-desc">Brukes i samtaler med Sine</div>
          </div>
          <input
            type="text"
            placeholder="Ditt navn"
            value={name}
            onChange={e => setName(e.target.value)}
            style={{
              background: '#252525', border: '1px solid #2E2E2E', borderRadius: 8,
              color: '#E5E5E5', fontSize: 13, padding: '6px 12px',
              outline: 'none', fontFamily: 'inherit', width: 160,
            }}
          />
        </div>
        <div style={{ paddingTop: 16 }}>
          <div className="settings-row-label" style={{ marginBottom: 8 }}>Egendefinerte instruksjoner</div>
          <div className="settings-row-desc" style={{ marginBottom: 10 }}>
            Gi Sine spesifikke instruksjoner om hvordan den skal svare deg.
          </div>
          <textarea
            placeholder="F.eks. Svar alltid på norsk og vær kortfattet..."
            rows={5}
            value={instructions}
            onChange={e => setInstructions(e.target.value)}
            style={{
              width: '100%', background: '#252525', border: '1px solid #2E2E2E',
              borderRadius: 8, color: '#E5E5E5', fontSize: 13, padding: '10px 12px',
              outline: 'none', fontFamily: 'inherit', resize: 'vertical',
              lineHeight: 1.6, boxSizing: 'border-box',
            }}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
          <button
            onClick={handleSave}
            style={{
              padding: '8px 20px', borderRadius: 8, border: 'none',
              background: saved ? '#22c55e' : '#E5E5E5',
              color: saved ? '#fff' : '#111',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
              fontFamily: 'inherit', transition: 'background 0.2s',
            }}
          >
            {saved ? 'Lagret ✓' : 'Lagre'}
          </button>
        </div>
      </div>
    </div>
  )
}

function PlaceholderContent({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <h2 className="settings-title">{title}</h2>
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: '60px 0', gap: 12,
      }}>
        <div style={{
          width: 48, height: 48, borderRadius: 12, background: '#222222',
          border: '1px solid #2A2A2A', display: 'flex', alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Zap size={20} style={{ color: '#3A3A3A' }} />
        </div>
        <p style={{ fontSize: 14, color: '#5A5A5A', textAlign: 'center' }}>{description}</p>
      </div>
    </div>
  )
}
