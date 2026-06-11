const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  // Create a clean desktop window frame
  const win = new BrowserWindow({
    width: 1020,
    height: 720,
    resizable: false,
    autoHideMenuBar: true, // Hides menu bar on Windows
    title: "QuarkShield VPN Client",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  win.loadFile('index.html');
}

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
