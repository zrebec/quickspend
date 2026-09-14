import type { ExpenseDraft } from '../domain'
import { ExpenseForm } from './ExpenseForm'

interface NewEntryScreenProps {
  onSave: (draft: ExpenseDraft) => void
}

export function NewEntryScreen({ onSave }: NewEntryScreenProps) {
  return (
    <section className="screen new-entry-screen" aria-labelledby="new-entry-title">
      <header className="screen-header">
        <p className="eyebrow">QuickSpend</p>
        <h1 id="new-entry-title">Nový výdavok</h1>
        <p>Zaberie to len pár sekúnd.</p>
      </header>
      <ExpenseForm
        submitLabel="Hotovo"
        autofocusAmount
        floatingSubmit
        onSubmit={onSave}
      />
    </section>
  )
}
