import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ExpenseForm } from '../components/ExpenseForm'

describe('ExpenseForm', () => {
  it('defaults to groceries and focuses a decimal amount input', () => {
    render(<ExpenseForm submitLabel="Uložiť" autofocusAmount onSubmit={vi.fn()} />)

    expect(screen.getByRole('radio', { name: /Potraviny/ })).toBeChecked()
    const amount = screen.getByRole('textbox', { name: 'Suma' })
    expect(amount).toHaveAttribute('inputmode', 'decimal')
    expect(amount).toHaveFocus()
  })

  it('submits entered values', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<ExpenseForm submitLabel="Uložiť" onSubmit={onSubmit} />)

    await user.type(screen.getByRole('textbox', { name: 'Suma' }), '12,50')
    await user.type(screen.getByRole('textbox', { name: /Poznámka/ }), 'Obed')
    await user.click(screen.getByRole('button', { name: 'Uložiť' }))

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
      amount: '12,50',
      category: 'groceries',
      note: 'Obed',
    }))
  })

  it('can render an always-visible Done action with a checkmark', () => {
    render(
      <ExpenseForm
        submitLabel="Hotovo"
        floatingSubmit
        onSubmit={vi.fn()}
      />,
    )

    const submit = screen.getByRole('button', { name: 'Uložiť výdavok' })
    expect(submit).toHaveClass('floating-save')
    expect(submit).toHaveTextContent('✓')
    expect(submit).toHaveTextContent('Hotovo')
  })
})
