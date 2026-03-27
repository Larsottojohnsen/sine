import { useEffect, useRef } from 'react'

/**
 * AuroraBackground
 * Nordlys-animasjon over et dot-grid mønster.
 *
 * Stil: Mørk bakgrunn (#0d0d0f) med store, myke nordlys-buer
 * som dekker øverste halvdel av skjermen. Grønn dominerer
 * til venstre/midten, lilla/blå til høyre – akkurat som
 * referansebildet brukeren viste.
 */

interface AuroraBackgroundProps {
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

    // Nordlys-blobs – store, myke, konsentrert i øvre halvdel
    // Basert på referansebildet: grønn venstre/midten, lilla høyre
    const blobs = [
      // Stor grønn – dominerer øvre venstre og midten
      {
        x: 0.20, y: 0.08,
        rx: 0.65, ry: 0.38,
        color: '#00a854',
        alpha: variant === 'chat' ? 0.18 : 0.22,
        speed: 0.00010, phase: 0,
      },
      // Grønn-teal – midten
      {
        x: 0.45, y: 0.05,
        rx: 0.50, ry: 0.30,
        color: '#00c472',
        alpha: variant === 'chat' ? 0.12 : 0.15,
        speed: 0.00013, phase: 1.8,
      },
      // Lilla – høyre side
      {
        x: 0.82, y: 0.12,
        rx: 0.45, ry: 0.35,
        color: '#6d28d9',
        alpha: variant === 'chat' ? 0.14 : 0.18,
        speed: 0.00009, phase: 2.5,
      },
      // Blå-lilla – øvre høyre hjørne
      {
        x: 0.92, y: 0.05,
        rx: 0.35, ry: 0.25,
        color: '#4c1d95',
        alpha: variant === 'chat' ? 0.10 : 0.13,
        speed: 0.00012, phase: 3.8,
      },
      // Dyp grønn – venstre kant
      {
        x: 0.02, y: 0.15,
        rx: 0.38, ry: 0.28,
        color: '#065f46',
        alpha: variant === 'chat' ? 0.08 : 0.10,
        speed: 0.00015, phase: 0.6,
      },
      // Svak teal – midtre overgang
      {
        x: 0.60, y: 0.10,
        rx: 0.40, ry: 0.22,
        color: '#0d9488',
        alpha: variant === 'chat' ? 0.07 : 0.09,
        speed: 0.00011, phase: 1.2,
      },
    ]

    let t = 0

    const draw = () => {
      t++
      ctx.clearRect(0, 0, W, H)

      for (const blob of blobs) {
        // Svært sakte, organisk bevegelse
        const dx = Math.sin(t * blob.speed * 1000 + blob.phase) * 0.04
        const dy = Math.cos(t * blob.speed * 700 + blob.phase * 1.2) * 0.025
        const pulse = 1 + Math.sin(t * blob.speed * 400 + blob.phase * 0.8) * 0.08

        const cx = (blob.x + dx) * W
        const cy = (blob.y + dy) * H
        const rx = blob.rx * W * pulse
        const ry = blob.ry * H * pulse

        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(rx, ry))
        const hex = blob.color
        const r = parseInt(hex.slice(1, 3), 16)
        const g = parseInt(hex.slice(3, 5), 16)
        const b = parseInt(hex.slice(5, 7), 16)

        grad.addColorStop(0,    `rgba(${r},${g},${b},${blob.alpha * 2.2})`)
        grad.addColorStop(0.30, `rgba(${r},${g},${b},${blob.alpha * 1.2})`)
        grad.addColorStop(0.65, `rgba(${r},${g},${b},${blob.alpha * 0.4})`)
        grad.addColorStop(1,    `rgba(${r},${g},${b},0)`)

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
      <div className="aurora-dot-grid" />
      <canvas ref={canvasRef} className="aurora-canvas" />
    </div>
  )
}
