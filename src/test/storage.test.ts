import { beforeEach, describe, expect, it } from 'vitest'
import { STORAGE_KEY, loadExpenses, saveExpenses } from '../storage'
import type { ExpenseRecord } from '../domain'

const record: ExpenseRecord = {
  id: '11111111-1111-4111-8111-111111111111',
  amountCents: 2535,
  category: 'groceries',
  note: 'Nákup',
  date: '2026-09-14',
  time: '13:10',
  createdAt: '2026-09-14T11:10:00.000Z',
  updatedAt: '2026-09-14T11:10:00.000Z',
}

describe('expense storage', () => {
  beforeEach(() => localStorage.clear())

  it('round-trips a versioned envelope', () => {
    saveExpenses([record])
    expect(loadExpenses()).toEqual([record])
  })

  it('does not replace corrupt content while loading', () => {
    localStorage.setItem(STORAGE_KEY, '{broken')
    expect(() => loadExpenses()).toThrow(/poškodené/)
    expect(localStorage.getItem(STORAGE_KEY)).toBe('{broken')
  })

  it('rejects unsupported stored schemas', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ schemaVersion: 9, records: [] }))
    expect(() => loadExpenses()).toThrow(/nepodporovaný/)
  })
})
