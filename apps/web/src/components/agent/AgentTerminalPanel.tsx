import { useEffect, useRef } from 'react';
import type { AgentState, AgentLogEntry } from '../../hooks/useAgent';

interface AgentTerminalPanelProps {
  state: AgentState;
  onExpand: () => void;
  onStop: () => void;
  onApprove: (approved: boolean) => void;
}

function getStatusColor(status: AgentState['status']): string {
  switch (status) {
    case 'planning': return '#F59E0B';
    case 'running': return '#3B82F6';
    case 'completed': return '#22C55E';
    case 'failed': return '#EF4444';
    case 'stopped': return '#6B7280';
    case 'waiting_approval': return '#F97316';
    default: return '#6B7280';
  }
}

function getStatusLabel(status: AgentState['status']): string {
  switch (status) {
    case 'planning': return 'Planlegger...';
    case 'running': return 'Kjører...';
    case 'completed': return 'Fullført';
    case 'failed': return 'Feilet';
    case 'stopped': return 'Stoppet';
    case 'waiting_approval': return 'Venter på godkjenning';
    default: return 'Inaktiv';
  }
}

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

  return (
    <div style={{
      display: 'flex',
      gap: '6px',
      padding: '1px 0',
      fontSize: '11.5px',
      lineHeight: '1.5',
      color: getColor(),
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    }}>
      <span style={{ opacity: 0.7, flexShrink: 0 }}>{getIcon()}</span>
      <span style={{ wordBreak: 'break-all' }}>{entry.message}</span>
    </div>
  );
}

export default function AgentTerminalPanel({
  state,
  onExpand,
  onStop,
  onApprove,
}: AgentTerminalPanelProps) {
  const logsEndRef = useRef<HTMLDivElement>(null);
  const statusColor = getStatusColor(state.status);
  const isActive = ['planning', 'running', 'waiting_approval'].includes(state.status);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.logs]);

  const lastLog = state.logs[state.logs.length - 1];
  const recentFiles = state.files.slice(-3);

  return (
    <div style={{
      background: '#1A1A1A',
      border: '1px solid #2A2A2A',
      borderRadius: '12px',
      overflow: 'hidden',
      marginBottom: '8px',
    }}>
      {/* Header */}
      <div
        onClick={onExpand}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '10px 14px',
          cursor: 'pointer',
          borderBottom: state.logs.length > 0 ? '1px solid #2A2A2A' : 'none',
        }}
      >
        {/* Status-indikator */}
        <div style={{ position: 'relative', width: '10px', height: '10px', flexShrink: 0 }}>
          <div style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            background: statusColor,
          }} />
          {isActive && (
            <div style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              background: statusColor,
              opacity: 0.4,
              animation: 'pulse 1.5s ease-in-out infinite',
            }} />
          )}
        </div>

        {/* Status-tekst */}
        <span style={{
          fontSize: '13px',
          color: '#E5E5E5',
          fontWeight: 500,
          flex: 1,
        }}>
          {getStatusLabel(state.status)}
        </span>

        {/* Siste handling */}
        {lastLog && (
          <span style={{
            fontSize: '12px',
            color: '#6B7280',
            maxWidth: '300px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {lastLog.message.slice(0, 60)}
          </span>
        )}

        {/* Fil-badges */}
        {recentFiles.length > 0 && (
          <div style={{ display: 'flex', gap: '4px' }}>
            {recentFiles.map(f => (
              <span key={f.path} style={{
                fontSize: '11px',
                padding: '1px 6px',
                borderRadius: '4px',
                background: f.action === 'created' ? 'rgba(34,197,94,0.15)' : 'rgba(167,139,250,0.15)',
                color: f.action === 'created' ? '#4ADE80' : '#A78BFA',
                fontFamily: 'monospace',
              }}>
                {f.path.split('/').pop()}
              </span>
            ))}
          </div>
        )}

        {/* Knapper */}
        <div style={{ display: 'flex', gap: '6px', marginLeft: '8px' }}>
          {/* Expand */}
          <button
            onClick={(e) => { e.stopPropagation(); onExpand(); }}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#6B7280',
              cursor: 'pointer',
              padding: '2px 6px',
              borderRadius: '4px',
              fontSize: '12px',
            }}
            title="Åpne terminal"
          >
            ⤢
          </button>

          {/* Stop */}
          {isActive && (
            <button
              onClick={(e) => { e.stopPropagation(); onStop(); }}
              style={{
                background: 'rgba(239,68,68,0.15)',
                border: '1px solid rgba(239,68,68,0.3)',
                color: '#F87171',
                cursor: 'pointer',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '11px',
              }}
            >
              Stopp
            </button>
          )}
        </div>
      </div>

      {/* Terminal-logg (kompakt, 4 linjer) */}
      {state.logs.length > 0 && (
        <div style={{
          padding: '8px 14px',
          maxHeight: '80px',
          overflowY: 'hidden',
          background: '#141414',
        }}>
          {state.logs.slice(-4).map(entry => (
            <LogLine key={entry.id} entry={entry} />
          ))}
          <div ref={logsEndRef} />
        </div>
      )}

      {/* Godkjennings-panel */}
      {state.pendingApproval && (
        <div style={{
          padding: '10px 14px',
          background: 'rgba(249,115,22,0.08)',
          borderTop: '1px solid rgba(249,115,22,0.2)',
        }}>
          <div style={{ fontSize: '12px', color: '#FB923C', marginBottom: '8px' }}>
            ⚠️ Krever godkjenning: {state.pendingApproval.description}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => onApprove(true)}
              style={{
                background: '#22C55E',
                border: 'none',
                color: '#000',
                padding: '4px 12px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 600,
              }}
            >
              Godkjenn
            </button>
            <button
              onClick={() => onApprove(false)}
              style={{
                background: 'rgba(239,68,68,0.2)',
                border: '1px solid rgba(239,68,68,0.3)',
                color: '#F87171',
                padding: '4px 12px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              Avvis
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
