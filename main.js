const { ipcMain, BaseWindow, WebContentsView, screen } = require('electron')
const { app, BrowserWindow, Tray, Menu } = require('electron/main')
const path = require('path')




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



//   AUTO UPDATING   \\

(async()=>{
    autoUpdatePreference = await getStorageItem("autoUpdate")
    if (!autoUpdatePreference) { return }



    //  will only run if autoUpdatePreference is true

    const { updateElectronApp, UpdateSourceType } = require('update-electron-app')

    if (app.isPackaged) {
        updateElectronApp({
            updateSource: {
                type: UpdateSourceType.ElectronPublicUpdateService,
                repo: 'RageBoy152/multicast'
            },
            updateInterval: '15 minutes',
            logger: require('electron-log')
        })
    }
})()


// toggle settings
ipcMain.on('toggleSetting',async (e,key)=>{
    autoUpdatePreference = await getStorageItem(key)
    autoUpdatePreference ? setStorageItem(key, false) : setStorageItem(key, true)
})

// get settings
ipcMain.on('getSetting',async (e,key)=>{
    settingsData = await getStorageItem(key)
    e.sender.send('getSettingResult',JSON.stringify({ "setting": key, "value": false || settingsData }))
})




let width, height;

let feedWins = [];
let feedTabs = [[],[],[]];
let feedCounts = []

let originalDimensions = []

let browserOptions;




function createFeedTabs(outputIndex, feedCount, feedWin, flag) {
    if (feedCount == 3) {feedCount++}
    if (feedCount >=6) {feedCount = 9}


    for (let i=0;i<feedCount;i++) {
        //  create new web view instance for feed "i"
        const feedTab = new WebContentsView({
            webPreferences: browserOptions.webPreferences
        })

        
        // devtools = new BrowserWindow()
        // feedTab.webContents.setDevToolsWebContents(devtools.webContents)
        // feedTab.webContents.openDevTools({ mode: 'detach' })
        

        //  create feed url, remove feedcount param and add feed index param
        feedURL = new URL(`file://${path.join(__dirname, url)}`)
        feedURL.searchParams.set('feed', i)


        //  load feedTab and add as child view to feedWin
        feedTab.webContents.loadURL(feedURL.href)


        // feedWins[outputIndex].contentView.addChildView(feedTab)      <-  breaks wtf why
        flag ? feedWins[outputIndex].contentView.addChildView(feedTab) : feedWin.contentView.addChildView(feedTab)


        //  set transform of feed tab
        let parentWinWidth;
        let parentWinHeight;

        if (feedWin == 'null') {
            parentWinWidth = feedWins[outputIndex].getBounds().width
            parentWinHeight = feedWins[outputIndex].getBounds().height
        }   else {
            parentWinWidth = feedWin.getBounds().width
            parentWinHeight = feedWin.getBounds().height
        }


        feedTab.setBounds(getFeedTabBounds(0, parentWinWidth, parentWinHeight, i, feedCount))
        feedCounts[outputIndex] = (feedCount)


        //  add feedTab to array
        feedTabs[outputIndex].push(feedTab)
    }

    return feedWin
}




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


        let feedWin = new BaseWindow(browserOptions)



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


            feedWins[pageIndex].setBounds(persistentBounds)
            if (persistentWinBounds.feedWins[pageIndex].maximized) { feedWins[pageIndex].maximize() }
        }
        setBoundsToPersistent(outputPageIndex)



        parentWinWidth = feedWin.getBounds().width
        parentWinHeight = feedWin.getBounds().height


        // save original dimensions for resizig stuff
        originalDimensions.push(parentWinWidth)
        originalDimensions.push(parentWinHeight)


        feedWin = createFeedTabs(outputPageIndex, data.feedCount, feedWin)
        feedCounts[outputPageIndex] = data.feedCount


        //  add feedWin to array
        feedWins[outputPageIndex] = feedWin;



        //   ON RESIZE EVENT RECALCULATE BOUNDS OF TABS

        feedWins[outputPageIndex].on('resize',((pageIndex)=>(e)=>{
            newWidth = feedWins[pageIndex].getSize()[0]
            newHeight = feedWins[pageIndex].getSize()[1]            

            // if maxamized, use original dimensions            //  THIS THING UPDATE THIS THING PLS

            feedWinBounds = feedWins[pageIndex].getBounds()
            windowWidthHeight = getWidthAndHeight(feedWinBounds.x, feedWinBounds.y, feedWinBounds.width, feedWinBounds.height)
            
            if (feedWins[pageIndex].isMaximized()) {
                newWidth = windowWidthHeight[0]
                newHeight = windowWidthHeight[1]
            }

            feedTabs[pageIndex].forEach((feedTab,i)=>{
                feedTab.setBounds(getFeedTabBounds(0, newWidth, newHeight, i, feedCounts[pageIndex]))
            })
        })(outputPageIndex));



        //   ON MOVE EVENT SAVE BOUNDS DATA

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
            //   PERSISTENT BOUNDS

            (async()=>{
                persistentWinBounds = await getStorageItem("persistentWinBounds")
                if (!persistentWinBounds) { persistentWinBounds = setPersistentWinBoundsDefaults() }
                persistentWinBounds = JSON.parse(persistentWinBounds)


                //  set bounds and mazimized to persistent data
                win.setBounds(persistentWinBounds.console.bounds)
                if (persistentWinBounds.console.maximized) { win.maximize() }
            })();


            //   ON MOVE EVENT SAVE BOUNDS DATA

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


//   ALGORITHM TO GET FEED TAB BOUNDS BASED ON DIMENSIONS OF PARENT WINDOW

function getFeedTabBounds(feedTabY, parentWinWidth, parentWinHeight, feedTabIndex, feedCount) {
    let feedTabBounds = { x: 0, y: feedTabY, width: parentWinWidth, height: parentWinHeight }

    if (feedCount == 2) {
        feedTabBounds = { x: feedTabIndex*(parentWinWidth/2), y: feedTabY, width: parentWinWidth/2, height: parentWinHeight }
    }
    else if (feedCount == 3 || feedCount == 4) {
        let y = feedTabY
        if (feedTabIndex>1) { y = parentWinHeight/2 }

        feedTabBounds = { x: (feedTabIndex%2)*(parentWinWidth/2), y: y, width: parentWinWidth/2, height: parentWinHeight/2 }
    }
    else if (feedCount == 5) {
        let x = ((feedTabIndex+1)%2)*parentWinWidth/2
        if (feedTabIndex<3) { x = (feedTabIndex%3)*parentWinWidth/3 }

        let y = feedTabY
        let width = parentWinWidth/3
        if (feedTabIndex>2) { y += parentWinHeight/2; width = parentWinWidth/2 }

        feedTabBounds = { x: x, y: y, width: width, height: parentWinHeight/2 }
    }
    else if (feedCount <= 9 && feedCount >= 6) {
        let y = feedTabY
        if (feedTabIndex >= 3 && feedTabIndex <= 5) { y += parentWinHeight/3 }
        else if (feedTabIndex >= 6) { y += 2*(parentWinHeight/3) }

        feedTabBounds = { x: (feedTabIndex%3)*(parentWinWidth/3), y: y, width: parentWinWidth/3, height: parentWinHeight/3 }
    }

    return { x: Math.ceil(feedTabBounds.x), y: Math.ceil(feedTabBounds.y), width: Math.ceil(feedTabBounds.width), height: Math.ceil(feedTabBounds.height)}
}


function getWidthAndHeight(x,y,width,height) {
    display = screen.getPrimaryDisplay()

    if (!isNaN(x) && !isNaN(y))
        display = screen.getDisplayNearestPoint({ "x":x+(width/2), "y":y+(height/2) })
    
    width = display.workAreaSize.width
    height = display.workAreaSize.height

    return [width, height]
}


app.on('ready', () => {

    


    //   RUN ON STARTUP   \\

    (async()=>{
        runOnStartupPreference = await getStorageItem("runOnStartup")
    
        app.setLoginItemSettings({
            openAtLogin: runOnStartupPreference
        })
    })();
    
    


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
        // destroy feed tabs in parent feed win
        feedTabs[parseInt(data)].forEach(feedTab=>{
            feedTab.webContents.destroy()
        })
        feedTabs[parseInt(data)] = []
        

        // destroy parent feed win
        feedWins[parseInt(data)].close()
        feedWins[parseInt(data)] = []
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
        if (!feedTabs[parseInt(data.outputIndex)][0]) { return }

        feedTabs[parseInt(data.outputIndex)][0].webContents.send("update-title", data.mode.split("SETTITLE_")[1])
    }
    else if (data.mode == 'REFRESH') {
        if (!feedTabs[parseInt(data.outputIndex)][0]) { return }

        feedTabs[parseInt(data.outputIndex)][data.feedIndex].webContents.send("refresh-feed")
    }
    else if (data.mode.startsWith('REFRESHWINDOW_')) {
        if (!feedWins[parseInt(data.outputIndex)] || feedWins[parseInt(data.outputIndex)].length === 0) { return }


        feedWins[parseInt(data.outputIndex)].contentView.children.forEach(feedWinChild=>{
            feedWins[parseInt(data.outputIndex)].contentView.removeChildView(feedWinChild)
        })
        feedTabs[parseInt(data.outputIndex)] = []


        createFeedTabs(parseInt(data.outputIndex), parseInt(data.mode.split("REFRESHWINDOW_")[1]), feedWins[parseInt(data.outputIndex)], true)
    }
})