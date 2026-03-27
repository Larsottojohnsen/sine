import { useState, useCallback, useRef, useEffect } from 'react';
import { useApp } from '@/store/AppContext';
import type { AgentTask, AgentFile } from '@/types';
import { v4 as uuidv4 } from 'uuid';

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

export interface AgentState {
  runId: string | null;
  status: AgentStatus;
  logs: AgentLogEntry[];
  files: { path: string; action: 'created' | 'modified' }[];
  currentTask: string;
  pendingApproval: {
    tool: string;
    args: Record<string, unknown>;
    description: string;
  } | null;
  mode: AgentMode;
  // Live oppgave-kort som vises i chat-meldingen
  liveTasks: AgentTask[];
  liveFiles: AgentFile[];
  agentMessageId: string | null;
}

const API_BASE = import.meta.env.VITE_API_URL || 'https://sineapi-production.up.railway.app';
const WS_BASE = API_BASE.replace('https://', 'wss://').replace('http://', 'ws://');

function getTaskLabel(tool: string, args: Record<string, unknown>): string {
  switch (tool) {
    case 'write_file': return `Skriver fil: ${args.path ?? ''}`;
    case 'read_file': return `Leser fil: ${args.path ?? ''}`;
    case 'list_files': return `Lister filer: ${args.path ?? '.'}`;
    case 'terminal': return `Terminal: ${String(args.command ?? '').slice(0, 60)}`;
    case 'web_search': return `Søker: ${args.query ?? ''}`;
    case 'run_code': return `Kjører kode`;
    case 'analyze_data': return `Analyserer data`;
    default: return `${tool}: ${JSON.stringify(args).slice(0, 60)}`;
  }
}

function getFileType(filename: string): AgentFile['type'] {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  if (['md', 'mdx'].includes(ext)) return 'markdown';
  if (['js', 'ts', 'tsx', 'jsx', 'py', 'rs', 'go', 'java', 'css', 'html', 'json', 'yaml', 'yml', 'sh'].includes(ext)) return 'code';
  if (['zip', 'tar', 'gz', 'rar', '7z'].includes(ext)) return 'archive';
  if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext)) return 'image';
  if (['txt', 'log', 'csv'].includes(ext)) return 'text';
  return 'other';
}

export function useAgent() {
  const [state, setState] = useState<AgentState>({
    runId: null,
    status: 'idle',
    logs: [],
    files: [],
    currentTask: '',
    pendingApproval: null,
    mode: 'safe',
    liveTasks: [],
    liveFiles: [],
    agentMessageId: null,
  });

  const wsRef = useRef<WebSocket | null>(null);
  const runIdRef = useRef<string | null>(null);
  const agentMsgIdRef = useRef<string | null>(null);
  const activeTasksRef = useRef<Map<string, AgentTask>>(new Map());

  const { addMessage, updateMessage, activeConversationId, createConversation } = useApp();

  const addLog = useCallback((entry: Omit<AgentLogEntry, 'id' | 'timestamp'>) => {
    setState(prev => ({
      ...prev,
      logs: [...prev.logs, {
        ...entry,
        id: uuidv4(),
        timestamp: Date.now(),
      }]
    }));
  }, []);

  const startAgent = useCallback(async (task: string, mode: AgentMode = 'safe') => {
    if (wsRef.current) wsRef.current.close();
    activeTasksRef.current.clear();

    // Sørg for aktiv samtale
    let convId = activeConversationId;
    if (!convId) convId = createConversation();

    // Legg til bruker-melding
    addMessage(convId, { role: 'user', content: task });

    // Legg til agent-melding (oppdateres live)
    const agentMsgId = addMessage(convId, {
      role: 'agent',
      content: '',
      isAgentMessage: true,
      agentStatus: 'running',
      agentTasks: [],
      agentFiles: [],
      agentSuggestions: [],
    });
    agentMsgIdRef.current = agentMsgId;

    setState({
      runId: null,
      status: 'planning',
      logs: [],
      files: [],
      currentTask: task,
      pendingApproval: null,
      mode,
      liveTasks: [],
      liveFiles: [],
      agentMessageId: agentMsgId,
    });

    try {
      const res = await fetch(`${API_BASE}/api/agent/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task, mode }),
      });
      if (!res.ok) throw new Error(`API-feil: ${res.status}`);
      const { run_id } = await res.json();
      runIdRef.current = run_id;
      setState(prev => ({ ...prev, runId: run_id }));

      const ws = new WebSocket(`${WS_BASE}/api/agent/ws/${run_id}`);
      wsRef.current = ws;

      ws.onopen = () => ws.send(JSON.stringify({ task }));

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          handleAgentEvent(msg, convId!, agentMsgId);
        } catch (e) {
          console.error('WS parse error:', e);
        }
      };

      ws.onerror = () => {
        setState(prev => ({ ...prev, status: 'failed' }));
        addLog({ type: 'error', message: 'Tilkoblingsfeil til agent-backend' });
        updateMessage(convId!, agentMsgId, JSON.stringify({
          agentStatus: 'failed',
          agentTasks: [],
          agentFiles: [],
        }), false);
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
  }, [activeConversationId, createConversation, addMessage, updateMessage, addLog]);

  const handleAgentEvent = useCallback((
    msg: { type: string; data: Record<string, unknown> },
    _convId: string,
    _agentMsgId: string
  ) => {
    const { type, data } = msg;

    switch (type) {
      case 'status':
        setState(prev => ({ ...prev, status: (data.status as AgentStatus) || prev.status }));
        if (data.message) addLog({ type: 'log', message: data.message as string });
        break;

      case 'log':
        addLog({ type: data.level === 'thinking' ? 'thinking' : 'log', message: data.message as string });
        break;

      case 'tool_call': {
        const toolName = data.tool as string;
        const taskId = uuidv4();
        const label = getTaskLabel(toolName, data.args as Record<string, unknown>);
        const newTask: AgentTask = { id: taskId, label, status: 'running', tool: toolName };

        activeTasksRef.current.set(taskId, newTask);

        addLog({ type: 'tool_call', message: `Kjører ${toolName}`, tool: toolName, args: data.args as Record<string, unknown> });

        setState(prev => ({
          ...prev,
          status: 'running',
          liveTasks: [...prev.liveTasks, newTask],
        }));
        break;
      }

      case 'tool_result': {
        const toolName = data.tool as string;
        addLog({
          type: 'tool_result',
          message: data.success ? `✓ ${toolName}` : `✗ ${toolName}: ${data.error}`,
          tool: toolName,
          success: data.success as boolean,
        });

        // Marker siste running task av denne typen som done
        setState(prev => {
          const tasks = [...prev.liveTasks];
          const idx = tasks.findLastIndex(t => t.tool === toolName && t.status === 'running');
          if (idx >= 0) {
            tasks[idx] = { ...tasks[idx], status: data.success ? 'done' : 'error' };
          }
          return { ...prev, liveTasks: tasks };
        });
        break;
      }

      case 'file_change': {
        const filePath = data.path as string;
        const fileAction = data.action as 'created' | 'modified';
        const agentFile: AgentFile = {
          name: filePath.split('/').pop() ?? filePath,
          path: filePath,
          type: getFileType(filePath),
        };

        setState(prev => ({
          ...prev,
          files: [...prev.files.filter(f => f.path !== filePath), { path: filePath, action: fileAction }],
          liveFiles: [...prev.liveFiles.filter(f => f.path !== filePath), agentFile],
          liveTasks: prev.liveTasks.map(t =>
            t.tool === 'write_file' && t.status === 'running'
              ? { ...t, filePath, status: 'done' as const }
              : t
          ),
        }));
        addLog({ type: 'file_change', message: `${fileAction === 'created' ? 'Opprettet' : 'Endret'}: ${filePath}` });
        break;
      }

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
        setState(prev => ({
          ...prev,
          status: 'completed',
          pendingApproval: null,
          liveTasks: prev.liveTasks.map(t => t.status === 'running' ? { ...t, status: 'done' as const } : t),
        }));
        addLog({ type: 'log', message: (data.message as string) || 'Oppgave fullført!' });
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
    if (wsRef.current) wsRef.current.send(JSON.stringify({ action: 'stop' }));
    if (runIdRef.current) await fetch(`${API_BASE}/api/agent/${runIdRef.current}/stop`, { method: 'POST' });
    setState(prev => ({ ...prev, status: 'stopped' }));
  }, []);

  const fetchFileContent = useCallback(async (filePath: string): Promise<string> => {
    if (!runIdRef.current) return '';
    const res = await fetch(`${API_BASE}/api/agent/${runIdRef.current}/files/${filePath}`);
    if (!res.ok) return '';
    const { content } = await res.json();
    return content;
  }, []);

  useEffect(() => {
    return () => { wsRef.current?.close(); };
  }, []);

  return { state, startAgent, stopAgent, approveAction, fetchFileContent };
}
