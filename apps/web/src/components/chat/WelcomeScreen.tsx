import {
  Presentation, Globe,
  Code2, Palette, MoreHorizontal
} from 'lucide-react'
import { getTranslations } from '@/i18n'

interface WelcomeScreenProps {
  language: 'no' | 'en'
  onSuggestion: (text: string) => void
}

const quickActions = [
  { icon: <Presentation size={14} />, label: 'Lag presentasjon', prompt: 'Lag en presentasjon om ' },
  { icon: <Globe size={14} />, label: 'Bygg nettside', prompt: 'Bygg en nettside for ' },
  { icon: <Code2 size={14} />, label: 'Skriv kode', prompt: 'Skriv kode for ' },
  { icon: <Palette size={14} />, label: 'Design', prompt: 'Design et ' },
  { icon: <MoreHorizontal size={14} />, label: 'Mer', prompt: '' },
]

export function WelcomeScreen({ language, onSuggestion }: WelcomeScreenProps) {
  const t = getTranslations(language)

  return (
    <div className="flex flex-col items-center justify-center flex-1 px-6 pb-4 animate-fade-in select-none">
      {/* Title */}
      <h1
        style={{
          fontSize: 32,
          fontWeight: 300,
          color: '#D0D0D0',
          letterSpacing: '-0.02em',
          marginBottom: 28,
          textAlign: 'center',
          lineHeight: 1.2,
        }}
      >
        {t.chat.welcome.title}
      </h1>

      {/* Quick action chips */}
      <div className="flex flex-wrap items-center justify-center gap-2 max-w-xl">
        {quickActions.map((action, i) => (
          <button
            key={i}
            onClick={() => action.prompt && onSuggestion(action.prompt)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              padding: '7px 14px',
              borderRadius: 999,
              background: '#222222',
              border: '1px solid #2E2E2E',
              color: '#7A7A7A',
              fontSize: 13,
              cursor: 'pointer',
              transition: 'all 150ms',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = '#2A2A2A'
              e.currentTarget.style.color = '#C0C0C0'
              e.currentTarget.style.borderColor = '#3A3A3A'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = '#222222'
              e.currentTarget.style.color = '#7A7A7A'
              e.currentTarget.style.borderColor = '#2E2E2E'
            }}
          >
            <span style={{ opacity: 0.7 }}>{action.icon}</span>
            <span>{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
