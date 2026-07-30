import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import {
  DEFAULT_SETTINGS,
  SETTINGS_STORAGE_KEY,
  useSettingsStore,
} from '@/stores/settings'
import type { Settings } from '@/types/Settings'

type SchemeListener = (event: MediaQueryListEvent) => void

let prefersDark = false
let schemeListener: SchemeListener | undefined

const createStore = () => {
  setActivePinia(createPinia())
  return useSettingsStore()
}

describe('settings store', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
    document.documentElement.removeAttribute('style')
    prefersDark = false
    schemeListener = undefined

    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockImplementation(() => ({
        matches: prefersDark,
        media: '(prefers-color-scheme: dark)',
        onchange: null,
        addEventListener: (_event: string, listener: SchemeListener) => {
          schemeListener = listener
        },
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    )
  })

  it('hydrates valid settings and persists later updates', async () => {
    const saved: Settings = {
      version: 1,
      theme: 'dark',
      dateFormat: 'D MMMM YYYY',
      weekStartsOn: 0,
      defaultTaskPriority: 'high',
    }
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(saved))
    const store = createStore()

    store.initialize()
    expect(store.settings).toEqual(saved)
    expect(document.documentElement.dataset.theme).toBe('dark')

    store.dateFormat = 'YYYY-MM-DD'
    await nextTick()

    expect(JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY) ?? '{}')).toEqual({
      ...saved,
      dateFormat: 'YYYY-MM-DD',
    })
  })

  it.each([
    ['malformed JSON', '{not json'],
    ['outdated settings', JSON.stringify({ ...DEFAULT_SETTINGS, version: 0 })],
    ['invalid settings', JSON.stringify({ ...DEFAULT_SETTINGS, theme: 'sepia' })],
  ])('falls back to defaults for %s', (_case, storedValue) => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    localStorage.setItem(SETTINGS_STORAGE_KEY, storedValue)
    const store = createStore()

    expect(() => store.initialize()).not.toThrow()
    expect(store.settings).toEqual(DEFAULT_SETTINGS)
  })

  it('resets every preference to its documented default', () => {
    const store = createStore()
    store.initialize()
    store.theme = 'dark'
    store.dateFormat = 'YYYY-MM-DD'
    store.weekStartsOn = 0
    store.defaultTaskPriority = 'high'

    store.reset()

    expect(store.settings).toEqual(DEFAULT_SETTINGS)
  })

  it('follows system theme changes until an explicit theme is selected', async () => {
    prefersDark = true
    const store = createStore()
    store.initialize()

    expect(store.resolvedTheme).toBe('dark')
    expect(document.documentElement.dataset.theme).toBe('dark')

    schemeListener?.({ matches: false } as MediaQueryListEvent)
    await nextTick()
    expect(store.resolvedTheme).toBe('light')

    store.theme = 'dark'
    schemeListener?.({ matches: false } as MediaQueryListEvent)
    await nextTick()
    expect(store.resolvedTheme).toBe('dark')
    expect(document.documentElement.dataset.theme).toBe('dark')
  })
})
