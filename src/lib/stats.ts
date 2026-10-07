import type { Disbursement, Expense, ExpenseStatus, Loan } from '../types.ts'
import { daysFromToday, nextEmiDate } from './dates.ts'

export function expenseStatus(expense: Expense): ExpenseStatus {
  if (expense.flagged) return 'flagged'
  if (!expense.receiptDataUrl) return 'missing_proof'
  return 'verified'
}

export function totalSpent(expenses: Expense[]): number {
  return expenses.reduce((sum, expense) => sum + expense.amount, 0)
}

export function totalReceived(disbursements: Disbursement[]): number {
  return disbursements.reduce((sum, item) => sum + item.amount, 0)
}

export function spentByCategory(expenses: Expense[]): Map<string, number> {
  const totals = new Map<string, number>()
  for (const expense of expenses) {
    totals.set(expense.categoryId, (totals.get(expense.categoryId) ?? 0) + expense.amount)
  }
  return totals
}

export function recentExpenses(expenses: Expense[], limit?: number): Expense[] {
  const sorted = [...expenses].sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1
    return a.createdAt < b.createdAt ? 1 : -1
  })
  return typeof limit === 'number' ? sorted.slice(0, limit) : sorted
}

export function categoryName(loan: Loan, categoryId: string, fallback: string): string {
  return loan.categories.find((category) => category.id === categoryId)?.name ?? fallback
}

export interface ScoreParts {
  empty: boolean
  total: number
  purpose: number
  proof: number
  budget: number
  matchedPercent: number
}

function clampScore(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Math.min(100, value))
}

function adherence(planned: number, actual: number): number {
  if (actual <= planned) return 1
  if (planned <= 0) return 0
  return planned / actual
}

/**
 * Utilization score (0-100):
 * 50% purpose-matched spending, 30% bills with a photo, 20% staying inside the plan.
 */
export function utilizationScore(loan: Loan, expenses: Expense[]): ScoreParts {
  const spent = totalSpent(expenses)
  if (expenses.length === 0 || spent <= 0) {
    return { empty: true, total: 0, purpose: 0, proof: 0, budget: 0, matchedPercent: 0 }
  }

  const matched = expenses.filter((expense) => !expense.flagged).reduce((sum, expense) => sum + expense.amount, 0)
  const purpose = (matched / spent) * 100
  const withPhoto = expenses.filter((expense) => Boolean(expense.receiptDataUrl)).length
  const proof = (withPhoto / expenses.length) * 100

  const byCategory = spentByCategory(expenses)
  const known = new Set(loan.categories.map((category) => category.id))
  let weighted = 0
  let weight = 0
  for (const category of loan.categories) {
    const actual = byCategory.get(category.id) ?? 0
    const itemWeight = Math.max(category.planned, actual)
    weighted += adherence(category.planned, actual) * itemWeight
    weight += itemWeight
  }
  for (const [categoryId, actual] of byCategory) {
    if (!known.has(categoryId) && actual > 0) weight += actual
  }
  const budget = weight === 0 ? 100 : (weighted / weight) * 100
  const total = purpose * 0.5 + proof * 0.3 + budget * 0.2

  return {
    empty: false,
    total: clampScore(total),
    purpose: clampScore(purpose),
    proof: clampScore(proof),
    budget: clampScore(budget),
    matchedPercent: clampScore(purpose),
  }
}

export type AlertItem =
  | {
      id: string
      tone: 'bad' | 'warn'
      kind: 'overspend'
      categoryId: string
      categoryName: string
      planned: number
      actual: number
    }
  | { id: string; tone: 'warn'; kind: 'missing'; count: number }
  | { id: string; tone: 'warn'; kind: 'emi'; date: string; days: number; emi: number }
  | { id: string; tone: 'warn'; kind: 'unspent'; received: number; spent: number; left: number }

export function buildAlerts(loan: Loan, expenses: Expense[], disbursements: Disbursement[]): AlertItem[] {
  const alerts: AlertItem[] = []
  const byCategory = spentByCategory(expenses)

  for (const category of loan.categories) {
    const actual = byCategory.get(category.id) ?? 0
    const over = (category.planned > 0 && actual > category.planned) || (category.planned <= 0 && actual > 0)
    if (!over) continue
    const ratio = category.planned > 0 ? (actual - category.planned) / category.planned : 1
    alerts.push({
      id: `over-${category.id}`,
      tone: ratio >= 0.1 ? 'bad' : 'warn',
      kind: 'overspend',
      categoryId: category.id,
      categoryName: category.name,
      planned: category.planned,
      actual,
    })
  }

  const missing = expenses.filter((expense) => !expense.receiptDataUrl).length
  if (missing > 0) alerts.push({ id: 'missing', tone: 'warn', kind: 'missing', count: missing })

  const due = nextEmiDate(loan.sanctionDate, loan.tenureMonths)
  if (due) {
    const days = daysFromToday(due)
    if (days >= 0 && days <= 7) {
      alerts.push({ id: 'emi', tone: 'warn', kind: 'emi', date: due, days, emi: loan.emi })
    }
  }

  const received = totalReceived(disbursements)
  const spent = totalSpent(expenses)
  const left = received - spent
  const largeShare = loan.sanctionedAmount > 0 && left / loan.sanctionedAmount >= 0.15
  if (received > 0 && left > 0 && (left >= 50000 || largeShare)) {
    alerts.push({ id: 'unspent', tone: 'warn', kind: 'unspent', received, spent, left })
  }

  return alerts
}

export function roundScore(value: number): number {
  return Math.round(value)
}
