import { useEffect, useState } from 'react'

/** Devolve o valor só depois que ele parar de mudar por `delay` ms (evita uma consulta por tecla). */
export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debounced
}
