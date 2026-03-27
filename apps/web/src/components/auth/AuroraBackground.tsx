import { useEffect, useRef } from 'react'

/**
 * AuroraBackground
 * Nordlys-animasjon over et dot-grid mønster.
 * – Dot-grid: CSS radial-gradient
 * – Aurora: Canvas 2D med overlappende Gaussian blobs i nordlys-farger
 *   som beveger seg sakte og pulserer som ekte nordlys.
 */
export function AuroraBackground() {
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

    // Nordlys-blobs – hver har posisjon, størrelse, farge og bevegelsesparametere
    const blobs = [
      // Grønn – hoved nordlys
      { x: 0.2, y: 0.25, rx: 0.55, ry: 0.28, color: '#00ff9f', alpha: 0.13, speed: 0.00018, phase: 0 },
      // Cyan-blå
      { x: 0.55, y: 0.18, rx: 0.45, ry: 0.22, color: '#00d4ff', alpha: 0.10, speed: 0.00022, phase: 1.2 },
      // Lilla
      { x: 0.75, y: 0.35, rx: 0.40, ry: 0.20, color: '#a855f7', alpha: 0.09, speed: 0.00015, phase: 2.4 },
      // Blå-grønn
      { x: 0.35, y: 0.40, rx: 0.50, ry: 0.18, color: '#06b6d4', alpha: 0.08, speed: 0.00020, phase: 0.7 },
      // Rosa-lilla
      { x: 0.65, y: 0.22, rx: 0.35, ry: 0.16, color: '#c084fc', alpha: 0.07, speed: 0.00025, phase: 3.1 },
      // Dyp grønn
      { x: 0.10, y: 0.45, rx: 0.38, ry: 0.15, color: '#10b981', alpha: 0.06, speed: 0.00017, phase: 1.8 },
    ]

    let t = 0

    const draw = () => {
      t++
      ctx.clearRect(0, 0, W, H)

      for (const blob of blobs) {
        // Sakte bølgebevegelse – nordlys-drift
        const dx = Math.sin(t * blob.speed * 1000 + blob.phase) * 0.08
        const dy = Math.cos(t * blob.speed * 800 + blob.phase * 1.3) * 0.05
        const pulse = 1 + Math.sin(t * blob.speed * 600 + blob.phase * 0.7) * 0.15

        const cx = (blob.x + dx) * W
        const cy = (blob.y + dy) * H
        const rx = blob.rx * W * pulse
        const ry = blob.ry * H * pulse

        // Radial gradient for myk aurora-glød
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(rx, ry))
        const hex = blob.color

        // Konverter hex til rgba
        const r = parseInt(hex.slice(1, 3), 16)
        const g = parseInt(hex.slice(3, 5), 16)
        const b = parseInt(hex.slice(5, 7), 16)

        grad.addColorStop(0, `rgba(${r},${g},${b},${blob.alpha * 1.8})`)
        grad.addColorStop(0.4, `rgba(${r},${g},${b},${blob.alpha})`)
        grad.addColorStop(1, `rgba(${r},${g},${b},0)`)

        // Tegn ellipse
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
  }, [])

  return (
    <div className="aurora-bg">
      {/* Dot-grid overlay */}
      <div className="aurora-dot-grid" />
      {/* Aurora canvas */}
      <canvas ref={canvasRef} className="aurora-canvas" />
    </div>
  )
}
