const { contextBridge, ipcRenderer } = require('electron');

// Secure Bridge Exposure to Web App
contextBridge.exposeInMainWorld('electronAPI', {
  sendNotification: (title, body) => ipcRenderer.send('show-notification', { title, body }),
  printToken: (tokenData) => ipcRenderer.send('print-token', tokenData),
  isDesktopApp: true,
  appVersion: '1.0.0'
});
