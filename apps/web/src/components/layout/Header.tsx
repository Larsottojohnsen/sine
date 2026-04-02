import { useState, useRef } from 'react'
import { ChevronDown, Share2, MoreHorizontal, Bell, Users, ChevronLeft } from 'lucide-react'
import { useApp } from '@/store/AppContext'
import { getTranslations } from '@/i18n'
import { UserAvatarDropdown } from './UserAvatarDropdown'
import { CollaboratePanel } from './CollaboratePanel'
import { HeaderContextMenu } from './HeaderContextMenu'
import { TaskDetailsModal } from './TaskDetailsModal'
import { buildShareLink } from '@/services/conversationService'

interface HeaderProps {
  onMobileBack?: () => void
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

  const modelLabels: Record<string, string> = {
    'sine-1':    'Sine Lite',
    'sine-lite': 'Sine Lite',
    'sine-pro':  'Sine Pro',
    'sine-max':  'Sine Max',
  }

  const currentModel = activeConversation
    ? (modelLabels[activeConversation.model] ?? 'Sine Lite')
    : 'Sine Lite'

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
          <button className="header-model-btn">
            <span>{currentModel}</span>
            <ChevronDown size={15} style={{ color: '#5A5A5A', flexShrink: 0 }} />
          </button>
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
