import { useEffect, useRef } from 'react'
import { Share2, Pencil, Star, StarOff, ExternalLink, FolderOpen, Trash2 } from 'lucide-react'

export interface ConvContextMenuProps {
  convId: string
  convTitle: string
  isFavorite: boolean
  position: { x: number; y: number }
  language: 'no' | 'en'
  onClose: () => void
  onShare: () => void
  onRename: () => void
  onToggleFavorite: () => void
  onOpenInNewTab: () => void
  onDelete: () => void
}

const T = {
  no: {
    share: 'Del',
    rename: 'Gi nytt navn',
    addFav: 'Legg til i favoritter',
    removeFav: 'Fjern fra favoritter',
    openTab: 'Åpne i ny fane',
    moveProject: 'Flytt til prosjekt',
    comingSoon: 'Kommer snart',
    delete: 'Slett',
  },
  en: {
    share: 'Share',
    rename: 'Rename',
    addFav: 'Add to favorites',
    removeFav: 'Remove from favorites',
    openTab: 'Open in new tab',
    moveProject: 'Move to project',
    comingSoon: 'Coming soon',
    delete: 'Delete',
  },
}

export function ConvContextMenu({
  isFavorite, position, language, onClose,
  onShare, onRename, onToggleFavorite, onOpenInNewTab, onDelete,
}: ConvContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null)
  const t = T[language]

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    const keyHandler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('mousedown', handler)
    document.addEventListener('keydown', keyHandler)
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('keydown', keyHandler)
    }
  }, [onClose])

  // Clamp to viewport
  const menuW = 200
  const menuH = 240
  const left = Math.min(position.x, window.innerWidth - menuW - 8)
  const top = Math.min(position.y, window.innerHeight - menuH - 8)

  const item = (
    icon: React.ReactNode,
    label: string,
    onClick: () => void,
    danger = false,
    disabled = false,
    badge?: string,
  ) => (
    <button
      key={label}
      onClick={() => { if (!disabled) { onClick(); onClose() } }}
      style={{
        display: 'flex', alignItems: 'center', gap: 9,
        width: '100%', padding: '7px 12px',
        background: 'none', border: 'none', borderRadius: 6,
        color: danger ? '#EF4444' : disabled ? '#3A3A3A' : 'var(--menu-text)',
        fontSize: 13, cursor: disabled ? 'default' : 'pointer',
        fontFamily: 'inherit', textAlign: 'left',
        opacity: disabled ? 0.5 : 1,
        transition: 'background 0.1s',
      }}
      onMouseEnter={e => { if (!disabled) (e.currentTarget as HTMLElement).style.background = 'var(--menu-hover)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none' }}
    >
      <span style={{ width: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {icon}
      </span>
      <span style={{ flex: 1 }}>{label}</span>
      {badge && <span style={{ fontSize: 10, color: '#5A5A5A', marginLeft: 4 }}>{badge}</span>}
    </button>
  )

  return (
    <div
      ref={ref}
      style={{
        position: 'fixed',
        left,
        top,
        zIndex: 99999,
        background: 'var(--menu-bg)',
        border: '1px solid var(--menu-border)',
        borderRadius: 10,
        boxShadow: '0 8px 32px rgba(0,0,0,0.32)',
        padding: '4px',
        width: menuW,
        '--menu-bg': 'var(--ctx-bg, #1E1E1E)',
        '--menu-border': 'var(--ctx-border, #2E2E2E)',
        '--menu-text': 'var(--ctx-text, #D0D0D0)',
        '--menu-hover': 'var(--ctx-hover, #2A2A2A)',
      } as React.CSSProperties}
    >
      {item(<Share2 size={14} />, t.share, onShare)}
      {item(<Pencil size={14} />, t.rename, onRename)}
      {item(
        isFavorite ? <StarOff size={14} /> : <Star size={14} />,
        isFavorite ? t.removeFav : t.addFav,
        onToggleFavorite,
      )}
      {item(<ExternalLink size={14} />, t.openTab, onOpenInNewTab)}
      {item(<FolderOpen size={14} />, t.moveProject, () => {}, false, true, t.comingSoon)}

      {/* Divider */}
      <div style={{ height: 1, background: 'var(--menu-border)', margin: '4px 8px' }} />

      {item(<Trash2 size={14} />, t.delete, onDelete, true)}
    </div>
  )
}
