const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')

// Required for running as root or in headless/sandbox-less environments.
// These must be set before app.whenReady().
app.commandLine.appendSwitch('no-sandbox')
app.commandLine.appendSwitch('disable-gpu')
app.commandLine.appendSwitch('disable-software-rasterizer')

// Detect dev mode: app.isPackaged is false when running via `electron .`
const isDev = !app.isPackaged

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'Libra Flota',
    icon: path.join(__dirname, 'assets', 'icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      devTools: isDev,
    },
  })

  if (isDev) {
    win.loadURL('http://localhost:5173')
    win.webContents.openDevTools()
  } else {
    win.loadFile(path.join(__dirname, 'dist', 'index.html'))
  }
}

app.whenReady().then(() => {
  createWindow()

  // macOS: re-create window when dock icon is clicked and no windows are open
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Windows/Linux: quit when all windows are closed
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// --- IPC Handlers ---

ipcMain.handle('fleet:getVehicles', async () => {
  return [
    { id: 1, plate: 'ABC-1234', model: 'Volvo FH16',        driver: 'Carlos Pérez', status: 'active',      km: 145200 },
    { id: 2, plate: 'DEF-5678', model: 'Mercedes Actros',   driver: 'Luis Gómez',   status: 'maintenance', km: 89300  },
    { id: 3, plate: 'GHI-9012', model: 'Scania R500',       driver: 'Ana Torres',   status: 'active',      km: 212000 },
    { id: 4, plate: 'JKL-3456', model: 'MAN TGX',           driver: 'Pedro Ruiz',   status: 'inactive',    km: 67800  },
  ]
})

ipcMain.handle('fleet:updateVehicleStatus', async (_event, { id, status }) => {
  console.log(`[main] Vehicle ${id} → ${status}`)
  return { success: true, id, status }
})

ipcMain.handle('app:getVersion', async () => {
  return app.getVersion()
})
