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

export interface Message {
  id: string
  role: MessageRole
  content: string
  createdAt: Date
  isStreaming?: boolean
  // Agent-spesifikke felt
  agentTasks?: AgentTask[]
  agentFiles?: AgentFile[]
  agentStatus?: 'running' | 'completed' | 'failed' | 'stopped'
  agentSuggestions?: string[]
  isAgentMessage?: boolean
}

export interface Conversation {
  id: string
  title: string
  messages: Message[]
  createdAt: Date
  updatedAt: Date
  model: SineModel
  type?: 'chat' | 'agent'
}

export type SineModel = 'sine-1' | 'sine-pro'

export interface AppSettings {
  language: 'no' | 'en'
  model: SineModel
  theme: 'dark'
}

export interface NavItem {
  id: string
  label: string
  icon?: string
  href?: string
}
