import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext.tsx'
import { suggestCategories } from '../lib/categories.ts'
import { uid } from '../lib/id.ts'
import { estimateEmi, formatINR, toNumber } from '../lib/money.ts'
import type { CategoryBudget, Loan, LoanType } from '../types.ts'
import type { StringKey } from '../lib/i18n.ts'
import { Button, Card, Choice, Field, inputClass, Modal, PhoneShell } from '../components/ui.tsx'

interface Draft {
  nickname: string
  borrowerName: string
  bankName: string
  loanType: LoanType
  sanctionedAmount: string
  interestRate: string
  tenureMonths: string
  emi: string
  sanctionDate: string
  categories: CategoryBudget[]
}

const TYPES: { id: LoanType; label: StringKey }[] = [
  { id: 'education', label: 'typeEducation' },
  { id: 'crop', label: 'typeCrop' },
  { id: 'business', label: 'typeBusiness' },
  { id: 'personal', label: 'typePersonal' },
]

function fromLoan(loan: Loan | null): Draft {
  if (!loan) {
    return {
      nickname: '',
      borrowerName: '',
      bankName: 'SBI',
      loanType: 'education',
      sanctionedAmount: '',
      interestRate: '',
      tenureMonths: '',
      emi: '',
      sanctionDate: '',
      categories: [],
    }
  }
  return {
    nickname: loan.nickname,
    borrowerName: loan.borrowerName,
    bankName: loan.bankName,
    loanType: loan.loanType,
    sanctionedAmount: String(loan.sanctionedAmount),
    interestRate: String(loan.interestRate),
    tenureMonths: String(loan.tenureMonths),
    emi: String(loan.emi),
    sanctionDate: loan.sanctionDate,
    categories: loan.categories.map((category) => ({ ...category })),
  }
}

export function SetupPage() {
  const { loan, loans, expenses, t, saveLoan, loadDemo } = useApp()
  const navigate = useNavigate()
  const creating = useLocation().pathname.endsWith('/new')
  const source = creating ? null : loan
  const editing = Boolean(source)
  const [editingId] = useState(() => (creating ? '' : (loan?.id ?? '')))
  const [step, setStep] = useState<1 | 2>(1)
  const [draft, setDraft] = useState<Draft>(() => {
    const next = fromLoan(creating ? null : loan)
    if (creating && loan) next.borrowerName = loan.borrowerName
    return next
  })
  const [keepCategories, setKeepCategories] = useState(Boolean(source))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [categoryNote, setCategoryNote] = useState('')
  const [askDemo, setAskDemo] = useState(false)

  const sanctioned = Math.round(toNumber(draft.sanctionedAmount) ?? 0)
  const assigned = draft.categories.reduce((sum, category) => sum + Math.round(category.planned || 0), 0)
  const unallocated = sanctioned - assigned

  function update<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((current) => ({ ...current, [key]: value }))
  }

  function validateStep1(): Record<string, string> {
    const next: Record<string, string> = {}
    if (!draft.nickname.trim()) next.nickname = t('required')
    if (!draft.borrowerName.trim()) next.borrowerName = t('required')
    if (!draft.bankName.trim()) next.bankName = t('required')
    const amount = toNumber(draft.sanctionedAmount)
    if (amount === null || amount <= 0) next.sanctionedAmount = t('amountPositive')
    const rate = toNumber(draft.interestRate)
    if (rate === null || rate < 0 || rate > 36) next.interestRate = t('rateRange')
    const months = toNumber(draft.tenureMonths)
    if (months === null || months < 1 || months > 360 || !Number.isInteger(months)) next.tenureMonths = t('tenureRange')
    const emi = toNumber(draft.emi)
    if (emi === null || emi <= 0) next.emi = t('amountPositive')
    if (!draft.sanctionDate) next.sanctionDate = t('required')
    return next
  }

  function continueToPlan() {
    const next = validateStep1()
    setErrors(next)
    if (Object.keys(next).length > 0) return
    if (!keepCategories) {
      const amount = Math.round(toNumber(draft.sanctionedAmount) ?? 0)
      setDraft((current) => ({ ...current, categories: suggestCategories(current.loanType, amount) }))
    }
    setStep(2)
  }

  function estimate() {
    const amount = toNumber(draft.sanctionedAmount)
    const rate = toNumber(draft.interestRate)
    const months = toNumber(draft.tenureMonths)
    if (amount === null || rate === null || months === null || amount <= 0 || months <= 0) {
      setErrors(validateStep1())
      return
    }
    update('emi', String(estimateEmi(amount, rate, Math.round(months))))
  }

  function save() {
    const next: Record<string, string> = {}
    if (draft.categories.length === 0) next.categories = t('needCategory')
    if (draft.categories.some((category) => !category.name.trim())) next.categories = t('categoryRequired')
    if (unallocated < 0) next.categories = t('cannotSaveOver')
    setErrors(next)
    if (Object.keys(next).length > 0) return
    saveLoan({
      id: editingId || uid(),
      nickname: draft.nickname.trim(),
      borrowerName: draft.borrowerName.trim(),
      bankName: draft.bankName.trim(),
      loanType: draft.loanType,
      sanctionedAmount: sanctioned,
      interestRate: toNumber(draft.interestRate) ?? 0,
      tenureMonths: Math.round(toNumber(draft.tenureMonths) ?? 0),
      emi: Math.round(toNumber(draft.emi) ?? 0),
      sanctionDate: draft.sanctionDate,
      categories: draft.categories.map((category) => ({
        ...category,
        name: category.name.trim(),
        planned: Math.round(category.planned || 0),
      })),
    })
    navigate('/')
  }

  function startDemo() {
    if (loans.length > 0) {
      setAskDemo(true)
      return
    }
    loadDemo()
    navigate('/')
  }

  return (
    <PhoneShell>
      <p className="text-[16px] font-semibold tracking-wide text-brand">{t('appName')}</p>
      {loans.length > 0 ? (
        <Link to="/" className="mt-2 inline-flex min-h-11 items-center text-[16px] font-semibold text-brand">
          {t('back')}
        </Link>
      ) : null}
      <h1 className="mt-1 text-[1.8rem] leading-tight font-semibold">{creating ? t('addLoanTitle') : editing ? t('editLoanTitle') : t('welcomeTitle')}</h1>
      <p className="mt-2 text-[17px] leading-snug text-muted">{creating ? t('addLoanBody') : editing ? t('editLoanBody') : t('welcomeBody')}</p>

      <div className="mt-4 grid grid-cols-2 gap-2" aria-hidden="true">
        <p className={`rounded-full px-3 py-2 text-center text-[16px] font-semibold ${step === 1 ? 'bg-brand text-white' : 'bg-white text-muted'}`}>{t('stepLoan')}</p>
        <p className={`rounded-full px-3 py-2 text-center text-[16px] font-semibold ${step === 2 ? 'bg-brand text-white' : 'bg-white text-muted'}`}>{t('stepBudget')}</p>
      </div>

      {step === 1 ? (
        <form
          className="mt-4 space-y-4"
          onSubmit={(event) => {
            event.preventDefault()
            continueToPlan()
          }}
        >
          <Field label={t('loanNickname')} hint={t('loanNicknameHint')} error={errors.nickname}>
            <input className={inputClass} value={draft.nickname} onChange={(event) => update('nickname', event.target.value)} />
          </Field>
          <Field label={t('yourName')} error={errors.borrowerName}>
            <input className={inputClass} value={draft.borrowerName} onChange={(event) => update('borrowerName', event.target.value)} autoComplete="name" />
          </Field>
          <Field label={t('bankName')} error={errors.bankName}>
            <input className={inputClass} value={draft.bankName} onChange={(event) => update('bankName', event.target.value)} />
          </Field>
          <fieldset>
            <legend className="mb-2 text-[16px] font-semibold">{t('loanType')}</legend>
            <div className="grid grid-cols-2 gap-2">
              {TYPES.map((type) => (
                <Choice
                  key={type.id}
                  selected={draft.loanType === type.id}
                  onClick={() => {
                    setKeepCategories(false)
                    update('loanType', type.id)
                  }}
                >
                  {t(type.label)}
                </Choice>
              ))}
            </div>
            {source && draft.loanType !== source.loanType && expenses.length > 0 ? <p className="mt-2 text-[16px] leading-snug text-warn">{t('changedTypeHint')}</p> : null}
          </fieldset>
          <Field label={t('sanctionedAmount')} error={errors.sanctionedAmount}>
            <input className={inputClass} inputMode="decimal" value={draft.sanctionedAmount} onChange={(event) => update('sanctionedAmount', event.target.value)} placeholder="500000" />
          </Field>
          <Field label={t('interestRate')} hint={t('perYear')} error={errors.interestRate}>
            <input className={inputClass} inputMode="decimal" value={draft.interestRate} onChange={(event) => update('interestRate', event.target.value)} placeholder="8.5" />
          </Field>
          <Field label={t('tenureMonths')} error={errors.tenureMonths}>
            <input className={inputClass} inputMode="numeric" value={draft.tenureMonths} onChange={(event) => update('tenureMonths', event.target.value)} placeholder="60" />
          </Field>
          <Field label={t('emi')} hint={t('emiEstimateHint')} error={errors.emi}>
            <input className={inputClass} inputMode="decimal" value={draft.emi} onChange={(event) => update('emi', event.target.value)} />
          </Field>
          <Button variant="secondary" onClick={estimate}>
            {t('estimateEmi')}
          </Button>
          <Field label={t('sanctionDate')} error={errors.sanctionDate}>
            <input className={inputClass} type="date" value={draft.sanctionDate} onChange={(event) => update('sanctionDate', event.target.value)} />
          </Field>
          <Button type="submit">{t('next')}</Button>
          <Button variant="secondary" onClick={startDemo}>
            {t('loadDemo')}
          </Button>
          <p className="text-[16px] leading-snug text-muted">{t('loadDemoHint')}</p>
        </form>
      ) : (
        <div className="mt-4 space-y-4">
          <Card>
            <p className="text-[16px] font-semibold text-muted">{unallocated < 0 ? t('overAllocated') : unallocated === 0 ? t('fullyAllocated') : t('unallocated')}</p>
            <p className={`mt-1 text-[1.8rem] font-semibold ${unallocated < 0 ? 'text-bad' : unallocated === 0 ? 'text-good' : 'text-warn'}`} aria-live="polite">
              {formatINR(Math.abs(unallocated))}
            </p>
            <p className="mt-1 text-[16px] leading-snug text-muted">{unallocated < 0 ? t('overHint') : t('unallocatedHint')}</p>
          </Card>
          <p className="text-[17px] leading-snug text-muted">{t('budgetHint')}</p>
          {draft.categories.map((category) => (
            <Card key={category.id}>
              <Field label={t('categoryName')}>
                <input
                  className={inputClass}
                  value={category.name}
                  onChange={(event) => {
                    setKeepCategories(true)
                    const name = event.target.value
                    setDraft((current) => ({
                      ...current,
                      categories: current.categories.map((item) => (item.id === category.id ? { ...item, name } : item)),
                    }))
                  }}
                />
              </Field>
              <div className="mt-3">
                <Field label={t('plannedAmount')}>
                  <input
                    className={inputClass}
                    inputMode="decimal"
                    value={String(category.planned)}
                    onChange={(event) => {
                      setKeepCategories(true)
                      const planned = Math.max(0, Math.round(toNumber(event.target.value) ?? 0))
                      setDraft((current) => ({
                        ...current,
                        categories: current.categories.map((item) => (item.id === category.id ? { ...item, planned } : item)),
                      }))
                    }}
                  />
                </Field>
              </div>
              <button
                type="button"
                className="mt-3 min-h-11 text-[16px] font-semibold text-bad"
                onClick={() => {
                  if (expenses.some((expense) => expense.categoryId === category.id)) {
                    setCategoryNote(t('categoryInUse'))
                    return
                  }
                  setKeepCategories(true)
                  setCategoryNote('')
                  setDraft((current) => ({ ...current, categories: current.categories.filter((item) => item.id !== category.id) }))
                }}
              >
                {t('remove')}
              </button>
            </Card>
          ))}
          {categoryNote ? <p className="text-[16px] text-warn">{categoryNote}</p> : null}
          {errors.categories ? (
            <p className="text-[16px] text-bad" role="alert">
              {errors.categories}
            </p>
          ) : null}
          <Button
            variant="secondary"
            onClick={() => {
              setKeepCategories(true)
              setDraft((current) => ({
                ...current,
                categories: [...current.categories, { id: uid(), name: '', planned: 0 }],
              }))
            }}
          >
            {t('addCategory')}
          </Button>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={() => setStep(1)}>
              {t('back')}
            </Button>
            <Button onClick={save} disabled={unallocated < 0}>
              {t('savePlan')}
            </Button>
          </div>
        </div>
      )}

      {askDemo ? (
        <Modal title={t('replaceDemoTitle')} onClose={() => setAskDemo(false)}>
          <p className="text-[17px] leading-snug">{t('replaceDemoBody')}</p>
          <div className="mt-4 space-y-2">
            <Button
              onClick={() => {
                loadDemo()
                navigate('/')
              }}
            >
              {t('loadDemo')}
            </Button>
            <Button variant="secondary" onClick={() => setAskDemo(false)}>
              {t('cancel')}
            </Button>
          </div>
        </Modal>
      ) : null}
    </PhoneShell>
  )
}
