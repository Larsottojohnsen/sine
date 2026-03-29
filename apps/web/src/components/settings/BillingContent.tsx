import { useState } from 'react'
import { Sparkles, Calendar, HelpCircle, ExternalLink, ChevronDown, X, Users, Shield } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useCredits } from '@/hooks/useCredits'

/* ─── Credit tier dropdown options (Manus-style) ─── */
const CREDIT_TIERS = [
  { id: '1000',  label: '1 000 kreditter / mnd',  price: 'kr 149',  priceId: 'price_pro_1000' },
  { id: '2000',  label: '2 000 kreditter / mnd',  price: 'kr 249',  priceId: 'price_pro_2000' },
  { id: '5000',  label: '5 000 kreditter / mnd',  price: 'kr 499',  priceId: 'price_pro_5000' },
  { id: '10000', label: '10 000 kreditter / mnd', price: 'kr 899',  priceId: 'price_pro_10000' },
  { id: '20000', label: '20 000 kreditter / mnd', price: 'kr 1 499', priceId: 'price_pro_20000' },
]

const ADD_CREDIT_PACKS = [
  { id: '2000',  label: '2 000 kreditter',  price: 'kr 49',  priceId: 'price_pack_2000' },
  { id: '5000',  label: '5 000 kreditter',  price: 'kr 99',  priceId: 'price_pack_5000' },
  { id: '10000', label: '10 000 kreditter', price: 'kr 179', priceId: 'price_pack_10000' },
]

/* ─── Mock recent invoices ─── */
const MOCK_INVOICES = [
  { date: '27. mar. 2026', amount: 'kr 149,00', url: '#' },
  { date: '27. feb. 2026', amount: 'kr 149,00', url: '#' },
  { date: '27. jan. 2026', amount: 'kr 149,00', url: '#' },
  { date: '27. des. 2025', amount: 'kr 149,00', url: '#' },
  { date: '27. nov. 2025', amount: 'kr 149,00', url: '#' },
]

/* ─── Upgrade / Manage Subscription Modal ─── */
function UpgradeModal({ onClose, isPro }: { onClose: () => void; isPro: boolean }) {
  const [billing, setBilling] = useState<'monthly' | 'annually'>('monthly')
  const [selectedTier, setSelectedTier] = useState('1000')
  const [tierOpen, setTierOpen] = useState(false)
  const [upgrading, setUpgrading] = useState(false)

  const currentTier = CREDIT_TIERS.find(t => t.id === selectedTier) ?? CREDIT_TIERS[0]

  const handleUpgrade = async () => {
    setUpgrading(true)
    try {
      alert(`Stripe Pro-abonnement (${currentTier.label} – ${currentTier.price}/mnd) — kobles til Stripe i produksjon`)
    } finally {
      setUpgrading(false)
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
        background: '#1A1A1A', borderRadius: 16, width: 640,
        maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto',
        padding: '32px 32px 24px', position: 'relative',
        border: '1px solid #2E2E2E',
      }}>
        {/* Close */}
        <button onClick={onClose} style={{
          position: 'absolute', top: 16, right: 16,
          background: 'none', border: 'none', color: '#5A5A5A',
          cursor: 'pointer', padding: 4, borderRadius: 6,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}><X size={18} /></button>

        {/* Title */}
        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#E5E5E5', textAlign: 'center', marginBottom: 20 }}>
          {isPro ? 'Administrer abonnement' : 'Oppgrader til Sine Pro'}
        </h2>

        {/* Monthly / Annually toggle */}
        <div style={{
          display: 'flex', justifyContent: 'center', marginBottom: 24,
        }}>
          <div style={{
            display: 'flex', background: '#252525', borderRadius: 8,
            padding: 3, border: '1px solid #2E2E2E',
          }}>
            {(['monthly', 'annually'] as const).map(b => (
              <button key={b} onClick={() => setBilling(b)} style={{
                padding: '6px 18px', borderRadius: 6, border: 'none',
                background: billing === b ? '#3A3A3A' : 'transparent',
                color: billing === b ? '#E5E5E5' : '#5A5A5A',
                fontSize: 13, fontWeight: 500, cursor: 'pointer',
                fontFamily: 'inherit', transition: 'all 0.15s',
              }}>
                {b === 'monthly' ? 'Månedlig' : 'Årlig · Spar 17%'}
              </button>
            ))}
          </div>
        </div>

        {/* Plan cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          {/* Pro card (left – highlighted) */}
          <div style={{
            background: '#1E2A3A', border: '2px solid #1A93FE',
            borderRadius: 12, padding: '20px 20px 16px',
          }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#E5E5E5', marginBottom: 4 }}>
              {billing === 'monthly' ? currentTier.price : currentTier.price.replace('kr ', 'kr ')}
              <span style={{ fontSize: 13, fontWeight: 400, color: '#5A5A5A' }}> / mnd</span>
            </div>
            <div style={{ fontSize: 12, color: '#5A5A5A', marginBottom: 14 }}>Tilpassbar månedlig bruk</div>

            {/* Upgrade button */}
            <button onClick={handleUpgrade} disabled={upgrading} style={{
              width: '100%', padding: '10px 16px', borderRadius: 8,
              background: '#1A93FE', border: 'none', color: 'white',
              fontSize: 14, fontWeight: 600, cursor: upgrading ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit', marginBottom: 10, opacity: upgrading ? 0.7 : 1,
            }}>
              {upgrading ? 'Behandler...' : isPro ? 'Oppdater' : 'Oppgrader'}
            </button>

            {/* Credit tier dropdown */}
            <div style={{ position: 'relative', marginBottom: 14 }}>
              <button onClick={() => setTierOpen(!tierOpen)} style={{
                width: '100%', padding: '8px 12px', borderRadius: 8,
                background: '#252525', border: '1px solid #3A3A3A',
                color: '#E5E5E5', fontSize: 13, cursor: 'pointer',
                fontFamily: 'inherit', display: 'flex', alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <span>{currentTier.label}</span>
                <ChevronDown size={14} style={{
                  color: '#5A5A5A',
                  transform: tierOpen ? 'rotate(180deg)' : 'none',
                  transition: 'transform 0.15s',
                }} />
              </button>
              {tierOpen && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, right: 0,
                  background: '#252525', border: '1px solid #3A3A3A',
                  borderRadius: 8, zIndex: 100, marginTop: 2,
                  overflow: 'hidden',
                }}>
                  {CREDIT_TIERS.map(tier => (
                    <button key={tier.id} onClick={() => { setSelectedTier(tier.id); setTierOpen(false) }} style={{
                      width: '100%', padding: '9px 12px', background: 'none',
                      border: 'none', color: selectedTier === tier.id ? '#1A93FE' : '#E5E5E5',
                      fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
                      textAlign: 'left', display: 'flex', justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#2E2E2E')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                    >
                      <span style={{ fontWeight: selectedTier === tier.id ? 600 : 400 }}>{tier.label}</span>
                      {selectedTier === tier.id && <span style={{ fontSize: 11, color: '#5A5A5A' }}>Gjeldende</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Features */}
            {[
              '300 oppdateringskreditter daglig',
              `${currentTier.label}`,
              'Grundig research for store oppgaver',
              'Profesjonelle nettsider med dataanalyse',
              'Innsiktsfulle slides for masseproduksjon',
              'Tidlig tilgang til beta-funksjoner',
              '20 samtidige oppgaver',
              '20 planlagte oppgaver',
            ].map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
                <div style={{ width: 14, height: 14, flexShrink: 0, marginTop: 1 }}>
                  <svg viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="7" cy="7" r="6" stroke="#3A3A3A" strokeWidth="1.5"/>
                    <path d="M4 7l2 2 4-4" stroke="#9A9A9A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span style={{ fontSize: 12, color: '#9A9A9A', lineHeight: 1.4 }}>{f}</span>
              </div>
            ))}
          </div>

          {/* Free / Basic card (right) */}
          <div style={{
            background: '#1E1E1E', border: '1px solid #2E2E2E',
            borderRadius: 12, padding: '20px 20px 16px',
          }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#E5E5E5', marginBottom: 4 }}>
              kr 0<span style={{ fontSize: 13, fontWeight: 400, color: '#5A5A5A' }}> / mnd</span>
            </div>
            <div style={{ fontSize: 12, color: '#5A5A5A', marginBottom: 14 }}>Utvidet bruk for produktivitet</div>

            <button style={{
              width: '100%', padding: '10px 16px', borderRadius: 8,
              background: '#E5E5E5', border: 'none', color: '#0A0A0A',
              fontSize: 14, fontWeight: 600, cursor: 'pointer',
              fontFamily: 'inherit', marginBottom: 24,
            }}>
              {isPro ? 'Nedgrader' : 'Gjeldende plan'}
            </button>

            {[
              '300 oppdateringskreditter daglig',
              '1 000 kreditter per mnd',
              'Grundig research for store oppgaver',
              'Profesjonelle nettsider med dataanalyse',
              'Innsiktsfulle slides for masseproduksjon',
              'Bred research for vedvarende bruk',
              'Tidlig tilgang til beta-funksjoner',
              '20 samtidige oppgaver',
              '20 planlagte oppgaver',
            ].map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
                <div style={{ width: 14, height: 14, flexShrink: 0, marginTop: 1 }}>
                  <svg viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="7" cy="7" r="6" stroke="#3A3A3A" strokeWidth="1.5"/>
                    <path d="M4 7l2 2 4-4" stroke="#9A9A9A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span style={{ fontSize: 12, color: '#9A9A9A', lineHeight: 1.4 }}>{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom action rows */}
        {[
          {
            icon: <Sparkles size={18} style={{ color: '#9A9A9A' }} />,
            title: 'Utvid kredittgrense',
            desc: 'Oppgrader dine månedlige kreditter',
            action: 'Legg til kreditter',
            onClick: () => alert('Kjøp ekstra kreditter — kobles til Stripe'),
          },
          {
            icon: <Users size={18} style={{ color: '#9A9A9A' }} />,
            title: 'Sine-planer for team og bedrifter',
            desc: 'Fleksible planer for alle størrelser — fra startups til enterprise.',
            action: 'Få team',
            onClick: () => alert('Team-plan — kommer snart'),
          },
          {
            icon: <Shield size={18} style={{ color: '#9A9A9A' }} />,
            title: 'Sikkerhet og samsvar',
            desc: 'Sikkerhet på enterprise-nivå og bransjestandardsertifiseringer.',
            action: 'Les mer ↗',
            onClick: () => alert('Sikkerhetsdokumentasjon — kommer snart'),
          },
        ].map(row => (
          <div key={row.title} style={{
            display: 'flex', alignItems: 'center', gap: 14,
            padding: '14px 16px', background: '#252525',
            border: '1px solid #2E2E2E', borderRadius: 10, marginBottom: 8,
          }}>
            <div style={{
              width: 36, height: 36, background: '#1E1E1E', borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              {row.icon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#E5E5E5' }}>{row.title}</div>
              <div style={{ fontSize: 12, color: '#5A5A5A', marginTop: 1 }}>{row.desc}</div>
            </div>
            <button onClick={row.onClick} style={{
              padding: '7px 14px', background: '#1E1E1E',
              border: '1px solid #3A3A3A', borderRadius: 8,
              color: '#E5E5E5', fontSize: 12, fontWeight: 500,
              cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
            }}>
              {row.action}
            </button>
          </div>
        ))}

        {/* Footer links */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginTop: 16, paddingTop: 16, borderTop: '1px solid #2E2E2E',
        }}>
          <span style={{ fontSize: 12, color: '#5A5A5A' }}>
            Har du et problem?{' '}
            <a href="#" style={{ color: '#1A93FE', textDecoration: 'none' }}>Gå til hjelpesenter</a>.
          </span>
          <div style={{ display: 'flex', gap: 16 }}>
            <button onClick={() => alert('Nedgrader til Gratis — kobles til Stripe')} style={{
              background: 'none', border: 'none', color: '#5A5A5A',
              fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
            }}>
              Nedgrader til Gratis
            </button>
            <button onClick={() => alert('Rediger fakturering — åpner Stripe Customer Portal')} style={{
              background: 'none', border: 'none', color: '#5A5A5A',
              fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', gap: 4,
            }}>
              Rediger fakturering <ExternalLink size={11} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Main BillingContent component ─── */
export function BillingContent() {
  const { user } = useAuth()
  const { profile } = useCredits(user?.id ?? null)
  const isPro = profile?.plan === 'pro'
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [addCreditsOpen, setAddCreditsOpen] = useState(false)
  const [selectedPack, setSelectedPack] = useState('2000')
  const [purchasing, setPurchasing] = useState(false)

  const totalMonthlyCredits = isPro ? 1000 : 1000
  const freeCredits = 7
  const monthlyCredits = (profile?.credits ?? 1000) - freeCredits
  const renewalDate = 'apr. 10, 2026'

  const handleBuyCredits = async () => {
    setPurchasing(true)
    try {
      const pack = ADD_CREDIT_PACKS.find(p => p.id === selectedPack)
      if (!pack) return
      alert(`Stripe-betaling for ${pack.label} (${pack.price}) — kobles til Stripe i produksjon`)
    } finally {
      setPurchasing(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* Title */}
      <div style={{ marginBottom: 6 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#E5E5E5', margin: 0 }}>Fakturering</h2>
        <p style={{ fontSize: 13, color: '#5A5A5A', margin: '4px 0 0' }}>Administrer abonnementet og kredittene dine</p>
      </div>

      {/* ── Subscription card ── */}
      <div style={{
        background: '#1E1E1E', border: '1px solid #2E2E2E',
        borderRadius: 12, padding: '18px 20px', marginTop: 16, marginBottom: 20,
      }}>
        {/* Plan header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#E5E5E5' }}>
              {isPro ? 'Sine Pro' : 'Sine Gratis'}
            </div>
            {isPro && (
              <div style={{ fontSize: 12, color: '#5A5A5A', marginTop: 2 }}>
                Fornyelsdato <span style={{ color: '#9A9A9A', fontWeight: 500 }}>{renewalDate}</span>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setShowUpgradeModal(true)} style={{
              padding: '7px 16px', background: '#252525',
              border: '1px solid #3A3A3A', borderRadius: 8,
              color: '#E5E5E5', fontSize: 13, fontWeight: 500,
              cursor: 'pointer', fontFamily: 'inherit',
            }}>
              {isPro ? 'Administrer' : 'Oppgrader'}
            </button>
            <button onClick={() => setAddCreditsOpen(!addCreditsOpen)} style={{
              padding: '7px 16px', background: '#E5E5E5',
              border: 'none', borderRadius: 8,
              color: '#0A0A0A', fontSize: 13, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit',
            }}>
              Legg til kreditter
            </button>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: '#2E2E2E', marginBottom: 14 }} />

        {/* Credits row */}
        <div style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Sparkles size={14} style={{ color: '#9A9A9A' }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: '#E5E5E5' }}>Kreditter</span>
              <HelpCircle size={12} style={{ color: '#5A5A5A', cursor: 'help' }} />
            </div>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#E5E5E5' }}>
              {(profile?.credits ?? 1000).toLocaleString('no-NO')}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontSize: 12, color: '#5A5A5A', paddingLeft: 20 }}>Gratis kreditter</span>
            <span style={{ fontSize: 12, color: '#5A5A5A' }}>{freeCredits}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: '#5A5A5A', paddingLeft: 20 }}>Månedlige kreditter</span>
            <span style={{ fontSize: 12, color: '#5A5A5A' }}>
              {monthlyCredits.toLocaleString('no-NO')} / {totalMonthlyCredits.toLocaleString('no-NO')}
            </span>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: '#2E2E2E', marginBottom: 12 }} />

        {/* Daily refresh credits */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Calendar size={14} style={{ color: '#9A9A9A' }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: '#E5E5E5' }}>Daglige oppdateringskreditter</span>
            <HelpCircle size={12} style={{ color: '#5A5A5A', cursor: 'help' }} />
          </div>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#E5E5E5' }}>0</span>
        </div>
        <div style={{ fontSize: 12, color: '#5A5A5A', marginTop: 2, paddingLeft: 20 }}>
          Oppdateres til 300 kl. 01:00 hver dag
        </div>

        {/* Add credits inline panel */}
        {addCreditsOpen && (
          <div style={{
            marginTop: 16, padding: '14px 16px',
            background: '#252525', borderRadius: 10, border: '1px solid #2E2E2E',
          }}>
            <div style={{ fontSize: 12, color: '#5A5A5A', marginBottom: 10 }}>
              Kreditter utløper ikke og kan brukes når som helst.
            </div>
            <div style={{ position: 'relative', marginBottom: 10 }}>
              <select
                value={selectedPack}
                onChange={e => setSelectedPack(e.target.value)}
                style={{
                  width: '100%', padding: '9px 36px 9px 12px',
                  background: '#1E1E1E', border: '1px solid #3A3A3A',
                  borderRadius: 8, color: '#E5E5E5', fontSize: 13,
                  appearance: 'none', cursor: 'pointer', fontFamily: 'inherit',
                  outline: 'none',
                }}
              >
                {ADD_CREDIT_PACKS.map(p => (
                  <option key={p.id} value={p.id}>{p.label} — {p.price}</option>
                ))}
              </select>
              <ChevronDown size={13} style={{
                position: 'absolute', right: 10, top: '50%',
                transform: 'translateY(-50%)', color: '#5A5A5A', pointerEvents: 'none',
              }} />
            </div>
            <button onClick={handleBuyCredits} disabled={purchasing} style={{
              width: '100%', padding: '9px 16px', borderRadius: 8,
              background: '#1A93FE', border: 'none', color: 'white',
              fontSize: 13, fontWeight: 600, cursor: purchasing ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit', opacity: purchasing ? 0.7 : 1,
            }}>
              {purchasing ? 'Behandler...' : `Kjøp ${ADD_CREDIT_PACKS.find(p => p.id === selectedPack)?.label} — ${ADD_CREDIT_PACKS.find(p => p.id === selectedPack)?.price}`}
            </button>
          </div>
        )}
      </div>

      {/* ── Recent activity ── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: '#E5E5E5' }}>Nylig aktivitet</span>
          <a href="#" style={{
            fontSize: 12, color: '#5A5A5A', textDecoration: 'none',
            display: 'flex', alignItems: 'center', gap: 4,
          }}
          onMouseEnter={e => (e.currentTarget.style.color = '#E5E5E5')}
          onMouseLeave={e => (e.currentTarget.style.color = '#5A5A5A')}
          >
            Se alle fakturaer <ExternalLink size={11} />
          </a>
        </div>

        {/* Table header */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr auto',
          padding: '6px 0', borderBottom: '1px solid #2E2E2E',
          marginBottom: 4,
        }}>
          <span style={{ fontSize: 11, color: '#5A5A5A', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Dato</span>
          <span style={{ fontSize: 11, color: '#5A5A5A', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Beløp</span>
          <span style={{ fontSize: 11, color: '#5A5A5A', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}></span>
        </div>

        {/* Invoice rows */}
        {MOCK_INVOICES.map((inv, i) => (
          <div key={i} style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr auto',
            padding: '12px 0', borderBottom: '1px solid #1E1E1E',
            alignItems: 'center',
          }}>
            <span style={{ fontSize: 13, color: '#9A9A9A' }}>{inv.date}</span>
            <span style={{ fontSize: 13, color: '#9A9A9A' }}>{inv.amount}</span>
            <a href={inv.url} style={{
              fontSize: 13, color: '#E5E5E5', textDecoration: 'underline',
              fontWeight: 500, cursor: 'pointer',
            }}>
              Last ned
            </a>
          </div>
        ))}
      </div>

      {/* Upgrade modal */}
      {showUpgradeModal && (
        <UpgradeModal onClose={() => setShowUpgradeModal(false)} isPro={isPro} />
      )}
    </div>
  )
}
