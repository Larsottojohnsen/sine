import { useState } from 'react'
import {
  Plus, Search, BookOpen, FolderPlus, Trash2,
  Bot, PanelLeftClose, PanelLeftOpen,
  LayoutGrid, Monitor, Terminal, ChevronRight, Zap, SlidersHorizontal
} from 'lucide-react'
import { cn, truncate } from '@/lib/utils'
import { useApp } from '@/store/AppContext'
import { getTranslations } from '@/i18n'

function getConvIcon(title: string) {
  const lower = title.toLowerCase()
  if (lower.includes('kode') || lower.includes('code') || lower.includes('github')) return '⌥'
  if (lower.includes('web') || lower.includes('nett') || lower.includes('side')) return '⊞'
  if (lower.includes('agent') || lower.includes('bot')) return '◎'
  if (lower.includes('rapport') || lower.includes('dokument') || lower.includes('plan')) return '≡'
  return '○'
}

export function Sidebar() {
  const {
    conversations,
    activeConversationId,
    setActiveConversationId,
    createConversation,
    deleteConversation,
    settings,
    sidebarOpen,
    setSidebarOpen,
    setSettingsOpen,
  } = useApp()

  const t = getTranslations(settings.language)
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const handleNewChat = () => {
    createConversation()
  }

  const groupedConversations = () => {
    const today: typeof conversations = []
    const yesterday: typeof conversations = []
    const week: typeof conversations = []
    const older: typeof conversations = []
    const now = new Date()

    for (const c of conversations) {
      const diff = now.getTime() - c.updatedAt.getTime()
      const days = diff / (1000 * 60 * 60 * 24)
      if (days < 1) today.push(c)
      else if (days < 2) yesterday.push(c)
      else if (days < 7) week.push(c)
      else older.push(c)
    }
    return { today, yesterday, week, older }
  }

  const groups = groupedConversations()

  if (!sidebarOpen) {
    return (
      <div
        className="flex flex-col items-center py-3 px-1.5 gap-1.5 h-full flex-shrink-0"
        style={{ background: '#171717', width: 52, borderRight: '1px solid #2A2A2A' }}
      >
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 rounded-lg hover:bg-[#2E2E2E] transition-colors text-[#555] hover:text-[#8A8A8A]"
          title="Åpne meny"
        >
          <PanelLeftOpen size={16} />
        </button>
        <button
          onClick={handleNewChat}
          className="p-2 rounded-lg hover:bg-[#2E2E2E] transition-colors text-[#555] hover:text-[#8A8A8A]"
          title={t.app.newChat}
        >
          <Plus size={16} />
        </button>
        <button className="p-2 rounded-lg hover:bg-[#2E2E2E] transition-colors text-[#555] hover:text-[#8A8A8A]" title={t.app.agents}>
          <Bot size={16} />
        </button>
        <button className="p-2 rounded-lg hover:bg-[#2E2E2E] transition-colors text-[#555] hover:text-[#8A8A8A]" title={t.app.search}>
          <Search size={16} />
        </button>
        <button className="p-2 rounded-lg hover:bg-[#2E2E2E] transition-colors text-[#555] hover:text-[#8A8A8A]" title={t.app.library}>
          <BookOpen size={16} />
        </button>
      </div>
    )
  }

  return (
    <div
      className="flex flex-col h-full flex-shrink-0"
      style={{ background: '#171717', width: 220, borderRight: '1px solid #2A2A2A' }}
    >
      {/* Logo + collapse */}
      <div className="flex items-center justify-between px-3 pt-3 pb-2">
        <div className="flex items-center gap-2">
          <img src="./Sine.webp" alt="Sine" className="h-5 w-auto opacity-75" />
        </div>
        <button
          onClick={() => setSidebarOpen(false)}
          className="p-1.5 rounded-md hover:bg-[#2A2A2A] transition-colors text-[#444] hover:text-[#8A8A8A]"
        >
          <PanelLeftClose size={15} />
        </button>
      </div>

      {/* Main nav */}
      <div className="px-2 pb-1 space-y-0.5">
        <NavItem icon={<Plus size={15} />} label={t.app.newChat} onClick={handleNewChat} />
        <NavItem
          icon={<Bot size={15} />}
          label={t.app.agents}
          onClick={() => {}}
          badge="Ny"
        />
        <NavItem
          icon={<Search size={15} />}
          label={t.app.search}
          onClick={() => {}}
          hint="⌘K"
        />
        <NavItem icon={<BookOpen size={15} />} label={t.app.library} onClick={() => {}} />
      </div>

      {/* Projects */}
      <div className="px-2 pb-1 mt-1">
        <div className="flex items-center justify-between px-2 py-1">
          <span className="text-[11px] font-medium text-[#444] uppercase tracking-wider">
            {t.app.projects}
          </span>
          <button className="text-[#444] hover:text-[#8A8A8A] transition-colors rounded p-0.5">
            <Plus size={12} />
          </button>
        </div>
        <NavItem icon={<FolderPlus size={14} />} label={t.app.newProject} onClick={() => {}} />
      </div>

      {/* Conversations list */}
      <div className="flex-1 overflow-y-auto px-1 pb-2 mt-1">
        <div className="flex items-center justify-between px-3 py-1">
          <span className="text-[11px] font-medium text-[#444] uppercase tracking-wider">
            {t.app.allTasks}
          </span>
          <button className="text-[#444] hover:text-[#8A8A8A] transition-colors rounded p-0.5">
            <SlidersHorizontal size={11} />
          </button>
        </div>

        {conversations.length === 0 ? (
          <p className="text-[12px] text-[#444] px-3 py-4 text-center leading-relaxed">
            Ingen samtaler ennå.<br />
            <span className="text-[#1A93FE] cursor-pointer hover:underline" onClick={handleNewChat}>
              Start en ny samtale
            </span>
          </p>
        ) : (
          <>
            <ConvGroup label="I dag" conversations={groups.today} activeId={activeConversationId} hoveredId={hoveredId} onHover={setHoveredId} onSelect={setActiveConversationId} onDelete={deleteConversation} />
            <ConvGroup label="I går" conversations={groups.yesterday} activeId={activeConversationId} hoveredId={hoveredId} onHover={setHoveredId} onSelect={setActiveConversationId} onDelete={deleteConversation} />
            <ConvGroup label="Siste 7 dager" conversations={groups.week} activeId={activeConversationId} hoveredId={hoveredId} onHover={setHoveredId} onSelect={setActiveConversationId} onDelete={deleteConversation} />
            <ConvGroup label="Eldre" conversations={groups.older} activeId={activeConversationId} hoveredId={hoveredId} onHover={setHoveredId} onSelect={setActiveConversationId} onDelete={deleteConversation} />
          </>
        )}
      </div>

      {/* Bottom */}
      <div style={{ borderTop: '1px solid #2A2A2A' }}>
        {/* Referral banner */}
        <div className="mx-2 my-2 flex items-center gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer hover:bg-[#1E1E1E] transition-all group" style={{ background: '#1A1A1A', border: '1px solid #2A2A2A' }}>
          <Zap size={13} className="text-[#1A93FE] flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-[12px] font-medium text-[#B0B0B0] truncate">Del Sine med en venn</div>
            <div className="text-[11px] text-[#444]">Få 500 kreditter hver</div>
          </div>
          <ChevronRight size={12} className="text-[#444] group-hover:text-[#8A8A8A] transition-colors flex-shrink-0" />
        </div>

        {/* Icon row */}
        <div className="flex items-center justify-between px-3 pb-3 pt-0.5">
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => setSettingsOpen(true)}
              className="p-1.5 rounded-md text-[#444] hover:text-[#8A8A8A] hover:bg-[#2A2A2A] transition-all"
              title="Innstillinger"
            >
              <LayoutGrid size={14} />
            </button>
            <button className="p-1.5 rounded-md text-[#444] hover:text-[#8A8A8A] hover:bg-[#2A2A2A] transition-all" title="Visning">
              <Monitor size={14} />
            </button>
            <button className="p-1.5 rounded-md text-[#444] hover:text-[#8A8A8A] hover:bg-[#2A2A2A] transition-all" title="Terminal">
              <Terminal size={14} />
            </button>
          </div>
          <span className="text-[10px] text-[#333]">fra Sine AI</span>
        </div>
      </div>
    </div>
  )
}

function NavItem({
  icon, label, onClick, active, badge, hint,
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
  active?: boolean
  badge?: string
  hint?: string
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-2.5 w-full px-2 py-[7px] rounded-lg text-[13.5px] transition-all',
        active
          ? 'bg-[#333333] text-[#E5E5E5]'
          : 'text-[#8A8A8A] hover:bg-[#2E2E2E] hover:text-[#E5E5E5]'
      )}
    >
      <span className="flex-shrink-0 opacity-80">{icon}</span>
      <span className="truncate flex-1 text-left">{label}</span>
      {badge && (
        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-[#1A93FE] text-white leading-none">
          {badge}
        </span>
      )}
      {hint && (
        <span className="text-[11px] text-[#444] font-medium">{hint}</span>
      )}
    </button>
  )
}

function ConvGroup({
  label, conversations, activeId, hoveredId, onHover, onSelect, onDelete,
}: {
  label: string
  conversations: { id: string; title: string; updatedAt: Date }[]
  activeId: string | null
  hoveredId: string | null
  onHover: (id: string | null) => void
  onSelect: (id: string) => void
  onDelete: (id: string) => void
}) {
  if (conversations.length === 0) return null
  return (
    <div className="mt-1.5">
      <p className="text-[11px] text-[#444] px-3 py-1 font-medium uppercase tracking-wider">{label}</p>
      {conversations.map(conv => (
        <div
          key={conv.id}
          className={cn(
            'group relative flex items-center gap-2 mx-1 px-2 py-[7px] rounded-lg cursor-pointer transition-all text-[13px]',
            activeId === conv.id
              ? 'bg-[#333333] text-[#E5E5E5]'
              : 'text-[#8A8A8A] hover:bg-[#2E2E2E] hover:text-[#E5E5E5]'
          )}
          onClick={() => onSelect(conv.id)}
          onMouseEnter={() => onHover(conv.id)}
          onMouseLeave={() => onHover(null)}
        >
          <span className="flex-shrink-0 text-[11px] opacity-50">{getConvIcon(conv.title)}</span>
          <span className="truncate flex-1">{truncate(conv.title, 26)}</span>
          {hoveredId === conv.id && (
            <button
              onClick={e => { e.stopPropagation(); onDelete(conv.id) }}
              className="absolute right-1.5 p-1 rounded hover:bg-[#3A3A3A] text-[#555] hover:text-red-400 transition-colors"
            >
              <Trash2 size={11} />
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
