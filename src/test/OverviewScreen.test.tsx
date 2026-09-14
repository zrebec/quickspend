import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { OverviewScreen } from '../components/OverviewScreen'
import type { ExpenseRecord } from '../domain'

describe('OverviewScreen', () => {
  it('shows current-month records and their total', () => {
    const now = new Date()
    const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
    const records: ExpenseRecord[] = [
      {
        id: '11111111-1111-4111-8111-111111111111',
        amountCents: 1000,
        category: 'dining',
        note: 'Obed',
        date,
        time: '12:00',
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      },
      {
        id: '22222222-2222-4222-8222-222222222222',
        amountCents: 255,
        category: 'groceries',
        note: '',
        date,
        time: '09:00',
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      },
    ]

    render(<OverviewScreen records={records} onUpdate={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.getByText(/12,55/)).toBeInTheDocument()
    expect(screen.getByText('Obed')).toBeInTheDocument()
    expect(screen.getByText('Bez poznámky')).toBeInTheDocument()
  })

  it('edits a record with the shared validated form', async () => {
    const user = userEvent.setup()
    const now = new Date()
    const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
    const record: ExpenseRecord = {
      id: '11111111-1111-4111-8111-111111111111',
      amountCents: 1000,
      category: 'dining',
      note: 'Obed',
      date,
      time: '12:00',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    }
    const onUpdate = vi.fn()

    render(<OverviewScreen records={[record]} onUpdate={onUpdate} onDelete={vi.fn()} />)
    await user.click(screen.getByRole('button', { name: 'Upraviť' }))
    const amount = screen.getByRole('textbox', { name: 'Suma' })
    await user.clear(amount)
    await user.type(amount, '11,50')
    await user.click(screen.getByRole('button', { name: 'Uložiť zmeny' }))

    expect(onUpdate).toHaveBeenCalledWith(record, expect.objectContaining({ amount: '11,50' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('deletes only after confirmation', async () => {
    const user = userEvent.setup()
    const now = new Date()
    const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
    const record: ExpenseRecord = {
      id: '11111111-1111-4111-8111-111111111111',
      amountCents: 1000,
      category: 'dining',
      note: 'Obed',
      date,
      time: '12:00',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    }
    const onDelete = vi.fn()
    vi.spyOn(window, 'confirm').mockReturnValue(true)

    render(<OverviewScreen records={[record]} onUpdate={vi.fn()} onDelete={onDelete} />)
    await user.click(screen.getByRole('button', { name: 'Zmazať' }))

    expect(window.confirm).toHaveBeenCalledOnce()
    expect(onDelete).toHaveBeenCalledWith(record)
  })
})
