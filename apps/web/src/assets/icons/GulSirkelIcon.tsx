interface GulSirkelIconProps {
  size?: number
}

/**
 * Gul stiplet sirkel — vises i sidebaren når agenten venter på svar fra brukeren
 * (agentStatus === 'waiting_approval').
 * SVG: stroke #FFBF36, stroke-dasharray 2.44 1.62, stroke-width 1.5
 */
export function GulSirkelIcon({ size = 18 }: GulSirkelIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle
        cx="8" cy="8" r="6.5"
        stroke="#FFBF36"
        strokeDasharray="2.44 1.62"
        strokeWidth="1.5"
        fill="none"
      />
    </svg>
  )
}
