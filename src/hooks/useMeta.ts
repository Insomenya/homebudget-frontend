import { useEffect } from 'react'
import { useMetaStore } from '../stores/meta'

export const useMeta = () => {
  const { meta, load, label } = useMetaStore()

  useEffect(() => { load() }, [load])

  return { meta, label }
}