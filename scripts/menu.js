//  LOADS MENUBAR HTML INTO DIV BASED ON TITLE TAG

$(document).ready(function(){
    if (window.location.href.includes('output.html')) {

        let feedCount = config.outputs[outputIndex].feedCount
        let winBarMode = 'empty'


        if (feedCount >= 2 && feedCount <= 4) {
            if (feedIndex == 0) { winBarMode = 'title' }
            else if (feedIndex == 1) { winBarMode = 'btns' }
        }
        else if (feedCount >= 5 && feedCount <= 9) {
            if (feedIndex == 0) { winBarMode = 'title' }
            else if (feedIndex == 1) { winBarMode = 'bar' }
            else if (feedIndex == 2) { winBarMode = 'btns' }
        }

        let winBarHTML = ''


        if (feedCount == 1) {
            winBarHTML = `
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
        }
        else if (winBarMode == 'title') {
            winBarHTML = `
            <div class="col">
                <h1>MutliCast - ${$('title')[0].innerText}</h1>
            </div>
            `
        }
        else if (winBarMode == 'btns') {
            winBarHTML = `
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
        }


        if (winBarMode == 'empty' && feedCount != 1) {
            $('#window-menu-bar')[0].remove()
            $('.outputContainer')[0].setAttribute('style','padding-top:0!important;')
            $(':root')[0].style.setProperty('--vh-100---33px','100vh')
        }
        else
            $('#window-menu-bar')[0].innerHTML = winBarHTML
    }
    else {
        //      WIN MENU BAR FOR ALL PAGES
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
    }
})




//  ADDS FUNCTIONALITY TO MENU BUTTONS

const { ipcRenderer } = require("electron")



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