import { useState, useMemo } from 'react'
import {
  LayoutGrid, List, Search, ChevronDown,
  FileText, Image, Archive, Code, FileAudio, Table, Globe, File, MoreHorizontal,
  X, Download, ExternalLink
} from 'lucide-react'
import { useApp } from '@/store/AppContext'
import type { AgentFile, Conversation } from '@/types'


type FileType = 'all' | 'slides' | 'websites' | 'documents' | 'images' | 'audio' | 'spreadsheets' | 'others'
type ViewMode = 'grid' | 'list'

interface LibraryFile extends AgentFile {
  conversationId: string
  conversationTitle: string
  conversationDate: Date
}

const FILE_TYPES: { id: FileType; label: string }[] = [
  { id: 'all', label: 'Alle' },
  { id: 'slides', label: 'Slides' },
  { id: 'websites', label: 'Nettsider' },
  { id: 'documents', label: 'Dokumenter' },
  { id: 'images', label: 'Bilder & Video' },
  { id: 'audio', label: 'Lyd' },
  { id: 'spreadsheets', label: 'Regneark' },
  { id: 'others', label: 'Andre' },
]

function getFileCategory(file: AgentFile): FileType {
  const name = file.name.toLowerCase()
  const type = file.type
  if (name.endsWith('.pptx') || name.endsWith('.ppt') || name.includes('slide')) return 'slides'
  if (name.endsWith('.html') || name.endsWith('.htm') || (type === 'code' && name.endsWith('.html'))) return 'websites'
  if (name.endsWith('.pdf') || name.endsWith('.docx') || name.endsWith('.doc') || name.endsWith('.md') || type === 'markdown' || type === 'text') return 'documents'
  if (name.endsWith('.png') || name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.webp') || name.endsWith('.gif') || name.endsWith('.mp4') || name.endsWith('.webm') || type === 'image') return 'images'
  if (name.endsWith('.mp3') || name.endsWith('.wav') || name.endsWith('.ogg') || name.endsWith('.m4a')) return 'audio'
  if (name.endsWith('.xlsx') || name.endsWith('.xls') || name.endsWith('.csv')) return 'spreadsheets'
  if (name.endsWith('.zip') || name.endsWith('.tar') || name.endsWith('.gz') || type === 'archive') return 'others'
  if (type === 'code') return 'documents'
  return 'others'
}

// ── Large file type icons matching Manus reference design ──────────────────
function LargeFileIcon({ file }: { file: AgentFile }) {
  const cat = getFileCategory(file)
  const name = file.name.toLowerCase()

  // ZIP / archive — orange with zipper lines
  if (cat === 'others' && (name.endsWith('.zip') || name.endsWith('.tar') || name.endsWith('.gz'))) {
    return (
      <svg width="56" height="68" viewBox="0 0 56 68" fill="none">
        <rect x="0" y="6" width="56" height="62" rx="6" fill="#f59e0b" />
        <path d="M36 0 L56 20 L56 6 Q56 0 50 0 Z" fill="#d97706" />
        <path d="M36 0 L36 20 L56 20" fill="#fbbf24" />
        <rect x="22" y="18" width="12" height="3" rx="1.5" fill="white" opacity="0.9" />
        <rect x="22" y="25" width="12" height="3" rx="1.5" fill="white" opacity="0.7" />
        <rect x="22" y="32" width="12" height="3" rx="1.5" fill="white" opacity="0.5" />
        <rect x="22" y="39" width="12" height="3" rx="1.5" fill="white" opacity="0.3" />
        <rect x="25" y="44" width="6" height="8" rx="3" fill="white" opacity="0.8" />
      </svg>
    )
  }

  // Document / markdown / text — blue doc icon
  if (cat === 'documents' || file.type === 'markdown' || file.type === 'text' || file.type === 'code') {
    const color = file.type === 'code' ? '#10b981' : '#3b82f6'
    const bg = file.type === 'code' ? '#065f46' : '#1e3a5f'
    return (
      <svg width="56" height="68" viewBox="0 0 56 68" fill="none">
        <rect x="0" y="6" width="56" height="62" rx="6" fill={bg} />
        <path d="M36 0 L56 20 L56 6 Q56 0 50 0 Z" fill={color} opacity="0.5" />
        <path d="M36 0 L36 20 L56 20" fill={color} opacity="0.3" />
        <rect x="10" y="28" width="36" height="3" rx="1.5" fill={color} opacity="0.8" />
        <rect x="10" y="35" width="28" height="3" rx="1.5" fill={color} opacity="0.6" />
        <rect x="10" y="42" width="32" height="3" rx="1.5" fill={color} opacity="0.5" />
        <rect x="10" y="49" width="20" height="3" rx="1.5" fill={color} opacity="0.4" />
      </svg>
    )
  }

  // Image
  if (cat === 'images') {
    return (
      <svg width="56" height="68" viewBox="0 0 56 68" fill="none">
        <rect x="0" y="6" width="56" height="62" rx="6" fill="#7c3aed" />
        <path d="M36 0 L56 20 L56 6 Q56 0 50 0 Z" fill="#6d28d9" />
        <path d="M36 0 L36 20 L56 20" fill="#8b5cf6" opacity="0.5" />
        <circle cx="20" cy="32" r="5" fill="#c4b5fd" opacity="0.8" />
        <path d="M8 52 L18 38 L26 46 L34 36 L48 52 Z" fill="#c4b5fd" opacity="0.6" />
      </svg>
    )
  }

  // Fallback
  return (
    <svg width="56" height="68" viewBox="0 0 56 68" fill="none">
      <rect x="0" y="6" width="56" height="62" rx="6" fill="#374151" />
      <path d="M36 0 L56 20 L56 6 Q56 0 50 0 Z" fill="#4b5563" />
      <path d="M36 0 L36 20 L56 20" fill="#6b7280" opacity="0.5" />
    </svg>
  )
}

// ── Small file icon for list view ─────────────────────────────────────────
function SmallFileIcon({ file }: { file: AgentFile }) {
  const cat = getFileCategory(file)
  const iconProps = { size: 14, strokeWidth: 1.5 }
  if (cat === 'documents' || file.type === 'markdown') return <FileText {...iconProps} style={{ color: '#3b82f6' }} />
  if (cat === 'images') return <Image {...iconProps} style={{ color: '#7c3aed' }} />
  if (cat === 'audio') return <FileAudio {...iconProps} style={{ color: '#ec4899' }} />
  if (cat === 'spreadsheets') return <Table {...iconProps} style={{ color: '#10b981' }} />
  if (cat === 'websites') return <Globe {...iconProps} style={{ color: '#f59e0b' }} />
  if (cat === 'slides') return <FileText {...iconProps} style={{ color: '#ef4444' }} />
  if (file.type === 'code') return <Code {...iconProps} style={{ color: '#10b981' }} />
  if (file.type === 'archive') return <Archive {...iconProps} style={{ color: '#f59e0b' }} />
  return <File {...iconProps} style={{ color: '#6b7280' }} />
}

// ── Grid card ─────────────────────────────────────────────────────────────
function FileCardGrid({ file }: { file: LibraryFile }) {
  const handleClick = () => {
    if (file.downloadUrl) window.open(file.downloadUrl, '_blank')
  }

  return (
    <div className="lib-manus-card" onClick={handleClick} style={{ cursor: file.downloadUrl ? 'pointer' : 'default' }}>
      <div className="lib-manus-card-icon">
        <LargeFileIcon file={file} />
      </div>
      <div className="lib-manus-card-info">
        <span className="lib-manus-card-name" title={file.name}>{file.name}</span>
        {file.size && <span className="lib-manus-card-size">{file.size}</span>}
      </div>
      <div className="lib-manus-card-actions">
        {file.downloadUrl && (
          <button className="lib-manus-card-btn" onClick={e => { e.stopPropagation(); window.open(file.downloadUrl, '_blank') }} title="Åpne">
            <ExternalLink size={12} />
          </button>
        )}
        {file.downloadUrl && (
          <button className="lib-manus-card-btn" onClick={e => {
            e.stopPropagation()
            const a = document.createElement('a')
            a.href = file.downloadUrl!
            a.download = file.name
            a.click()
          }} title="Last ned">
            <Download size={12} />
          </button>
        )}
      </div>
    </div>
  )
}

// ── List row ──────────────────────────────────────────────────────────────
function FileRowList({ file }: { file: LibraryFile }) {
  return (
    <div className="lib-manus-row" onClick={() => file.downloadUrl && window.open(file.downloadUrl, '_blank')}>
      <SmallFileIcon file={file} />
      <span className="lib-manus-row-name">{file.name}</span>
      <span className="lib-manus-row-conv">{file.conversationTitle.slice(0, 30)}</span>
      <button className="lib-manus-row-menu" onClick={e => e.stopPropagation()}>
        <MoreHorizontal size={14} />
      </button>
    </div>
  )
}

// ── Conversation group ────────────────────────────────────────────────────
interface ConversationGroupProps {
  conversation: Conversation
  files: LibraryFile[]
  viewMode: ViewMode
}

function ConversationGroup({ conversation, files, viewMode }: ConversationGroupProps) {
  const [expanded, setExpanded] = useState(false)
  const PREVIEW_COUNT = 3
  const visibleFiles = expanded ? files : files.slice(0, PREVIEW_COUNT)
  const remaining = files.length - PREVIEW_COUNT

  const formatDate = (date: Date) => {
    const d = new Date(date)
    return d.toLocaleDateString('no-NO', { year: 'numeric', month: '2-digit', day: '2-digit' })
      .replace(/\./g, '/')
  }

  return (
    <div className="lib-manus-group">
      <div className="lib-manus-group-header">
        <h3 className="lib-manus-group-title">{conversation.title}</h3>
        <span className="lib-manus-group-date">{formatDate(conversation.updatedAt)}</span>
      </div>

      {viewMode === 'grid' ? (
        <div className="lib-manus-grid">
          {visibleFiles.map((f, i) => (
            <FileCardGrid key={i} file={f} />
          ))}
        </div>
      ) : (
        <div className="lib-manus-list">
          {visibleFiles.map((f, i) => (
            <FileRowList key={i} file={f} />
          ))}
        </div>
      )}

      {!expanded && remaining > 0 && (
        <button className="lib-manus-show-more" onClick={() => setExpanded(true)}>
          {remaining} flere filer <ChevronDown size={14} />
        </button>
      )}
    </div>
  )
}

export function LibraryView() {
  const { conversations } = useApp()
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [filterType, setFilterType] = useState<FileType>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const allFiles = useMemo<LibraryFile[]>(() => {
    const result: LibraryFile[] = []
    for (const conv of conversations) {
      for (const msg of conv.messages) {
        if (msg.agentFiles) {
          for (const f of msg.agentFiles) {
            result.push({
              ...f,
              conversationId: conv.id,
              conversationTitle: conv.title,
              conversationDate: conv.updatedAt,
            })
          }
        }
      }
    }
    return result
  }, [conversations])

  const groupedByConversation = useMemo(() => {
    const map = new Map<string, { conversation: Conversation; files: LibraryFile[] }>()
    for (const conv of conversations) {
      const files = allFiles.filter(f => f.conversationId === conv.id)
      if (files.length > 0) map.set(conv.id, { conversation: conv, files })
    }
    return map
  }, [allFiles, conversations])

  const filteredGroups = useMemo(() => {
    return Array.from(groupedByConversation.values()).map(({ conversation, files }) => {
      let filtered = files
      if (filterType !== 'all') filtered = filtered.filter(f => getFileCategory(f) === filterType)
      if (searchQuery.trim()) filtered = filtered.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()))
      return { conversation, files: filtered }
    }).filter(g => g.files.length > 0)
  }, [groupedByConversation, filterType, searchQuery])

  return (
    <div className="lib-manus-container">
      {/* Top bar */}
      <div className="lib-manus-topbar">
        <h1 className="lib-manus-title">Bibliotek</h1>
        <div className="lib-manus-toolbar">
          {/* Filter tabs */}
          <div className="lib-manus-tabs">
            {FILE_TYPES.map(ft => (
              <button
                key={ft.id}
                className={`lib-manus-tab${filterType === ft.id ? ' active' : ''}`}
                onClick={() => setFilterType(ft.id)}
              >
                {ft.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="lib-manus-search">
            <Search size={13} />
            <input
              placeholder="Søk filer..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            {searchQuery && <button onClick={() => setSearchQuery('')}><X size={11} /></button>}
          </div>

          {/* View toggle */}
          <div className="lib-manus-view-toggle">
            <button className={viewMode === 'grid' ? 'active' : ''} onClick={() => setViewMode('grid')} title="Rutenett">
              <LayoutGrid size={15} />
            </button>
            <button className={viewMode === 'list' ? 'active' : ''} onClick={() => setViewMode('list')} title="Liste">
              <List size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="lib-manus-content">
        {filteredGroups.length === 0 ? (
          <div className="lib-manus-empty">
            <Archive size={40} style={{ color: '#2A2A2A', marginBottom: 12 }} />
            <p style={{ fontSize: 15, fontWeight: 600, color: '#5A5A5A', margin: '0 0 6px' }}>Ingen filer ennå</p>
            <p style={{ fontSize: 13, color: '#3A3A3A', margin: 0 }}>Filer fra agent-oppgaver vises her automatisk</p>
          </div>
        ) : (
          filteredGroups.map(({ conversation, files }) => (
            <ConversationGroup
              key={conversation.id}
              conversation={conversation}
              files={files}
              viewMode={viewMode}
            />
          ))
        )}
      </div>
    </div>
  )
}
