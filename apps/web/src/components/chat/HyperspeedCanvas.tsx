import { useEffect, useRef } from 'react'

interface HyperspeedCanvasProps {
  active: boolean
  onFadeComplete?: () => void
}

interface Star {
  x: number
  y: number
  z: number
  pz: number
  color: string
}

const COLORS = [
  '#1A93FE', '#60A5FA', '#818CF8', '#A78BFA',
  '#34D399', '#FFFFFF', '#93C5FD', '#C4B5FD',
]

export function HyperspeedCanvas({ active, onFadeComplete }: HyperspeedCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const starsRef = useRef<Star[]>([])
  const rafRef = useRef<number>(0)
  const opacityRef = useRef(0)
  const phaseRef = useRef<'fadein' | 'hold' | 'fadeout' | 'done'>('fadein')
  const holdTimerRef = useRef<number>(0)
  const activeRef = useRef(active)

  useEffect(() => {
    activeRef.current = active
    if (active) {
      opacityRef.current = 0
      phaseRef.current = 'fadein'
      holdTimerRef.current = 0
    }
  }, [active])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const NUM_STARS = 300

    const resize = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }
    resize()
    window.addEventListener('resize', resize)

    // Init stars
    const initStars = () => {
      starsRef.current = Array.from({ length: NUM_STARS }, () => ({
        x: (Math.random() - 0.5) * canvas.width * 2,
        y: (Math.random() - 0.5) * canvas.height * 2,
        z: Math.random() * canvas.width,
        pz: 0,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
      }))
    }
    initStars()

    const SPEED = 18
    const HOLD_DURATION = 2000 // ms to hold at full opacity

    let lastTime = performance.now()

    const draw = (now: number) => {
      const dt = Math.min(now - lastTime, 50)
      lastTime = now

      const w = canvas.width
      const h = canvas.height
      const cx = w / 2
      const cy = h / 2

      // Update opacity phase
      if (phaseRef.current === 'fadein') {
        opacityRef.current = Math.min(1, opacityRef.current + dt / 400)
        if (opacityRef.current >= 1) {
          phaseRef.current = 'hold'
          holdTimerRef.current = 0
        }
      } else if (phaseRef.current === 'hold') {
        holdTimerRef.current += dt
        if (holdTimerRef.current >= HOLD_DURATION) {
          phaseRef.current = 'fadeout'
        }
      } else if (phaseRef.current === 'fadeout') {
        opacityRef.current = Math.max(0, opacityRef.current - dt / 600)
        if (opacityRef.current <= 0) {
          phaseRef.current = 'done'
          onFadeComplete?.()
          rafRef.current = requestAnimationFrame(draw)
          return
        }
      } else {
        // done - keep animating but invisible
        rafRef.current = requestAnimationFrame(draw)
        return
      }

      ctx.clearRect(0, 0, w, h)

      // Background
      ctx.fillStyle = `rgba(10, 10, 10, ${opacityRef.current * 0.85})`
      ctx.fillRect(0, 0, w, h)

      ctx.save()
      ctx.globalAlpha = opacityRef.current

      for (const star of starsRef.current) {
        star.pz = star.z
        star.z -= SPEED * (dt / 16)

        if (star.z <= 0) {
          star.x = (Math.random() - 0.5) * w * 2
          star.y = (Math.random() - 0.5) * h * 2
          star.z = w
          star.pz = star.z
          star.color = COLORS[Math.floor(Math.random() * COLORS.length)]
        }

        const sx = (star.x / star.z) * w + cx
        const sy = (star.y / star.z) * h + cy
        const px = (star.x / star.pz) * w + cx
        const py = (star.y / star.pz) * h + cy

        // Skip if off-screen
        if (sx < -50 || sx > w + 50 || sy < -50 || sy > h + 50) continue

        const size = Math.max(0.3, (1 - star.z / w) * 2.5)
        const speed = Math.sqrt((sx - px) ** 2 + (sy - py) ** 2)
        const alpha = Math.min(1, (1 - star.z / w) * 1.5)

        // Draw streak
        const grad = ctx.createLinearGradient(px, py, sx, sy)
        grad.addColorStop(0, `${star.color}00`)
        grad.addColorStop(1, star.color + Math.round(alpha * 255).toString(16).padStart(2, '0'))

        ctx.beginPath()
        ctx.strokeStyle = grad
        ctx.lineWidth = size
        ctx.moveTo(px, py)
        ctx.lineTo(sx, sy)
        ctx.stroke()

        // Bright dot at tip
        if (speed > 2) {
          ctx.beginPath()
          ctx.fillStyle = star.color + Math.round(alpha * 200).toString(16).padStart(2, '0')
          ctx.arc(sx, sy, size * 0.8, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      ctx.restore()
      rafRef.current = requestAnimationFrame(draw)
    }

    rafRef.current = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', resize)
    }
  }, [onFadeComplete])

  if (!active && phaseRef.current === 'done') return null

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  )
}
