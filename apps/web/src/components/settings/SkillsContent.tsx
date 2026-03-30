import { useState, useRef, useEffect } from 'react'
import {
  Plus, ChevronDown, X, Search, Upload, GitBranch,
  MessageSquare, Check, MoreHorizontal, Shield,
  Loader2, SlidersHorizontal, Sparkles
} from 'lucide-react'
import type { Skill } from '@/types'
import { useApp } from '@/store/AppContext'
import { v4 as uuidv4 } from 'uuid'

// ─── Offisielle Sine-skills ───────────────────────────────────
const OFFICIAL_SKILLS: Omit<Skill, 'id' | 'enabled' | 'createdAt'>[] = [
  {
    name: 'norsk-skriveassistent',
    description: 'Hjelper med å skrive profesjonelle norske tekster, e-poster, rapporter og dokumenter med korrekt norsk grammatikk, stil og tone.',
    source: 'official',
    icon: '✍️',
    updatedAt: 'Mar 13, 2026',
    systemPrompt: 'Du er en ekspert norsk skriveassistent. Hjelp brukeren med å skrive klare, profesjonelle og korrekte norske tekster. Gi konkrete forslag til forbedringer av grammatikk, stil og struktur. Bruk alltid korrekt bokmål med mindre brukeren spesifiserer nynorsk.',
  },
  {
    name: 'excel-generator',
    description: 'Lager Excel-filer (.xlsx) med formler, diagrammer og dataanalyse fra beskrivelser eller CSV-data. Bruk når brukeren ber om regneark, tabeller eller dataanalyse.',
    source: 'official',
    icon: '📊',
    updatedAt: 'Feb 20, 2026',
    systemPrompt: 'Du er en ekspert på Excel og regneark. Når brukeren ber om data i tabellform, lag alltid strukturerte Excel-filer med riktige formler, formatering og eventuelt diagrammer. Forklar hva du har laget og hvordan formlene fungerer.',
  },
  {
    name: 'web-researcher',
    description: 'Søker på nettet, sammenstiller informasjon fra flere kilder og lager strukturerte rapporter med kildehenvisninger. Bruk for research-oppgaver.',
    source: 'official',
    icon: '🔍',
    updatedAt: 'Jan 23, 2026',
    systemPrompt: 'Du er en grundig web-researcher. Søk alltid etter informasjon fra flere troverdige kilder. Sammenstill funnene i en strukturert rapport med tydelige kildehenvisninger. Vær kritisk til kildene og påpek usikkerhet der det finnes.',
  },
  {
    name: 'kode-reviewer',
    description: 'Gjennomgår kode, finner bugs, foreslår forbedringer og forklarer koden på norsk. Bruk når brukeren deler kode som skal analyseres eller forbedres.',
    source: 'official',
    icon: '🔧',
    updatedAt: 'Jan 23, 2026',
    systemPrompt: 'Du er en erfaren kode-reviewer. Analyser koden grundig: finn potensielle bugs, sikkerhetssvakheter og ytelsesproblemer. Foreslå konkrete forbedringer med kodeeksempler. Forklar alltid hvorfor en endring er bedre. Bruk norsk i forklaringene.',
  },
  {
    name: 'presentasjon-builder',
    description: 'Lager profesjonelle presentasjoner og slides fra et tema, et dokument eller en beskrivelse. Bruk når brukeren ber om PowerPoint eller slides.',
    source: 'official',
    icon: '🎯',
    updatedAt: 'Mar 1, 2026',
    systemPrompt: 'Du er en ekspert på å lage presentasjoner. Strukturer innholdet logisk med en klar innledning, hoveddel og avslutning. Lag konsise bullet points, foreslå visuelle elementer og sørg for at presentasjonen forteller en klar historie.',
  },
  {
    name: 'gmail-assistent',
    description: 'Leser, oppsummerer og svarer på e-poster via Gmail-connector. Kan filtrere viktige meldinger, lage utkast og sende svar automatisk.',
    source: 'official',
    icon: '📧',
    updatedAt: 'Mar 30, 2026',
    systemPrompt: 'Du er en Gmail-assistent. Når brukeren ber deg om å håndtere e-post, bruk Gmail-connectoren til å lese innboksen, oppsummere viktige meldinger og lage profesjonelle svar. Prioriter alltid viktige meldinger og flagg hva som krever umiddelbar handling. Skriv alltid e-poster på norsk med mindre brukeren spesifiserer noe annet.',
  },
  {
    name: 'data-analytiker',
    description: 'Analyserer datasett, lager visualiseringer og trekker ut innsikt. Støtter CSV, Excel og JSON. Lager Python-kode for analyse og grafer.',
    source: 'official',
    icon: '📈',
    updatedAt: 'Mar 30, 2026',
    systemPrompt: 'Du er en ekspert data-analytiker. Når du mottar data, analyser dem grundig: finn mønstre, anomalier og viktige trender. Lag Python-kode med pandas og matplotlib for visualiseringer. Presenter funnene i et klart, forretningsorientert format med konkrete anbefalinger basert på dataene.',
  },
  {
    name: 'rapport-forfatter',
    description: 'Skriver profesjonelle norske rapporter, analyser og dokumenter basert på inndata. Følger norsk forretningsstil og inkluderer sammendrag, innledning og konklusjon.',
    source: 'official',
    icon: '📋',
    updatedAt: 'Mar 30, 2026',
    systemPrompt: 'Du er en profesjonell norsk rapport-forfatter. Skriv alltid strukturerte rapporter med: 1) Sammendrag, 2) Innledning, 3) Hoveddel med underkapitler, 4) Konklusjon og anbefalinger. Bruk formelt norsk bokmål, korrekt formatering og tydelige overskrifter. Inkluder alltid kildehenvisninger der relevant.',
  },
  {
    name: 'meta-ads-manager',
    description: 'Hjelper med å lage, optimalisere og analysere Meta Ads-kampanjer. Gir konkrete anbefalinger basert på ytelsesdata og norsk markedsforståelse.',
    source: 'official',
    icon: '📱',
    updatedAt: 'Mar 30, 2026',
    systemPrompt: 'Du er en ekspert på Meta Ads (Facebook/Instagram). Hjelp brukeren med å lage effektive annonser, velge riktig målgruppe og optimalisere budsjett. Gi konkrete anbefalinger basert på norsk markedsforståelse. Analyser ytelsesdata og foreslå A/B-tester. Bruk alltid norsk i kommunikasjonen.',
  },
  {
    name: 'prosjekt-koordinator',
    description: 'Hjelper med prosjektplanlegging, oppgavelister, milepæler og statusrapporter. Bruker GSD-metodikk for å holde prosjekter på sporet.',
    source: 'official',
    icon: '🗂️',
    updatedAt: 'Mar 30, 2026',
    systemPrompt: 'Du er en erfaren prosjektkoordinator. Bruk GSD-metodikk (Getting Stuff Done): 1) FORSTÅ oppgaven, 2) PLANLEGG med konkrete steg og milepæler, 3) UTFØR systematisk, 4) LEVER med oppsummering. Lag alltid klare oppgavelister, estimer tidsbruk og identifiser risikofaktorer. Hold kommunikasjonen kort og handlingsorientert.',
  },
]

// ─── iOS-style Toggle ─────────────────────────────────────────
function Toggle({ enabled, onChange }: { enabled: boolean; onChange: () => void }) {
  return (
    <button
      className={`skill-ios-toggle${enabled ? ' on' : ''}`}
      onClick={e => { e.stopPropagation(); onChange() }}
      aria-label={enabled ? 'Deaktiver' : 'Aktiver'}
    >
      <span className="skill-ios-thumb" />
    </button>
  )
}

// ─── Skill-kort (2-kolonne grid) ──────────────────────────────
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
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!showMenu) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showMenu])

  return (
    <div className="skill-card-v2">
      {/* Top row: name + toggle */}
      <div className="skill-card-v2-top">
        <span className="skill-card-v2-name">
          {skill.icon && <span style={{ marginRight: 4 }}>{skill.icon}</span>}
          {skill.name}
          {skill.source === 'official' && (
            <Sparkles size={12} className="skill-sparkle" />
          )}
        </span>
        <Toggle enabled={skill.enabled} onChange={() => onToggle(skill.id)} />
      </div>

      {/* Description */}
      <p className="skill-card-v2-desc">{skill.description}</p>

      {/* Bottom row: official badge + date + menu */}
      <div className="skill-card-v2-footer">
        <div className="skill-card-v2-meta">
          <Shield size={11} style={{ color: '#5A5A5A', flexShrink: 0 }} />
          <span className="skill-card-v2-source">
            {skill.source === 'official' ? 'Official' : skill.source === 'github' ? 'GitHub' : 'Custom'}
          </span>
          {skill.updatedAt && (
            <>
              <span className="skill-card-v2-dot">•</span>
              <span className="skill-card-v2-date">Updated on {skill.updatedAt}</span>
            </>
          )}
        </div>
        <div style={{ position: 'relative' }} ref={menuRef}>
          <button
            className="skill-card-v2-menu-btn"
            onClick={e => { e.stopPropagation(); setShowMenu(v => !v) }}
          >
            <MoreHorizontal size={14} />
          </button>
          {showMenu && (
            <div className="skill-card-v2-dropdown">
              <button
                className="skill-card-v2-dropdown-item danger"
                onClick={() => { onDelete(skill.id); setShowMenu(false) }}
              >
                <X size={12} />
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
          <div className="skill-modal-icon-box">
            <GitBranch size={20} style={{ color: '#E5E5E5' }} />
          </div>
          <div className="skill-modal-icon-arrow">⇄</div>
          <div className="skill-modal-icon-box">
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
        <button className="skill-modal-btn" onClick={handleImport} disabled={!url.trim() || loading}>
          {loading && <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />}
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

  return (
    <div className="skill-modal-overlay" onClick={onClose}>
      <div className="skill-modal" onClick={e => e.stopPropagation()}>
        <button className="skill-modal-close" onClick={onClose}><X size={15} /></button>
        <h3 className="skill-modal-title">Last opp skill</h3>
        <div
          className={`skill-upload-zone${dragging ? ' dragging' : ''}`}
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) setFile(f) }}
          onClick={() => inputRef.current?.click()}
        >
          <input ref={inputRef} type="file" accept=".zip,.skill" style={{ display: 'none' }}
            onChange={e => e.target.files?.[0] && setFile(e.target.files[0])} />
          <div className="skill-upload-icon"><Upload size={24} style={{ color: '#5A5A5A' }} /></div>
          {file
            ? <p style={{ fontSize: 13, color: '#E5E5E5', marginTop: 8 }}>{file.name}</p>
            : <p style={{ fontSize: 13, color: '#5A5A5A', marginTop: 8 }}>Dra og slipp eller klikk for å laste opp</p>
          }
        </div>
        <div className="skill-upload-requirements">
          <p style={{ fontSize: 12, fontWeight: 600, color: '#9A9A9A', marginBottom: 8 }}>Filkrav</p>
          <ul style={{ fontSize: 12, color: '#5A5A5A', paddingLeft: 16, lineHeight: 1.8, margin: 0 }}>
            <li>.zip eller .skill fil med en SKILL.md fil på rotnivå</li>
            <li>SKILL.md inneholder navn og beskrivelse i YAML-format</li>
          </ul>
        </div>
        <button className="skill-modal-btn" onClick={() => file && onUpload(file.name.replace(/\.(zip|skill)$/, ''))} disabled={!file}>
          Last opp
        </button>
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
            width: 56, height: 56, borderRadius: 16,
            background: 'linear-gradient(135deg, #1A93FE22, #8B5CF622)',
            border: '1px solid #2A2A2A', display: 'flex', alignItems: 'center',
            justifyContent: 'center', margin: '0 auto 16px',
          }}>
            <MessageSquare size={24} style={{ color: '#1A93FE' }} />
          </div>
          <h3 className="skill-modal-title">Bygg med Sine</h3>
          <p className="skill-modal-sub">
            Sine hjelper deg med å lage en egendefinert skill gjennom en samtale.
            Du blir tatt til chat-vinduet der du kan beskrive hva skillen skal gjøre.
          </p>
        </div>
        <button className="skill-modal-btn" onClick={() => {
          onNavigateToChat('Hjelp meg å lage en skill sammen ved hjelp av /skill-creator. Still meg først spørsmål om hva skillen skal gjøre.')
          onClose()
        }}>
          Start samtale med Sine
        </button>
      </div>
    </div>
  )
}

// ─── Offisielt bibliotek modal ────────────────────────────────
function OfficialLibraryModal({ onClose, onInstall, installedNames }: {
  onClose: () => void
  onInstall: (skill: Omit<Skill, 'id' | 'enabled' | 'createdAt'>) => void
  installedNames: Set<string>
}) {
  const [search, setSearch] = useState('')
  const filtered = OFFICIAL_SKILLS.filter(s =>
    !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.description.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="skill-modal-overlay" onClick={onClose}>
      <div className="skill-modal skill-modal--wide" onClick={e => e.stopPropagation()}>
        <button className="skill-modal-close" onClick={onClose}><X size={15} /></button>
        <h3 className="skill-modal-title">Offisielt skills-bibliotek</h3>
        <p className="skill-modal-sub">Forhåndsbygde skills vedlikeholdt av Sine-teamet. Tilgjengelig for alle brukere.</p>

        <div className="skill-modal-search">
          <Search size={13} style={{ color: '#5A5A5A' }} />
          <input
            placeholder="Søk skills..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ background: 'none', border: 'none', outline: 'none', color: '#E5E5E5', fontSize: 13, flex: 1 }}
          />
        </div>

        <div className="skill-library-grid">
          {filtered.map(skill => {
            const installed = installedNames.has(skill.name)
            return (
              <div key={skill.name} className="skill-library-card">
                <div className="skill-library-card-top">
                  <span style={{ fontSize: 20 }}>{skill.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#E5E5E5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {skill.name}
                    </div>
                    {skill.updatedAt && (
                      <div style={{ fontSize: 11, color: '#5A5A5A' }}>Oppdatert {skill.updatedAt}</div>
                    )}
                  </div>
                  <button
                    className={`skill-library-install-btn${installed ? ' installed' : ''}`}
                    onClick={() => !installed && onInstall(skill)}
                    disabled={installed}
                  >
                    {installed ? <><Check size={12} /> Installert</> : '+ Legg til'}
                  </button>
                </div>
                <p style={{ fontSize: 12, color: '#7A7A7A', margin: '8px 0 0', lineHeight: 1.5 }}>{skill.description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Hoved Skills-innhold ─────────────────────────────────────
export function SkillsContent({ onNavigateToChat }: { onNavigateToChat?: (prompt: string) => void }) {
  const { settings, updateSettings } = useApp()
  const skills: Skill[] = settings.skills ?? []

  const [search, setSearch] = useState('')
  const [filterOfficial, setFilterOfficial] = useState(false)
  const [showAddMenu, setShowAddMenu] = useState(false)
  const [showGithubModal, setShowGithubModal] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showBuildModal, setShowBuildModal] = useState(false)
  const [showLibraryModal, setShowLibraryModal] = useState(false)
  const addMenuRef = useRef<HTMLDivElement>(null)

  // Close add menu on outside click
  useEffect(() => {
    if (!showAddMenu) return
    const handler = (e: MouseEvent) => {
      if (addMenuRef.current && !addMenuRef.current.contains(e.target as Node)) {
        setShowAddMenu(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showAddMenu])

  const saveSkills = (updated: Skill[]) => updateSettings({ skills: updated })

  const handleToggle = (id: string) =>
    saveSkills(skills.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s))

  const handleDelete = (id: string) =>
    saveSkills(skills.filter(s => s.id !== id))

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
    const parts = url.split('/')
    const repoName = parts[parts.length - 1] || 'github-skill'
    handleAddSkill({ name: repoName, description: `Importert fra GitHub: ${url}`, source: 'github', githubUrl: url, icon: '⚙️' })
    setShowGithubModal(false)
  }

  const handleUpload = (name: string) => {
    handleAddSkill({ name, description: 'Lastet opp skill', source: 'upload', icon: '📦' })
    setShowUploadModal(false)
  }

  const installedNames = new Set(skills.map(s => s.name))

  // Filter skills
  const filteredSkills = skills.filter(s => {
    const matchSearch = !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.description.toLowerCase().includes(search.toLowerCase())
    const matchOfficial = !filterOfficial || s.source === 'official'
    return matchSearch && matchOfficial
  })

  return (
    <div className="skills-v2-container">
      {/* ── Toolbar ── */}
      <div className="skills-v2-toolbar">
        <button className="skills-v2-filter-btn" title="Filtrer">
          <SlidersHorizontal size={14} />
        </button>
        <div className="skills-v2-search-wrap">
          <Search size={13} style={{ color: '#5A5A5A', flexShrink: 0 }} />
          <input
            className="skills-v2-search"
            placeholder="Søk etter skill"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <button
          className={`skills-v2-official-btn${filterOfficial ? ' active' : ''}`}
          onClick={() => setFilterOfficial(v => !v)}
        >
          <Shield size={13} />
          Official
        </button>
      </div>

      {/* ── Add custom Skills banner ── */}
      <div className="skills-v2-add-banner">
        <div className="skills-v2-add-banner-icons">
          <div className="skills-v2-banner-icon-stack">
            <div className="skills-v2-banner-icon top">⚙️</div>
            <div className="skills-v2-banner-icon bot">⚙️</div>
          </div>
        </div>
        <div className="skills-v2-add-banner-text">
          <span className="skills-v2-add-banner-title">Legg til egendefinerte skills</span>
          <span className="skills-v2-add-banner-sub">Legg til en skill for å låse opp nye muligheter for deg eller teamet ditt.</span>
        </div>
        <div style={{ position: 'relative', flexShrink: 0 }} ref={addMenuRef}>
          <button
            className="skills-v2-add-btn"
            onClick={() => setShowAddMenu(v => !v)}
          >
            <Plus size={13} />
            Legg til
            <ChevronDown size={11} />
          </button>
          {showAddMenu && (
            <div className="skills-v2-add-menu">
              <button className="skills-v2-add-menu-item" onClick={() => { setShowBuildModal(true); setShowAddMenu(false) }}>
                <div className="skills-v2-add-menu-icon"><MessageSquare size={14} /></div>
                <div>
                  <div className="skills-v2-add-menu-label">Bygg med Sine</div>
                  <div className="skills-v2-add-menu-sub">Bygg gode skills gjennom samtale</div>
                </div>
              </button>
              <button className="skills-v2-add-menu-item" onClick={() => { setShowUploadModal(true); setShowAddMenu(false) }}>
                <div className="skills-v2-add-menu-icon"><Upload size={14} /></div>
                <div>
                  <div className="skills-v2-add-menu-label">Last opp en skill</div>
                  <div className="skills-v2-add-menu-sub">Last opp .zip, .skill eller mappe</div>
                </div>
              </button>
              <button className="skills-v2-add-menu-item" onClick={() => { setShowLibraryModal(true); setShowAddMenu(false) }}>
                <div className="skills-v2-add-menu-icon"><Shield size={14} /></div>
                <div>
                  <div className="skills-v2-add-menu-label">Legg til fra offisielt bibliotek</div>
                  <div className="skills-v2-add-menu-sub">Forhåndsbygde skills vedlikeholdt av Sine</div>
                </div>
              </button>
              <button className="skills-v2-add-menu-item" onClick={() => { setShowGithubModal(true); setShowAddMenu(false) }}>
                <div className="skills-v2-add-menu-icon"><GitBranch size={14} /></div>
                <div>
                  <div className="skills-v2-add-menu-label">Importer fra GitHub</div>
                  <div className="skills-v2-add-menu-sub">Lim inn en repositoriums-lenke for å komme i gang</div>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Skills grid ── */}
      {filteredSkills.length === 0 ? (
        <div className="skills-v2-empty">
          <div className="skills-v2-empty-icon">⚙️</div>
          <p className="skills-v2-empty-title">Ingen skills ennå</p>
          <p className="skills-v2-empty-sub">
            Legg til skills for å utvide hva Sine kan gjøre.
          </p>
          <button
            className="skills-v2-empty-cta"
            onClick={() => setShowLibraryModal(true)}
          >
            <Check size={13} />
            Utforsk offisielle skills
          </button>
        </div>
      ) : (
        <div className="skills-v2-grid">
          {filteredSkills.map(skill => (
            <SkillCard
              key={skill.id}
              skill={skill}
              onToggle={handleToggle}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* ── Modals ── */}
      {showGithubModal && (
        <ImportGithubModal onClose={() => setShowGithubModal(false)} onImport={handleGithubImport} />
      )}
      {showUploadModal && (
        <UploadSkillModal onClose={() => setShowUploadModal(false)} onUpload={handleUpload} />
      )}
      {showBuildModal && (
        <BuildWithSineModal onClose={() => setShowBuildModal(false)} onNavigateToChat={onNavigateToChat ?? (() => {})} />
      )}
      {showLibraryModal && (
        <OfficialLibraryModal
          onClose={() => setShowLibraryModal(false)}
          onInstall={skill => handleAddSkill(skill)}
          installedNames={installedNames}
        />
      )}
    </div>
  )
}
