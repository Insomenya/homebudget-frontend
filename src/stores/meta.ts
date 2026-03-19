import { create } from 'zustand'
import type { Meta } from '../types'
import api from '../api/client'

interface MetaStore {
  meta: Meta | null
  loading: boolean
  load: () => Promise<void>
  reload: () => Promise<void>
  label: (group: keyof Meta, value: string) => string
}

export const useMetaStore = create<MetaStore>((set, get) => ({
  meta: null,
  loading: false,

  load: async () => {
    if (get().meta || get().loading) return
    set({ loading: true })
    try {
      const meta = await api.meta()
      set({ meta, loading: false })
    } catch {
      set({ loading: false })
    }
  },

  reload: async () => {
    set({ loading: true })
    try {
      const meta = await api.meta()
      set({ meta, loading: false })
    } catch {
      set({ loading: false })
    }
  },

  label: (group, value) => {
    const m = get().meta
    if (!m) return value
    const options = m[group]
    return options?.find((o) => o.value === value)?.label ?? value
  },
}))