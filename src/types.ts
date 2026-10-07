export type LoanType = 'education' | 'crop' | 'business' | 'personal'

export type PaymentMode = 'upi' | 'bank' | 'cash'

export type Lang = 'en' | 'ta' | 'hi'

export type ExpenseStatus = 'verified' | 'flagged' | 'missing_proof'

export interface CategoryBudget {
  id: string
  name: string
  planned: number
}

export interface Loan {
  borrowerName: string
  bankName: string
  loanType: LoanType
  sanctionedAmount: number
  interestRate: number
  tenureMonths: number
  emi: number
  sanctionDate: string
  categories: CategoryBudget[]
}

export interface Disbursement {
  id: string
  amount: number
  date: string
  tranche: number
}

export interface GeoPoint {
  lat: number
  lng: number
}

export interface Expense {
  id: string
  amount: number
  categoryId: string
  date: string
  vendor: string
  paymentMode: PaymentMode
  reference: string
  note: string
  receiptDataUrl?: string
  location?: GeoPoint
  createdAt: string
  flagged: boolean
  flagKeyword?: string
}

export interface AppData {
  loan: Loan | null
  disbursements: Disbursement[]
  expenses: Expense[]
  language: Lang
}
