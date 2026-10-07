import type { CategoryBudget, LoanType } from '../types.ts'
import { uid } from './id.ts'

const PRESETS: Record<LoanType, { name: string; pct: number }[]> = {
  education: [
    { name: 'Tuition', pct: 0.6 },
    { name: 'Hostel', pct: 0.24 },
    { name: 'Laptop', pct: 0.1 },
    { name: 'Books', pct: 0.04 },
    { name: 'Other', pct: 0.02 },
  ],
  crop: [
    { name: 'Seeds', pct: 0.4 },
    { name: 'Fertilizer', pct: 0.25 },
    { name: 'Farm labour', pct: 0.2 },
    { name: 'Tools', pct: 0.1 },
    { name: 'Other', pct: 0.05 },
  ],
  business: [
    { name: 'Tools and machines', pct: 0.35 },
    { name: 'Goods to sell', pct: 0.3 },
    { name: 'Shop rent', pct: 0.15 },
    { name: 'Marketing', pct: 0.1 },
    { name: 'Other', pct: 0.1 },
  ],
  personal: [
    { name: 'Home needs', pct: 0.4 },
    { name: 'Medical', pct: 0.2 },
    { name: 'School fees', pct: 0.15 },
    { name: 'Travel', pct: 0.1 },
    { name: 'Other', pct: 0.15 },
  ],
}

export function suggestCategories(type: LoanType, amount: number): CategoryBudget[] {
  const preset = PRESETS[type]
  const total = Math.max(0, Math.round(amount))
  const values = preset.map((item) => Math.floor(total * item.pct))
  const used = values.reduce((sum, value) => sum + value, 0)
  values[values.length - 1] = (values[values.length - 1] ?? 0) + (total - used)
  return preset.map((item, index) => ({
    id: uid(),
    name: item.name,
    planned: values[index] ?? 0,
  }))
}
