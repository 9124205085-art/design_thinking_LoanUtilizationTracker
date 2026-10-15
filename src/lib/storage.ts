import type { AppData, CategoryBudget, Disbursement, Expense, Lang, Loan, LoanType, PaymentMode, TrackedLoan } from '../types.ts'
import { uid } from './id.ts'

const KEY = 'loantrack.v1'

export const EMPTY_DATA: AppData = {
  loans: [],
  activeLoanId: null,
  language: 'en',
}

function isLoanType(value: unknown): value is LoanType {
  return value === 'education' || value === 'crop' || value === 'business' || value === 'personal'
}

function isPaymentMode(value: unknown): value is PaymentMode {
  return value === 'upi' || value === 'bank' || value === 'cash'
}

function isLang(value: unknown): value is Lang {
  return value === 'en' || value === 'ta' || value === 'hi'
}

function isCategory(value: unknown): value is CategoryBudget {
  if (!value || typeof value !== 'object') return false
  const category = value as CategoryBudget
  return typeof category.id === 'string' && typeof category.name === 'string' && typeof category.planned === 'number'
}

function isLoanShape(value: unknown): value is Loan {
  if (!value || typeof value !== 'object') return false
  const loan = value as Loan
  return (
    typeof loan.borrowerName === 'string' &&
    typeof loan.bankName === 'string' &&
    isLoanType(loan.loanType) &&
    typeof loan.sanctionedAmount === 'number' &&
    typeof loan.interestRate === 'number' &&
    typeof loan.tenureMonths === 'number' &&
    typeof loan.emi === 'number' &&
    typeof loan.sanctionDate === 'string' &&
    Array.isArray(loan.categories) &&
    loan.categories.every(isCategory)
  )
}

function normalizeLoan(value: unknown): Loan | null {
  if (!isLoanShape(value)) return null
  const nickname = typeof value.nickname === 'string' ? value.nickname.trim() : ''
  return {
    ...value,
    id: typeof value.id === 'string' && value.id ? value.id : uid(),
    nickname: nickname || `${value.bankName} loan`,
  }
}

function isDisbursement(value: unknown): value is Disbursement {
  if (!value || typeof value !== 'object') return false
  const item = value as Disbursement
  return typeof item.id === 'string' && typeof item.amount === 'number' && typeof item.date === 'string' && typeof item.tranche === 'number'
}

function isExpense(value: unknown): value is Expense {
  if (!value || typeof value !== 'object') return false
  const expense = value as Expense
  return (
    typeof expense.id === 'string' &&
    typeof expense.amount === 'number' &&
    typeof expense.categoryId === 'string' &&
    typeof expense.date === 'string' &&
    typeof expense.vendor === 'string' &&
    isPaymentMode(expense.paymentMode) &&
    typeof expense.reference === 'string' &&
    typeof expense.note === 'string' &&
    typeof expense.createdAt === 'string' &&
    typeof expense.flagged === 'boolean'
  )
}

function asList<T>(value: unknown, keep: (item: unknown) => item is T): T[] {
  return Array.isArray(value) ? value.filter(keep) : []
}

function trackedFrom(loan: unknown, disbursements: unknown, expenses: unknown): TrackedLoan | null {
  const normalized = normalizeLoan(loan)
  if (!normalized) return null
  return {
    loan: normalized,
    disbursements: asList(disbursements, isDisbursement),
    expenses: asList(expenses, isExpense),
  }
}

interface StoredShape {
  language?: unknown
  loan?: unknown
  disbursements?: unknown
  expenses?: unknown
  loans?: unknown
  activeLoanId?: unknown
}

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return EMPTY_DATA
    const parsed = JSON.parse(raw) as { data?: StoredShape }
    const data = parsed.data
    if (!data) return EMPTY_DATA
    const language = isLang(data.language) ? data.language : 'en'

    if (Array.isArray(data.loans)) {
      const loans = data.loans
        .map((item) => {
          if (!item || typeof item !== 'object') return null
          const record = item as { loan?: unknown; disbursements?: unknown; expenses?: unknown }
          return trackedFrom(record.loan, record.disbursements, record.expenses)
        })
        .filter((item): item is TrackedLoan => item !== null)
      const requested = typeof data.activeLoanId === 'string' ? data.activeLoanId : null
      const activeLoanId = loans.some((item) => item.loan.id === requested) ? requested : (loans[0]?.loan.id ?? null)
      return { language, loans, activeLoanId }
    }

    const legacy = trackedFrom(data.loan, data.disbursements, data.expenses)
    if (!legacy) return { language, loans: [], activeLoanId: null }
    return { language, loans: [legacy], activeLoanId: legacy.loan.id }
  } catch {
    return EMPTY_DATA
  }
}

export function saveData(data: AppData): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify({ version: 2, data }))
    return true
  } catch {
    return false
  }
}
