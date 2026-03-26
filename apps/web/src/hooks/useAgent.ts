import { useState, useCallback, useRef, useEffect } from 'react';

export type AgentMode = 'safe' | 'power';
export type AgentStatus = 'idle' | 'planning' | 'running' | 'waiting_approval' | 'completed' | 'failed' | 'stopped';

export interface AgentLogEntry {
  id: string;
  type: 'thinking' | 'tool_call' | 'tool_result' | 'log' | 'error' | 'file_change';
  message: string;
  tool?: string;
  args?: Record<string, unknown>;
  success?: boolean;
  timestamp: number;
}

export interface AgentFile {
  path: string;
  action: 'created' | 'modified' | 'existing';
  content?: string;
}

export interface AgentState {
  runId: string | null;
  status: AgentStatus;
  logs: AgentLogEntry[];
  files: AgentFile[];
  currentTask: string;
  pendingApproval: {
    tool: string;
    args: Record<string, unknown>;
    description: string;
  } | null;
  mode: AgentMode;
}

const API_BASE = import.meta.env.VITE_API_URL || 'https://sine-api.railway.app';
const WS_BASE = API_BASE.replace('https://', 'wss://').replace('http://', 'ws://');

export function useAgent() {
  const [state, setState] = useState<AgentState>({
    runId: null,
    status: 'idle',
    logs: [],
    files: [],
    currentTask: '',
    pendingApproval: null,
    mode: 'safe',
  });

  const wsRef = useRef<WebSocket | null>(null);
  const runIdRef = useRef<string | null>(null);

  const addLog = useCallback((entry: Omit<AgentLogEntry, 'id' | 'timestamp'>) => {
    setState(prev => ({
      ...prev,
      logs: [...prev.logs, {
        ...entry,
        id: Math.random().toString(36).slice(2),
        timestamp: Date.now(),
      }]
    }));
  }, []);

  const startAgent = useCallback(async (task: string, mode: AgentMode = 'safe') => {
    // Lukk eksisterende WS
    if (wsRef.current) {
      wsRef.current.close();
    }

    setState(prev => ({
      ...prev,
      status: 'planning',
      logs: [],
      files: [],
      currentTask: task,
      pendingApproval: null,
      mode,
    }));

    try {
      // Start agent-kjøring
      const res = await fetch(`${API_BASE}/api/agent/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task, mode }),
      });

      if (!res.ok) throw new Error(`API-feil: ${res.status}`);
      const { run_id } = await res.json();
      runIdRef.current = run_id;
      setState(prev => ({ ...prev, runId: run_id }));

      // Koble til WebSocket
      const ws = new WebSocket(`${WS_BASE}/api/agent/ws/${run_id}`);
      wsRef.current = ws;

      ws.onopen = () => {
        ws.send(JSON.stringify({ task }));
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          handleAgentEvent(msg);
        } catch (e) {
          console.error('WS parse error:', e);
        }
      };

      ws.onerror = () => {
        setState(prev => ({ ...prev, status: 'failed' }));
        addLog({ type: 'error', message: 'Tilkoblingsfeil til agent-backend' });
      };

      ws.onclose = () => {
        setState(prev => {
          if (prev.status === 'running' || prev.status === 'planning') {
            return { ...prev, status: 'completed' };
          }
          return prev;
        });
      };

    } catch (err) {
      setState(prev => ({ ...prev, status: 'failed' }));
      addLog({ type: 'error', message: `Feil: ${err instanceof Error ? err.message : String(err)}` });
    }
  }, [addLog]);

  const handleAgentEvent = useCallback((msg: { type: string; data: Record<string, unknown>; timestamp?: number }) => {
    const { type, data } = msg;

    switch (type) {
      case 'status':
        setState(prev => ({
          ...prev,
          status: (data.status as AgentStatus) || prev.status,
        }));
        if (data.message) {
          addLog({ type: 'log', message: data.message as string });
        }
        break;

      case 'log':
        addLog({
          type: (data.level === 'thinking' ? 'thinking' : 'log'),
          message: data.message as string,
        });
        break;

      case 'tool_call':
        addLog({
          type: 'tool_call',
          message: `Kjører ${data.tool}(${JSON.stringify(data.args).slice(0, 100)})`,
          tool: data.tool as string,
          args: data.args as Record<string, unknown>,
        });
        setState(prev => ({ ...prev, status: 'running' }));
        break;

      case 'tool_result':
        addLog({
          type: 'tool_result',
          message: data.success
            ? `✓ ${data.tool}: ${(data.output as string)?.slice(0, 200)}`
            : `✗ ${data.tool}: ${data.error}`,
          tool: data.tool as string,
          success: data.success as boolean,
        });
        break;

      case 'file_change':
        setState(prev => ({
          ...prev,
          files: [
            ...prev.files.filter(f => f.path !== data.path),
            { path: data.path as string, action: data.action as 'created' | 'modified' }
          ]
        }));
        addLog({
          type: 'file_change',
          message: `${data.action === 'created' ? '📄 Opprettet' : '✏️ Endret'}: ${data.path}`,
        });
        break;

      case 'approval_needed':
        setState(prev => ({
          ...prev,
          status: 'waiting_approval',
          pendingApproval: {
            tool: data.tool as string,
            args: data.args as Record<string, unknown>,
            description: data.description as string,
          }
        }));
        break;

      case 'complete':
        setState(prev => ({ ...prev, status: 'completed', pendingApproval: null }));
        addLog({ type: 'log', message: data.message as string || 'Oppgave fullført!' });
        break;

      case 'error':
        setState(prev => ({ ...prev, status: 'failed' }));
        addLog({ type: 'error', message: data.message as string });
        break;
    }
  }, [addLog]);

  const approveAction = useCallback(async (approved: boolean) => {
    if (!runIdRef.current) return;
    await fetch(`${API_BASE}/api/agent/${runIdRef.current}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approved, run_id: runIdRef.current }),
    });
    setState(prev => ({ ...prev, pendingApproval: null, status: 'running' }));
  }, []);

  const stopAgent = useCallback(async () => {
    if (wsRef.current) {
      wsRef.current.send(JSON.stringify({ action: 'stop' }));
    }
    if (runIdRef.current) {
      await fetch(`${API_BASE}/api/agent/${runIdRef.current}/stop`, { method: 'POST' });
    }
    setState(prev => ({ ...prev, status: 'stopped' }));
  }, []);

  const fetchFileContent = useCallback(async (filePath: string): Promise<string> => {
    if (!runIdRef.current) return '';
    const res = await fetch(`${API_BASE}/api/agent/${runIdRef.current}/files/${filePath}`);
    if (!res.ok) return '';
    const { content } = await res.json();
    return content;
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      wsRef.current?.close();
    };
  }, []);

  return {
    state,
    startAgent,
    stopAgent,
    approveAction,
    fetchFileContent,
  };
}
