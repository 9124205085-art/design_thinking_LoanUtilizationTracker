import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/Shell.tsx'
import { useApp } from './context/AppContext.tsx'
import { AlertsPage } from './pages/AlertsPage.tsx'
import { BankPage } from './pages/BankPage.tsx'
import { DisbursementsPage } from './pages/DisbursementsPage.tsx'
import { ExpenseDetailPage } from './pages/ExpenseDetailPage.tsx'
import { ExpenseFormPage } from './pages/ExpenseFormPage.tsx'
import { ExpensesPage } from './pages/ExpensesPage.tsx'
import { HomePage } from './pages/HomePage.tsx'
import { ReportPage } from './pages/ReportPage.tsx'
import { SettingsPage } from './pages/SettingsPage.tsx'
import { SetupPage } from './pages/SetupPage.tsx'

function RequireLoan() {
  const { loan } = useApp()
  if (!loan) return <Navigate to="/setup" replace />
  return <Outlet />
}

export default function App() {
  return (
    <Routes>
      <Route path="/bank" element={<BankPage />} />
      <Route path="/setup" element={<SetupPage />} />
      <Route element={<RequireLoan />}>
        <Route element={<AppShell />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/expenses" element={<ExpensesPage />} />
          <Route path="/expenses/new" element={<ExpenseFormPage />} />
          <Route path="/expenses/:id" element={<ExpenseDetailPage />} />
          <Route path="/expenses/:id/edit" element={<ExpenseFormPage />} />
          <Route path="/disbursements" element={<DisbursementsPage />} />
          <Route path="/alerts" element={<AlertsPage />} />
          <Route path="/report" element={<ReportPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
