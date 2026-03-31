import { useState, useEffect } from 'react'
import {
  X, Search, Plus, ChevronDown,
  FileJson, Settings2, Loader2, Trash2, Plug,
  CheckCircle2, ExternalLink, Unplug,
} from 'lucide-react'
import type { CustomApiConnector, CustomMcpConnector, ConnectorStatus } from '@/types'
import { useApp } from '@/store/AppContext'
import { v4 as uuidv4 } from 'uuid'

// ─── Connector definitions with categories ────────────────────
type ConnectorDef = {
  id: string
  name: string
  description: string
  icon: string
  iconBg: string
  iconRadius?: number
  type: 'oauth' | 'api_key'
  scopes?: string[]
  beta?: boolean
  category: string
  docsUrl?: string
}

const APP_CONNECTORS: ConnectorDef[] = [
  // ── E-post ────────────────────────────────────────────────────
  {
    id: 'gmail',
    name: 'Gmail',
    description: 'La Sine lese og sende e-post på dine vegne via Gmail.',
    icon: '/connector-icons/gmail.webp',
    iconBg: '#fff',
    type: 'oauth',
    scopes: ['gmail.readonly', 'gmail.send'],
    category: 'E-post',
    docsUrl: 'https://developers.google.com/gmail/api',
  },
  {
    id: 'outlook-mail',
    name: 'Outlook Mail',
    description: 'Koble til Outlook for å lese og sende e-post via Microsoft-kontoen din.',
    icon: '/connector-icons/outlook-mail.png',
    iconBg: '#fff',
    type: 'oauth',
    scopes: ['Mail.Read', 'Mail.Send'],
    category: 'E-post',
  },
  // ── Kalender ──────────────────────────────────────────────────
  {
    id: 'google-calendar',
    name: 'Google Calendar',
    description: 'La Sine se og opprette kalenderoppføringer i Google Calendar.',
    icon: '/connector-icons/gcal.webp',
    iconBg: '#fff',
    type: 'oauth',
    scopes: ['calendar.readonly', 'calendar.events'],
    category: 'Kalender',
  },
  {
    id: 'outlook-calendar',
    name: 'Outlook Calendar',
    description: 'Koble til Outlook Calendar via Microsoft-kontoen din.',
    icon: '/connector-icons/outlook-calendar.png',
    iconBg: '#fff',
    type: 'oauth',
    scopes: ['Calendars.Read', 'Calendars.ReadWrite'],
    category: 'Kalender',
  },
  // ── Kommunikasjon ─────────────────────────────────────────────
  {
    id: 'slack',
    name: 'Slack',
    description: 'Koble til Slack for å sende meldinger og varsler til kanalene dine.',
    icon: '/connector-icons/slack.png',
    iconBg: '#fff',
    type: 'oauth',
    scopes: ['chat:write', 'channels:read'],
    category: 'Kommunikasjon',
    beta: true,
  },
  // ── Kode & Infrastruktur ──────────────────────────────────────
  {
    id: 'github',
    name: 'GitHub',
    description: 'Koble til GitHub for å gi Sine tilgang til repositorier og kode.',
    icon: '/connector-icons/github.webp',
    iconBg: '#24292e',
    iconRadius: 10,
    type: 'oauth',
    scopes: ['repo', 'read:user'],
    category: 'Kode & Infra',
    docsUrl: 'https://docs.github.com/en/developers/apps',
  },
  {
    id: 'supabase',
    name: 'Supabase',
    description: 'Koble Sine til Supabase for databasetilgang og -administrasjon.',
    icon: '/connector-icons/supabase.webp',
    iconBg: '#fff',
    type: 'api_key',
    category: 'Kode & Infra',
    beta: true,
  },
  {
    id: 'vercel',
    name: 'Vercel',
    description: 'La Sine deploye og administrere Vercel-prosjekter.',
    icon: '/connector-icons/vercel.webp',
    iconBg: '#000',
    iconRadius: 10,
    type: 'oauth',
    category: 'Kode & Infra',
    beta: true,
  },
  {
    id: 'cloudflare',
    name: 'Cloudflare',
    description: 'Koble til Cloudflare for DNS-administrasjon og sikkerhetsinnstillinger.',
    icon: '/connector-icons/cloudflare.webp',
    iconBg: '#fff',
    type: 'api_key',
    category: 'Kode & Infra',
    beta: true,
  },
  // ── Prosjektstyring ───────────────────────────────────────────
  {
    id: 'notion',
    name: 'Notion',
    description: 'Koble til Notion for å lese og oppdatere sider og databaser.',
    icon: '/connector-icons/notion.webp',
    iconBg: '#fff',
    type: 'oauth',
    scopes: ['read_content', 'update_content'],
    category: 'Prosjektstyring',
  },
  {
    id: 'monday',
    name: 'Monday.com',
    description: 'Koble til Monday.com for oppgavestyring og teamprosjekter.',
    icon: '/connector-icons/monday.webp',
    iconBg: '#fff',
    type: 'oauth',
    category: 'Prosjektstyring',
    beta: true,
  },
  {
    id: 'asana',
    name: 'Asana',
    description: 'La Sine opprette og administrere oppgaver i Asana.',
    icon: '/connector-icons/asana.webp',
    iconBg: '#fff',
    type: 'oauth',
    category: 'Prosjektstyring',
    beta: true,
  },
  {
    id: 'airtable',
    name: 'Airtable',
    description: 'Koble til Airtable for å lese og skrive til baser og tabeller.',
    icon: '/connector-icons/airtable.webp',
    iconBg: '#fff',
    type: 'oauth',
    category: 'Prosjektstyring',
    beta: true,
  },
  // ── Markedsføring ─────────────────────────────────────────────
  {
    id: 'meta-ads',
    name: 'Meta Ads Manager',
    description: 'Analyser og administrer Meta-annonsekampanjer med Sine.',
    icon: '/connector-icons/meta.svg',
    iconBg: '#fff',
    type: 'oauth',
    scopes: ['ads_read', 'ads_management'],
    category: 'Markedsføring',
    beta: true,
  },
  {
    id: 'instagram',
    name: 'Instagram',
    description: 'Administrer innlegg og analyser engasjement på Instagram.',
    icon: '/connector-icons/instagram.svg',
    iconBg: '#fff',
    type: 'oauth',
    scopes: ['instagram_basic', 'instagram_content_publish'],
    category: 'Markedsføring',
    beta: true,
  },
  {
    id: 'instagram-creator',
    name: 'Instagram Creator',
    description: 'Tilgang til Instagram Creator Marketplace for merkesamarbeid.',
    icon: '/connector-icons/instagram-creator.svg',
    iconBg: '#fff',
    type: 'oauth',
    scopes: ['instagram_branded_content_creator'],
    category: 'Markedsføring',
    beta: true,
  },
  {
    id: 'canva',
    name: 'Canva',
    description: 'La Sine generere og redigere design direkte i Canva.',
    icon: '/connector-icons/canva.webp',
    iconBg: '#fff',
    type: 'oauth',
    category: 'Markedsføring',
    beta: true,
  },
  // ── Finans ────────────────────────────────────────────────────
  {
    id: 'stripe',
    name: 'Stripe',
    description: 'Koble til Stripe for å se betalinger, kunder og abonnementer.',
    icon: '/connector-icons/stripe.webp',
    iconBg: '#fff',
    type: 'api_key',
    category: 'Finans',
    beta: true,
  },
  // ── Automatisering ────────────────────────────────────────────
  {
    id: 'zapier',
    name: 'Zapier',
    description: 'Koble Sine til tusenvis av apper via Zapier-automatisering.',
    icon: '/connector-icons/zapier.webp',
    iconBg: '#fff',
    type: 'oauth',
    category: 'Automatisering',
    beta: true,
  },
  // ── Nettleser ─────────────────────────────────────────────────
  {
    id: 'chrome',
    name: 'Chrome',
    description: 'La Sine samhandle med nettsider i Chrome-nettleseren.',
    icon: '/connector-icons/chrome.webp',
    iconBg: '#fff',
    type: 'oauth',
    category: 'Nettleser',
    beta: true,
  },
]

// ─── Connector Detail Modal ───────────────────────────────────
function ConnectorDetailModal({
  connector,
  onDisconnect,
  onClose,
}: {
  connector: ConnectorDef
  onDisconnect: () => void
  onClose: () => void
}) {
  return (
    <div className="connector-modal-overlay" onClick={onClose}>
      <div className="connector-modal connector-detail-modal" onClick={e => e.stopPropagation()}>
        <div className="connector-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              className="conn-detail-icon"
              style={{
                background: connector.iconBg,
                borderRadius: connector.iconRadius ?? 8,
              }}
            >
              <img src={connector.icon} alt={connector.name} />
            </div>
            <div>
              <h3 className="connector-modal-title">{connector.name}</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                <CheckCircle2 size={12} color="#22c55e" />
                <span style={{ fontSize: 12, color: '#22c55e' }}>Tilkoblet</span>
              </div>
            </div>
          </div>
          <button className="skill-modal-close" onClick={onClose}><X size={15} /></button>
        </div>

        <div className="connector-modal-body">
          <p style={{ fontSize: 13, color: 'var(--connector-detail-text, #9A9A9A)', lineHeight: 1.5, marginBottom: 20 }}>
            {connector.description}
          </p>

          {connector.scopes && connector.scopes.length > 0 && (
            <div className="connector-detail-section">
              <div className="connector-detail-label">Tillatelser</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                {connector.scopes.map(scope => (
                  <span key={scope} className="connector-scope-badge">{scope}</span>
                ))}
              </div>
            </div>
          )}

          {connector.docsUrl && (
            <div className="connector-detail-section">
              <a
                href={connector.docsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="connector-docs-link"
              >
                <ExternalLink size={12} /> Dokumentasjon
              </a>
            </div>
          )}
        </div>

        <div className="connector-modal-footer" style={{ justifyContent: 'space-between' }}>
          <button
            className="connector-disconnect-btn"
            onClick={() => { onDisconnect(); onClose() }}
          >
            <Unplug size={13} /> Koble fra
          </button>
          <button className="connector-save-btn" onClick={onClose}>Lukk</button>
        </div>
      </div>
    </div>
  )
}

// ─── Connector Icon ───────────────────────────────────────────
function ConnectorIcon({ src, bg, name, radius }: { src: string; bg: string; name: string; radius?: number }) {
  return (
    <div className="conn-icon-wrap" style={{ background: bg, borderRadius: radius ?? 8 }}>
      <img src={src} alt={name} className="conn-icon-img" />
    </div>
  )
}

// ─── Add Custom API Modal ─────────────────────────────────────
function AddCustomApiModal({ onClose, onSave }: {
  onClose: () => void
  onSave: (connector: CustomApiConnector) => void
}) {
  const [name, setName] = useState('')
  const [iconUrl, setIconUrl] = useState('')
  const [note, setNote] = useState('')
  const [secrets, setSecrets] = useState([{ name: '', value: '' }])

  const handleAddSecret = () => setSecrets(prev => [...prev, { name: '', value: '' }])
  const handleRemoveSecret = (i: number) => setSecrets(prev => prev.filter((_, idx) => idx !== i))
  const handleSecretChange = (i: number, field: 'name' | 'value', val: string) => {
    setSecrets(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: val } : s))
  }

  const handleSave = () => {
    if (!name.trim()) return
    onSave({
      id: uuidv4(),
      name: name.trim(),
      icon: iconUrl.trim() || undefined,
      note: note.trim() || undefined,
      secrets: secrets.filter(s => s.name.trim()),
      createdAt: new Date(),
    })
    onClose()
  }

  return (
    <div className="connector-modal-overlay" onClick={onClose}>
      <div className="connector-modal" onClick={e => e.stopPropagation()}>
        <div className="connector-modal-header">
          <div>
            <h3 className="connector-modal-title">Legg til egendefinert API</h3>
            <p className="connector-modal-sub">Integrer en ekstern tjeneste med nøkkel- eller token-autorisasjon.</p>
          </div>
          <button className="skill-modal-close" onClick={onClose}><X size={15} /></button>
        </div>
        <div className="connector-modal-body">
          <div className="connector-field">
            <label className="connector-label">Navn</label>
            <input className="connector-input" placeholder="Min egendefinerte API" value={name} onChange={e => setName(e.target.value)} autoFocus />
          </div>
          <div className="connector-field">
            <label className="connector-label">Ikon <span style={{ color: '#5A5A5A' }}>(valgfritt)</span></label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input className="connector-input" placeholder="Lim inn URL" value={iconUrl} onChange={e => setIconUrl(e.target.value)} style={{ flex: 1 }} />
              <button className="connector-upload-btn">Last opp</button>
            </div>
          </div>
          <div className="connector-field">
            <label className="connector-label">Notat <span style={{ color: '#5A5A5A' }}>(valgfritt)</span></label>
            <textarea className="connector-textarea" placeholder="Gi API-dokumentasjon eller instruksjoner for å fortelle Sine hvordan og når denne APIen skal brukes" value={note} onChange={e => setNote(e.target.value)} rows={3} />
          </div>
          <div className="connector-field">
            <label className="connector-label">
              Hemmeligheter (Env Vars)
              <span className="connector-label-hint" title="Disse lagres kryptert og sendes aldri til klienten">ⓘ</span>
            </label>
            <div className="connector-secrets-box">
              {secrets.map((secret, i) => (
                <div key={i} className="connector-secret-row">
                  <div className="connector-secret-field">
                    <label className="connector-secret-label">Hemmelighetsnavn</label>
                    <input className="connector-input" placeholder="SOME_UNIQUE_KEY_NAME" value={secret.name} onChange={e => handleSecretChange(i, 'name', e.target.value)} />
                  </div>
                  <div className="connector-secret-field">
                    <label className="connector-secret-label">Verdi</label>
                    <input className="connector-input" placeholder="Verdien av hemmeligheten" value={secret.value} onChange={e => handleSecretChange(i, 'value', e.target.value)} type="password" />
                  </div>
                  {secrets.length > 1 && (
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#5A5A5A', padding: '0 4px', marginTop: 20 }} onClick={() => handleRemoveSecret(i)}>
                      <X size={14} />
                    </button>
                  )}
                </div>
              ))}
              <button className="connector-add-secret-btn" onClick={handleAddSecret}>
                <Plus size={13} /> Legg til hemmelighet
              </button>
            </div>
          </div>
        </div>
        <div className="connector-modal-footer">
          <button className="connector-save-btn" onClick={handleSave} disabled={!name.trim()}>Lagre</button>
        </div>
      </div>
    </div>
  )
}

// ─── Add Custom MCP Modal ─────────────────────────────────────
function AddCustomMcpModal({ onClose, onSave, mode }: {
  onClose: () => void
  onSave: (connector: CustomMcpConnector) => void
  mode: 'json' | 'direct'
}) {
  const [name, setName] = useState('')
  const [config, setConfig] = useState(mode === 'json'
    ? '{\n  "mcpServers": {\n    "my-server": {\n      "command": "npx",\n      "args": ["-y", "@my/mcp-server"]\n    }\n  }\n}'
    : '{\n  "command": "npx",\n  "args": ["-y", "@my/mcp-server"],\n  "env": {}\n}'
  )

  const handleSave = () => {
    if (!name.trim()) return
    onSave({ id: uuidv4(), name: name.trim(), config, createdAt: new Date() })
    onClose()
  }

  return (
    <div className="connector-modal-overlay" onClick={onClose}>
      <div className="connector-modal" onClick={e => e.stopPropagation()}>
        <div className="connector-modal-header">
          <h3 className="connector-modal-title">{mode === 'json' ? 'Importer via JSON' : 'Direkte konfigurasjon'}</h3>
          <button className="skill-modal-close" onClick={onClose}><X size={15} /></button>
        </div>
        <div className="connector-modal-body">
          <div className="connector-field">
            <label className="connector-label">Navn</label>
            <input className="connector-input" placeholder="Min MCP-server" value={name} onChange={e => setName(e.target.value)} autoFocus />
          </div>
          <div className="connector-field">
            <label className="connector-label">Konfigurasjon (JSON)</label>
            <textarea className="connector-textarea connector-code" value={config} onChange={e => setConfig(e.target.value)} rows={8} spellCheck={false} />
          </div>
        </div>
        <div className="connector-modal-footer">
          <button className="connector-save-btn" onClick={handleSave} disabled={!name.trim()}>Lagre</button>
        </div>
      </div>
    </div>
  )
}

// ─── Apps Tab ─────────────────────────────────────────────────
function AppsTab({ search }: { search: string }) {
  const { settings, updateSettings } = useApp()
  const statuses: Record<string, ConnectorStatus> = settings.connectorStatuses ?? {}
  const [connecting, setConnecting] = useState<string | null>(null)
  const [detailConnector, setDetailConnector] = useState<ConnectorDef | null>(null)

  const API_BASE = import.meta.env.VITE_API_URL || 'https://sineapi-production-8db6.up.railway.app'

  // Sjekk Gmail OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('gmail_connected') === 'true') {
      const updated = { ...statuses, gmail: 'connected' as ConnectorStatus }
      updateSettings({ connectorStatuses: updated })
      window.history.replaceState({}, '', window.location.pathname + window.location.hash)
    }
    if (params.get('gmail_error')) {
      console.error('Gmail OAuth error:', params.get('gmail_error'))
      window.history.replaceState({}, '', window.location.pathname + window.location.hash)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleConnect = async (app: ConnectorDef) => {
    const id = app.id
    if (id === 'gmail') {
      setConnecting(id)
      try {
        const res = await fetch(`${API_BASE}/api/gmail/auth-url`)
        const data = await res.json()
        if (data.auth_url) window.location.href = data.auth_url
        else console.error('Ingen auth_url fra backend')
      } catch (e) {
        console.error('Gmail auth-url feil:', e)
      } finally {
        setConnecting(null)
      }
      return
    }
    // Andre connectors: simuler
    setConnecting(id)
    await new Promise(r => setTimeout(r, 1200))
    updateSettings({ connectorStatuses: { ...statuses, [id]: 'connected' as ConnectorStatus } })
    setConnecting(null)
  }

  const handleDisconnect = (id: string) => {
    const updated = { ...statuses }
    delete updated[id]
    updateSettings({ connectorStatuses: updated })
  }

  // Group by category
  const filtered = APP_CONNECTORS.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.description.toLowerCase().includes(search.toLowerCase())
  )

  const categories = Array.from(new Set(APP_CONNECTORS.map(c => c.category)))
  const groupedFiltered = categories
    .map(cat => ({
      cat,
      items: filtered.filter(c => c.category === cat),
    }))
    .filter(g => g.items.length > 0)

  return (
    <div className="conn-app-list">
      {groupedFiltered.map(({ cat, items }) => (
        <div key={cat} className="conn-category-group">
          <div className="conn-category-label">{cat}</div>
          {items.map(app => {
            const status = statuses[app.id] ?? 'disconnected'
            const isConnected = status === 'connected'
            const isConnecting = connecting === app.id

            return (
              <div key={app.id} className="conn-app-row">
                <ConnectorIcon src={app.icon} bg={app.iconBg} name={app.name} radius={app.iconRadius} />
                <div className="conn-app-info">
                  <div className="conn-app-name">
                    {app.name}
                    {app.beta && <span className="conn-beta-badge">Beta</span>}
                  </div>
                  <div className="conn-app-desc">{app.description}</div>
                </div>
                <div className="conn-app-action">
                  {isConnected ? (
                    <button
                      className="conn-connected-btn"
                      onClick={() => setDetailConnector(app)}
                      title="Administrer tilkobling"
                    >
                      <CheckCircle2 size={13} />
                      Tilkoblet
                    </button>
                  ) : (
                    <button
                      className="conn-connect-btn"
                      onClick={() => handleConnect(app)}
                      disabled={isConnecting}
                    >
                      {isConnecting
                        ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
                        : 'Koble til'
                      }
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ))}

      {/* Detail / disconnect modal */}
      {detailConnector && (
        <ConnectorDetailModal
          connector={detailConnector}
          onDisconnect={() => handleDisconnect(detailConnector.id)}
          onClose={() => setDetailConnector(null)}
        />
      )}
    </div>
  )
}

// ─── Custom API Tab ───────────────────────────────────────────
function CustomApiTab() {
  const { settings, updateSettings } = useApp()
  const connectors: CustomApiConnector[] = settings.customApiConnectors ?? []
  const [showModal, setShowModal] = useState(false)

  const handleSave = (connector: CustomApiConnector) => {
    updateSettings({ customApiConnectors: [...connectors, connector] })
  }

  const handleDelete = (id: string) => {
    updateSettings({ customApiConnectors: connectors.filter(c => c.id !== id) })
  }

  return (
    <div>
      {connectors.length === 0 ? (
        <div className="connector-empty">
          <Plug size={28} style={{ color: '#3A3A3A' }} />
          <p style={{ fontSize: 13, color: '#5A5A5A', marginTop: 12 }}>Ingen egendefinerte APIer ennå.</p>
          <button className="skill-empty-cta" onClick={() => setShowModal(true)}>
            Legg til egendefinert API
          </button>
        </div>
      ) : (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
            <button className="connector-add-small-btn" onClick={() => setShowModal(true)}>
              <Plus size={13} /> Legg til
            </button>
          </div>
          <div className="conn-app-list">
            {connectors.map(c => (
              <div key={c.id} className="conn-app-row">
                <div className="conn-icon-wrap" style={{ background: '#2A2A2A' }}>
                  {c.icon ? <img src={c.icon} style={{ width: 20, height: 20, borderRadius: 4 }} alt="" /> : <Plug size={16} color="#9A9A9A" />}
                </div>
                <div className="conn-app-info">
                  <div className="conn-app-name">{c.name}</div>
                  {c.note && <div className="conn-app-desc">{c.note}</div>}
                </div>
                <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#5A5A5A', padding: 4 }} onClick={() => handleDelete(c.id)}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      {showModal && <AddCustomApiModal onClose={() => setShowModal(false)} onSave={handleSave} />}
    </div>
  )
}

// ─── Custom MCP Tab ───────────────────────────────────────────
function CustomMcpTab() {
  const { settings, updateSettings } = useApp()
  const connectors: CustomMcpConnector[] = settings.customMcpConnectors ?? []
  const [showAddMenu, setShowAddMenu] = useState(false)
  const [mcpModal, setMcpModal] = useState<'json' | 'direct' | null>(null)

  const handleSave = (connector: CustomMcpConnector) => {
    updateSettings({ customMcpConnectors: [...connectors, connector] })
  }

  const handleDelete = (id: string) => {
    updateSettings({ customMcpConnectors: connectors.filter(c => c.id !== id) })
  }

  return (
    <div>
      {connectors.length === 0 ? (
        <div className="connector-empty">
          <div style={{ fontSize: 36, marginBottom: 8 }}>⚡🔌</div>
          <p style={{ fontSize: 13, color: '#5A5A5A', marginTop: 4 }}>Ingen egendefinerte MCP-er lagt til ennå.</p>
          <div style={{ position: 'relative', marginTop: 16 }}>
            <button className="connector-add-mcp-btn" onClick={() => setShowAddMenu(v => !v)}>
              <Plus size={14} /> Legg til egendefinert MCP <ChevronDown size={13} />
            </button>
            {showAddMenu && (
              <div className="connector-mcp-menu">
                <button className="connector-mcp-menu-item" onClick={() => { setMcpModal('json'); setShowAddMenu(false) }}>
                  <FileJson size={14} style={{ color: '#9A9A9A' }} /> Importer via JSON
                </button>
                <button className="connector-mcp-menu-item" onClick={() => { setMcpModal('direct'); setShowAddMenu(false) }}>
                  <Settings2 size={14} style={{ color: '#9A9A9A' }} /> Direkte konfigurasjon
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
            <div style={{ position: 'relative' }}>
              <button className="connector-add-small-btn" onClick={() => setShowAddMenu(v => !v)}>
                <Plus size={13} /> Legg til <ChevronDown size={12} />
              </button>
              {showAddMenu && (
                <div className="connector-mcp-menu" style={{ right: 0, left: 'auto' }}>
                  <button className="connector-mcp-menu-item" onClick={() => { setMcpModal('json'); setShowAddMenu(false) }}>
                    <FileJson size={14} style={{ color: '#9A9A9A' }} /> Importer via JSON
                  </button>
                  <button className="connector-mcp-menu-item" onClick={() => { setMcpModal('direct'); setShowAddMenu(false) }}>
                    <Settings2 size={14} style={{ color: '#9A9A9A' }} /> Direkte konfigurasjon
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="conn-app-list">
            {connectors.map(c => (
              <div key={c.id} className="conn-app-row">
                <div className="conn-icon-wrap" style={{ background: '#2A2A2A' }}>
                  <Settings2 size={16} color="#9A9A9A" />
                </div>
                <div className="conn-app-info">
                  <div className="conn-app-name">{c.name}</div>
                </div>
                <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#5A5A5A', padding: 4 }} onClick={() => handleDelete(c.id)}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      {mcpModal && <AddCustomMcpModal onClose={() => setMcpModal(null)} onSave={handleSave} mode={mcpModal} />}
    </div>
  )
}

// ─── Hoved Connectors-innhold ─────────────────────────────────
export function ConnectorsContent() {
  const [activeTab, setActiveTab] = useState<'apps' | 'custom-api' | 'custom-mcp'>('apps')
  const [search, setSearch] = useState('')

  const tabs = [
    { id: 'apps' as const, label: 'Apper' },
    { id: 'custom-api' as const, label: 'Egendefinert API' },
    { id: 'custom-mcp' as const, label: 'Egendefinert MCP' },
  ]

  return (
    <div className="conn-root">
      {/* Header */}
      <div className="conn-header">
        <h2 className="settings-title" style={{ marginBottom: 0 }}>Tilkoblinger</h2>
        <div className="conn-search-wrap">
          <Search size={13} style={{ color: '#5A5A5A', flexShrink: 0 }} />
          <input
            className="connector-search-input"
            placeholder="Søk etter app"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="connector-tabs" style={{ marginTop: 16 }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`connector-tab${activeTab === tab.id ? ' active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ marginTop: 8 }}>
        {activeTab === 'apps' && <AppsTab search={search} />}
        {activeTab === 'custom-api' && <CustomApiTab />}
        {activeTab === 'custom-mcp' && <CustomMcpTab />}
      </div>
    </div>
  )
}
