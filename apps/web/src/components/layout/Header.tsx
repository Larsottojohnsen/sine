import { ChevronDown, Share2, MoreHorizontal, Bell } from 'lucide-react'
import { useApp } from '@/store/AppContext'

export function Header() {
  const { activeConversation } = useApp()

  const modelLabels: Record<string, string> = {
    'sine-1': 'Sine 1.0',
    'sine-pro': 'Sine Pro',
  }

  return (
    <header
      className="flex items-center justify-between px-4 py-2.5 flex-shrink-0"
      style={{ borderBottom: '1px solid #2e2e2e', background: '#272727' }}
    >
      {/* Left: model selector */}
      <div className="flex items-center gap-1">
        {activeConversation ? (
          <button className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-sm font-medium text-[#DADADA] hover:bg-[#343434] transition-colors">
            <span>{modelLabels[activeConversation.model] ?? 'Sine 1.0'}</span>
            <ChevronDown size={14} className="text-[#7F7F7F]" />
          </button>
        ) : (
          <div className="flex items-center gap-2 px-2 py-1.5">
            <img src="/sine/sine-logo.webp" alt="Sine" className="h-5 w-auto opacity-60" />
          </div>
        )}
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-1">
        <button className="p-2 rounded-lg text-[#7F7F7F] hover:text-[#DADADA] hover:bg-[#343434] transition-colors">
          <Bell size={16} />
        </button>
        {activeConversation && (
          <>
            <button className="p-2 rounded-lg text-[#7F7F7F] hover:text-[#DADADA] hover:bg-[#343434] transition-colors">
              <Share2 size={16} />
            </button>
            <button className="p-2 rounded-lg text-[#7F7F7F] hover:text-[#DADADA] hover:bg-[#343434] transition-colors">
              <MoreHorizontal size={16} />
            </button>
          </>
        )}
        {/* User avatar */}
        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium ml-1 cursor-pointer" style={{ background: '#1A93FE' }}>
          S
        </div>
      </div>
    </header>
  )
}
