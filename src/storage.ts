import {
  isCategory,
  isIsoTimestamp,
  isUuid,
  isValidLocalDateTime,
  newId,
  type ExpenseDraft,
  type ExpenseRecord,
  validateDraft,
} from './domain'

export const STORAGE_KEY = 'quickspend:data:v1'

interface StorageEnvelopeV1 {
  schemaVersion: 1
  records: ExpenseRecord[]
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

function parseStoredRecord(value: unknown, index: number): ExpenseRecord {
  if (!isObject(value)) throw new Error(`Záznam ${index + 1} nie je objekt.`)

  const { id, amountCents, category, note, date, time, createdAt, updatedAt } = value
  if (!isUuid(id)) throw new Error(`Záznam ${index + 1} má neplatné ID.`)
  if (!Number.isSafeInteger(amountCents) || Number(amountCents) <= 0) {
    throw new Error(`Záznam ${index + 1} má neplatnú sumu.`)
  }
  if (!isCategory(category)) throw new Error(`Záznam ${index + 1} má neplatnú kategóriu.`)
  if (typeof note !== 'string' || note.length > 64) {
    throw new Error(`Záznam ${index + 1} má neplatnú poznámku.`)
  }
  if (typeof date !== 'string' || typeof time !== 'string' || !isValidLocalDateTime(date, time)) {
    throw new Error(`Záznam ${index + 1} má neplatný dátum alebo čas.`)
  }
  if (!isIsoTimestamp(createdAt) || !isIsoTimestamp(updatedAt)) {
    throw new Error(`Záznam ${index + 1} má neplatné technické časové údaje.`)
  }

  return {
    id,
    amountCents: Number(amountCents),
    category,
    note,
    date,
    time,
    createdAt,
    updatedAt,
  }
}

export function loadExpenses(storage: Storage = localStorage): ExpenseRecord[] {
  const raw = storage.getItem(STORAGE_KEY)
  if (raw === null) return []

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new Error('Uložené dáta sú poškodené a aplikácia ich nebude prepisovať.')
  }

  if (!isObject(parsed) || parsed.schemaVersion !== 1 || !Array.isArray(parsed.records)) {
    throw new Error('Uložené dáta majú nepodporovaný formát a aplikácia ich nebude prepisovať.')
  }

  return parsed.records.map(parseStoredRecord)
}

export function saveExpenses(records: ExpenseRecord[], storage: Storage = localStorage): void {
  const envelope: StorageEnvelopeV1 = { schemaVersion: 1, records }
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(envelope))
  } catch {
    throw new Error('Dáta sa nepodarilo uložiť. Skontroluj voľné miesto v zariadení.')
  }
}

export function createExpense(draft: ExpenseDraft, now = new Date()): ExpenseRecord {
  const validated = validateDraft(draft)
  if (!validated.ok) throw new Error(validated.error)
  const timestamp = now.toISOString()
  return {
    id: newId(),
    ...validated.value,
    createdAt: timestamp,
    updatedAt: timestamp,
  }
}

export function updateExpense(
  original: ExpenseRecord,
  draft: ExpenseDraft,
  now = new Date(),
): ExpenseRecord {
  const validated = validateDraft(draft)
  if (!validated.ok) throw new Error(validated.error)
  return {
    ...original,
    ...validated.value,
    updatedAt: now.toISOString(),
  }
}

export function readRawStorage(storage: Storage = localStorage): string | null {
  return storage.getItem(STORAGE_KEY)
}
