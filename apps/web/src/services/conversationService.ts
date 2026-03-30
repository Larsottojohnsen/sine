/**
 * conversationService.ts
 * ─────────────────────────────────────────────────────────────
 * All Supabase read/write for conversations and messages.
 * Called from the store and useChat hook.
 * ─────────────────────────────────────────────────────────────
 */
import { getSupabase } from '../hooks/useAuth'
import type { Conversation, Message, SineModel } from '../types'

// ── Row types that match the Supabase schema ─────────────────
interface DbConversation {
  id: string
  user_id: string
  title: string
  mode: string
  agent_type: string | null
  created_at: string
  updated_at: string
}

interface DbMessage {
  id: string
  conversation_id: string
  role: string
  content: string
  metadata: Record<string, unknown>
  created_at: string
}

// ── Mappers ──────────────────────────────────────────────────
function dbConvToLocal(row: DbConversation, messages: Message[] = []): Conversation {
  return {
    id: row.id,
    title: row.title,
    messages,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    model: 'sine-1' as SineModel,
    type: (row.mode as 'chat' | 'agent') ?? 'chat',
    agentType: (row.agent_type as 'code' | 'writing') ?? undefined,
  }
}

function dbMsgToLocal(row: DbMessage): Message {
  const meta = row.metadata ?? {}
  return {
    id: row.id,
    role: row.role as Message['role'],
    content: row.content,
    createdAt: new Date(row.created_at),
    isStreaming: false,
    agentTasks: (meta.agentTasks as Message['agentTasks']) ?? undefined,
    agentFiles: (meta.agentFiles as Message['agentFiles']) ?? undefined,
    agentStatus: (meta.agentStatus as Message['agentStatus']) ?? undefined,
    agentPlan: (meta.agentPlan as Message['agentPlan']) ?? undefined,
    agentEvents: (meta.agentEvents as Message['agentEvents']) ?? undefined,
    isAgentMessage: (meta.isAgentMessage as boolean) ?? undefined,
  }
}

// ── Fetch all conversations for a user (with messages) ───────
export async function fetchConversations(userId: string): Promise<Conversation[]> {
  const supabase = getSupabase()

  const { data: convRows, error: convErr } = await supabase
    .from('conversations')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })

  if (convErr || !convRows) return []

  // Fetch all messages for these conversations in one query
  const convIds = convRows.map(c => c.id)
  if (convIds.length === 0) return []

  const { data: msgRows } = await supabase
    .from('messages')
    .select('*')
    .in('conversation_id', convIds)
    .order('created_at', { ascending: true })

  const msgsByConv: Record<string, Message[]> = {}
  for (const row of msgRows ?? []) {
    if (!msgsByConv[row.conversation_id]) msgsByConv[row.conversation_id] = []
    msgsByConv[row.conversation_id].push(dbMsgToLocal(row as DbMessage))
  }

  return convRows.map(row => dbConvToLocal(row as DbConversation, msgsByConv[row.id] ?? []))
}

// ── Create a new conversation row ────────────────────────────
export async function createConversationInDb(
  userId: string,
  id: string,
  title: string,
  mode: 'chat' | 'agent' = 'chat',
  agentType?: 'code' | 'writing'
): Promise<void> {
  const supabase = getSupabase()
  await supabase.from('conversations').insert({
    id,
    user_id: userId,
    title,
    mode,
    agent_type: agentType ?? null,
  })
}

// ── Update conversation title ─────────────────────────────────
export async function updateConversationTitle(id: string, title: string): Promise<void> {
  const supabase = getSupabase()
  await supabase.from('conversations').update({ title }).eq('id', id)
}

// ── Delete a conversation (cascades to messages via FK) ───────
export async function deleteConversationFromDb(id: string): Promise<void> {
  const supabase = getSupabase()
  await supabase.from('conversations').delete().eq('id', id)
}

// ── Insert a single message ───────────────────────────────────
export async function insertMessage(
  conversationId: string,
  message: Message
): Promise<void> {
  const supabase = getSupabase()

  // Store agent-specific fields in metadata JSONB column
  const metadata: Record<string, unknown> = {}
  if (message.agentTasks)    metadata.agentTasks    = message.agentTasks
  if (message.agentFiles)    metadata.agentFiles    = message.agentFiles
  if (message.agentStatus)   metadata.agentStatus   = message.agentStatus
  if (message.agentPlan)     metadata.agentPlan     = message.agentPlan
  if (message.agentEvents)   metadata.agentEvents   = message.agentEvents
  if (message.isAgentMessage) metadata.isAgentMessage = message.isAgentMessage

  await supabase.from('messages').insert({
    id: message.id,
    conversation_id: conversationId,
    role: message.role,
    content: message.content,
    metadata,
    created_at: message.createdAt.toISOString(),
  })
}

// ── Update message content (after streaming finishes) ────────
export async function updateMessageContent(
  messageId: string,
  content: string,
  extraMetadata?: Record<string, unknown>
): Promise<void> {
  const supabase = getSupabase()
  const update: Record<string, unknown> = { content }
  if (extraMetadata) update.metadata = extraMetadata
  await supabase.from('messages').update(update).eq('id', messageId)
}
