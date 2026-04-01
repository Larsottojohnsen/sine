export type MessageRole = 'user' | 'assistant' | 'system' | 'agent'

export interface AgentTask {
  id: string
  label: string
  status: 'running' | 'done' | 'error'
  tool?: string
  filePath?: string
}

export interface AgentFile {
  name: string
  path: string
  size?: string
  type: 'markdown' | 'code' | 'archive' | 'image' | 'text' | 'other'
  content?: string
  downloadUrl?: string
  runId?: string
}

// ─── Plan-steg (Manus-inspirert todo.md) ─────────────────────
export interface PlanStep {
  id: number
  text: string
  status: 'pending' | 'running' | 'done' | 'error'
}

// ─── Agent-event for event-stream visning ─────────────────────
export interface AgentEvent {
  id: string
  type: 'thinking' | 'tool_call' | 'tool_result' | 'observation' | 'plan_update' | 'approval_needed' | 'message'
  label: string
  tool?: string
  success?: boolean
  timestamp: number
}

// ─── Bruker-minne (persistert på tvers av samtaler) ──────────
export interface UserMemory {
  id: string
  key: string       // f.eks. "studiested", "programmeringsspråk"
  value: string     // f.eks. "UiO", "Python"
  source: string    // hvilken samtale det kom fra
  createdAt: Date
}

export interface Message {
  id: string
  role: MessageRole
  content: string
  createdAt: Date
  isStreaming?: boolean
  // Agent-spesifikke felt
  agentTasks?: AgentTask[]
  agentFiles?: AgentFile[]
  agentStatus?: 'running' | 'completed' | 'failed' | 'stopped' | 'waiting_approval'
  agentSuggestions?: string[]
  isAgentMessage?: boolean
  // Nye felt: plan og events
  agentPlan?: PlanStep[]
  agentEvents?: AgentEvent[]
  // Godkjennings-forespørsel (Safe mode)
  pendingApproval?: {
    tool: string
    args: Record<string, unknown>
    description: string
  }
}

export interface Conversation {
  id: string
  title: string
  messages: Message[]
  createdAt: Date
  updatedAt: Date
  model: SineModel
  type?: 'chat' | 'agent'
  agentType?: 'code' | 'writing'
}

export type SineModel = 'sine-1' | 'sine-pro'

export interface AppSettings {
  language: 'no' | 'en'
  model: SineModel
  theme: 'dark' | 'light' | 'system'
  // Personalisering
  userName?: string
  customInstructions?: string
  // Bruker-minne
  userMemory?: UserMemory[]
  // Agent-standardinnstillinger
  defaultAgentType?: 'code' | 'writing'
  defaultSafeMode?: boolean
  // Skills
  skills?: Skill[]
  // Connectors
  customApiConnectors?: CustomApiConnector[]
  customMcpConnectors?: CustomMcpConnector[]
  connectorStatuses?: Record<string, ConnectorStatus>
}

// ─── Skills ──────────────────────────────────────────────────
export interface Skill {
  id: string
  name: string
  description: string
  enabled: boolean
  source: 'official' | 'github' | 'upload' | 'custom'
  githubUrl?: string
  systemPrompt?: string
  icon?: string
  updatedAt?: string
  createdAt: Date
}

// ─── Connectors ───────────────────────────────────────────────
export type ConnectorStatus = 'connected' | 'disconnected' | 'pending'

export interface AppConnector {
  id: string
  name: string
  description: string
  icon: string
  status: ConnectorStatus
  type: 'oauth' | 'api_key'
  scopes?: string[]
  connectedAt?: Date
}

export interface CustomApiConnector {
  id: string
  name: string
  icon?: string
  note?: string
  secrets: { name: string; value: string }[]
  createdAt: Date
}

export interface CustomMcpConnector {
  id: string
  name: string
  config: string // JSON string
  createdAt: Date
}

export interface NavItem {
  id: string
  label: string
  icon?: string
  href?: string
}
