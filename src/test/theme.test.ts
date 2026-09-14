import { beforeEach, describe, expect, it, vi } from 'vitest'
import { applyTheme, loadTheme, saveTheme, THEME_STORAGE_KEY } from '../theme'

describe('theme preferences', () => {
  beforeEach(() => {
    localStorage.clear()
    delete document.documentElement.dataset.theme
  })

  it('loads and saves an explicit preference', () => {
    saveTheme('dark')
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark')
    expect(loadTheme()).toBe('dark')
  })

  it('falls back to the system preference', () => {
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn(() => ({ matches: true }) as MediaQueryList),
    })
    expect(loadTheme()).toBe('dark')
  })

  it('applies the theme to the document root', () => {
    const themeColor = document.createElement('meta')
    themeColor.name = 'theme-color'
    document.head.appendChild(themeColor)
    applyTheme('light')
    expect(document.documentElement.dataset.theme).toBe('light')
    expect(themeColor).toHaveAttribute('content', '#002da9')
    themeColor.remove()
  })
})
