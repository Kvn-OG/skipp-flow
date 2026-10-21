import { useCallback, useEffect, useRef, useState, type DependencyList } from 'react'
import { errorMessage } from '../lib/errors'

type AsyncState<T> = {
  data: T | undefined
  error: string | null
  loading: boolean
}

/**
 * Executa uma função assíncrona (normalmente um serviço que consulta o
 * banco) sempre que as dependências mudam, e expõe carregando/erro/dados.
 * reload() busca de novo; setData() permite atualizar a tela na hora
 * (atualização otimista) sem esperar uma nova consulta.
 */
export function useAsync<T>(fn: () => Promise<T>, deps: DependencyList) {
  const [state, setState] = useState<AsyncState<T>>({ data: undefined, error: null, loading: true })
  const [version, setVersion] = useState(0)
  const fnRef = useRef(fn)
  fnRef.current = fn

  useEffect(() => {
    let active = true
    setState((s) => ({ ...s, loading: true, error: null }))

    fnRef
      .current()
      .then((data) => active && setState({ data, error: null, loading: false }))
      .catch((error: unknown) => active && setState((s) => ({ ...s, error: errorMessage(error), loading: false })))

    // Se o componente sair da tela ou os filtros mudarem antes da resposta,
    // a resposta antiga é ignorada.
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, version])

  const reload = useCallback(() => setVersion((v) => v + 1), [])
  const setData = useCallback((update: (current: T | undefined) => T | undefined) => {
    setState((s) => ({ ...s, data: update(s.data) }))
  }, [])

  return { ...state, reload, setData }
}
