import { Link } from 'react-router-dom'
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ScoreGauge } from '../components/ScoreGauge.tsx'
import { Card, StatusPill } from '../components/ui.tsx'
import { useApp } from '../context/AppContext.tsx'
import { daysFromToday, formatDate, nextEmiDate } from '../lib/dates.ts'
import { formatINR } from '../lib/money.ts'
import type { LoanType } from '../types.ts'
import type { StringKey } from '../lib/i18n.ts'
import { expenseStatus, recentExpenses, spentByCategory, totalReceived, totalSpent, utilizationScore } from '../lib/stats.ts'

const TYPE_LABEL: Record<LoanType, StringKey> = {
  education: 'typeEducation',
  crop: 'typeCrop',
  business: 'typeBusiness',
  personal: 'typePersonal',
}

export function HomePage() {
  const { loan, expenses, disbursements, t, language } = useApp()
  if (!loan) return null

  const spent = totalSpent(expenses)
  const balance = loan.sanctionedAmount - spent
  const used = loan.sanctionedAmount > 0 ? Math.round((spent / loan.sanctionedAmount) * 100) : 0
  const received = totalReceived(disbursements)
  const byCategory = spentByCategory(expenses)
  const score = utilizationScore(loan, expenses)
  const due = nextEmiDate(loan.sanctionDate, loan.tenureMonths)
  const days = due ? daysFromToday(due) : null
  const latest = recentExpenses(expenses, 4)
  const chart = loan.categories.map((category) => ({
    name: category.name.length > 12 ? `${category.name.slice(0, 11)}…` : category.name,
    fullName: category.name,
    planned: category.planned,
    spent: byCategory.get(category.id) ?? 0,
  }))
  const firstName = loan.borrowerName.trim().split(/\s+/)[0] || loan.borrowerName

  let dueText = t('paymentsDone')
  if (due && days !== null) {
    const when = days === 0 ? t('dueToday') : days === 1 ? t('dueTomorrow') : t('daysLeft', { n: days })
    dueText = `${t('dueOn')} ${formatDate(due, language)} · ${when}`
  }

  return (
    <div className="space-y-4">
      <header>
        <p className="text-[16px] font-semibold text-brand">{t('appName')}</p>
        <h1 className="text-[1.8rem] leading-tight font-semibold">{t('helloName', { name: firstName })}</h1>
        <p className="mt-1 text-[16px] text-muted">
          {loan.bankName} · {t(TYPE_LABEL[loan.loanType])} · {formatINR(loan.emi)} / {t('monthShort')}
        </p>
      </header>

      <Card>
        <Metric label={t('loanAmount')} value={formatINR(loan.sanctionedAmount)} />
        <Metric label={t('totalSpent')} value={formatINR(spent)} />
        <Metric label={balance >= 0 ? t('balanceLeft') : t('overLoanLabel')} value={formatINR(Math.abs(balance))} warn={balance < 0} />
        <div className="mt-3">
          <div className="h-2.5 overflow-hidden rounded-full bg-sea" aria-hidden="true">
            <div className="h-full rounded-full bg-brand" style={{ width: `${Math.max(0, Math.min(100, used))}%` }} />
          </div>
          <p className="mt-2 text-[16px] text-muted">{t('usedOfLoan', { n: used })}</p>
        </div>
      </Card>

      <ScoreGauge score={score} />

      <Card>
        <h2 className="text-[1.2rem] font-semibold">{t('plannedVsActual')}</h2>
        <div className="mt-3 flex gap-4 text-[16px]">
          <span className="inline-flex items-center gap-2">
            <span className="h-3 w-3 rounded-sm bg-[#b7d4d4]" aria-hidden="true" />
            {t('planned')}
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-3 w-3 rounded-sm bg-brand" aria-hidden="true" />
            {t('spent')}
          </span>
        </div>
        <div className="mt-2 w-full" style={{ height: Math.max(180, chart.length * 48) }} aria-hidden="true">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chart} layout="vertical" margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" width={88} tick={{ fill: '#3e585f', fontSize: 16 }} />
              <Tooltip formatter={(value) => formatINR(typeof value === 'number' ? value : Number(value ?? 0))} />
              <Bar dataKey="planned" name={t('planned')} fill="#b7d4d4" radius={[0, 8, 8, 0]} barSize={11} />
              <Bar dataKey="spent" name={t('spent')} fill="#0f766e" radius={[0, 8, 8, 0]} barSize={11} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <ul className="mt-2 space-y-3">
          {loan.categories.map((category) => {
            const actual = byCategory.get(category.id) ?? 0
            const over = actual > category.planned
            return (
              <li key={category.id} className="border-t border-line pt-3">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="font-semibold">{category.name}</p>
                  <p className={over ? 'font-semibold text-bad' : 'text-muted'}>
                    {formatINR(actual)} / {formatINR(category.planned)}
                  </p>
                </div>
                <p className={`text-[16px] ${over ? 'text-bad' : 'text-muted'}`}>
                  {over ? t('overBy', { amount: formatINR(actual - category.planned) }) : t('leftInPlan', { amount: formatINR(category.planned - actual) })}
                </p>
              </li>
            )
          })}
        </ul>
      </Card>

      <Card>
        <h2 className="text-[1.2rem] font-semibold">{t('nextPayment')}</h2>
        <p className="mt-1 text-[1.4rem] font-semibold">{formatINR(loan.emi)}</p>
        <p className="mt-1 text-[16px] text-muted">{dueText}</p>
      </Card>

      <Link to="/disbursements" className="block">
        <Card>
          <h2 className="text-[1.2rem] font-semibold">{t('moneyIn')}</h2>
          <p className="mt-1 text-[1.4rem] font-semibold">{formatINR(received)}</p>
          <p className="mt-1 text-[16px] text-brand">{disbursements.length === 0 ? t('addReceivedHint') : t('viewMoney')}</p>
        </Card>
      </Link>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-[1.2rem] font-semibold">{t('recentBills')}</h2>
          {expenses.length > 0 ? (
            <Link to="/expenses" className="text-[16px] font-semibold text-brand">
              {t('seeAll')}
            </Link>
          ) : null}
        </div>
        {latest.length === 0 ? (
          <Card>
            <p className="text-[1.1rem] font-semibold">{t('emptyBills')}</p>
            <p className="mt-1 text-[16px] leading-snug text-muted">{t('emptyBillsHint')}</p>
          </Card>
        ) : (
          <ul className="space-y-2">
            {latest.map((expense) => (
              <li key={expense.id}>
                <Link to={`/expenses/${expense.id}`} className="block rounded-3xl bg-white p-4 ring-1 ring-[#14343a]/5">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-semibold">{expense.vendor}</p>
                    <p className="font-semibold">{formatINR(expense.amount)}</p>
                  </div>
                  <p className="mt-1 text-[16px] text-muted">
                    {loan.categories.find((category) => category.id === expense.categoryId)?.name ?? t('removedCategory')} · {formatDate(expense.date, language)}
                  </p>
                  <div className="mt-2">
                    <StatusPill status={expenseStatus(expense)} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Link to="/report" className="block rounded-3xl bg-brand px-4 py-4 text-white">
        <p className="text-[1.15rem] font-semibold">{t('makeReport')}</p>
        <p className="mt-1 text-[16px] leading-snug text-white/90">{t('reportHint')}</p>
      </Link>
    </div>
  )
}

function Metric({ label, value, warn = false }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-line py-2 last:border-b-0">
      <p className="text-[16px] text-muted">{label}</p>
      <p className={`text-[1.25rem] font-semibold ${warn ? 'text-bad' : ''}`}>{value}</p>
    </div>
  )
}
