import { useState } from 'react'
import {
  ChevronDown, ChevronUp, Check, Clock, Monitor,
  X, Maximize2, Minimize2, Code2, Globe, FileText,
  Terminal, Cpu
} from 'lucide-react'
import { cn } from '@/lib/utils'

export interface TaskStep {
  id: string
  label: string
  status: 'pending' | 'running' | 'done' | 'error'
  tool?: 'browser' | 'code' | 'file' | 'terminal' | 'search'
}

export interface AgentTask {
  id: string
  title: string
  steps: TaskStep[]
  currentStep: number
  totalSteps: number
  status: 'running' | 'done' | 'error' | 'paused'
  previewImage?: string
  currentTool?: string
}

interface TaskPanelProps {
  task: AgentTask
  onContinue?: () => void
}

const toolIcons: Record<string, React.ReactNode> = {
  browser:  <Globe size={13} />,
  code:     <Code2 size={13} />,
  file:     <FileText size={13} />,
  terminal: <Terminal size={13} />,
  search:   <Cpu size={13} />,
}

const toolLabels: Record<string, string> = {
  browser:  'Nettleser',
  code:     'Kode',
  file:     'Fil',
  terminal: 'Terminal',
  search:   'Søk',
}

export function TaskPanel({ task, onContinue }: TaskPanelProps) {
  const [expanded, setExpanded] = useState(true)
  const [previewExpanded, setPreviewExpanded] = useState(false)

  const completedSteps = task.steps.filter(s => s.status === 'done').length
  const progress = task.totalSteps > 0 ? (completedSteps / task.totalSteps) * 100 : 0

  return (
    <div
      className="rounded-2xl overflow-hidden animate-slide-up"
      style={{
        background: '#1E1E1E',
        border: '1px solid #2A2A2A',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      }}
    >
      {/* Computer preview header */}
      {task.previewImage && (
        <div
          className="relative cursor-pointer group"
          onClick={() => setPreviewExpanded(!previewExpanded)}
          style={{ height: previewExpanded ? 200 : 80, transition: 'height 250ms ease', overflow: 'hidden' }}
        >
          <img
            src={task.previewImage}
            alt="Sine sin datamaskin"
            className="w-full h-full object-cover object-top"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#1E1E1E]" />

          {/* Computer label */}
          <div className="absolute top-3 left-3 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg overflow-hidden" style={{ background: '#0D0D0D', border: '1px solid #3A3A3A' }}>
              <img src={task.previewImage} alt="" className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="text-[12px] font-medium text-[#E5E5E5]">Sine sin datamaskin</div>
              {task.currentTool && (
                <div className="flex items-center gap-1 text-[11px] text-[#8A8A8A]">
                  <span className="text-[#555]">{toolIcons[task.currentTool]}</span>
                  <span>Sine bruker {toolLabels[task.currentTool] ?? task.currentTool}</span>
                </div>
              )}
            </div>
          </div>

          {/* Expand button */}
          <button className="absolute top-3 right-3 p-1.5 rounded-lg text-[#555] hover:text-[#8A8A8A] hover:bg-[#2A2A2A] transition-all opacity-0 group-hover:opacity-100">
            {previewExpanded ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          </button>
        </div>
      )}

      {/* Task progress */}
      <div className="p-4">
        {/* Header row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Monitor size={14} className="text-[#8A8A8A]" />
            <span className="text-[13px] font-medium text-[#E5E5E5]">Oppgavefremdrift</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[12px] text-[#555]">
              {completedSteps} / {task.totalSteps}
            </span>
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-1 rounded text-[#555] hover:text-[#8A8A8A] transition-colors"
            >
              {expanded ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-0.5 rounded-full mb-3" style={{ background: '#2A2A2A' }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ background: '#1A93FE', width: `${progress}%` }}
          />
        </div>

        {/* Steps list */}
        {expanded && (
          <div className="space-y-1.5 mb-3">
            {task.steps.map(step => (
              <StepItem key={step.id} step={step} />
            ))}
          </div>
        )}

        {/* Action buttons */}
        {task.status === 'running' && (
          <div className="flex items-center gap-2 mt-2">
            <div className="flex items-center gap-1.5 text-[12px] text-[#555]">
              <div className="w-1.5 h-1.5 rounded-full bg-[#1A93FE] animate-pulse" />
              <span>Kjører...</span>
            </div>
          </div>
        )}

        {task.status === 'paused' && onContinue && (
          <button
            onClick={onContinue}
            className="w-full py-2 rounded-xl text-[13px] font-medium text-[#E5E5E5] transition-all mt-2"
            style={{ background: '#2A2A2A', border: '1px solid #3A3A3A' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#333333')}
            onMouseLeave={e => (e.currentTarget.style.background = '#2A2A2A')}
          >
            Fortsett
          </button>
        )}
      </div>
    </div>
  )
}

function StepItem({ step }: { step: TaskStep }) {
  return (
    <div className="flex items-center gap-2.5">
      {/* Status icon */}
      <div className="flex-shrink-0 w-4 h-4 flex items-center justify-center">
        {step.status === 'done' && (
          <Check size={13} className="text-[#1A93FE]" />
        )}
        {step.status === 'running' && (
          <div className="w-3 h-3 rounded-full border-2 border-[#1A93FE] border-t-transparent animate-spin" />
        )}
        {step.status === 'pending' && (
          <Clock size={13} className="text-[#444]" />
        )}
        {step.status === 'error' && (
          <X size={13} className="text-red-400" />
        )}
      </div>

      {/* Tool icon */}
      {step.tool && (
        <span className={cn(
          'flex-shrink-0',
          step.status === 'done' ? 'text-[#555]' : step.status === 'running' ? 'text-[#8A8A8A]' : 'text-[#444]'
        )}>
          {toolIcons[step.tool]}
        </span>
      )}

      {/* Label */}
      <span className={cn(
        'text-[13px] flex-1 truncate',
        step.status === 'done'    ? 'text-[#555] line-through' :
        step.status === 'running' ? 'text-[#E5E5E5]' :
        step.status === 'error'   ? 'text-red-400' :
        'text-[#555]'
      )}>
        {step.label}
      </span>
    </div>
  )
}
