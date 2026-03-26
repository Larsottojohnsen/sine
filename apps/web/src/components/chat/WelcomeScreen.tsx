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
  { icon: <Presentation size={14} />, label: 'Lag presentasjon', prompt: 'Lag en presentasjon om' },
  { icon: <Globe size={14} />, label: 'Bygg nettside', prompt: 'Bygg en nettside for' },
  { icon: <Code2 size={14} />, label: 'Skriv kode', prompt: 'Skriv kode for' },
  { icon: <Palette size={14} />, label: 'Design', prompt: 'Design et' },
  { icon: <MoreHorizontal size={14} />, label: 'Mer', prompt: '' },
]

export function WelcomeScreen({ language, onSuggestion }: WelcomeScreenProps) {
  const t = getTranslations(language)

  return (
    <div className="flex flex-col items-center justify-center flex-1 px-6 pb-4 animate-fade-in">
      {/* Title */}
      <h1
        className="text-[32px] font-light text-center mb-8 tracking-tight"
        style={{ color: '#E5E5E5', letterSpacing: '-0.02em' }}
      >
        {t.chat.welcome.title}
      </h1>

      {/* Quick action chips */}
      <div className="flex flex-wrap items-center justify-center gap-2 max-w-2xl">
        {quickActions.map((action, i) => (
          <button
            key={i}
            onClick={() => action.prompt && onSuggestion(action.prompt)}
            className="quick-action"
          >
            <span className="opacity-70">{action.icon}</span>
            <span>{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
