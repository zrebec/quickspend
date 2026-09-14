import { useMemo, useState } from 'react'
import {
  amountForInput,
  categoryFor,
  expenseSortKey,
  formatCurrency,
  formatExpenseDate,
  type ExpenseDraft,
  type ExpenseRecord,
} from '../domain'
import { ExpenseForm } from './ExpenseForm'

interface OverviewScreenProps {
  records: ExpenseRecord[]
  onUpdate: (record: ExpenseRecord, draft: ExpenseDraft) => void
  onDelete: (record: ExpenseRecord) => void
}

const monthKeyFor = (date = new Date()): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

const shiftMonth = (monthKey: string, offset: number): string => {
  const [year, month] = monthKey.split('-').map(Number)
  return monthKeyFor(new Date(year, month - 1 + offset, 1))
}

const monthLabel = (monthKey: string): string => {
  const [year, month] = monthKey.split('-').map(Number)
  return new Intl.DateTimeFormat('sk-SK', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(year, month - 1, 1))
}

function EditExpenseDialog({
  record,
  onClose,
  onSave,
}: {
  record: ExpenseRecord
  onClose: () => void
  onSave: (draft: ExpenseDraft) => void
}) {
  const draft: ExpenseDraft = {
    amount: amountForInput(record.amountCents),
    category: record.category,
    note: record.note,
    date: record.date,
    time: record.time,
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="edit-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="dialog-header">
          <div>
            <p className="eyebrow">Záznam</p>
            <h2 id="edit-title">Upraviť výdavok</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Zavrieť">
            ×
          </button>
        </header>
        <ExpenseForm initialDraft={draft} submitLabel="Uložiť zmeny" onSubmit={onSave} onCancel={onClose} />
      </section>
    </div>
  )
}

export function OverviewScreen({ records, onUpdate, onDelete }: OverviewScreenProps) {
  const [month, setMonth] = useState(() => monthKeyFor())
  const [editing, setEditing] = useState<ExpenseRecord | null>(null)

  const visibleRecords = useMemo(
    () =>
      records
        .filter((record) => record.date.startsWith(month))
        .sort((left, right) => expenseSortKey(right).localeCompare(expenseSortKey(left))),
    [month, records],
  )
  const total = visibleRecords.reduce((sum, record) => sum + record.amountCents, 0)

  const remove = (record: ExpenseRecord) => {
    if (window.confirm(`Naozaj chceš zmazať výdavok ${formatCurrency(record.amountCents)}?`)) {
      onDelete(record)
    }
  }

  return (
    <section className="screen overview-screen" aria-labelledby="overview-title">
      <header className="screen-header compact">
        <p className="eyebrow">Tvoje financie</p>
        <h1 id="overview-title">Prehľad výdavkov</h1>
      </header>

      <div className="month-card">
        <div className="month-switcher">
          <button
            className="icon-button"
            type="button"
            onClick={() => setMonth((current) => shiftMonth(current, -1))}
            aria-label="Predchádzajúci mesiac"
          >
            ‹
          </button>
          <strong>{monthLabel(month)}</strong>
          <button
            className="icon-button"
            type="button"
            onClick={() => setMonth((current) => shiftMonth(current, 1))}
            aria-label="Nasledujúci mesiac"
          >
            ›
          </button>
        </div>
        <p>Spolu za mesiac</p>
        <output>{formatCurrency(total)}</output>
      </div>

      {visibleRecords.length === 0 ? (
        <div className="empty-state">
          <span aria-hidden="true">🧾</span>
          <h2>Zatiaľ bez výdavkov</h2>
          <p>V tomto mesiaci ešte nemáš žiadny záznam.</p>
        </div>
      ) : (
        <div className="expense-table-wrap">
          <table className="expense-table">
            <thead>
              <tr>
                <th>Dátum</th>
                <th>Kategória</th>
                <th>Suma</th>
              </tr>
            </thead>
            <tbody>
              {visibleRecords.map((record) => {
                const category = categoryFor(record.category)
                return (
                  <tr className="expense-record" key={record.id}>
                    <td>{formatExpenseDate(record)}</td>
                    <td><span aria-hidden="true">{category.emoji}</span> {category.label}</td>
                    <td><strong>{formatCurrency(record.amountCents)}</strong></td>
                  </tr>
                )
              }).flatMap((firstRow, index) => {
                const record = visibleRecords[index]
                return [
                  firstRow,
                  <tr className="expense-note" key={`${record.id}-note`}>
                    <td colSpan={3}>
                      <span className={record.note ? '' : 'muted'}>
                        {record.note || 'Bez poznámky'}
                      </span>
                      <span className="row-actions">
                        <button type="button" onClick={() => setEditing(record)}>Upraviť</button>
                        <button className="danger-link" type="button" onClick={() => remove(record)}>
                          Zmazať
                        </button>
                      </span>
                    </td>
                  </tr>,
                ]
              })}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <EditExpenseDialog
          record={editing}
          onClose={() => setEditing(null)}
          onSave={(draft) => {
            onUpdate(editing, draft)
            setEditing(null)
          }}
        />
      )}
    </section>
  )
}
