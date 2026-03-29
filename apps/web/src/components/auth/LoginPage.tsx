import { useState } from 'react'
import PixelBlast from './PixelBlast'
import { getSupabase } from '../../hooks/useAuth'

// CDN logo URLs
const LOGO_LIGHT = "/sine/Sine-hvit.svg"
const ICON_LIGHT = "/sine/Sine-ikon-hvit.svg"
const JTG_LOGO = "/sine/jtg-logo-white.png"

type LoginStep = 'main' | 'email-password' | 'create-account'

export function LoginPage() {
  const [step, setStep] = useState<LoginStep>('main')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleGoogleLogin = async () => {
    setLoading(true)
    setError('')
    try {
      const supabase = getSupabase()
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin + (import.meta.env.BASE_URL || '/') }
      })
      if (error) setError(error.message)
    } catch {
      setError('Google-innlogging feilet. Prøv igjen.')
    } finally {
      setLoading(false)
    }
  }

  const handleGitHubLogin = async () => {
    setLoading(true)
    setError('')
    try {
      const supabase = getSupabase()
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: { redirectTo: window.location.origin + (import.meta.env.BASE_URL || '/') }
      })
      if (error) setError(error.message)
    } catch {
      setError('GitHub-innlogging feilet. Prøv igjen.')
    } finally {
      setLoading(false)
    }
  }

  const handleEmailContinue = async () => {
    if (!email.trim() || !email.includes('@')) {
      setError('Skriv inn en gyldig e-postadresse')
      return
    }
    setLoading(true)
    setError('')
    try {
      // Try password login first — if user exists, go to password step
      // We just move to password step without checking existence (more secure)
      setStep('email-password')
    } catch {
      setError('Noe gikk galt. Prøv igjen.')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordLogin = async () => {
    if (!password.trim()) { setError('Skriv inn passord'); return }
    setLoading(true)
    setError('')
    try {
      const supabase = getSupabase()
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
      if (error) setError(error.message.includes('Invalid login credentials') ? 'Feil e-post eller passord' : error.message)
    } catch {
      setError('Innlogging feilet. Prøv igjen.')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAccount = async () => {
    if (!password.trim() || password.length < 8) {
      setError('Passordet må være minst 8 tegn')
      return
    }
    setLoading(true)
    setError('')
    try {
      const supabase = getSupabase()
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: window.location.origin + (import.meta.env.BASE_URL || '/'),
          data: { display_name: email.split('@')[0] },
        }
      })
      if (error) setError(error.message)
      // On success, Supabase will trigger onAuthStateChange and log the user in
    } catch {
      setError('Registrering feilet. Prøv igjen.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      {/* PixelBlast bakgrunn */}
      <div className="login-pixel-bg">
        <PixelBlast
          variant="square"
          pixelSize={4}
          color="#4a5568"
          patternScale={2}
          patternDensity={1}
          pixelSizeJitter={0}
          enableRipples
          rippleSpeed={0.4}
          rippleThickness={0.12}
          rippleIntensityScale={1.5}
          liquid={false}
          speed={0.5}
          edgeFade={0.25}
          transparent
        />
      </div>

      {/* Logo øverst til venstre */}
      <div className="login-logo">
        <img src={LOGO_LIGHT} alt="Sine" className="login-logo-img" style={{ filter: 'none' }} />
      </div>

      {/* Innloggingskort */}
      <div className="login-card-wrapper">
        <div className="login-card">

          {/* Sine ikon */}
          <div className="login-icon">
            <img
              src={ICON_LIGHT}
              alt="Sine ikon"
              className="login-favicon-icon"
              style={{ filter: 'none' }}
            />
          </div>

          {step === 'main' && (
            <>
              <h1 className="login-title">Logg inn eller registrer deg</h1>
              <p className="login-subtitle">Begynn å skape med Sine</p>

              <div className="login-oauth-buttons">
                <button className="login-oauth-btn" onClick={handleGoogleLogin} disabled={loading}>
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  <span>Fortsett med Google</span>
                </button>

                <button className="login-oauth-btn" onClick={handleGitHubLogin} disabled={loading}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                  </svg>
                  <span>Fortsett med GitHub</span>
                </button>
              </div>

              <div className="login-divider"><span>Eller</span></div>

              <div className="login-email-section">
                <input
                  type="email"
                  className="login-input"
                  placeholder="Skriv inn e-postadresse"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError('') }}
                  onKeyDown={e => e.key === 'Enter' && handleEmailContinue()}
                  autoComplete="email"
                />
                {error && <p className="login-error">{error}</p>}
                <button className="login-continue-btn" onClick={handleEmailContinue} disabled={loading || !email.trim()}>
                  {loading ? <span className="login-spinner" /> : 'Fortsett'}
                </button>
              </div>

              <div style={{ textAlign: 'center', marginTop: 12 }}>
                <span style={{ fontSize: 12, color: '#5A5A5A' }}>Ny bruker? </span>
                <button
                  onClick={() => { setStep('create-account') }}
                  style={{ fontSize: 12, color: '#1A93FE', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}
                >
                  Opprett konto
                </button>
              </div>
            </>
          )}

          {step === 'email-password' && (
            <>
              <h1 className="login-title">Logg inn</h1>
              <div className="login-email-section">
                <div className="login-input-group">
                  <label className="login-label">E-post</label>
                  <div className="login-input-with-action">
                    <input type="email" className="login-input" value={email} readOnly />
                    <button className="login-edit-btn" onClick={() => { setStep('main'); setError('') }}>Endre</button>
                  </div>
                </div>
                <div className="login-input-group">
                  <label className="login-label">Passord</label>
                  <div className="login-input-with-action">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="login-input"
                      placeholder="Skriv inn passord"
                      value={password}
                      onChange={e => { setPassword(e.target.value); setError('') }}
                      onKeyDown={e => e.key === 'Enter' && handlePasswordLogin()}
                      autoFocus
                    />
                    <button className="login-eye-btn" onClick={() => setShowPassword(p => !p)} type="button">
                      {showPassword ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
                          <line x1="1" y1="1" x2="23" y2="23"/>
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
                {error && <p className="login-error">{error}</p>}
                <button
                  className="login-continue-btn"
                  onClick={handlePasswordLogin}
                  disabled={loading || !password.trim()}
                >
                  {loading ? <span className="login-spinner" /> : 'Logg inn'}
                </button>
                <button className="login-back-btn" onClick={() => { setStep('main'); setError('') }}>Tilbake</button>
              </div>
            </>
          )}

          {step === 'create-account' && (
            <>
              <h1 className="login-title">Opprett konto</h1>
              <div className="login-email-section">
                <div className="login-input-group">
                  <label className="login-label">E-post</label>
                  <input
                    type="email"
                    className="login-input"
                    placeholder="Skriv inn e-postadresse"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setError('') }}
                    autoComplete="email"
                  />
                </div>
                <div className="login-input-group">
                  <label className="login-label">Passord (minst 8 tegn)</label>
                  <div className="login-input-with-action">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="login-input"
                      placeholder="Velg et passord"
                      value={password}
                      onChange={e => { setPassword(e.target.value); setError('') }}
                      onKeyDown={e => e.key === 'Enter' && handleCreateAccount()}
                    />
                    <button className="login-eye-btn" onClick={() => setShowPassword(p => !p)} type="button">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    </button>
                  </div>
                </div>
                {error && <p className="login-error">{error}</p>}
                <button
                  className="login-continue-btn"
                  onClick={handleCreateAccount}
                  disabled={loading || !password.trim() || !email.trim()}
                >
                  {loading ? <span className="login-spinner" /> : 'Opprett konto'}
                </button>
                <button className="login-back-btn" onClick={() => { setStep('main'); setError('') }}>Tilbake</button>
              </div>
            </>
          )}
        </div>

        <div className="login-footer">
          <a href="#" className="login-footer-link">Vilkår for bruk</a>
          <a href="#" className="login-footer-link">Personvern</a>
        </div>
      </div>

      {/* Johnsen Technology branding – bunn av siden */}
      <div className="login-bottom-brand" style={{ pointerEvents: 'auto' }}>
        <a href="https://jtec.no" target="_blank" rel="noopener noreferrer">
          <img src={JTG_LOGO} alt="Johnsen Technology" className="login-jtg-logo" />
        </a>
      </div>
    </div>
  )
}
