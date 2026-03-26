import { X, User, Settings, BarChart2, CreditCard, HelpCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useApp } from '@/store/AppContext'
import { getTranslations } from '@/i18n'
import { useState } from 'react'

type SettingsTab = 'account' | 'settings' | 'usage' | 'billing'

export function SettingsModal() {
  const { settingsOpen, setSettingsOpen, settings, updateSettings } = useApp()
  const t = getTranslations(settings.language)
  const [activeTab, setActiveTab] = useState<SettingsTab>('settings')

  if (!settingsOpen) return null

  const tabs: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
    { id: 'account', label: t.app.account, icon: <User size={15} /> },
    { id: 'settings', label: t.app.settings, icon: <Settings size={15} /> },
    { id: 'usage', label: t.app.usage, icon: <BarChart2 size={15} /> },
    { id: 'billing', label: t.app.billing, icon: <CreditCard size={15} /> },
  ]

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={e => { if (e.target === e.currentTarget) setSettingsOpen(false) }}
    >
      <div
        className="relative flex rounded-2xl overflow-hidden"
        style={{
          background: '#272727',
          border: '1px solid #3a3a3a',
          width: '780px',
          maxWidth: '95vw',
          height: '520px',
          maxHeight: '90vh',
        }}
      >
        {/* Close button */}
        <button
          onClick={() => setSettingsOpen(false)}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-[#7F7F7F] hover:text-[#DADADA] hover:bg-[#343434] transition-colors z-10"
        >
          <X size={16} />
        </button>

        {/* Left sidebar */}
        <div className="flex flex-col py-4 px-3 gap-1" style={{ width: 200, background: '#212121', borderRight: '1px solid #2e2e2e' }}>
          {/* User info */}
          <div className="flex items-center gap-2.5 px-2 py-2 mb-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium" style={{ background: '#1A93FE' }}>
              S
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-medium text-[#DADADA] truncate">Bruker</span>
            </div>
          </div>

          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm transition-colors text-left',
                activeTab === tab.id
                  ? 'bg-[#343434] text-[#DADADA]'
                  : 'text-[#DADADA] hover:bg-[#2e2e2e]'
              )}
            >
              <span className="text-[#7F7F7F]">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}

          <div className="mt-auto">
            <button className="flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm text-[#DADADA] hover:bg-[#2e2e2e] transition-colors w-full">
              <HelpCircle size={15} className="text-[#7F7F7F]" />
              <span>{t.app.getHelp}</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          {activeTab === 'settings' && (
            <SettingsContent t={t} settings={settings} updateSettings={updateSettings} />
          )}
          {activeTab === 'account' && (
            <div>
              <h2 className="text-xl font-medium text-[#DADADA] mb-6">{t.app.account}</h2>
              <p className="text-sm text-[#7F7F7F]">Kontoadministrasjon kommer snart.</p>
            </div>
          )}
          {activeTab === 'usage' && (
            <div>
              <h2 className="text-xl font-medium text-[#DADADA] mb-6">{t.app.usage}</h2>
              <p className="text-sm text-[#7F7F7F]">Bruksstatistikk kommer snart.</p>
            </div>
          )}
          {activeTab === 'billing' && (
            <div>
              <h2 className="text-xl font-medium text-[#DADADA] mb-6">{t.app.billing}</h2>
              <p className="text-sm text-[#7F7F7F]">Fakturering og abonnement kommer snart.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function SettingsContent({ t, settings, updateSettings }: {
  t: ReturnType<typeof getTranslations>
  settings: { language: 'no' | 'en' }
  updateSettings: (u: Partial<{ language: 'no' | 'en' }>) => void
}) {
  const [emailUpdates, setEmailUpdates] = useState(true)
  const [emailTask, setEmailTask] = useState(true)

  return (
    <div>
      <h2 className="text-xl font-medium text-[#DADADA] mb-6">{t.settings.title}</h2>

      {/* General */}
      <section className="mb-8">
        <p className="text-xs text-[#7F7F7F] uppercase tracking-wider mb-4">{t.settings.general}</p>

        <div className="mb-5">
          <label className="block text-sm font-medium text-[#DADADA] mb-2">{t.settings.language}</label>
          <select
            value={settings.language}
            onChange={e => updateSettings({ language: e.target.value as 'no' | 'en' })}
            className="px-3 py-2 rounded-lg text-sm text-[#DADADA] focus:outline-none focus:ring-1 focus:ring-[#1A93FE]"
            style={{ background: '#1F1F1F', border: '1px solid #3a3a3a', minWidth: 160 }}
          >
            <option value="no">Norsk</option>
            <option value="en">English</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#DADADA] mb-3">{t.settings.appearance}</label>
          <div className="flex gap-3">
            {['dark'].map(theme => (
              <div key={theme} className="flex flex-col items-center gap-2">
                <div
                  className="w-20 h-14 rounded-lg flex items-center justify-center cursor-pointer transition-all"
                  style={{
                    background: '#1A1A1A',
                    border: '2px solid #1A93FE',
                  }}
                >
                  <div className="w-10 h-1.5 rounded-full bg-[#3a3a3a] mb-1" />
                </div>
                <span className="text-xs text-[#DADADA]">{t.settings.dark}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Communication */}
      <section>
        <p className="text-xs text-[#7F7F7F] uppercase tracking-wider mb-4">{t.settings.communicationPreferences}</p>
        <div className="space-y-4">
          <ToggleSetting
            label={t.settings.receiveUpdates}
            description={t.settings.receiveUpdatesDesc}
            value={emailUpdates}
            onChange={setEmailUpdates}
          />
          <ToggleSetting
            label={t.settings.emailOnTask}
            description={t.settings.emailOnTaskDesc}
            value={emailTask}
            onChange={setEmailTask}
          />
        </div>
      </section>
    </div>
  )
}

function ToggleSetting({ label, description, value, onChange }: {
  label: string
  description: string
  value: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-[#DADADA]">{label}</p>
        <p className="text-xs text-[#7F7F7F] mt-0.5">{description}</p>
      </div>
      <button
        onClick={() => onChange(!value)}
        className={cn(
          'relative flex-shrink-0 w-10 h-5.5 rounded-full transition-colors mt-0.5',
          value ? 'bg-[#1A93FE]' : 'bg-[#3a3a3a]'
        )}
        style={{ height: 22, minWidth: 40 }}
      >
        <span
          className={cn(
            'absolute top-0.5 w-4.5 h-4.5 rounded-full bg-white transition-transform shadow-sm',
            value ? 'translate-x-5' : 'translate-x-0.5'
          )}
          style={{ width: 18, height: 18, top: 2, left: value ? 20 : 2 }}
        />
      </button>
    </div>
  )
}
