import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { AppData, Expense } from '../types.ts'
import { formatDate } from './dates.ts'
import { formatPlain } from './money.ts'
import { buildAlerts, categoryName, expenseStatus, roundScore, spentByCategory, totalReceived, totalSpent, utilizationScore } from './stats.ts'

type DocWithTable = jsPDF & { lastAutoTable?: { finalY?: number } }

function pdfText(value: string): string {
  let cleaned = ''
  for (const char of value) {
    const code = char.charCodeAt(0)
    if ((code >= 32 && code <= 126) || code === 10) cleaned += char
    else cleaned += ' '
  }
  const text = cleaned.replace(/\s+/g, ' ').trim()
  return text || '(text uses a script this PDF font cannot show)'
}

function rupees(value: number): string {
  return formatPlain(value)
}

function statusLabel(expense: Expense): string {
  const status = expenseStatus(expense)
  if (status === 'flagged') return expense.flagKeyword ? `Flagged: ${expense.flagKeyword}` : 'Flagged'
  if (status === 'missing_proof') return 'Missing photo'
  return 'Verified'
}

function tableEnd(doc: DocWithTable, fallback: number): number {
  return doc.lastAutoTable?.finalY ?? fallback
}

export function reportFilename(name: string): string {
  const safe = name.replace(/[^\w]+/g, '-').replace(/^-|-$/g, '') || 'borrower'
  const today = new Date()
  const day = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  return `LoanTrack-${safe}-${day}.pdf`
}

export function buildReport(data: AppData): jsPDF {
  const loan = data.loan
  if (!loan) throw new Error('No loan')
  const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true }) as DocWithTable
  const margin = 14
  const pageWidth = doc.internal.pageSize.getWidth()
  const spent = totalSpent(data.expenses)
  const received = totalReceived(data.disbursements)
  const score = utilizationScore(loan, data.expenses)
  const byCategory = spentByCategory(data.expenses)

  doc.setFillColor(15, 118, 110)
  doc.rect(0, 0, pageWidth, 28, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.text('LoanTrack', margin, 12)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.text('Loan use report for the bank', margin, 20)

  doc.setTextColor(20, 52, 58)
  doc.setFontSize(11)
  let y = 38
  doc.setFont('helvetica', 'bold')
  doc.text('Borrower and loan', margin, y)
  doc.setFont('helvetica', 'normal')
  y += 7
  const summary = [
    `Borrower: ${pdfText(loan.borrowerName)}`,
    `Bank: ${pdfText(loan.bankName)}`,
    `Purpose: ${loan.loanType}`,
    `Loan amount: Rs ${rupees(loan.sanctionedAmount)}`,
    `Interest: ${loan.interestRate}% per year`,
    `Repayment: ${loan.tenureMonths} months`,
    `Monthly payment: Rs ${rupees(loan.emi)}`,
    `Start date: ${formatDate(loan.sanctionDate, 'en')}`,
    `Money received: Rs ${rupees(received)}`,
    `Spent so far: Rs ${rupees(spent)}`,
    `Still left from the loan: Rs ${rupees(loan.sanctionedAmount - spent)}`,
    score.empty
      ? 'Use score: not available yet (no bills)'
      : `Use score: ${roundScore(score.total)} out of 100 (purpose ${roundScore(score.purpose)}, photos ${roundScore(score.proof)}, plan ${roundScore(score.budget)})`,
  ]
  for (const line of summary) {
    doc.text(line, margin, y)
    y += 6
  }
  y += 2
  doc.setFontSize(10)
  doc.setTextColor(62, 88, 95)
  const note = doc.splitTextToSize(
    'Score = 50% spending that matches the loan purpose + 30% bills with a photo + 20% staying inside the plan. This file was created on the student\'s phone.',
    pageWidth - margin * 2,
  ) as string[]
  doc.text(note, margin, y)
  y += note.length * 5 + 4

  doc.setTextColor(20, 52, 58)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.text('Planned vs actual', margin, y)
  y += 3

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin, bottom: 16 },
    head: [['Category', 'Planned (Rs)', 'Spent (Rs)', 'Difference (Rs)']],
    body: loan.categories.map((category) => {
      const actual = byCategory.get(category.id) ?? 0
      const diff = actual - category.planned
      const label = diff > 0 ? `${rupees(diff)} over` : `${rupees(category.planned - actual)} left`
      return [pdfText(category.name), rupees(category.planned), rupees(actual), label]
    }),
    styles: { fontSize: 10, cellPadding: 2.4, textColor: [20, 52, 58] },
    headStyles: { fillColor: [15, 118, 110], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [244, 248, 248] },
  })

  y = tableEnd(doc, y) + 10
  if (y > 250) {
    doc.addPage()
    y = 18
  }
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.text('Expenses', margin, y)

  const rows = [...data.expenses].sort((a, b) => (a.date < b.date ? -1 : 1))
  autoTable(doc, {
    startY: y + 3,
    margin: { left: margin, right: margin, bottom: 16 },
    head: [['Date', 'Paid to', 'Category', 'Amount (Rs)', 'How', 'Status']],
    body: rows.map((expense) => [
      formatDate(expense.date, 'en'),
      pdfText(expense.vendor),
      pdfText(categoryName(loan, expense.categoryId, 'Old category')),
      rupees(expense.amount),
      expense.paymentMode === 'bank' ? 'Bank transfer' : expense.paymentMode === 'cash' ? 'Cash' : 'UPI',
      statusLabel(expense),
    ]),
    styles: { fontSize: 9, cellPadding: 2, textColor: [20, 52, 58] },
    headStyles: { fillColor: [15, 118, 110], textColor: 255, fontStyle: 'bold' },
    columnStyles: { 3: { halign: 'right' } },
  })

  const alerts = buildAlerts(loan, data.expenses, data.disbursements)
  if (alerts.length > 0) {
    let alertY = tableEnd(doc, y) + 10
    if (alertY > 250) {
      doc.addPage()
      alertY = 18
    }
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.setTextColor(20, 52, 58)
    doc.text('Items to review', margin, alertY)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    alertY += 6
    for (const alert of alerts) {
      const line =
        alert.kind === 'overspend'
          ? `${alert.categoryName} is over the plan (spent Rs ${rupees(alert.actual)} of Rs ${rupees(alert.planned)}).`
          : alert.kind === 'missing'
            ? `${alert.count} bill(s) have no photo.`
            : alert.kind === 'emi'
              ? `Monthly payment of Rs ${rupees(alert.emi)} is due on ${formatDate(alert.date, 'en')}.`
              : `Rs ${rupees(alert.left)} received from the bank is still unused.`
      const wrapped = doc.splitTextToSize(pdfText(line), pageWidth - margin * 2) as string[]
      if (alertY + wrapped.length * 5 > 280) {
        doc.addPage()
        alertY = 18
      }
      doc.text(wrapped, margin, alertY)
      alertY += wrapped.length * 5 + 2
    }
  }

  for (const expense of rows) {
    if (!expense.receiptDataUrl) continue
    doc.addPage()
    doc.setFillColor(15, 118, 110)
    doc.rect(0, 0, pageWidth, 16, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.text('Receipt photo', margin, 10)
    doc.setTextColor(20, 52, 58)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(11)
    doc.text(pdfText(`${expense.vendor} · ${formatDate(expense.date, 'en')} · Rs ${rupees(expense.amount)}`), margin, 26)
    if (expense.note) doc.text(pdfText(expense.note), margin, 33)
    try {
      const props = doc.getImageProperties(expense.receiptDataUrl)
      const maxW = 120
      const maxH = 150
      let width = maxW
      let height = props.width > 0 ? (props.height / props.width) * width : maxH
      if (height > maxH) {
        height = maxH
        width = props.height > 0 ? (props.width / props.height) * height : maxW
      }
      const format = expense.receiptDataUrl.includes('image/png') ? 'PNG' : 'JPEG'
      doc.addImage(expense.receiptDataUrl, format, margin, 40, width, height)
    } catch {
      doc.text('This photo could not be placed in the PDF.', margin, 46)
    }
  }

  const pageCount = doc.getNumberOfPages()
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(90, 110, 114)
    doc.text(`LoanTrack · page ${page} of ${pageCount}`, margin, 290)
  }

  doc.setProperties({ title: 'LoanTrack report', creator: 'LoanTrack' })
  return doc
}

export async function sharePdf(doc: jsPDF, filename: string): Promise<'shared' | 'downloaded' | 'cancelled'> {
  const blob = doc.output('blob')
  const file = new File([blob], filename, { type: 'application/pdf' })
  if (typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] }) && navigator.share) {
    try {
      await navigator.share({ files: [file], title: 'LoanTrack report', text: 'Loan use report for the bank' })
      return 'shared'
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return 'cancelled'
    }
  }
  doc.save(filename)
  return 'downloaded'
}

export function downloadPdf(doc: jsPDF, filename: string): void {
  doc.save(filename)
}
