const { app, BrowserWindow, ipcMain, shell, Tray, Menu } = require('electron');

const nodemailer = require('nodemailer');
const path = require('path');
require('dotenv').config();

const exePathFull = path.resolve(path.dirname(process.execPath), 'Multi Cast.exe')

const { autoUpdater, AppUpdater } = require('electron-updater');
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;


const log = require('electron-log');
log.transports.file.resolvePathFn = () => path.join(app.getPath('userData'), 'logs', 'main.log');


//  quit if on second instance
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) { app.quit(); }




async function getStorageItem(key, defaultValue) {
  const storageModule = await import('./storage.mjs');
  return storageModule.get(key, defaultValue);
}
async function setStorageItem(key, data) {
  const storageModule = await import('./storage.mjs');
  storageModule.set(key, data);
}


async function autoUpdate() {
  const autoUpdatePreference = await getStorageItem('autoUpdate');

  if (!autoUpdatePreference) { return }
  autoUpdater.checkForUpdates();
}


async function runOnStartup() {
  if (app.isPackaged) return;

  const runOnStartupPreference = await getStorageItem('runOnStartup');

  app.setLoginItemSettings({
    openAtLogin: runOnStartupPreference,
    path: `"${exePathFull}"`,
    args: [
      "--processStart",
      `"${path.basename(process.execPath)}"`
    ]
  });
}




function createTray() {
  const tray = new Tray(path.join(__dirname, 'favicon.png'));


  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Open console',
      click: () => {
        let consoleWin;

        BrowserWindow.getAllWindows().forEach(win => {
          if (win.title == 'console') consoleWin = win; return;
        })

        if (consoleWin) {
          consoleWin.restore();
          consoleWin.focus();
        }
        else createWin('');
      }
    },
    {
      label: 'Exit',
      click: () => { app.quit(); }
    }
  ])


  tray.setContextMenu(contextMenu);
}



async function createWin(route, appStart) {
  //  get bounds or use default
  const winBounds = await getStorageItem(`winBounds_${route == '' ? 'console' : route}`, { width: 1500, height: 900 });
  const winMaxState = await getStorageItem(`winMaxState_${route == '' ? 'console' : route}`, false);



  const win = new BrowserWindow({
    ...winBounds,
    frame: false,
    show: false,
    webPreferences: {
      webviewTag: true,
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true
    },
  })


  const splashWin = new BrowserWindow({
    width: 400,
    height: 600,
    frame: false,
    show: false,
    alwaysOnTop: true
  })



  //  show splash win

  if (appStart) {
    splashWin.loadURL('http://localhost:5173/splash.html');
    splashWin.center();

    splashWin.once('ready-to-show', () => {
      splashWin.show();
    })
  }



  //  load win content

  win.loadURL(`http://localhost:5173${route}`);

  win.once('ready-to-show', () => {
    setTimeout(() => {
      winMaxState && win.maximize();
      win.show();
      splashWin.close();
    }, appStart ? 750 : 50)
  })
  


  //  save persistent win bounds

  win.on('close', async () => {
    await setStorageItem(`winBounds_${route == '' ? 'console' : route}`, win.getBounds());
    await setStorageItem(`winMaxState_${route == '' ? 'console' : route}`, win.isMaximized());
  })
}




app.on('ready', () => {
  createWin('', true);
  createTray();
  autoUpdate();
  runOnStartup();
})




//  Open output window
ipcMain.on('open-output', (e, route) => {
  createWin(route);
})



//  Email bug report data
ipcMain.on('bug-report', (e, data) => {
  let transporter =  nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_ADDR,
      pass: process.env.EMAIL_PWD
    },
  })

  let mailOptions = {
    to: process.env.EMAIL_ADDR,
    subject: 'MultiCast App - Bug Report',
    html: `Bug report JSON: ${JSON.stringify(data, null, 2)}`
  }


  transporter.sendMail(mailOptions).then(() => {
    e.reply('bug-report-res');
  }).catch((err) => {
    console.log(`Error with SMTP`);
    console.log(err);
    e.reply('bug-report-res', err);
  })
})



//  AppNavBar.jsx buttons
ipcMain.on('win-min', () => {
  const focusedWin = BrowserWindow.getFocusedWindow();
  focusedWin && focusedWin.minimize();
})
ipcMain.on('win-max', () => {
  const focusedWin = BrowserWindow.getFocusedWindow();
  focusedWin && focusedWin.maximize();
})
ipcMain.on('win-close', () => {
  const focusedWin = BrowserWindow.getFocusedWindow();
  focusedWin && focusedWin.close();
})



//  Open external URLs
ipcMain.on('openExternal', (e, url) => {
  shell.openExternal(url)
})


//  Quit entire app - used for autoupdate 'restart now' button
ipcMain.on('exit-app', () => {
  app.quit();
})



//  Update app management preferences - auto start/update
ipcMain.on('update-preference', async (e, data) => {
  //  set preference
  await setStorageItem(data.key, data.value);

  //  reset properties to match updated preferences
  if (data.key == 'autoUpdate') autoUpdate();
  else if (data.key == 'runOnStartup') runOnStartup();

  e.reply('get-preference-reply', { key: data.key, preference: data.value });
})


ipcMain.on('get-preference', async (e, key) => {
  const preference = await getStorageItem(key);

  e.reply('get-preference-reply', { key: key, preference: preference });
})



//  autoUpdater events

autoUpdater.on('update-available', () => {
  // auto download update if available
  
  log.info("Update available, attempting to download.");
  autoUpdater.downloadUpdate();
})

autoUpdater.on('error', (err) => {
  // update error
  
  log.info(`Error during auto update: ${err}`);
  BrowserWindow.getFocusedWindow().webContents.send('autoUpdate-error',err);
})

autoUpdater.on('update-downloaded', () => {
  // prompt user to restart app now to install update or dismiss

  log.info("Update downloaded, prompting restart.");
  BrowserWindow.getFocusedWindow().webContents.send('autoUpdate-ready');
})





app.on('window-all-closed', () => {
  process.platform !== 'darwin' && app.quit();
})

app.on('active', () => {
  BrowserWindow.getAllWindows().length == 0 && createWin();
})