export type Theme = 'light' | 'dark'

export const THEME_STORAGE_KEY = 'quickspend:theme'

export function loadTheme(storage: Storage = localStorage): Theme {
  const stored = storage.getItem(THEME_STORAGE_KEY)
  if (stored === 'light' || stored === 'dark') return stored
  return typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

export function saveTheme(theme: Theme, storage: Storage = localStorage): void {
  try {
    storage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    // The theme remains usable for this session even when storage is unavailable.
  }
}

export function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', theme === 'dark' ? '#000000' : '#0006a8')
}
