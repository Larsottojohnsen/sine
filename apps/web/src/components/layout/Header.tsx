import { ChevronDown, Share2, MoreHorizontal, Bell, Users, Coins } from 'lucide-react'
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
    <header
      className="flex items-center justify-between flex-shrink-0"
      style={{
        height: 48,
        paddingLeft: 16,
        paddingRight: 16,
        borderBottom: '1px solid #202020',
        background: '#1C1C1C',
      }}
    >
      {/* Left: model selector */}
      <div className="flex items-center">
        <button
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all"
          style={{ color: '#D0D0D0', fontSize: 14, fontWeight: 500 }}
          onMouseEnter={e => (e.currentTarget.style.background = '#242424')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <span>{currentModel}</span>
          <ChevronDown size={13} style={{ color: '#5A5A5A' }} />
        </button>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-0.5">
        {/* Notifications */}
        <HeaderBtn title="Varsler">
          <Bell size={16} />
        </HeaderBtn>

        {/* Credits */}
        <button
          onClick={() => setSettingsOpen(true)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all"
          style={{ fontSize: 13, color: '#6A6A6A' }}
          title="Kreditter"
          onMouseEnter={e => { e.currentTarget.style.background = '#242424'; e.currentTarget.style.color = '#D0D0D0' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6A6A6A' }}
        >
          <Coins size={14} style={{ color: '#1A93FE' }} />
          <span className="font-medium">1 000</span>
        </button>

        {activeConversation && (
          <>
            <div style={{ width: 1, height: 16, background: '#252525', margin: '0 4px' }} />
            <button
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all"
              style={{ fontSize: 13, color: '#6A6A6A' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#242424'; e.currentTarget.style.color = '#D0D0D0' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6A6A6A' }}
            >
              <Users size={14} />
              <span>{t.app.collaborate}</span>
            </button>
            <button
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all"
              style={{ fontSize: 13, color: '#6A6A6A' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#242424'; e.currentTarget.style.color = '#D0D0D0' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6A6A6A' }}
            >
              <Share2 size={14} />
              <span>{t.app.share}</span>
            </button>
            <HeaderBtn title="Mer">
              <MoreHorizontal size={16} />
            </HeaderBtn>
          </>
        )}

        {/* User avatar */}
        <button
          onClick={() => setSettingsOpen(true)}
          className="w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-semibold ml-1.5 cursor-pointer hover:opacity-80 transition-opacity flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #1A93FE, #0066CC)', color: '#fff' }}
          title="Profil og innstillinger"
        >
          S
        </button>
      </div>
    </header>
  )
}

function HeaderBtn({ children, title, onClick }: { children: React.ReactNode; title?: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="p-2 rounded-lg transition-all"
      style={{ color: '#4A4A4A' }}
      onMouseEnter={e => { e.currentTarget.style.color = '#8A8A8A'; e.currentTarget.style.background = '#242424' }}
      onMouseLeave={e => { e.currentTarget.style.color = '#4A4A4A'; e.currentTarget.style.background = 'transparent' }}
    >
      {children}
    </button>
  )
}
