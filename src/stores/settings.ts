import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { useLocalStorage } from '@/shared/hooks/useLocalStorage'
import type {
  DateFormat,
  Settings,
  ThemePreference,
  WeekStartsOn,
} from '@/types/Settings'
import type { TaskPriority } from '@/types/Task'

export const SETTINGS_STORAGE_KEY = 'daymark.settings'

export const DEFAULT_SETTINGS: Settings = {
  version: 1,
  theme: 'system',
  dateFormat: 'MMMM D, YYYY',
  weekStartsOn: 1,
  defaultTaskPriority: 'medium',
}

const themes: ThemePreference[] = ['light', 'dark', 'system']
const dateFormats: DateFormat[] = ['MMMM D, YYYY', 'D MMMM YYYY', 'YYYY-MM-DD']
const weekStarts: WeekStartsOn[] = [0, 1]
const priorities: TaskPriority[] = ['low', 'medium', 'high']

const isSettings = (value: unknown): value is Settings => {
  if (typeof value !== 'object' || value === null) return false

  const settings = value as Record<string, unknown>

  return (
    settings.version === 1 &&
    themes.includes(settings.theme as ThemePreference) &&
    dateFormats.includes(settings.dateFormat as DateFormat) &&
    weekStarts.includes(settings.weekStartsOn as WeekStartsOn) &&
    priorities.includes(settings.defaultTaskPriority as TaskPriority)
  )
}

const createDefaults = (): Settings => ({ ...DEFAULT_SETTINGS })

const getSystemTheme = (): 'light' | 'dark' =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'

export const useSettingsStore = defineStore('settings', () => {
  const storage = useLocalStorage<Settings>({
    key: SETTINGS_STORAGE_KEY,
    fallback: createDefaults,
    validate: isSettings,
  })
  const settings = ref<Settings>(createDefaults())
  const systemTheme = ref<'light' | 'dark'>(getSystemTheme())
  let initialized = false

  const theme = computed({
    get: () => settings.value.theme,
    set: (value: ThemePreference) => {
      settings.value.theme = value
    },
  })
  const dateFormat = computed({
    get: () => settings.value.dateFormat,
    set: (value: DateFormat) => {
      settings.value.dateFormat = value
    },
  })
  const weekStartsOn = computed({
    get: () => settings.value.weekStartsOn,
    set: (value: WeekStartsOn) => {
      settings.value.weekStartsOn = value
    },
  })
  const defaultTaskPriority = computed({
    get: () => settings.value.defaultTaskPriority,
    set: (value: TaskPriority) => {
      settings.value.defaultTaskPriority = value
    },
  })
  const resolvedTheme = computed(() =>
    theme.value === 'system' ? systemTheme.value : theme.value,
  )

  const applyTheme = () => {
    if (typeof document === 'undefined') return

    document.documentElement.dataset.theme = resolvedTheme.value
    document.documentElement.style.colorScheme = resolvedTheme.value
  }

  const reset = () => {
    settings.value = createDefaults()
  }

  const initialize = () => {
    if (initialized) return

    settings.value = storage.get()

    watch(settings, (value) => storage.set(value), { deep: true })
    watch(resolvedTheme, applyTheme, { immediate: true })

    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      const colorScheme = window.matchMedia('(prefers-color-scheme: dark)')
      colorScheme.addEventListener('change', (event) => {
        systemTheme.value = event.matches ? 'dark' : 'light'
      })
    }

    initialized = true
  }

  return {
    applyTheme,
    dateFormat,
    defaultTaskPriority,
    initialize,
    reset,
    resolvedTheme,
    settings,
    theme,
    weekStartsOn,
  }
})
