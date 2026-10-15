import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext.tsx'
import { formatDate } from '../lib/dates.ts'
import { formatINR } from '../lib/money.ts'
import { buildAlerts } from '../lib/stats.ts'
import type { AlertItem } from '../lib/stats.ts'
import { EmptyState, TopBar } from '../components/ui.tsx'

export function AlertsPage() {
  const { loan, expenses, disbursements, t, language } = useApp()
  if (!loan) return null
  const alerts = buildAlerts(loan, expenses, disbursements)

  return (
    <div className="space-y-3">
      <TopBar title={t('alertsTitle')} subtitle={loan.nickname} />
      {alerts.length === 0 ? (
        <EmptyState title={t('alertsEmpty')} body={t('alertsEmptyHint')} />
      ) : (
        <ul className="space-y-3">
          {alerts.map((alert) => (
            <li key={alert.id}>
              <AlertCard alert={alert} language={language} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function AlertCard({ alert, language }: { alert: AlertItem; language: 'en' | 'ta' | 'hi' }) {
  const { t } = useApp()
  const tone = alert.tone === 'bad' ? 'border-bad bg-bad-bg' : 'border-warn bg-warn-bg'
  if (alert.kind === 'overspend') {
    return (
      <Link to={`/expenses?category=${alert.categoryId}`} className={`block rounded-3xl border p-4 ${tone}`}>
        <p className="text-[1.1rem] font-semibold">{t('overspendTitle', { category: alert.categoryName })}</p>
        <p className="mt-1 text-[16px] leading-snug">
          {t('overspendBody', {
            planned: formatINR(alert.planned),
            actual: formatINR(alert.actual),
            over: formatINR(alert.actual - alert.planned),
          })}
        </p>
        <p className="mt-2 text-[16px] font-semibold">{t('goToBills')}</p>
      </Link>
    )
  }
  if (alert.kind === 'missing') {
    return (
      <Link to="/expenses?status=missing_proof" className={`block rounded-3xl border p-4 ${tone}`}>
        <p className="text-[1.1rem] font-semibold">{alert.count === 1 ? t('missingTitle', { n: alert.count }) : t('missingTitlePlural', { n: alert.count })}</p>
        <p className="mt-1 text-[16px] leading-snug">{t('missingBody')}</p>
        <p className="mt-2 text-[16px] font-semibold">{t('goToBills')}</p>
      </Link>
    )
  }
  if (alert.kind === 'emi') {
    const when = alert.days === 0 ? t('dueToday') : alert.days === 1 ? t('dueTomorrow') : t('daysLeft', { n: alert.days })
    return (
      <Link to="/" className={`block rounded-3xl border p-4 ${tone}`}>
        <p className="text-[1.1rem] font-semibold">{t('emiTitle')}</p>
        <p className="mt-1 text-[16px] leading-snug">
          {t('emiBody', { emi: formatINR(alert.emi), date: formatDate(alert.date, language), when })}
        </p>
      </Link>
    )
  }
  return (
    <Link to="/disbursements" className={`block rounded-3xl border p-4 ${tone}`}>
      <p className="text-[1.1rem] font-semibold">{t('unspentTitle')}</p>
      <p className="mt-1 text-[16px] leading-snug">
        {t('unspentBody', { received: formatINR(alert.received), spent: formatINR(alert.spent), left: formatINR(alert.left) })}
      </p>
      <p className="mt-2 text-[16px] font-semibold">{t('viewMoney')}</p>
    </Link>
  )
}
