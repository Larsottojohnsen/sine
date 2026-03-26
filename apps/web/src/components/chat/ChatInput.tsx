import { useState, useRef, useCallback, type KeyboardEvent } from 'react'
import {
  Plus, GitBranch, MessageSquare, Mic, ArrowUp, Square,
  ChevronDown, Globe, Cpu, Shield, ShieldOff
} from 'lucide-react'
import type { SineModel } from '@/types'
import { getTranslations } from '@/i18n'
import type { AgentMode } from '@/hooks/useAgent'

interface ChatInputProps {
  onSend: (message: string, mode?: AgentMode) => void
  onStop?: () => void
  isStreaming?: boolean
  model: SineModel
  onModelChange: (model: SineModel) => void
  language: 'no' | 'en'
  disabled?: boolean
  agentMode?: AgentMode
  onAgentModeChange?: (mode: AgentMode) => void
  isAgentActive?: boolean
}

export function ChatInput({
  onSend,
  onStop,
  isStreaming,
  model,
  onModelChange,
  language,
  disabled,
  agentMode = 'safe',
  onAgentModeChange,
  isAgentActive,
}: ChatInputProps) {
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const t = getTranslations(language)
  const isSafeMode = agentMode === 'safe'

  const adjustHeight = useCallback(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 200) + 'px'
  }, [])

  const handleSend = useCallback(() => {
    const trimmed = value.trim()
    if (!trimmed || isStreaming || disabled) return
    onSend(trimmed, agentMode)
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
    <div className="chat-input-area">
      <div className="chat-input-box">
        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={e => { setValue(e.target.value); adjustHeight() }}
          onKeyDown={handleKeyDown}
          placeholder={isAgentActive ? 'Gi agenten en ny oppgave...' : t.app.placeholder}
          disabled={disabled}
          rows={1}
          className="chat-textarea"
          style={{ opacity: disabled ? 0.5 : 1, cursor: disabled ? 'not-allowed' : 'text' }}
        />

        {/* Bottom toolbar */}
        <div className="chat-toolbar">
          <div className="chat-toolbar-left">
            <button className="toolbar-btn" title={t.chat.uploadFile}>
              <Plus size={18} />
            </button>
            <button className="toolbar-btn" title="GitHub">
              <GitBranch size={18} />
            </button>
            <button className="toolbar-btn" title="Kontekst">
              <MessageSquare size={18} />
            </button>

            {/* Safe Mode toggle */}
            {onAgentModeChange && (
              <button
                className="toolbar-btn"
                onClick={() => onAgentModeChange(isSafeMode ? 'power' : 'safe')}
                title={isSafeMode ? 'Safe Mode: PÅ – klikk for å slå av' : 'Safe Mode: AV – klikk for å slå på'}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  background: isSafeMode
                    ? 'rgba(34,197,94,0.12)'
                    : 'rgba(239,68,68,0.12)',
                  border: `1px solid ${isSafeMode ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}`,
                  color: isSafeMode ? '#4ADE80' : '#F87171',
                  fontSize: '11px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {isSafeMode ? <Shield size={12} /> : <ShieldOff size={12} />}
                <span style={{ fontSize: '11px' }}>
                  {isSafeMode ? 'Safe' : 'Power'}
                </span>
              </button>
            )}
          </div>

          <div className="chat-toolbar-right">
            <ModelSelector model={model} onModelChange={onModelChange} />
            <button className="mic-btn" title={t.chat.voiceInput}>
              <Mic size={18} />
            </button>

            {isStreaming ? (
              <button
                onClick={onStop}
                className="send-btn"
                title={t.chat.stop}
              >
                <Square size={12} fill="#1C1C1C" style={{ color: '#1C1C1C' }} />
              </button>
            ) : (
              <button
                onClick={handleSend}
                disabled={!canSend}
                className="send-btn"
                title={t.chat.send}
              >
                <ArrowUp size={16} strokeWidth={2.5} />
              </button>
            )}
          </div>
        </div>
      </div>

      <p className="chat-disclaimer">
        Sine kan gjøre feil. Sjekk viktig informasjon.
      </p>
    </div>
  )
}

function ModelSelector({ model, onModelChange }: { model: SineModel; onModelChange: (m: SineModel) => void }) {
  const [open, setOpen] = useState(false)

  const labels: Record<SineModel, { name: string; desc: string; icon: React.ReactNode }> = {
    'sine-1':   { name: 'Sine 1.0',  desc: 'Rask og effektiv',    icon: <Cpu size={12} /> },
    'sine-pro': { name: 'Sine Pro',  desc: 'Kraftfull og presis',  icon: <Globe size={12} /> },
  }

  return (
    <div style={{ position: 'relative' }}>
      <button
        className="model-select-btn"
        onClick={() => setOpen(!open)}
      >
        <span>{labels[model].name}</span>
        <ChevronDown size={10} />
      </button>

      {open && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 40 }}
            onClick={() => setOpen(false)}
          />
          <div style={{
            position: 'absolute',
            bottom: '100%',
            marginBottom: 8,
            right: 0,
            borderRadius: 10,
            overflow: 'hidden',
            zIndex: 50,
            minWidth: 200,
            background: '#1A1A1A',
            border: '1px solid #2E2E2E',
            boxShadow: '0 8px 32px rgba(0,0,0,0.7)',
            padding: '4px 0',
          }}>
            {(['sine-1', 'sine-pro'] as SineModel[]).map(m => (
              <button
                key={m}
                onClick={() => { onModelChange(m); setOpen(false) }}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '9px 14px',
                  background: model === m ? '#242424' : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  fontFamily: 'inherit',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => { if (model !== m) e.currentTarget.style.background = '#1E1E1E' }}
                onMouseLeave={e => { if (model !== m) e.currentTarget.style.background = 'transparent' }}
              >
                <span style={{ color: model === m ? '#1A93FE' : '#5A5A5A' }}>
                  {labels[m].icon}
                </span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: model === m ? '#E5E5E5' : '#C0C0C0' }}>
                    {labels[m].name}
                  </div>
                  <div style={{ fontSize: 11, color: '#5A5A5A', marginTop: 1 }}>{labels[m].desc}</div>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
