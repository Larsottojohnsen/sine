import { useState, useEffect, useRef } from 'react';
import type { AgentState, AgentLogEntry } from '../../hooks/useAgent';
import {
  X, Monitor, FileText, SkipBack, SkipForward,
  CheckCircle2, ChevronUp, ChevronDown
} from 'lucide-react';

interface AgentSidePanelProps {
  state: AgentState;
  onClose: () => void;
  onFetchFile: (path: string) => Promise<string>;
}

type PanelTab = 'terminal' | 'files';

function LogLine({ entry }: { entry: AgentLogEntry }) {
  const getColor = () => {
    switch (entry.type) {
      case 'tool_call': return '#60A5FA';
      case 'tool_result': return entry.success ? '#4ADE80' : '#F87171';
      case 'file_change': return '#A78BFA';
      case 'error': return '#F87171';
      case 'thinking': return '#94A3B8';
      default: return '#D1D5DB';
    }
  };

  const getPrefix = () => {
    switch (entry.type) {
      case 'tool_call': return '$ ';
      case 'tool_result': return entry.success ? '  ' : '✗ ';
      case 'error': return '✗ ';
      default: return '  ';
    }
  };

  return (
    <div style={{
      display: 'flex',
      gap: '0',
      padding: '1px 0',
      fontSize: '12px',
      lineHeight: '1.6',
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    }}>
      <span style={{ color: getColor(), whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
        <span style={{ opacity: 0.5 }}>{getPrefix()}</span>
        {entry.message}
      </span>
    </div>
  );
}

export default function AgentSidePanel({ state, onClose, onFetchFile }: AgentSidePanelProps) {
  const [activeTab, setActiveTab] = useState<PanelTab>('terminal');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [loadingFile, setLoadingFile] = useState(false);
  const [taskExpanded, setTaskExpanded] = useState(true);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeTab === 'terminal') {
      logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [state.logs, activeTab]);

  const handleFileClick = async (path: string) => {
    setSelectedFile(path);
    setLoadingFile(true);
    const content = await onFetchFile(path);
    setFileContent(content);
    setLoadingFile(false);
  };

  const getFileIcon = (path: string) => {
    const ext = path.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'py': return '🐍';
      case 'js': case 'ts': case 'tsx': case 'jsx': return '📜';
      case 'json': return '{}';
      case 'md': return '📝';
      case 'html': return '🌐';
      case 'css': return '🎨';
      case 'sh': return '⚙️';
      default: return '📄';
    }
  };

  const isActive = ['planning', 'running'].includes(state.status);
  const lastTask = state.liveTasks?.slice(-1)[0];
  const totalTasks = state.liveTasks?.length ?? 0;
  const doneTasks = state.liveTasks?.filter(t => t.status === 'done').length ?? 0;

  // Finn siste terminal-kommando for header-linje
  const lastTerminalLog = [...state.logs].reverse().find(l => l.type === 'tool_call');

  return (
    <div className="computer-panel">
      {/* ── Tittel-rad ─────────────────────────────────────── */}
      <div className="computer-panel-header">
        <div className="computer-panel-title">
          <Monitor size={15} style={{ color: '#9A9A9A' }} />
          <span>Sine's Computer</span>
        </div>

        {/* Faner */}
        <div className="computer-panel-tabs">
          <button
            className={`computer-tab${activeTab === 'terminal' ? ' active' : ''}`}
            onClick={() => setActiveTab('terminal')}
          >
            <Monitor size={12} />
            Terminal
          </button>
          <button
            className={`computer-tab${activeTab === 'files' ? ' active' : ''}`}
            onClick={() => setActiveTab('files')}
          >
            <FileText size={12} />
            Filer {state.files.length > 0 && `(${state.files.length})`}
          </button>
        </div>

        {/* Lukk */}
        <button className="computer-panel-close" onClick={onClose}>
          <X size={14} />
        </button>
      </div>

      {/* ── Aktiv kommando-linje ───────────────────────────── */}
      {lastTerminalLog && (
        <div className="computer-panel-status-bar">
          <span className="computer-panel-status-icon">▶</span>
          <span className="computer-panel-status-text">
            {isActive ? 'Kjører kommando' : 'Siste kommando'}
          </span>
          <span className="computer-panel-status-cmd">
            {lastTerminalLog.message.slice(0, 60)}
            {lastTerminalLog.message.length > 60 ? '…' : ''}
          </span>
        </div>
      )}

      {/* ── Innhold ────────────────────────────────────────── */}
      <div className="computer-panel-body">
        {activeTab === 'terminal' && (
          <div className="computer-terminal">
            {/* Terminal-tittel */}
            <div className="computer-terminal-title">
              {state.currentTask ? state.currentTask.slice(0, 30) : 'build'}
            </div>

            {/* Terminal-innhold */}
            <div className="computer-terminal-content">
              {/* Prompt-linje */}
              <div style={{
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                fontSize: 12,
                marginBottom: 4,
              }}>
                <span style={{ color: '#4ADE80' }}>ubuntu@sandbox:~</span>
                <span style={{ color: '#60A5FA' }}>/sine</span>
                <span style={{ color: '#E5E5E5' }}> $</span>
              </div>

              {state.logs.length === 0 ? (
                <div style={{ color: '#4B5563', fontSize: 12, fontFamily: 'monospace' }}>
                  Venter på agent-aktivitet...
                </div>
              ) : (
                state.logs.map(entry => <LogLine key={entry.id} entry={entry} />)
              )}

              {/* Blinkende cursor */}
              {isActive && (
                <div style={{
                  display: 'inline-block',
                  width: 8,
                  height: 14,
                  background: '#E5E5E5',
                  marginTop: 2,
                  animation: 'blink 1s step-end infinite',
                }} />
              )}
              <div ref={logsEndRef} />
            </div>
          </div>
        )}

        {activeTab === 'files' && (
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            {/* Filliste */}
            <div style={{
              width: selectedFile ? '180px' : '100%',
              minWidth: '180px',
              borderRight: selectedFile ? '1px solid #2A2A2A' : 'none',
              overflowY: 'auto',
              padding: '8px',
            }}>
              {state.files.length === 0 ? (
                <div style={{ color: '#4B5563', fontSize: 12, padding: 8, fontFamily: 'monospace' }}>
                  Ingen filer ennå...
                </div>
              ) : (
                state.files.map(file => (
                  <div
                    key={file.path}
                    onClick={() => handleFileClick(file.path)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '6px 8px',
                      borderRadius: 6,
                      cursor: 'pointer',
                      background: selectedFile === file.path ? '#2A2A2A' : 'transparent',
                      marginBottom: 2,
                    }}
                    onMouseEnter={e => {
                      if (selectedFile !== file.path)
                        e.currentTarget.style.background = '#1E1E1E'
                    }}
                    onMouseLeave={e => {
                      if (selectedFile !== file.path)
                        e.currentTarget.style.background = 'transparent'
                    }}
                  >
                    <span style={{ fontSize: 13 }}>{getFileIcon(file.path)}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 12,
                        color: '#E5E5E5',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {file.path.split('/').pop()}
                      </div>
                      <div style={{ fontSize: 10, color: '#6B7280' }}>
                        {file.path.includes('/') ? file.path.split('/').slice(0, -1).join('/') : ''}
                      </div>
                    </div>
                    <span style={{
                      fontSize: 10,
                      padding: '1px 5px',
                      borderRadius: 3,
                      background: file.action === 'created'
                        ? 'rgba(34,197,94,0.15)'
                        : 'rgba(167,139,250,0.15)',
                      color: file.action === 'created' ? '#4ADE80' : '#A78BFA',
                      flexShrink: 0,
                    }}>
                      {file.action === 'created' ? 'Ny' : 'Endret'}
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* Fil-innhold */}
            {selectedFile && (
              <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div style={{
                  padding: '8px 12px',
                  borderBottom: '1px solid #2A2A2A',
                  fontSize: 11,
                  color: '#6B7280',
                  fontFamily: 'monospace',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <span>{selectedFile}</span>
                  <button
                    onClick={() => setSelectedFile(null)}
                    style={{ background: 'transparent', border: 'none', color: '#6B7280', cursor: 'pointer', fontSize: 12 }}
                  >
                    ✕
                  </button>
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: 12, background: '#0D0D0D' }}>
                  {loadingFile ? (
                    <div style={{ color: '#6B7280', fontSize: 12, fontFamily: 'monospace' }}>Laster...</div>
                  ) : (
                    <pre style={{
                      margin: 0,
                      fontSize: 11.5,
                      lineHeight: 1.6,
                      color: '#D1D5DB',
                      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-all',
                    }}>
                      {fileContent}
                    </pre>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Playback-bar ───────────────────────────────────── */}
      <div className="computer-playback-bar">
        <button className="computer-playback-btn" title="Tilbake">
          <SkipBack size={13} />
        </button>
        <button className="computer-playback-btn" title="Frem">
          <SkipForward size={13} />
        </button>

        {/* Progress-linje */}
        <div className="computer-playback-track">
          <div
            className="computer-playback-fill"
            style={{
              width: totalTasks > 0 ? `${(doneTasks / totalTasks) * 100}%` : (isActive ? '60%' : '100%'),
            }}
          />
          <div
            className="computer-playback-dot"
            style={{
              left: totalTasks > 0 ? `calc(${(doneTasks / totalTasks) * 100}% - 5px)` : (isActive ? 'calc(60% - 5px)' : 'calc(100% - 5px)'),
            }}
          />
        </div>

        {/* Live-indikator */}
        <div className="computer-live-badge">
          {isActive && <span className="computer-live-dot" />}
          <span style={{ fontSize: 11, color: isActive ? '#E5E5E5' : '#6B7280' }}>
            {isActive ? 'live' : 'ferdig'}
          </span>
        </div>
      </div>

      {/* ── Task-footer ────────────────────────────────────── */}
      <div
        className="computer-task-footer"
        onClick={() => setTaskExpanded(v => !v)}
      >
        <CheckCircle2 size={14} style={{ color: '#4ADE80', flexShrink: 0 }} />
        <span className="computer-task-footer-label">
          {lastTask?.label ?? state.currentTask ?? 'Venter...'}
        </span>
        <span className="computer-task-footer-counter">
          {doneTasks}/{totalTasks}
        </span>
        {taskExpanded
          ? <ChevronUp size={13} style={{ color: '#6B7280', flexShrink: 0 }} />
          : <ChevronDown size={13} style={{ color: '#6B7280', flexShrink: 0 }} />
        }
      </div>
    </div>
  );
}
