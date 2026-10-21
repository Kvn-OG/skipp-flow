import { useCallback, useState } from 'react'

export type Preferences = {
  calendarView: 'dayGridMonth' | 'dayGridWeek'
  /** 0 = domingo, 1 = segunda */
  weekStartsOn: 0 | 1
}

const KEY = 'skipp-flow:preferences'
const DEFAULTS: Preferences = { calendarView: 'dayGridMonth', weekStartsOn: 0 }

function read(): Preferences {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? { ...DEFAULTS, ...(JSON.parse(raw) as Partial<Preferences>) } : DEFAULTS
  } catch {
    return DEFAULTS
  }
}

/** Preferências guardadas só neste navegador (localStorage). */
export function usePreferences() {
  const [preferences, setPreferences] = useState<Preferences>(read)

  const update = useCallback((patch: Partial<Preferences>) => {
    setPreferences((current) => {
      const next = { ...current, ...patch }
      try {
        localStorage.setItem(KEY, JSON.stringify(next))
      } catch {
        // Navegador sem armazenamento (ex.: modo privado): vale só nesta sessão.
      }
      return next
    })
  }, [])

  return { preferences, update }
}
