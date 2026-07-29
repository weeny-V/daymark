type LocalStorageOptions<T> = {
  key: string
  fallback: () => T
  validate: (value: unknown) => value is T
}

const warn = (key: string, message: string, error?: unknown) => {
  console.warn(`[localStorage:${key}] ${message}`, error ?? '')
}

export const useLocalStorage = <T>({
  key,
  fallback,
  validate,
}: LocalStorageOptions<T>) => {
  const get = (): T => {
    try {
      const storedValue = localStorage.getItem(key)

      if (storedValue === null) {
        return fallback()
      }

      const parsedValue: unknown = JSON.parse(storedValue)

      if (!validate(parsedValue)) {
        warn(key, 'Stored data has an unexpected shape; using the fallback value.')
        return fallback()
      }

      return parsedValue
    } catch (error) {
      warn(key, 'Unable to read or parse stored data; using the fallback value.', error)
      return fallback()
    }
  }

  const set = (value: T): boolean => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
      return true
    } catch (error) {
      warn(key, 'Unable to save data.', error)
      return false
    }
  }

  return {
    get,
    set,
  }
}
