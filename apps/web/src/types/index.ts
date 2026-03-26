export type MessageRole = 'user' | 'assistant' | 'system'

export interface Message {
  id: string
  role: MessageRole
  content: string
  createdAt: Date
  isStreaming?: boolean
}

export interface Conversation {
  id: string
  title: string
  messages: Message[]
  createdAt: Date
  updatedAt: Date
  model: SineModel
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
