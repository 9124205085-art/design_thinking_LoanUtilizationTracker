import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useApp } from '../context/AppContext.tsx'
import { formatDate, formatDateTime } from '../lib/dates.ts'
import { formatINR } from '../lib/money.ts'
import { findPurposeIssue } from '../lib/purpose.ts'
import { categoryName, expenseStatus } from '../lib/stats.ts'
import type { PaymentMode } from '../types.ts'
import { Button, Card, Modal, StatusPill, TopBar } from '../components/ui.tsx'

export function ExpenseDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { loan, expenses, t, language, deleteExpense } = useApp()
  const [askDelete, setAskDelete] = useState(false)
  if (!loan) return null
  const expense = expenses.find((item) => item.id === id)
  if (!expense) {
    return (
      <div>
        <TopBar title={t('billDetails')} to="/expenses" />
        <p className="text-[17px]">{t('billMissing')}</p>
        <Link to="/expenses" className="mt-4 inline-flex min-h-12 items-center font-semibold text-brand">
          {t('bills')}
        </Link>
      </div>
    )
  }

  const status = expenseStatus(expense)
  const keyword = expense.flagKeyword ?? findPurposeIssue(loan.loanType, `${expense.vendor} ${expense.note}`)
  const mode: Record<PaymentMode, 'upi' | 'bankTransfer' | 'cash'> = {
    upi: 'upi',
    bank: 'bankTransfer',
    cash: 'cash',
  }

  return (
    <div className="space-y-4">
      <TopBar title={t('billDetails')} to="/expenses" />
      <Card>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[16px] text-muted">{t('paidTo')}</p>
            <h2 className="text-[1.45rem] leading-tight font-semibold">{expense.vendor}</h2>
          </div>
          <p className="text-[1.35rem] font-semibold">{formatINR(expense.amount)}</p>
        </div>
        <div className="mt-3">
          <StatusPill status={status} />
        </div>
        <p className="mt-3 text-[16px] leading-snug text-muted">
          {status === 'verified' ? t('verifiedHint') : status === 'flagged' ? t('flaggedHint') : t('missingHint')}
        </p>
        {status === 'flagged' && keyword ? <p className="mt-2 text-[16px] leading-snug">{t('flagReasonText', { word: keyword })}</p> : null}
      </Card>
      <Card>
        <Detail label={t('category')} value={categoryName(loan, expense.categoryId, t('removedCategory'))} />
        <Detail label={t('paidOn')} value={formatDate(expense.date, language)} />
        <Detail label={t('paymentMode')} value={t(mode[expense.paymentMode])} />
        <Detail label={t('reference')} value={expense.reference || '—'} />
        <Detail label={t('note')} value={expense.note || '—'} />
        <p className="pt-3 text-[16px] leading-snug text-muted">{t('recordedOn', { when: formatDateTime(expense.createdAt, language) })}</p>
        {expense.location ? (
          <div className="border-t border-line py-3">
            <p className="text-[16px] text-muted">{t('locationLabel')}</p>
            <p className="font-semibold">
              {expense.location.lat.toFixed(4)}, {expense.location.lng.toFixed(4)}
            </p>
            <a
              className="mt-1 inline-flex min-h-11 items-center font-semibold text-brand"
              href={`https://www.google.com/maps?q=${expense.location.lat},${expense.location.lng}`}
              target="_blank"
              rel="noreferrer"
            >
              {t('openMap')}
            </a>
          </div>
        ) : null}
      </Card>
      <Card>
        <h2 className="text-[1.1rem] font-semibold">{t('receipt')}</h2>
        {expense.receiptDataUrl ? (
          <img src={expense.receiptDataUrl} alt={t('receipt')} className="mt-3 max-h-[28rem] w-full rounded-2xl object-contain bg-sea" />
        ) : (
          <p className="mt-2 text-[16px] text-warn">{t('noPhotoYet')}</p>
        )}
      </Card>
      <div className="grid grid-cols-2 gap-2">
        <Link to={`/expenses/${expense.id}/edit`} className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-white text-[17px] font-semibold ring-1 ring-line">
          {t('edit')}
        </Link>
        <Button variant="danger" onClick={() => setAskDelete(true)}>
          {t('delete')}
        </Button>
      </div>
      {askDelete ? (
        <Modal title={t('deleteBill')} onClose={() => setAskDelete(false)}>
          <p className="text-[17px] leading-snug">{t('deleteBillBody')}</p>
          <div className="mt-4 space-y-2">
            <Button
              variant="danger"
              onClick={() => {
                deleteExpense(expense.id)
                navigate('/expenses')
              }}
            >
              {t('confirmDelete')}
            </Button>
            <Button variant="secondary" onClick={() => setAskDelete(false)}>
              {t('cancel')}
            </Button>
          </div>
        </Modal>
      ) : null}
    </div>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-line py-3 last:border-b-0">
      <p className="text-[16px] text-muted">{label}</p>
      <p className="text-[17px] font-semibold">{value}</p>
    </div>
  )
}
