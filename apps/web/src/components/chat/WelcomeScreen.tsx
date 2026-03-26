import { Presentation, Globe, BarChart3, FileText } from 'lucide-react'
import { getTranslations } from '@/i18n'

interface WelcomeScreenProps {
  language: 'no' | 'en'
  onSuggestion: (text: string) => void
}

const suggestionIcons = [
  <Presentation size={16} />,
  <Globe size={16} />,
  <BarChart3 size={16} />,
  <FileText size={16} />,
]

export function WelcomeScreen({ language, onSuggestion }: WelcomeScreenProps) {
  const t = getTranslations(language)

  return (
    <div className="flex flex-col items-center justify-center flex-1 px-4 pb-8">
      {/* Logo */}
      <div className="mb-8">
        <img src="/sine/sine-logo.webp" alt="Sine" className="h-12 w-auto opacity-60" />
      </div>

      {/* Title */}
      <h1 className="text-3xl font-light text-[#DADADA] mb-2 text-center tracking-tight">
        {t.chat.welcome.title}
      </h1>

      {/* Suggestions */}
      <div className="flex flex-wrap gap-2 justify-center mt-8 max-w-lg">
        {t.chat.suggestions.map((suggestion, i) => (
          <button
            key={suggestion}
            onClick={() => onSuggestion(suggestion)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm text-[#DADADA] transition-colors"
            style={{ background: '#343434', border: '1px solid #3a3a3a' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#3e3e3e')}
            onMouseLeave={e => (e.currentTarget.style.background = '#343434')}
          >
            <span className="text-[#7F7F7F]">{suggestionIcons[i]}</span>
            <span>{suggestion}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
