import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { createContext, useContext } from 'react'
import type { AppData, Disbursement, Expense, Lang, Loan, TrackedLoan } from '../types.ts'
import { buildDemo } from '../lib/demo.ts'
import type { StringKey } from '../lib/i18n.ts'
import { translate } from '../lib/i18n.ts'
import { EMPTY_DATA, loadData, saveData } from '../lib/storage.ts'

interface AppContextValue {
  loans: TrackedLoan[]
  loan: Loan | null
  disbursements: Disbursement[]
  expenses: Expense[]
  language: Lang
  flash: string | null
  t: (key: StringKey, vars?: Record<string, string | number>) => string
  notify: (message: string) => void
  setLanguage: (language: Lang) => void
  selectLoan: (id: string) => void
  saveLoan: (loan: Loan) => void
  deleteLoan: (id: string) => void
  addDisbursement: (item: Disbursement) => void
  deleteDisbursement: (id: string) => void
  saveExpense: (expense: Expense) => void
  deleteExpense: (id: string) => void
  loadDemo: () => void
  reset: () => void
}

const AppContext = createContext<AppContextValue | null>(null)

function mapActive(data: AppData, update: (item: TrackedLoan) => TrackedLoan): AppData {
  return {
    ...data,
    loans: data.loans.map((item) => (item.loan.id === data.activeLoanId ? update(item) : item)),
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(() => loadData())
  const [flash, setFlash] = useState<string | null>(null)
  const timer = useRef<number | null>(null)

  const notify = useCallback((message: string) => {
    setFlash(message)
    if (timer.current) window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setFlash(null), 3800)
  }, [])

  useEffect(() => {
    const saved = saveData(data)
    if (!saved) {
      const message = translate(data.language, 'storageFull')
      window.setTimeout(() => notify(message), 0)
    }
  }, [data, notify])

  useEffect(() => {
    document.documentElement.lang = data.language === 'ta' ? 'ta' : data.language === 'hi' ? 'hi' : 'en'
  }, [data.language])

  useEffect(() => {
    return () => {
      if (timer.current) window.clearTimeout(timer.current)
    }
  }, [])

  const t = useCallback(
    (key: StringKey, vars?: Record<string, string | number>) => translate(data.language, key, vars),
    [data.language],
  )

  const active = data.loans.find((item) => item.loan.id === data.activeLoanId) ?? null

  const value = useMemo<AppContextValue>(() => {
    return {
      loans: data.loans,
      loan: active?.loan ?? null,
      disbursements: active?.disbursements ?? [],
      expenses: active?.expenses ?? [],
      language: data.language,
      flash,
      t,
      notify,
      setLanguage: (language) => setData((current) => ({ ...current, language })),
      selectLoan: (id) => setData((current) => ({ ...current, activeLoanId: id })),
      saveLoan: (loan) =>
        setData((current) => {
          const exists = current.loans.some((item) => item.loan.id === loan.id)
          if (exists) {
            return {
              ...current,
              activeLoanId: loan.id,
              loans: current.loans.map((item) => (item.loan.id === loan.id ? { ...item, loan } : item)),
            }
          }
          return {
            ...current,
            activeLoanId: loan.id,
            loans: [...current.loans, { loan, disbursements: [], expenses: [] }],
          }
        }),
      deleteLoan: (id) =>
        setData((current) => {
          const loans = current.loans.filter((item) => item.loan.id !== id)
          const activeLoanId = current.activeLoanId === id ? (loans[0]?.loan.id ?? null) : current.activeLoanId
          return { ...current, loans, activeLoanId }
        }),
      addDisbursement: (item) =>
        setData((current) => mapActive(current, (record) => ({ ...record, disbursements: [...record.disbursements, item] }))),
      deleteDisbursement: (id) =>
        setData((current) =>
          mapActive(current, (record) => ({ ...record, disbursements: record.disbursements.filter((item) => item.id !== id) })),
        ),
      saveExpense: (expense) =>
        setData((current) =>
          mapActive(current, (record) => {
            const exists = record.expenses.some((item) => item.id === expense.id)
            return {
              ...record,
              expenses: exists ? record.expenses.map((item) => (item.id === expense.id ? expense : item)) : [...record.expenses, expense],
            }
          }),
        ),
      deleteExpense: (id) =>
        setData((current) => mapActive(current, (record) => ({ ...record, expenses: record.expenses.filter((item) => item.id !== id) }))),
      loadDemo: () => {
        const sample = buildDemo()
        setData((current) => ({
          ...current,
          loans: [...current.loans, sample],
          activeLoanId: sample.loan.id,
        }))
        notify(translate(data.language, 'demoLoaded'))
      },
      reset: () => setData({ ...EMPTY_DATA, language: data.language }),
    }
  }, [active, data, flash, notify, t])

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

// The provider and this hook live together so every screen can read the same saved loan.
// oxlint-disable-next-line react/only-export-components
export function useApp(): AppContextValue {
  const context = useContext(AppContext)
  if (!context) throw new Error('useApp must be used within AppProvider')
  return context
}
