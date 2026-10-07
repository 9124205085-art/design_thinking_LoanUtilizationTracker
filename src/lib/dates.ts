import type { Lang } from '../types.ts'

export function startOfToday(): Date {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  next.setDate(next.getDate() + days)
  return next
}

export function addMonths(date: Date, months: number): Date {
  const day = date.getDate()
  const next = new Date(date.getFullYear(), date.getMonth() + months, 1)
  const last = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate()
  next.setDate(Math.min(day, last))
  return next
}

export function toISODate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function parseISODate(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number)
  return new Date(year || 1970, (month || 1) - 1, day || 1)
}

export function daysFromToday(iso: string): number {
  const target = parseISODate(iso)
  return Math.round((target.getTime() - startOfToday().getTime()) / 86400000)
}

export function nextEmiDate(sanctionDate: string, tenureMonths: number, from = startOfToday()): string | null {
  const sanction = parseISODate(sanctionDate)
  const tenure = Math.max(0, Math.round(tenureMonths))
  for (let month = 1; month <= tenure; month += 1) {
    const due = addMonths(sanction, month)
    if (due.getTime() >= from.getTime()) return toISODate(due)
  }
  return null
}

export function formatDate(iso: string, lang: Lang): string {
  const locale = lang === 'ta' ? 'ta-IN' : lang === 'hi' ? 'hi-IN' : 'en-IN'
  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric' }).format(parseISODate(iso))
}

export function formatDateTime(iso: string, lang: Lang): string {
  const locale = lang === 'ta' ? 'ta-IN' : lang === 'hi' ? 'hi-IN' : 'en-IN'
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(iso))
}

export function dateAtNoon(isoDate: string): string {
  const date = parseISODate(isoDate)
  date.setHours(12, 0, 0, 0)
  return date.toISOString()
}
