const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const { spawn } = require('child_process')

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

// Launch `openclaw chat` in the user's default terminal. Requires OpenClaw
// installed globally (see scripts/install-openclaw.sh).
ipcMain.handle('openclaw:launchChat', async () => {
  const platform = process.platform
  try {
    if (platform === 'darwin') {
      spawn('osascript', [
        '-e',
        'tell application "Terminal" to do script "openclaw chat"',
        '-e',
        'tell application "Terminal" to activate',
      ], { detached: true, stdio: 'ignore' }).unref()
    } else if (platform === 'win32') {
      spawn('cmd.exe', ['/c', 'start', '""', 'cmd', '/K', 'openclaw chat'], {
        detached: true,
        stdio: 'ignore',
        shell: false,
      }).unref()
    } else {
      const candidates = [
        ['gnome-terminal', ['--', 'bash', '-c', 'openclaw chat; exec bash']],
        ['konsole', ['-e', 'bash', '-c', 'openclaw chat; exec bash']],
        ['xfce4-terminal', ['-e', 'bash -c "openclaw chat; exec bash"']],
        ['xterm', ['-e', 'bash', '-c', 'openclaw chat; exec bash']],
      ]
      let lastErr = null
      for (const [cmd, args] of candidates) {
        try {
          spawn(cmd, args, { detached: true, stdio: 'ignore' }).unref()
          lastErr = null
          break
        } catch (err) {
          lastErr = err
        }
      }
      if (lastErr) throw lastErr
    }
    return { success: true }
  } catch (err) {
    console.error('[main] openclaw:launchChat failed:', err)
    return { success: false, error: err.message }
  }
})
