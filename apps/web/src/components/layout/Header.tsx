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

  return (
    <header
      className="flex items-center justify-between px-4 flex-shrink-0"
      style={{
        height: 48,
        borderBottom: '1px solid #2A2A2A',
        background: '#1C1C1C',
      }}
    >
      {/* Left: model selector */}
      <div className="flex items-center">
        {activeConversation ? (
          <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[14px] font-medium text-[#E5E5E5] hover:bg-[#2E2E2E] transition-colors">
            <span>{modelLabels[activeConversation.model] ?? 'Sine 1.0'}</span>
            <ChevronDown size={13} className="text-[#8A8A8A]" />
          </button>
        ) : (
          <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[14px] font-medium text-[#E5E5E5] hover:bg-[#2E2E2E] transition-colors">
            <span>Sine 1.0</span>
            <ChevronDown size={13} className="text-[#8A8A8A]" />
          </button>
        )}
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-0.5">
        {/* Notifications */}
        <button className="p-2 rounded-lg text-[#555] hover:text-[#8A8A8A] hover:bg-[#2E2E2E] transition-colors" title="Varsler">
          <Bell size={16} />
        </button>

        {/* Credits */}
        <button
          onClick={() => setSettingsOpen(true)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[13px] text-[#8A8A8A] hover:text-[#E5E5E5] hover:bg-[#2E2E2E] transition-colors"
          title="Kreditter"
        >
          <Coins size={14} className="text-[#1A93FE]" />
          <span className="font-medium">1 000</span>
        </button>

        {activeConversation && (
          <>
            <div style={{ width: 1, height: 16, background: '#2A2A2A', margin: '0 4px' }} />
            <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[13px] text-[#8A8A8A] hover:text-[#E5E5E5] hover:bg-[#2E2E2E] transition-colors">
              <Users size={14} />
              <span>{t.app.collaborate}</span>
            </button>
            <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[13px] text-[#8A8A8A] hover:text-[#E5E5E5] hover:bg-[#2E2E2E] transition-colors">
              <Share2 size={14} />
              <span>{t.app.share}</span>
            </button>
            <button className="p-2 rounded-lg text-[#555] hover:text-[#8A8A8A] hover:bg-[#2E2E2E] transition-colors">
              <MoreHorizontal size={16} />
            </button>
          </>
        )}

        {/* User avatar */}
        <button
          onClick={() => setSettingsOpen(true)}
          className="w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-semibold ml-1 cursor-pointer hover:opacity-80 transition-opacity flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #1A93FE, #0066CC)' }}
          title="Profil og innstillinger"
        >
          S
        </button>
      </div>
    </header>
  )
}
