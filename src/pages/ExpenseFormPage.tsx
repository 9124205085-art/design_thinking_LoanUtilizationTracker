import { useState } from 'react'
import type { ChangeEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useApp } from '../context/AppContext.tsx'
import { toISODate } from '../lib/dates.ts'
import { uid } from '../lib/id.ts'
import { compressImage } from '../lib/images.ts'
import { formatINR, toNumber } from '../lib/money.ts'
import { findPurposeIssue } from '../lib/purpose.ts'
import type { Expense, GeoPoint, PaymentMode } from '../types.ts'
import type { StringKey } from '../lib/i18n.ts'
import { Button, Choice, Field, inputClass, Modal, TopBar } from '../components/ui.tsx'

const MODES: { id: PaymentMode; label: StringKey }[] = [
  { id: 'upi', label: 'upi' },
  { id: 'bank', label: 'bankTransfer' },
  { id: 'cash', label: 'cash' },
]

interface Warning {
  keyword: string | null
  quoted: string
  categoryName: string
  planned: number
  actual: number
  over: number
}

export function ExpenseFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { loan, expenses, t, saveExpense, notify } = useApp()
  const existing = expenses.find((expense) => expense.id === id)
  const validCategory = existing && loan?.categories.some((category) => category.id === existing.categoryId) ? existing.categoryId : (loan?.categories[0]?.id ?? '')

  const [amount, setAmount] = useState(existing ? String(existing.amount) : '')
  const [categoryId, setCategoryId] = useState(validCategory)
  const [date, setDate] = useState(() => existing?.date ?? toISODate(new Date()))
  const [vendor, setVendor] = useState(existing?.vendor ?? '')
  const [mode, setMode] = useState<PaymentMode>(existing?.paymentMode ?? 'upi')
  const [reference, setReference] = useState(existing?.reference ?? '')
  const [note, setNote] = useState(existing?.note ?? '')
  const [receipt, setReceipt] = useState(existing?.receiptDataUrl)
  const [location, setLocation] = useState<GeoPoint | undefined>(existing?.location)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [reading, setReading] = useState(false)
  const [locating, setLocating] = useState(false)
  const [pending, setPending] = useState<Expense | null>(null)
  const [warning, setWarning] = useState<Warning | null>(null)

  if (!loan) return null
  if (id && !existing) {
    return (
      <div>
        <TopBar title={t('editExpenseTitle')} to="/expenses" subtitle={loan.nickname} />
        <p>{t('billMissing')}</p>
      </div>
    )
  }

  function buildExpense(flagged: boolean, keyword: string | null): Expense | null {
    const value = toNumber(amount)
    const nextErrors: Record<string, string> = {}
    if (value === null || value <= 0) nextErrors.amount = t('amountPositive')
    if (!categoryId) nextErrors.category = t('required')
    if (!date) nextErrors.date = t('required')
    if (!vendor.trim()) nextErrors.vendor = t('required')
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0 || value === null) return null
    return {
      id: existing?.id ?? uid(),
      amount: Math.round(value),
      categoryId,
      date,
      vendor: vendor.trim(),
      paymentMode: mode,
      reference: reference.trim(),
      note: note.trim(),
      receiptDataUrl: receipt,
      location,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
      flagged,
      flagKeyword: keyword ?? undefined,
    }
  }

  function onSubmit() {
    const category = loan?.categories.find((item) => item.id === categoryId)
    const keyword = findPurposeIssue(loan?.loanType ?? 'education', `${vendor} ${note} ${category?.name ?? ''}`)
    const expense = buildExpense(Boolean(keyword), keyword)
    if (!expense || !loan) return
    const already = expenses
      .filter((item) => item.categoryId === categoryId && item.id !== expense.id)
      .reduce((sum, item) => sum + item.amount, 0)
    const actual = already + expense.amount
    const planned = category?.planned ?? 0
    if (keyword || (category && actual > planned)) {
      setPending(expense)
      setWarning({
        keyword,
        quoted: [expense.vendor, expense.note].filter(Boolean).join(' — '),
        categoryName: category?.name ?? t('category'),
        planned,
        actual,
        over: Math.max(0, actual - planned),
      })
      return
    }
    saveExpense({ ...expense, flagged: false, flagKeyword: undefined })
    navigate(`/expenses/${expense.id}`)
  }

  async function onPhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setReading(true)
    try {
      setReceipt(await compressImage(file))
    } catch {
      notify(t('photoFailed'))
    } finally {
      setReading(false)
    }
  }

  function grabLocation() {
    if (!navigator.geolocation) {
      notify(t('locationFailed'))
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({ lat: position.coords.latitude, lng: position.coords.longitude })
        setLocating(false)
        notify(t('locationSaved'))
      },
      () => {
        setLocating(false)
        notify(t('locationFailed'))
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 },
    )
  }

  return (
    <div className="space-y-4">
      <TopBar title={existing ? t('editExpenseTitle') : t('addExpenseTitle')} to={existing ? `/expenses/${existing.id}` : '/'} subtitle={loan.nickname} />
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault()
          onSubmit()
        }}
      >
        <Field label={t('amount')} error={errors.amount}>
          <input className={inputClass} inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} />
        </Field>
        <fieldset>
          <legend className="mb-2 text-[16px] font-semibold">{t('category')}</legend>
          <div className="flex flex-wrap gap-2">
            {loan.categories.map((category) => (
              <Choice key={category.id} selected={categoryId === category.id} onClick={() => setCategoryId(category.id)}>
                {category.name}
              </Choice>
            ))}
          </div>
          {errors.category ? <p className="mt-2 text-[16px] text-bad">{errors.category}</p> : null}
        </fieldset>
        <Field label={t('date')} error={errors.date}>
          <input className={inputClass} type="date" value={date} onChange={(event) => setDate(event.target.value)} />
        </Field>
        <Field label={t('vendor')} error={errors.vendor}>
          <input className={inputClass} value={vendor} onChange={(event) => setVendor(event.target.value)} />
        </Field>
        <fieldset>
          <legend className="mb-2 text-[16px] font-semibold">{t('paymentMode')}</legend>
          <div className="grid grid-cols-1 gap-2">
            {MODES.map((item) => (
              <Choice key={item.id} selected={mode === item.id} onClick={() => setMode(item.id)}>
                {t(item.label)}
              </Choice>
            ))}
          </div>
        </fieldset>
        <Field label={t('reference')} hint={t('referenceHint')}>
          <input className={inputClass} value={reference} onChange={(event) => setReference(event.target.value)} />
        </Field>
        <Field label={t('note')} hint={t('noteHint')}>
          <textarea className={`${inputClass} h-24 py-3`} value={note} onChange={(event) => setNote(event.target.value)} />
        </Field>
        <fieldset>
          <legend className="text-[16px] font-semibold">{t('receipt')}</legend>
          <p className="mt-1 text-[16px] leading-snug text-muted">{t('receiptHint')}</p>
          {receipt ? <img src={receipt} alt={t('receipt')} className="mt-3 max-h-72 w-full rounded-2xl object-contain bg-white" /> : null}
          <label className="mt-3 flex min-h-12 cursor-pointer items-center justify-center rounded-2xl bg-white px-4 text-center text-[17px] font-semibold ring-1 ring-line">
            <input className="sr-only" type="file" accept="image/*" capture="environment" onChange={onPhoto} />
            {reading ? t('readingPhoto') : receipt ? t('retake') : t('takePhoto')}
          </label>
          {receipt ? (
            <button type="button" className="mt-2 min-h-11 text-[16px] font-semibold text-bad" onClick={() => setReceipt(undefined)}>
              {t('removePhoto')}
            </button>
          ) : (
            <p className="mt-2 text-[16px] text-muted">{t('noPhotoYet')}</p>
          )}
        </fieldset>
        <fieldset>
          <legend className="text-[16px] font-semibold">{t('locationLabel')}</legend>
          <p className="mt-1 text-[16px] leading-snug text-muted">{t('locationHint')}</p>
          {location ? (
            <p className="mt-2 font-semibold">
              {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
            </p>
          ) : null}
          <Button className="mt-3" variant="secondary" onClick={grabLocation} disabled={locating}>
            {t('captureLocation')}
          </Button>
        </fieldset>
        <Button type="submit" disabled={reading}>
          {t('saveBill')}
        </Button>
      </form>

      {pending && warning ? (
        <Modal title={warning.keyword ? t('purposeTitle') : t('budgetTitleWarn')} onClose={() => setPending(null)}>
          {warning.keyword ? (
            <>
              <p className="text-[17px] leading-snug">{t('purposeBody', { text: warning.quoted, loan: t(loan.loanType) })}</p>
              <p className="mt-2 text-[16px] leading-snug text-bad">{t('flaggedNote')}</p>
            </>
          ) : null}
          {warning.over > 0 ? (
            <p className="mt-3 text-[17px] leading-snug">
              {t('budgetBody', {
                category: warning.categoryName,
                planned: formatINR(warning.planned),
                actual: formatINR(warning.actual),
                over: formatINR(warning.over),
              })}
            </p>
          ) : null}
          <div className="mt-4 space-y-2">
            <Button
              onClick={() => {
                saveExpense(pending)
                navigate(`/expenses/${pending.id}`)
              }}
            >
              {t('saveAnyway')}
            </Button>
            <Button variant="secondary" onClick={() => setPending(null)}>
              {t('goBackEdit')}
            </Button>
          </div>
        </Modal>
      ) : null}
    </div>
  )
}
