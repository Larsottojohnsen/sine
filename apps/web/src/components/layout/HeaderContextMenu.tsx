import { useEffect, useRef } from 'react'
import { Pencil, Star, StarOff, Info, Trash2 } from 'lucide-react'

export interface HeaderContextMenuProps {
  isFavorite: boolean
  anchorRef: React.RefObject<HTMLElement>
  language: 'no' | 'en'
  onClose: () => void
  onRename: () => void
  onToggleFavorite: () => void
  onTaskDetails: () => void
  onDelete: () => void
}

const T = {
  no: {
    rename: 'Gi nytt navn',
    addFav: 'Legg til i favoritter',
    removeFav: 'Fjern fra favoritter',
    taskDetails: 'Oppgavedetaljer',
    delete: 'Slett',
  },
  en: {
    rename: 'Rename',
    addFav: 'Add to favorites',
    removeFav: 'Remove from favorites',
    taskDetails: 'Task details',
    delete: 'Delete',
  },
}

export function HeaderContextMenu({
  isFavorite, anchorRef, language, onClose,
  onRename, onToggleFavorite, onTaskDetails, onDelete,
}: HeaderContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null)
  const t = T[language]

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        ref.current && !ref.current.contains(e.target as Node) &&
        anchorRef.current && !anchorRef.current.contains(e.target as Node)
      ) onClose()
    }
    const keyHandler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('mousedown', handler)
    document.addEventListener('keydown', keyHandler)
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('keydown', keyHandler)
    }
  }, [onClose, anchorRef])

  // Position below the anchor button
  const rect = anchorRef.current?.getBoundingClientRect()
  const menuW = 200
  let left = (rect?.right ?? 0) - menuW
  let top = (rect?.bottom ?? 0) + 6
  if (left < 8) left = 8
  if (top + 180 > window.innerHeight) top = (rect?.top ?? 0) - 180 - 6

  const item = (
    icon: React.ReactNode,
    label: string,
    onClick: () => void,
    danger = false,
  ) => (
    <button
      key={label}
      onClick={() => { onClick(); onClose() }}
      style={{
        display: 'flex', alignItems: 'center', gap: 9,
        width: '100%', padding: '7px 12px',
        background: 'none', border: 'none', borderRadius: 6,
        color: danger ? '#EF4444' : 'var(--hmenu-text)',
        fontSize: 13, cursor: 'pointer',
        fontFamily: 'inherit', textAlign: 'left',
        transition: 'background 0.1s',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--hmenu-hover)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none' }}
    >
      <span style={{ width: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {icon}
      </span>
      {label}
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
        background: 'var(--hmenu-bg, #1E1E1E)',
        border: '1px solid var(--hmenu-border, #2E2E2E)',
        borderRadius: 10,
        boxShadow: '0 8px 32px rgba(0,0,0,0.32)',
        padding: '4px',
        width: menuW,
        '--hmenu-bg': 'var(--ctx-bg, #1E1E1E)',
        '--hmenu-border': 'var(--ctx-border, #2E2E2E)',
        '--hmenu-text': 'var(--ctx-text, #D0D0D0)',
        '--hmenu-hover': 'var(--ctx-hover, #2A2A2A)',
      } as React.CSSProperties}
    >
      {item(<Pencil size={14} />, t.rename, onRename)}
      {item(
        isFavorite ? <StarOff size={14} /> : <Star size={14} />,
        isFavorite ? t.removeFav : t.addFav,
        onToggleFavorite,
      )}
      {item(<Info size={14} />, t.taskDetails, onTaskDetails)}

      <div style={{ height: 1, background: 'var(--hmenu-border, #2E2E2E)', margin: '4px 8px' }} />

      {item(<Trash2 size={14} />, t.delete, onDelete, true)}
    </div>
  )
}
