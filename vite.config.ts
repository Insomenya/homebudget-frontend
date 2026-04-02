import { defineConfig, mergeConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const baseConfig = defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3000,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})

async function loadElectronPlugin() {
  const electron = await import('vite-plugin-electron')
  return electron.default([
    {
      entry: 'electron/main.ts',
      onstart({ startup }) {
        startup()
      },
    },
    {
      entry: 'electron/preload.ts',
      onstart({ reload }) {
        reload()
      },
    },
  ])
}

export default process.env.ELECTRON === '1'
  ? defineConfig(async () => {
      const plugins = await Promise.all([loadElectronPlugin()])
      return mergeConfig(baseConfig, {
        plugins,
        base: './',
      })
    })
  : baseConfig