const {app, BrowserWindow, shell, dialog} = require('electron');
const {autoUpdater} = require('electron-updater');
const path = require('node:path');
const {pathToFileURL} = require('node:url');

app.setName('Overnia Idle RPG');
let mainWindow;
let updateDownloaded = false;
let updatePromptOpen = false;
let checking = false;

function checkForUpdates() {
  if (checking || updateDownloaded || !app.isPackaged) return;
  checking = true;
  autoUpdater.checkForUpdates().catch(err => {
    console.warn('Overnia update check failed (offline is OK):', err.message);
  }).finally(() => { checking = false; });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440, height: 900, minWidth: 800, minHeight: 600,
    backgroundColor: '#171820',
    webPreferences: {
      nodeIntegration: false, contextIsolation: true,
      sandbox: true, webSecurity: true,
      partition: 'persist:overnia-main'
    }
  });
  const localUrl = pathToFileURL(path.join(__dirname, 'index.html')).href;
  mainWindow.webContents.setWindowOpenHandler(({url}) => {
    if (url.startsWith('https://')) shell.openExternal(url);
    return {action: 'deny'};
  });
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith(localUrl.split('#')[0].split('?')[0])) {
      event.preventDefault();
      if (url.startsWith('https://')) shell.openExternal(url);
    }
  });
  mainWindow.loadFile('index.html');
}

app.whenReady().then(() => {
  createWindow();
  if (!app.isPackaged) return;
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = false;
  autoUpdater.on('error', err => console.warn('Overnia updater:', err.message));
  autoUpdater.on('update-downloaded', async () => {
    updateDownloaded = true;
    if (updatePromptOpen) return;
    updatePromptOpen = true;
    const {response} = await dialog.showMessageBox(mainWindow, {
      type: 'info', title: 'Overnia update ready',
      message: 'A new Overnia version has been downloaded.',
      detail: 'Save your character before restarting. You can keep playing and install later.',
      buttons: ['Keep playing', 'Restart and install'], defaultId: 0, cancelId: 0,
      noLink: true
    });
    updatePromptOpen = false;
    if (response === 1) autoUpdater.quitAndInstall(false, true);
  });
  // No update check is required to launch or play the game offline.
  setTimeout(checkForUpdates, 12000);
  setInterval(checkForUpdates, 60 * 60 * 1000);
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
