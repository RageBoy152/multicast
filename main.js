const { ipcMain } = require('electron')
const { app, BrowserWindow, Tray, Menu } = require('electron/main');
const path = require('path')



const browserOptions = {
    width: 800,
    height: 600,
    frame: false,
    autoHideMenuBar: true,
    icon: path.join(__dirname, 'icons/multiCastIcon.png'),
    webPreferences: {
        nodeIntegration: true,
        backgroundThrottling: false,
        contextIsolation: false,
        preload: path.join(__dirname, 'preload.js')
    }
}


//  create console window function 
function createWindow(url) {
    const win = new BrowserWindow(browserOptions)

    win.webContents.setWindowOpenHandler(({ url }) => {
        return {
            action: 'allow',
            overrideBrowserWindowOptions: browserOptions
        }
    })


    if (url.includes('?')) {
        const basePath = url.split('?')[0];
        const queryParams = url.split('?')[1];
        const fullUrl = new URL(`file://${path.join(__dirname, basePath)}`);
        fullUrl.search = queryParams;

        win.loadURL(fullUrl.toString());
    } else {
        win.loadFile(url);
    }

    if (url == 'console.html') {win.webContents.setAudioMuted(true)}
    else {win.webContents.setAudioMuted(false)}
    win.show()
    win.maximize()
}



app.on('ready', () => {
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
                if (!hasConsole) {createWindow('console.html')}
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



    createWindow('console.html')

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow('console.html')
        }
    })
})



app.on('window-all-closed', () => {
    if (BrowserWindow.getAllWindows().length === 0 && process.platform !== 'darwin') {
        app.quit();
    }
})


ipcMain.on("close-btn",()=>{BrowserWindow.getFocusedWindow().close();})

ipcMain.on("minimize-btn",()=>{BrowserWindow.getFocusedWindow().minimize();})

ipcMain.on("maxamize-btn",()=>{BrowserWindow.getFocusedWindow().maximize();})



ipcMain.on("openWindow",(event,url)=>{createWindow(url)})



// handles requests from other windows to refresh console
ipcMain.on("refreshOutputs",(event,data)=> {
    BrowserWindow.getAllWindows().forEach(win => {
        if (win.title.startsWith('Output ')) {
            win.webContents.send("refresh")
            return
        }
    })
})