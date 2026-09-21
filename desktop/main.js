const { app, BrowserWindow, Menu, Tray, ipcMain, Notification } = require('electron');
const path = require('path');
const http = require('http');

let mainWindow = null;
let appTray = null;

// Target Web Desktop Route for Receptionist
const DEV_URL = 'http://localhost:5173/receptionist/desktop';
const FALLBACK_URL = 'http://localhost:5173/receptionist/dashboard';

function checkDevServerAvailable(url, callback) {
  const req = http.get(url, (res) => {
    callback(true);
  });
  req.on('error', () => {
    callback(false);
  });
  req.end();
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'Flavora Resto - Receptionist Desktop Command Center',
    icon: path.join(__dirname, '../logo (1).png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false
    },
    backgroundColor: '#020617',
    autoHideMenuBar: true,
    show: false
  });

  // Optimize window showing to prevent white flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.maximize();
    mainWindow.show();
  });

  checkDevServerAvailable(DEV_URL, (isAvailable) => {
    if (isAvailable) {
      mainWindow.loadURL(DEV_URL);
    } else {
      mainWindow.loadURL(FALLBACK_URL);
    }
  });

  // Handle window closing
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Remove top native menu bar (File, View, Operations, Help)
  Menu.setApplicationMenu(null);
  if (mainWindow) {
    mainWindow.setMenu(null);
  }
}

// Handle IPC Notifications
ipcMain.on('show-notification', (event, { title, body }) => {
  if (Notification.isSupported()) {
    new Notification({ title, body, icon: path.join(__dirname, '../logo (1).png') }).show();
  }
});

// Handle IPC Print Token
ipcMain.on('print-token', (event, tokenData) => {
  console.log('Printing Waitlist Token:', tokenData);
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
