import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import type { ExpenseRecord } from '../domain'
import { createExport, mergeImport } from '../importExport'
import {
  checkStoragePersistence,
  requestPersistentStorage,
  type StoragePersistenceStatus,
} from '../storagePersistence'

interface TransferScreenProps {
  records: ExpenseRecord[]
  onImport: (records: ExpenseRecord[], summary: string) => void
  rawRecoveryData?: string | null
}

const downloadText = (content: string, filename: string, type = 'application/json') => {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

const fileDate = (): string => new Date().toISOString().slice(0, 10)

type PersistenceViewStatus = StoragePersistenceStatus | 'checking' | 'requesting'

export function TransferScreen({ records, onImport, rawRecoveryData }: TransferScreenProps) {
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [persistenceStatus, setPersistenceStatus] = useState<PersistenceViewStatus>('checking')
  const [persistenceRequested, setPersistenceRequested] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const recoveryMode = rawRecoveryData !== null && rawRecoveryData !== undefined

  useEffect(() => {
    let active = true
    void checkStoragePersistence().then((status) => {
      if (active) setPersistenceStatus(status)
    })
    return () => {
      active = false
    }
  }, [])

  const protectStorage = async () => {
    setPersistenceStatus('requesting')
    const status = await requestPersistentStorage()
    setPersistenceRequested(true)
    setPersistenceStatus(status)
  }

  const persistenceMessage = (() => {
    if (persistenceStatus === 'checking') return 'Kontrolujem ochranu lokálnych dát.'
    if (persistenceStatus === 'requesting') return 'Žiadam prehliadač o zvýšenú ochranu dát.'
    if (persistenceStatus === 'persistent') {
      return 'Prehliadač chráni lokálne dáta pred automatickým uvoľnením úložiska. Export zostáva najistejšou zálohou.'
    }
    if (persistenceStatus === 'unsupported') {
      return 'Tento prehliadač nevie zvýšenú ochranu potvrdiť. Pravidelne exportuj zálohu.'
    }
    return persistenceRequested
      ? 'Prehliadač ochranu zatiaľ nepovolil. Dáta zostávajú uložené, pravidelne ich exportuj.'
      : 'Prehliadač môže dáta pri nedostatku miesta odstrániť. Môžeš požiadať o zvýšenú ochranu.'
  })()

  const exportData = () => {
    const content = JSON.stringify(createExport(records), null, 2)
    downloadText(content, `quickspend-${fileDate()}.json`)
    setMessage({ type: 'success', text: `Exportovaných záznamov: ${records.length}.` })
  }

  const importData = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Súbor je príliš veľký. Maximum je 5 MB.' })
      return
    }

    try {
      const result = mergeImport(await file.text(), records)
      const summary = `Pridané: ${result.added}, aktualizované: ${result.updated}, bez zmeny: ${result.unchanged}.`
      onImport(result.records, summary)
      setMessage({ type: 'success', text: summary })
    } catch (caught) {
      setMessage({
        type: 'error',
        text: caught instanceof Error ? caught.message : 'Import sa nepodaril.',
      })
    }
  }

  return (
    <section className="screen transfer-screen" aria-labelledby="transfer-title">
      <header className="screen-header compact">
        <p className="eyebrow">Tvoje dáta</p>
        <h1 id="transfer-title">Export a import</h1>
        <p>Zálohuj ich alebo prenes do iného zariadenia.</p>
      </header>

      <article className="transfer-card">
        <span className="card-icon" aria-hidden="true">↓</span>
        <div>
          <h2>Exportovať JSON</h2>
          <p>Stiahne všetkých {records.length} záznamov v čitateľnom formáte.</p>
        </div>
        <button className="button primary" type="button" onClick={exportData} disabled={recoveryMode}>
          Stiahnuť zálohu
        </button>
      </article>

      <article className="transfer-card">
        <span className="card-icon" aria-hidden="true">↑</span>
        <div>
          <h2>Importovať JSON</h2>
          <p>Najskôr overíme celý súbor. Existujúce dáta sa pri chybe nezmenia.</p>
        </div>
        <input
          ref={inputRef}
          className="visually-hidden"
          type="file"
          accept="application/json,.json"
          onChange={importData}
          disabled={recoveryMode}
          aria-label="Vybrať JSON súbor na import"
        />
        <button
          className="button secondary"
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={recoveryMode}
        >
          Vybrať súbor
        </button>
      </article>

      <article className="transfer-card">
        <span className="card-icon" aria-hidden="true">◈</span>
        <div>
          <h2>Ochrana úložiska</h2>
          <p aria-live="polite">{persistenceMessage}</p>
        </div>
        {persistenceStatus === 'best-effort' && (
          <button className="button secondary" type="button" onClick={protectStorage}>
            {persistenceRequested ? 'Skúsiť znova' : 'Chrániť lokálne dáta'}
          </button>
        )}
        {persistenceStatus === 'requesting' && (
          <button className="button secondary" type="button" disabled>
            Kontrolujem…
          </button>
        )}
      </article>

      {recoveryMode && (
        <article className="transfer-card recovery-card">
          <span className="card-icon" aria-hidden="true">!</span>
          <div>
            <h2>Záchranná kópia</h2>
            <p>Uložené dáta sú poškodené. Stiahni ich pred manuálnou opravou úložiska.</p>
          </div>
          <button
            className="button secondary"
            type="button"
            onClick={() => downloadText(rawRecoveryData, `quickspend-recovery-${fileDate()}.txt`, 'text/plain')}
          >
            Stiahnuť pôvodné dáta
          </button>
        </article>
      )}

      {message && (
        <p className={`status-message ${message.type}`} role="status">
          {message.text}
        </p>
      )}

      <p className="version">QuickSpend v{__APP_VERSION__} · dáta zostávajú v tomto zariadení</p>
    </section>
  )
}
