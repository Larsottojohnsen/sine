import { useState } from 'react'
import {
  X, Search, Plus, ChevronDown, Check, Plug,
  FileJson, Settings2, Loader2, Trash2
} from 'lucide-react'
import type { CustomApiConnector, CustomMcpConnector, ConnectorStatus } from '@/types'
import { useApp } from '@/store/AppContext'
import { v4 as uuidv4 } from 'uuid'

// ─── App-koblinger definisjon ─────────────────────────────────
const APP_CONNECTORS = [
  {
    id: 'github',
    name: 'GitHub',
    description: 'Koble til GitHub for å gi Sine tilgang til dine repositorier og kode.',
    icon: '🐙',
    type: 'oauth' as const,
    scopes: ['repo', 'read:user'],
  },
  {
    id: 'gmail',
    name: 'Gmail',
    description: 'Koble til Gmail for å la Sine lese og sende e-post på dine vegne.',
    icon: '📧',
    type: 'oauth' as const,
    scopes: ['gmail.readonly', 'gmail.send'],
  },
  {
    id: 'meta-ads',
    name: 'Meta Ads Manager',
    description: 'Koble til Meta Ads Manager for å analysere og administrere annonsekampanjer.',
    icon: '📘',
    type: 'oauth' as const,
    scopes: ['ads_read', 'ads_management'],
  },
  {
    id: 'instagram',
    name: 'Instagram',
    description: 'Koble til Instagram for å administrere innlegg og analysere engasjement.',
    icon: '📸',
    type: 'oauth' as const,
    scopes: ['instagram_basic', 'instagram_content_publish'],
  },
  {
    id: 'instagram-creator',
    name: 'Instagram Creator Marketplace',
    description: 'Tilgang til Instagram Creator Marketplace for samarbeid og merkevarebygging.',
    icon: '✨',
    type: 'oauth' as const,
    scopes: ['instagram_branded_content_creator'],
  },
  {
    id: 'outlook-mail',
    name: 'Outlook Mail',
    description: 'Koble til Outlook for å lese og sende e-post via Microsoft-kontoen din.',
    icon: '📨',
    type: 'oauth' as const,
    scopes: ['Mail.Read', 'Mail.Send'],
  },
  {
    id: 'google-calendar',
    name: 'Google Calendar',
    description: 'Koble til Google Calendar for å la Sine se og opprette kalenderoppføringer.',
    icon: '📅',
    type: 'oauth' as const,
    scopes: ['calendar.readonly', 'calendar.events'],
  },
  {
    id: 'outlook-calendar',
    name: 'Outlook Calendar',
    description: 'Koble til Outlook Calendar via Microsoft-kontoen din.',
    icon: '🗓️',
    type: 'oauth' as const,
    scopes: ['Calendars.Read', 'Calendars.ReadWrite'],
  },
]

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
            <p className="connector-modal-sub">Bruk egendefinert API-kobling for å integrere enhver ekstern tjeneste som støtter nøkkel- eller token-autorisasjon.</p>
          </div>
          <button className="skill-modal-close" onClick={onClose}><X size={15} /></button>
        </div>

        <div className="connector-modal-body">
          <div className="connector-field">
            <label className="connector-label">Navn</label>
            <input
              className="connector-input"
              placeholder="Min egendefinerte API"
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
            />
          </div>

          <div className="connector-field">
            <label className="connector-label">Ikon <span style={{ color: '#5A5A5A' }}>(valgfritt)</span></label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                className="connector-input"
                placeholder="Lim inn URL"
                value={iconUrl}
                onChange={e => setIconUrl(e.target.value)}
                style={{ flex: 1 }}
              />
              <button className="connector-upload-btn">Last opp</button>
            </div>
          </div>

          <div className="connector-field">
            <label className="connector-label">Notat <span style={{ color: '#5A5A5A' }}>(valgfritt)</span></label>
            <textarea
              className="connector-textarea"
              placeholder="Gi API-dokumentasjon eller instruksjoner for å fortelle Sine hvordan og når denne APIen skal brukes"
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={3}
            />
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
                    <input
                      className="connector-input"
                      placeholder="SOME_UNIQUE_KEY_NAME"
                      value={secret.name}
                      onChange={e => handleSecretChange(i, 'name', e.target.value)}
                    />
                  </div>
                  <div className="connector-secret-field">
                    <label className="connector-secret-label">Verdi</label>
                    <input
                      className="connector-input"
                      placeholder="Verdien av hemmeligheten, f.eks. sk-eksempel-1234"
                      value={secret.value}
                      onChange={e => handleSecretChange(i, 'value', e.target.value)}
                      type="password"
                    />
                  </div>
                  {secrets.length > 1 && (
                    <button
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#5A5A5A', padding: '0 4px', marginTop: 20 }}
                      onClick={() => handleRemoveSecret(i)}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              ))}
              <button className="connector-add-secret-btn" onClick={handleAddSecret}>
                <Plus size={13} />
                Legg til hemmelighet
              </button>
            </div>
          </div>
        </div>

        <div className="connector-modal-footer">
          <button className="connector-save-btn" onClick={handleSave} disabled={!name.trim()}>
            Lagre
          </button>
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
    onSave({
      id: uuidv4(),
      name: name.trim(),
      config,
      createdAt: new Date(),
    })
    onClose()
  }

  return (
    <div className="connector-modal-overlay" onClick={onClose}>
      <div className="connector-modal" onClick={e => e.stopPropagation()}>
        <div className="connector-modal-header">
          <h3 className="connector-modal-title">
            {mode === 'json' ? 'Importer via JSON' : 'Direkte konfigurasjon'}
          </h3>
          <button className="skill-modal-close" onClick={onClose}><X size={15} /></button>
        </div>

        <div className="connector-modal-body">
          <div className="connector-field">
            <label className="connector-label">Navn</label>
            <input
              className="connector-input"
              placeholder="Min MCP-server"
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
            />
          </div>
          <div className="connector-field">
            <label className="connector-label">Konfigurasjon (JSON)</label>
            <textarea
              className="connector-textarea connector-code"
              value={config}
              onChange={e => setConfig(e.target.value)}
              rows={8}
              spellCheck={false}
            />
          </div>
        </div>

        <div className="connector-modal-footer">
          <button className="connector-save-btn" onClick={handleSave} disabled={!name.trim()}>
            Lagre
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Apps Tab ─────────────────────────────────────────────────
function AppsTab() {
  const { settings, updateSettings } = useApp()
  const statuses: Record<string, ConnectorStatus> = settings.connectorStatuses ?? {}
  const [connecting, setConnecting] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const filtered = APP_CONNECTORS.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  const handleConnect = async (id: string) => {
    setConnecting(id)
    // Simuler OAuth-flyt (i produksjon: åpne OAuth-popup)
    await new Promise(r => setTimeout(r, 1500))
    const updated = { ...statuses, [id]: 'connected' as ConnectorStatus }
    updateSettings({ connectorStatuses: updated })
    setConnecting(null)
  }

  const handleDisconnect = (id: string) => {
    const updated = { ...statuses }
    delete updated[id]
    updateSettings({ connectorStatuses: updated })
  }

  return (
    <div>
      <div className="connector-search-row">
        <Search size={13} style={{ color: '#5A5A5A', flexShrink: 0 }} />
        <input
          className="connector-search-input"
          placeholder="Søk"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>
      <div className="connector-app-list">
        {filtered.map(app => {
          const status = statuses[app.id] ?? 'disconnected'
          const isConnecting = connecting === app.id
          return (
            <div key={app.id} className="connector-app-card">
              <div className="connector-app-icon">{app.icon}</div>
              <div className="connector-app-info">
                <div className="connector-app-name">{app.name}</div>
                <div className="connector-app-desc">{app.description}</div>
              </div>
              <div className="connector-app-action">
                {status === 'connected' ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="connector-status-connected">
                      <Check size={11} />
                      Tilkoblet
                    </span>
                    <button
                      className="connector-disconnect-btn"
                      onClick={() => handleDisconnect(app.id)}
                      title="Koble fra"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <button
                    className="connector-connect-btn"
                    onClick={() => handleConnect(app.id)}
                    disabled={isConnecting}
                  >
                    {isConnecting ? (
                      <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
                    ) : null}
                    {isConnecting ? 'Kobler til...' : 'Koble til'}
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Custom API Tab ───────────────────────────────────────────
function CustomApiTab() {
  const { settings, updateSettings } = useApp()
  const connectors: CustomApiConnector[] = settings.customApiConnectors ?? []
  const [showModal, setShowModal] = useState(false)
  const [search, setSearch] = useState('')

  const filtered = connectors.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  const handleSave = (connector: CustomApiConnector) => {
    updateSettings({ customApiConnectors: [...connectors, connector] })
  }

  const handleDelete = (id: string) => {
    updateSettings({ customApiConnectors: connectors.filter(c => c.id !== id) })
  }

  return (
    <div>
      <div className="connector-search-row">
        <Search size={13} style={{ color: '#5A5A5A', flexShrink: 0 }} />
        <input
          className="connector-search-input"
          placeholder="Søk"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: 1 }}
        />
        <button className="connector-add-small-btn" onClick={() => setShowModal(true)}>
          <Plus size={13} />
          Legg til
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="connector-empty">
          <Plug size={28} style={{ color: '#3A3A3A' }} />
          <p style={{ fontSize: 13, color: '#5A5A5A', marginTop: 12 }}>Ingen egendefinerte APIer ennå.</p>
          <button className="skill-empty-cta" onClick={() => setShowModal(true)}>
            Legg til egendefinert API
          </button>
        </div>
      ) : (
        <div className="connector-app-list">
          {filtered.map(c => (
            <div key={c.id} className="connector-app-card">
              <div className="connector-app-icon">{c.icon ? <img src={c.icon} style={{ width: 24, height: 24, borderRadius: 4 }} alt="" /> : '🔌'}</div>
              <div className="connector-app-info">
                <div className="connector-app-name">{c.name}</div>
                <div className="connector-app-desc">{c.secrets.length} hemmelighet{c.secrets.length !== 1 ? 'er' : ''}</div>
              </div>
              <button
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#5A5A5A', padding: 4 }}
                onClick={() => handleDelete(c.id)}
                title="Slett"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <AddCustomApiModal
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}
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
              <Plus size={14} />
              Legg til egendefinert MCP
              <ChevronDown size={13} />
            </button>
            {showAddMenu && (
              <div className="connector-mcp-menu">
                <button className="connector-mcp-menu-item" onClick={() => { setMcpModal('json'); setShowAddMenu(false) }}>
                  <FileJson size={14} style={{ color: '#9A9A9A' }} />
                  Importer via JSON
                </button>
                <button className="connector-mcp-menu-item" onClick={() => { setMcpModal('direct'); setShowAddMenu(false) }}>
                  <Settings2 size={14} style={{ color: '#9A9A9A' }} />
                  Direkte konfigurasjon
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
                <Plus size={13} />
                Legg til
                <ChevronDown size={12} />
              </button>
              {showAddMenu && (
                <div className="connector-mcp-menu" style={{ right: 0, left: 'auto' }}>
                  <button className="connector-mcp-menu-item" onClick={() => { setMcpModal('json'); setShowAddMenu(false) }}>
                    <FileJson size={14} style={{ color: '#9A9A9A' }} />
                    Importer via JSON
                  </button>
                  <button className="connector-mcp-menu-item" onClick={() => { setMcpModal('direct'); setShowAddMenu(false) }}>
                    <Settings2 size={14} style={{ color: '#9A9A9A' }} />
                    Direkte konfigurasjon
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="connector-app-list">
            {connectors.map(c => (
              <div key={c.id} className="connector-app-card">
                <div className="connector-app-icon">⚡</div>
                <div className="connector-app-info">
                  <div className="connector-app-name">{c.name}</div>
                  <div className="connector-app-desc">MCP-server</div>
                </div>
                <button
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#5A5A5A', padding: 4 }}
                  onClick={() => handleDelete(c.id)}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {mcpModal && (
        <AddCustomMcpModal
          onClose={() => setMcpModal(null)}
          onSave={handleSave}
          mode={mcpModal}
        />
      )}
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
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 className="settings-title" style={{ marginBottom: 0 }}>Tilkoblinger</h2>
        {activeTab === 'apps' && (
          <div className="connector-search-row" style={{ margin: 0, width: 200 }}>
            <Search size={13} style={{ color: '#5A5A5A', flexShrink: 0 }} />
            <input
              className="connector-search-input"
              placeholder="Søk"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="connector-tabs">
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

      <div style={{ marginTop: 20 }}>
        {activeTab === 'apps' && <AppsTab />}
        {activeTab === 'custom-api' && <CustomApiTab />}
        {activeTab === 'custom-mcp' && <CustomMcpTab />}
      </div>
    </div>
  )
}
