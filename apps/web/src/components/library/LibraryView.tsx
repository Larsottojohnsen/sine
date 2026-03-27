import { useState, useMemo } from 'react'
import {
  LayoutGrid, List, Search, Star, Filter, ChevronDown,
  FileText, Image, Archive, Code, FileAudio, Table, Globe, File, MoreHorizontal,
  X, Check
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

const FILE_TYPES: { id: FileType; label: string; icon: React.ReactNode }[] = [
  { id: 'all', label: 'Alle', icon: <Filter size={14} /> },
  { id: 'slides', label: 'Slides', icon: <LayoutGrid size={14} /> },
  { id: 'websites', label: 'Nettsider', icon: <Globe size={14} /> },
  { id: 'documents', label: 'Dokumenter', icon: <FileText size={14} /> },
  { id: 'images', label: 'Bilder & Video', icon: <Image size={14} /> },
  { id: 'audio', label: 'Lyd', icon: <FileAudio size={14} /> },
  { id: 'spreadsheets', label: 'Regneark', icon: <Table size={14} /> },
  { id: 'others', label: 'Andre', icon: <File size={14} /> },
]

function getFileCategory(file: AgentFile): FileType {
  const name = file.name.toLowerCase()
  const type = file.type

  if (name.endsWith('.pptx') || name.endsWith('.ppt') || name.includes('slide')) return 'slides'
  if (name.endsWith('.html') || name.endsWith('.htm') || type === 'code' && name.endsWith('.html')) return 'websites'
  if (name.endsWith('.pdf') || name.endsWith('.docx') || name.endsWith('.doc') || name.endsWith('.md') || type === 'markdown' || type === 'text') return 'documents'
  if (name.endsWith('.png') || name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.webp') || name.endsWith('.gif') || name.endsWith('.mp4') || name.endsWith('.webm') || type === 'image') return 'images'
  if (name.endsWith('.mp3') || name.endsWith('.wav') || name.endsWith('.ogg') || name.endsWith('.m4a')) return 'audio'
  if (name.endsWith('.xlsx') || name.endsWith('.xls') || name.endsWith('.csv')) return 'spreadsheets'
  if (name.endsWith('.zip') || name.endsWith('.tar') || name.endsWith('.gz') || type === 'archive') return 'others'
  if (type === 'code') return 'documents'
  return 'others'
}

function FileIcon({ file }: { file: AgentFile }) {
  const cat = getFileCategory(file)
  const style = { flexShrink: 0 }
  if (cat === 'images') return <Image size={16} style={style} color="#f59e0b" />
  if (cat === 'documents' || file.type === 'markdown') return <FileText size={16} style={style} color="#3b82f6" />
  if (cat === 'websites') return <Globe size={16} style={style} color="#8b5cf6" />
  if (cat === 'others' && (file.name.endsWith('.zip') || file.name.endsWith('.tar') || file.name.endsWith('.gz'))) return <Archive size={16} style={style} color="#f59e0b" />
  if (file.type === 'code') return <Code size={16} style={style} color="#10b981" />
  return <File size={16} style={style} color="#6b7280" />
}

function FileCardGrid({ file }: { file: LibraryFile }) {
  const isImage = getFileCategory(file) === 'images'
  const isDoc = file.type === 'markdown' || file.type === 'text'

  return (
    <div className="lib-file-card-grid">
      <div className="lib-file-card-header">
        <FileIcon file={file} />
        <span className="lib-file-card-name">{file.name}</span>
        <button className="lib-file-card-menu">
          <MoreHorizontal size={14} />
        </button>
      </div>
      <div className="lib-file-card-preview">
        {isImage && file.downloadUrl ? (
          <img src={file.downloadUrl} alt={file.name} className="lib-file-card-img" />
        ) : isDoc && file.content ? (
          <div className="lib-file-card-text">{file.content.slice(0, 300)}</div>
        ) : (
          <div className="lib-file-card-placeholder">
            <FileIcon file={file} />
          </div>
        )}
      </div>
    </div>
  )
}

function FileRowList({ file }: { file: LibraryFile }) {
  return (
    <div className="lib-file-row">
      <FileIcon file={file} />
      <span className="lib-file-row-name">{file.name}</span>
      <button className="lib-file-row-menu">
        <MoreHorizontal size={14} />
      </button>
    </div>
  )
}

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
    const now = new Date()
    const diff = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)
    if (diff < 1) return d.toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' })
    if (diff < 7) return d.toLocaleDateString('no-NO', { weekday: 'long' })
    return d.toLocaleDateString('no-NO', { year: 'numeric', month: '2-digit', day: '2-digit' })
  }

  return (
    <div className="lib-group">
      <div className="lib-group-header">
        <h3 className="lib-group-title">{conversation.title}</h3>
        <span className="lib-group-date">{formatDate(conversation.updatedAt)}</span>
      </div>

      {viewMode === 'grid' ? (
        <div className="lib-files-grid">
          {visibleFiles.map((f, i) => (
            <FileCardGrid key={i} file={f} />
          ))}
        </div>
      ) : (
        <div className="lib-files-list">
          {visibleFiles.map((f, i) => (
            <FileRowList key={i} file={f} />
          ))}
        </div>
      )}

      {!expanded && remaining > 0 && (
        <button className="lib-show-more" onClick={() => setExpanded(true)}>
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
  const [filterOpen, setFilterOpen] = useState(false)
  const [favorites, setFavorites] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Collect all files from all conversations
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

  // Group files by conversation
  const groupedByConversation = useMemo(() => {
    const map = new Map<string, { conversation: Conversation; files: LibraryFile[] }>()
    for (const conv of conversations) {
      const files = allFiles.filter(f => f.conversationId === conv.id)
      if (files.length > 0) {
        map.set(conv.id, { conversation: conv, files })
      }
    }
    return map
  }, [allFiles, conversations])

  // Apply filters
  const filteredGroups = useMemo(() => {
    return Array.from(groupedByConversation.values()).map(({ conversation, files }) => {
      let filtered = files

      if (filterType !== 'all') {
        filtered = filtered.filter(f => getFileCategory(f) === filterType)
      }

      if (searchQuery.trim()) {
        filtered = filtered.filter(f =>
          f.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      }

      return { conversation, files: filtered }
    }).filter(g => g.files.length > 0)
  }, [groupedByConversation, filterType, searchQuery])

  const activeFilterLabel = FILE_TYPES.find(t => t.id === filterType)?.label || 'Alle'

  return (
    <div className="lib-container">
      {/* Header */}
      <div className="lib-header">
        <h1 className="lib-title">Bibliotek</h1>
      </div>

      {/* Toolbar */}
      <div className="lib-toolbar">
        <div className="lib-toolbar-left">
          {/* Filter dropdown */}
          <div className="lib-filter-wrap">
            <button
              className="lib-filter-btn"
              onClick={() => setFilterOpen(!filterOpen)}
            >
              <Filter size={14} />
              <span>{activeFilterLabel}</span>
              <ChevronDown size={12} />
            </button>
            {filterOpen && (
              <div className="lib-filter-dropdown">
                {FILE_TYPES.map(ft => (
                  <button
                    key={ft.id}
                    className={`lib-filter-option${filterType === ft.id ? ' active' : ''}`}
                    onClick={() => { setFilterType(ft.id); setFilterOpen(false) }}
                  >
                    {ft.icon}
                    <span>{ft.label}</span>
                    {filterType === ft.id && <Check size={12} style={{ marginLeft: 'auto' }} />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Favorites */}
          <button
            className={`lib-favorites-btn${favorites ? ' active' : ''}`}
            onClick={() => setFavorites(!favorites)}
          >
            <Star size={14} />
            <span>Mine favoritter</span>
          </button>
        </div>

        <div className="lib-toolbar-right">
          {/* Search */}
          <div className="lib-search-wrap">
            <Search size={14} className="lib-search-icon" />
            <input
              className="lib-search-input"
              placeholder="Søk filer..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="lib-search-clear" onClick={() => setSearchQuery('')}>
                <X size={12} />
              </button>
            )}
          </div>

          {/* View mode toggle */}
          <div className="lib-view-toggle">
            <button
              className={`lib-view-btn${viewMode === 'grid' ? ' active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Rutenett"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              className={`lib-view-btn${viewMode === 'list' ? ' active' : ''}`}
              onClick={() => setViewMode('list')}
              title="Liste"
            >
              <List size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="lib-content">
        {filteredGroups.length === 0 ? (
          <div className="lib-empty">
            <div className="lib-empty-icon">
              <Archive size={40} />
            </div>
            <p className="lib-empty-title">Ingen filer ennå</p>
            <p className="lib-empty-sub">Filer fra agent-oppgaver vises her</p>
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
