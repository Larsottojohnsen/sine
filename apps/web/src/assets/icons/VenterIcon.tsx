interface VenterIconProps {
  size?: number
  color?: string
}

export function VenterIcon({ size = 12, color = 'currentColor' }: VenterIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle
        cx="8" cy="8" r="4.5"
        stroke={color}
        strokeWidth="1"
        strokeDasharray="1 1.5"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  )
}
