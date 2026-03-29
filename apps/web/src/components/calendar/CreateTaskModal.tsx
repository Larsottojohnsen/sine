import { useState } from 'react'
import { X, Zap, ChevronDown } from 'lucide-react'
import { categoryColor } from '@/hooks/useRecurringTasks'
import type { RecurringTaskProposal } from '@/components/chat/RecurringTaskCard'

const PRESET_CATEGORIES = [
  'Annonsering', 'Innhold', 'Rapportering', 'E-post',
  'Sosiale medier', 'Analyse', 'Møteforberedelse',
  'Kundeoppfølging', 'Vedlikehold', 'Tilpasset',
]

const CONNECTORS = [
  { id: 'github',     name: 'GitHub' },
  { id: 'gmail',      name: 'Gmail' },
  { id: 'meta-ads',   name: 'Meta Ads' },
  { id: 'instagram',  name: 'Instagram' },
  { id: 'outlook',    name: 'Outlook Mail' },
  { id: 'gcal',       name: 'Google Calendar' },
  { id: 'ocal',       name: 'Outlook Calendar' },
]

const WEEKDAYS_NO = ['Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag', 'Søndag']

interface CreateTaskModalProps {
  onClose: () => void
  onCreate: (proposal: RecurringTaskProposal) => Promise<void>
  initialValues?: Partial<RecurringTaskProposal>
}

export function CreateTaskModal({ onClose, onCreate, initialValues }: CreateTaskModalProps) {
  const [title, setTitle] = useState(initialValues?.title ?? '')
  const [description, setDescription] = useState(initialValues?.description ?? '')
  const [category, setCategory] = useState(initialValues?.category ?? 'Tilpasset')
  const [customCategory, setCustomCategory] = useState('')
  const [frequency, setFrequency] = useState<RecurringTaskProposal['frequency']>(initialValues?.frequency ?? 'weekly')
  const [dayOfWeek, setDayOfWeek] = useState(initialValues?.dayOfWeek ?? 0)
  const [dayOfMonth, setDayOfMonth] = useState(initialValues?.dayOfMonth ?? 1)
  const [customDays, setCustomDays] = useState<number[]>(initialValues?.customDays ?? [])
  const [timeOfDay, setTimeOfDay] = useState(initialValues?.timeOfDay ?? '09:00')
  const [connectorId, setConnectorId] = useState(initialValues?.connectorId ?? '')
  const [agentPrompt, setAgentPrompt] = useState(initialValues?.agentPrompt ?? '')
  const [endsAt, setEndsAt] = useState(initialValues?.endsAt ?? '')
  const [neverEnds, setNeverEnds] = useState(!initialValues?.endsAt)
  const [saving, setSaving] = useState(false)

  const finalCategory = category === 'Tilpasset' && customCategory.trim() ? customCategory.trim() : category
  const color = categoryColor(finalCategory)

  const toggleCustomDay = (d: number) => {
    setCustomDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d].sort())
  }

  const handleSave = async () => {
    if (!title.trim() || !agentPrompt.trim()) return
    setSaving(true)
    try {
      const connector = CONNECTORS.find(c => c.id === connectorId)
      await onCreate({
        title: title.trim(),
        description: description.trim(),
        category: finalCategory,
        color,
        frequency,
        dayOfWeek: frequency === 'weekly' ? dayOfWeek : undefined,
        dayOfMonth: frequency === 'monthly' ? dayOfMonth : undefined,
        customDays: frequency === 'custom' ? customDays : undefined,
        timeOfDay,
        connectorId: connectorId || undefined,
        connectorName: connector?.name,
        agentPrompt: agentPrompt.trim(),
        endsAt: neverEnds ? undefined : endsAt || undefined,
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.75)', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(4px)',
    }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{
        background: '#1A1A1A', borderRadius: 16, width: 520,
        maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto',
        padding: '28px 28px 24px', position: 'relative',
        border: '1px solid #2E2E2E',
      }}>
        {/* Close */}
        <button onClick={onClose} style={{
          position: 'absolute', top: 16, right: 16,
          background: 'none', border: 'none', color: '#5A5A5A',
          cursor: 'pointer', padding: 4, borderRadius: 6,
        }}><X size={18} /></button>

        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#E5E5E5', margin: '0 0 20px' }}>
          Ny repeterende oppgave
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Title */}
          <Field label="Oppgavenavn *">
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="f.eks. Ukentlig salgsrapport"
              style={inputStyle}
              autoFocus
            />
          </Field>

          {/* Description */}
          <Field label="Beskrivelse">
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Hva skal agenten gjøre?"
              rows={2}
              style={{ ...inputStyle, resize: 'vertical', minHeight: 60 }}
            />
          </Field>

          {/* Category */}
          <Field label="Kategori">
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  style={{ ...inputStyle, appearance: 'none', paddingRight: 30 }}
                >
                  {PRESET_CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <ChevronDown size={13} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#5A5A5A', pointerEvents: 'none' }} />
              </div>
              {/* Color preview */}
              <div style={{
                width: 38, height: 38, borderRadius: 8, flexShrink: 0,
                background: color + '33', border: `2px solid ${color}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ width: 12, height: 12, borderRadius: '50%', background: color }} />
              </div>
            </div>
            {category === 'Tilpasset' && (
              <input
                value={customCategory}
                onChange={e => setCustomCategory(e.target.value)}
                placeholder="Skriv inn kategorinavn..."
                style={{ ...inputStyle, marginTop: 6 }}
              />
            )}
          </Field>

          {/* Frequency */}
          <Field label="Frekvens">
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {(['daily', 'weekly', 'monthly', 'custom'] as const).map(f => (
                <button key={f} onClick={() => setFrequency(f)} style={{
                  padding: '6px 14px', borderRadius: 7, border: 'none',
                  background: frequency === f ? '#1A93FE' : '#252525',
                  color: frequency === f ? '#fff' : '#9A9A9A',
                  fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500,
                }}>
                  {{ daily: 'Daglig', weekly: 'Ukentlig', monthly: 'Månedlig', custom: 'Tilpasset' }[f]}
                </button>
              ))}
            </div>

            {/* Weekly: day picker */}
            {frequency === 'weekly' && (
              <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                {WEEKDAYS_NO.map((d, i) => (
                  <button key={i} onClick={() => setDayOfWeek(i)} style={{
                    padding: '4px 10px', borderRadius: 6,
                    background: dayOfWeek === i ? '#1A93FE22' : '#252525',
                    border: dayOfWeek === i ? '1px solid #1A93FE' : '1px solid #333',
                    color: dayOfWeek === i ? '#1A93FE' : '#7A7A7A',
                    fontSize: 11, cursor: 'pointer', fontFamily: 'inherit',
                  }}>
                    {d.slice(0, 3)}
                  </button>
                ))}
              </div>
            )}

            {/* Monthly: day of month */}
            {frequency === 'monthly' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                <span style={{ fontSize: 12, color: '#7A7A7A' }}>Den</span>
                <input
                  type="number" min={1} max={31}
                  value={dayOfMonth}
                  onChange={e => setDayOfMonth(Number(e.target.value))}
                  style={{ ...inputStyle, width: 60 }}
                />
                <span style={{ fontSize: 12, color: '#7A7A7A' }}>hver måned</span>
              </div>
            )}

            {/* Custom: multi-day picker */}
            {frequency === 'custom' && (
              <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                {WEEKDAYS_NO.map((d, i) => (
                  <button key={i} onClick={() => toggleCustomDay(i)} style={{
                    padding: '4px 10px', borderRadius: 6,
                    background: customDays.includes(i) ? '#1A93FE22' : '#252525',
                    border: customDays.includes(i) ? '1px solid #1A93FE' : '1px solid #333',
                    color: customDays.includes(i) ? '#1A93FE' : '#7A7A7A',
                    fontSize: 11, cursor: 'pointer', fontFamily: 'inherit',
                  }}>
                    {d.slice(0, 3)}
                  </button>
                ))}
              </div>
            )}
          </Field>

          {/* Time */}
          <Field label="Tidspunkt (norsk tid)">
            <input
              type="time"
              value={timeOfDay}
              onChange={e => setTimeOfDay(e.target.value)}
              style={inputStyle}
            />
          </Field>

          {/* End date */}
          <Field label="Sluttdato">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={neverEnds}
                  onChange={e => setNeverEnds(e.target.checked)}
                  style={{ accentColor: '#1A93FE' }}
                />
                <span style={{ fontSize: 12, color: '#9A9A9A' }}>Slutter aldri</span>
              </label>
              {!neverEnds && (
                <input
                  type="date"
                  value={endsAt}
                  onChange={e => setEndsAt(e.target.value)}
                  style={{ ...inputStyle, flex: 1 }}
                />
              )}
            </div>
          </Field>

          {/* Connector */}
          <Field label="Tilkobling (valgfritt)">
            <div style={{ position: 'relative' }}>
              <select
                value={connectorId}
                onChange={e => setConnectorId(e.target.value)}
                style={{ ...inputStyle, appearance: 'none', paddingRight: 30 }}
              >
                <option value="">Ingen tilkobling</option>
                {CONNECTORS.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <ChevronDown size={13} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#5A5A5A', pointerEvents: 'none' }} />
            </div>
          </Field>

          {/* Agent prompt */}
          <Field label="Agent-instruksjon *">
            <textarea
              value={agentPrompt}
              onChange={e => setAgentPrompt(e.target.value)}
              placeholder="Beskriv hva agenten skal gjøre når denne oppgaven kjøres..."
              rows={3}
              style={{ ...inputStyle, resize: 'vertical', minHeight: 80, fontFamily: 'monospace', fontSize: 12 }}
            />
          </Field>
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginTop: 20, paddingTop: 16, borderTop: '1px solid #2A2A2A',
        }}>
          <button onClick={onClose} style={{
            background: 'none', border: '1px solid #333', borderRadius: 8,
            color: '#7A7A7A', fontSize: 13, padding: '8px 16px',
            cursor: 'pointer', fontFamily: 'inherit',
          }}>
            Avbryt
          </button>
          <button
            onClick={handleSave}
            disabled={!title.trim() || !agentPrompt.trim() || saving}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '9px 20px', borderRadius: 8,
              background: !title.trim() || !agentPrompt.trim() ? '#252525' : '#1A93FE',
              border: 'none', color: !title.trim() || !agentPrompt.trim() ? '#5A5A5A' : '#fff',
              fontSize: 13, fontWeight: 600, cursor: saving || !title.trim() ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit', opacity: saving ? 0.7 : 1,
            }}
          >
            <Zap size={13} />
            {saving ? 'Lagrer...' : 'Aktiver oppgave'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ fontSize: 11, fontWeight: 600, color: '#5A5A5A', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {label}
      </label>
      {children}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  background: '#252525',
  border: '1px solid #333',
  borderRadius: 8,
  color: '#E5E5E5',
  fontSize: 13,
  fontFamily: 'inherit',
  outline: 'none',
  boxSizing: 'border-box',
}
