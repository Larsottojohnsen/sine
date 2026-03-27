import { CheckCircle2, Circle, Loader2, XCircle, ChevronDown, ChevronRight, ListTodo } from 'lucide-react'
import type { PlanStep } from '@/types'
import { useState } from 'react'

interface AgentPlanViewProps {
  steps: PlanStep[]
  isActive?: boolean
}

export function AgentPlanView({ steps, isActive = false }: AgentPlanViewProps) {
  const [collapsed, setCollapsed] = useState(false)

  if (steps.length === 0) return null

  const doneCount = steps.filter(s => s.status === 'done').length
  const totalCount = steps.length
  const progress = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0

  return (
    <div className="agent-plan-container">
      {/* Header */}
      <button
        className="agent-plan-header"
        onClick={() => setCollapsed(c => !c)}
      >
        <div className="agent-plan-header-left">
          <ListTodo size={13} className="agent-plan-icon" />
          <span className="agent-plan-title">Plan</span>
          <span className="agent-plan-progress-text">{doneCount}/{totalCount}</span>
        </div>
        <div className="agent-plan-header-right">
          {/* Progress bar */}
          <div className="agent-plan-progress-bar">
            <div
              className="agent-plan-progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
          {collapsed
            ? <ChevronRight size={12} className="agent-plan-chevron" />
            : <ChevronDown size={12} className="agent-plan-chevron" />
          }
        </div>
      </button>

      {/* Steps */}
      {!collapsed && (
        <div className="agent-plan-steps">
          {steps.map((step) => (
            <div
              key={step.id}
              className={`agent-plan-step agent-plan-step-${step.status}`}
            >
              {/* Status-ikon */}
              <div className="agent-plan-step-icon">
                {step.status === 'done' && <CheckCircle2 size={13} />}
                {step.status === 'running' && (
                  <Loader2 size={13} className="agent-plan-spinner" />
                )}
                {step.status === 'error' && <XCircle size={13} />}
                {step.status === 'pending' && <Circle size={13} />}
              </div>
              {/* Tekst */}
              <span className="agent-plan-step-text">
                {step.id}. {step.text}
              </span>
              {/* Running-puls */}
              {step.status === 'running' && isActive && (
                <span className="agent-plan-step-pulse" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
