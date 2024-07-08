//  LOADS MENUBAR HTML INTO DIV BASED ON TITLE TAG

$(document).ready(function(){
    $('#window-menu-bar')[0].innerHTML = `
    <nav class="windowMenuBar bg-primary drag d-flex align-items-center px-1">
        <div class="col">
            <h1>MutliCast - ${$('title')[0].innerText}</h1>
        </div>


        <div class="appFuncs d-flex align-items-center">
            <div class="col">
                <button onclick="minimizeApp()"><i class="bi bi-dash-lg"></i></button>
            </div>
            <div class="col">
                <button onclick="maxamizeApp()"><i class="bi bi-square"></i></button>
            </div>
            <div class="col">
                <button onclick="closeApp()" class="danger-bg-hover"><i class="bi bi-x-lg"></i></button>
            </div>
        </div>
    </nav>
    `
})



//  ADDS FUNCTIONALITY TO MENU BUTTONS

const { ipcRenderer } = require("electron")


function closeApp() {
    ipcRenderer.send("close-btn",true)
}

function maxamizeApp() {
    ipcRenderer.send("maxamize-btn",true)
}

function minimizeApp() {
    ipcRenderer.send("minimize-btn",true)
}


