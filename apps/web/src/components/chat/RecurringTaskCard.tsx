import { useState } from 'react'
import { CalendarDays, ChevronDown, Clock, Repeat, Zap, CheckCircle2, X, ArrowRight, AlertTriangle } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useRecurringTasks, categoryColor } from '@/hooks/useRecurringTasks'
import { useNav } from '@/App'

export interface RecurringTaskProposal {
  title: string
  description: string
  category: string
  color?: string
  frequency: 'daily' | 'weekly' | 'monthly' | 'custom'
  customDays?: number[]
  dayOfWeek?: number
  dayOfMonth?: number
  timeOfDay: string
  connectorId?: string
  connectorName?: string
  agentPrompt: string
  endsAt?: string
}

interface RecurringTaskCardProps {
  proposal: RecurringTaskProposal
  /** If true, the card is shown in collapsed/preview mode (like the Manus skill card) */
  compact?: boolean
}

const WEEKDAYS_NO = ['mandag', 'tirsdag', 'onsdag', 'torsdag', 'fredag', 'lørdag', 'søndag']

function formatFreq(p: RecurringTaskProposal): string {
  if (p.frequency === 'daily') return 'Daglig'
  if (p.frequency === 'weekly' && p.dayOfWeek !== undefined)
    return `Hver ${WEEKDAYS_NO[p.dayOfWeek]}`
  if (p.frequency === 'monthly' && p.dayOfMonth !== undefined)
    return `Den ${p.dayOfMonth}. hver måned`
  if (p.frequency === 'custom' && p.customDays?.length)
    return p.customDays.map(d => WEEKDAYS_NO[d].slice(0, 3)).join(', ')
  return p.frequency
}

export function RecurringTaskCard({ proposal, compact = false }: RecurringTaskCardProps) {
  const [expanded, setExpanded] = useState(!compact)
  const [status, setStatus] = useState<'pending' | 'accepted' | 'dismissed'>('pending')
  const [loading, setLoading] = useState(false)

  const { user } = useAuth()
  const { createTask } = useRecurringTasks(user?.id ?? null)
  const { setCurrentPage } = useNav()

  const color = proposal.color || categoryColor(proposal.category)

  const handleActivate = async () => {
    setLoading(true)
    try {
      await createTask(proposal, 'agent', false)
      setStatus('accepted')
    } catch {
      // silently fail — user can retry
    } finally {
      setLoading(false)
    }
  }

  const handleDismiss = () => setStatus('dismissed')

  const handleViewInCalendar = () => {
    setCurrentPage('calendar')
  }

  // Missing connector warning
  const missingConnector = proposal.connectorId && !proposal.connectorName

  return (
    <div className="recurring-task-card">
      {/* ── Header (always visible, clickable to expand) ── */}
      <div className="recurring-task-card-header" onClick={() => setExpanded(e => !e)}>
        <div className="recurring-task-card-title-row">
          <span className="recurring-task-card-icon">
            <CalendarDays size={14} />
          </span>
          <span className="recurring-task-card-title">{proposal.title}</span>
          {/* Category badge */}
          <span style={{
            display: 'inline-flex', alignItems: 'center',
            padding: '1px 7px', borderRadius: 20,
            background: color + '22', border: `1px solid ${color}44`,
            fontSize: 10, color: color, fontWeight: 600, flexShrink: 0,
          }}>
            {proposal.category}
          </span>
        </div>
        <ChevronDown
          size={14}
          className={`recurring-task-card-chevron${expanded ? ' open' : ''}`}
        />
      </div>

      {/* ── Expanded body ── */}
      {expanded && (
        <div className="recurring-task-card-body">
          {/* Description */}
          {proposal.description && (
            <p className="recurring-task-card-description">{proposal.description}</p>
          )}

          {/* Meta rows */}
          <div className="recurring-task-card-meta">
            <div className="recurring-task-card-meta-row">
              <Repeat size={12} />
              <span>{formatFreq(proposal)} kl. {proposal.timeOfDay} (norsk tid)</span>
            </div>
            {proposal.endsAt && (
              <div className="recurring-task-card-meta-row">
                <Clock size={12} />
                <span>Slutter {new Date(proposal.endsAt).toLocaleDateString('no-NO')}</span>
              </div>
            )}
            {proposal.connectorName && (
              <div className="recurring-task-card-meta-row">
                <Zap size={12} />
                <span>Bruker {proposal.connectorName}</span>
              </div>
            )}
          </div>

          {/* Missing connector warning */}
          {missingConnector && (
            <div className="recurring-task-card-connector-warning">
              <AlertTriangle size={13} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>
                Denne oppgaven krever tilkobling til <strong>{proposal.connectorId}</strong>.
                Gå til Innstillinger → Tilkoblinger for å koble den opp før du aktiverer.
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="recurring-task-card-actions">
            {status === 'pending' ? (
              <>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    className="recurring-task-card-btn-activate"
                    onClick={handleActivate}
                    disabled={loading}
                  >
                    {loading ? 'Aktiverer...' : 'Aktiver agentisk oppgave'}
                  </button>
                  <button
                    className="recurring-task-card-btn-dismiss"
                    onClick={handleDismiss}
                  >
                    Avvis
                  </button>
                </div>
                <button className="recurring-task-card-view-more" onClick={handleViewInCalendar}>
                  Se mer <ArrowRight size={11} />
                </button>
              </>
            ) : status === 'accepted' ? (
              <>
                <span className="recurring-task-card-status accepted">
                  <CheckCircle2 size={13} />
                  Godtatt
                </span>
                <button className="recurring-task-card-view-more" onClick={handleViewInCalendar}>
                  Vis i kalender <ArrowRight size={11} />
                </button>
              </>
            ) : (
              <span className="recurring-task-card-status dismissed">
                <X size={13} />
                Avvist
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
