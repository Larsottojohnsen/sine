import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { Copy, Check, RefreshCw, ThumbsUp, ThumbsDown } from 'lucide-react'
import type { Message } from '@/types'

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
      <div className="message-user animate-fade-in">
        <div className="message-user-bubble">
          {message.content}
        </div>
      </div>
    )
  }

  return (
    <div className="message-assistant animate-fade-in">
      {/* Avatar – full logo (ikon + tekst) */}
      <div className="message-avatar-clean">
        <img
          src="/sine/sine-logo.webp"
          alt="Sine"
          style={{ height: 22, width: 'auto', maxWidth: 80, objectFit: 'contain', opacity: 1 }}
        />
      </div>

      {/* Content */}
      <div className="message-body">
        <div className="message-header">
          <span className="message-badge-clean">1.0</span>
        </div>

        <div className={`prose${message.isStreaming && !message.content ? ' streaming-cursor' : ''}`}>
          {message.isStreaming && !message.content ? (
            <div className="thinking-indicator">
              <div className="thinking-dot" />
              <span className="thinking-text">Thinking</span>
            </div>
          ) : (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                // Klikkbare lenker som åpner i ny fane
                a({ href, children }) {
                  return (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#60A5FA', textDecoration: 'underline', cursor: 'pointer' }}
                    >
                      {children}
                    </a>
                  )
                },
                // Overskrifter
                h1({ children }) {
                  return <h1 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0.75rem 0 0.4rem', color: '#F3F4F6' }}>{children}</h1>
                },
                h2({ children }) {
                  return <h2 style={{ fontSize: '1.05rem', fontWeight: 600, margin: '0.65rem 0 0.35rem', color: '#F3F4F6' }}>{children}</h2>
                },
                h3({ children }) {
                  return <h3 style={{ fontSize: '0.95rem', fontWeight: 600, margin: '0.55rem 0 0.3rem', color: '#E5E7EB' }}>{children}</h3>
                },
                // Paragraf
                p({ children }) {
                  return <p style={{ margin: '0 0 0.55rem 0', lineHeight: 1.65 }}>{children}</p>
                },
                // Sterk tekst
                strong({ children }) {
                  return <strong style={{ fontWeight: 600, color: '#F3F4F6' }}>{children}</strong>
                },
                // Kode
                code({ className, children }) {
                  const match = /language-(\w+)/.exec(className || '')
                  if (!match) {
                    return (
                      <code style={{
                        background: '#1E1E1E',
                        border: '1px solid #2E2E2E',
                        borderRadius: 4,
                        padding: '1px 5px',
                        fontSize: '0.8em',
                        fontFamily: 'monospace',
                        color: '#E2E8F0',
                      }}>
                        {children}
                      </code>
                    )
                  }
                  return (
                    <CodeBlock
                      language={match[1]}
                      code={String(children).replace(/\n$/, '')}
                    />
                  )
                },
                // Lister
                ul({ children }) {
                  return <ul style={{ paddingLeft: '1.2rem', margin: '0.3rem 0 0.55rem 0' }}>{children}</ul>
                },
                ol({ children }) {
                  return <ol style={{ paddingLeft: '1.2rem', margin: '0.3rem 0 0.55rem 0' }}>{children}</ol>
                },
                li({ children }) {
                  return <li style={{ marginBottom: '0.2rem', lineHeight: 1.6 }}>{children}</li>
                },
              }}
            >
              {message.content}
            </ReactMarkdown>
          )}
        </div>

        {/* Action buttons */}
        {!message.isStreaming && message.content && (
          <div className="message-actions">
            <button
              className="message-action-btn"
              onClick={handleCopy}
              title={copied ? 'Kopiert!' : 'Kopier'}
              style={{ color: copied ? '#1A93FE' : undefined }}
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
            </button>
            <button
              className="message-action-btn"
              onClick={() => setLiked(true)}
              title="Bra svar"
              style={{ color: liked === true ? '#1A93FE' : undefined }}
            >
              <ThumbsUp size={13} />
            </button>
            <button
              className="message-action-btn"
              onClick={() => setLiked(false)}
              title="Dårlig svar"
              style={{ color: liked === false ? '#ef4444' : undefined }}
            >
              <ThumbsDown size={13} />
            </button>
            {isLast && onRegenerate && (
              <button
                className="message-action-btn"
                onClick={onRegenerate}
                title="Generer på nytt"
              >
                <RefreshCw size={13} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
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
    <div className="code-block-wrapper">
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
