import { useState, useRef, useCallback, type KeyboardEvent } from 'react'
import { Plus, GitBranch, MessageSquare, Mic, ArrowUp, Square } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SineModel } from '@/types'
import { getTranslations } from '@/i18n'

interface ChatInputProps {
  onSend: (message: string) => void
  onStop?: () => void
  isStreaming?: boolean
  model: SineModel
  onModelChange: (model: SineModel) => void
  language: 'no' | 'en'
  disabled?: boolean
}

export function ChatInput({
  onSend,
  onStop,
  isStreaming,
  model,
  onModelChange,
  language,
  disabled,
}: ChatInputProps) {
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const t = getTranslations(language)

  const adjustHeight = useCallback(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 200) + 'px'
  }, [])

  const handleSend = useCallback(() => {
    const trimmed = value.trim()
    if (!trimmed || isStreaming || disabled) return
    onSend(trimmed)
    setValue('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }, [value, isStreaming, disabled, onSend])

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }, [handleSend])

  const canSend = value.trim().length > 0 && !disabled

  return (
    <div className="px-4 pb-4 pt-2">
      <div
        className="relative rounded-2xl transition-all"
        style={{
          background: '#363538',
          border: '1px solid #4a4a4a',
        }}
      >
        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={e => { setValue(e.target.value); adjustHeight() }}
          onKeyDown={handleKeyDown}
          placeholder={t.app.placeholder}
          disabled={disabled}
          rows={1}
          className={cn(
            'w-full resize-none bg-transparent px-4 pt-3.5 pb-2 text-sm text-[#DADADA] placeholder-[#7F7F7F]',
            'focus:outline-none leading-relaxed',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          style={{ maxHeight: 200, minHeight: 44 }}
        />

        {/* Bottom toolbar */}
        <div className="flex items-center justify-between px-3 pb-2.5">
          {/* Left tools */}
          <div className="flex items-center gap-1">
            <ToolButton icon={<Plus size={16} />} title={t.chat.uploadFile} />
            <ToolButton icon={<GitBranch size={16} />} title="GitHub" />
            <ToolButton icon={<MessageSquare size={16} />} title="Kontekst" />

            {/* Model selector */}
            <ModelSelector model={model} onModelChange={onModelChange} />
          </div>

          {/* Right: mic + send */}
          <div className="flex items-center gap-2">
            <ToolButton icon={<Mic size={16} />} title={t.chat.voiceInput} />

            {isStreaming ? (
              <button
                onClick={onStop}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                style={{ background: '#DADADA' }}
                title={t.chat.stop}
              >
                <Square size={14} fill="#272727" className="text-[#272727]" />
              </button>
            ) : (
              <button
                onClick={handleSend}
                disabled={!canSend}
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center transition-all',
                  canSend
                    ? 'opacity-100 cursor-pointer'
                    : 'opacity-30 cursor-not-allowed'
                )}
                style={{ background: canSend ? '#DADADA' : '#5a5a5a' }}
                title={t.chat.send}
              >
                <ArrowUp size={16} className="text-[#272727]" strokeWidth={2.5} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <p className="text-center text-[11px] text-[#7F7F7F] mt-2">
        Sine kan gjøre feil. Sjekk viktig informasjon.
      </p>
    </div>
  )
}

function ToolButton({ icon, title, onClick }: { icon: React.ReactNode; title: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="p-1.5 rounded-lg text-[#7F7F7F] hover:text-[#DADADA] hover:bg-[#4a4a4a] transition-colors"
    >
      {icon}
    </button>
  )
}

function ModelSelector({ model, onModelChange }: { model: SineModel; onModelChange: (m: SineModel) => void }) {
  const [open, setOpen] = useState(false)

  const labels: Record<SineModel, string> = {
    'sine-1': 'Sine 1.0',
    'sine-pro': 'Sine Pro',
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-[#7F7F7F] hover:text-[#DADADA] hover:bg-[#4a4a4a] transition-colors"
      >
        <span>{labels[model]}</span>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {open && (
        <div
          className="absolute bottom-full mb-1 left-0 rounded-xl overflow-hidden z-50 py-1 min-w-[140px]"
          style={{ background: '#1F1F1F', border: '1px solid #3a3a3a' }}
        >
          {(['sine-1', 'sine-pro'] as SineModel[]).map(m => (
            <button
              key={m}
              onClick={() => { onModelChange(m); setOpen(false) }}
              className={cn(
                'w-full text-left px-3 py-2 text-sm transition-colors',
                model === m
                  ? 'text-[#1A93FE] bg-[#2a2a2a]'
                  : 'text-[#DADADA] hover:bg-[#2a2a2a]'
              )}
            >
              {labels[m]}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
