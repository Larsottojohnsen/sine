import { useState, useEffect, useRef } from 'react';
import type { AgentState, AgentLogEntry } from '../../hooks/useAgent';

interface AgentSidePanelProps {
  state: AgentState;
  onClose: () => void;
  onFetchFile: (path: string) => Promise<string>;
}

type PanelTab = 'terminal' | 'files';

function LogLine({ entry }: { entry: AgentLogEntry }) {
  const getIcon = () => {
    switch (entry.type) {
      case 'tool_call': return '⚡';
      case 'tool_result': return entry.success ? '✓' : '✗';
      case 'file_change': return '📄';
      case 'error': return '✗';
      case 'thinking': return '💭';
      default: return '›';
    }
  };

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

  const time = new Date(entry.timestamp).toLocaleTimeString('no-NO', {
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  });

  return (
    <div style={{
      display: 'flex',
      gap: '8px',
      padding: '3px 0',
      fontSize: '12px',
      lineHeight: '1.5',
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
      borderBottom: '1px solid rgba(255,255,255,0.03)',
    }}>
      <span style={{ color: '#4B5563', flexShrink: 0, fontSize: '11px' }}>{time}</span>
      <span style={{ color: getColor(), opacity: 0.7, flexShrink: 0 }}>{getIcon()}</span>
      <span style={{ color: getColor(), wordBreak: 'break-all' }}>{entry.message}</span>
    </div>
  );
}

export default function AgentSidePanel({ state, onClose, onFetchFile }: AgentSidePanelProps) {
  const [activeTab, setActiveTab] = useState<PanelTab>('terminal');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [loadingFile, setLoadingFile] = useState(false);
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

  return (
    <div style={{
      width: '420px',
      minWidth: '420px',
      background: '#141414',
      borderLeft: '1px solid #2A2A2A',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: '12px 16px',
        borderBottom: '1px solid #2A2A2A',
        gap: '8px',
      }}>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: '2px', flex: 1 }}>
          {(['terminal', 'files'] as PanelTab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                background: activeTab === tab ? '#2A2A2A' : 'transparent',
                border: 'none',
                color: activeTab === tab ? '#E5E5E5' : '#6B7280',
                padding: '4px 12px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: activeTab === tab ? 500 : 400,
                textTransform: 'capitalize',
              }}
            >
              {tab === 'terminal' ? '⌨️ Terminal' : `📁 Filer (${state.files.length})`}
            </button>
          ))}
        </div>

        {/* Lukk */}
        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#6B7280',
            cursor: 'pointer',
            fontSize: '16px',
            padding: '2px 6px',
            borderRadius: '4px',
          }}
        >
          ✕
        </button>
      </div>

      {/* Innhold */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {activeTab === 'terminal' && (
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '12px 16px',
            background: '#0D0D0D',
          }}>
            {state.logs.length === 0 ? (
              <div style={{ color: '#4B5563', fontSize: '12px', fontFamily: 'monospace' }}>
                Venter på agent-aktivitet...
              </div>
            ) : (
              state.logs.map(entry => <LogLine key={entry.id} entry={entry} />)
            )}
            <div ref={logsEndRef} />
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
                <div style={{ color: '#4B5563', fontSize: '12px', padding: '8px' }}>
                  Ingen filer ennå
                </div>
              ) : (
                state.files.map(file => (
                  <div
                    key={file.path}
                    onClick={() => handleFileClick(file.path)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 8px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      background: selectedFile === file.path ? '#2A2A2A' : 'transparent',
                      marginBottom: '2px',
                    }}
                  >
                    <span style={{ fontSize: '13px' }}>{getFileIcon(file.path)}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: '12px',
                        color: '#E5E5E5',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {file.path.split('/').pop()}
                      </div>
                      <div style={{ fontSize: '10px', color: '#6B7280' }}>
                        {file.path.includes('/') ? file.path.split('/').slice(0, -1).join('/') : ''}
                      </div>
                    </div>
                    <span style={{
                      fontSize: '10px',
                      padding: '1px 5px',
                      borderRadius: '3px',
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
                  fontSize: '11px',
                  color: '#6B7280',
                  fontFamily: 'monospace',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <span>{selectedFile}</span>
                  <button
                    onClick={() => setSelectedFile(null)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#6B7280',
                      cursor: 'pointer',
                      fontSize: '12px',
                    }}
                  >
                    ✕
                  </button>
                </div>
                <div style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '12px',
                  background: '#0D0D0D',
                }}>
                  {loadingFile ? (
                    <div style={{ color: '#6B7280', fontSize: '12px', fontFamily: 'monospace' }}>
                      Laster...
                    </div>
                  ) : (
                    <pre style={{
                      margin: 0,
                      fontSize: '11.5px',
                      lineHeight: '1.6',
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
    </div>
  );
}
