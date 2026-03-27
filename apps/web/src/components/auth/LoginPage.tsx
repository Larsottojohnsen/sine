import { useState } from 'react'
import { AuroraBackground } from './AuroraBackground'
import { getSupabase } from '../../hooks/useAuth'

type LoginStep = 'main' | 'email-password' | 'email-sent' | 'create-account'

interface LoginPageProps {
  onLogin?: (user: { email: string; name?: string }) => void
}

// Sine-logo SVG – to avrundede piller (favicon-ikonet)
function SineIcon({ size = 40 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 384 384"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Øvre pille */}
      <rect x="80" y="60" width="224" height="100" rx="50" fill="#dadada" opacity="0.92" />
      {/* Nedre pille – litt smalere */}
      <rect x="80" y="186" width="200" height="88" rx="44" fill="#dadada" opacity="0.70" />
    </svg>
  )
}

export function LoginPage({ onLogin }: LoginPageProps) {
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
        options: {
          redirectTo: window.location.origin + (import.meta.env.BASE_URL || '/'),
        }
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
        options: {
          redirectTo: window.location.origin + (import.meta.env.BASE_URL || '/'),
        }
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
      const supabase = getSupabase()
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: window.location.origin + (import.meta.env.BASE_URL || '/'),
          shouldCreateUser: true,
        }
      })
      if (error) {
        setError(error.message)
      } else {
        setStep('email-sent')
      }
    } catch {
      setError('Noe gikk galt. Prøv igjen.')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordLogin = async () => {
    if (!password.trim()) {
      setError('Skriv inn passord')
      return
    }
    setLoading(true)
    setError('')
    try {
      const supabase = getSupabase()
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setError('Feil e-post eller passord')
        } else {
          setError(error.message)
        }
      } else if (data.user) {
        onLogin?.({ email: data.user.email || email, name: data.user.user_metadata?.name })
      }
    } catch {
      setError('Innlogging feilet. Prøv igjen.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <AuroraBackground variant="login" />

      {/* Logo øverst til venstre */}
      <div className="login-logo">
        <img src="/sine/Sinev5.svg" alt="Sine" className="login-logo-img" />
      </div>

      {/* Innloggingskort */}
      <div className="login-card-wrapper">
        <div className="login-card">

          {/* Sine-ikon – to piller */}
          <div className="login-icon">
            <SineIcon size={44} />
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

              <div className="login-divider">
                <span>Eller</span>
              </div>

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
                <button
                  className="login-continue-btn"
                  onClick={handleEmailContinue}
                  disabled={loading || !email.trim()}
                >
                  {loading ? <span className="login-spinner" /> : 'Fortsett'}
                </button>
              </div>
            </>
          )}

          {step === 'email-password' && (
            <>
              <h1 className="login-title">Logg inn</h1>
              <p className="login-subtitle">{email}</p>

              <div className="login-email-section">
                <div className="login-input-group">
                  <label className="login-label">E-post</label>
                  <div className="login-input-with-action">
                    <input
                      type="email"
                      className="login-input"
                      value={email}
                      readOnly
                    />
                    <button className="login-edit-btn" onClick={() => setStep('main')}>Endre</button>
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
                    <button
                      className="login-eye-btn"
                      onClick={() => setShowPassword(p => !p)}
                      type="button"
                    >
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
                  {loading ? <span className="login-spinner" /> : 'Fortsett'}
                </button>

                <button className="login-back-btn" onClick={() => setStep('main')}>Tilbake</button>
              </div>
            </>
          )}

          {step === 'create-account' && (
            <>
              <h1 className="login-title">Opprett konto</h1>
              <p className="login-subtitle">Sett passord for å fortsette</p>

              <div className="login-email-section">
                <div className="login-input-group">
                  <label className="login-label">E-post</label>
                  <div className="login-input-with-action">
                    <input type="email" className="login-input" value={email} readOnly />
                    <button className="login-edit-btn" onClick={() => setStep('main')}>Endre</button>
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
                      autoFocus
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
                  onClick={handlePasswordLogin}
                  disabled={loading || !password.trim()}
                >
                  {loading ? <span className="login-spinner" /> : 'Opprett konto'}
                </button>

                <button className="login-back-btn" onClick={() => setStep('main')}>Tilbake</button>
              </div>
            </>
          )}

          {step === 'email-sent' && (
            <>
              <div className="login-email-sent-icon">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="url(#aurora-icon2)" strokeWidth="1.5">
                  <defs>
                    <linearGradient id="aurora-icon2" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#00ff9f" />
                      <stop offset="100%" stopColor="#00d4ff" />
                    </linearGradient>
                  </defs>
                  <path d="M22 16a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h16a2 2 0 012 2v8z"/>
                  <polyline points="22,8 12,13 2,8"/>
                </svg>
              </div>
              <h1 className="login-title">Sjekk e-posten din</h1>
              <p className="login-subtitle">
                Vi har sendt en innloggingslenke til<br />
                <strong style={{ color: '#e0e0e0' }}>{email}</strong>
              </p>
              <button className="login-back-btn" style={{ marginTop: '24px' }} onClick={() => setStep('main')}>
                Tilbake
              </button>
            </>
          )}
        </div>

        {/* Lenker */}
        <div className="login-footer">
          <a href="#" className="login-footer-link">Vilkår for bruk</a>
          <a href="#" className="login-footer-link">Personvern</a>
        </div>
      </div>

      {/* Johnsen Technology – bunn av siden */}
      <div className="login-bottom-brand">
        Johnsen Technology
      </div>
    </div>
  )
}
