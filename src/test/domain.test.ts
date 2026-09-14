import { describe, expect, it } from 'vitest'
import { CATEGORIES, isCategory, isValidLocalDateTime, parseAmountToCents, validateDraft } from '../domain'

describe('parseAmountToCents', () => {
  it.each([
    ['25', 2500],
    ['25,25', 2525],
    ['25.35', 2535],
    ['0,01', 1],
  ])('normalizes %s to integer cents', (value, expected) => {
    expect(parseAmountToCents(value)).toEqual({ ok: true, value: expected })
  })

  it.each(['', '0', '-1', '2.345', '1,2.3', 'text'])('rejects invalid amount %s', (value) => {
    expect(parseAmountToCents(value).ok).toBe(false)
  })
})

describe('date and draft validation', () => {
  it('round-trips valid local date and time', () => {
    expect(isValidLocalDateTime('2024-02-29', '23:59')).toBe(true)
    expect(isValidLocalDateTime('2023-02-29', '23:59')).toBe(false)
    expect(isValidLocalDateTime('2024-01-01', '24:00')).toBe(false)
  })

  it('enforces the 64-character note limit', () => {
    const base = {
      amount: '1',
      category: 'groceries' as const,
      date: '2026-09-14',
      time: '13:10',
    }
    expect(validateDraft({ ...base, note: 'a'.repeat(64) }).ok).toBe(true)
    expect(validateDraft({ ...base, note: 'a'.repeat(65) }).ok).toBe(false)
  })
})

describe('categories', () => {
  it('contains all nine selectable categories', () => {
    expect(CATEGORIES).toHaveLength(9)
    expect(isCategory('entertainment')).toBe(true)
    expect(isCategory('recurring')).toBe(true)
    expect(isCategory('other')).toBe(true)
  })
})
