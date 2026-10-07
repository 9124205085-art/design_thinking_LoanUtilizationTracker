import type { LoanType } from '../types.ts'

const RISKY: Record<LoanType, string[]> = {
  education: [
    'movie',
    'movies',
    'cinema',
    'pvr',
    'inox',
    'theatre',
    'theater',
    'restaurant',
    'cafe',
    'swiggy',
    'zomato',
    'dineout',
    'shopping',
    'mall',
    'myntra',
    'ajio',
    'gaming',
    'playstation',
    'xbox',
    'steam',
    'pubg',
    'pub',
    'liquor',
    'alcohol',
    'beer',
    'wine',
    'netflix',
    'spotify',
    'nightclub',
    'vacation',
    'jewellery',
    'jewelry',
    'gold shop',
    'spa',
    'salon',
    'cosmetics',
    'makeup',
    'barbeque',
    'pizza hut',
    'burger',
    'kfc',
    'mcdonald',
  ],
  crop: [
    'movie',
    'movies',
    'cinema',
    'pvr',
    'inox',
    'gaming',
    'playstation',
    'xbox',
    'shopping',
    'mall',
    'myntra',
    'restaurant',
    'swiggy',
    'zomato',
    'jewellery',
    'jewelry',
    'vacation',
    'netflix',
    'salon',
    'spa',
    'liquor',
    'alcohol',
  ],
  business: [
    'movie',
    'movies',
    'cinema',
    'pvr',
    'inox',
    'gaming',
    'playstation',
    'xbox',
    'jewellery',
    'jewelry',
    'vacation',
    'netflix',
    'salon',
    'spa',
    'pub',
    'liquor',
    'alcohol',
  ],
  personal: ['casino', 'gambling', 'betting', 'lottery'],
}

function matches(text: string, word: string): boolean {
  if (word.includes(' ')) return text.includes(word)
  const pattern = new RegExp(`(?:^|[^a-z0-9])${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:[^a-z0-9]|$)`, 'i')
  return pattern.test(text)
}

export function findPurposeIssue(loanType: LoanType, text: string): string | null {
  const haystack = text.toLowerCase()
  for (const word of RISKY[loanType]) {
    if (matches(haystack, word)) return word
  }
  return null
}
