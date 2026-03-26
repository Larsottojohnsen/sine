import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) return 'I dag'
  if (days === 1) return 'I går'
  if (days < 7) return `${days} dager siden`
  return date.toLocaleDateString('nb-NO', { day: 'numeric', month: 'short' })
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength) + '...'
}

export function generateTitle(firstMessage: string): string {
  return truncate(firstMessage, 50)
}
