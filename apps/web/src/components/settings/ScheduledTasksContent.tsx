import { useState } from 'react'
import { Plus, Play, Pause, Trash2, Clock, Repeat } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useRecurringTasks, categoryColor } from '@/hooks/useRecurringTasks'
import type { RecurringTask } from '@/hooks/useRecurringTasks'
import { CreateTaskModal } from '@/components/calendar/CreateTaskModal'
import { KlokkeIcon } from '@/assets/icons/KlokkeIcon'
import type { RecurringTaskProposal } from '@/components/chat/RecurringTaskCard'

const WEEKDAYS_NO = ['Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør', 'Søn']

function formatFreq(task: RecurringTask): string {
  if (task.frequency === 'daily') return 'Daglig'
  if (task.frequency === 'weekly' && task.dayOfWeek !== undefined)
    return `Hver ${WEEKDAYS_NO[task.dayOfWeek].toLowerCase()}`
  if (task.frequency === 'monthly' && task.dayOfMonth !== undefined)
    return `Den ${task.dayOfMonth}. hver mnd`
  if (task.frequency === 'custom' && task.customDays?.length)
    return task.customDays.map(d => WEEKDAYS_NO[d]).join(', ')
  return task.frequency
}

export function ScheduledTasksContent() {
  const { user } = useAuth()
  const { tasks, loading, createTask, toggleActive, deleteTask } = useRecurringTasks(user?.id ?? null)
  const [showCreate, setShowCreate] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleCreate = async (proposal: RecurringTaskProposal) => {
    await createTask(proposal, 'manual', false)
    setShowCreate(false)
  }

  const handleDelete = async (task: RecurringTask) => {
    setDeletingId(task.id)
    await deleteTask(task.id)
    setDeletingId(null)
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 className="settings-title" style={{ margin: 0 }}>Planlagte oppgaver</h2>
        <button
          onClick={() => setShowCreate(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 14px', borderRadius: 8,
            background: '#1A93FE', border: 'none',
            color: '#fff', fontSize: 13, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          <Plus size={14} />
          Ny oppgave
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
          <div style={{ width: 20, height: 20, border: '2px solid #333', borderTopColor: '#1A93FE', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        </div>
      ) : tasks.length === 0 ? (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', padding: '60px 0', gap: 14,
        }}>
          <div style={{ color: '#3A3A3A' }}>
            <KlokkeIcon size={48} />
          </div>
          <p style={{ fontSize: 14, color: '#5A5A5A', textAlign: 'center', margin: 0 }}>
            Du har ingen planlagte oppgaver enda
          </p>
          <button
            onClick={() => setShowCreate(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', borderRadius: 8,
              background: '#1E1E1E', border: '1px solid #2E2E2E',
              color: '#9A9A9A', fontSize: 13,
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            <Plus size={13} />
            Legg til oppgave
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {tasks.map(task => {
            const color = task.color || categoryColor(task.category)
            return (
              <div
                key={task.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 14px', borderRadius: 10,
                  background: '#1A1A1A', border: '1px solid #2A2A2A',
                  opacity: task.isActive ? 1 : 0.5,
                }}
              >
                {/* Color dot */}
                <div style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: color, flexShrink: 0,
                }} />

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#E5E5E5', marginBottom: 3 }}>
                    {task.title}
                  </div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: '#5A5A5A' }}>
                      <Repeat size={10} />
                      {formatFreq(task)}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: '#5A5A5A' }}>
                      <Clock size={10} />
                      {task.timeOfDay}
                    </span>
                    <span style={{
                      fontSize: 10, fontWeight: 600, padding: '2px 7px',
                      borderRadius: 4, background: color + '22', color,
                    }}>
                      {task.category}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button
                    onClick={() => toggleActive(task.id, !task.isActive)}
                    title={task.isActive ? 'Sett på pause' : 'Aktiver'}
                    style={{
                      width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      borderRadius: 6, border: 'none', background: 'transparent',
                      color: task.isActive ? '#1A93FE' : '#5A5A5A', cursor: 'pointer',
                    }}
                  >
                    {task.isActive ? <Pause size={13} /> : <Play size={13} />}
                  </button>
                  <button
                    onClick={() => handleDelete(task)}
                    disabled={deletingId === task.id}
                    title="Slett oppgave"
                    style={{
                      width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      borderRadius: 6, border: 'none', background: 'transparent',
                      color: '#5A5A5A', cursor: 'pointer',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#EF4444')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#5A5A5A')}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showCreate && (
        <CreateTaskModal
          onClose={() => setShowCreate(false)}
          onCreate={handleCreate}
        />
      )}
    </div>
  )
}
