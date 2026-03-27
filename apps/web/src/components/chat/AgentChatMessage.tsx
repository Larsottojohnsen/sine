import { useState } from 'react'
import {
  CheckCircle2, XCircle, Download, FileText, FileCode,
  Archive, Image, File, ExternalLink, ChevronRight,
  Terminal, Globe, Code2, BarChart3, FileEdit, Zap
} from 'lucide-react'
import type { Message, AgentTask, AgentFile } from '@/types'

interface AgentChatMessageProps {
  message: Message
  onOpenFile?: (file: AgentFile) => void
  onSuggestion?: (text: string) => void
}

// ─── Fil-ikon basert på type ───────────────────────────────────
function getFileIcon(type: AgentFile['type'], size = 16) {
  switch (type) {
    case 'markdown': return <FileText size={size} color="#60A5FA" />
    case 'code': return <FileCode size={size} color="#A78BFA" />
    case 'archive': return <Archive size={size} color="#F59E0B" />
    case 'image': return <Image size={size} color="#34D399" />
    default: return <File size={size} color="#9CA3AF" />
  }
}

// ─── Fil-type fra filnavn ──────────────────────────────────────
function getFileType(filename: string): AgentFile['type'] {
  const ext = filename.split('.').pop()?.toLowerCase() ?? ''
  if (['md', 'mdx'].includes(ext)) return 'markdown'
  if (['js', 'ts', 'tsx', 'jsx', 'py', 'rs', 'go', 'java', 'css', 'html', 'json', 'yaml', 'yml', 'sh', 'bash'].includes(ext)) return 'code'
  if (['zip', 'tar', 'gz', 'rar', '7z'].includes(ext)) return 'archive'
  if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext)) return 'image'
  if (['txt', 'log', 'csv'].includes(ext)) return 'text'
  return 'other'
}

// ─── Oppgave-kort med CSS loader ──────────────────────────────
function TaskCard({ task, onOpen }: { task: AgentTask; onOpen?: () => void }) {
  const isRunning = task.status === 'running'
  const isDone = task.status === 'done'
  const isError = task.status === 'error'

  return (
    <div
      className={`agent-task-card${isRunning ? ' agent-task-running' : ''}${isDone ? ' agent-task-done' : ''}${isError ? ' agent-task-error' : ''}`}
      onClick={onOpen}
      style={{ cursor: onOpen ? 'pointer' : 'default' }}
    >
      {/* Shimmer loader for running tasks */}
      {isRunning && <div className="agent-task-shimmer" />}

      <div className="agent-task-content">
        {/* Status ikon */}
        <div className="agent-task-icon">
          {isRunning && (
            <div className="agent-task-spinner" />
          )}
          {isDone && <CheckCircle2 size={14} color="#4ADE80" />}
          {isError && <XCircle size={14} color="#EF4444" />}
        </div>

        {/* Label */}
        <span className="agent-task-label">{task.label}</span>

        {/* Tool badge */}
        {task.tool && (
          <span className="agent-task-tool-badge">{task.tool}</span>
        )}

        {/* Åpne-pil */}
        {onOpen && (
          <ChevronRight size={12} className="agent-task-arrow" />
        )}
      </div>
    </div>
  )
}

// ─── Fil-kort med hover-nedlasting ────────────────────────────
function FileCard({ file, onOpen }: { file: AgentFile; onOpen?: () => void }) {
  const [hovered, setHovered] = useState(false)

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (file.content) {
      const blob = new Blob([file.content], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = file.name
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  return (
    <div
      className="agent-file-card"
      onClick={onOpen}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="agent-file-icon">
        {getFileIcon(file.type, 20)}
      </div>
      <div className="agent-file-info">
        <div className="agent-file-name">{file.name}</div>
        <div className="agent-file-meta">
          {file.type.charAt(0).toUpperCase() + file.type.slice(1)}
          {file.size && ` · ${file.size}`}
        </div>
      </div>
      {hovered && (
        <button
          className="agent-file-download-btn"
          onClick={handleDownload}
          title="Last ned"
        >
          <Download size={14} />
          <span>Last ned</span>
        </button>
      )}
    </div>
  )
}

// ─── Hoved AgentChatMessage ───────────────────────────────────
export function AgentChatMessage({ message, onOpenFile, onSuggestion }: AgentChatMessageProps) {
  const tasks = message.agentTasks ?? []
  const files = message.agentFiles ?? []
  const suggestions = message.agentSuggestions ?? []
  const status = message.agentStatus ?? 'running'
  const isCompleted = status === 'completed'
  const isFailed = status === 'failed'
  const isRunning = status === 'running'

  return (
    <div className="message-assistant animate-fade-in">
      {/* Avatar */}
      <div className="message-avatar">
        <img
          src="/sine/sine-logo.webp"
          alt="Sine"
          style={{ width: 20, height: 20, objectFit: 'contain', opacity: 0.9 }}
        />
      </div>

      {/* Content */}
      <div className="message-body" style={{ flex: 1, minWidth: 0 }}>
        {/* Header */}
        <div className="message-header">
          <span className="message-name">sine</span>
          <span className="message-badge" style={{ background: 'rgba(99,102,241,0.15)', color: '#818CF8' }}>Agent</span>
          {isRunning && <span style={{ fontSize: 11, color: '#6B7280', marginLeft: 4 }}>Jobber...</span>}
        </div>

        {/* Intro-tekst */}
        {message.content && (
          <p style={{ fontSize: 14, color: '#D1D5DB', margin: '6px 0 10px', lineHeight: 1.6 }}>
            {message.content}
          </p>
        )}

        {/* Oppgave-kort (chat-strøm) */}
        {tasks.length > 0 && (
          <div className="agent-tasks-stream">
            {tasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onOpen={task.filePath ? () => onOpenFile?.({
                  name: task.filePath!.split('/').pop() ?? task.filePath!,
                  path: task.filePath!,
                  type: getFileType(task.filePath!),
                }) : undefined}
              />
            ))}
          </div>
        )}

        {/* Fil-leveranse */}
        {files.length > 0 && (
          <div className="agent-files-grid">
            {files.map((file, i) => (
              <FileCard
                key={i}
                file={file}
                onOpen={() => onOpenFile?.(file)}
              />
            ))}
            {files.length > 3 && (
              <button className="agent-view-all-btn">
                <File size={14} />
                <span>Se alle filer i denne oppgaven</span>
              </button>
            )}
          </div>
        )}

        {/* Task complete / failed */}
        {isCompleted && (
          <div className="agent-task-complete">
            <CheckCircle2 size={14} color="#4ADE80" />
            <span>Oppgave fullført</span>
          </div>
        )}
        {isFailed && (
          <div className="agent-task-failed">
            <XCircle size={14} color="#EF4444" />
            <span>Oppgave mislyktes</span>
          </div>
        )}

        {/* Forslag til videre oppgaver */}
        {isCompleted && suggestions.length > 0 && (
          <div className="agent-suggestions">
            <p className="agent-suggestions-label">Forslag til videre oppgaver</p>
            {suggestions.map((s, i) => (
              <button
                key={i}
                className="agent-suggestion-item"
                onClick={() => onSuggestion?.(s)}
              >
                <div className="agent-suggestion-icon">
                  <ExternalLink size={12} />
                </div>
                <span>{s}</span>
                <ChevronRight size={12} className="agent-suggestion-arrow" />
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
    }
  }

  const displayFiles = allFiles.length > 0 ? allFiles : [file]

  return (
    <div className="file-popup-overlay" onClick={onClose}>
      <div className="file-popup" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="file-popup-header">
          <div className="file-popup-title">
            {getFileIcon(selectedFile.type, 16)}
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
              title="Mer"
            >
              <span style={{ fontSize: 16, lineHeight: 1 }}>···</span>
            </button>
            <button
              className="file-popup-action-btn"
              title="Fullskjerm"
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
                <span>{selectedFile.name.split('.')[0]}</span>
              </div>
              {displayFiles.map((f, i) => (
                <div
                  key={i}
                  className={`file-popup-tree-item${f.path === selectedFile.path ? ' active' : ''}`}
                  onClick={() => setSelectedFile(f)}
                >
                  {getFileIcon(f.type, 12)}
                  <span>{f.name}</span>
                </div>
              ))}
            </div>
          )}

          {/* Fil-innhold */}
          <div className="file-popup-content">
            {selectedFile.content ? (
              selectedFile.type === 'markdown' ? (
                <div className="file-popup-markdown">
                  <pre style={{
                    margin: 0,
                    fontFamily: 'inherit',
                    fontSize: 14,
                    lineHeight: 1.7,
                    color: '#E5E5E5',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}>
                    {selectedFile.content}
                  </pre>
                </div>
              ) : (
                <pre className="file-popup-code">
                  {selectedFile.content}
                </pre>
              )
            ) : (
              <div style={{ padding: 24, color: '#6B7280', fontSize: 13 }}>
                Ingen forhåndsvisning tilgjengelig
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Verktøy-ikon for agent-oppgaver ─────────────────────────
export function getToolIcon(tool: string) {
  switch (tool) {
    case 'terminal': return <Terminal size={11} />
    case 'web_search': return <Globe size={11} />
    case 'write_file':
    case 'read_file': return <FileEdit size={11} />
    case 'run_code': return <Code2 size={11} />
    case 'analyze_data': return <BarChart3 size={11} />
    default: return <Zap size={11} />
  }
}
