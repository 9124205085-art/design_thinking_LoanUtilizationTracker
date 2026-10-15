import { NavLink, useLocation } from 'react-router-dom'
import { BillActions } from './Assistant.tsx'
import { useApp } from '../context/AppContext.tsx'
import { buildAlerts } from '../lib/stats.ts'
import { IconAlert, IconBills, IconHome, IconRepay, IconSettings } from './Icons.tsx'
import { PhoneShell } from './ui.tsx'
import { Outlet } from 'react-router-dom'

export function AppShell() {
  const { t, loan, expenses, disbursements } = useApp()
  const { pathname } = useLocation()
  const showFab = pathname === '/' || pathname === '/expenses'
  const alertCount = loan ? buildAlerts(loan, expenses, disbursements).length : 0

  const fab = showFab ? <BillActions /> : null

  const tabClass = ({ isActive }: { isActive: boolean }) =>
    `relative flex min-h-16 min-w-0 flex-col items-center justify-center gap-0.5 text-center text-[16px] leading-none tracking-tighter ${isActive ? 'font-semibold text-brand' : 'text-muted'}`

  return (
    <PhoneShell
      fab={fab}
      footer={
        <nav className="grid shrink-0 grid-cols-[1fr_1fr_1fr_1fr_1.15fr] border-t border-line bg-white pb-[max(0.25rem,env(safe-area-inset-bottom))]" aria-label={t('appName')}>
          <NavLink to="/" end className={tabClass}>
            <IconHome />
            {t('home')}
          </NavLink>
          <NavLink to="/repayments" className={tabClass}>
            <IconRepay />
            {t('repayTab')}
          </NavLink>
          <NavLink to="/expenses" className={tabClass}>
            <IconBills />
            {t('bills')}
          </NavLink>
          <NavLink to="/alerts" className={tabClass}>
            <IconAlert />
            {t('alerts')}
            {alertCount > 0 ? (
              <span className="absolute top-1 right-2 grid h-6 min-w-6 place-items-center rounded-full bg-bad px-1 text-[16px] leading-none font-semibold text-white">
                {alertCount}
              </span>
            ) : null}
          </NavLink>
          <NavLink to="/settings" className={tabClass}>
            <IconSettings />
            {t('settings')}
          </NavLink>
        </nav>
      }
    >
      <div className="rise">
        <Outlet />
      </div>
    </PhoneShell>
  )
}
