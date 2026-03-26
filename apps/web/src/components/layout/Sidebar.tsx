import { useState } from 'react'
import {
  Plus, Search, BookOpen, FolderPlus, Trash2,
  Bot, PanelLeftClose, PanelLeftOpen,
  LayoutGrid, Monitor, Terminal, ChevronRight, Zap, SlidersHorizontal
} from 'lucide-react'
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

interface SidebarProps {
  onNavigate?: (page: string) => void
  currentPage?: string
}

export function Sidebar({ onNavigate, currentPage = 'chat' }: SidebarProps) {
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
    onNavigate?.('chat')
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
      <div className="sidebar-collapsed">
        <button className="icon-btn" onClick={() => setSidebarOpen(true)} title="Åpne meny">
          <PanelLeftOpen size={16} />
        </button>
        <div style={{ width: '100%', height: 1, background: '#252525', margin: '4px 0' }} />
        <button className="icon-btn" onClick={handleNewChat} title={t.app.newChat}>
          <Plus size={16} />
        </button>
        <button className="icon-btn" onClick={() => onNavigate?.('agents')} title={t.app.agents}>
          <Bot size={16} />
        </button>
        <button className="icon-btn" onClick={() => onNavigate?.('search')} title={t.app.search}>
          <Search size={16} />
        </button>
        <button className="icon-btn" onClick={() => onNavigate?.('library')} title={t.app.library}>
          <BookOpen size={16} />
        </button>
      </div>
    )
  }

  return (
    <div className="sidebar">
      {/* Logo + collapse */}
      <div className="sidebar-logo">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 4 }}>
          <img
            src="/sine/sine-logo.webp"
            alt="Sine"
            style={{ height: 18, width: 'auto', opacity: 0.75 }}
          />
        </div>
        <button
          className="icon-btn"
          onClick={() => setSidebarOpen(false)}
          title="Lukk sidebar"
        >
          <PanelLeftClose size={15} />
        </button>
      </div>

      {/* Main nav */}
      <div className="sidebar-nav" style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <button
          className={`nav-item highlight`}
          onClick={handleNewChat}
        >
          <Plus size={15} style={{ flexShrink: 0 }} />
          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.app.newChat}</span>
        </button>
        <button
          className={`nav-item${currentPage === 'agents' ? ' active' : ''}`}
          onClick={() => onNavigate?.('agents')}
        >
          <Bot size={15} style={{ flexShrink: 0 }} />
          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.app.agents}</span>
          <span style={{
            fontSize: 10, fontWeight: 700, padding: '1px 5px', borderRadius: 4,
            background: '#1A93FE', color: '#fff', flexShrink: 0
          }}>Ny</span>
        </button>
        <button
          className={`nav-item${currentPage === 'search' ? ' active' : ''}`}
          onClick={() => onNavigate?.('search')}
        >
          <Search size={15} style={{ flexShrink: 0 }} />
          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.app.search}</span>
          <span style={{ fontSize: 11, color: '#3A3A3A', flexShrink: 0 }}>⌘K</span>
        </button>
        <button
          className={`nav-item${currentPage === 'library' ? ' active' : ''}`}
          onClick={() => onNavigate?.('library')}
        >
          <BookOpen size={15} style={{ flexShrink: 0 }} />
          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.app.library}</span>
        </button>
      </div>

      {/* Divider */}
      <div className="sidebar-divider" />

      {/* Projects */}
      <div className="sidebar-section">
        <div className="sidebar-section-header">
          <span className="sidebar-section-label">{t.app.projects}</span>
          <button className="icon-btn" style={{ width: 20, height: 20 }}>
            <Plus size={12} />
          </button>
        </div>
        <button className="nav-item" onClick={() => {}}>
          <FolderPlus size={14} style={{ flexShrink: 0 }} />
          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.app.newProject}</span>
        </button>
      </div>

      {/* Conversations */}
      <div style={{ padding: '4px 8px 0', flexShrink: 0 }}>
        <div className="sidebar-section-header">
          <span className="sidebar-section-label">{t.app.allTasks}</span>
          <button className="icon-btn" style={{ width: 20, height: 20 }}>
            <SlidersHorizontal size={11} />
          </button>
        </div>
      </div>

      <div className="sidebar-conversations">
        {conversations.length === 0 ? (
          <p style={{ fontSize: 12, padding: '12px 8px', textAlign: 'center', color: '#3A3A3A', lineHeight: 1.5 }}>
            Ingen samtaler ennå.{' '}
            <span
              style={{ color: '#1A93FE', cursor: 'pointer' }}
              onClick={handleNewChat}
            >
              Start en ny
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
      <div className="sidebar-bottom">
        {/* Referral banner */}
        <div className="referral-banner">
          <div style={{
            width: 28, height: 28, borderRadius: 6,
            background: 'linear-gradient(135deg,#1a93fe,#0066cc)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
          }}>
            <Zap size={13} color="white" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#9A9A9A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              Del Sine med en venn
            </div>
            <div style={{ fontSize: 11, color: '#3A3A3A' }}>Få 500 kreditter hver</div>
          </div>
          <ChevronRight size={12} style={{ color: '#3A3A3A', flexShrink: 0 }} />
        </div>

        {/* Icon row */}
        <div className="sidebar-icon-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <button className="icon-btn" onClick={() => setSettingsOpen(true)} title="Innstillinger">
              <LayoutGrid size={14} />
            </button>
            <button className="icon-btn" title="Visning">
              <Monitor size={14} />
            </button>
            <button className="icon-btn" title="Terminal">
              <Terminal size={14} />
            </button>
          </div>
          <span style={{ fontSize: 10, color: '#2A2A2A' }}>fra Sine AI</span>
        </div>
      </div>
    </div>
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
    <div style={{ marginBottom: 4 }}>
      <p className="conv-group-label">{label}</p>
      {conversations.map(conv => (
        <button
          key={conv.id}
          className={`conv-item${activeId === conv.id ? ' active' : ''}`}
          onClick={() => onSelect(conv.id)}
          onMouseEnter={() => onHover(conv.id)}
          onMouseLeave={() => onHover(null)}
        >
          <span style={{ flexShrink: 0, fontSize: 11, opacity: 0.4 }}>{getConvIcon(conv.title)}</span>
          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {conv.title.length > 26 ? conv.title.slice(0, 26) + '…' : conv.title}
          </span>
          {hoveredId === conv.id && (
            <button
              onClick={e => { e.stopPropagation(); onDelete(conv.id) }}
              style={{
                position: 'absolute', right: 6,
                width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: 5, border: 'none', background: 'transparent', color: '#4A4A4A', cursor: 'pointer'
              }}
              onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
              onMouseLeave={e => (e.currentTarget.style.color = '#4A4A4A')}
            >
              <Trash2 size={11} />
            </button>
          )}
        </button>
      ))}
    </div>
  )
}
