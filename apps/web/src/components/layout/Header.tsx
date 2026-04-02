import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Share2, MoreHorizontal, Bell, Users, ChevronLeft, Zap, Globe, Sparkles, Lock, Check } from 'lucide-react'
import { useApp } from '@/store/AppContext'
import { getTranslations } from '@/i18n'
import { UserAvatarDropdown } from './UserAvatarDropdown'
import { CollaboratePanel } from './CollaboratePanel'
import { HeaderContextMenu } from './HeaderContextMenu'
import { TaskDetailsModal } from './TaskDetailsModal'
import { buildShareLink } from '@/services/conversationService'
import type { SineModel } from '@/types/index'

interface HeaderProps {
  onMobileBack?: () => void
}

// ── Model selector popup (Manus-style) ────────────────────────
function HeaderModelSelector() {
  const { settings, updateSettings } = useApp()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const model = settings.model
  const normalizedModel: SineModel = model === 'sine-1' ? 'sine-lite' : model

  const tiers: { id: SineModel; name: string; desc: string; icon: React.ReactNode; proOnly: boolean }[] = [
    { id: 'sine-lite', name: 'Sine Lite',  desc: 'Rask og effektiv',          icon: <Zap size={13} />,      proOnly: false },
    { id: 'sine-pro',  name: 'Sine Pro',   desc: 'Kraftig for komplekse oppgaver', icon: <Globe size={13} />,    proOnly: true  },
    { id: 'sine-max',  name: 'Sine Max',   desc: 'Maks ytelse',               icon: <Sparkles size={13} />, proOnly: true  },
  ]

  const currentTier = tiers.find(t => t.id === normalizedModel) ?? tiers[0]

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        className="header-model-btn"
        onClick={() => setOpen(v => !v)}
        style={open ? { background: '#2A2A2C', color: '#E5E5E5' } : {}}
      >
        <span>{currentTier.name}</span>
        <ChevronDown size={13} style={{ color: '#5A5A5A', flexShrink: 0, transition: 'transform 0.15s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }} />
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          left: 0,
          background: '#38383a',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 14,
          padding: '6px',
          zIndex: 2000,
          minWidth: 240,
          boxShadow: '0 12px 40px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.3)',
          animation: 'uadFadeIn 0.15s cubic-bezier(0.16,1,0.3,1)',
        }}>
          {tiers.map(({ id, name, desc, icon, proOnly }) => {
            const isActive = normalizedModel === id
            return (
              <button
                key={id}
                onClick={() => {
                  if (!proOnly) { updateSettings({ model: id }); setOpen(false) }
                }}
                title={proOnly ? 'Krever Sine Pro-abonnement' : undefined}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 10,
                  background: isActive ? 'rgba(255,255,255,0.07)' : 'transparent',
                  border: 'none',
                  cursor: proOnly ? 'not-allowed' : 'pointer',
                  color: proOnly ? '#5A5A5A' : '#E5E5E5',
                  fontFamily: 'inherit',
                  textAlign: 'left',
                  opacity: proOnly ? 0.5 : 1,
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => { if (!proOnly) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = isActive ? 'rgba(255,255,255,0.07)' : 'transparent' }}
              >
                <span style={{ color: proOnly ? '#4A4A4A' : '#8A8A8A', flexShrink: 0 }}>{icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
                    {name}
                    {proOnly && <Lock size={10} style={{ color: '#5A5A5A' }} />}
                  </div>
                  <div style={{ fontSize: 11, color: proOnly ? '#4A4A4A' : '#8A8A8A', marginTop: 1 }}>{desc}</div>
                </div>
                {isActive && !proOnly && <Check size={13} style={{ color: '#1A93FE', flexShrink: 0 }} />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function Header({ onMobileBack }: HeaderProps) {
  const {
    activeConversation, settings, openSettingsTab,
    toggleFavorite, renameConversation, deleteConversation,
    setActiveConversationId,
  } = useApp()
  const t = getTranslations(settings.language)
  const [collaborateOpen, setCollaborateOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [taskDetailsOpen, setTaskDetailsOpen] = useState(false)
  const collaborateRef = useRef<HTMLButtonElement>(null)
  const moreRef = useRef<HTMLButtonElement>(null)

  const handleShare = () => {
    if (!activeConversation) return
    const link = buildShareLink(activeConversation.id)
    navigator.clipboard.writeText(link).catch(() => {})
  }

  const handleDelete = () => {
    if (!activeConversation) return
    setActiveConversationId(null)
    deleteConversation(activeConversation.id)
  }

  return (
    <>
      <header className="header">
        {/* Left: back button (mobile) + model selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <button
            className="mobile-back-btn"
            onClick={onMobileBack}
            aria-label="Tilbake"
          >
            <ChevronLeft size={20} />
            <span style={{ fontSize: 16 }}>Tilbake</span>
          </button>
          <HeaderModelSelector />
        </div>

        {/* Right: actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button className="header-icon-btn" title="Varsler">
            <Bell size={18} />
          </button>

          {activeConversation && (
            <>
              <div style={{ width: 1, height: 16, background: '#252525', margin: '0 2px' }} className="header-divider" />
              <button
                ref={collaborateRef}
                className="header-action-btn"
                onClick={() => setCollaborateOpen(v => !v)}
                style={collaborateOpen ? { background: '#1E1E1E', color: '#E5E5E5' } : {}}
              >
                <Users size={16} />
                <span>{t.app.collaborate}</span>
              </button>
              <button className="header-action-btn" onClick={handleShare}>
                <Share2 size={16} />
                <span>{t.app.share}</span>
              </button>
              <button
                ref={moreRef}
                className="header-icon-btn"
                title="Mer"
                onClick={() => setMenuOpen(v => !v)}
                style={menuOpen ? { background: '#1E1E1E', color: '#E5E5E5' } : {}}
              >
                <MoreHorizontal size={18} />
              </button>
            </>
          )}

          {/* Bruker-avatar med dropdown */}
          <div style={{ marginLeft: 4 }}>
            <UserAvatarDropdown onOpenSettings={(tab) => openSettingsTab(tab)} />
          </div>
        </div>

        {/* Collaborate panel */}
        <CollaboratePanel
          open={collaborateOpen}
          onClose={() => setCollaborateOpen(false)}
          anchorRef={collaborateRef as React.RefObject<HTMLElement>}
        />
      </header>

      {/* Header context menu */}
      {menuOpen && activeConversation && (
        <HeaderContextMenu
          isFavorite={activeConversation.isFavorite ?? false}
          anchorRef={moreRef as React.RefObject<HTMLElement>}
          language={settings.language}
          onClose={() => setMenuOpen(false)}
          onRename={() => {
            const newTitle = window.prompt(
              settings.language === 'no' ? 'Gi samtalen et nytt navn:' : 'Rename conversation:',
              activeConversation.title,
            )
            if (newTitle?.trim()) renameConversation(activeConversation.id, newTitle.trim())
          }}
          onToggleFavorite={() => toggleFavorite(activeConversation.id)}
          onTaskDetails={() => setTaskDetailsOpen(true)}
          onDelete={handleDelete}
        />
      )}

      {/* Task details modal */}
      {taskDetailsOpen && activeConversation && (
        <TaskDetailsModal
          conversation={activeConversation}
          language={settings.language}
          onClose={() => setTaskDetailsOpen(false)}
          onRename={(title) => renameConversation(activeConversation.id, title)}
        />
      )}
    </>
  )
}
