import { describe, expect, it } from 'vitest'
import type { ExpenseRecord } from '../domain'
import { createExport, mergeImport } from '../importExport'

const now = new Date('2026-09-14T12:00:00.000Z')
const base: ExpenseRecord = {
  id: '11111111-1111-4111-8111-111111111111',
  amountCents: 2535,
  category: 'groceries',
  note: 'Pôvodná',
  date: '2026-09-14',
  time: '13:10',
  createdAt: '2026-09-14T11:10:00.000Z',
  updatedAt: '2026-09-14T11:10:00.000Z',
}

const envelope = (records: unknown[]) =>
  JSON.stringify({
    format: 'quickspend',
    schemaVersion: 1,
    appVersion: '0.0.1',
    currency: 'EUR',
    exportedAt: '2026-09-14T12:00:00.000Z',
    records,
  })

describe('QuickSpend import and export', () => {
  it('exports exact readable amounts and metadata', () => {
    expect(createExport([base], now)).toMatchObject({
      format: 'quickspend',
      schemaVersion: 1,
      appVersion: '0.0.1',
      currency: 'EUR',
      records: [{ amount: '25.35', category: 'groceries' }],
    })
  })

  it('lets an imported composite conflict replace the note', () => {
    const result = mergeImport(
      envelope([
        {
          amount: '25,35',
          category: 'groceries',
          note: 'Importovaná',
          date: '2026-09-14',
          time: '13:10',
        },
      ]),
      [base],
      now,
    )

    expect(result).toMatchObject({ added: 0, updated: 1, unchanged: 0 })
    expect(result.records[0]).toMatchObject({ id: base.id, note: 'Importovaná' })
  })

  it('recognizes unchanged records by UUID', () => {
    const result = mergeImport(envelope(createExport([base], now).records), [base], now)
    expect(result).toMatchObject({ added: 0, updated: 0, unchanged: 1 })
  })

  it('preserves same-composite records that have distinct UUIDs', () => {
    const duplicate = {
      ...base,
      id: '22222222-2222-4222-8222-222222222222',
      note: 'Druhý nákup',
    }
    const result = mergeImport(envelope(createExport([base, duplicate], now).records), [], now)
    expect(result.records).toHaveLength(2)
    expect(result.added).toBe(2)
  })

  it('rejects ambiguous fallback matching without mutating input', () => {
    const duplicate = {
      ...base,
      id: '22222222-2222-4222-8222-222222222222',
      note: 'Druhý nákup',
    }
    const current = [base, duplicate]
    expect(() =>
      mergeImport(
        envelope([
          {
            amount: 25.35,
            category: 'groceries',
            note: 'Nejednoznačné',
            date: '2026-09-14',
            time: '13:10',
          },
        ]),
        current,
        now,
      ),
    ).toThrow(/nejednoznačný/)
    expect(current).toEqual([base, duplicate])
  })

  it('rejects repeated composite records without UUID in the imported file', () => {
    const withoutId = {
      amount: '25.35',
      category: 'groceries',
      note: 'Ručný záznam',
      date: '2026-09-14',
      time: '13:10',
    }
    expect(() => mergeImport(envelope([withoutId, withoutId]), [], now)).toThrow(
      /nejednoznačné záznamy bez UUID/,
    )
  })

  it('rejects the entire malformed file', () => {
    expect(() =>
      mergeImport(
        envelope([
          {
            amount: '10.00',
            category: 'health',
            date: '2026-09-14',
            time: '10:00',
          },
          {
            amount: '-3',
            category: 'car',
            date: '2026-09-14',
            time: '11:00',
          },
        ]),
        [base],
        now,
      ),
    ).toThrow(/Záznam 2/)
  })
})
