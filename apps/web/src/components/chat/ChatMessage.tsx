import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { Copy, Check, RefreshCw, User } from 'lucide-react'
import type { Message } from '@/types'
import { cn } from '@/lib/utils'

interface ChatMessageProps {
  message: Message
  onRegenerate?: () => void
  isLast?: boolean
}

export function ChatMessage({ message, onRegenerate, isLast }: ChatMessageProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const isUser = message.role === 'user'
  const isAssistant = message.role === 'assistant'

  return (
    <div className={cn('animate-fade-in group', isUser ? 'flex justify-end' : 'flex justify-start')}>
      <div className={cn('flex gap-3 max-w-[85%]', isUser ? 'flex-row-reverse' : 'flex-row')}>
        {/* Avatar */}
        {isAssistant && (
          <div className="flex-shrink-0 mt-0.5">
            <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: '#1A93FE' }}>
              <img src="/sine/sine-logo.webp" alt="Sine" className="w-4 h-4 object-contain" />
            </div>
          </div>
        )}
        {isUser && (
          <div className="flex-shrink-0 mt-0.5">
            <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: '#343434' }}>
              <User size={14} className="text-[#DADADA]" />
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex flex-col gap-1 min-w-0">
          {isUser ? (
            <div
              className="px-4 py-2.5 rounded-2xl rounded-tr-sm text-sm leading-relaxed"
              style={{ background: '#363538', color: '#DADADA' }}
            >
              {message.content}
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {isAssistant && (
                <span className="text-xs font-medium text-[#7F7F7F] flex items-center gap-1.5">
                  <span>sine</span>
                </span>
              )}
              <div
                className={cn(
                  'prose text-sm',
                  message.isStreaming && 'streaming-cursor'
                )}
              >
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code({ node, className, children, ...props }) {
                      const match = /language-(\w+)/.exec(className || '')
                      const isInline = !match
                      if (isInline) {
                        return (
                          <code className={className} {...props}>
                            {children}
                          </code>
                        )
                      }
                      return (
                        <CodeBlock language={match[1]} code={String(children).replace(/\n$/, '')} />
                      )
                    },
                  }}
                >
                  {message.content || (message.isStreaming ? '' : '')}
                </ReactMarkdown>
              </div>

              {/* Action buttons */}
              {!message.isStreaming && (
                <div className="flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ActionButton
                    onClick={handleCopy}
                    icon={copied ? <Check size={13} /> : <Copy size={13} />}
                    label={copied ? 'Kopiert!' : 'Kopier'}
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
          )}
        </div>
      </div>
    </div>
  )
}

function ActionButton({ onClick, icon, label }: { onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      title={label}
      className="flex items-center gap-1 px-2 py-1 rounded-md text-xs text-[#7F7F7F] hover:text-[#DADADA] hover:bg-[#343434] transition-colors"
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
    <div className="relative rounded-lg overflow-hidden my-2" style={{ border: '1px solid #3a3a3a' }}>
      <div className="flex items-center justify-between px-4 py-2" style={{ background: '#1F1F1F' }}>
        <span className="text-xs text-[#7F7F7F] font-mono">{language}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs text-[#7F7F7F] hover:text-[#DADADA] transition-colors"
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          <span>{copied ? 'Kopiert' : 'Kopier kode'}</span>
        </button>
      </div>
      <SyntaxHighlighter
        style={oneDark}
        language={language}
        PreTag="div"
        customStyle={{
          margin: 0,
          borderRadius: 0,
          background: '#1A1A1A',
          fontSize: '0.8125rem',
          lineHeight: '1.6',
        }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  )
}
