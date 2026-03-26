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
    <div className="px-4 pb-4 pt-1 flex-shrink-0">
      {/* Main input container */}
      <div
        className="relative rounded-2xl transition-all"
        style={{
          background: '#242424',
          border: '1px solid #3A3A3A',
          boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
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
            'w-full resize-none bg-transparent px-4 pt-3.5 pb-2 text-[14px] text-[#E5E5E5] placeholder-[#555]',
            'focus:outline-none leading-relaxed',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          style={{ maxHeight: 200, minHeight: 46 }}
        />

        {/* Bottom toolbar */}
        <div className="flex items-center justify-between px-3 pb-2.5">
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
                className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:opacity-80"
                style={{ background: '#E5E5E5' }}
                title={t.chat.stop}
              >
                <Square size={12} fill="#1C1C1C" className="text-[#1C1C1C]" />
              </button>
            ) : (
              <button
                onClick={handleSend}
                disabled={!canSend}
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center transition-all',
                  canSend
                    ? 'hover:opacity-85 cursor-pointer'
                    : 'opacity-25 cursor-not-allowed'
                )}
                style={{ background: canSend ? '#E5E5E5' : '#3A3A3A' }}
                title={t.chat.send}
              >
                <ArrowUp size={15} className="text-[#1C1C1C]" strokeWidth={2.5} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <p className="text-center text-[11px] text-[#3A3A3A] mt-2">
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
      className="p-1.5 rounded-lg text-[#555] hover:text-[#8A8A8A] hover:bg-[#2E2E2E] transition-colors"
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
        className="flex items-center gap-1 px-2 py-1 rounded-lg text-[12px] text-[#555] hover:text-[#8A8A8A] hover:bg-[#2E2E2E] transition-colors"
      >
        <span>{labels[model].name}</span>
        <ChevronDown size={10} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="absolute bottom-full mb-2 left-0 rounded-xl overflow-hidden z-50 py-1 min-w-[180px]"
            style={{ background: '#1A1A1A', border: '1px solid #3A3A3A', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}
          >
            {(['sine-1', 'sine-pro'] as SineModel[]).map(m => (
              <button
                key={m}
                onClick={() => { onModelChange(m); setOpen(false) }}
                className={cn(
                  'w-full text-left px-3 py-2.5 transition-colors flex items-center gap-2.5',
                  model === m
                    ? 'bg-[#2A2A2A]'
                    : 'hover:bg-[#242424]'
                )}
              >
                <span className={model === m ? 'text-[#1A93FE]' : 'text-[#555]'}>
                  {labels[m].icon}
                </span>
                <div>
                  <div className={cn('text-[13px] font-medium', model === m ? 'text-[#1A93FE]' : 'text-[#E5E5E5]')}>
                    {labels[m].name}
                  </div>
                  <div className="text-[11px] text-[#555]">{labels[m].desc}</div>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
