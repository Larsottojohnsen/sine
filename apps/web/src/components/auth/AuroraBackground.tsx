import { useEffect, useRef } from 'react'

/**
 * AuroraBackground
 * Nordlys-animasjon over et dot-grid mønster.
 * Mørkere, mer subtil nordlys-effekt – store, myke blobs som
 * sakte beveger seg og pulserer. Inspirert av Manus sin login-side.
 */

interface AuroraBackgroundProps {
  /** Bruk en litt lysere variant for chat-bakgrunn */
  variant?: 'login' | 'chat'
}

export function AuroraBackground({ variant = 'login' }: AuroraBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!

    let animId: number
    let W = window.innerWidth
    let H = window.innerHeight

    const resize = () => {
      W = window.innerWidth
      H = window.innerHeight
      canvas.width = W
      canvas.height = H
    }
    resize()
    window.addEventListener('resize', resize)

    // Nordlys-blobs – store, myke, sakte bevegelse
    // Farger: dype grønntoner og lilla/blå som ekte nordlys
    const blobs = [
      // Stor grønn blob – hoved nordlys, øvre venstre
      { x: 0.15, y: 0.20, rx: 0.70, ry: 0.35, color: '#00b368', alpha: variant === 'chat' ? 0.10 : 0.12, speed: 0.00012, phase: 0 },
      // Teal/cyan – midten
      { x: 0.50, y: 0.15, rx: 0.55, ry: 0.28, color: '#0891b2', alpha: variant === 'chat' ? 0.08 : 0.09, speed: 0.00015, phase: 1.5 },
      // Dyp lilla – høyre
      { x: 0.80, y: 0.30, rx: 0.50, ry: 0.30, color: '#7c3aed', alpha: variant === 'chat' ? 0.07 : 0.08, speed: 0.00010, phase: 2.8 },
      // Mørkegrønn – nedre venstre
      { x: 0.10, y: 0.55, rx: 0.45, ry: 0.22, color: '#065f46', alpha: variant === 'chat' ? 0.06 : 0.07, speed: 0.00018, phase: 0.9 },
      // Blå-lilla – øvre høyre
      { x: 0.70, y: 0.10, rx: 0.40, ry: 0.20, color: '#4f46e5', alpha: variant === 'chat' ? 0.05 : 0.06, speed: 0.00013, phase: 3.5 },
      // Ekstra grønn – midtre
      { x: 0.35, y: 0.35, rx: 0.60, ry: 0.25, color: '#059669', alpha: variant === 'chat' ? 0.05 : 0.06, speed: 0.00016, phase: 1.2 },
    ]

    let t = 0

    const draw = () => {
      t++
      ctx.clearRect(0, 0, W, H)

      for (const blob of blobs) {
        // Svært sakte bølgebevegelse – nordlys-drift
        const dx = Math.sin(t * blob.speed * 1000 + blob.phase) * 0.06
        const dy = Math.cos(t * blob.speed * 800 + blob.phase * 1.3) * 0.04
        const pulse = 1 + Math.sin(t * blob.speed * 500 + blob.phase * 0.7) * 0.12

        const cx = (blob.x + dx) * W
        const cy = (blob.y + dy) * H
        const rx = blob.rx * W * pulse
        const ry = blob.ry * H * pulse

        // Radial gradient for myk aurora-glød
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(rx, ry))
        const hex = blob.color

        const r = parseInt(hex.slice(1, 3), 16)
        const g = parseInt(hex.slice(3, 5), 16)
        const b = parseInt(hex.slice(5, 7), 16)

        grad.addColorStop(0, `rgba(${r},${g},${b},${blob.alpha * 2.0})`)
        grad.addColorStop(0.35, `rgba(${r},${g},${b},${blob.alpha})`)
        grad.addColorStop(0.7, `rgba(${r},${g},${b},${blob.alpha * 0.3})`)
        grad.addColorStop(1, `rgba(${r},${g},${b},0)`)

        // Tegn ellipse via scale-trick
        ctx.save()
        ctx.scale(1, ry / rx)
        ctx.beginPath()
        ctx.arc(cx, cy * (rx / ry), rx, 0, Math.PI * 2)
        ctx.fillStyle = grad
        ctx.fill()
        ctx.restore()
      }

      animId = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [variant])

  return (
    <div className="aurora-bg">
      {/* Dot-grid overlay */}
      <div className="aurora-dot-grid" />
      {/* Aurora canvas */}
      <canvas ref={canvasRef} className="aurora-canvas" />
    </div>
  )
}
