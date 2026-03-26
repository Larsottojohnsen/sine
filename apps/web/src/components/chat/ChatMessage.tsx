import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { Copy, Check, RefreshCw, ThumbsUp, ThumbsDown } from 'lucide-react'
import type { Message } from '@/types'
import { cn } from '@/lib/utils'

interface ChatMessageProps {
  message: Message
  onRegenerate?: () => void
  isLast?: boolean
}

export function ChatMessage({ message, onRegenerate, isLast }: ChatMessageProps) {
  const [copied, setCopied] = useState(false)
  const [liked, setLiked] = useState<boolean | null>(null)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const isUser = message.role === 'user'

  if (isUser) {
    return (
      <div className="flex justify-end animate-fade-in px-4 py-2">
        <div
          className="max-w-[75%] px-4 py-2.5 rounded-2xl rounded-tr-sm text-[14px] leading-relaxed"
          style={{ background: '#2A2A2A', color: '#E5E5E5' }}
        >
          {message.content}
        </div>
      </div>
    )
  }

  return (
    <div className="group animate-fade-in px-4 py-3">
      {/* Sine header */}
      <div className="flex items-center gap-2 mb-2.5">
        <div
          className="w-[22px] h-[22px] rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden"
          style={{ background: '#1A1A1A', border: '1px solid #2A2A2A' }}
        >
          <img
            src="/sine/sine-logo.webp"
            alt="Sine"
            style={{ width: 13, height: 13, objectFit: 'contain', opacity: 0.85 }}
          />
        </div>
        <span className="text-[13px] font-semibold" style={{ color: '#9A9A9A' }}>sine</span>
        <span
          className="text-[10px] px-1.5 py-0.5 rounded font-medium"
          style={{ background: '#222222', color: '#5A5A5A', border: '1px solid #2A2A2A' }}
        >
          1.0
        </span>
      </div>

      {/* Message content */}
      <div className="pl-8">
        <div
          className={cn(
            'prose text-[14px]',
            message.isStreaming && !message.content && 'streaming-cursor'
          )}
        >
          {message.isStreaming && !message.content ? (
            <span className="streaming-cursor" />
          ) : (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({ className, children }) {
                  const match = /language-(\w+)/.exec(className || '')
                  if (!match) {
                    return <code className={className}>{children}</code>
                  }
                  return (
                    <CodeBlock
                      language={match[1]}
                      code={String(children).replace(/\n$/, '')}
                    />
                  )
                },
              }}
            >
              {message.content}
            </ReactMarkdown>
          )}
        </div>

        {/* Action buttons */}
        {!message.isStreaming && message.content && (
          <div className="flex items-center gap-0.5 mt-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <ActionButton
              onClick={handleCopy}
              icon={copied ? <Check size={13} /> : <Copy size={13} />}
              label={copied ? 'Kopiert!' : 'Kopier'}
              active={copied}
            />
            <ActionButton
              onClick={() => setLiked(true)}
              icon={<ThumbsUp size={13} />}
              label="Bra svar"
              active={liked === true}
            />
            <ActionButton
              onClick={() => setLiked(false)}
              icon={<ThumbsDown size={13} />}
              label="Dårlig svar"
              active={liked === false}
            />
            {isLast && onRegenerate && (
              <ActionButton
                onClick={onRegenerate}
                icon={<RefreshCw size={13} />}
                label="Generer på nytt"
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function ActionButton({
  onClick, icon, label, active,
}: {
  onClick: () => void
  icon: React.ReactNode
  label: string
  active?: boolean
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={cn(
        'flex items-center gap-1 p-1.5 rounded-md text-[12px] transition-colors',
        active
          ? 'text-[#1A93FE]'
          : 'text-[#3A3A3A] hover:text-[#8A8A8A] hover:bg-[#242424]'
      )}
    >
      {icon}
    </button>
  )
}

function CodeBlock({ language, code }: { language: string; code: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="rounded-xl overflow-hidden my-3" style={{ border: '1px solid #2A2A2A' }}>
      <div className="code-block-header">
        <span className="code-block-lang">{language}</span>
        <button onClick={handleCopy} className="code-block-copy">
          {copied ? <Check size={12} /> : <Copy size={12} />}
          <span>{copied ? 'Kopiert' : 'Kopier kode'}</span>
        </button>
      </div>
      <SyntaxHighlighter
        style={vscDarkPlus}
        language={language}
        PreTag="div"
        customStyle={{
          margin: 0,
          borderRadius: 0,
          background: '#0D0D0D',
          fontSize: '0.8125rem',
          lineHeight: '1.65',
          padding: '14px 16px',
        }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  )
}
