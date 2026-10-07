import type { AppData, Expense, Lang } from '../types.ts'
import { addDays, addMonths, dateAtNoon, daysFromToday, nextEmiDate, parseISODate, startOfToday, toISODate } from './dates.ts'
import { makeReceiptImage } from './images.ts'
import { uid } from './id.ts'
import { estimateEmi, formatINR } from './money.ts'

function pickSanctionDate(tenure: number): string {
  const today = startOfToday()
  for (let back = 6; back >= 2; back -= 1) {
    for (let ahead = 2; ahead <= 6; ahead += 1) {
      const sanction = addMonths(addDays(today, ahead), -back)
      const iso = toISODate(sanction)
      const next = nextEmiDate(iso, tenure, today)
      if (!next) continue
      const days = daysFromToday(next)
      if (days >= 1 && days <= 7) return iso
    }
  }
  return toISODate(addMonths(addDays(today, 4), -6))
}

function onOrBeforeToday(date: Date, today: Date): string {
  if (date.getTime() > today.getTime()) return toISODate(addDays(today, -1))
  return toISODate(date)
}

export function buildDemo(language: Lang): AppData {
  const tenureMonths = 60
  const sanctionedAmount = 500000
  const interestRate = 8.5
  const sanctionDate = pickSanctionDate(tenureMonths)
  const sanction = parseISODate(sanctionDate)
  const today = startOfToday()
  const tuition = uid()
  const hostel = uid()
  const laptop = uid()
  const books = uid()
  const other = uid()

  const dated = (monthsAfter: number, shift = 0) => onOrBeforeToday(addDays(addMonths(sanction, monthsAfter), shift), today)

  const samples: Array<Omit<Expense, 'id' | 'createdAt' | 'receiptDataUrl'> & { receipt?: boolean; shopLine: string }> = [
    {
      amount: 150000,
      categoryId: tuition,
      date: dated(0, 3),
      vendor: 'City College',
      paymentMode: 'upi',
      reference: 'UPI8392017463',
      note: 'Tuition fee, semester 1',
      flagged: false,
      receipt: true,
      shopLine: 'Tuition fee, semester 1',
    },
    {
      amount: 80000,
      categoryId: tuition,
      date: dated(3, 2),
      vendor: 'City College',
      paymentMode: 'bank',
      reference: 'NEFT2201846',
      note: 'Tuition fee, semester 2',
      flagged: false,
      receipt: true,
      shopLine: 'Tuition fee, semester 2',
    },
    {
      amount: 45000,
      categoryId: hostel,
      date: dated(0, 5),
      vendor: 'Campus Hostel',
      paymentMode: 'bank',
      reference: 'NEFT2201902',
      note: 'Room rent',
      flagged: false,
      receipt: true,
      shopLine: 'Room rent',
    },
    {
      amount: 18000,
      categoryId: hostel,
      date: dated(2, 1),
      vendor: 'Campus Hostel',
      paymentMode: 'upi',
      reference: 'UPI5520193841',
      note: 'Mess advance',
      flagged: false,
      receipt: true,
      shopLine: 'Mess advance',
    },
    {
      amount: 52000,
      categoryId: laptop,
      date: dated(1, 4),
      vendor: 'Reliance Digital',
      paymentMode: 'bank',
      reference: 'CARD884120',
      note: 'Laptop for coursework',
      flagged: false,
      location: { lat: 13.0067, lng: 80.2206 },
      receipt: true,
      shopLine: 'Laptop for coursework',
    },
    {
      amount: 6500,
      categoryId: books,
      date: dated(1, 8),
      vendor: 'Campus Bookstore',
      paymentMode: 'upi',
      reference: 'UPI1102938475',
      note: 'Textbooks',
      flagged: false,
      receipt: true,
      shopLine: 'Textbooks',
    },
    {
      amount: 2800,
      categoryId: books,
      date: dated(3, 6),
      vendor: 'Stationery Hub',
      paymentMode: 'cash',
      reference: '',
      note: 'Notebooks and pens',
      flagged: false,
      receipt: true,
      shopLine: 'Notebooks and pens',
    },
    {
      amount: 1500,
      categoryId: other,
      date: dated(4, 2),
      vendor: 'College Lab',
      paymentMode: 'upi',
      reference: 'UPI6672019384',
      note: 'Lab coat',
      flagged: false,
      receipt: true,
      shopLine: 'Lab coat',
    },
    {
      amount: 1800,
      categoryId: other,
      date: dated(4, 10),
      vendor: 'PVR Cinemas',
      paymentMode: 'upi',
      reference: 'UPI4401928371',
      note: 'Weekend movie',
      flagged: true,
      flagKeyword: 'movie',
      receipt: true,
      shopLine: 'Weekend movie',
    },
    {
      amount: 900,
      categoryId: books,
      date: dated(5, 1),
      vendor: 'Corner Books',
      paymentMode: 'cash',
      reference: '',
      note: 'Printed notes',
      flagged: false,
      receipt: false,
      shopLine: 'Printed notes',
    },
  ]

  const expenses: Expense[] = samples.map((sample) => {
    const { receipt, shopLine, ...rest } = sample
    return {
      ...rest,
      id: uid(),
      createdAt: dateAtNoon(rest.date),
      receiptDataUrl: receipt
        ? makeReceiptImage({
            shop: rest.vendor,
            line: shopLine,
            amount: formatINR(rest.amount),
            date: rest.date,
          })
        : undefined,
    }
  })

  let second = addMonths(sanction, 2)
  if (second.getTime() > today.getTime()) second = addDays(today, -10)

  return {
    language,
    loan: {
      borrowerName: 'Ananya R.',
      bankName: 'SBI',
      loanType: 'education',
      sanctionedAmount,
      interestRate,
      tenureMonths,
      emi: estimateEmi(sanctionedAmount, interestRate, tenureMonths),
      sanctionDate,
      categories: [
        { id: tuition, name: 'Tuition', planned: 300000 },
        { id: hostel, name: 'Hostel', planned: 120000 },
        { id: laptop, name: 'Laptop', planned: 50000 },
        { id: books, name: 'Books', planned: 20000 },
        { id: other, name: 'Other', planned: 10000 },
      ],
    },
    disbursements: [
      { id: uid(), amount: 300000, date: sanctionDate, tranche: 1 },
      { id: uid(), amount: 150000, date: toISODate(second), tranche: 2 },
    ],
    expenses,
  }
}
