import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext.tsx'
import type { Lang } from '../types.ts'
import { Button, Card, Modal, TopBar } from '../components/ui.tsx'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const LANGS: { id: Lang; label: 'english' | 'tamil' | 'hindi' }[] = [
  { id: 'en', label: 'english' },
  { id: 'ta', label: 'tamil' },
  { id: 'hi', label: 'hindi' },
]

export function SettingsPage() {
  const { t, language, setLanguage, loan, expenses, loadDemo, reset } = useApp()
  const navigate = useNavigate()
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [askReset, setAskReset] = useState(false)
  const [askDemo, setAskDemo] = useState(false)
  const installed =
    window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone))

  useEffect(() => {
    const onPrompt = (event: Event) => {
      event.preventDefault()
      setPrompt(event as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    return () => window.removeEventListener('beforeinstallprompt', onPrompt)
  }, [])

  return (
    <div className="space-y-4">
      <TopBar title={t('settingsTitle')} />
      <Card>
        <h2 className="text-[1.15rem] font-semibold">{t('language')}</h2>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {LANGS.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={language === item.id}
              className={`min-h-12 rounded-2xl px-2 text-[16px] font-semibold ${language === item.id ? 'bg-brand text-white' : 'bg-sea text-ink'}`}
              onClick={() => setLanguage(item.id)}
            >
              {t(item.label)}
            </button>
          ))}
        </div>
      </Card>

      <Link to="/disbursements" className="block rounded-3xl bg-white p-4 ring-1 ring-[#14343a]/5">
        <p className="text-[1.1rem] font-semibold">{t('disbursements')}</p>
        <p className="mt-1 text-[16px] leading-snug text-muted">{t('disbursementsHint')}</p>
      </Link>
      <Link to="/report" className="block rounded-3xl bg-white p-4 ring-1 ring-[#14343a]/5">
        <p className="text-[1.1rem] font-semibold">{t('reportTitle')}</p>
        <p className="mt-1 text-[16px] leading-snug text-muted">{t('reportHint')}</p>
      </Link>
      <Link to="/setup" className="block rounded-3xl bg-white p-4 ring-1 ring-[#14343a]/5">
        <p className="text-[1.1rem] font-semibold">{t('editPlan')}</p>
        <p className="mt-1 text-[16px] leading-snug text-muted">{loan ? `${loan.bankName} · ${loan.borrowerName}` : t('welcomeTitle')}</p>
      </Link>
      <Link to="/bank" className="block rounded-3xl bg-white p-4 ring-1 ring-[#14343a]/5">
        <p className="text-[1.1rem] font-semibold">{t('bankLink')}</p>
        <p className="mt-1 text-[16px] leading-snug text-muted">{t('bankLinkHint')}</p>
      </Link>

      <Card>
        <h2 className="text-[1.15rem] font-semibold">{t('install')}</h2>
        <p className="mt-1 text-[16px] leading-snug text-muted">{t('installHint')}</p>
        {installed ? <p className="mt-3 text-[16px] font-semibold text-good">{t('installed')}</p> : null}
        {prompt && !installed ? (
          <Button
            className="mt-3"
            onClick={() => {
              void prompt.prompt().then(() => setPrompt(null))
            }}
          >
            {t('install')}
          </Button>
        ) : null}
        {!installed ? <p className="mt-3 text-[16px] leading-snug text-muted">{t('installManual')}</p> : null}
      </Card>

      <Card>
        <h2 className="text-[1.15rem] font-semibold">{t('loadDemo')}</h2>
        <p className="mt-1 text-[16px] leading-snug text-muted">{t('loadDemoHint')}</p>
        <Button
          className="mt-3"
          variant="secondary"
          onClick={() => {
            if (loan || expenses.length > 0) setAskDemo(true)
            else {
              loadDemo()
              navigate('/')
            }
          }}
        >
          {t('loadDemo')}
        </Button>
      </Card>

      <Card>
        <h2 className="text-[1.15rem] font-semibold">{t('reset')}</h2>
        <p className="mt-1 text-[16px] leading-snug text-muted">{t('resetHint')}</p>
        <Button className="mt-3" variant="danger" onClick={() => setAskReset(true)}>
          {t('reset')}
        </Button>
      </Card>
      <p className="text-[16px] leading-snug text-muted">{t('privacyHint')}</p>

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
      {askReset ? (
        <Modal title={t('resetTitle')} onClose={() => setAskReset(false)}>
          <p className="text-[17px] leading-snug">{t('resetBody')}</p>
          <div className="mt-4 space-y-2">
            <Button
              variant="danger"
              onClick={() => {
                reset()
                navigate('/setup')
              }}
            >
              {t('reset')}
            </Button>
            <Button variant="secondary" onClick={() => setAskReset(false)}>
              {t('cancel')}
            </Button>
          </div>
        </Modal>
      ) : null}
    </div>
  )
}
