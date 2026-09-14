import { useLayoutEffect, useState } from 'react'
import type { ExpenseDraft, ExpenseRecord } from './domain'
import { createExpense, loadExpenses, readRawStorage, saveExpenses, updateExpense } from './storage'
import { NewEntryScreen } from './components/NewEntryScreen'
import { OverviewScreen } from './components/OverviewScreen'
import { TransferScreen } from './components/TransferScreen'
import { UpdatePrompt } from './components/UpdatePrompt'
import { applyTheme, loadTheme, saveTheme, type Theme } from './theme'
import { requestPersistentStorage } from './storagePersistence'

type Screen = 'new' | 'overview' | 'transfer'

const initialData = (): { records: ExpenseRecord[]; error: string; raw: string | null } => {
  try {
    return { records: loadExpenses(), error: '', raw: null }
  } catch (caught) {
    return {
      records: [],
      error: caught instanceof Error ? caught.message : 'Uložené dáta sa nepodarilo načítať.',
      raw: readRawStorage(),
    }
  }
}

const tabs: Array<{ id: Screen; label: string; icon: string }> = [
  { id: 'new', label: 'Nový', icon: '+' },
  { id: 'overview', label: 'Prehľad', icon: '▥' },
  { id: 'transfer', label: 'Dáta', icon: '⇅' },
]

export default function App() {
  const [loaded] = useState(initialData)
  const [records, setRecords] = useState(loaded.records)
  const [storageError, setStorageError] = useState(loaded.error)
  const [recoveryData] = useState(loaded.raw)
  const [screen, setScreen] = useState<Screen>('new')
  const [toast, setToast] = useState('')
  const [theme, setTheme] = useState<Theme>(loadTheme)

  useLayoutEffect(() => {
    applyTheme(theme)
    saveTheme(theme)
  }, [theme])

  const commit = (next: ExpenseRecord[]) => {
    if (storageError) throw new Error(storageError)
    try {
      saveExpenses(next)
      setRecords(next)
      void requestPersistentStorage()
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Dáta sa nepodarilo uložiť.'
      setStorageError(message)
      throw new Error(message, { cause: caught })
    }
  }

  const add = (draft: ExpenseDraft) => {
    commit([...records, createExpense(draft)])
    setToast('Výdavok je uložený.')
    setScreen('overview')
  }

  const update = (record: ExpenseRecord, draft: ExpenseDraft) => {
    commit(records.map((item) => (item.id === record.id ? updateExpense(item, draft) : item)))
    setToast('Zmeny sú uložené.')
  }

  const remove = (record: ExpenseRecord) => {
    commit(records.filter((item) => item.id !== record.id))
    setToast('Výdavok bol zmazaný.')
  }

  return (
    <div className="app-shell">
      <button
        className="theme-toggle"
        type="button"
        aria-label={theme === 'light' ? 'Zapnúť tmavú tému' : 'Zapnúť svetlú tému'}
        title={theme === 'light' ? 'Tmavá téma' : 'Svetlá téma'}
        onClick={() => setTheme((current) => (current === 'light' ? 'dark' : 'light'))}
      >
        <span aria-hidden="true">{theme === 'light' ? '☾' : '☀'}</span>
      </button>
      {storageError && (
        <div className="data-alert" role="alert">
          <strong>Dáta sú uzamknuté.</strong> {storageError} Záchrannú kópiu nájdeš v časti Dáta.
        </div>
      )}

      <main className="main-content">
        {screen === 'new' && <NewEntryScreen onSave={add} />}
        {screen === 'overview' && (
          <OverviewScreen records={records} onUpdate={update} onDelete={remove} />
        )}
        {screen === 'transfer' && (
          <TransferScreen
            records={records}
            rawRecoveryData={recoveryData}
            onImport={(next, summary) => {
              commit(next)
              setToast(summary)
            }}
          />
        )}
      </main>

      <nav className="bottom-nav" aria-label="Hlavná navigácia">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={screen === tab.id ? 'active' : ''}
            type="button"
            onClick={() => {
              setScreen(tab.id)
              setToast('')
            }}
            aria-current={screen === tab.id ? 'page' : undefined}
          >
            <span aria-hidden="true">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </nav>

      {toast && (
        <button className="toast" type="button" onClick={() => setToast('')} aria-label="Zavrieť správu">
          {toast}
        </button>
      )}
      <UpdatePrompt />
    </div>
  )
}
