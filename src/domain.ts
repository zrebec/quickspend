export const CATEGORY_IDS = [
  'dining',
  'household',
  'groceries',
  'health',
  'car',
  'pets',
  'entertainment',
  'recurring',
  'other',
] as const

export type Category = (typeof CATEGORY_IDS)[number]

export interface CategoryOption {
  id: Category
  label: string
  emoji: string
}

export const CATEGORIES: readonly CategoryOption[] = [
  { id: 'dining', label: 'Stravovanie', emoji: '🍽️' },
  { id: 'household', label: 'Domácnosť', emoji: '🏠' },
  { id: 'groceries', label: 'Potraviny', emoji: '🛒' },
  { id: 'health', label: 'Zdravie', emoji: '🩺' },
  { id: 'car', label: 'Auto', emoji: '🚗' },
  { id: 'pets', label: 'Domáci miláčikovia', emoji: '🐾' },
  { id: 'entertainment', label: 'Zábava', emoji: '🎉' },
  { id: 'recurring', label: 'Paušálne náklady', emoji: '📅' },
  { id: 'other', label: 'Ostatné', emoji: '📦' },
]

export interface ExpenseRecord {
  id: string
  amountCents: number
  category: Category
  note: string
  date: string
  time: string
  createdAt: string
  updatedAt: string
}

export interface ExpenseDraft {
  amount: string
  category: Category
  note: string
  date: string
  time: string
}

export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string }

export const isCategory = (value: unknown): value is Category =>
  typeof value === 'string' && CATEGORY_IDS.some((category) => category === value)

export function parseAmountToCents(value: unknown): ValidationResult<number> {
  if (typeof value !== 'string' && typeof value !== 'number') {
    return { ok: false, error: 'Suma musí byť číslo.' }
  }

  const raw = String(value).trim()
  if (!/^\d+(?:[.,]\d{1,2})?$/.test(raw)) {
    return {
      ok: false,
      error: 'Zadaj kladnú sumu s najviac dvoma desatinnými miestami.',
    }
  }

  const [whole, fraction = ''] = raw.replace(',', '.').split('.')
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, '0'))
  if (!Number.isSafeInteger(cents) || cents <= 0) {
    return { ok: false, error: 'Suma musí byť väčšia ako 0 €.' }
  }

  return { ok: true, value: cents }
}

export const amountForInput = (cents: number): string =>
  (cents / 100).toFixed(2).replace('.', ',')

export const amountForExport = (cents: number): string => (cents / 100).toFixed(2)

export const formatCurrency = (cents: number): string =>
  new Intl.NumberFormat('sk-SK', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(cents / 100)

export function isValidLocalDateTime(date: string, time: string): boolean {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date)
  const timeMatch = /^(\d{2}):(\d{2})$/.exec(time)
  if (!dateMatch || !timeMatch) return false

  const [, yearText, monthText, dayText] = dateMatch
  const [, hourText, minuteText] = timeMatch
  const year = Number(yearText)
  const month = Number(monthText)
  const day = Number(dayText)
  const hour = Number(hourText)
  const minute = Number(minuteText)
  const parsed = new Date(year, month - 1, day, hour, minute, 0, 0)

  return (
    parsed.getFullYear() === year &&
    parsed.getMonth() === month - 1 &&
    parsed.getDate() === day &&
    parsed.getHours() === hour &&
    parsed.getMinutes() === minute
  )
}

const pad = (value: number): string => String(value).padStart(2, '0')

export function localDateTimeParts(now = new Date()): Pick<ExpenseDraft, 'date' | 'time'> {
  return {
    date: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`,
    time: `${pad(now.getHours())}:${pad(now.getMinutes())}`,
  }
}

export function validateDraft(draft: ExpenseDraft): ValidationResult<Omit<ExpenseRecord, 'id' | 'createdAt' | 'updatedAt'>> {
  const amount = parseAmountToCents(draft.amount)
  if (!amount.ok) return amount
  if (!isCategory(draft.category)) {
    return { ok: false, error: 'Vyber platnú kategóriu.' }
  }
  if (draft.note.length > 64) {
    return { ok: false, error: 'Poznámka môže mať najviac 64 znakov.' }
  }
  if (!isValidLocalDateTime(draft.date, draft.time)) {
    return { ok: false, error: 'Dátum alebo čas nie je platný.' }
  }

  return {
    ok: true,
    value: {
      amountCents: amount.value,
      category: draft.category,
      note: draft.note.trim(),
      date: draft.date,
      time: draft.time,
    },
  }
}

export const expenseSortKey = (expense: ExpenseRecord): string =>
  `${expense.date}T${expense.time}|${expense.createdAt}`

export const categoryFor = (id: Category): CategoryOption =>
  CATEGORIES.find((category) => category.id === id) ?? CATEGORIES[2]

export const formatExpenseDate = (expense: ExpenseRecord): string => {
  const [year, month, day] = expense.date.split('-').map(Number)
  return `${new Intl.DateTimeFormat('sk-SK', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(year, month - 1, day))}, ${expense.time}`
}

export const isIsoTimestamp = (value: unknown): value is string =>
  typeof value === 'string' && value.length > 0 && Number.isFinite(Date.parse(value))

export const isUuid = (value: unknown): value is string =>
  typeof value === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)

export function newId(): string {
  return crypto.randomUUID()
}
