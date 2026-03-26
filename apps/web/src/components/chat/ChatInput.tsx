import { useState, useRef, useCallback, type KeyboardEvent } from 'react'
import {
  Plus, GitBranch, MessageSquare, Mic, ArrowUp, Square,
  ChevronDown, Globe, Cpu
} from 'lucide-react'
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
    <div className="px-4 pb-5 pt-1 flex-shrink-0">
      {/* Main input container */}
      <div
        style={{
          background: '#222222',
          border: '1px solid #2E2E2E',
          borderRadius: 16,
          boxShadow: '0 2px 16px rgba(0,0,0,0.35)',
          transition: 'border-color 150ms',
        }}
        onFocusCapture={e => (e.currentTarget.style.borderColor = '#3A3A3A')}
        onBlurCapture={e => (e.currentTarget.style.borderColor = '#2E2E2E')}
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
            'w-full resize-none bg-transparent px-4 pt-3.5 pb-2 text-[14px] leading-relaxed focus:outline-none',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          style={{
            color: '#D0D0D0',
            maxHeight: 200,
            minHeight: 46,
          }}
        />

        {/* Bottom toolbar */}
        <div className="flex items-center justify-between px-3 pb-2.5 pt-0.5">
          {/* Left tools */}
          <div className="flex items-center gap-0.5">
            <ToolButton icon={<Plus size={16} />} title={t.chat.uploadFile} />
            <ToolButton icon={<GitBranch size={16} />} title="GitHub" />
            <ToolButton icon={<MessageSquare size={16} />} title="Kontekst" />
          </div>

          {/* Right: model + mic + send */}
          <div className="flex items-center gap-1.5">
            <ModelSelector model={model} onModelChange={onModelChange} />
            <ToolButton icon={<Mic size={16} />} title={t.chat.voiceInput} />

            {isStreaming ? (
              <button
                onClick={onStop}
                className="w-7 h-7 rounded-full flex items-center justify-center transition-all hover:opacity-80"
                style={{ background: '#D0D0D0' }}
                title={t.chat.stop}
              >
                <Square size={11} fill="#1C1C1C" style={{ color: '#1C1C1C' }} />
              </button>
            ) : (
              <button
                onClick={handleSend}
                disabled={!canSend}
                className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center transition-all',
                  canSend ? 'hover:opacity-85 cursor-pointer' : 'cursor-not-allowed'
                )}
                style={{ background: canSend ? '#D0D0D0' : '#2A2A2A' }}
                title={t.chat.send}
              >
                <ArrowUp size={14} style={{ color: '#1C1C1C', opacity: canSend ? 1 : 0.3 }} strokeWidth={2.5} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <p className="text-center mt-2" style={{ fontSize: 11, color: '#2E2E2E' }}>
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
      className="p-1.5 rounded-lg transition-colors"
      style={{ color: '#4A4A4A' }}
      onMouseEnter={e => (e.currentTarget.style.color = '#8A8A8A')}
      onMouseLeave={e => (e.currentTarget.style.color = '#4A4A4A')}
    >
      {icon}
    </button>
  )
}

function ModelSelector({ model, onModelChange }: { model: SineModel; onModelChange: (m: SineModel) => void }) {
  const [open, setOpen] = useState(false)

  const labels: Record<SineModel, { name: string; desc: string; icon: React.ReactNode }> = {
    'sine-1':   { name: 'Sine 1.0',  desc: 'Rask og effektiv',    icon: <Cpu size={12} /> },
    'sine-pro': { name: 'Sine Pro',  desc: 'Kraftfull og presis',  icon: <Globe size={12} /> },
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 px-2 py-1 rounded-lg text-[12px] transition-colors"
        style={{ color: '#4A4A4A' }}
        onMouseEnter={e => (e.currentTarget.style.color = '#8A8A8A')}
        onMouseLeave={e => (e.currentTarget.style.color = '#4A4A4A')}
      >
        <span>{labels[model].name}</span>
        <ChevronDown size={10} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="absolute bottom-full mb-2 left-0 rounded-xl overflow-hidden z-50 py-1 min-w-[180px]"
            style={{
              background: '#1A1A1A',
              border: '1px solid #2E2E2E',
              boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
            }}
          >
            {(['sine-1', 'sine-pro'] as SineModel[]).map(m => (
              <button
                key={m}
                onClick={() => { onModelChange(m); setOpen(false) }}
                className="w-full text-left px-3 py-2.5 transition-colors flex items-center gap-2.5"
                style={{ background: model === m ? '#242424' : 'transparent' }}
                onMouseEnter={e => { if (model !== m) e.currentTarget.style.background = '#1E1E1E' }}
                onMouseLeave={e => { if (model !== m) e.currentTarget.style.background = 'transparent' }}
              >
                <span style={{ color: model === m ? '#1A93FE' : '#4A4A4A' }}>
                  {labels[m].icon}
                </span>
                <div>
                  <div
                    className="text-[13px] font-medium"
                    style={{ color: model === m ? '#1A93FE' : '#D0D0D0' }}
                  >
                    {labels[m].name}
                  </div>
                  <div className="text-[11px]" style={{ color: '#4A4A4A' }}>{labels[m].desc}</div>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
