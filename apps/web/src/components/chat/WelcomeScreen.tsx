import {
  Presentation, Globe,
  Code2, Palette, MoreHorizontal
} from 'lucide-react'
import { getTranslations } from '@/i18n'

interface WelcomeScreenProps {
  language: 'no' | 'en'
  onSuggestion: (text: string) => void
  /** Når true: blobs fader ut (melding er sendt) */
  fadingOut?: boolean
}

const quickActions = [
  { icon: <Presentation size={14} />, label: 'Lag presentasjon', prompt: 'Lag en presentasjon om ' },
  { icon: <Globe size={14} />, label: 'Bygg nettside', prompt: 'Bygg en nettside for ' },
  { icon: <Code2 size={14} />, label: 'Skriv kode', prompt: 'Skriv kode for ' },
  { icon: <Palette size={14} />, label: 'Design', prompt: 'Design et ' },
  { icon: <MoreHorizontal size={14} />, label: 'Mer', prompt: '' },
]

export function WelcomeScreen({ language, onSuggestion, fadingOut }: WelcomeScreenProps) {
  const t = getTranslations(language)

  return (
    <div className="welcome-screen animate-fade-in" style={{ position: 'relative', overflow: 'hidden' }}>
      {/* ── Blob-bakgrunner ── */}
      <div className={`welcome-blob welcome-blob-blue${fadingOut ? ' fading-out' : ''}`} />
      <div className={`welcome-blob welcome-blob-purple${fadingOut ? ' fading-out' : ''}`} />

      {/* Innhold */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <h1 className="welcome-title">
          {t.chat.welcome.title}
        </h1>

        <div className="welcome-chips">
          {quickActions.map((action, i) => (
            <button
              key={i}
              className="welcome-chip"
              onClick={() => action.prompt && onSuggestion(action.prompt)}
            >
              <span style={{ opacity: 0.7 }}>{action.icon}</span>
              <span>{action.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
