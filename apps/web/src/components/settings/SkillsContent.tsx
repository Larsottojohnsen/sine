import { useState, useRef } from 'react'
import {
  Zap, Plus, ChevronDown, X, Search, Upload, GitBranch,
  MessageSquare, Check, MoreHorizontal, Sparkles, Shield,
  ToggleLeft, ToggleRight, ArrowLeft, Loader2
} from 'lucide-react'
import type { Skill } from '@/types'
import { useApp } from '@/store/AppContext'
import { v4 as uuidv4 } from 'uuid'

// ─── 5 offisielle Sine-skills ─────────────────────────────────
const OFFICIAL_SKILLS: Omit<Skill, 'id' | 'enabled' | 'createdAt'>[] = [
  {
    name: 'norsk-skriveassistent',
    description: 'Hjelper med å skrive profesjonelle norske tekster, e-poster, rapporter og dokumenter med korrekt norsk grammatikk, stil og tone. Bruk når du trenger hjelp med norsk skriving.',
    source: 'official',
    icon: '✍️',
    systemPrompt: 'Du er en ekspert norsk skriveassistent. Hjelp brukeren med å skrive klare, profesjonelle og korrekte norske tekster. Gi konkrete forslag til forbedringer av grammatikk, stil og struktur. Bruk alltid korrekt bokmål med mindre brukeren spesifiserer nynorsk.',
  },
  {
    name: 'excel-generator',
    description: 'Lager Excel-filer (.xlsx) med formler, diagrammer og dataanalyse fra beskrivelser eller CSV-data. Bruk når brukeren ber om regneark, tabeller eller dataanalyse.',
    source: 'official',
    icon: '📊',
    systemPrompt: 'Du er en ekspert på Excel og regneark. Når brukeren ber om data i tabellform, lag alltid strukturerte Excel-filer med riktige formler, formatering og eventuelt diagrammer. Forklar hva du har laget og hvordan formlene fungerer.',
  },
  {
    name: 'web-researcher',
    description: 'Søker på nettet, sammenstiller informasjon fra flere kilder og lager strukturerte rapporter med kildehenvisninger. Bruk for research-oppgaver og informasjonsinnhenting.',
    source: 'official',
    icon: '🔍',
    systemPrompt: 'Du er en grundig web-researcher. Søk alltid etter informasjon fra flere troverdige kilder. Sammenstill funnene i en strukturert rapport med tydelige kildehenvisninger. Vær kritisk til kildene og påpek usikkerhet der det finnes.',
  },
  {
    name: 'kode-reviewer',
    description: 'Gjennomgår kode, finner bugs, foreslår forbedringer og forklarer koden på norsk. Bruk når brukeren deler kode som skal analyseres, forbedres eller forklares.',
    source: 'official',
    icon: '🔧',
    systemPrompt: 'Du er en erfaren kode-reviewer. Analyser koden grundig: finn potensielle bugs, sikkerhetssvakheter og ytelsesproblemer. Foreslå konkrete forbedringer med kodeeksempler. Forklar alltid hvorfor en endring er bedre. Bruk norsk i forklaringene.',
  },
  {
    name: 'presentasjon-builder',
    description: 'Lager profesjonelle presentasjoner og slides fra et tema, et dokument eller en beskrivelse. Bruk når brukeren ber om PowerPoint, slides eller en presentasjon.',
    source: 'official',
    icon: '🎯',
    systemPrompt: 'Du er en ekspert på å lage presentasjoner. Strukturer innholdet logisk med en klar innledning, hoveddel og avslutning. Lag konsise bullet points, foreslå visuelle elementer og sørg for at presentasjonen forteller en klar historie. Tilpass stilen til målgruppen.',
  },
]

// ─── Skill-kort ───────────────────────────────────────────────
function SkillCard({
  skill,
  onToggle,
  onDelete,
}: {
  skill: Skill
  onToggle: (id: string) => void
  onDelete: (id: string) => void
}) {
  const [showMenu, setShowMenu] = useState(false)

  return (
    <div className="skill-card">
      <div className="skill-card-left">
        <div className="skill-card-icon">
          {skill.icon ? (
            <span style={{ fontSize: 18 }}>{skill.icon}</span>
          ) : (
            <Zap size={16} style={{ color: '#5A5A5A' }} />
          )}
        </div>
        <div className="skill-card-info">
          <div className="skill-card-name">
            {skill.name}
            {skill.source === 'official' && (
              <span className="skill-badge-official">
                <Sparkles size={9} />
                Offisiell
              </span>
            )}
          </div>
          <div className="skill-card-desc">{skill.description}</div>
        </div>
      </div>
      <div className="skill-card-right">
        <button
          className={`skill-toggle${skill.enabled ? ' active' : ''}`}
          onClick={() => onToggle(skill.id)}
          title={skill.enabled ? 'Deaktiver' : 'Aktiver'}
        >
          {skill.enabled
            ? <ToggleRight size={22} style={{ color: '#1A93FE' }} />
            : <ToggleLeft size={22} style={{ color: '#3A3A3A' }} />
          }
        </button>
        <div style={{ position: 'relative' }}>
          <button
            className="skill-menu-btn"
            onClick={() => setShowMenu(v => !v)}
          >
            <MoreHorizontal size={14} />
          </button>
          {showMenu && (
            <div className="skill-dropdown-menu">
              <button
                className="skill-dropdown-item"
                onClick={() => { onDelete(skill.id); setShowMenu(false) }}
                style={{ color: '#ef4444' }}
              >
                <X size={13} />
                Fjern skill
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Import fra GitHub modal ──────────────────────────────────
function ImportGithubModal({ onClose, onImport }: {
  onClose: () => void
  onImport: (url: string) => void
}) {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleImport = async () => {
    if (!url.trim()) return
    setLoading(true)
    setError('')
    // Simuler import (i produksjon: kall backend)
    await new Promise(r => setTimeout(r, 1200))
    if (!url.includes('github.com')) {
      setError('Ugyldig GitHub-URL. Bruk format: https://github.com/bruker/repo')
      setLoading(false)
      return
    }
    onImport(url.trim())
    setLoading(false)
  }

  return (
    <div className="skill-modal-overlay" onClick={onClose}>
      <div className="skill-modal" onClick={e => e.stopPropagation()}>
        <button className="skill-modal-close" onClick={onClose}><X size={15} /></button>

        <div className="skill-modal-icons">
          <div className="skill-modal-icon-box" style={{ background: '#1a1a1a' }}>
            <GitBranch size={20} style={{ color: '#E5E5E5' }} />
          </div>
          <div className="skill-modal-icon-arrow">⇄</div>
          <div className="skill-modal-icon-box" style={{ background: '#1a1a1a' }}>
            <span style={{ fontSize: 18 }}>⚡</span>
          </div>
        </div>

        <h3 className="skill-modal-title">Importer fra GitHub</h3>
        <p className="skill-modal-sub">Importer en skill direkte fra et offentlig GitHub-repositorium.</p>

        <div className="skill-modal-field">
          <label className="skill-modal-label">URL</label>
          <input
            className="skill-modal-input"
            placeholder="https://github.com/bruker/repo"
            value={url}
            onChange={e => setUrl(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleImport()}
            autoFocus
          />
          {error && <p style={{ fontSize: 12, color: '#ef4444', marginTop: 6 }}>{error}</p>}
        </div>

        <button
          className="skill-modal-btn"
          onClick={handleImport}
          disabled={!url.trim() || loading}
        >
          {loading ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : null}
          {loading ? 'Importerer...' : 'Importer'}
        </button>
      </div>
    </div>
  )
}

// ─── Last opp skill modal ─────────────────────────────────────
function UploadSkillModal({ onClose, onUpload }: {
  onClose: () => void
  onUpload: (name: string) => void
}) {
  const [dragging, setDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) setFile(f)
  }

  const handleUpload = () => {
    if (!file) return
    onUpload(file.name.replace(/\.(zip|skill)$/, ''))
  }

  return (
    <div className="skill-modal-overlay" onClick={onClose}>
      <div className="skill-modal" onClick={e => e.stopPropagation()}>
        <button className="skill-modal-close" onClick={onClose}><X size={15} /></button>
        <h3 className="skill-modal-title">Last opp skill</h3>

        <div
          className={`skill-upload-zone${dragging ? ' dragging' : ''}`}
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".zip,.skill"
            style={{ display: 'none' }}
            onChange={e => e.target.files?.[0] && setFile(e.target.files[0])}
          />
          <div className="skill-upload-icon">
            <Upload size={24} style={{ color: '#5A5A5A' }} />
          </div>
          {file ? (
            <p style={{ fontSize: 13, color: '#E5E5E5', marginTop: 8 }}>{file.name}</p>
          ) : (
            <p style={{ fontSize: 13, color: '#5A5A5A', marginTop: 8 }}>Dra og slipp eller klikk for å laste opp</p>
          )}
        </div>

        <div className="skill-upload-requirements">
          <p style={{ fontSize: 12, fontWeight: 600, color: '#9A9A9A', marginBottom: 8 }}>Filkrav</p>
          <ul style={{ fontSize: 12, color: '#5A5A5A', paddingLeft: 16, lineHeight: 1.8, margin: 0 }}>
            <li>.zip eller .skill fil som inneholder en SKILL.md fil på rotnivå</li>
            <li>SKILL.md inneholder navn og beskrivelse formatert i YAML</li>
          </ul>
        </div>

        <button
          className="skill-modal-btn"
          onClick={handleUpload}
          disabled={!file}
        >
          Last opp
        </button>
      </div>
    </div>
  )
}

// ─── Offisiell bibliotek panel ────────────────────────────────
function OfficialLibraryPanel({
  onClose,
  installedSkillNames,
  onAdd,
}: {
  onClose: () => void
  installedSkillNames: string[]
  onAdd: (skill: Omit<Skill, 'id' | 'enabled' | 'createdAt'>) => void
}) {
  const [search, setSearch] = useState('')

  const filtered = OFFICIAL_SKILLS.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.description.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="skill-library-panel">
      <div className="skill-library-header">
        <button className="skill-library-back" onClick={onClose}>
          <ArrowLeft size={14} />
        </button>
        <h3 className="skill-library-title">Offisielt bibliotek</h3>
        <button className="skill-modal-close" onClick={onClose}><X size={15} /></button>
      </div>

      <div className="skill-library-search">
        <Search size={13} style={{ color: '#5A5A5A', flexShrink: 0 }} />
        <input
          className="skill-library-search-input"
          placeholder="Søk etter skill"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="skill-library-list">
        {filtered.map(skill => {
          const isAdded = installedSkillNames.includes(skill.name)
          return (
            <div key={skill.name} className="skill-library-item">
              <div className="skill-library-item-info">
                <div className="skill-library-item-name">
                  {skill.name}
                  {skill.source === 'official' && (
                    <Sparkles size={10} style={{ color: '#1A93FE', marginLeft: 4 }} />
                  )}
                </div>
                <div className="skill-library-item-desc">{skill.description}</div>
              </div>
              <div>
                {isAdded ? (
                  <span className="skill-library-added">
                    <Check size={11} />
                    Lagt til
                  </span>
                ) : (
                  <button
                    className="skill-library-add-btn"
                    onClick={() => onAdd(skill)}
                  >
                    + Legg til
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

// ─── Bygg med Sine modal ──────────────────────────────────────
function BuildWithSineModal({ onClose, onNavigateToChat }: {
  onClose: () => void
  onNavigateToChat: (prompt: string) => void
}) {
  return (
    <div className="skill-modal-overlay" onClick={onClose}>
      <div className="skill-modal" onClick={e => e.stopPropagation()}>
        <button className="skill-modal-close" onClick={onClose}><X size={15} /></button>
        <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg, #1A93FE22, #8B5CF622)',
            border: '1px solid #2A2A2A', display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <MessageSquare size={24} style={{ color: '#1A93FE' }} />
          </div>
          <h3 className="skill-modal-title">Bygg med Sine</h3>
          <p className="skill-modal-sub">
            Sine hjelper deg med å lage en egendefinert skill gjennom en samtale.
            Du blir tatt til chat-vinduet der du kan beskrive hva skillen skal gjøre.
          </p>
        </div>
        <button
          className="skill-modal-btn"
          onClick={() => {
            onNavigateToChat('Hjelp meg å lage en skill sammen ved hjelp av /skill-creator. Still meg først spørsmål om hva skillen skal gjøre.')
            onClose()
          }}
        >
          Start samtale med Sine
        </button>
      </div>
    </div>
  )
}

// ─── Hoved Skills-innhold ─────────────────────────────────────
export function SkillsContent({ onNavigateToChat }: { onNavigateToChat?: (prompt: string) => void }) {
  const { settings, updateSettings } = useApp()
  const skills: Skill[] = settings.skills ?? []

  const [showAddMenu, setShowAddMenu] = useState(false)
  const [showGithubModal, setShowGithubModal] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showLibrary, setShowLibrary] = useState(false)
  const [showBuildModal, setShowBuildModal] = useState(false)
  const addMenuRef = useRef<HTMLDivElement>(null)

  const saveSkills = (updated: Skill[]) => {
    updateSettings({ skills: updated })
  }

  const handleToggle = (id: string) => {
    saveSkills(skills.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s))
  }

  const handleDelete = (id: string) => {
    saveSkills(skills.filter(s => s.id !== id))
  }

  const handleAddSkill = (skillData: Omit<Skill, 'id' | 'enabled' | 'createdAt'>) => {
    const newSkill: Skill = {
      ...skillData,
      id: uuidv4(),
      enabled: true,
      createdAt: new Date(),
    }
    saveSkills([...skills, newSkill])
  }

  const handleGithubImport = (url: string) => {
    // Ekstraher repo-navn fra URL
    const parts = url.split('/')
    const repoName = parts[parts.length - 1] || 'github-skill'
    handleAddSkill({
      name: repoName,
      description: `Importert fra GitHub: ${url}`,
      source: 'github',
      githubUrl: url,
      icon: '⚙️',
    })
    setShowGithubModal(false)
  }

  const handleUpload = (name: string) => {
    handleAddSkill({
      name,
      description: 'Lastet opp skill',
      source: 'upload',
      icon: '📦',
    })
    setShowUploadModal(false)
  }

  const enabledCount = skills.filter(s => s.enabled).length

  return (
    <div style={{ position: 'relative' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 className="settings-title" style={{ marginBottom: 4 }}>Ferdigheter</h2>
          <p style={{ fontSize: 13, color: '#5A5A5A' }}>
            {enabledCount > 0
              ? `${enabledCount} aktiv${enabledCount === 1 ? '' : 'e'} skill${enabledCount === 1 ? '' : 's'} påvirker svarene dine`
              : 'Skills utvider hva Sine kan gjøre for deg og teamet ditt'}
          </p>
        </div>

        {/* + Add dropdown */}
        <div style={{ position: 'relative' }} ref={addMenuRef}>
          <button
            className="skill-add-btn"
            onClick={() => setShowAddMenu(v => !v)}
          >
            <Plus size={14} />
            Legg til
            <ChevronDown size={12} />
          </button>

          {showAddMenu && (
            <div className="skill-add-menu">
              <button
                className="skill-add-menu-item"
                onClick={() => { setShowBuildModal(true); setShowAddMenu(false) }}
              >
                <div className="skill-add-menu-icon">
                  <MessageSquare size={14} style={{ color: '#9A9A9A' }} />
                </div>
                <div>
                  <div className="skill-add-menu-label">Bygg med Sine</div>
                  <div className="skill-add-menu-sub">Bygg gode skills gjennom samtale</div>
                </div>
              </button>
              <button
                className="skill-add-menu-item"
                onClick={() => { setShowUploadModal(true); setShowAddMenu(false) }}
              >
                <div className="skill-add-menu-icon">
                  <Upload size={14} style={{ color: '#9A9A9A' }} />
                </div>
                <div>
                  <div className="skill-add-menu-label">Last opp en skill</div>
                  <div className="skill-add-menu-sub">Last opp .zip, .skill eller mappe</div>
                </div>
              </button>
              <button
                className="skill-add-menu-item"
                onClick={() => { setShowLibrary(true); setShowAddMenu(false) }}
              >
                <div className="skill-add-menu-icon">
                  <Shield size={14} style={{ color: '#9A9A9A' }} />
                </div>
                <div>
                  <div className="skill-add-menu-label">Legg til fra offisielt bibliotek</div>
                  <div className="skill-add-menu-sub">Forhåndsbygde skills vedlikeholdt av Sine</div>
                </div>
              </button>
              <button
                className="skill-add-menu-item"
                onClick={() => { setShowGithubModal(true); setShowAddMenu(false) }}
              >
                <div className="skill-add-menu-icon">
                  <GitBranch size={14} style={{ color: '#9A9A9A' }} />
                </div>
                <div>
                  <div className="skill-add-menu-label">Importer fra GitHub</div>
                  <div className="skill-add-menu-sub">Lim inn en repositoriums-lenke for å komme i gang</div>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Skills list */}
      {skills.length === 0 ? (
        <div className="skill-empty">
          <div className="skill-empty-icon">
            <Zap size={28} style={{ color: '#3A3A3A' }} />
          </div>
          <p className="skill-empty-title">Ingen skills ennå</p>
          <p className="skill-empty-sub">
            Legg til skills for å utvide hva Sine kan gjøre.
            Start med det offisielle biblioteket.
          </p>
          <button
            className="skill-empty-cta"
            onClick={() => setShowLibrary(true)}
          >
            Utforsk offisielt bibliotek
          </button>
        </div>
      ) : (
        <div className="skill-list">
          {skills.map(skill => (
            <SkillCard
              key={skill.id}
              skill={skill}
              onToggle={handleToggle}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {showGithubModal && (
        <ImportGithubModal
          onClose={() => setShowGithubModal(false)}
          onImport={handleGithubImport}
        />
      )}
      {showUploadModal && (
        <UploadSkillModal
          onClose={() => setShowUploadModal(false)}
          onUpload={handleUpload}
        />
      )}
      {showLibrary && (
        <OfficialLibraryPanel
          onClose={() => setShowLibrary(false)}
          installedSkillNames={skills.map(s => s.name)}
          onAdd={(skill) => { handleAddSkill(skill) }}
        />
      )}
      {showBuildModal && (
        <BuildWithSineModal
          onClose={() => setShowBuildModal(false)}
          onNavigateToChat={onNavigateToChat ?? (() => {})}
        />
      )}
    </div>
  )
}
