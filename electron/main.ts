import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'path'

declare const __dirname: string

const VITE_DIST = path.join(__dirname, '../dist')
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
const BACKEND_URL = process.env['BACKEND_URL'] ?? 'http://localhost:8080'

function createWindow() {
  const win = new BrowserWindow({
    frame: false,
    width: 1200,
    height: 800,
    icon: path.join(VITE_DIST, 'favicon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  })

  ipcMain.on('win-minimize', () => win.minimize())
  ipcMain.on('win-maximize', () => {
    if (win.isMaximized()) win.unmaximize()
    else win.maximize()
  })
  ipcMain.on('win-close', () => win.close())

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
    win.webContents.openDevTools()
  } else {
    win.loadFile(path.join(VITE_DIST, 'index.html'))
  }
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
