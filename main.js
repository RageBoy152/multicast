const { app, BrowserWindow, ipcMain, shell, Tray, Menu } = require('electron');

const nodemailer = require('nodemailer');
const path = require('path');

const os = require('os');
const fs = require('fs');
const child_process = require('child_process');

if (process.env.NODE_ENV !== 'production')
  require('dotenv').config();

const exePathFull = path.resolve(path.dirname(process.execPath), 'MultiCast.exe')


const log = require('electron-log');
log.transports.file.resolvePathFn = () => path.join(app.getPath('userData'), 'logs', 'main.log');



const { autoUpdater } = require('electron-updater');
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;





let store;
async function importStorage() {
  const { default: Store } = await import('electron-store');
  store = new Store();
}



//  quit if on second instance
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) { app.quit(); }






async function autoUpdate() {
  const autoUpdatePreference = store.get('autoUpdate');

  if (!autoUpdatePreference) { return }
  autoUpdater.checkForUpdates();
}


//  check for new update every 10 mins
setInterval(() => {
  autoUpdate();
}, 600000)



async function runOnStartup() {
  if (!app.isPackaged) return;

  const runOnStartupPreference = store.get('runOnStartup');

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
          if (win.title == 'Console') consoleWin = win; return;
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
  const splashWin = new BrowserWindow({
    width: 400,
    height: 600,
    frame: false,
    show: false,
    alwaysOnTop: true
  })



  //  show splash win

  if (appStart) {
    if (app.isPackaged) { splashWin.loadFile(path.join(app.getAppPath(), 'dist/splash.html')); }
    else { splashWin.loadURL(`http://localhost:5173/splash?version=${app.getVersion()}`); }
    splashWin.center();

    splashWin.once('ready-to-show', () => {
      splashWin.show();
    })
  }




  //  get bounds or use default
  const winBounds = store.get(`winBounds_${route == '' ? 'console' : route}`, { width: 1500, height: 900 });
  const winMaxState = store.get(`winMaxState_${route == '' ? 'console' : route}`, false);


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



  if (app.isPackaged) { 
    win.loadFile(path.join(app.getAppPath(), `dist/index.html`), {
      hash: route
    });
  }
  else { win.loadURL(`http://localhost:5173#${route}`); }
  
  


  win.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    log.error('Failed to load page:', errorDescription);
  });



  win.once('ready-to-show', () => {
    setTimeout(() => {
      winMaxState && win.maximize();
      win.show();
      splashWin.close();
    }, appStart ? 750 : 50)
  })
  


  //  save persistent win bounds

  win.on('close', async () => {
    store.set(`winBounds_${route == '' ? 'console' : route}`, win.getBounds());
    store.set(`winMaxState_${route == '' ? 'console' : route}`, win.isMaximized());
  })



  //  after win is loaded and showing, check for updates  -  only on app start
  if (appStart) autoUpdate();
}




app.on('ready', async () => {
  await importStorage();

  createWin('', true);
  createTray();
  runOnStartup();
})




//  Open output window
ipcMain.on('open-output', (e, route) => {
  createWin(route);
})



//  Send app version to renderer
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
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
});



//  RUN CMD
// function runCmd(cmd, args, callback) {
//   let child = child_process.spawn(cmd, args, {
//     encoding: 'utf8',
//     shell: true
//   });

//   child.on('error', err => {
//     console.log(`Error running command | ${err}`);
//   });

//   child.stdout.setEncoding('utf8');
//   child.stdout.on('data', data => {
//     if (typeof callback === 'function') callback(data);
//   });

//   child.on('close', code => {
//     if (typeof callback === 'function') callback({ finished: true, code: code });
//     child = null;
//   });
// }



// async function runInitialCommand(e, cmd) {
//   return new Promise((resolve, reject) => {
//     runCmd(cmd, null, (res) => {
//       try {
//         // FINISHED
//         if (res.finished) {
//           if (res.code == 0) {
//             e.reply('pull-loading', { percent: 0.2, status: "Executed initial pull command." });
//             resolve(true);
//           }
//           else {
//             reject(new Error(`Initial pull command failed. Finished with code ${res.code}`));
//           }
//         }
  
//         // DOWNLOADING
//         else if (res.toString().includes('[download]') && res.toString().includes(' (frag ')) {
//           percent = res.split('(frag ')[1].split(')')[0];
//           percentValue = parseInt(percent.split('/')[0]) / parseInt(percent.split('/')[1]);
  
//           console.log("Downloading video");
  
//           e.reply('pull-loading', { percent: percentValue, status: "Downloading video." });
//         }
  
//         // SOMETHING ELSE
//         else {
//           console.log("Command execution status:");
//           console.log(res);
//         }
//       }
//       catch (err) {
//         console.error("Error in pull command callback: ", err);
//         e.reply('pull-error', err.message);
//         reject(err);
//       }
//     });
//   });
// }



//  REQUEST TO PULL GIF
// ipcMain.on('pull-start', async (e, pullOptions) => {
//   try {
//     console.log(`STARTING PULL ON #${pullOptions.videoId} WITH:\nPoint0: -${pullOptions.point0}\nPoint1: -${pullOptions.point1}\nLength: ${pullOptions.point0 - pullOptions.point1}s`);
    

//     // pull logic here
//     const pullsTempDir = `${os.homedir()}\\Pictures\\MultiCast\\temp`;
//     const pullFileNameSubstr = `${new Date().toISOString()}_${pullOptions.videoId}`;


//     e.reply('pull-loading', { percent: 0.1, status: "Confirming temp directory exists." });
//     fs.mkdirSync(pullsTempDir, { recursive: true });
    
    
//     //  INITIAL PULL (MP4)
//     e.reply('pull-loading', { percent: 0.2, status: "Creating initial pull command." });

//     const initialPullFileDir = `${pullsTempDir}\\${pullFileNameSubstr}_InitialDownload`;
//     const initialPullCmd = `yt-dlp "https://www.youtube.com/live/${pullOptions.videoId}" --verbose --live-from-start --download-sections "#-${pullOptions.point0} - -${pullOptions.point1}" -o "${initialPullFileDir}"`;
    
//     console.log(initialPullCmd);
//     e.reply('pull-loading', { percent: 0.3, status: "Running initial pull command." });


//     try { await runInitialCommand(e, initialPullCmd); }
//     catch (err) { throw new Error("Initial command failed: " + err.message); }


//     e.reply('pull-finish', "yay");
//   }
//   catch (err) {
//     console.error("Error pulling GIF: ", err);
//     e.reply('pull-error', err.message);
//   }
// })



//  Update app management preferences - auto start/update
ipcMain.on('update-preference', async (e, data) => {
  //  set preference
  store.set(data.key, data.value);

  //  reset properties to match updated preferences
  if (data.key == 'autoUpdate' && data.value) autoUpdate();
  else if (data.key == 'runOnStartup') runOnStartup();

  // e.reply('get-preference-reply', { key: data.key, preference: data.value });
  BrowserWindow.getAllWindows().forEach(win => {
    win.webContents.send('get-preference-reply', { key: data.key, preference: data.value })
  })
})


ipcMain.on('get-preference', async (e, key) => {
  const preference = store.get(key);

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
  BrowserWindow.getAllWindows()[0].webContents.send('autoUpdate-error',err);
})

autoUpdater.on('update-downloaded', () => {
  // prompt user to restart app now to install update or dismiss

  log.info("Update downloaded, prompting restart.");
  BrowserWindow.getAllWindows()[0].webContents.send('autoUpdate-ready');
})





app.on('window-all-closed', () => {
  process.platform !== 'darwin' && app.quit();
})

app.on('active', () => {
  BrowserWindow.getAllWindows().length == 0 && createWin();
})