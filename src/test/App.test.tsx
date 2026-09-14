import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../App'
import { STORAGE_KEY } from '../storage'

vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: () => ({
    offlineReady: [false, vi.fn()],
    needRefresh: [false, vi.fn()],
    updateServiceWorker: vi.fn(),
  }),
}))

describe('QuickSpend app flow', () => {
  beforeEach(() => localStorage.clear())

  it('starts on entry, saves locally, and opens the overview', async () => {
    const user = userEvent.setup()
    render(<App />)

    expect(screen.getByRole('heading', { name: 'Nový výdavok' })).toBeInTheDocument()
    await user.type(screen.getByRole('textbox', { name: 'Suma' }), '8,90')
    await user.type(screen.getByRole('textbox', { name: /Poznámka/ }), 'Desiata')
    await user.click(screen.getByRole('button', { name: 'Uložiť výdavok' }))

    expect(screen.getByRole('heading', { name: 'Prehľad výdavkov' })).toBeInTheDocument()
    expect(screen.getByText('Desiata')).toBeInTheDocument()
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}').records).toHaveLength(1)
  })

  it('switches theme and persists the choice', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Zapnúť tmavú tému' }))

    expect(document.documentElement).toHaveAttribute('data-theme', 'dark')
    expect(localStorage.getItem('quickspend:theme')).toBe('dark')
    expect(screen.getByRole('button', { name: 'Zapnúť svetlú tému' })).toBeInTheDocument()
  })
})
