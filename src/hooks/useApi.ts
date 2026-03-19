import { useState, useEffect, useCallback } from 'react'

type MutatorFn<TArgs extends unknown[], TResult> = (...args: TArgs) => Promise<TResult>

export const useApiData = <T>(
  fetcher: () => Promise<T | null>,
  deps: unknown[] = [],
) => {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await fetcher()
      setData(result)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, deps)

  useEffect(() => { load() }, [load])

  return { data, loading, error, reload: load, setData }
}

export const useMutation = <TArgs extends unknown[], TResult>(
  mutator: MutatorFn<TArgs, TResult>,
) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const run = useCallback(
    async (...args: TArgs): Promise<TResult> => {
      setLoading(true)
      setError(null)
      try {
        return await mutator(...args)
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        setError(msg)
        throw e
      } finally {
        setLoading(false)
      }
    },
    [mutator],
  )

  return { run, loading, error }
}