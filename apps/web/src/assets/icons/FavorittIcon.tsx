interface FavorittIconProps {
  size?: number
  color?: string
}

/**
 * Stiplet sirkel (VenterIcon) med en liten stjerne i midten.
 * Brukes for favorittmarkerte samtaler i sidebaren.
 */
export function FavorittIcon({ size = 12, color = 'currentColor' }: FavorittIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Stiplet sirkel */}
      <circle
        cx="8" cy="8" r="4.5"
        stroke={color}
        strokeWidth="1"
        strokeDasharray="1 1.5"
        strokeLinecap="round"
        fill="none"
      />
      {/* Liten stjerne i midten */}
      <path
        d="M8 5.5 L8.65 7.15 L10.4 7.22 L9.05 8.3 L9.5 10.0 L8 9.05 L6.5 10.0 L6.95 8.3 L5.6 7.22 L7.35 7.15 Z"
        fill={color}
      />
    </svg>
  )
}
