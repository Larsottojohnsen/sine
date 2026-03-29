import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  CheckCircle2, XCircle, Download, File, Archive, ExternalLink, ChevronRight,
  Terminal, Globe, Code2, BarChart3, FileEdit, Zap,
  MessageSquare
} from 'lucide-react'
import type { Message, AgentTask, AgentFile } from '@/types'

interface AgentChatMessageProps {
  message: Message
  onOpenFile?: (file: AgentFile, allFiles?: AgentFile[]) => void
  onSuggestion?: (text: string) => void
}

// ─── Fil-ikon basert på type ───────────────────────────────────
function getFileIcon(type: AgentFile['type']) {
  if (type === 'archive') {
    return (
      <img
        src="/sine/fil.svg"
        alt="Arkiv"
        style={{ width: 32, height: 32, objectFit: 'contain', flexShrink: 0 }}
      />
    )
  }
  // markdown, code, text, other → dokument-ikon
  return (
    <img
      src="/sine/dokument.svg"
      alt="Dokument"
      style={{ width: 32, height: 32, objectFit: 'contain', flexShrink: 0 }}
    />
  )
}

// ─── Fil-type fra filnavn ──────────────────────────────────────
export function getFileType(filename: string): AgentFile['type'] {
  const ext = filename.split('.').pop()?.toLowerCase() ?? ''
  if (['md', 'mdx'].includes(ext)) return 'markdown'
  if (['js', 'ts', 'tsx', 'jsx', 'py', 'rs', 'go', 'java', 'css', 'html', 'json', 'yaml', 'yml', 'sh', 'bash'].includes(ext)) return 'code'
  if (['zip', 'tar', 'gz', 'rar', '7z'].includes(ext)) return 'archive'
  if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext)) return 'image'
  if (['txt', 'log', 'csv'].includes(ext)) return 'text'
  return 'other'
}

// ─── Verktøy-stil ─────────────────────────────────────────────
function getToolStyle(tool: string): { icon: React.ReactNode; color: string; bg: string } {
  switch (tool) {
    case 'terminal':
      return { icon: <Terminal size={11} />, color: '#A3A3A3', bg: 'rgba(163,163,163,0.1)' }
    case 'web_search':
      return { icon: <Globe size={11} />, color: '#60A5FA', bg: 'rgba(96,165,250,0.1)' }
    case 'write_file':
    case 'read_file':
      return { icon: <FileEdit size={11} />, color: '#A78BFA', bg: 'rgba(167,139,250,0.1)' }
    case 'run_code':
      return { icon: <Code2 size={11} />, color: '#34D399', bg: 'rgba(52,211,153,0.1)' }
    case 'analyze_data':
      return { icon: <BarChart3 size={11} />, color: '#FB923C', bg: 'rgba(251,146,60,0.1)' }
    case 'list_files':
      return { icon: <File size={11} />, color: '#9CA3AF', bg: 'rgba(156,163,175,0.1)' }
    default:
      return { icon: <Zap size={11} />, color: '#9CA3AF', bg: 'rgba(156,163,175,0.1)' }
  }
}

// ─── Oppgave-kort – Manus-stil ────────────────────────────────
function TaskCard({ task, onOpen }: { task: AgentTask; onOpen?: () => void }) {
  const isRunning = task.status === 'running'
  const isDone = task.status === 'done'
  const isError = task.status === 'error'
  const toolStyle = getToolStyle(task.tool ?? '')

  return (
    <div
      className={`manus-task-card${isRunning ? ' manus-task-running' : ''}${isError ? ' manus-task-error' : ''}`}
      onClick={onOpen}
      style={{ cursor: onOpen ? 'pointer' : 'default' }}
    >
      {isRunning && <div className="manus-task-shimmer" />}
      <div className="manus-task-inner">
        {/* Status-ikon */}
        <div className="manus-task-status">
          {isRunning && <div className="manus-task-spinner" />}
          {isDone && <CheckCircle2 size={14} style={{ color: '#6B7280' }} />}
          {isError && <XCircle size={14} style={{ color: '#EF4444' }} />}
        </div>
        {/* Label */}
        <span className="manus-task-label">{task.label}</span>
        {/* Tool-badge */}
        {task.tool && (
          <span
            className="manus-task-badge"
            style={{ color: toolStyle.color, background: toolStyle.bg }}
          >
            {toolStyle.icon}
            <span>{task.tool}</span>
          </span>
        )}
        {/* Pil for klikkbare */}
        {onOpen && (
          <ChevronRight size={13} className="manus-task-arrow" />
        )}
      </div>
    </div>
  )
}

// ─── Fil-kort med hover-nedlasting ────────────────────────────
function FileCard({
  file,
  onOpen,
  onDownload,
}: {
  file: AgentFile
  onOpen?: () => void
  onDownload?: (e: React.MouseEvent) => void
}) {
  const [hovered, setHovered] = useState(false)

  const typeLabel =
    file.type === 'archive' ? 'Archive' :
    file.type === 'markdown' ? 'Markdown' :
    file.type === 'code' ? 'Code' :
    file.type === 'image' ? 'Image' : 'Document'

  return (
    <div
      className="manus-file-card"
      onClick={onOpen}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="manus-file-icon">
        {getFileIcon(file.type)}
      </div>
      <div className="manus-file-info">
        <div className="manus-file-name">{file.name}</div>
        <div className="manus-file-meta">
          {typeLabel}{file.size ? ` · ${file.size}` : ''}
        </div>
      </div>
      {hovered && onDownload && (
        <button
          className="manus-file-download"
          onClick={onDownload}
          title="Last ned"
        >
          <Download size={13} />
          <span>Last ned</span>
        </button>
      )}
    </div>
  )
}

// ─── Gruppér oppgaver med narrative tekster ───────────────────
type GroupItem =
  | { type: 'task'; task: AgentTask }
  | { type: 'narrative'; text: string }

function groupTasksWithNarrative(tasks: AgentTask[]): GroupItem[] {
  if (tasks.length === 0) return []
  const result: GroupItem[] = []
  let prevTool: string | null = null

  for (const task of tasks) {
    const tool = task.tool ?? 'other'
    if (prevTool !== null && prevTool !== tool) {
      const narrative = getNarrativeText(prevTool, tool, task.label)
      if (narrative) result.push({ type: 'narrative', text: narrative })
    }
    result.push({ type: 'task', task })
    prevTool = tool
  }
  return result
}

function getNarrativeText(fromTool: string, toTool: string, nextLabel: string): string {
  if (fromTool === 'terminal' && toTool === 'web_search') return 'Søker etter nødvendig informasjon...'
  if (fromTool === 'web_search' && toTool === 'write_file') return 'Basert på søkeresultatene starter jeg å skrive koden...'
  if (fromTool === 'web_search' && toTool === 'terminal') return 'Setter opp prosjektstrukturen...'
  if (fromTool === 'terminal' && toTool === 'write_file') return 'Skriver filene...'
  if (fromTool === 'write_file' && toTool === 'terminal') {
    if (nextLabel.toLowerCase().includes('zip') || nextLabel.toLowerCase().includes('pack')) return 'Pakker filene for nedlasting...'
    return 'Kjører og verifiserer...'
  }
  if (fromTool === 'write_file' && toTool === 'list_files') return 'Verifiserer filstrukturen...'
  if (fromTool === 'list_files' && toTool === 'terminal') return 'Fullfører og pakker leveransen...'
  return ''
}

// ─── Hoved AgentChatMessage ───────────────────────────────────
export function AgentChatMessage({ message, onOpenFile, onSuggestion }: AgentChatMessageProps) {
  const tasks = message.agentTasks ?? []
  const files = message.agentFiles ?? []
  const suggestions = message.agentSuggestions ?? []
  const status = message.agentStatus ?? 'running'
  const isCompleted = status === 'completed'
  const isFailed = status === 'failed'

  const groupedTasks = groupTasksWithNarrative(tasks)

  const handleDownload = (file: AgentFile, e: React.MouseEvent) => {
    e.stopPropagation()
    if (file.content) {
      const blob = new Blob([file.content], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = file.name
      a.click()
      URL.revokeObjectURL(url)
    } else if (file.downloadUrl) {
      const a = document.createElement('a')
      a.href = file.downloadUrl
      a.download = file.name
      a.click()
    }
  }

  return (
    <div className="message-assistant animate-fade-in">
      {/* Avatar – full logo (ikon + tekst) + badge i samme rad */}
      <div className="message-avatar-row">
        <img
          src="/sine/Sinestar.svg"
          alt="Sine"
          className="message-logo-img"
        />
        <span className="message-badge-clean" style={{ color: '#818CF8' }}>Agent</span>
      </div>

      {/* Content */}
      <div className="message-body" style={{ flex: 1, minWidth: 0 }}>

        {/* Intro-tekst fra agenten – med markdown-rendering og klikkbare lenker */}
        {message.content && (
          <div className="manus-agent-text">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                a({ href, children }) {
                  return (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#60A5FA', textDecoration: 'underline', cursor: 'pointer' }}
                    >
                      {children}
                    </a>
                  )
                },
                h1({ children }) {
                  return <h1 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0.75rem 0 0.4rem', color: '#F3F4F6' }}>{children}</h1>
                },
                h2({ children }) {
                  return <h2 style={{ fontSize: '1.05rem', fontWeight: 600, margin: '0.65rem 0 0.35rem', color: '#F3F4F6' }}>{children}</h2>
                },
                h3({ children }) {
                  return <h3 style={{ fontSize: '0.95rem', fontWeight: 600, margin: '0.55rem 0 0.3rem', color: '#E5E7EB' }}>{children}</h3>
                },
                p({ children }) {
                  return <p style={{ margin: '0 0 0.55rem 0', lineHeight: 1.65 }}>{children}</p>
                },
                strong({ children }) {
                  return <strong style={{ fontWeight: 600, color: '#F3F4F6' }}>{children}</strong>
                },
                code({ className, children }) {
                  const match = /language-(\w+)/.exec(className || '')
                  if (match) return <code className={className}>{children}</code>
                  return (
                    <code style={{
                      background: '#1E1E1E',
                      border: '1px solid #2E2E2E',
                      borderRadius: 4,
                      padding: '1px 5px',
                      fontSize: '0.8em',
                      fontFamily: 'monospace',
                      color: '#E2E8F0',
                    }}>
                      {children}
                    </code>
                  )
                },
                ul({ children }) {
                  return <ul style={{ paddingLeft: '1.2rem', margin: '0.3rem 0 0.55rem 0' }}>{children}</ul>
                },
                ol({ children }) {
                  return <ol style={{ paddingLeft: '1.2rem', margin: '0.3rem 0 0.55rem 0' }}>{children}</ol>
                },
                li({ children }) {
                  return <li style={{ marginBottom: '0.2rem', lineHeight: 1.6 }}>{children}</li>
                },
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        )}

        {/* Oppgave-strøm med narrative tekster */}
        {groupedTasks.length > 0 && (
          <div className="manus-tasks-stream">
            {groupedTasks.map((item, i) => {
              if (item.type === 'narrative') {
                return (
                  <p key={`n-${i}`} className="manus-narrative-text">
                    {item.text}
                  </p>
                )
              }
              return (
                <TaskCard
                  key={item.task.id}
                  task={item.task}
                  onOpen={item.task.filePath ? () => onOpenFile?.({
                    name: item.task.filePath!.split('/').pop() ?? item.task.filePath!,
                    path: item.task.filePath!,
                    type: getFileType(item.task.filePath!),
                  }) : undefined}
                />
              )
            })}
          </div>
        )}

        {/* Leveranse-seksjon */}
        {isCompleted && files.length > 0 && (
          <div className="manus-delivery-section">
            <div className="manus-files-grid">
              {files.slice(0, 3).map((file, i) => (
                <FileCard
                  key={i}
                  file={file}
                  onOpen={() => onOpenFile?.(file, files)}
                  onDownload={(e) => handleDownload(file, e)}
                />
              ))}
              {files.length > 3 && (
                <button
                  className="manus-view-all-btn"
                  onClick={() => onOpenFile?.(files[0], files)}
                >
                  <File size={14} />
                  <span>Se alle filer i denne oppgaven</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Oppgave fullført – kun når agenten faktisk har utført tasks eller levert filer */}
        {isCompleted && (tasks.length > 0 || files.length > 0) && (
          <div className="manus-complete-row">
            <div className="manus-complete-badge">
              <CheckCircle2 size={13} />
              <span>Oppgave fullført</span>
            </div>
            <div className="manus-rating">
              <span>Hvordan var resultatet?</span>
              {[1, 2, 3, 4, 5].map(n => (
                <button key={n} className="manus-star">★</button>
              ))}
            </div>
          </div>
        )}

        {isFailed && (
          <div className="manus-failed-badge">
            <XCircle size={13} />
            <span>Oppgave mislyktes</span>
          </div>
        )}

        {/* Forslag til videre oppgaver */}
        {isCompleted && suggestions.length > 0 && (
          <div className="manus-suggestions">
            <p className="manus-suggestions-label">Foreslåtte oppfølginger</p>
            {suggestions.map((s, i) => (
              <button
                key={i}
                className="manus-suggestion-row"
                onClick={() => onSuggestion?.(s)}
              >
                <MessageSquare size={13} className="manus-suggestion-icon" />
                <span>{s.replace(/\*\*/g, '').replace(/^#+\s*/, '').trim()}</span>
                <ChevronRight size={13} className="manus-suggestion-arrow" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Fil-popup modal ──────────────────────────────────────────
interface FilePopupProps {
  file: AgentFile
  allFiles?: AgentFile[]
  onClose: () => void
  onDownload?: (file: AgentFile) => void
}

export function FilePopup({ file, allFiles = [], onClose, onDownload }: FilePopupProps) {
  const [selectedFile, setSelectedFile] = useState<AgentFile>(file)

  const handleDownload = (f: AgentFile) => {
    if (onDownload) {
      onDownload(f)
      return
    }
    if (f.content) {
      const blob = new Blob([f.content], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = f.name
      a.click()
      URL.revokeObjectURL(url)
    } else if (f.downloadUrl) {
      const a = document.createElement('a')
      a.href = f.downloadUrl
      a.download = f.name
      a.click()
    }
  }

  const displayFiles = allFiles.length > 0 ? allFiles : [file]

  const renderContent = () => {
    if (!selectedFile.content) {
      return (
        <div style={{ padding: 32, color: '#6B7280', fontSize: 13, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <File size={32} style={{ opacity: 0.3 }} />
          <p style={{ margin: 0 }}>Innhold ikke lastet</p>
          <p style={{ fontSize: 11, margin: 0, color: '#4B5563' }}>Klikk Last ned for å hente filen</p>
        </div>
      )
    }
    if (selectedFile.type === 'image') {
      return (
        <img
          src={`data:image/*;base64,${selectedFile.content}`}
          alt={selectedFile.name}
          style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', padding: 16 }}
        />
      )
    }
    return (
      <pre className="file-popup-code">
        {selectedFile.content}
      </pre>
    )
  }

  return (
    <div className="file-popup-overlay" onClick={onClose}>
      <div className="file-popup" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="file-popup-header">
          <div className="file-popup-title">
            {getFileIcon(selectedFile.type)}
            <span>{selectedFile.name}</span>
          </div>
          <div className="file-popup-actions">
            <button
              className="file-popup-action-btn"
              onClick={() => handleDownload(selectedFile)}
              title="Last ned"
            >
              <Download size={15} />
            </button>
            <button
              className="file-popup-action-btn"
              title="Åpne i ny fane"
              onClick={() => {
                if (selectedFile.content) {
                  const w = window.open('', '_blank')
                  if (w) {
                    w.document.write(`<pre style="font-family:monospace;padding:16px;background:#111;color:#e5e5e5;min-height:100vh;margin:0;white-space:pre-wrap">${selectedFile.content.replace(/</g, '&lt;')}</pre>`)
                  }
                }
              }}
            >
              <ExternalLink size={15} />
            </button>
            <button
              className="file-popup-action-btn file-popup-close"
              onClick={onClose}
              title="Lukk"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="file-popup-body">
          {/* Fil-tre */}
          {displayFiles.length > 1 && (
            <div className="file-popup-tree">
              <div className="file-popup-tree-root">
                <Archive size={12} />
                <span style={{ fontSize: 11, color: '#9CA3AF' }}>Filer</span>
              </div>
              {displayFiles.map((f, i) => (
                <div
                  key={i}
                  className={`file-popup-tree-item${f.path === selectedFile.path ? ' active' : ''}`}
                  onClick={() => setSelectedFile(f)}
                >
                  {getFileIcon(f.type)}
                  <span>{f.name}</span>
                </div>
              ))}
            </div>
          )}

          {/* Fil-innhold */}
          <div className="file-popup-content">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Verktøy-ikon (eksportert) ────────────────────────────────
export function getToolIcon(tool: string) {
  return getToolStyle(tool).icon
}
