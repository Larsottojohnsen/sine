import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  CheckCircle2, XCircle, Download, File, Archive, ExternalLink,
  Terminal, Globe, Code2, BarChart3, FileEdit, Zap, ChevronDown, ChevronUp,
  MessageSquare, ChevronRight, Circle
} from 'lucide-react'
import type { Message, AgentTask, AgentFile } from '@/types'

interface AgentChatMessageProps {
  message: Message
  onOpenFile?: (file: AgentFile, allFiles?: AgentFile[]) => void
  onSuggestion?: (text: string) => void
}

// ─── File icon ────────────────────────────────────────────────
function getFileIcon(type: AgentFile['type']) {
  if (type === 'archive') {
    return (
      <img src="/sine/fil.svg" alt="Arkiv"
        style={{ width: 32, height: 32, objectFit: 'contain', flexShrink: 0 }} />
    )
  }
  return (
    <img src="/sine/dokument.svg" alt="Dokument"
      style={{ width: 32, height: 32, objectFit: 'contain', flexShrink: 0 }} />
  )
}

// ─── File type from filename ──────────────────────────────────
export function getFileType(filename: string): AgentFile['type'] {
  const ext = filename.split('.').pop()?.toLowerCase() ?? ''
  if (['md', 'mdx'].includes(ext)) return 'markdown'
  if (['js', 'ts', 'tsx', 'jsx', 'py', 'rs', 'go', 'java', 'css', 'html', 'json', 'yaml', 'yml', 'sh', 'bash'].includes(ext)) return 'code'
  if (['zip', 'tar', 'gz', 'rar', '7z'].includes(ext)) return 'archive'
  if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext)) return 'image'
  if (['txt', 'log', 'csv'].includes(ext)) return 'text'
  return 'other'
}

// ─── Tool icon + label ────────────────────────────────────────
function getToolMeta(tool: string): { icon: React.ReactNode; label: string } {
  switch (tool) {
    case 'terminal':
      return { icon: <Terminal size={12} />, label: tool }
    case 'web_search':
      return { icon: <Globe size={12} />, label: tool }
    case 'write_file':
      return { icon: <FileEdit size={12} />, label: tool }
    case 'read_file':
      return { icon: <FileEdit size={12} />, label: tool }
    case 'run_code':
      return { icon: <Code2 size={12} />, label: tool }
    case 'analyze_data':
      return { icon: <BarChart3 size={12} />, label: tool }
    case 'list_files':
      return { icon: <File size={12} />, label: tool }
    default:
      return { icon: <Zap size={12} />, label: tool }
  }
}

// ─── Action pill (Manus-style) ────────────────────────────────
function ActionPill({ task }: { task: AgentTask }) {
  const isRunning = task.status === 'running'
  const isError = task.status === 'error'
  const meta = getToolMeta(task.tool ?? 'other')

  return (
    <div className={`mns-pill${isRunning ? ' mns-pill-running' : ''}${isError ? ' mns-pill-error' : ''}`}>
      {isRunning && <div className="mns-pill-shimmer" />}
      <span className="mns-pill-icon">{meta.icon}</span>
      <span className="mns-pill-text">{task.label}</span>
    </div>
  )
}

// ─── Phase step (Manus-style) ─────────────────────────────────
interface PhaseStep {
  title: string
  description: string
  pills: AgentTask[]
  status: 'done' | 'running' | 'pending' | 'error'
  isLast: boolean
}

function PhaseStepView({ step }: { step: PhaseStep }) {
  const [expanded, setExpanded] = useState(true)
  const isDone = step.status === 'done'
  const isRunning = step.status === 'running'
  const isError = step.status === 'error'

  return (
    <div className="mns-phase">
      {/* Left column: checkmark + dashed line */}
      <div className="mns-phase-left">
        <div className={`mns-phase-check${isDone ? ' done' : ''}${isRunning ? ' running' : ''}${isError ? ' error' : ''}`}>
          {isDone && <CheckCircle2 size={14} />}
          {isRunning && <div className="mns-phase-spinner" />}
          {isError && <XCircle size={14} />}
          {step.status === 'pending' && <Circle size={14} />}
        </div>
        {!step.isLast && <div className="mns-phase-line" />}
      </div>

      {/* Right column: title + description + pills */}
      <div className="mns-phase-body">
        <button
          className="mns-phase-title-row"
          onClick={() => setExpanded(e => !e)}
        >
          <span className="mns-phase-title">{step.title}</span>
          {expanded
            ? <ChevronDown size={13} className="mns-phase-chevron" />
            : <ChevronUp size={13} className="mns-phase-chevron" />
          }
        </button>

        {expanded && (
          <>
            {step.description && (
              <p className="mns-phase-desc">{step.description}</p>
            )}
            {step.pills.length > 0 && (
              <div className="mns-phase-pills">
                {step.pills.map(pill => (
                  <ActionPill key={pill.id} task={pill} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ─── Group flat tasks into phase steps ───────────────────────
function groupIntoPhases(tasks: AgentTask[]): PhaseStep[] {
  if (tasks.length === 0) return []

  // Each task becomes its own phase step (matching Manus pattern where each
  // "step" has a title, a description, and one or more action pills).
  // We cluster consecutive tasks with the same tool into one phase.
  const phases: PhaseStep[] = []
  let i = 0

  while (i < tasks.length) {
    const anchor = tasks[i]
    const sameTool: AgentTask[] = [anchor]

    // Collect subsequent tasks with same tool into the same phase
    while (i + 1 < tasks.length && tasks[i + 1].tool === anchor.tool) {
      i++
      sameTool.push(tasks[i])
    }

    const allDone = sameTool.every(t => t.status === 'done')
    const anyRunning = sameTool.some(t => t.status === 'running')
    const anyError = sameTool.some(t => t.status === 'error')
    const status = anyError ? 'error' : anyRunning ? 'running' : allDone ? 'done' : 'pending'

    // Generate a human-readable phase title from the first task label
    const title = generatePhaseTitle(anchor.label, anchor.tool ?? '')
    const description = generatePhaseDescription(anchor.tool ?? '', anchor.label, sameTool.length)

    phases.push({
      title,
      description,
      pills: sameTool,
      status,
      isLast: false,
    })

    i++
  }

  // Mark last phase
  if (phases.length > 0) {
    phases[phases.length - 1].isLast = true
  }

  return phases
}

function generatePhaseTitle(label: string, _tool: string): string {
  // Capitalize and clean up the label to use as a phase title
  const cleaned = label
    .replace(/^(run|execute|create|write|read|list|search|analyze)\s+/i, '')
    .replace(/\.(ts|tsx|js|jsx|py|json|md|css|html|sh)$/, '')
    .replace(/[-_]/g, ' ')
    .trim()

  // Capitalize first letter
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1)
}

function generatePhaseDescription(tool: string, label: string, count: number): string {
  const lbl = label.toLowerCase()

  if (tool === 'terminal') {
    if (lbl.includes('install') || lbl.includes('npm') || lbl.includes('pnpm')) {
      return 'Installerer avhengigheter og setter opp prosjektstrukturen.'
    }
    if (lbl.includes('zip') || lbl.includes('pack') || lbl.includes('archive')) {
      return 'Pakker filene for nedlasting.'
    }
    if (lbl.includes('test') || lbl.includes('run')) {
      return 'Kjører og verifiserer at koden fungerer som forventet.'
    }
    return 'Utfører kommandoer i terminalen for å fullføre oppgaven.'
  }

  if (tool === 'write_file') {
    if (count > 1) return `Skriver ${count} filer med nødvendig kode og konfigurasjon.`
    if (lbl.includes('config') || lbl.includes('settings')) {
      return 'Oppretter konfigurasjonsfil med riktige innstillinger.'
    }
    if (lbl.includes('readme') || lbl.includes('doc')) {
      return 'Skriver dokumentasjon med instruksjoner og forklaringer.'
    }
    return 'Skriver filen med implementasjonen.'
  }

  if (tool === 'read_file') {
    return 'Leser og analyserer eksisterende filer for å forstå konteksten.'
  }

  if (tool === 'web_search') {
    return 'Søker etter oppdatert informasjon og dokumentasjon.'
  }

  if (tool === 'run_code') {
    return 'Kjører koden og verifiserer at alt fungerer riktig.'
  }

  if (tool === 'list_files') {
    return 'Verifiserer filstrukturen og sjekker at alle filer er på plass.'
  }

  return 'Behandler oppgaven og forbereder neste steg.'
}

// ─── File card ────────────────────────────────────────────────
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
      <div className="manus-file-icon">{getFileIcon(file.type)}</div>
      <div className="manus-file-info">
        <div className="manus-file-name">{file.name}</div>
        <div className="manus-file-meta">{typeLabel}{file.size ? ` · ${file.size}` : ''}</div>
      </div>
      {hovered && onDownload && (
        <button className="manus-file-download" onClick={onDownload} title="Last ned">
          <Download size={13} />
          <span>Last ned</span>
        </button>
      )}
    </div>
  )
}

// ─── Main AgentChatMessage ────────────────────────────────────
export function AgentChatMessage({ message, onOpenFile, onSuggestion }: AgentChatMessageProps) {
  const tasks = message.agentTasks ?? []
  const files = message.agentFiles ?? []
  const suggestions = message.agentSuggestions ?? []
  const status = message.agentStatus ?? 'running'
  const isCompleted = status === 'completed'
  const isFailed = status === 'failed'

  const phases = groupIntoPhases(tasks)

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
      {/* Avatar row */}
      <div className="message-avatar-row">
        <img src="/sine/Sinev6.svg" alt="Sine" className="message-logo-img" />
        <span className="message-badge-clean" style={{ color: '#818CF8' }}>Agent</span>
      </div>

      {/* Content */}
      <div className="message-body" style={{ flex: 1, minWidth: 0 }}>

        {/* Intro text with markdown */}
        {message.content && (
          <div className="manus-agent-text">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                a({ href, children }) {
                  return (
                    <a href={href} target="_blank" rel="noopener noreferrer"
                      style={{ color: '#60A5FA', textDecoration: 'underline', cursor: 'pointer' }}>
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
                      background: 'rgba(255,255,255,0.06)',
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

        {/* Phase steps stream — Manus style */}
        {phases.length > 0 && (
          <div className="mns-phases-stream">
            {phases.map((phase, i) => (
              <PhaseStepView key={i} step={phase} />
            ))}
          </div>
        )}

        {/* Delivery section */}
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

        {/* Completed badge */}
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

        {/* Suggestions */}
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

// ─── File popup modal ─────────────────────────────────────────
interface FilePopupProps {
  file: AgentFile
  allFiles?: AgentFile[]
  onClose: () => void
  onDownload?: (file: AgentFile) => void
}

export function FilePopup({ file, allFiles = [], onClose, onDownload }: FilePopupProps) {
  const [selectedFile, setSelectedFile] = useState<AgentFile>(file)

  const handleDownload = (f: AgentFile) => {
    if (onDownload) { onDownload(f); return }
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
        <img src={`data:image/*;base64,${selectedFile.content}`} alt={selectedFile.name}
          style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', padding: 16 }} />
      )
    }
    return <pre className="file-popup-code">{selectedFile.content}</pre>
  }

  return (
    <div className="file-popup-overlay" onClick={onClose}>
      <div className="file-popup" onClick={e => e.stopPropagation()}>
        <div className="file-popup-header">
          <div className="file-popup-title">
            {getFileIcon(selectedFile.type)}
            <span>{selectedFile.name}</span>
          </div>
          <div className="file-popup-actions">
            <button className="file-popup-action-btn" onClick={() => handleDownload(selectedFile)} title="Last ned">
              <Download size={15} />
            </button>
            <button className="file-popup-action-btn" title="Åpne i ny fane"
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
            <button className="file-popup-action-btn file-popup-close" onClick={onClose} title="Lukk">✕</button>
          </div>
        </div>

        <div className="file-popup-body">
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
          <div className="file-popup-content">{renderContent()}</div>
        </div>
      </div>
    </div>
  )
}

// ─── Tool icon (exported) ─────────────────────────────────────
export function getToolIcon(tool: string) {
  return getToolMeta(tool).icon
}
