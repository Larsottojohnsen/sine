import { useState } from 'react'
import {
  X, User, Settings, BarChart2, CreditCard, HelpCircle,
  Calendar, Mail, Database, Globe, Zap, Plug,
  ExternalLink, ChevronDown, Cloud, Palette, Monitor
} from 'lucide-react'
import { useApp } from '@/store/AppContext'
import { getTranslations } from '@/i18n'

type SettingsTab =
  | 'account' | 'settings' | 'usage' | 'billing'
  | 'scheduled' | 'mail' | 'data' | 'personalization'
  | 'skills' | 'connectors' | 'integrations'

export function SettingsModal() {
  const { settingsOpen, setSettingsOpen, settings, updateSettings } = useApp()
  const t = getTranslations(settings.language)
  const [activeTab, setActiveTab] = useState<SettingsTab>('settings')

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
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: 'linear-gradient(135deg, #1A93FE, #0066CC)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 700, color: 'white', flexShrink: 0,
              }}>
                S
              </div>
              <span className="modal-sidebar-username">Bruker</span>
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
            <BillingContent />
          )}
          {activeTab === 'personalization' && (
            <PersonalizationContent />
          )}
          {(activeTab === 'scheduled' || activeTab === 'mail' || activeTab === 'data' ||
            activeTab === 'skills' || activeTab === 'connectors' || activeTab === 'integrations') && (
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
  settings: { language: 'no' | 'en' }
  updateSettings: (u: Partial<{ language: 'no' | 'en' }>) => void
}) {
  const [emailUpdates, setEmailUpdates] = useState(true)
  const [emailTask, setEmailTask] = useState(true)
  const [appearance, setAppearance] = useState<'light' | 'dark' | 'system'>('dark')

  return (
    <div>
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
                onClick={() => setAppearance(theme.id)}
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
                  border: appearance === theme.id ? '2px solid #1A93FE' : '2px solid #2E2E2E',
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
                  color: appearance === theme.id ? '#E5E5E5' : '#5A5A5A',
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
  return (
    <div>
      <h2 className="settings-title">Konto</h2>
      <div className="settings-section">
        <p className="settings-section-label">Profilinformasjon</p>
        <div className="settings-row">
          <div>
            <div className="settings-row-label">E-postadresse</div>
            <div className="settings-row-desc">bruker@eksempel.no</div>
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
            <div className="settings-row-desc">Sist endret for 30 dager siden</div>
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
  return (
    <div>
      <h2 className="settings-title">Bruk</h2>
      <div className="settings-section">
        <p className="settings-section-label">Denne måneden</p>
        <div style={{
          padding: 16, borderRadius: 10, background: '#222222',
          border: '1px solid #2A2A2A', marginBottom: 12,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: '#9A9A9A' }}>Kreditter brukt</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#E5E5E5' }}>0 / 1 000</span>
          </div>
          <div style={{ height: 6, borderRadius: 3, background: '#2E2E2E', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: '0%', background: '#1A93FE', borderRadius: 3 }} />
          </div>
        </div>
        <div style={{
          padding: 16, borderRadius: 10, background: '#222222',
          border: '1px solid #2A2A2A',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, color: '#9A9A9A' }}>Totale samtaler</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#E5E5E5' }}>0</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function BillingContent() {
  return (
    <div>
      <h2 className="settings-title">Fakturering</h2>
      <div className="settings-section">
        <p className="settings-section-label">Nåværende plan</p>
        <div style={{
          padding: 20, borderRadius: 12, background: '#222222',
          border: '1px solid #2A2A2A', marginBottom: 16,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#E5E5E5' }}>Gratis</div>
              <div style={{ fontSize: 13, color: '#5A5A5A', marginTop: 2 }}>1 000 kreditter / måned</div>
            </div>
            <span style={{
              padding: '4px 10px', borderRadius: 20, background: '#1A1A1A',
              border: '1px solid #2E2E2E', fontSize: 11, color: '#9A9A9A',
            }}>Aktiv</span>
          </div>
        </div>
        <button style={{
          width: '100%', padding: '10px 16px', borderRadius: 10,
          background: '#1A93FE', border: 'none', color: 'white',
          fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
          transition: 'background 0.1s',
        }}
          onMouseEnter={e => (e.currentTarget.style.background = '#0077E6')}
          onMouseLeave={e => (e.currentTarget.style.background = '#1A93FE')}
        >
          Oppgrader til Pro
        </button>
      </div>
    </div>
  )
}

function PersonalizationContent() {
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
            rows={4}
            style={{
              width: '100%', background: '#252525', border: '1px solid #2E2E2E',
              borderRadius: 8, color: '#E5E5E5', fontSize: 13, padding: '10px 12px',
              outline: 'none', fontFamily: 'inherit', resize: 'vertical',
              lineHeight: 1.6,
            }}
          />
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
