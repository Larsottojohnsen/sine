import { Bot, Plus, ChevronRight, Zap, Globe, Code2, FileText, BarChart3 } from 'lucide-react'

interface AgentTemplate {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  color: string
  category: string
}

const AGENT_TEMPLATES: AgentTemplate[] = [
  {
    id: 'web-researcher',
    name: 'Nettforsker',
    description: 'Søker og analyserer informasjon fra nettet, sammenstiller rapporter og oppsummerer funn.',
    icon: <Globe size={18} />,
    color: '#1A93FE',
    category: 'Forskning',
  },
  {
    id: 'code-assistant',
    name: 'Kodeassistent',
    description: 'Skriver, debugger og refaktorerer kode på tvers av alle programmeringsspråk.',
    icon: <Code2 size={18} />,
    color: '#A855F7',
    category: 'Utvikling',
  },
  {
    id: 'data-analyst',
    name: 'Dataanalytiker',
    description: 'Analyserer datasett, lager visualiseringer og gir innsikt fra strukturerte data.',
    icon: <BarChart3 size={18} />,
    color: '#10B981',
    category: 'Analyse',
  },
  {
    id: 'doc-writer',
    name: 'Dokumentforfatter',
    description: 'Skriver og redigerer dokumenter, rapporter, presentasjoner og teknisk innhold.',
    icon: <FileText size={18} />,
    color: '#F59E0B',
    category: 'Innhold',
  },
  {
    id: 'task-automator',
    name: 'Oppgaveautomatisering',
    description: 'Automatiserer repetitive oppgaver, planlegger og utfører flerstegs arbeidsflyter.',
    icon: <Zap size={18} />,
    color: '#EF4444',
    category: 'Automatisering',
  },
]

export function AgentsPage() {
  return (
    <div className="flex-1 overflow-y-auto" style={{ background: '#1C1C1C' }}>
      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: '#1A93FE' }}>
              <Bot size={16} className="text-white" />
            </div>
            <h1 className="text-[22px] font-medium text-[#E5E5E5]">Agenter</h1>
          </div>
          <p className="text-[14px] text-[#555] ml-11">
            Spesialiserte AI-agenter som kan utføre komplekse oppgaver på dine vegne.
          </p>
        </div>

        {/* Create custom agent */}
        <button
          className="w-full flex items-center gap-3 p-4 rounded-xl mb-6 transition-all group text-left"
          style={{ background: '#1E1E1E', border: '1px dashed #3A3A3A' }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = '#1A93FE')}
          onMouseLeave={e => (e.currentTarget.style.borderColor = '#3A3A3A')}
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#2A2A2A' }}>
            <Plus size={18} className="text-[#555] group-hover:text-[#1A93FE] transition-colors" />
          </div>
          <div>
            <div className="text-[14px] font-medium text-[#8A8A8A] group-hover:text-[#E5E5E5] transition-colors">
              Opprett tilpasset agent
            </div>
            <div className="text-[12px] text-[#444]">
              Bygg en agent med dine egne instruksjoner og verktøy
            </div>
          </div>
          <ChevronRight size={14} className="ml-auto text-[#444] group-hover:text-[#8A8A8A] transition-colors" />
        </button>

        {/* Templates */}
        <div className="mb-4">
          <h2 className="text-[11px] font-medium text-[#444] uppercase tracking-wider mb-3">Maler</h2>
          <div className="space-y-2">
            {AGENT_TEMPLATES.map(agent => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function AgentCard({ agent }: { agent: AgentTemplate }) {
  return (
    <button
      className="w-full flex items-center gap-3.5 p-4 rounded-xl transition-all group text-left"
      style={{ background: '#1E1E1E', border: '1px solid #2A2A2A' }}
      onMouseEnter={e => (e.currentTarget.style.background = '#242424')}
      onMouseLeave={e => (e.currentTarget.style.background = '#1E1E1E')}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: `${agent.color}18` }}
      >
        <span style={{ color: agent.color }}>{agent.icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[14px] font-medium text-[#E5E5E5]">{agent.name}</span>
          <span
            className="text-[10px] px-1.5 py-0.5 rounded font-medium"
            style={{ background: '#2A2A2A', color: '#555' }}
          >
            {agent.category}
          </span>
        </div>
        <p className="text-[12px] text-[#555] truncate">{agent.description}</p>
      </div>
      <ChevronRight size={14} className="text-[#333] group-hover:text-[#555] transition-colors flex-shrink-0" />
    </button>
  )
}
