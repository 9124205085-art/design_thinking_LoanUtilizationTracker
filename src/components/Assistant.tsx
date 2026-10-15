import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext.tsx'
import { answerQuestion, speakText } from '../lib/assistant.ts'
import type { DocumentAnswer } from '../lib/assistant.ts'
import type { StringKey } from '../lib/i18n.ts'
import type { LoanType } from '../types.ts'
import { inputClass } from './ui.tsx'

const TYPE_LABEL: Record<LoanType, StringKey> = {
  education: 'typeEducation',
  crop: 'typeCrop',
  business: 'typeBusiness',
  personal: 'typePersonal',
}

interface SpeechResultEvent {
  results: ArrayLike<ArrayLike<{ transcript: string }>>
}

interface SpeechListener {
  lang: string
  interimResults: boolean
  start: () => void
  stop: () => void
  onresult: ((event: SpeechResultEvent) => void) | null
  onerror: (() => void) | null
  onend: (() => void) | null
}

function speechListener(): SpeechListener | null {
  const host = window as Window & {
    SpeechRecognition?: new () => SpeechListener
    webkitSpeechRecognition?: new () => SpeechListener
  }
  const Ctor = host.SpeechRecognition ?? host.webkitSpeechRecognition
  return Ctor ? new Ctor() : null
}

export function BillActions() {
  const { t, loan, language } = useApp()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [answer, setAnswer] = useState<DocumentAnswer | null>(null)
  const [note, setNote] = useState('')
  const [listening, setListening] = useState(false)
  const heard = useRef(false)
  const listener = useRef<SpeechListener | null>(null)

  useEffect(() => {
    return () => {
      listener.current?.stop()
      window.speechSynthesis?.cancel()
    }
  }, [])

  function reply(text: string, aloud: boolean) {
    const trimmed = text.trim()
    if (!trimmed) {
      setAnswer(null)
      setNote(t('askEmpty'))
      return
    }
    const next = loan ? answerQuestion(trimmed, loan.loanType, language) : null
    setAnswer(next)
    setNote(next ? '' : t('askUnknown'))
    if (aloud && next) speakText(`${next.intro} ${next.items.join('. ')}`, language)
  }

  function listen() {
    const next = speechListener()
    if (!next) {
      setNote(t('askMicFailed'))
      return
    }
    listener.current?.stop()
    listener.current = next
    heard.current = false
    next.lang = language === 'ta' ? 'ta-IN' : language === 'hi' ? 'hi-IN' : 'en-IN'
    next.interimResults = false
    next.onresult = (event) => {
      const said = event.results[0]?.[0]?.transcript ?? ''
      if (!said.trim()) return
      heard.current = true
      setQuery(said)
      reply(said, true)
    }
    next.onerror = () => setNote(t('askMicFailed'))
    next.onend = () => setListening(false)
    setListening(true)
    setOpen(true)
    try {
      next.start()
    } catch {
      setListening(false)
      setNote(t('askMicFailed'))
    }
  }

  return (
    <div className="absolute inset-x-4 bottom-[4.6rem] z-20 flex flex-col items-end gap-2">
      {open ? (
        <section className="max-h-[48dvh] w-full overflow-y-auto rounded-3xl bg-white p-4 shadow-[0_12px_32px_rgba(20,52,58,0.16)] ring-1 ring-[#14343a]/10">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-[1.2rem] font-semibold">{t('askTitle')}</h2>
            <button type="button" className="min-h-11 shrink-0 font-semibold text-brand" onClick={() => setOpen(false)}>
              {t('close')}
            </button>
          </div>
          <p className="mt-1 text-[16px] leading-snug text-muted">{t('askHint')}</p>
          <form
            className="mt-3 space-y-2"
            onSubmit={(event) => {
              event.preventDefault()
              reply(query, false)
            }}
          >
            <label className="block">
              <span className="sr-only">{t('askPlaceholder')}</span>
              <input
                className={inputClass}
                value={query}
                placeholder={t('askPlaceholder')}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" className="min-h-12 rounded-2xl bg-sea text-[16px] font-semibold text-ink" onClick={listen} disabled={listening}>
                {listening ? t('askListening') : t('askMic')}
              </button>
              <button type="submit" className="min-h-12 rounded-2xl bg-brand text-[16px] font-semibold text-white">
                {t('askSend')}
              </button>
            </div>
          </form>
          <div className="mt-3 flex flex-wrap gap-2">
            {(['education', 'crop', 'business', 'personal'] as const).map((type) => (
              <button
                key={type}
                type="button"
                className="min-h-11 rounded-full bg-mist px-3 text-[16px] font-semibold text-ink ring-1 ring-line"
                onClick={() => {
                  const asked = t(TYPE_LABEL[type])
                  setQuery(asked)
                  reply(asked, false)
                }}
              >
                {t(TYPE_LABEL[type])}
              </button>
            ))}
          </div>
          <div className="mt-3" aria-live="polite">
            {note ? <p className="text-[16px] leading-snug text-warn">{note}</p> : null}
            {answer ? (
              <div>
                <p className="text-[17px] leading-snug font-semibold">{answer.intro}</p>
                <ol className="mt-2 list-decimal space-y-2 pl-5 text-[16px] leading-snug">
                  {answer.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ol>
                <p className="mt-3 text-[16px] leading-snug text-muted">{t('askBankNote')}</p>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}
      <button
        type="button"
        className="inline-flex min-h-12 items-center rounded-full bg-white px-4 text-[16px] font-semibold text-brand shadow-[0_8px_20px_rgba(20,52,58,0.12)] ring-1 ring-line"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        {t('askAssistant')}
      </button>
      <Link
        to="/expenses/new"
        className="inline-flex min-h-14 items-center gap-2 rounded-full bg-brand px-5 text-[17px] font-semibold text-white shadow-[0_10px_24px_rgba(15,118,110,0.35)]"
      >
        <span aria-hidden="true" className="text-[1.4rem] leading-none">
          +
        </span>
        {t('addBill')}
      </Link>
    </div>
  )
}
