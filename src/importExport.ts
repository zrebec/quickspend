import {
  amountForExport,
  isCategory,
  isIsoTimestamp,
  isUuid,
  isValidLocalDateTime,
  newId,
  parseAmountToCents,
  type ExpenseRecord,
} from './domain'

export interface QuickSpendExportRecordV1 {
  id?: string
  amount: string | number
  category: string
  note?: string
  date: string
  time: string
  createdAt?: string
  updatedAt?: string
}

export interface QuickSpendExportV1 {
  format: 'quickspend'
  schemaVersion: 1
  appVersion: string
  currency: 'EUR'
  exportedAt: string
  records: QuickSpendExportRecordV1[]
}

export interface ImportResult {
  records: ExpenseRecord[]
  added: number
  updated: number
  unchanged: number
}

interface NormalizedImport {
  id?: string
  amountCents: number
  category: ExpenseRecord['category']
  note: string
  date: string
  time: string
  createdAt?: string
  updatedAt?: string
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

function normalizeRecord(value: unknown, index: number): NormalizedImport {
  const prefix = `Záznam ${index + 1}`
  if (!isObject(value)) throw new Error(`${prefix} nie je objekt.`)

  const amount = parseAmountToCents(value.amount)
  if (!amount.ok) throw new Error(`${prefix}: ${amount.error}`)
  if (!isCategory(value.category)) throw new Error(`${prefix} má neplatnú kategóriu.`)

  const note = value.note ?? ''
  if (typeof note !== 'string' || note.length > 64) {
    throw new Error(`${prefix} má poznámku dlhšiu ako 64 znakov.`)
  }
  if (
    typeof value.date !== 'string' ||
    typeof value.time !== 'string' ||
    !isValidLocalDateTime(value.date, value.time)
  ) {
    throw new Error(`${prefix} má neplatný dátum alebo čas.`)
  }
  if (value.id !== undefined && !isUuid(value.id)) {
    throw new Error(`${prefix} má neplatné UUID.`)
  }
  if (value.createdAt !== undefined && !isIsoTimestamp(value.createdAt)) {
    throw new Error(`${prefix} má neplatný createdAt.`)
  }
  if (value.updatedAt !== undefined && !isIsoTimestamp(value.updatedAt)) {
    throw new Error(`${prefix} má neplatný updatedAt.`)
  }

  return {
    id: value.id,
    amountCents: amount.value,
    category: value.category,
    note,
    date: value.date,
    time: value.time,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  }
}

const compositeKey = (
  record: Pick<ExpenseRecord, 'amountCents' | 'category' | 'date' | 'time'>,
): string => `${record.amountCents}|${record.category}|${record.date}|${record.time}`

const sameContent = (left: ExpenseRecord, right: NormalizedImport): boolean =>
  left.amountCents === right.amountCents &&
  left.category === right.category &&
  left.note === right.note &&
  left.date === right.date &&
  left.time === right.time

export function createExport(records: ExpenseRecord[], now = new Date()): QuickSpendExportV1 {
  return {
    format: 'quickspend',
    schemaVersion: 1,
    appVersion: __APP_VERSION__,
    currency: 'EUR',
    exportedAt: now.toISOString(),
    records: records.map((record) => ({
      id: record.id,
      amount: amountForExport(record.amountCents),
      category: record.category,
      note: record.note,
      date: record.date,
      time: record.time,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    })),
  }
}

export function mergeImport(
  text: string,
  currentRecords: ExpenseRecord[],
  now = new Date(),
): ImportResult {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error('Súbor nie je platný JSON.')
  }

  if (
    !isObject(parsed) ||
    parsed.format !== 'quickspend' ||
    parsed.schemaVersion !== 1 ||
    parsed.currency !== 'EUR' ||
    typeof parsed.appVersion !== 'string' ||
    !isIsoTimestamp(parsed.exportedAt) ||
    !Array.isArray(parsed.records)
  ) {
    throw new Error('Súbor nemá podporovaný formát QuickSpend v1.')
  }

  const imported = parsed.records.map(normalizeRecord)
  const ids = imported.flatMap((record) => (record.id ? [record.id] : []))
  if (new Set(ids).size !== ids.length) {
    throw new Error('Import obsahuje duplicitné UUID.')
  }

  const importKeyCounts = new Map<string, number>()
  for (const record of imported) {
    const key = compositeKey(record)
    importKeyCounts.set(key, (importKeyCounts.get(key) ?? 0) + 1)
  }
  const ambiguousImport = imported.find(
    (record) => !record.id && (importKeyCounts.get(compositeKey(record)) ?? 0) > 1,
  )
  if (ambiguousImport) {
    throw new Error(
      `Import obsahuje nejednoznačné záznamy bez UUID pre ${ambiguousImport.date} ${ambiguousImport.time}.`,
    )
  }

  const merged = [...currentRecords]
  let added = 0
  let updated = 0
  let unchanged = 0
  const timestamp = now.toISOString()

  for (const record of imported) {
    let matchIndex = record.id ? merged.findIndex((item) => item.id === record.id) : -1

    if (matchIndex < 0 && (importKeyCounts.get(compositeKey(record)) ?? 0) === 1) {
      const fallbackMatches = merged
        .map((item, index) => ({ item, index }))
        .filter(({ item }) => compositeKey(item) === compositeKey(record))
      if (fallbackMatches.length > 1) {
        throw new Error(
          `Import je nejednoznačný pre ${record.date} ${record.time}, ${amountForExport(record.amountCents)} €.`,
        )
      }
      matchIndex = fallbackMatches[0]?.index ?? -1
    }

    if (matchIndex >= 0) {
      const existing = merged[matchIndex]
      if (sameContent(existing, record)) {
        unchanged += 1
        continue
      }
      merged[matchIndex] = {
        id: existing.id,
        amountCents: record.amountCents,
        category: record.category,
        note: record.note,
        date: record.date,
        time: record.time,
        createdAt: record.createdAt ?? existing.createdAt,
        updatedAt: timestamp,
      }
      updated += 1
      continue
    }

    merged.push({
      id: record.id ?? newId(),
      amountCents: record.amountCents,
      category: record.category,
      note: record.note,
      date: record.date,
      time: record.time,
      createdAt: record.createdAt ?? timestamp,
      updatedAt: timestamp,
    })
    added += 1
  }

  return { records: merged, added, updated, unchanged }
}
