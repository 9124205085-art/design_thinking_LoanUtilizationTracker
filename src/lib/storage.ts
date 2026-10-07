import type { AppData, CategoryBudget, Disbursement, Expense, Lang, Loan, LoanType, PaymentMode } from '../types.ts'

const KEY = 'loantrack.v1'

export const EMPTY_DATA: AppData = {
  loan: null,
  disbursements: [],
  expenses: [],
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

function isLoan(value: unknown): value is Loan {
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

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return EMPTY_DATA
    const parsed = JSON.parse(raw) as { version?: number; data?: Partial<AppData> }
    const data = parsed.data
    if (!data) return EMPTY_DATA
    return {
      language: isLang(data.language) ? data.language : 'en',
      loan: isLoan(data.loan) ? data.loan : null,
      disbursements: Array.isArray(data.disbursements) ? data.disbursements.filter(isDisbursement) : [],
      expenses: Array.isArray(data.expenses) ? data.expenses.filter(isExpense) : [],
    }
  } catch {
    return EMPTY_DATA
  }
}

export function saveData(data: AppData): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify({ version: 1, data }))
    return true
  } catch {
    return false
  }
}
