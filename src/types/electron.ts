export interface ElectronAPI {
  getBackendUrl: () => string
  isElectron: boolean
  minimize: () => void
  maximize: () => void
  close: () => void
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI
  }
}
