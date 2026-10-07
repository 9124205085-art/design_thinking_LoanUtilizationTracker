import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { createContext, useContext } from 'react'
import type { AppData, Disbursement, Expense, Lang, Loan } from '../types.ts'
import { buildDemo } from '../lib/demo.ts'
import type { StringKey } from '../lib/i18n.ts'
import { translate } from '../lib/i18n.ts'
import { EMPTY_DATA, loadData, saveData } from '../lib/storage.ts'

interface AppContextValue {
  loan: Loan | null
  disbursements: Disbursement[]
  expenses: Expense[]
  language: Lang
  flash: string | null
  t: (key: StringKey, vars?: Record<string, string | number>) => string
  notify: (message: string) => void
  setLanguage: (language: Lang) => void
  saveLoan: (loan: Loan) => void
  addDisbursement: (item: Disbursement) => void
  deleteDisbursement: (id: string) => void
  saveExpense: (expense: Expense) => void
  deleteExpense: (id: string) => void
  loadDemo: () => void
  reset: () => void
}

const AppContext = createContext<AppContextValue | null>(null)

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

  const value = useMemo<AppContextValue>(() => {
    return {
      loan: data.loan,
      disbursements: data.disbursements,
      expenses: data.expenses,
      language: data.language,
      flash,
      t,
      notify,
      setLanguage: (language) => setData((current) => ({ ...current, language })),
      saveLoan: (loan) => setData((current) => ({ ...current, loan })),
      addDisbursement: (item) => setData((current) => ({ ...current, disbursements: [...current.disbursements, item] })),
      deleteDisbursement: (id) =>
        setData((current) => ({ ...current, disbursements: current.disbursements.filter((item) => item.id !== id) })),
      saveExpense: (expense) =>
        setData((current) => {
          const exists = current.expenses.some((item) => item.id === expense.id)
          return {
            ...current,
            expenses: exists ? current.expenses.map((item) => (item.id === expense.id ? expense : item)) : [...current.expenses, expense],
          }
        }),
      deleteExpense: (id) => setData((current) => ({ ...current, expenses: current.expenses.filter((item) => item.id !== id) })),
      loadDemo: () => {
        setData(buildDemo(data.language))
        notify(translate(data.language, 'demoLoaded'))
      },
      reset: () => setData({ ...EMPTY_DATA, language: data.language }),
    }
  }, [data, flash, notify, t])

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

// The provider and this hook live together so every screen can read the same saved loan.
// oxlint-disable-next-line react/only-export-components
export function useApp(): AppContextValue {
  const context = useContext(AppContext)
  if (!context) throw new Error('useApp must be used within AppProvider')
  return context
}
