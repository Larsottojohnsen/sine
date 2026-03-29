import { useState, useMemo, useCallback } from 'react'
import {
  ChevronLeft, ChevronRight, Plus, Play, Pause,
  Trash2, X, Clock, Calendar, Repeat,
  Zap, CheckCircle2, Circle,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useRecurringTasks } from '@/hooks/useRecurringTasks'
import type { RecurringTask } from '@/hooks/useRecurringTasks'
import { CreateTaskModal } from './CreateTaskModal'

/* ─────────────────────────────────────────────────────────────
   Date helpers (all in Europe/Oslo logic via Intl)
───────────────────────────────────────────────────────────── */
const WEEKDAYS_NO = ['Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør', 'Søn']
const MONTHS_NO = ['Januar','Februar','Mars','April','Mai','Juni','Juli','August','September','Oktober','November','Desember']

function startOfWeek(d: Date): Date {
  const day = new Date(d)
  const dow = (day.getDay() + 6) % 7 // Mon=0
  day.setDate(day.getDate() - dow)
  day.setHours(0, 0, 0, 0)
  return day
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
}

function isToday(d: Date): boolean { return isSameDay(d, new Date()) }

/* ── Does a recurring task occur on a given date? ── */
function taskOccursOn(task: RecurringTask, date: Date): boolean {
  if (!task.isActive) return false
  const dow = (date.getDay() + 6) % 7 // Mon=0
  const dom = date.getDate()
  if (task.frequency === 'daily') return true
  if (task.frequency === 'weekly') return task.dayOfWeek === dow
  if (task.frequency === 'monthly') return task.dayOfMonth === dom
  if (task.frequency === 'custom') return (task.customDays ?? []).includes(dow)
  return false
}

/* ── Next occurrence from today ── */
function nextOccurrence(task: RecurringTask): Date | null {
  const today = new Date(); today.setHours(0,0,0,0)
  for (let i = 0; i < 366; i++) {
    const d = addDays(today, i)
    if (taskOccursOn(task, d)) return d
  }
  return null
}

function formatFreqShort(task: RecurringTask): string {
  if (task.frequency === 'daily') return 'Daglig'
  if (task.frequency === 'weekly' && task.dayOfWeek !== undefined)
    return `Hver ${WEEKDAYS_NO[task.dayOfWeek].toLowerCase()}`
  if (task.frequency === 'monthly' && task.dayOfMonth !== undefined)
    return `Den ${task.dayOfMonth}. hver mnd`
  if (task.frequency === 'custom' && task.customDays?.length)
    return task.customDays.map(d => WEEKDAYS_NO[d]).join(', ')
  return task.frequency
}

/* ─────────────────────────────────────────────────────────────
   Mini calendar (top-right)
───────────────────────────────────────────────────────────── */
function MiniCalendar({
  selected, onSelect, tasks,
}: { selected: Date; onSelect: (d: Date) => void; tasks: RecurringTask[] }) {
  const [viewDate, setViewDate] = useState(() => new Date(selected))
  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()

  const firstDay = new Date(year, month, 1)
  const startDow = (firstDay.getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells: (Date | null)[] = []
  for (let i = 0; i < startDow; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d))

  const hasDot = (d: Date) => tasks.some(t => taskOccursOn(t, d))

  return (
    <div style={{
      background: '#1C1C1C', border: '1px solid #2A2A2A', borderRadius: 12,
      padding: '14px 16px', width: 220, flexShrink: 0,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <button onClick={() => setViewDate(new Date(year, month - 1, 1))}
          style={{ background: 'none', border: 'none', color: '#5A5A5A', cursor: 'pointer', padding: 2, borderRadius: 4 }}>
          <ChevronLeft size={14} />
        </button>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#E5E5E5' }}>
          {MONTHS_NO[month]} {year}
        </span>
        <button onClick={() => setViewDate(new Date(year, month + 1, 1))}
          style={{ background: 'none', border: 'none', color: '#5A5A5A', cursor: 'pointer', padding: 2, borderRadius: 4 }}>
          <ChevronRight size={14} />
        </button>
      </div>

      {/* Weekday headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 4 }}>
        {WEEKDAYS_NO.map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: 10, color: '#5A5A5A', fontWeight: 600, padding: '2px 0' }}>
            {d[0]}
          </div>
        ))}
      </div>

      {/* Days */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1 }}>
        {cells.map((d, i) => {
          if (!d) return <div key={i} />
          const sel = isSameDay(d, selected)
          const tod = isToday(d)
          const dot = hasDot(d)
          return (
            <button key={i} onClick={() => onSelect(d)} style={{
              width: '100%', aspectRatio: '1', borderRadius: 6,
              background: sel ? '#1A93FE' : 'none',
              border: tod && !sel ? '1px solid #3A3A3A' : '1px solid transparent',
              color: sel ? '#fff' : tod ? '#E5E5E5' : '#9A9A9A',
              fontSize: 11, cursor: 'pointer', position: 'relative',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'inherit',
            }}>
              {d.getDate()}
              {dot && !sel && (
                <span style={{
                  position: 'absolute', bottom: 2, left: '50%', transform: 'translateX(-50%)',
                  width: 3, height: 3, borderRadius: '50%', background: '#1A93FE',
                }} />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   Task event card (in week/month grid)
───────────────────────────────────────────────────────────── */
function EventCard({ task, onClick }: { task: RecurringTask; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      width: '100%', textAlign: 'left', padding: '5px 8px',
      borderRadius: 6, border: 'none', cursor: 'pointer',
      background: task.color + '22',
      borderLeft: `3px solid ${task.color}`,
      marginBottom: 3,
      fontFamily: 'inherit',
    }}
    onMouseEnter={e => (e.currentTarget.style.background = task.color + '33')}
    onMouseLeave={e => (e.currentTarget.style.background = task.color + '22')}
    >
      <div style={{ fontSize: 11, fontWeight: 600, color: task.color, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {task.title}
      </div>
      <div style={{ fontSize: 10, color: task.color + 'AA', marginTop: 1 }}>{task.timeOfDay}</div>
    </button>
  )
}

/* ─────────────────────────────────────────────────────────────
   Task detail side panel
───────────────────────────────────────────────────────────── */
function TaskDetailPanel({
  task, onClose, onToggleActive, onDelete, onRunNow,
}: {
  task: RecurringTask
  onClose: () => void
  onToggleActive: (id: string, active: boolean) => void
  onDelete: (id: string) => void
  onRunNow: (task: RecurringTask) => void
}) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [running, setRunning] = useState(false)

  const handleRunNow = async () => {
    setRunning(true)
    await onRunNow(task)
    setTimeout(() => setRunning(false), 2000)
  }

  const next = nextOccurrence(task)

  return (
    <div style={{
      width: 300, flexShrink: 0,
      background: '#1C1C1C', border: '1px solid #2A2A2A',
      borderRadius: 12, padding: '18px 18px 16px',
      display: 'flex', flexDirection: 'column', gap: 0,
      maxHeight: '100%', overflowY: 'auto',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{
              width: 10, height: 10, borderRadius: '50%',
              background: task.color, flexShrink: 0,
            }} />
            <span style={{ fontSize: 15, fontWeight: 700, color: '#E5E5E5', lineHeight: 1.3 }}>
              {task.title}
            </span>
          </div>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '2px 8px', borderRadius: 20,
            background: task.color + '22', border: `1px solid ${task.color}44`,
            fontSize: 10, color: task.color, fontWeight: 600,
          }}>
            {task.category}
          </span>
        </div>
        <button onClick={onClose} style={{
          background: 'none', border: 'none', color: '#5A5A5A',
          cursor: 'pointer', padding: 2, borderRadius: 4, flexShrink: 0,
        }}>
          <X size={16} />
        </button>
      </div>

      {/* Description */}
      {task.description && (
        <p style={{ fontSize: 12, color: '#7A7A7A', lineHeight: 1.6, margin: '0 0 14px' }}>
          {task.description}
        </p>
      )}

      {/* Info rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
        <InfoRow icon={<Repeat size={13} />} label="Frekvens">
          {formatFreqShort(task)} kl. {task.timeOfDay}
        </InfoRow>
        <InfoRow icon={<Calendar size={13} />} label="Neste kjøring">
          {next ? next.toLocaleDateString('no-NO', { weekday: 'short', day: 'numeric', month: 'short' }) : '—'}
        </InfoRow>
        <InfoRow icon={<Clock size={13} />} label="Slutter">
          {task.endsAt ? new Date(task.endsAt).toLocaleDateString('no-NO') : 'Aldri'}
        </InfoRow>
        {task.connectorName && (
          <InfoRow icon={<Zap size={13} />} label="Tilkobling">
            {task.connectorName}
          </InfoRow>
        )}
        <InfoRow icon={task.isActive ? <CheckCircle2 size={13} style={{ color: '#4ADE80' }} /> : <Circle size={13} />} label="Status">
          <span style={{ color: task.isActive ? '#4ADE80' : '#5A5A5A' }}>
            {task.isActive ? 'Aktiv' : 'Pauset'}
          </span>
        </InfoRow>
      </div>

      {/* Agent prompt */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: '#5A5A5A', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
          Agent-instruksjon
        </div>
        <div style={{
          padding: '8px 10px', borderRadius: 7,
          background: '#141414', border: '1px solid #2A2A2A',
          fontSize: 11, color: '#7A7A7A', lineHeight: 1.6, fontFamily: 'monospace',
        }}>
          {task.agentPrompt}
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {/* Run now */}
        <button onClick={handleRunNow} disabled={running} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
          padding: '9px 14px', borderRadius: 8,
          background: running ? '#1A93FE33' : '#1A93FE',
          border: 'none', color: running ? '#1A93FE' : '#fff',
          fontSize: 13, fontWeight: 600, cursor: running ? 'not-allowed' : 'pointer',
          fontFamily: 'inherit', transition: 'all 0.15s',
        }}>
          <Play size={13} />
          {running ? 'Kjører...' : 'Kjør nå'}
        </button>

        {/* Pause / Resume */}
        <button onClick={() => onToggleActive(task.id, !task.isActive)} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
          padding: '9px 14px', borderRadius: 8,
          background: '#252525', border: '1px solid #333',
          color: '#E5E5E5', fontSize: 13, fontWeight: 500,
          cursor: 'pointer', fontFamily: 'inherit',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = '#2E2E2E')}
        onMouseLeave={e => (e.currentTarget.style.background = '#252525')}
        >
          <Pause size={13} />
          {task.isActive ? 'Sett på pause' : 'Gjenoppta'}
        </button>

        {/* Delete */}
        {!confirmDelete ? (
          <button onClick={() => setConfirmDelete(true)} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            padding: '9px 14px', borderRadius: 8,
            background: 'none', border: '1px solid #3A2020',
            color: '#EF4444', fontSize: 13, fontWeight: 500,
            cursor: 'pointer', fontFamily: 'inherit',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = '#2A1010')}
          onMouseLeave={e => (e.currentTarget.style.background = 'none')}
          >
            <Trash2 size={13} />
            Slett oppgave
          </button>
        ) : (
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setConfirmDelete(false)} style={{
              flex: 1, padding: '8px', borderRadius: 8,
              background: '#252525', border: '1px solid #333',
              color: '#9A9A9A', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
            }}>Avbryt</button>
            <button onClick={() => onDelete(task.id)} style={{
              flex: 1, padding: '8px', borderRadius: 8,
              background: '#EF4444', border: 'none',
              color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            }}>Slett</button>
          </div>
        )}
      </div>
    </div>
  )
}

function InfoRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
      <span style={{ color: '#5A5A5A', flexShrink: 0, marginTop: 1 }}>{icon}</span>
      <span style={{ fontSize: 11, color: '#5A5A5A', minWidth: 80, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 12, color: '#9A9A9A' }}>{children}</span>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   Week view
───────────────────────────────────────────────────────────── */
function WeekView({
  weekStart, tasks, selectedDate, onSelectDate, onSelectTask,
}: {
  weekStart: Date
  tasks: RecurringTask[]
  selectedDate: Date
  onSelectDate: (d: Date) => void
  onSelectTask: (t: RecurringTask) => void
}) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const hours = Array.from({ length: 16 }, (_, i) => i + 7) // 07:00 – 22:00

  return (
    <div style={{ flex: 1, overflow: 'auto', minWidth: 0 }}>
      {/* Day headers */}
      <div style={{
        display: 'grid', gridTemplateColumns: '52px repeat(7, 1fr)',
        borderBottom: '1px solid #2A2A2A', position: 'sticky', top: 0,
        background: '#161616', zIndex: 2,
      }}>
        <div />
        {days.map(d => {
          const sel = isSameDay(d, selectedDate)
          const tod = isToday(d)
          return (
            <button key={d.toISOString()} onClick={() => onSelectDate(d)} style={{
              padding: '10px 4px', textAlign: 'center', background: 'none',
              border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              borderBottom: sel ? `2px solid #1A93FE` : '2px solid transparent',
            }}>
              <div style={{ fontSize: 10, color: '#5A5A5A', fontWeight: 500, textTransform: 'uppercase' }}>
                {WEEKDAYS_NO[(d.getDay() + 6) % 7]}
              </div>
              <div style={{
                width: 28, height: 28, borderRadius: '50%', margin: '4px auto 0',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: tod ? '#1A93FE' : 'none',
                fontSize: 13, fontWeight: tod ? 700 : 400,
                color: tod ? '#fff' : sel ? '#E5E5E5' : '#7A7A7A',
              }}>
                {d.getDate()}
              </div>
            </button>
          )
        })}
      </div>

      {/* Time grid */}
      {hours.map(h => (
        <div key={h} style={{
          display: 'grid', gridTemplateColumns: '52px repeat(7, 1fr)',
          borderBottom: '1px solid #1E1E1E', minHeight: 52,
        }}>
          <div style={{ fontSize: 10, color: '#3A3A3A', padding: '4px 8px 0', textAlign: 'right', flexShrink: 0 }}>
            {String(h).padStart(2,'0')}:00
          </div>
          {days.map(d => {
            const dayTasks = tasks.filter(t => {
              if (!taskOccursOn(t, d)) return false
              const [th] = t.timeOfDay.split(':').map(Number)
              return th === h
            })
            return (
              <div key={d.toISOString()} style={{
                borderLeft: '1px solid #1E1E1E', padding: '3px 4px',
                background: isSameDay(d, selectedDate) ? '#1A1A1A' : 'transparent',
              }}>
                {dayTasks.map(t => (
                  <EventCard key={t.id} task={t} onClick={() => onSelectTask(t)} />
                ))}
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   Month view
───────────────────────────────────────────────────────────── */
function MonthView({
  viewDate, tasks, selectedDate, onSelectDate, onSelectTask,
}: {
  viewDate: Date
  tasks: RecurringTask[]
  selectedDate: Date
  onSelectDate: (d: Date) => void
  onSelectTask: (t: RecurringTask) => void
}) {
  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const firstDay = new Date(year, month, 1)
  const startDow = (firstDay.getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells: (Date | null)[] = []
  for (let i = 0; i < startDow; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d))
  while (cells.length % 7 !== 0) cells.push(null)

  return (
    <div style={{ flex: 1, overflow: 'auto', minWidth: 0 }}>
      {/* Weekday headers */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
        borderBottom: '1px solid #2A2A2A', position: 'sticky', top: 0,
        background: '#161616', zIndex: 2,
      }}>
        {WEEKDAYS_NO.map(d => (
          <div key={d} style={{
            padding: '10px 0', textAlign: 'center',
            fontSize: 11, color: '#5A5A5A', fontWeight: 600, textTransform: 'uppercase',
          }}>{d}</div>
        ))}
      </div>

      {/* Weeks */}
      {Array.from({ length: cells.length / 7 }, (_, wi) => (
        <div key={wi} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid #1E1E1E' }}>
          {cells.slice(wi * 7, wi * 7 + 7).map((d, di) => {
            if (!d) return <div key={di} style={{ borderLeft: di > 0 ? '1px solid #1E1E1E' : 'none', minHeight: 90 }} />
            const dayTasks = tasks.filter(t => taskOccursOn(t, d))
            const sel = isSameDay(d, selectedDate)
            const tod = isToday(d)
            return (
              <div key={di} onClick={() => onSelectDate(d)} style={{
                borderLeft: di > 0 ? '1px solid #1E1E1E' : 'none',
                minHeight: 90, padding: '6px 6px 4px',
                background: sel ? '#1A1A1A' : 'transparent',
                cursor: 'pointer',
              }}>
                <div style={{
                  width: 22, height: 22, borderRadius: '50%', marginBottom: 4,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: tod ? '#1A93FE' : 'none',
                  fontSize: 11, fontWeight: tod ? 700 : 400,
                  color: tod ? '#fff' : d.getMonth() !== month ? '#3A3A3A' : '#9A9A9A',
                }}>
                  {d.getDate()}
                </div>
                {dayTasks.slice(0, 3).map(t => (
                  <EventCard key={t.id} task={t} onClick={() => { onSelectTask(t) }} />
                ))}
                {dayTasks.length > 3 && (
                  <div style={{ fontSize: 10, color: '#5A5A5A', paddingLeft: 4 }}>+{dayTasks.length - 3} til</div>
                )}
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   Main CalendarPage
───────────────────────────────────────────────────────────── */
export function CalendarPage() {
  const { user } = useAuth()
  const { tasks, loading, createTask, toggleActive, deleteTask, logExecution } = useRecurringTasks(user?.id ?? null)

  const [view, setView] = useState<'week' | 'month'>('week')
  const [selectedDate, setSelectedDate] = useState(() => new Date())
  const [selectedTask, setSelectedTask] = useState<RecurringTask | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)

  // Week navigation
  const weekStart = useMemo(() => startOfWeek(selectedDate), [selectedDate])
  const monthViewDate = selectedDate

  const handlePrev = () => {
    if (view === 'week') setSelectedDate(d => addDays(d, -7))
    else setSelectedDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))
  }
  const handleNext = () => {
    if (view === 'week') setSelectedDate(d => addDays(d, 7))
    else setSelectedDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))
  }
  const handleToday = () => setSelectedDate(new Date())

  const handleRunNow = useCallback(async (task: RecurringTask) => {
    await logExecution(task.id, new Date(), 'manual')
    // In production: trigger backend execution
    alert(`Kjører "${task.title}" nå — kobles til backend i produksjon`)
  }, [logExecution])

  const handleDeleteTask = useCallback(async (id: string) => {
    await deleteTask(id)
    setSelectedTask(null)
  }, [deleteTask])

  // Header label
  const headerLabel = view === 'week'
    ? `${weekStart.getDate()}. ${MONTHS_NO[weekStart.getMonth()].toLowerCase()} – ${addDays(weekStart, 6).getDate()}. ${MONTHS_NO[addDays(weekStart, 6).getMonth()].toLowerCase()} ${weekStart.getFullYear()}`
    : `${MONTHS_NO[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      background: '#161616', color: '#E5E5E5', overflow: 'hidden',
    }}>
      {/* ── Top bar ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 20px 12px', borderBottom: '1px solid #2A2A2A', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#E5E5E5', margin: 0 }}>Kalender</h1>
          {/* Filter tabs */}
          <div style={{ display: 'flex', gap: 2 }}>
            {(['Alle oppgaver', 'Aktive', 'Pauset'] as const).map((tab, i) => (
              <button key={tab} style={{
                padding: '5px 12px', borderRadius: 6, border: 'none',
                background: i === 0 ? '#252525' : 'none',
                color: i === 0 ? '#E5E5E5' : '#5A5A5A',
                fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
              }}>
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Nav */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button onClick={handlePrev} style={{
              width: 28, height: 28, borderRadius: 6, background: '#252525',
              border: '1px solid #333', color: '#9A9A9A', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <ChevronLeft size={14} />
            </button>
            <button onClick={handleToday} style={{
              padding: '5px 12px', borderRadius: 6, background: '#252525',
              border: '1px solid #333', color: '#E5E5E5', fontSize: 12,
              cursor: 'pointer', fontFamily: 'inherit',
            }}>
              I dag
            </button>
            <button onClick={handleNext} style={{
              width: 28, height: 28, borderRadius: 6, background: '#252525',
              border: '1px solid #333', color: '#9A9A9A', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Date label */}
          <span style={{ fontSize: 13, color: '#9A9A9A', minWidth: 200 }}>{headerLabel}</span>

          {/* View toggle */}
          <div style={{
            display: 'flex', background: '#252525', borderRadius: 7,
            border: '1px solid #333', padding: 2, gap: 2,
          }}>
            {(['week', 'month'] as const).map(v => (
              <button key={v} onClick={() => setView(v)} style={{
                padding: '4px 12px', borderRadius: 5, border: 'none',
                background: view === v ? '#3A3A3A' : 'transparent',
                color: view === v ? '#E5E5E5' : '#5A5A5A',
                fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
              }}>
                {v === 'week' ? 'Uke' : 'Måned'}
              </button>
            ))}
          </div>

          {/* Add task */}
          <button onClick={() => setShowCreateModal(true)} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 14px', borderRadius: 8,
            background: '#1A93FE', border: 'none', color: '#fff',
            fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
          }}>
            <Plus size={14} />
            Ny oppgave
          </button>
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', gap: 0 }}>
        {/* Calendar grid */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
          {loading && (
            <div style={{ position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)', zIndex: 10, background: '#252525', borderRadius: 6, padding: '4px 12px', fontSize: 12, color: '#5A5A5A' }}>
              Laster oppgaver...
            </div>
          )}
          {tasks.length === 0 && !loading && (
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 5, textAlign: 'center', pointerEvents: 'none' }}>
              <div style={{ fontSize: 13, color: '#3A3A3A' }}>Ingen oppgaver ennå — klikk "Ny oppgave" for å legge til</div>
            </div>
          )}
          {view === 'week' ? (
            <WeekView
              weekStart={weekStart}
              tasks={tasks}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              onSelectTask={setSelectedTask}
            />
          ) : (
            <MonthView
              viewDate={monthViewDate}
              tasks={tasks}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              onSelectTask={setSelectedTask}
            />
          )}
        </div>

        {/* Right panel: mini-calendar + task detail */}
        <div style={{
          width: 240, flexShrink: 0, borderLeft: '1px solid #2A2A2A',
          padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: 14,
          overflowY: 'auto',
        }}>
          <MiniCalendar selected={selectedDate} onSelect={setSelectedDate} tasks={tasks} />

          {/* Selected-day task list */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#5A5A5A', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
              {selectedDate.toLocaleDateString('no-NO', { weekday: 'long', day: 'numeric', month: 'short' })}
            </div>
            {tasks.filter(t => taskOccursOn(t, selectedDate)).length === 0 ? (
              <div style={{ fontSize: 12, color: '#3A3A3A' }}>Ingen oppgaver denne dagen</div>
            ) : (
              tasks.filter(t => taskOccursOn(t, selectedDate)).map(t => (
                <button key={t.id} onClick={() => setSelectedTask(t)} style={{
                  width: '100%', textAlign: 'left', padding: '8px 10px',
                  borderRadius: 8, border: '1px solid #2A2A2A',
                  background: selectedTask?.id === t.id ? '#252525' : '#1C1C1C',
                  cursor: 'pointer', fontFamily: 'inherit', marginBottom: 6,
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: t.color, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#E5E5E5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</div>
                    <div style={{ fontSize: 10, color: '#5A5A5A' }}>{t.timeOfDay}</div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── Task detail overlay (slides in over right panel) ── */}
      {selectedTask && (
        <div style={{
          position: 'absolute', right: 0, top: 0, bottom: 0,
          width: 320, zIndex: 50,
          background: '#161616', borderLeft: '1px solid #2A2A2A',
          padding: '16px 14px', overflowY: 'auto',
        }}>
          <TaskDetailPanel
            task={selectedTask}
            onClose={() => setSelectedTask(null)}
            onToggleActive={toggleActive}
            onDelete={handleDeleteTask}
            onRunNow={handleRunNow}
          />
        </div>
      )}

      {/* ── Create task modal ── */}
      {showCreateModal && (
        <CreateTaskModal
          onClose={() => setShowCreateModal(false)}
          onCreate={async (proposal) => {
            await createTask(proposal, 'manual')
            setShowCreateModal(false)
          }}
        />
      )}
    </div>
  )
}

