const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Settings
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),

  // API
  apiRequest: (params) => ipcRenderer.invoke('api-request', params),

  // File system
  readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
});
