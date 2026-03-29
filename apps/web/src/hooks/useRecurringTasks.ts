import { useState, useEffect, useCallback } from 'react'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { RecurringTaskProposal } from '@/components/chat/RecurringTaskCard'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://cauaqoqvpvjpeghejgvj.supabase.co'
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNhdWFxb3F2cHZqcGVnaGVqZ3ZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2Mzc3MDAsImV4cCI6MjA5MDIxMzcwMH0.eT_KvHh6ZoS5hlLILkhzTyogTP91OAX-pKwG57OeFHI'

let _sb: SupabaseClient | null = null
function getSupabase(): SupabaseClient {
  if (!_sb) _sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  return _sb
}

export interface RecurringTask extends RecurringTaskProposal {
  id: string
  userId: string
  isActive: boolean
  autoApproved: boolean
  source: 'agent' | 'manual'
  createdAt: string
  updatedAt: string
  startsAt: string
}

export interface TaskExecution {
  id: string
  taskId: string
  scheduledFor: string
  startedAt?: string
  finishedAt?: string
  status: 'pending' | 'running' | 'success' | 'failed' | 'skipped'
  resultSummary?: string
  errorMessage?: string
  creditsUsed: number
  triggeredBy: 'scheduler' | 'manual'
  createdAt: string
}

/* ── Deterministic color from category name ── */
export function categoryColor(name: string): string {
  const PRESET: Record<string, string> = {
    'Annonsering':       '#1A93FE',
    'Innhold':           '#22C55E',
    'Rapportering':      '#A855F7',
    'E-post':            '#F59E0B',
    'Sosiale medier':    '#EC4899',
    'Analyse':           '#06B6D4',
    'Møteforberedelse':  '#F97316',
    'Kundeoppfølging':   '#EF4444',
    'Vedlikehold':       '#6B7280',
    'Tilpasset':         '#8B5CF6',
  }
  if (PRESET[name]) return PRESET[name]
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  const hue = Math.abs(hash) % 360
  return `hsl(${hue}, 65%, 55%)`
}

function mapRow(row: Record<string, unknown>): RecurringTask {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    title: row.title as string,
    description: (row.description as string) ?? '',
    category: row.category as string,
    color: row.color as string,
    frequency: row.frequency as RecurringTask['frequency'],
    customDays: row.custom_days as number[] | undefined,
    dayOfWeek: row.day_of_week as number | undefined,
    dayOfMonth: row.day_of_month as number | undefined,
    timeOfDay: row.time_of_day as string,
    connectorId: row.connector_id as string | undefined,
    connectorName: row.connector_name as string | undefined,
    agentPrompt: row.agent_prompt as string,
    endsAt: row.ends_at as string | undefined,
    isActive: row.is_active as boolean,
    autoApproved: row.auto_approved as boolean,
    source: row.source as 'agent' | 'manual',
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    startsAt: row.starts_at as string,
  }
}

export function useRecurringTasks(userId: string | null) {
  const [tasks, setTasks] = useState<RecurringTask[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = getSupabase()

  const fetchTasks = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    try {
      const { data, error: err } = await supabase
        .from('recurring_tasks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      if (err) throw err
      setTasks((data ?? []).map(mapRow))
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [userId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchTasks() }, [fetchTasks])

  const createTask = useCallback(async (
    proposal: RecurringTaskProposal,
    source: 'agent' | 'manual' = 'agent',
    autoApproved = false,
  ): Promise<RecurringTask | null> => {
    if (!userId) return null
    const color = proposal.color || categoryColor(proposal.category)
    const { data, error: err } = await supabase
      .from('recurring_tasks')
      .insert({
        user_id: userId,
        title: proposal.title,
        description: proposal.description,
        category: proposal.category,
        color,
        frequency: proposal.frequency,
        custom_days: proposal.customDays ?? null,
        day_of_week: proposal.dayOfWeek ?? null,
        day_of_month: proposal.dayOfMonth ?? null,
        time_of_day: proposal.timeOfDay,
        connector_id: proposal.connectorId ?? null,
        connector_name: proposal.connectorName ?? null,
        agent_prompt: proposal.agentPrompt,
        ends_at: proposal.endsAt ?? null,
        is_active: true,
        auto_approved: autoApproved,
        source,
      })
      .select()
      .single()
    if (err) { setError(err.message); return null }
    const task = mapRow(data as Record<string, unknown>)
    setTasks(prev => [task, ...prev])
    return task
  }, [userId]) // eslint-disable-line react-hooks/exhaustive-deps

  const toggleActive = useCallback(async (taskId: string, active: boolean) => {
    const { error: err } = await supabase
      .from('recurring_tasks')
      .update({ is_active: active })
      .eq('id', taskId)
    if (!err) setTasks(prev => prev.map(t => t.id === taskId ? { ...t, isActive: active } : t))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const deleteTask = useCallback(async (taskId: string) => {
    const { error: err } = await supabase
      .from('recurring_tasks')
      .delete()
      .eq('id', taskId)
    if (!err) setTasks(prev => prev.filter(t => t.id !== taskId))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const logExecution = useCallback(async (
    taskId: string,
    scheduledFor: Date,
    triggeredBy: 'manual' | 'scheduler' = 'manual',
  ): Promise<string | null> => {
    if (!userId) return null
    const { data, error: err } = await supabase
      .from('task_executions')
      .insert({
        task_id: taskId,
        user_id: userId,
        scheduled_for: scheduledFor.toISOString(),
        status: 'pending',
        triggered_by: triggeredBy,
      })
      .select('id')
      .single()
    if (err) return null
    return (data as { id: string }).id
  }, [userId]) // eslint-disable-line react-hooks/exhaustive-deps

  return { tasks, loading, error, fetchTasks, createTask, toggleActive, deleteTask, logExecution }
}
