import { useState } from 'react'
import {
  X, User, Settings, BarChart2, CreditCard, HelpCircle,
  Calendar, Mail, Database, Globe, Zap, Plug, ExternalLink,
  ChevronDown
} from 'lucide-react'
import { cn } from '@/lib/utils'
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
    { id: 'account',        label: t.app.account,        icon: <User size={14} /> },
    { id: 'settings',       label: t.app.settings,       icon: <Settings size={14} /> },
    { id: 'usage',          label: t.app.usage,          icon: <BarChart2 size={14} /> },
    { id: 'billing',        label: t.app.billing,        icon: <CreditCard size={14} /> },
    { id: 'scheduled',      label: 'Planlagte oppgaver', icon: <Calendar size={14} /> },
    { id: 'mail',           label: 'E-post Sine',        icon: <Mail size={14} /> },
    { id: 'data',           label: 'Datakontroll',       icon: <Database size={14} /> },
    { id: 'personalization',label: 'Personalisering',    icon: <User size={14} /> },
    { id: 'skills',         label: 'Ferdigheter',        icon: <Zap size={14} /> },
    { id: 'connectors',     label: 'Tilkoblinger',       icon: <Plug size={14} /> },
    { id: 'integrations',   label: 'Integrasjoner',      icon: <Globe size={14} /> },
  ]

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) setSettingsOpen(false) }}
    >
      <div
        className="relative flex rounded-2xl overflow-hidden animate-fade-in"
        style={{
          background: '#1E1E1E',
          border: '1px solid #2A2A2A',
          width: 820,
          maxWidth: '95vw',
          height: 560,
          maxHeight: '90vh',
          boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
        }}
      >
        {/* Close button */}
        <button
          onClick={() => setSettingsOpen(false)}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-[#555] hover:text-[#8A8A8A] hover:bg-[#2A2A2A] transition-colors z-10"
        >
          <X size={15} />
        </button>

        {/* Left sidebar */}
        <div
          className="flex flex-col py-4 px-2 gap-0.5 flex-shrink-0 overflow-y-auto"
          style={{ width: 200, background: '#171717', borderRight: '1px solid #2A2A2A' }}
        >
          {/* User info */}
          <div className="flex items-center gap-2.5 px-2 py-2 mb-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-semibold flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #1A93FE, #0066CC)' }}
            >
              S
            </div>
            <div className="flex items-center gap-1 min-w-0">
              <span className="text-[13px] font-medium text-[#E5E5E5] truncate">Bruker</span>
              <ChevronDown size={12} className="text-[#555] flex-shrink-0" />
            </div>
          </div>

          {/* Tabs */}
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2.5 px-2.5 py-[7px] rounded-lg text-[13px] transition-colors text-left w-full',
                activeTab === tab.id
                  ? 'bg-[#2A2A2A] text-[#E5E5E5]'
                  : 'text-[#8A8A8A] hover:bg-[#222222] hover:text-[#E5E5E5]'
              )}
            >
              <span className={activeTab === tab.id ? 'text-[#E5E5E5]' : 'text-[#555]'}>
                {tab.icon}
              </span>
              <span>{tab.label}</span>
            </button>
          ))}

          {/* Get help */}
          <div className="mt-auto pt-2">
            <button className="flex items-center gap-2.5 px-2.5 py-[7px] rounded-lg text-[13px] text-[#8A8A8A] hover:bg-[#222222] hover:text-[#E5E5E5] transition-colors w-full">
              <HelpCircle size={14} className="text-[#555]" />
              <span>{t.app.getHelp}</span>
              <ExternalLink size={11} className="ml-auto text-[#444]" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          {activeTab === 'settings' && (
            <SettingsContent settings={settings} updateSettings={updateSettings} />
          )}
          {activeTab === 'account' && (
            <PlaceholderContent title={t.app.account} description="Kontoadministrasjon og profilinformasjon." />
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
          {(activeTab === 'scheduled' || activeTab === 'mail' || activeTab === 'data' || activeTab === 'skills' || activeTab === 'connectors' || activeTab === 'integrations') && (
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
      <h2 className="text-[18px] font-medium text-[#E5E5E5] mb-6">Innstillinger</h2>

      {/* General */}
      <section className="mb-8">
        <p className="text-[11px] text-[#555] uppercase tracking-wider mb-4 font-medium">Generelt</p>

        {/* Language */}
        <div className="mb-6">
          <label className="block text-[14px] font-medium text-[#E5E5E5] mb-2">Språk</label>
          <div className="relative inline-block">
            <select
              value={settings.language}
              onChange={e => updateSettings({ language: e.target.value as 'no' | 'en' })}
              className="appearance-none px-3 py-2 pr-8 rounded-lg text-[13px] text-[#E5E5E5] focus:outline-none focus:ring-1 focus:ring-[#1A93FE] cursor-pointer"
              style={{ background: '#2A2A2A', border: '1px solid #3A3A3A', minWidth: 160 }}
            >
              <option value="no">Norsk</option>
              <option value="en">English</option>
            </select>
            <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#555] pointer-events-none" />
          </div>
        </div>

        {/* Appearance */}
        <div>
          <label className="block text-[14px] font-medium text-[#E5E5E5] mb-3">Utseende</label>
          <div className="flex gap-3">
            {[
              { id: 'light' as const, label: 'Lys',    bg: '#F5F5F5', preview: '#E0E0E0' },
              { id: 'dark' as const,  label: 'Mørk',   bg: '#1C1C1C', preview: '#2A2A2A' },
              { id: 'system' as const,label: 'System', bg: '#1C1C1C', preview: '#2A2A2A', split: true },
            ].map(theme => (
              <button
                key={theme.id}
                onClick={() => setAppearance(theme.id)}
                className="flex flex-col items-center gap-2"
              >
                <div
                  className="w-[72px] h-12 rounded-lg overflow-hidden transition-all"
                  style={{
                    background: theme.bg,
                    border: appearance === theme.id ? '2px solid #1A93FE' : '2px solid #3A3A3A',
                  }}
                >
                  {theme.split ? (
                    <div className="flex h-full">
                      <div className="w-1/2 h-full" style={{ background: '#F5F5F5' }} />
                      <div className="w-1/2 h-full" style={{ background: '#1C1C1C' }} />
                    </div>
                  ) : (
                    <div className="p-2 flex flex-col gap-1">
                      <div className="h-1.5 rounded-full w-3/4" style={{ background: theme.preview }} />
                      <div className="h-1 rounded-full w-1/2" style={{ background: theme.preview, opacity: 0.6 }} />
                    </div>
                  )}
                </div>
                <span className={cn('text-[12px]', appearance === theme.id ? 'text-[#E5E5E5] font-medium' : 'text-[#555]')}>
                  {theme.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Divider */}
      <div style={{ height: 1, background: '#2A2A2A', marginBottom: 24 }} />

      {/* Communication */}
      <section>
        <p className="text-[11px] text-[#555] uppercase tracking-wider mb-4 font-medium">Kommunikasjonspreferanser</p>
        <div className="space-y-5">
          <ToggleSetting
            label="Motta produktoppdateringer"
            description="Få tidlig tilgang til nye funksjoner og suksesshistorier."
            value={emailUpdates}
            onChange={setEmailUpdates}
          />
          <ToggleSetting
            label="E-post når oppgave starter"
            description="Vi sender deg en e-post når oppgaven din begynner å behandles."
            value={emailTask}
            onChange={setEmailTask}
          />
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: '#2A2A2A', margin: '24px 0' }} />

        {/* Cookies */}
        <div className="flex items-center justify-between">
          <span className="text-[14px] text-[#E5E5E5]">Administrer informasjonskapsler</span>
          <button
            className="px-3 py-1.5 rounded-lg text-[13px] text-[#8A8A8A] transition-colors"
            style={{ border: '1px solid #3A3A3A' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#2A2A2A')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            Administrer
          </button>
        </div>
      </section>
    </div>
  )
}

function UsageContent() {
  return (
    <div>
      <h2 className="text-[18px] font-medium text-[#E5E5E5] mb-6">Bruk</h2>
      <div className="space-y-4">
        <div className="p-4 rounded-xl" style={{ background: '#242424', border: '1px solid #2A2A2A' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[13px] text-[#8A8A8A]">Kreditter brukt denne måneden</span>
            <span className="text-[14px] font-medium text-[#E5E5E5]">0 / 1 000</span>
          </div>
          <div className="h-1.5 rounded-full" style={{ background: '#2A2A2A' }}>
            <div className="h-full rounded-full" style={{ background: '#1A93FE', width: '0%' }} />
          </div>
        </div>
        <p className="text-[13px] text-[#555]">Detaljert bruksstatistikk kommer snart.</p>
      </div>
    </div>
  )
}

function BillingContent() {
  return (
    <div>
      <h2 className="text-[18px] font-medium text-[#E5E5E5] mb-6">Fakturering</h2>
      <div className="space-y-4">
        <div className="p-5 rounded-xl" style={{ background: '#242424', border: '1px solid #2A2A2A' }}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[14px] font-medium text-[#E5E5E5]">Gratis plan</span>
            <span className="text-[12px] px-2 py-0.5 rounded-full text-[#1A93FE]" style={{ background: 'rgba(26,147,254,0.1)' }}>Aktiv</span>
          </div>
          <p className="text-[13px] text-[#555]">1 000 kreditter per måned</p>
        </div>
        <button
          className="w-full py-2.5 rounded-xl text-[14px] font-medium text-white transition-all"
          style={{ background: '#1A93FE' }}
          onMouseEnter={e => (e.currentTarget.style.background = '#1480E0')}
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
      <h2 className="text-[18px] font-medium text-[#E5E5E5] mb-2">Personalisering</h2>
      <p className="text-[13px] text-[#555] mb-6">Administrer hvem du er og hva Sine husker.</p>
      <div className="space-y-4">
        <div>
          <label className="block text-[13px] text-[#8A8A8A] mb-1.5">Kallenavn</label>
          <input
            type="text"
            placeholder="Hva skal Sine kalle deg?"
            className="w-full px-3 py-2 rounded-lg text-[13px] text-[#E5E5E5] placeholder-[#444] focus:outline-none focus:ring-1 focus:ring-[#1A93FE]"
            style={{ background: '#2A2A2A', border: '1px solid #3A3A3A' }}
          />
        </div>
        <div>
          <label className="block text-[13px] text-[#8A8A8A] mb-1.5">Yrke</label>
          <input
            type="text"
            placeholder="F.eks. Produktdesigner, Programvareutvikler"
            className="w-full px-3 py-2 rounded-lg text-[13px] text-[#E5E5E5] placeholder-[#444] focus:outline-none focus:ring-1 focus:ring-[#1A93FE]"
            style={{ background: '#2A2A2A', border: '1px solid #3A3A3A' }}
          />
        </div>
        <div>
          <label className="block text-[13px] text-[#8A8A8A] mb-1.5">Mer om deg</label>
          <textarea
            placeholder="Din bakgrunn, preferanser eller sted for å hjelpe Sine å forstå deg bedre"
            rows={3}
            className="w-full px-3 py-2 rounded-lg text-[13px] text-[#E5E5E5] placeholder-[#444] focus:outline-none focus:ring-1 focus:ring-[#1A93FE] resize-none"
            style={{ background: '#2A2A2A', border: '1px solid #3A3A3A' }}
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button className="px-4 py-1.5 rounded-lg text-[13px] text-[#8A8A8A] hover:bg-[#2A2A2A] transition-colors">Avbryt</button>
          <button className="px-4 py-1.5 rounded-lg text-[13px] text-white transition-colors" style={{ background: '#1A93FE' }}>Lagre</button>
        </div>
      </div>
    </div>
  )
}

function PlaceholderContent({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <h2 className="text-[18px] font-medium text-[#E5E5E5] mb-2">{title}</h2>
      <p className="text-[13px] text-[#555]">{description}</p>
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
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1">
        <p className="text-[14px] font-medium text-[#E5E5E5]">{label}</p>
        <p className="text-[12px] text-[#555] mt-0.5 leading-relaxed">{description}</p>
      </div>
      <button
        onClick={() => onChange(!value)}
        className="relative flex-shrink-0 rounded-full transition-colors mt-0.5"
        style={{
          width: 36,
          height: 20,
          background: value ? '#1A93FE' : '#3A3A3A',
        }}
      >
        <span
          className="absolute rounded-full bg-white transition-all shadow-sm"
          style={{
            width: 14,
            height: 14,
            top: 3,
            left: value ? 19 : 3,
          }}
        />
      </button>
    </div>
  )
}
