/** Best-effort localStorage read/write — silently no-ops if unavailable (SSR, private mode, quota). */

export function loadPersisted<T>(key: string): Partial<T> | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as Partial<T>) : null
  } catch {
    return null
  }
}

export function savePersisted<T>(key: string, value: T) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // storage full or disabled — nothing to do
  }
}
