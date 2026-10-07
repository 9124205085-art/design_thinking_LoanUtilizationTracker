import { useState } from 'react'
import { useApp } from '../context/AppContext.tsx'
import type { ScoreParts } from '../lib/stats.ts'
import { roundScore } from '../lib/stats.ts'
import { Modal } from './ui.tsx'

function sentenceFor(score: ScoreParts, t: ReturnType<typeof useApp>['t']): string {
  if (score.empty) return t('scoreEmpty')
  const matched = roundScore(score.matchedPercent)
  if (matched >= 85) return t('scoreGreat', { n: matched })
  if (matched >= 60) return t('scoreOk')
  return t('scoreLow')
}

function gaugeColor(score: ScoreParts): string {
  if (score.empty) return '#8aa3a8'
  const total = roundScore(score.total)
  if (total >= 80) return '#166534'
  if (total >= 60) return '#b45309'
  return '#991b1b'
}

function ScoreBar({ label, hint, value, weight }: { label: string; hint: string; value: number; weight: string }) {
  const width = Math.max(0, Math.min(100, value))
  return (
    <div className="mt-4">
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-semibold">{label}</p>
        <p className="font-semibold">
          {roundScore(value)} <span className="font-normal text-muted">· {weight}</span>
        </p>
      </div>
      <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-sea" aria-hidden="true">
        <div className="h-full rounded-full bg-brand transition-[width] duration-500" style={{ width: `${width}%` }} />
      </div>
      <p className="mt-1.5 text-[16px] leading-snug text-muted">{hint}</p>
    </div>
  )
}

export function ScoreGauge({ score }: { score: ScoreParts }) {
  const { t } = useApp()
  const [open, setOpen] = useState(false)
  const shown = score.empty ? 0 : roundScore(score.total)
  const color = gaugeColor(score)
  const radius = 46
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - shown / 100)
  const sentence = sentenceFor(score, t)

  return (
    <>
      <button
        type="button"
        className="w-full rounded-3xl bg-white p-4 text-left shadow-[0_8px_24px_rgba(20,52,58,0.05)] ring-1 ring-[#14343a]/5"
        aria-expanded={open}
        aria-label={`${t('utilization')} ${shown}. ${sentence}`}
        onClick={() => setOpen(true)}
      >
        <div className="flex items-center gap-3">
          <div className="relative grid h-28 w-28 shrink-0 place-items-center">
            <svg viewBox="0 0 120 120" className="h-28 w-28" aria-hidden="true">
              <circle cx="60" cy="60" r={radius} fill="none" stroke="#d7e6e6" strokeWidth="12" />
              {shown > 0 ? (
                <circle
                  cx="60"
                  cy="60"
                  r={radius}
                  fill="none"
                  stroke={color}
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                  transform="rotate(-90 60 60)"
                  className="motion-safe:transition-[stroke-dashoffset] motion-safe:duration-700"
                />
              ) : null}
            </svg>
            <span className="absolute text-[1.7rem] font-semibold" style={{ color }}>
              {score.empty ? '–' : shown}
            </span>
          </div>
          <div>
            <p className="text-[16px] font-semibold text-muted">{t('utilization')}</p>
            <p className="mt-1 text-[17px] leading-snug font-semibold">{sentence}</p>
            <p className="mt-2 text-[16px] text-muted">{t('tapScore')}</p>
          </div>
        </div>
      </button>
      {open ? (
        <Modal title={t('scoreTitle')} onClose={() => setOpen(false)}>
          <p className="text-[17px] leading-snug text-muted">{t('scoreCaption')}</p>
          <ScoreBar label={t('scorePurpose')} hint={t('scorePurposeHint')} value={score.purpose} weight="50%" />
          <ScoreBar label={t('scoreProof')} hint={t('scoreProofHint')} value={score.proof} weight="30%" />
          <ScoreBar label={t('scoreBudget')} hint={t('scoreBudgetHint')} value={score.budget} weight="20%" />
          <p className="mt-4 text-[1.35rem] font-semibold">
            {t('utilization')}: {score.empty ? '–' : shown}
          </p>
          <button type="button" className="mt-4 min-h-12 w-full rounded-2xl bg-brand text-[17px] font-semibold text-white" onClick={() => setOpen(false)}>
            {t('close')}
          </button>
        </Modal>
      ) : null}
    </>
  )
}
