import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { TransferScreen } from '../components/TransferScreen'

describe('TransferScreen', () => {
  it('validates a selected file and returns the merged records with a summary', async () => {
    const user = userEvent.setup()
    const onImport = vi.fn()
    const content = JSON.stringify({
      format: 'quickspend',
      schemaVersion: 1,
      appVersion: '0.0.1',
      currency: 'EUR',
      exportedAt: '2026-09-14T12:00:00.000Z',
      records: [
        {
          id: '11111111-1111-4111-8111-111111111111',
          amount: '4.20',
          category: 'health',
          note: 'Lekáreň',
          date: '2026-09-14',
          time: '12:00',
        },
      ],
    })
    const file = new File([content], 'backup.json', { type: 'application/json' })
    Object.defineProperty(file, 'text', { value: async () => content })

    render(<TransferScreen records={[]} onImport={onImport} />)
    await user.upload(screen.getByLabelText('Vybrať JSON súbor na import'), file)

    expect(onImport).toHaveBeenCalledWith(
      [expect.objectContaining({ amountCents: 420, category: 'health', note: 'Lekáreň' })],
      'Pridané: 1, aktualizované: 0, bez zmeny: 0.',
    )
    expect(screen.getByText(/Pridané: 1/)).toBeInTheDocument()
  })
})
