import { useEffect, useRef } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Card, TopBar } from '../components/ui.tsx'
import { useApp } from '../context/AppContext.tsx'
import { daysFromToday, formatDate, parseISODate, startOfToday } from '../lib/dates.ts'
import type { StringKey } from '../lib/i18n.ts'
import { formatINR } from '../lib/money.ts'
import { buildSchedule, nextInstallment } from '../lib/repayment.ts'
import type { LoanType } from '../types.ts'

const TYPE_LABEL: Record<LoanType, StringKey> = {
  education: 'typeEducation',
  crop: 'typeCrop',
  business: 'typeBusiness',
  personal: 'typePersonal',
}

export function RepaymentsPage() {
  const { loans, t, language } = useApp()
  const plans = loans.map((item) => {
    const schedule = buildSchedule(item.loan)
    return { loan: item.loan, schedule, next: nextInstallment(schedule) }
  })
  const together = plans.reduce((sum, plan) => sum + (plan.next?.payment ?? 0), 0)

  return (
    <div className="space-y-4">
      <TopBar title={t('repaymentTitle')} to="/" />
      <p className="text-[17px] leading-snug text-muted">{t('repaymentHint')}</p>
      {together > 0 ? (
        <Card>
          <p className="text-[16px] text-muted">{t('repaymentNext')}</p>
          <p className="mt-1 text-[1.8rem] font-semibold">{formatINR(together)}</p>
          <p className="mt-2 text-[16px] leading-snug text-muted">{t('repaymentTogether', { amount: formatINR(together) })}</p>
        </Card>
      ) : null}
      <ul className="space-y-3">
        {plans.map((plan) => (
          <li key={plan.loan.id}>
            <Link to={`/repayments/${plan.loan.id}`} className="block rounded-3xl bg-white p-4 ring-1 ring-[#14343a]/5">
              <p className="text-[1.15rem] font-semibold">{plan.loan.nickname}</p>
              <p className="mt-1 text-[16px] text-muted">
                {plan.loan.bankName} · {t(TYPE_LABEL[plan.loan.loanType])} · {t('repaymentMonths', { n: plan.schedule.length })}
              </p>
              <p className="mt-2 text-[1.25rem] font-semibold">{formatINR(plan.loan.emi)}</p>
              <p className="text-[16px] text-muted">
                {plan.next
                  ? `${t('dueOn')} ${formatDate(plan.next.date, language)} · ${t('repaymentMonth', { n: plan.next.month })}`
                  : t('paymentsDone')}
              </p>
              <p className="mt-2 text-[16px] font-semibold text-brand">{t('seeMonths')}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function RepaymentDetailPage() {
  const { id } = useParams()
  const { loans, t, language } = useApp()
  const loan = loans.find((item) => item.loan.id === id)?.loan
  const dueRef = useRef<HTMLLIElement>(null)

  const schedule = loan ? buildSchedule(loan) : []
  const today = startOfToday().getTime()
  const next = nextInstallment(schedule)
  const done = schedule.filter((row) => parseISODate(row.date).getTime() < today).length
  const totalPay = schedule.reduce((sum, row) => sum + row.payment, 0)
  const totalInterest = schedule.reduce((sum, row) => sum + row.interest, 0)
  const shortfall = schedule.some((row) => row.principal < 0)

  useEffect(() => {
    dueRef.current?.scrollIntoView({ block: 'center' })
  }, [id])

  if (!loan) {
    return (
      <div className="space-y-4">
        <TopBar title={t('repaymentTitle')} to="/repayments" />
        <p className="text-[17px]">{t('repaymentMissing')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <TopBar title={loan.nickname} to="/repayments" subtitle={t('repaymentTitle')} />
      <Card>
        <p className="text-[16px] text-muted">{t('emi')}</p>
        <p className="mt-1 text-[1.8rem] font-semibold">{formatINR(loan.emi)}</p>
        <p className="mt-1 text-[16px] text-muted">
          {loan.bankName} · {t(TYPE_LABEL[loan.loanType])} · {t('repaymentMonths', { n: schedule.length })}
        </p>
        <p className="mt-3 text-[16px] leading-snug text-muted">{t('scheduleHint')}</p>
        <p className="mt-3 text-[17px] font-semibold">{t('repaymentTotal')}</p>
        <p className="text-[1.25rem] font-semibold">{formatINR(totalPay)}</p>
        <p className="mt-1 text-[16px] text-muted">
          {t('repaymentTotalInterest')} {formatINR(totalInterest)}
        </p>
        {schedule.length > 0 ? <p className="mt-2 text-[16px] text-muted">{t('repaymentProgress', { done, total: schedule.length })}</p> : null}
      </Card>
      {shortfall ? <p className="rounded-3xl bg-warn-bg px-4 py-3 text-[16px] leading-snug text-warn">{t('repaymentShortfall')}</p> : null}
      <ol className="space-y-2">
        {schedule.map((row) => {
          const isNext = next?.month === row.month
          const past = parseISODate(row.date).getTime() < today
          const when = daysFromToday(row.date)
          const status = isNext ? t('repaymentDue') : past ? t('repaymentAlready') : t('repaymentComing')
          const whenText = when === 0 ? t('dueToday') : when === 1 ? t('dueTomorrow') : when > 1 ? t('daysLeft', { n: when }) : null
          return (
            <li
              key={row.month}
              ref={isNext ? dueRef : undefined}
              className={`rounded-3xl p-4 ${isNext ? 'bg-sea ring-2 ring-brand' : 'bg-white ring-1 ring-[#14343a]/5'}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[17px] font-semibold">{t('repaymentMonth', { n: row.month })}</p>
                  <p className="text-[16px] text-muted">{formatDate(row.date, language)}</p>
                </div>
                <p className="text-[1.25rem] font-semibold">{formatINR(row.payment)}</p>
              </div>
              <p className={`mt-2 text-[16px] font-semibold ${isNext ? 'text-brand' : 'text-muted'}`}>
                {status}
                {whenText ? ` · ${whenText}` : ''}
              </p>
              {row.payment > 0 ? (
                <p className="mt-1 text-[16px] leading-snug text-muted">
                  {t('repaymentInterest')} {formatINR(row.interest)} · {t('repaymentPrincipal')} {formatINR(Math.max(0, row.principal))}
                </p>
              ) : (
                <p className="mt-1 text-[16px] text-muted">{t('repaymentNothing')}</p>
              )}
              <p className="text-[16px] text-muted">
                {t('repaymentBalance')} {formatINR(row.balance)}
              </p>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
