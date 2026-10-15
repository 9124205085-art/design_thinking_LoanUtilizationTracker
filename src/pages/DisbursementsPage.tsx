import { useState } from 'react'
import { useApp } from '../context/AppContext.tsx'
import { formatDate } from '../lib/dates.ts'
import { uid } from '../lib/id.ts'
import { formatINR, toNumber } from '../lib/money.ts'
import { totalReceived, totalSpent } from '../lib/stats.ts'
import { Button, Card, EmptyState, Field, inputClass, Modal, TopBar } from '../components/ui.tsx'

export function DisbursementsPage() {
  const { loan, disbursements, expenses, t, language, addDisbursement, deleteDisbursement } = useApp()
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState('')
  const [tranche, setTranche] = useState(String(disbursements.reduce((max, item) => Math.max(max, item.tranche), 0) + 1))
  const [error, setError] = useState('')
  const [removeId, setRemoveId] = useState<string | null>(null)
  if (!loan) return null

  const received = totalReceived(disbursements)
  const spent = totalSpent(expenses)
  const still = received - spent
  const notYet = loan.sanctionedAmount - received
  const ordered = [...disbursements].sort((a, b) => a.tranche - b.tranche)

  function save() {
    const value = toNumber(amount)
    const part = toNumber(tranche)
    if (value === null || value <= 0) {
      setError(t('amountPositive'))
      return
    }
    if (!date) {
      setError(t('required'))
      return
    }
    if (part === null || part <= 0) {
      setError(t('required'))
      return
    }
    addDisbursement({ id: uid(), amount: Math.round(value), date, tranche: Math.round(part) })
    setAmount('')
    setDate('')
    setTranche(String(Math.round(part) + 1))
    setError('')
  }

  return (
    <div className="space-y-4">
      <TopBar title={t('disbursements')} to="/" subtitle={loan.nickname} />
      <p className="text-[17px] leading-snug text-muted">{t('disbursementsHint')}</p>
      <Card>
        <Row label={t('received')} value={formatINR(received)} />
        <Row label={t('spentFromReceived')} value={formatINR(spent)} />
        <Row label={t('stillWithYou')} value={formatINR(Math.abs(still))} warn={still < 0} />
        {notYet > 0 ? <p className="pt-2 text-[16px] text-muted">{t('notReceivedYet')}: {formatINR(notYet)}</p> : null}
        {still < 0 ? <p className="pt-2 text-[16px] leading-snug text-warn">{t('spentMoreThanReceived')}</p> : null}
      </Card>

      <Card>
        <h2 className="text-[1.15rem] font-semibold">{t('addPart')}</h2>
        <div className="mt-3 space-y-3">
          <Field label={t('partAmount')} error={error}>
            <input className={inputClass} inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} />
          </Field>
          <Field label={t('partDate')}>
            <input className={inputClass} type="date" value={date} onChange={(event) => setDate(event.target.value)} />
          </Field>
          <Field label={t('partNumber')}>
            <input className={inputClass} inputMode="numeric" value={tranche} onChange={(event) => setTranche(event.target.value)} />
          </Field>
          <Button onClick={save}>{t('savePart')}</Button>
        </div>
      </Card>

      {ordered.length === 0 ? (
        <EmptyState title={t('noParts')} body={t('noPartsHint')} />
      ) : (
        <ul className="space-y-2">
          {ordered.map((item) => (
            <li key={item.id}>
              <Card>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{t('partLabel', { n: item.tranche })}</p>
                    <p className="text-[16px] text-muted">{formatDate(item.date, language)}</p>
                  </div>
                  <p className="text-[1.15rem] font-semibold">{formatINR(item.amount)}</p>
                </div>
                <button type="button" className="mt-3 min-h-11 text-[16px] font-semibold text-bad" onClick={() => setRemoveId(item.id)}>
                  {t('delete')}
                </button>
              </Card>
            </li>
          ))}
        </ul>
      )}

      {removeId ? (
        <Modal title={t('deletePart')} onClose={() => setRemoveId(null)}>
          <p className="text-[17px] leading-snug">{t('deletePartBody')}</p>
          <div className="mt-4 space-y-2">
            <Button
              variant="danger"
              onClick={() => {
                deleteDisbursement(removeId)
                setRemoveId(null)
              }}
            >
              {t('confirmDelete')}
            </Button>
            <Button variant="secondary" onClick={() => setRemoveId(null)}>
              {t('cancel')}
            </Button>
          </div>
        </Modal>
      ) : null}
    </div>
  )
}

function Row({ label, value, warn = false }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-line py-2 last:border-b-0">
      <p className="text-[16px] text-muted">{label}</p>
      <p className={`font-semibold ${warn ? 'text-bad' : ''}`}>{value}</p>
    </div>
  )
}
