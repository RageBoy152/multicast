const { ipcMain, BaseWindow, WebContentsView, screen } = require('electron')
const { app, BrowserWindow, Tray, Menu } = require('electron/main')
const path = require('path')
const { autoUpdater, AppUpdater } = require('electron-updater')
const log = require('electron-log')

const exePathFull = path.resolve(path.dirname(process.execPath), 'Multi Cast.exe')


autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;


log.transports.file.resolvePathFn = () => path.join(app.getPath('userData'), 'logs', 'main.log');


log.info(`PATH FOR AUTO LAUNCH: ${exePathFull}`)


async function getStorageItem(item) {
    const storageModule = await import('./storage.mjs')

    return storageModule.getItem(item)
}

async function setStorageItem(item, data) {
    const storageModule = await import('./storage.mjs')

    storageModule.setItem(item, data)
}



function setPersistentWinBoundsDefaults() {
    defaultConsoleBounds = {
        x: 0,
        y: 0,
        width: Math.floor(width),
        height: Math.floor(height),
    }

    defaultFeedBounds = {
        x: 0,
        y: 0,
        width: Math.floor(width / 0.7),
        height: Math.floor(height / 0.7),
    }

    defaultConsoleMaximized = true
    defaultFeedMaximized = false

    data = JSON.stringify({
        "console": {
            "maximized": defaultConsoleMaximized,
            "bounds": defaultConsoleBounds
        },
        "feedWins": [
            {
                "maximized": defaultFeedMaximized,
                "bounds": defaultFeedBounds
            },
            {
                "maximized": defaultFeedMaximized,
                "bounds": defaultFeedBounds
            },
            {
                "maximized": defaultFeedMaximized,
                "bounds": defaultFeedBounds
            }
        ]
    })

    setStorageItem("persistentWinBounds", data)

    return data
}




// toggle settings
ipcMain.on('toggleSetting',async (e,key)=>{
    setting = await getStorageItem(key)
    setting ? setStorageItem(key, false) : setStorageItem(key, true)

    if (key == 'runOnStartup' && app.isPackaged) {
        // console.log(`SETTING DEV RUN ON STARTUP TO ${!setting}`)
        app.setLoginItemSettings({
            openAtLogin: !setting,
            path: `"${exePathFull}"`,
            args: [
                "--processStart",
                `"${path.basename(process.execPath)}"`
              ]
        })
    }   else if (key == 'autoUpdate' && !setting) {
        autoUpdater.checkForUpdates()
    }
})

// get settings
ipcMain.on('getSetting',async (e,key)=>{
    settingsData = await getStorageItem(key)
    e.sender.send('getSettingResult',JSON.stringify({ "setting": key, "value": false || settingsData }))
})




let width, height;

let feedWins = [];
let feedCounts = []

let originalDimensions = []

let browserOptions;




//  create console window function 
function createWindow(data) {
    url = data.url

    browserOptions = {
        width: getWidthAndHeight()[0],
        height: getWidthAndHeight()[1],
        frame: false,
        autoHideMenuBar: true,
        icon: path.join(__dirname, 'icons/multiCastIcon.png'),
        webPreferences: {
            nodeIntegration: true,
            backgroundThrottling: false,
            contextIsolation: false,
            webviewTag: true,
            preload: path.join(__dirname, 'preload.js')
        }
    }



    if (url.includes('output.html')) {
        outputPageIndex = parseInt(new URL(`file://${path.join(__dirname, url)}`).searchParams.get('outputPage'))


        let feedWin = new BrowserWindow(browserOptions)

        feedURL = new URL(`file://${path.join(__dirname, url)}`)
        feedWin.loadURL(feedURL.href)



        //   PERSISTENT MAZIMIZE AND BOUNDS WINDOW

        async function setBoundsToPersistent(pageIndex) {
            persistentWinBounds = await getStorageItem("persistentWinBounds")
            if (!persistentWinBounds) { persistentWinBounds = setPersistentWinBoundsDefaults() }

            persistentWinBounds = JSON.parse(persistentWinBounds)


            persistentBounds = persistentWinBounds.feedWins[pageIndex].bounds
            
            if (persistentWinBounds.feedWins[pageIndex].maximized) {
                persistentBounds.width = originalDimensions[0]
                persistentBounds.height = originalDimensions[1]
            }


            feedWin.setBounds(persistentBounds)
            if (persistentWinBounds.feedWins[pageIndex].maximized) { feedWin.maximize() }
        }
        setBoundsToPersistent(outputPageIndex)


        originalDimensions.push(feedWin.getBounds().width)
        originalDimensions.push(feedWin.getBounds().height)


        //  add feedWin to array
        feedWins[outputPageIndex] = feedWin;



        //   ON MOVE & RESIZE EVENTS, SAVE BOUNDS DATA

        async function saveBoundsData(pageIndex) {
            // get persistent data
            persistentWinBounds = await getStorageItem("persistentWinBounds")
            if (!persistentWinBounds) { persistentWinBounds = setPersistentWinBoundsDefaults() }
            persistentWinBounds = JSON.parse(persistentWinBounds)


            // set json data to current window state
            persistentWinBounds.feedWins[pageIndex].maximized = feedWins[pageIndex].isMaximized()
            persistentWinBounds.feedWins[pageIndex].bounds = feedWins[pageIndex].getBounds()

            // set storage item to data
            setStorageItem("persistentWinBounds", JSON.stringify(persistentWinBounds))
        }


        feedWins[outputPageIndex].on('move',((pageIndex)=>async(e)=>{
            // if (feedWins[pageIndex].isMaximized()) { return }

            saveBoundsData(pageIndex)
        })(outputPageIndex));
        feedWins[outputPageIndex].on('resize',((pageIndex)=>async(e)=>{
            // if (feedWins[pageIndex].isMaximized()) { return }

            saveBoundsData(pageIndex)
        })(outputPageIndex));



        return
    }   else {
        //   REGULAR WINDOW


        //  get different browser options for if we opening external url vs .html file
        tempBrowserOptions = browserOptions

        if (!url.includes('.html')) { tempBrowserOptions.frame = true }
        if (url.includes('settings.html')) { tempBrowserOptions.width = 400; tempBrowserOptions.height = 500; tempBrowserOptions.resizable = false }



        const win = new BrowserWindow(tempBrowserOptions)

        win.webContents.setWindowOpenHandler(({ url }) => {
            return {
                action: 'allow',
                overrideBrowserWindowOptions: browserOptions
            }
        })


        !url.includes('.html') ? win.loadURL(url) : win.loadFile(url)


        if (url == 'console.html') {
            //   SET BOUDNS TO PERSISTENT BOUNDS

            (async()=>{
                persistentWinBounds = await getStorageItem("persistentWinBounds")
                if (!persistentWinBounds) { persistentWinBounds = setPersistentWinBoundsDefaults() }
                persistentWinBounds = JSON.parse(persistentWinBounds)


                //  set bounds and mazimized to persistent data
                win.setBounds(persistentWinBounds.console.bounds)
                if (persistentWinBounds.console.maximized) { win.maximize() }
            })();



            //   ON MOVE & RESIZE EVENTS, SAVE BOUNDS DATA

            async function saveConsoleBoundsData() {
                // get persistent data
                persistentWinBounds = await getStorageItem("persistentWinBounds")
                if (!persistentWinBounds) { persistentWinBounds = setPersistentWinBoundsDefaults() }
                persistentWinBounds = JSON.parse(persistentWinBounds)

                // set json data to current window state
                persistentWinBounds.console.maximized = win.isMaximized()
                persistentWinBounds.console.bounds = win.getBounds()


                // set storage item to data
                setStorageItem("persistentWinBounds", JSON.stringify(persistentWinBounds))
            }
    

            win.on('move',async(e)=>{
                saveConsoleBoundsData()
            })
            win.on('resize',async(e)=>{
                saveConsoleBoundsData()
            })

            win.show()
            return
        }


        if (!url.includes('settings.html')) { win.maximize() }
        win.show()
    }

}




function getWidthAndHeight(x,y,width,height) {
    display = screen.getPrimaryDisplay()

    if (!isNaN(x) && !isNaN(y))
        display = screen.getDisplayNearestPoint({ "x":x+(width/2), "y":y+(height/2) })
    
    width = display.workAreaSize.width
    height = display.workAreaSize.height

    return [width, height]
}





app.on('ready', async () => {

    


    //   RUN ON STARTUP   \\

    if (app.isPackaged) {
        (async()=>{
            runOnStartupPreference = await getStorageItem("runOnStartup")
        
            app.setLoginItemSettings({
                openAtLogin: runOnStartupPreference,
                path: `"${exePathFull}"`,
                args: [
                    "--processStart",
                    `"${path.basename(process.execPath)}"`
                  ]
            })
        })();
    }
    


    // fix autoplay stuff
    app.commandLine.appendSwitch("autoplay-policy", "no-user-gesture-required")


    // create tray
    tray = new Tray(path.join(__dirname, 'icons/multiCastIcon.png'));

    // create tray menu
    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Console',
            click: () => {
                let hasConsole = false
                BrowserWindow.getAllWindows().forEach(win=>{
                    if(win.title == 'Room Console')
                        hasConsole = true;return;
                })
                if (!hasConsole) {createWindow( { "url": "console.html" } )}
            }
        },
        {
            label: 'Exit',
            click: () => {
                app.quit()
            }
        },
    ]);

    // set tray menu
    tray.setContextMenu(contextMenu);



    createWindow( { "url": "console.html" } )

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow( { "url": "console.html" } )
        }
    })


    
    //  CHECK FOR UPDATES BASED ON AUTO UPDATE PREFERENCE

    try {
        log.info("Fetching autoUpdate preference...")
        const autoUpdatePreference = await getStorageItem("autoUpdate")

        log.info("autoUpdatePreference:", autoUpdatePreference);

        if (!autoUpdatePreference) { return }

        autoUpdater.checkForUpdates()
    }
    catch (err) {
        log.info(`Error fetching autoUpdate preference or checking for update: ${err}`)
        console.log(`Error fetching autoUpdate preference or checking for update: ${err}`)
    }
})



//   AUTO UPDATE EVENTS

autoUpdater.on('update-available', () => {
    // auto download update if available
    
    log.info("Update available, attempting to download.")
    autoUpdater.downloadUpdate()
})

autoUpdater.on('error', (err) => {
    // update error
    
    log.info(`Error during auto update: ${err}`)
    BrowserWindow.getFocusedWindow().webContents.send('update-error',err)
})

autoUpdater.on('update-downloaded', () => {
    // prompt user to restart app now to install update or dismiss

    log.info("Update downloaded, prompting restart.")
    
    BrowserWindow.getFocusedWindow().webContents.send('update-downloaded')
})

ipcMain.on('restart-app', () => {
    // user wants to restart app to install update now

    log.info("Restarting for update to be installed.")
    app.relaunch()
    app.quit()
})




app.on('window-all-closed', () => {
    if (BrowserWindow.getAllWindows().length === 0 && process.platform !== 'darwin') {
        app.quit();
    }
})


//  WINDOW MANAGEMENT EVENTS

ipcMain.on("close-btn",(e, data)=>{
    if (data === true)
        BrowserWindow.getFocusedWindow().close()
    else {
        // destroy feed win
        feedWins[parseInt(data)].close()
        feedWins[parseInt(data)] = null
    }
})

ipcMain.on("minimize-btn",(e, data)=>{
    if (data === true)
        BrowserWindow.getFocusedWindow().minimize()
    else {
        feedWins[parseInt(data)].minimize()
    }
})

ipcMain.on("maxamize-btn",(e, data)=>{
    if (data === true)
        BrowserWindow.getFocusedWindow().maximize()
    else {
        feedWins[parseInt(data)].maximize()
    }
})


//  NEW WINDOW EVENT

ipcMain.on("openWindow",(event,data)=>{ createWindow(data) })




//   HANDLES NEEDING TO REFRESH OUTPUTS DUE TO OUT OF SYNC CONFIGS

ipcMain.on("resync-config",(e,data)=>{
    data = JSON.parse(data)


    if (data.mode.startsWith('SETTITLE_')) {
        //  update title because title changed

        if (!feedWins[data.outputIndex]) { return }        

        feedWins[data.outputIndex].webContents.send("update-title", data.mode.split("SETTITLE_")[1])
    }
    else if (data.mode == 'REFRESH') {
        // particular feed needs refreshing
        
        if (!feedWins[data.outputIndex]) { return }

        feedWins[data.outputIndex].webContents.send("refresh-feed", data.feedIndex)
    }
    else if (data.mode.startsWith('REFRESHWINDOW_')) {
        //  update grid because feed count changed

        if (!feedWins[data.outputIndex]) { return }

        feedWins[data.outputIndex].webContents.send("refresh-grid", data.mode)
    }
})