import { useState } from 'react'
import {
  Plus, Search, BookOpen, FolderPlus, Trash2,
  Settings, Grid3X3, MessageSquare,
  Bot, PanelLeftClose, PanelLeftOpen
} from 'lucide-react'
import { cn, truncate } from '@/lib/utils'
import { useApp } from '@/store/AppContext'
import { getTranslations } from '@/i18n'

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
    const older: typeof conversations = []
    const now = new Date()

    for (const c of conversations) {
      const diff = now.getTime() - c.updatedAt.getTime()
      const days = diff / (1000 * 60 * 60 * 24)
      if (days < 1) today.push(c)
      else if (days < 2) yesterday.push(c)
      else older.push(c)
    }
    return { today, yesterday, older }
  }

  const groups = groupedConversations()

  if (!sidebarOpen) {
    return (
      <div className="flex flex-col items-center py-3 px-2 gap-2 h-full" style={{ background: '#212121', width: 56, borderRight: '1px solid #2e2e2e' }}>
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 rounded-lg hover:bg-[#343434] transition-colors text-[#7F7F7F] hover:text-[#DADADA]"
          title="Åpne meny"
        >
          <PanelLeftOpen size={18} />
        </button>
        <button
          onClick={handleNewChat}
          className="p-2 rounded-lg hover:bg-[#343434] transition-colors text-[#7F7F7F] hover:text-[#DADADA]"
          title={t.app.newChat}
        >
          <Plus size={18} />
        </button>
      </div>
    )
  }

  return (
    <div
      className="flex flex-col h-full"
      style={{ background: '#212121', width: 220, borderRight: '1px solid #2e2e2e', flexShrink: 0 }}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-3 pt-3 pb-1">
        <div className="flex items-center gap-2">
          <img src="/sine/sine-logo.webp" alt="Sine" className="h-5 w-auto opacity-80" />
        </div>
        <button
          onClick={() => setSidebarOpen(false)}
          className="p-1.5 rounded-lg hover:bg-[#343434] transition-colors text-[#7F7F7F] hover:text-[#DADADA]"
        >
          <PanelLeftClose size={16} />
        </button>
      </div>

      {/* Nav items */}
      <div className="px-2 py-1 space-y-0.5">
        <NavButton icon={<Plus size={16} />} label={t.app.newChat} onClick={handleNewChat} />
        <NavButton icon={<Bot size={16} />} label={t.app.agents} onClick={() => {}} />
        <NavButton icon={<Search size={16} />} label={t.app.search} onClick={() => {}} />
        <NavButton icon={<BookOpen size={16} />} label={t.app.library} onClick={() => {}} />
      </div>

      {/* Projects section */}
      <div className="px-3 pt-3 pb-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-[#7F7F7F] uppercase tracking-wider">
            {t.app.projects}
          </span>
          <button className="p-0.5 rounded hover:bg-[#343434] text-[#7F7F7F] hover:text-[#DADADA] transition-colors">
            <Plus size={14} />
          </button>
        </div>
        <button className="flex items-center gap-2 w-full mt-1 px-2 py-1.5 rounded-lg text-sm text-[#7F7F7F] hover:text-[#DADADA] hover:bg-[#2e2e2e] transition-colors">
          <FolderPlus size={14} />
          <span>{t.app.newProject}</span>
        </button>
      </div>

      {/* Conversations */}
      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {conversations.length === 0 ? (
          <p className="text-xs text-[#7F7F7F] px-2 py-3 text-center">Ingen samtaler ennå</p>
        ) : (
          <>
            {groups.today.length > 0 && (
              <ConversationGroup
                label="I dag"
                conversations={groups.today}
                activeId={activeConversationId}
                hoveredId={hoveredId}
                onHover={setHoveredId}
                onSelect={setActiveConversationId}
                onDelete={deleteConversation}
              />
            )}
            {groups.yesterday.length > 0 && (
              <ConversationGroup
                label="I går"
                conversations={groups.yesterday}
                activeId={activeConversationId}
                hoveredId={hoveredId}
                onHover={setHoveredId}
                onSelect={setActiveConversationId}
                onDelete={deleteConversation}
              />
            )}
            {groups.older.length > 0 && (
              <ConversationGroup
                label="Tidligere"
                conversations={groups.older}
                activeId={activeConversationId}
                hoveredId={hoveredId}
                onHover={setHoveredId}
                onSelect={setActiveConversationId}
                onDelete={deleteConversation}
              />
            )}
          </>
        )}
      </div>

      {/* Bottom bar */}
      <div className="border-t border-[#2e2e2e] px-2 py-2 space-y-0.5">
        <NavButton
          icon={<Grid3X3 size={16} />}
          label=""
          onClick={() => {}}
          className="justify-center"
        />
        <div className="flex items-center gap-1">
          <NavButton icon={<Grid3X3 size={16} />} label="" onClick={() => {}} className="flex-1 justify-center" />
          <NavButton icon={<MessageSquare size={16} />} label="" onClick={() => {}} className="flex-1 justify-center" />
          <NavButton icon={<Settings size={16} />} label="" onClick={() => setSettingsOpen(true)} className="flex-1 justify-center" />
        </div>
      </div>
    </div>
  )
}

function NavButton({
  icon,
  label,
  onClick,
  active,
  className,
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
  active?: boolean
  className?: string
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-2.5 w-full px-2 py-1.5 rounded-lg text-sm transition-colors',
        active
          ? 'bg-[#343434] text-[#DADADA]'
          : 'text-[#DADADA] hover:bg-[#2e2e2e]',
        className
      )}
    >
      <span className="text-[#7F7F7F] flex-shrink-0">{icon}</span>
      {label && <span className="truncate">{label}</span>}
    </button>
  )
}

function ConversationGroup({
  label,
  conversations,
  activeId,
  hoveredId,
  onHover,
  onSelect,
  onDelete,
}: {
  label: string
  conversations: { id: string; title: string; updatedAt: Date }[]
  activeId: string | null
  hoveredId: string | null
  onHover: (id: string | null) => void
  onSelect: (id: string) => void
  onDelete: (id: string) => void
}) {
  return (
    <div className="mt-2">
      <p className="text-xs text-[#7F7F7F] px-2 py-1 font-medium">{label}</p>
      {conversations.map(conv => (
        <div
          key={conv.id}
          className={cn(
            'group relative flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-colors text-sm',
            activeId === conv.id
              ? 'bg-[#343434] text-[#DADADA]'
              : 'text-[#DADADA] hover:bg-[#2e2e2e]'
          )}
          onClick={() => onSelect(conv.id)}
          onMouseEnter={() => onHover(conv.id)}
          onMouseLeave={() => onHover(null)}
        >
          <MessageSquare size={13} className="text-[#7F7F7F] flex-shrink-0" />
          <span className="truncate flex-1 text-[13px]">{truncate(conv.title, 28)}</span>
          {hoveredId === conv.id && (
            <button
              onClick={e => { e.stopPropagation(); onDelete(conv.id) }}
              className="absolute right-1.5 p-1 rounded hover:bg-[#3a3a3a] text-[#7F7F7F] hover:text-red-400 transition-colors"
            >
              <Trash2 size={12} />
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
