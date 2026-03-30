import { useState } from 'react'
import {
  Plus, Search, BookOpen, FolderPlus, Trash2,
  Bot, PanelLeftClose, PanelLeftOpen, CalendarDays,
  LayoutGrid, Monitor, Terminal, ChevronRight, SlidersHorizontal,
  MessageSquare, X, Copy, Mail, Check, ShieldCheck,
  Bell, User
} from 'lucide-react'
import { useApp } from '@/store/AppContext'
import { getTranslations } from '@/i18n'
import { useAuth } from '@/hooks/useAuth'

// Logo variants: Sine-hvit.svg = white logo for dark mode, Sine-sort.svg = dark logo for light mode
const LOGO_FOR_DARK_BG = "/sine/Sine-hvit.svg"
const LOGO_FOR_LIGHT_BG = "/sine/Sine-sort.svg"

interface SidebarProps {
  onNavigate?: (page: string) => void
  currentPage?: string
  activeAgentRunId?: string | null
  onSelectConversation?: (id: string) => void
  onNewChat?: () => void
}

// ─── Slett-bekreftelsesdialog ─────────────────────────────────
function DeleteConfirmDialog({
  title,
  onConfirm,
  onCancel,
}: {
  title: string
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onClick={onCancel}
    >
      <div
        style={{
          background: '#1e1e20',
          border: '1px solid #2e2e30',
          borderRadius: 12,
          padding: '24px',
          width: 360,
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          position: 'relative',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Lukk-knapp */}
        <button
          onClick={onCancel}
          style={{
            position: 'absolute', top: 14, right: 14,
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: '#6A6A6A', display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 24, height: 24, borderRadius: 6,
          }}
          onMouseEnter={e => (e.currentTarget.style.background = '#2a2a2c')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <X size={15} />
        </button>

        <h3 style={{ margin: '0 0 10px', fontSize: 16, fontWeight: 600, color: '#E5E5E5' }}>
          Slett denne samtalen?
        </h3>
        <p style={{ margin: '0 0 20px', fontSize: 13, color: '#8A8A8A', lineHeight: 1.5 }}>
          <strong style={{ color: '#B0B0B0' }}>"{title.length > 40 ? title.slice(0, 40) + '…' : title}"</strong>
          {' '}vil bli slettet permanent og kan ikke gjenopprettes.
        </p>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '8px 18px', borderRadius: 8, border: '1px solid #3A3A3A',
              background: 'transparent', color: '#C0C0C0', fontSize: 13, cursor: 'pointer',
              fontFamily: 'inherit',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#2a2a2c')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            Avbryt
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: '8px 18px', borderRadius: 8, border: 'none',
              background: '#ef4444', color: '#fff', fontSize: 13, cursor: 'pointer',
              fontFamily: 'inherit', fontWeight: 500,
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#dc2626')}
            onMouseLeave={e => (e.currentTarget.style.background = '#ef4444')}
          >
            Slett
          </button>
        </div>
      </div>
    </div>
  )
}

export function Sidebar({ onNavigate, currentPage = 'chat', activeAgentRunId, onSelectConversation, onNewChat: onNewChatProp }: SidebarProps) {
  const {
    conversations,
    activeConversationId,
    setActiveConversationId,
    deleteConversation,
    settings,
    sidebarOpen,
    setSidebarOpen,
    setSettingsOpen,
  } = useApp()
  const { user } = useAuth()

  const t = getTranslations(settings.language)
  // Determine effective theme (resolve 'system' to actual dark/light)
  const effectiveTheme = settings.theme === 'system'
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : settings.theme
  const logoSrc = effectiveTheme === 'light' ? LOGO_FOR_LIGHT_BG : LOGO_FOR_DARK_BG
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [referralOpen, setReferralOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null)

  const handleNewChat = () => {
    if (onNewChatProp) {
      onNewChatProp()
    } else {
      // Just clear active conversation; actual creation happens on first message send
      setActiveConversationId(null)
      onNavigate?.('chat')
    }
  }

  const handleDeleteRequest = (id: string, title: string) => {
    setDeleteTarget({ id, title })
  }

  const handleDeleteConfirm = () => {
    if (deleteTarget) {
      deleteConversation(deleteTarget.id)
      setDeleteTarget(null)
    }
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
          <PanelLeftOpen size={18} />
        </button>
        <div style={{ width: '100%', height: 1, background: '#252525', margin: '4px 0' }} />
        <button className="icon-btn" onClick={handleNewChat} title={t.app.newChat}>
          <Plus size={18} />
        </button>
        <button className="icon-btn" onClick={() => onNavigate?.('agents')} title={t.app.agents}>
          <Bot size={18} />
        </button>
        <button className="icon-btn" onClick={() => onNavigate?.('search')} title={t.app.search}>
          <Search size={18} />
        </button>
        <button className="icon-btn" onClick={() => onNavigate?.('library')} title={t.app.library}>
          <BookOpen size={18} />
        </button>
        <button className="icon-btn" onClick={() => onNavigate?.('calendar')} title="Kalender">
          <CalendarDays size={18} />
        </button>
      </div>
    )
  }

  return (
    <>
      <div className="sidebar">
        {/* Mobile topbar — only visible on mobile via CSS */}
        <div className="mobile-topbar">
          <button className="mobile-avatar-btn" onClick={() => setSettingsOpen(true)} title="Profil">
            {user?.email ? user.email[0].toUpperCase() : <User size={16} />}
          </button>
          <span className="mobile-topbar-center">sine</span>
          <div className="mobile-topbar-right">
            <button className="mobile-topbar-btn" title="Varsler">
              <Bell size={20} />
            </button>
            <button className="mobile-topbar-btn" onClick={() => onNavigate?.('search')} title="Søk">
              <Search size={20} />
            </button>
          </div>
        </div>

        {/* Desktop: Logo + collapse */}
        <div className="sidebar-logo sidebar-logo-desktop">
          <button className="sidebar-logo-btn" onClick={handleNewChat} title="Ny chat">
            <img
              src={logoSrc}
              alt="Sine"
              style={{ height: 22, width: 'auto' }}
            />
          </button>
          <button className="icon-btn" onClick={() => setSidebarOpen(false)} title="Lukk sidebar">
            <PanelLeftClose size={18} />
          </button>
        </div>

        {/* Main nav */}
        <div className="sidebar-nav" style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <button className="nav-item highlight" onClick={handleNewChat}>
            <Plus size={18} style={{ flexShrink: 0 }} />
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.app.newChat}</span>
          </button>
          <button
            className={`nav-item${currentPage === 'agents' ? ' active' : ''}`}
            onClick={() => onNavigate?.('agents')}
          >
            <Bot size={18} style={{ flexShrink: 0 }} />
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.app.agents}</span>
          </button>
          <button
            className={`nav-item${currentPage === 'search' ? ' active' : ''}`}
            onClick={() => onNavigate?.('search')}
          >
            <Search size={18} style={{ flexShrink: 0 }} />
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.app.search}</span>
            <span style={{ fontSize: 11, color: '#3A3A3A', flexShrink: 0 }}>⌘K</span>
          </button>
          <button
            className={`nav-item${currentPage === 'library' ? ' active' : ''}`}
            onClick={() => onNavigate?.('library')}
          >
            <BookOpen size={18} style={{ flexShrink: 0 }} />
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.app.library}</span>
          </button>
          <button
            className={`nav-item${currentPage === 'calendar' ? ' active' : ''}`}
            onClick={() => onNavigate?.('calendar')}
          >
            <CalendarDays size={18} style={{ flexShrink: 0 }} />
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Kalender</span>
          </button>
          {user?.isAdmin && (
            <button
              className={`nav-item${currentPage === 'admin' ? ' active' : ''}`}
              onClick={() => onNavigate?.('admin')}
              style={{ color: currentPage === 'admin' ? '#00d4ff' : '#888' }}
            >
              <ShieldCheck size={18} style={{ flexShrink: 0 }} />
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Admin</span>
            </button>
          )}
        </div>

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
            <FolderPlus size={18} style={{ flexShrink: 0 }} />
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.app.newProject}</span>
          </button>
        </div>

        {/* All tasks header */}
        <div style={{ padding: '4px 8px 0', flexShrink: 0 }}>
          <div className="sidebar-section-header">
            <span className="sidebar-section-label">{t.app.allTasks}</span>
            <button className="icon-btn" style={{ width: 20, height: 20 }}>
              <SlidersHorizontal size={11} />
            </button>
          </div>
        </div>

        {/* Conversations list */}
        <div className="sidebar-conversations">
          {conversations.length === 0 ? (
            <p style={{ fontSize: 12, padding: '12px 8px', textAlign: 'center', color: '#3A3A3A', lineHeight: 1.5 }}>
              Ingen samtaler ennå.{' '}
              <span style={{ color: '#1A93FE', cursor: 'pointer' }} onClick={handleNewChat}>
                Start en ny
              </span>
            </p>
          ) : (
            <>
              <ConvGroup label="I dag" conversations={groups.today} activeId={activeConversationId} hoveredId={hoveredId} onHover={setHoveredId} onSelect={(id) => { if (onSelectConversation) { onSelectConversation(id) } else { setActiveConversationId(id); onNavigate?.('chat') } }} onDelete={handleDeleteRequest} activeAgentRunId={activeAgentRunId} />
              <ConvGroup label="I går" conversations={groups.yesterday} activeId={activeConversationId} hoveredId={hoveredId} onHover={setHoveredId} onSelect={(id) => { if (onSelectConversation) { onSelectConversation(id) } else { setActiveConversationId(id); onNavigate?.('chat') } }} onDelete={handleDeleteRequest} activeAgentRunId={activeAgentRunId} />
              <ConvGroup label="Siste 7 dager" conversations={groups.week} activeId={activeConversationId} hoveredId={hoveredId} onHover={setHoveredId} onSelect={(id) => { if (onSelectConversation) { onSelectConversation(id) } else { setActiveConversationId(id); onNavigate?.('chat') } }} onDelete={handleDeleteRequest} activeAgentRunId={activeAgentRunId} />
              <ConvGroup label="Eldre" conversations={groups.older} activeId={activeConversationId} hoveredId={hoveredId} onHover={setHoveredId} onSelect={(id) => { if (onSelectConversation) { onSelectConversation(id) } else { setActiveConversationId(id); onNavigate?.('chat') } }} onDelete={handleDeleteRequest} activeAgentRunId={activeAgentRunId} />
            </>
          )}
        </div>

        {/* Bottom */}
        <div className="sidebar-bottom">
          {/* Referral-kort */}
          <button className="referral-banner" onClick={() => setReferralOpen(true)}>
            <div className="referral-icon-wrap">
              <img src="/sine/hand-icon.svg" alt="Inviter" style={{ width: 16, height: 16, opacity: 0.9 }} />
            </div>
            <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
              <div className="referral-title">Del Sine med en venn</div>
              <div className="referral-sub">Få 500 kreditter hver</div>
            </div>
            <ChevronRight size={13} style={{ color: '#5A5A5A', flexShrink: 0 }} />
          </button>

          <div className="sidebar-icon-row">
            <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <button className="icon-btn" onClick={() => setSettingsOpen(true)} title="Innstillinger">
                <LayoutGrid size={18} />
              </button>
              <button className="icon-btn" title="Visning">
                <Monitor size={18} />
              </button>
              <button className="icon-btn" title="Terminal">
                <Terminal size={18} />
              </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 11, color: '#8A8A8A', letterSpacing: '0.02em', fontWeight: 500 }}>av</span>
              <img
                src="/sine/jtg-logo.png"
                alt="Johnsen Technology AS"
                style={{ height: 26, opacity: 0.85, objectFit: 'contain', maxWidth: 120 }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile FAB — new chat button, only visible on mobile via CSS */}
      <button
        className="mobile-fab"
        onClick={handleNewChat}
        title="Ny samtale"
        /* visibility controlled by mobile.css */
      >
        <Plus size={22} />
      </button>

      {/* Referral Modal */}
      {referralOpen && <ReferralModal onClose={() => setReferralOpen(false)} />}

      {/* Slett-bekreftelsesdialog */}
      {deleteTarget && (
        <DeleteConfirmDialog
          title={deleteTarget.title}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </>
  )
}

function ReferralModal({ onClose }: { onClose: () => void }) {
  const [copied, setCopied] = useState(false)
  const [email, setEmail] = useState('')
  const [emailSent, setEmailSent] = useState(false)
  const inviteLink = 'https://sine.ai/invite/abc123'

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSendEmail = () => {
    if (!email) return
    setEmailSent(true)
    setTimeout(() => setEmailSent(false), 3000)
    setEmail('')
  }

  return (
    <div className="referral-modal-overlay" onClick={onClose}>
      <div className="referral-modal" onClick={e => e.stopPropagation()}>
        {/* Lukk-knapp */}
        <button className="referral-modal-close" onClick={onClose}>
          <X size={16} />
        </button>

        {/* E-post-bilde */}
        <div className="referral-modal-hero">
          <img src="/sine/invite-email.png" alt="Inviter" style={{ width: 100, height: 'auto' }} />
        </div>

        {/* Tittel */}
        <h2 className="referral-modal-title">Inviter for å få kreditter</h2>
        <p className="referral-modal-sub">
          Del invitasjonslenken din med venner, få <strong>500</strong> kreditter hver.
        </p>

        {/* Faner */}
        <div className="referral-modal-tabs">
          <button className="referral-tab active">Del på web</button>
          <button className="referral-tab">Del på mobil</button>
        </div>

        {/* Kopier lenke */}
        <button className="referral-copy-btn" onClick={handleCopy}>
          {copied ? <Check size={15} /> : <Copy size={15} />}
          {copied ? 'Kopiert!' : 'Kopier invitasjonslenke'}
        </button>

        {/* Facebook */}
        <button
          className="referral-facebook-btn"
          onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(inviteLink)}`, '_blank')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
          Inviter Facebook-venner
        </button>

        {/* Sosiale medier */}
        <div className="referral-social-row">
          <button
            className="referral-social-btn"
            onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent('Prøv Sine AI: ' + inviteLink)}`, '_blank')}
            title="WhatsApp"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
          </button>
          <button
            className="referral-social-btn"
            onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent('Prøv Sine AI: ' + inviteLink)}`, '_blank')}
            title="X / Twitter"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
          </button>
          <button
            className="referral-social-btn"
            onClick={() => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(inviteLink)}`, '_blank')}
            title="LinkedIn"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
          </button>
          <button
            className="referral-social-btn"
            onClick={() => window.open(`https://www.reddit.com/submit?url=${encodeURIComponent(inviteLink)}`, '_blank')}
            title="Reddit"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
            </svg>
          </button>
        </div>

        {/* Send e-post */}
        <div className="referral-email-section">
          <p className="referral-email-label">Send invitasjons-e-post</p>
          <div className="referral-email-row">
            <input
              type="email"
              className="referral-email-input"
              placeholder="Skriv inn e-postadresse"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSendEmail()}
            />
            <button className="referral-email-send" onClick={handleSendEmail}>
              {emailSent ? <Check size={14} /> : <Mail size={14} />}
              {emailSent ? 'Sendt!' : 'Send'}
            </button>
          </div>
        </div>

        {/* Invitations teller */}
        <div className="referral-stats">
          <div className="referral-stats-header">
            <span>Invitasjoner</span>
            <ChevronRight size={13} />
          </div>
          <div className="referral-stats-row">
            <div className="referral-stat">
              <span className="referral-stat-num">0</span>
              <span className="referral-stat-label">Kreditter</span>
            </div>
            <div className="referral-stat">
              <span className="referral-stat-num">0</span>
              <span className="referral-stat-label">Referanser</span>
            </div>
            <div className="referral-stat-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#3A3A3A" strokeWidth="1.5">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ConvGroup({
  label, conversations, activeId, hoveredId, onHover, onSelect, onDelete, activeAgentRunId,
}: {
  label: string
  conversations: { id: string; title: string; updatedAt: Date; type?: string }[]
  activeId: string | null
  hoveredId: string | null
  onHover: (id: string | null) => void
  onSelect: (id: string) => void
  onDelete: (id: string, title: string) => void
  activeAgentRunId?: string | null
}) {
  if (conversations.length === 0) return null
  return (
    <div style={{ marginBottom: 4 }}>
      <p className="conv-group-label">{label}</p>
      {conversations.map(conv => {
        const isAgent = conv.type === 'agent'
        const isRunning = isAgent && activeAgentRunId != null && activeId === conv.id

        return (
          <button
            key={conv.id}
            className={`conv-item${activeId === conv.id ? ' active' : ''}`}
            onClick={() => onSelect(conv.id)}
            onMouseEnter={() => onHover(conv.id)}
            onMouseLeave={() => onHover(null)}
          >
            <span style={{ flexShrink: 0, fontSize: 11, opacity: 0.5, display: 'flex', alignItems: 'center', width: 14 }}>
              {isRunning ? (
                <span className="conv-spinner" />
              ) : isAgent ? (
                <Bot size={12} />
              ) : (
                <MessageSquare size={12} />
              )}
            </span>
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {conv.title.length > 26 ? conv.title.slice(0, 26) + '…' : conv.title}
            </span>
            {hoveredId === conv.id && (
              <button
                onClick={e => { e.stopPropagation(); onDelete(conv.id, conv.title) }}
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
        )
      })}
    </div>
  )
}
