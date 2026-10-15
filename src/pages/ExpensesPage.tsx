import { Link, useSearchParams } from 'react-router-dom'
import { useApp } from '../context/AppContext.tsx'
import { formatDate } from '../lib/dates.ts'
import { formatINR } from '../lib/money.ts'
import { categoryName, expenseStatus, recentExpenses } from '../lib/stats.ts'
import type { ExpenseStatus } from '../types.ts'
import { EmptyState, StatusPill, TopBar } from '../components/ui.tsx'

const STATUSES: Array<ExpenseStatus | 'all'> = ['all', 'verified', 'flagged', 'missing_proof']

export function ExpensesPage() {
  const { loan, expenses, t, language } = useApp()
  const [params, setParams] = useSearchParams()
  if (!loan) return null

  const status = params.get('status') ?? 'all'
  const category = params.get('category') ?? 'all'
  const visible = recentExpenses(expenses).filter((expense) => {
    const matchesStatus = status === 'all' || expenseStatus(expense) === status
    const matchesCategory = category === 'all' || expense.categoryId === category
    return matchesStatus && matchesCategory
  })

  function setFilter(key: 'status' | 'category', value: string) {
    const next = new URLSearchParams(params)
    if (value === 'all') next.delete(key)
    else next.set(key, value)
    setParams(next, { replace: true })
  }

  function statusLabel(value: ExpenseStatus | 'all'): string {
    if (value === 'all') return t('all')
    if (value === 'verified') return t('verified')
    if (value === 'flagged') return t('flagged')
    return t('missingProof')
  }

  return (
    <div className="space-y-4">
      <TopBar title={t('billsTitle')} subtitle={loan.nickname} />
      <div>
        <p className="mb-2 text-[16px] font-semibold">{t('filterStatus')}</p>
        <div className="flex gap-2 overflow-x-auto pb-1" role="group" aria-label={t('filterStatus')}>
          {STATUSES.map((value) => (
            <FilterChip key={value} selected={status === value} onClick={() => setFilter('status', value)}>
              {statusLabel(value)}
            </FilterChip>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-2 text-[16px] font-semibold">{t('filterCategory')}</p>
        <div className="flex gap-2 overflow-x-auto pb-1" role="group" aria-label={t('filterCategory')}>
          <FilterChip selected={category === 'all'} onClick={() => setFilter('category', 'all')}>
            {t('all')}
          </FilterChip>
          {loan.categories.map((item) => (
            <FilterChip key={item.id} selected={category === item.id} onClick={() => setFilter('category', item.id)}>
              {item.name}
            </FilterChip>
          ))}
        </div>
      </div>

      {expenses.length === 0 ? (
        <EmptyState title={t('emptyBills')} body={t('emptyBillsHint')} />
      ) : visible.length === 0 ? (
        <EmptyState title={t('noMatch')} body={t('noMatchHint')} />
      ) : (
        <ul className="space-y-2">
          {visible.map((expense) => (
            <li key={expense.id}>
              <Link to={`/expenses/${expense.id}`} className="block rounded-3xl bg-white p-4 ring-1 ring-[#14343a]/5">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-semibold">{expense.vendor}</p>
                  <p className="shrink-0 font-semibold">{formatINR(expense.amount)}</p>
                </div>
                <p className="mt-1 text-[16px] text-muted">
                  {categoryName(loan, expense.categoryId, t('removedCategory'))} · {formatDate(expense.date, language)}
                </p>
                <div className="mt-2">
                  <StatusPill status={expenseStatus(expense)} />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function FilterChip({ selected, children, onClick }: { selected: boolean; children: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`min-h-11 shrink-0 rounded-full px-4 text-[16px] font-semibold ${selected ? 'bg-brand text-white' : 'bg-white text-ink ring-1 ring-line'}`}
    >
      {children}
    </button>
  )
}
