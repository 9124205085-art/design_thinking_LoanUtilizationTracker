import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext.tsx'
import { formatINR } from '../lib/money.ts'
import { Button, Card, PhoneShell } from '../components/ui.tsx'

const PEOPLE = [
  { id: 'divya', name: 'Divya S.', type: 'Education', bank: 'SBI', city: 'Chennai', amount: 500000, score: 92 },
  { id: 'arun', name: 'Arun K.', type: 'Crop', bank: 'Canara Bank', city: 'Thanjavur', amount: 200000, score: 74 },
  { id: 'fatima', name: 'Fatima N.', type: 'Business', bank: 'SBI', city: 'Coimbatore', amount: 800000, score: 41 },
  { id: 'karthik', name: 'Karthik P.', type: 'Education', bank: 'Indian Bank', city: 'Madurai', amount: 350000, score: 88 },
  { id: 'meera', name: 'Meera J.', type: 'Personal', bank: 'HDFC Bank', city: 'Bengaluru', amount: 150000, score: 63 },
]

function tone(score: number): 'good' | 'warn' | 'bad' {
  if (score >= 80) return 'good'
  if (score >= 60) return 'warn'
  return 'bad'
}

export function BankPage() {
  const { t } = useApp()
  const [asked, setAsked] = useState<Record<string, boolean>>({})

  return (
    <PhoneShell>
      <div className="rise space-y-4">
        <Link to="/" className="inline-flex min-h-11 items-center text-[16px] font-semibold text-brand">
          {t('backToApp')}
        </Link>
        <div className="rounded-3xl bg-warn-bg p-4 ring-1 ring-warn/30">
          <p className="text-[16px] font-semibold tracking-wide text-warn">{t('simulation')}</p>
          <h1 className="mt-1 text-[1.7rem] leading-tight font-semibold">{t('bankTitle')}</h1>
          <p className="mt-2 text-[16px] leading-snug">{t('simulationBody')}</p>
          <p className="mt-2 text-[16px] leading-snug">{t('bankRealNote')}</p>
        </div>
        <h2 className="text-[1.2rem] font-semibold">{t('borrowers')}</h2>
        <ul className="space-y-3">
          {PEOPLE.map((person) => {
            const status = tone(person.score)
            const chip = status === 'good' ? 'bg-good-bg text-good' : status === 'warn' ? 'bg-warn-bg text-warn' : 'bg-bad-bg text-bad'
            const label = status === 'good' ? t('statusGood') : status === 'warn' ? t('statusWatch') : t('statusRisk')
            return (
              <li key={person.id}>
                <Card>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[1.15rem] font-semibold">{person.name}</p>
                      <p className="text-[16px] text-muted">
                        {person.bank} · {person.type} · {person.city}
                      </p>
                      <p className="mt-1 text-[16px]">{formatINR(person.amount)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[1.6rem] leading-none font-semibold">{person.score}</p>
                      <p className="text-[16px] text-muted">{t('utilizationShort')}</p>
                    </div>
                  </div>
                  <p className={`mt-3 inline-flex min-h-8 items-center rounded-full px-3 text-[16px] font-semibold ${chip}`}>{label}</p>
                  {asked[person.id] ? (
                    <p className="mt-3 text-[16px] font-semibold text-brand">{t('requestSent')}</p>
                  ) : (
                    <Button className="mt-3" variant="secondary" onClick={() => setAsked((current) => ({ ...current, [person.id]: true }))}>
                      {t('requestProof')}
                    </Button>
                  )}
                </Card>
              </li>
            )
          })}
        </ul>
      </div>
    </PhoneShell>
  )
}
