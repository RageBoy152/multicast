//  LOADS MENUBAR HTML INTO DIV BASED ON TITLE TAG

$(document).ready(function(){
    $('#window-menu-bar')[0].innerHTML = `
        <div class="col">
            <h1>MutliCast - ${$('title')[0].innerText}</h1>
        </div>


        <div class="appFuncs flex-center ms-auto">
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
        `

        if ($('title')[0].innerText == 'Settings') {
            $('.appFuncs')[0].innerHTML = `<div class="col"> <button onclick="closeApp()" class="danger-bg-hover"><i class="bi bi-x-lg"></i></button> </div>`
        }
})




//  ADDS FUNCTIONALITY TO MENU BUTTONS



//  GET TRUE OR OUTPUTPAGE TO SEND TO MAIN PROCESS FOR WINDOW HANDLING
let data = true;
if (window.location.href.includes('outputPage')) { data = new URL(window.location).searchParams.get('outputPage') }



function closeApp() {
    ipcRenderer.send("close-btn",data)
}

function maxamizeApp() {
    ipcRenderer.send("maxamize-btn",data)
}

function minimizeApp() {
    ipcRenderer.send("minimize-btn",data)
}