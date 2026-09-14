import { useEffect, useRef, useState, type FormEvent } from 'react'
import {
  CATEGORIES,
  localDateTimeParts,
  type ExpenseDraft,
} from '../domain'

interface ExpenseFormProps {
  initialDraft?: ExpenseDraft
  submitLabel: string
  autofocusAmount?: boolean
  floatingSubmit?: boolean
  onSubmit: (draft: ExpenseDraft) => void
  onCancel?: () => void
}

const freshDraft = (): ExpenseDraft => ({
  amount: '',
  category: 'groceries',
  note: '',
  ...localDateTimeParts(),
})

export function ExpenseForm({
  initialDraft,
  submitLabel,
  autofocusAmount = false,
  floatingSubmit = false,
  onSubmit,
  onCancel,
}: ExpenseFormProps) {
  const [draft, setDraft] = useState<ExpenseDraft>(() => initialDraft ?? freshDraft())
  const [error, setError] = useState('')
  const amountRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (autofocusAmount) amountRef.current?.focus({ preventScroll: true })
  }, [autofocusAmount])

  const update = <Key extends keyof ExpenseDraft>(key: Key, value: ExpenseDraft[Key]) => {
    setDraft((current) => ({ ...current, [key]: value }))
    setError('')
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    try {
      onSubmit(draft)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Záznam sa nepodarilo uložiť.')
    }
  }

  return (
    <form className="expense-form" onSubmit={submit} noValidate>
      <fieldset className="category-fieldset">
        <legend>Kategória</legend>
        <div className="category-grid">
          {CATEGORIES.map((category) => (
            <label
              className={`category-option ${draft.category === category.id ? 'selected' : ''}`}
              key={category.id}
            >
              <input
                type="radio"
                name="category"
                value={category.id}
                checked={draft.category === category.id}
                onChange={() => update('category', category.id)}
              />
              <span className="category-emoji" aria-hidden="true">{category.emoji}</span>
              <span>{category.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <label className="field amount-field">
        <span>Suma</span>
        <span className="amount-input-wrap">
          <input
            ref={amountRef}
            name="amount"
            type="text"
            inputMode="decimal"
            enterKeyHint="next"
            autoComplete="off"
            placeholder="0,00"
            value={draft.amount}
            onChange={(event) => update('amount', event.target.value)}
            aria-describedby={error ? 'form-error' : undefined}
          />
          <span aria-hidden="true">€</span>
        </span>
      </label>

      <label className="field">
        <span>Poznámka <small>{draft.note.length}/64</small></span>
        <input
          name="note"
          type="text"
          maxLength={64}
          autoComplete="off"
          placeholder="Napr. týždenný nákup"
          value={draft.note}
          onChange={(event) => update('note', event.target.value)}
        />
      </label>

      <div className="date-time-row">
        <label className="field">
          <span>Dátum</span>
          <input
            name="date"
            type="date"
            value={draft.date}
            onChange={(event) => update('date', event.target.value)}
          />
        </label>
        <label className="field">
          <span>Čas</span>
          <input
            name="time"
            type="time"
            value={draft.time}
            onChange={(event) => update('time', event.target.value)}
          />
        </label>
      </div>

      {error && <p className="form-error" id="form-error" role="alert">{error}</p>}

      <div className="form-actions">
        {onCancel && (
          <button className="button secondary" type="button" onClick={onCancel}>
            Zrušiť
          </button>
        )}
        <button
          className={`button primary save-button ${floatingSubmit ? 'floating-save' : ''}`}
          type="submit"
          aria-label={floatingSubmit ? 'Uložiť výdavok' : undefined}
        >
          {floatingSubmit && <span className="done-check" aria-hidden="true">✓</span>}
          <span>{submitLabel}</span>
        </button>
      </div>
    </form>
  )
}
