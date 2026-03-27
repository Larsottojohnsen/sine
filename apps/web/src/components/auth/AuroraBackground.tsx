import Aurora from './Aurora'

/**
 * AuroraBackground
 * Wrapper rundt reactbits.dev Aurora (WebGL/OGL).
 *
 * variant="login"  → dot-grid + aurora (som på login-siden)
 * variant="chat"   → kun aurora, ingen dot-grid
 */

interface AuroraBackgroundProps {
  variant?: 'login' | 'chat'
}

// Nordlys-farger: grønn → lilla → dyp blå
const LOGIN_COLORS = ['#00c472', '#7c3aed', '#1e1b4b']
const CHAT_COLORS  = ['#00a854', '#5b21b6', '#0f172a']

export function AuroraBackground({ variant = 'login' }: AuroraBackgroundProps) {
  const isLogin = variant === 'login'

  return (
    <div className="aurora-bg">
      {/* Dot-grid kun på login */}
      {isLogin && <div className="aurora-dot-grid" />}

      {/* Aurora WebGL-lag */}
      <div className="aurora-canvas-wrap">
        <Aurora
          colorStops={isLogin ? LOGIN_COLORS : CHAT_COLORS}
          amplitude={isLogin ? 1.0 : 0.8}
          blend={isLogin ? 0.5 : 0.4}
          speed={0.6}
        />
      </div>
    </div>
  )
}
