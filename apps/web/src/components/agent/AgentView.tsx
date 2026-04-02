import { useState, useEffect, useRef } from 'react'
import { TaskPanel, type AgentTask } from './TaskPanel'
import { ChatMessage } from '../chat/ChatMessage'
import { ChatInput } from '../chat/ChatInput'
import type { Message, SineModel } from '@/types'

// Demo-data for å vise agent-visningen
const DEMO_TASK: AgentTask = {
  id: 'demo-1',
  title: 'Analyser nettside og lag rapport',
  totalSteps: 5,
  currentStep: 2,
  status: 'paused',
  currentTool: 'browser',
  steps: [
    { id: '1', label: 'Overvåk Astar Island Round 5 resultater og analyser ytelse', status: 'done', tool: 'browser' },
    { id: '2', label: 'Forbedre Tripletex-agent for å håndtere flere oppgavetyper', status: 'pending', tool: 'code' },
    { id: '3', label: 'Test og deploy den forbedrede agenten for nye innsendinger', status: 'pending', tool: 'terminal' },
    { id: '4', label: 'Fortsett å iterere på alle oppgaver for å maksimere total score', status: 'pending' },
    { id: '5', label: 'Rapporter endelige resultater og stillinger til bruker', status: 'pending', tool: 'file' },
  ],
}

const DEMO_MESSAGES: Message[] = [
  {
    id: '1',
    role: 'assistant',
    content: `Det ser ut som vi har et problem med autentiseringen for Astar Island-simuleringene. Jeg fikk en **401 Unauthorized** feil på alle queries.

Dette skjer vanligvis hvis sesjonen har utløpt eller hvis vi må logge inn på nytt for å få et ferskt token.

Siden du er på PC-en nå, kan du raskt sjekke om du fortsatt er logget inn på app.ainm.no? Hvis du er logget inn, prøv å laste inn Astar Island-siden på nytt.

I mellomtiden skal jeg prøve å hente et nytt token automatisk fra browseren din for å se om det løser problemet. Vi har fortsatt ca. 75 minutter igjen av runden, så vi har god tid til å fikse dette!`,
    createdAt: new Date(),
    isStreaming: false,
  },
  {
    id: '2',
    role: 'user',
    content: 'Jeg er logget inn men du er kanskje ikke',
    createdAt: new Date(),
    isStreaming: false,
  },
  {
    id: '3',
    role: 'assistant',
    content: `Det stemmer, det er sannsynligvis min browser-sesjon som har utløpt eller mangler riktig autentisering for API-kallene.

Siden du er logget inn på din PC, er den enkleste løsningen at du tar over browseren min et øyeblikk for å logge inn på nytt i mitt miljø. Da vil jeg få et ferskt token som jeg kan bruke til å kjøre alle simuleringene for Round 8.

**Slik gjør vi det:**

1. Jeg åpner innloggingssiden for deg nå.
2. Du tar over kontrollen og logger inn med din bruker.
3. Når du er inne, gir du kontrollen tilbake til meg, så fikser jeg resten av Round 8 automatisk!

Er du klar for å ta over browseren et lite øyeblikk?`,
    createdAt: new Date(),
    isStreaming: false,
  },
]

interface AgentViewProps {
  language?: 'no' | 'en'
  model?: SineModel
  onModelChange?: (m: SineModel) => void
}

export function AgentView({ language = 'no', model = 'sine-lite', onModelChange }: AgentViewProps) {
  const [messages] = useState<Message[]>(DEMO_MESSAGES)
  const [task] = useState<AgentTask>(DEMO_TASK)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="flex flex-col h-full" style={{ background: '#1C1C1C' }}>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto py-4">
          {messages.map((msg, i) => (
            <ChatMessage
              key={msg.id}
              message={msg}
              isLast={i === messages.length - 1}
            />
          ))}

          {/* Task panel embedded in chat */}
          <div className="px-4 py-3">
            <TaskPanel
              task={task}
              onContinue={() => {}}
            />
          </div>

          <div ref={bottomRef} className="h-4" />
        </div>
      </div>

      {/* Input */}
      <div className="max-w-3xl mx-auto w-full">
        <ChatInput
          onSend={() => {}}
          isStreaming={false}
          model={model}
          onModelChange={onModelChange ?? (() => {})}
          language={language}
        />
      </div>
    </div>
  )
}
