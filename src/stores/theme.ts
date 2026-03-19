import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ThemeStore } from '../types/stores'

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      dark: false,
      toggle: () =>
        set((s) => {
          const next = !s.dark
          document.body.classList.toggle('dark', next)
          return { dark: next }
        }),
    }),
    {
      name: 'hb-theme',
      onRehydrateStorage: () => (state) => {
        if (state?.dark) {
          document.body.classList.add('dark')
        }
      },
    },
  ),
)