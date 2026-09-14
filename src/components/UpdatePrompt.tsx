import { useRegisterSW } from 'virtual:pwa-register/react'

export function UpdatePrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  if (!offlineReady && !needRefresh) return null

  return (
    <aside className="update-prompt" role="status">
      <p>
        {offlineReady
          ? 'QuickSpend je pripravený fungovať offline.'
          : 'Je dostupná nová verzia QuickSpend.'}
      </p>
      <div>
        {needRefresh && (
          <button type="button" onClick={() => void updateServiceWorker(true)}>Aktualizovať</button>
        )}
        <button
          type="button"
          onClick={() => {
            setOfflineReady(false)
            setNeedRefresh(false)
          }}
        >
          Zavrieť
        </button>
      </div>
    </aside>
  )
}
