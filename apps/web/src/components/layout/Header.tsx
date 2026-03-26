import { ChevronDown, Share2, MoreHorizontal, Bell, Users } from 'lucide-react'
import { useApp } from '@/store/AppContext'
import { getTranslations } from '@/i18n'

export function Header() {
  const { activeConversation, settings, setSettingsOpen } = useApp()
  const t = getTranslations(settings.language)

  const modelLabels: Record<string, string> = {
    'sine-1':   'Sine 1.0',
    'sine-pro': 'Sine Pro',
  }

  const currentModel = activeConversation
    ? (modelLabels[activeConversation.model] ?? 'Sine 1.0')
    : 'Sine 1.0'

  return (
    <header className="header">
      {/* Left: model selector */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <button className="header-model-btn">
          <span>{currentModel}</span>
          <ChevronDown size={13} style={{ color: '#5A5A5A', flexShrink: 0 }} />
        </button>
      </div>

      {/* Right: actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <button className="header-icon-btn" title="Varsler">
          <Bell size={15} />
        </button>

        <button
          className="header-credits-btn"
          onClick={() => setSettingsOpen(true)}
          title="Kreditter"
        >
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="6.5" stroke="#1A93FE" strokeWidth="1.5"/>
            <path d="M8 5v3l2 1.5" stroke="#1A93FE" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <span style={{ fontWeight: 500 }}>1 000</span>
        </button>

        {activeConversation && (
          <>
            <div style={{ width: 1, height: 16, background: '#252525', margin: '0 2px' }} />
            <button className="header-action-btn">
              <Users size={13} />
              <span>{t.app.collaborate}</span>
            </button>
            <button className="header-action-btn">
              <Share2 size={13} />
              <span>{t.app.share}</span>
            </button>
            <button className="header-icon-btn" title="Mer">
              <MoreHorizontal size={15} />
            </button>
          </>
        )}

        <button
          className="header-avatar"
          onClick={() => setSettingsOpen(true)}
          title="Profil og innstillinger"
          style={{ marginLeft: 4 }}
        >
          S
        </button>
      </div>
    </header>
  )
}
