const { contextBridge, ipcRenderer } = require('electron')

// Expose a controlled API to the renderer (React app).
// Only explicitly listed channels are accessible.
contextBridge.exposeInMainWorld('electronAPI', {
  // Fleet data
  getVehicles: () => ipcRenderer.invoke('fleet:getVehicles'),
  updateVehicleStatus: (id, status) =>
    ipcRenderer.invoke('fleet:updateVehicleStatus', { id, status }),

  // App metadata
  getVersion: () => ipcRenderer.invoke('app:getVersion'),

  // Platform info
  platform: process.platform,
})
