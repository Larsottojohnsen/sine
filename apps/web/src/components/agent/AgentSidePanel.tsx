import { useState, useEffect, useRef } from 'react';
import type { AgentState, AgentLogEntry } from '../../hooks/useAgent';
import {
  X, Monitor, FileText, SkipBack, SkipForward, Play, Pause,
  CheckCircle2, ChevronUp, ChevronDown, Terminal, Edit3
} from 'lucide-react';

interface AgentSidePanelProps {
  state: AgentState;
  onClose: () => void;
  onFetchFile: (path: string) => Promise<string>;
}

type PanelTab = 'terminal' | 'files';

// ─── Syntax highlight helper ──────────────────────────────────
function syntaxHighlight(code: string, ext: string): React.ReactNode[] {
  if (!['ts', 'tsx', 'js', 'jsx', 'py', 'json', 'css', 'html', 'sh', 'bash', 'md'].includes(ext)) {
    return [<span key="plain" style={{ color: '#D1D5DB' }}>{code}</span>];
  }

  const lines = code.split('\n');
  return lines.map((line, i) => {
    let color = '#D1D5DB';
    const trimmed = line.trim();

    // Comments
    if (trimmed.startsWith('//') || trimmed.startsWith('#') || trimmed.startsWith('*') || trimmed.startsWith('/*')) {
      color = '#6B7280';
    }
    // Keywords
    else if (/^(import|export|const|let|var|function|class|return|if|else|for|while|async|await|type|interface|from|default|extends|implements)\b/.test(trimmed)) {
      color = '#C084FC';
    }
    // Strings
    else if (/^['"`]/.test(trimmed) || (trimmed.includes(': "') || trimmed.includes(': \''))) {
      color = '#86EFAC';
    }
    // JSON keys
    else if (ext === 'json' && /^"[^"]+":/.test(trimmed)) {
      color = '#93C5FD';
    }
    // CSS properties
    else if (ext === 'css' && trimmed.includes(':')) {
      color = '#67E8F9';
    }
    // Markdown headings
    else if (ext === 'md' && trimmed.startsWith('#')) {
      color = '#FCA5A5';
    }

    return (
      <div key={i} style={{ color, lineHeight: '1.6', minHeight: '1.6em' }}>
        {line || '\u00A0'}
      </div>
    );
  });
}

// ─── Log line ─────────────────────────────────────────────────
function LogLine({ entry }: { entry: AgentLogEntry }) {
  const getColor = () => {
    switch (entry.type) {
      case 'tool_call': return '#93C5FD';
      case 'tool_result': return entry.success ? '#86EFAC' : '#F87171';
      case 'file_change': return '#C084FC';
      case 'error': return '#F87171';
      case 'thinking': return '#6B7280';
      default: return '#D1D5DB';
    }
  };

  const getPrefix = () => {
    switch (entry.type) {
      case 'tool_call': return '$ ';
      case 'tool_result': return entry.success ? '  ✓ ' : '  ✗ ';
      case 'file_change': return '  ~ ';
      case 'error': return '  ✗ ';
      default: return '  ';
    }
  };

  return (
    <div style={{
      display: 'flex',
      padding: '1px 0',
      fontSize: '12px',
      lineHeight: '1.65',
      fontFamily: '"SF Mono", "Fira Code", "Fira Mono", "Roboto Mono", Menlo, Monaco, Consolas, monospace',
    }}>
      <span style={{ color: getColor(), whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
        <span style={{ opacity: 0.55 }}>{getPrefix()}</span>
        {entry.message}
      </span>
    </div>
  );
}

// ─── File icon ────────────────────────────────────────────────
function getFileIcon(path: string): React.ReactNode {
  const ext = path.split('.').pop()?.toLowerCase() ?? '';
  const iconStyle: React.CSSProperties = {
    width: 14, height: 14, display: 'inline-flex', alignItems: 'center',
    justifyContent: 'center', flexShrink: 0,
  };

  if (['ts', 'tsx'].includes(ext)) {
    return <span style={{ ...iconStyle, color: '#60A5FA', fontSize: 10, fontWeight: 700, fontFamily: 'monospace' }}>TS</span>;
  }
  if (['js', 'jsx'].includes(ext)) {
    return <span style={{ ...iconStyle, color: '#F59E0B', fontSize: 10, fontWeight: 700, fontFamily: 'monospace' }}>JS</span>;
  }
  if (ext === 'py') {
    return <span style={{ ...iconStyle, color: '#4ADE80', fontSize: 10, fontWeight: 700, fontFamily: 'monospace' }}>PY</span>;
  }
  if (ext === 'json') {
    return <span style={{ ...iconStyle, color: '#C084FC', fontSize: 10, fontWeight: 700, fontFamily: 'monospace' }}>{'{}'}</span>;
  }
  if (ext === 'md') {
    return <span style={{ ...iconStyle, color: '#94A3B8', fontSize: 10, fontWeight: 700, fontFamily: 'monospace' }}>MD</span>;
  }
  if (ext === 'css') {
    return <span style={{ ...iconStyle, color: '#F472B6', fontSize: 10, fontWeight: 700, fontFamily: 'monospace' }}>CS</span>;
  }
  if (['html', 'htm'].includes(ext)) {
    return <span style={{ ...iconStyle, color: '#FB923C', fontSize: 10, fontWeight: 700, fontFamily: 'monospace' }}>HT</span>;
  }
  if (['sh', 'bash'].includes(ext)) {
    return <Terminal size={12} style={{ color: '#86EFAC' }} />;
  }
  return <Edit3 size={12} style={{ color: '#9CA3AF' }} />;
}

// ─── Main panel ───────────────────────────────────────────────
export default function AgentSidePanel({ state, onClose, onFetchFile }: AgentSidePanelProps) {
  const [activeTab, setActiveTab] = useState<PanelTab>('terminal');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [loadingFile, setLoadingFile] = useState(false);
  const [taskExpanded, setTaskExpanded] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeTab === 'terminal' && isPlaying) {
      logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [state.logs, activeTab, isPlaying]);

  const handleFileClick = async (path: string) => {
    setSelectedFile(path);
    setLoadingFile(true);
    setActiveTab('files');
    const content = await onFetchFile(path);
    setFileContent(content);
    setLoadingFile(false);
  };

  const isActive = ['planning', 'running'].includes(state.status);
  const lastTask = state.liveTasks?.slice(-1)[0];
  const totalTasks = state.liveTasks?.length ?? 0;
  const doneTasks = state.liveTasks?.filter(t => t.status === 'done').length ?? 0;
  const progressPct = totalTasks > 0 ? (doneTasks / totalTasks) * 100 : (isActive ? 60 : 100);

  // Last tool call for the status bar
  const lastToolCall = [...state.logs].reverse().find(l => l.type === 'tool_call' || l.type === 'file_change');
  const lastFileChange = [...state.logs].reverse().find(l => l.type === 'file_change');

  // File extension for syntax highlighting
  const selectedExt = selectedFile?.split('.').pop()?.toLowerCase() ?? '';

  return (
    <div className="computer-panel">

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="computer-panel-header">
        <div className="computer-panel-title">
          <Monitor size={14} style={{ color: '#9A9A9A' }} />
          <span>Sine's Computer</span>
        </div>

        <div className="computer-panel-tabs">
          <button
            className={`computer-tab${activeTab === 'terminal' ? ' active' : ''}`}
            onClick={() => setActiveTab('terminal')}
          >
            <Terminal size={11} />
            Terminal
          </button>
          <button
            className={`computer-tab${activeTab === 'files' ? ' active' : ''}`}
            onClick={() => setActiveTab('files')}
          >
            <FileText size={11} />
            Filer {state.files.length > 0 && `(${state.files.length})`}
          </button>
        </div>

        <button className="computer-panel-close" onClick={onClose}>
          <X size={14} />
        </button>
      </div>

      {/* ── Active file/command breadcrumb bar ─────────────── */}
      {lastToolCall && (
        <div className="computer-panel-status-bar">
          {lastFileChange ? (
            <>
              <Edit3 size={11} style={{ color: '#9CA3AF', flexShrink: 0 }} />
              <span className="computer-panel-status-text">
                {isActive ? 'Redigerer' : 'Redigerte'}
              </span>
              <span className="computer-panel-status-cmd">
                {lastFileChange.message.length > 55
                  ? '…' + lastFileChange.message.slice(-55)
                  : lastFileChange.message}
              </span>
            </>
          ) : (
            <>
              <Terminal size={11} style={{ color: '#9CA3AF', flexShrink: 0 }} />
              <span className="computer-panel-status-text">
                {isActive ? 'Kjører' : 'Kjørte'}
              </span>
              <span className="computer-panel-status-cmd">
                {lastToolCall.message.length > 55
                  ? lastToolCall.message.slice(0, 55) + '…'
                  : lastToolCall.message}
              </span>
            </>
          )}
        </div>
      )}

      {/* ── Body ───────────────────────────────────────────── */}
      <div className="computer-panel-body">

        {/* Terminal tab */}
        {activeTab === 'terminal' && (
          <div className="computer-terminal">
            <div className="computer-terminal-title">
              <Terminal size={11} style={{ color: '#6B7280' }} />
              <span>{state.currentTask ? state.currentTask.slice(0, 35) : 'bash'}</span>
            </div>

            <div className="computer-terminal-content">
              {/* Prompt */}
              <div style={{
                fontFamily: '"SF Mono", "Fira Code", Menlo, monospace',
                fontSize: 12,
                marginBottom: 6,
                display: 'flex',
                gap: 0,
              }}>
                <span style={{ color: '#86EFAC' }}>ubuntu@sandbox</span>
                <span style={{ color: '#6B7280' }}>:</span>
                <span style={{ color: '#93C5FD' }}>~/sine</span>
                <span style={{ color: '#D1D5DB' }}> $</span>
              </div>

              {state.logs.length === 0 ? (
                <div style={{ color: '#374151', fontSize: 12, fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 8, height: 14, background: '#374151', animation: 'blink 1s step-end infinite' }} />
                  <span>Venter på agent-aktivitet...</span>
                </div>
              ) : (
                state.logs.map(entry => <LogLine key={entry.id} entry={entry} />)
              )}

              {/* Blinking cursor */}
              {isActive && (
                <div style={{
                  display: 'inline-block',
                  width: 7,
                  height: 14,
                  background: '#D1D5DB',
                  marginTop: 3,
                  animation: 'blink 1s step-end infinite',
                  verticalAlign: 'middle',
                }} />
              )}
              <div ref={logsEndRef} />
            </div>
          </div>
        )}

        {/* Files tab */}
        {activeTab === 'files' && (
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

            {/* File tree sidebar */}
            <div style={{
              width: selectedFile ? '160px' : '100%',
              minWidth: '160px',
              borderRight: selectedFile ? '1px solid #1E1E1E' : 'none',
              overflowY: 'auto',
              padding: '6px 4px',
            }}>
              {state.files.length === 0 ? (
                <div style={{ color: '#374151', fontSize: 12, padding: '8px 12px', fontFamily: 'monospace' }}>
                  Ingen filer ennå...
                </div>
              ) : (
                state.files.map(file => {
                  const fname = file.path.split('/').pop() ?? file.path;
                  const fdir = file.path.includes('/') ? file.path.split('/').slice(0, -1).join('/') : '';
                  const isSelected = selectedFile === file.path;
                  return (
                    <div
                      key={file.path}
                      onClick={() => handleFileClick(file.path)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 7,
                        padding: '5px 8px',
                        borderRadius: 5,
                        cursor: 'pointer',
                        background: isSelected ? '#1E1E1E' : 'transparent',
                        marginBottom: 1,
                        transition: 'background 0.1s',
                      }}
                      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#161616' }}
                      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent' }}
                    >
                      {getFileIcon(file.path)}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: 12,
                          color: isSelected ? '#F3F4F6' : '#D1D5DB',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          fontFamily: '"SF Mono", Menlo, monospace',
                        }}>
                          {fname}
                        </div>
                        {fdir && (
                          <div style={{ fontSize: 10, color: '#4B5563', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {fdir}
                          </div>
                        )}
                      </div>
                      <span style={{
                        fontSize: 9,
                        padding: '1px 4px',
                        borderRadius: 3,
                        background: file.action === 'created' ? 'rgba(74,222,128,0.12)' : 'rgba(167,139,250,0.12)',
                        color: file.action === 'created' ? '#4ADE80' : '#A78BFA',
                        flexShrink: 0,
                        fontWeight: 600,
                        letterSpacing: '0.02em',
                      }}>
                        {file.action === 'created' ? 'NY' : 'MOD'}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            {/* File content viewer */}
            {selectedFile && (
              <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', background: '#0D0D0D' }}>
                {/* File title bar */}
                <div style={{
                  padding: '7px 12px',
                  borderBottom: '1px solid #1E1E1E',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  background: '#111',
                }}>
                  {getFileIcon(selectedFile)}
                  <span style={{
                    fontSize: 12,
                    color: '#D1D5DB',
                    fontFamily: '"SF Mono", Menlo, monospace',
                    flex: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {selectedFile.split('/').pop()}
                  </span>
                  <button
                    onClick={() => setSelectedFile(null)}
                    style={{
                      background: 'transparent', border: 'none', color: '#4B5563',
                      cursor: 'pointer', fontSize: 14, padding: '0 2px',
                      lineHeight: 1, display: 'flex', alignItems: 'center',
                    }}
                  >
                    ✕
                  </button>
                </div>

                {/* Code content */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
                  {loadingFile ? (
                    <div style={{ color: '#4B5563', fontSize: 12, fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 8, height: 14, background: '#4B5563', animation: 'blink 1s step-end infinite' }} />
                      <span>Laster fil...</span>
                    </div>
                  ) : (
                    <div style={{
                      fontSize: 12,
                      lineHeight: 1.65,
                      fontFamily: '"SF Mono", "Fira Code", "Fira Mono", Menlo, Monaco, Consolas, monospace',
                    }}>
                      {syntaxHighlight(fileContent, selectedExt)}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Playback bar ───────────────────────────────────── */}
      <div className="computer-playback-bar">
        <button
          className="computer-playback-btn"
          title="Tilbake"
          onClick={() => {}}
        >
          <SkipBack size={12} />
        </button>
        <button
          className="computer-playback-btn"
          title={isPlaying ? 'Pause' : 'Spill av'}
          onClick={() => setIsPlaying(p => !p)}
        >
          {isPlaying ? <Pause size={12} /> : <Play size={12} />}
        </button>
        <button
          className="computer-playback-btn"
          title="Frem"
          onClick={() => {}}
        >
          <SkipForward size={12} />
        </button>

        {/* Progress track */}
        <div className="computer-playback-track">
          <div
            className="computer-playback-fill"
            style={{ width: `${progressPct}%` }}
          />
          <div
            className="computer-playback-dot"
            style={{ left: `calc(${progressPct}% - 5px)` }}
          />
        </div>

        {/* Live / done indicator */}
        <div className="computer-live-badge">
          {isActive && <span className="computer-live-dot" />}
          <span style={{ fontSize: 11, color: isActive ? '#E5E5E5' : '#6B7280' }}>
            {isActive ? 'live' : 'ferdig'}
          </span>
        </div>
      </div>

      {/* ── Task footer ────────────────────────────────────── */}
      <div
        className="computer-task-footer"
        onClick={() => setTaskExpanded(v => !v)}
      >
        <CheckCircle2 size={13} style={{ color: isActive ? '#60A5FA' : '#4ADE80', flexShrink: 0 }} />
        <span className="computer-task-footer-label">
          {lastTask?.label ?? state.currentTask ?? 'Venter...'}
        </span>
        <span className="computer-task-footer-counter">
          {doneTasks}/{totalTasks}
        </span>
        {taskExpanded
          ? <ChevronUp size={12} style={{ color: '#6B7280', flexShrink: 0 }} />
          : <ChevronDown size={12} style={{ color: '#6B7280', flexShrink: 0 }} />
        }
      </div>
    </div>
  );
}
