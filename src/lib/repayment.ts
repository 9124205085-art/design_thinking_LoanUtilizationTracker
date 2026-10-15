import type { Loan } from '../types.ts'
import { addMonths, parseISODate, startOfToday, toISODate } from './dates.ts'

export interface ScheduleRow {
  month: number
  date: string
  payment: number
  interest: number
  principal: number
  balance: number
}

export function buildSchedule(loan: Pick<Loan, 'sanctionedAmount' | 'interestRate' | 'tenureMonths' | 'emi' | 'sanctionDate'>): ScheduleRow[] {
  const months = Math.min(360, Math.max(0, Math.round(loan.tenureMonths)))
  const rate = loan.interestRate / 12 / 100
  let balance = Math.max(0, Math.round(loan.sanctionedAmount))
  const emi = Math.max(0, Math.round(loan.emi))
  const start = parseISODate(loan.sanctionDate)
  const rows: ScheduleRow[] = []

  for (let month = 1; month <= months; month += 1) {
    const date = toISODate(addMonths(start, month))
    if (balance <= 0) {
      rows.push({ month, date, payment: 0, interest: 0, principal: 0, balance: 0 })
      continue
    }
    const interest = Math.round(balance * rate)
    let principal = emi - interest
    let payment = emi
    if (month === months || principal >= balance) {
      principal = balance
      payment = balance + interest
      balance = 0
    } else {
      balance -= principal
    }
    rows.push({ month, date, payment, interest, principal, balance: Math.max(0, balance) })
  }

  return rows
}

export function nextInstallment(rows: ScheduleRow[], from = startOfToday()): ScheduleRow | null {
  const fromTime = from.getTime()
  return rows.find((row) => parseISODate(row.date).getTime() >= fromTime && row.payment > 0) ?? null
}
