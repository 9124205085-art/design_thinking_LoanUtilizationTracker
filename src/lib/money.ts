export function formatINR(value: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Math.round(value))
}

export function formatPlain(value: number): string {
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Math.round(value))
}

export function toNumber(raw: string): number | null {
  const cleaned = raw.replace(/,/g, '').trim()
  if (!cleaned) return null
  const value = Number(cleaned)
  if (!Number.isFinite(value)) return null
  return value
}

export function estimateEmi(principal: number, annualPercent: number, months: number): number {
  if (principal <= 0 || months <= 0) return 0
  const monthlyRate = annualPercent / 12 / 100
  if (monthlyRate === 0) return Math.round(principal / months)
  const factor = (1 + monthlyRate) ** months
  return Math.round((principal * monthlyRate * factor) / (factor - 1))
}
