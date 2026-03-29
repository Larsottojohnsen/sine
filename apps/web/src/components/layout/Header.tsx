import { useState, useRef } from 'react'
import { ChevronDown, Share2, MoreHorizontal, Bell, Users, ChevronLeft } from 'lucide-react'
import { useApp } from '@/store/AppContext'
import { getTranslations } from '@/i18n'
import { UserAvatarDropdown } from './UserAvatarDropdown'
import { CollaboratePanel } from './CollaboratePanel'

interface HeaderProps {
  onMobileBack?: () => void
}

export function Header({ onMobileBack }: HeaderProps) {
  const { activeConversation, settings, openSettingsTab } = useApp()
  const t = getTranslations(settings.language)
  const [collaborateOpen, setCollaborateOpen] = useState(false)
  const collaborateRef = useRef<HTMLButtonElement>(null)

  const modelLabels: Record<string, string> = {
    'sine-1':   'Sine 1.0',
    'sine-pro': 'Sine Pro',
  }

  const currentModel = activeConversation
    ? (modelLabels[activeConversation.model] ?? 'Sine 1.0')
    : 'Sine 1.0'

  return (
    <header className="header">
      {/* Left: back button (mobile) + model selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        {/* Mobile back button — only visible on mobile via CSS */}
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

        <button
          className="header-credits-btn"
          onClick={() => openSettingsTab('billing')}
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
            <button className="header-action-btn">
              <Share2 size={16} />
              <span>{t.app.share}</span>
            </button>
            <button className="header-icon-btn" title="Mer">
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
  )
}
