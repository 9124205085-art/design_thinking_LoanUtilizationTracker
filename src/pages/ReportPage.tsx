import { useRef, useState } from 'react'
import type { jsPDF } from 'jspdf'
import { useApp } from '../context/AppContext.tsx'
import { Button, Card, TopBar } from '../components/ui.tsx'

export function ReportPage() {
  const { loan, disbursements, expenses, t, notify } = useApp()
  const reportRef = useRef<jsPDF | null>(null)
  const [working, setWorking] = useState(false)
  const [ready, setReady] = useState(false)
  if (!loan) return null

  const currentLoan = loan

  async function create() {
    setWorking(true)
    try {
      const { buildReport } = await import('../lib/pdf.ts')
      reportRef.current = buildReport({ loan: currentLoan, disbursements, expenses })
      setReady(true)
      notify(t('reportReady'))
    } finally {
      setWorking(false)
    }
  }

  return (
    <div className="space-y-4">
      <TopBar title={t('reportTitle')} to="/" subtitle={loan.nickname} />
      <Card>
        <p className="text-[17px] leading-snug">{t('reportHint')}</p>
        <p className="mt-3 text-[16px] leading-snug text-muted">{t('reportEnglish')}</p>
        <p className="mt-2 text-[16px] leading-snug text-muted">{t('reportLocal')}</p>
      </Card>
      <Button
        disabled={working}
        onClick={() => {
          void create()
        }}
      >
        {working ? t('working') : t('createPdf')}
      </Button>
      {ready ? (
        <div className="space-y-2">
          <Button
            variant="secondary"
            onClick={() => {
              const doc = reportRef.current
              if (!doc) return
              void import('../lib/pdf.ts').then(({ downloadPdf, reportFilename }) => {
                downloadPdf(doc, reportFilename(currentLoan.borrowerName))
              })
            }}
          >
            {t('download')}
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              const doc = reportRef.current
              if (!doc) return
              void import('../lib/pdf.ts').then(async ({ reportFilename, sharePdf }) => {
                const result = await sharePdf(doc, reportFilename(currentLoan.borrowerName))
                if (result === 'downloaded') notify(t('shareFailed'))
              })
            }}
          >
            {t('share')}
          </Button>
          <p className="text-[16px] leading-snug text-muted">{t('reportRefresh')}</p>
        </div>
      ) : null}
    </div>
  )
}
