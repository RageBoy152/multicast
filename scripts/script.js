window.$ = window.jQuery = require('jquery');
const shell = require('electron').shell;
const { v4: uuidv4 } = require('uuid');
const { ipcRenderer } = require("electron")


configSynced = true


function openWindow(url, feedCount) {
    console.log(feedCount)
    ipcRenderer.send("openWindow", {"url": url, "feedCount": feedCount})
}



function initToasts() {
    const toastElList = document.querySelectorAll('.toast')
    const toastList = [...toastElList].map(toastEl => new bootstrap.Toast(toastEl))
}
initToasts()



function addNotification(notification, autoHide) {
    if (!autoHide) { autoHide = 'true' }
    let notiBody = ''
    let toastHeaderBorder = 'border-0'
    let toastId = uuidv4()

    if (notification.body != "") {
        if (notification.body.length > 600) {
            notification.body = `${notification.body.substring(0,600)}...`
        }
        notiBody = `
        <div class="toast-body rounded-0 p-3">
            ${notification.body}
        </div>
        `

        toastHeaderBorder = ''
    }

    

    $('.toast-container')[0].innerHTML += `
    <div id="${toastId}" class="toast rounded-0 border-${notification.color} border-top-0 border-bottom-0 border-start-0" role="alert" aria-live="assertive" aria-atomic="true" data-bs-autohide="${autoHide}" data-bs-delay=2000>
        <div class="toast-header ${toastHeaderBorder} rounded-0 p-2 py-3">
            <strong class="me-auto">${notification.title}</strong>
            <a class="button square" data-bs-dismiss="toast" ><i class="bi bi-x-lg"></i></a>
        </div>
        ${notiBody}
    </div>
    `

    bootstrap.Toast.getOrCreateInstance($(`#${toastId}`)[0]).show()
}


ipcRenderer.on('update-downloaded',()=>{
    addNotification({"title":"Update downloaded automatically","body":"Multicast must be restarted for the update to be installed.<a onclick='restartApp()' class='button bg-secondary mt-1 p-2 w-50'>Restart Now</a>","color":"success"}, 'false')
})
ipcRenderer.on('update-error',(e,err)=>{
    addNotification({"title":"Error during auto update","body":err,"color":"danger"}, 'false')
})



function restartApp() {
    ipcRenderer.send('restart-app')
}



const toAlpha = (num) => {
    if(num < 1 || num > 26 || typeof num !== 'number'){
       return -1;
    }
    const leveller = 64;
    return String.fromCharCode(num + leveller);
}


const delay = ms => new Promise(res => setTimeout(res, ms));



function getConfig() {
    config = localStorage.getItem("rage.multicast.config")
    if (!config || !localStorage.getItem("rage.multicast.v1-1-update")) {
        localStorage.setItem("rage.multicast.config", JSON.stringify(
            {"feedList":[{"feedId":"06471f6d-693c-46ab-98b9-24330c39b24b","feedName":"LP Rover 2","videoId":"tS2PHJmvJzo"},{"feedId":"4e624145-4356-45fb-bb35-1e2f3f24bc4f","feedName":"LP Rover 1","videoId":"Rg7kw-KLDL8"},{"feedId":"87f9855f-0c78-40a6-8159-b1799bc55ab2","feedName":"NSF SBL","videoId":"mhJRzQsLZGg"},{"feedId":"e637f95e-7594-453b-9878-4e3aeca03dbd","feedName":"LP Nerdle","videoId":"c212qMUTnEs"},{"feedId":"32597360-c5bd-446f-bb9a-4464e4acc808","feedName":"LP Saphire","videoId":"RsIG9WF-B4s"},{"feedId":"d20f58af-6dec-4ad6-995e-7dd6dbb67215","feedName":"LP Rocket Ranch","videoId":"qw3uaLRrYNY"},{"feedId":"52a859c2-2159-41d5-a18f-c0c096bfc1c8","feedName":"LP Cape Cam","videoId":"uH1W01t_lGc"},{"feedId":"e687fcf2-22ef-4071-a64b-07b779accf38","feedName":"LP Lab Cam","videoId":"OWCh3wmKtak"},{"feedId":"c9a55ea2-f911-4f21-8786-5d46e8853ef6","feedName":"LP Multi Plex","videoId":"A8QLrVAOE1k"},{"feedId":"bb775faa-ac42-4c05-a991-0676d73d0eb5","feedName":"LP Sentinel","videoId":"IQV0DlS1Ew0"},{"feedId":"8a4c505e-1b17-4975-a61e-8e84e092ff07","feedName":"LP Gator Cam","videoId":"FTw5xuq2swo"},{"feedId":"bc77b58e-0046-43e5-9a12-a150938eed4c","feedName":"NSF SCL","videoId":"Jm8wRjD3xVA"},{"feedId":"ed11b388-ba7c-43d3-bd57-8818c62e23d8","feedName":"NSF McGregor","videoId":"cOmmvhDQ2HM"}],"outputs":[{"outputName":"Output 1","feedCount":5,"feeds":[{},{},{},{},{}]},{"outputName":"Output 2","feedCount":2,"feeds":[{},{}]},{"outputName":"Output 3","feedCount":9,"feeds":[{},{},{},{},{},{},{},{},{}]}]}
        ))

        localStorage.setItem("rage.multicast.v1-1-update",true)
        config = localStorage.getItem("rage.multicast.config")
    }

    return JSON.parse(config)
}


function writeToConfig(configData) {
    localStorage.setItem("rage.multicast.config", JSON.stringify(configData))
    // configSynced = false
    // toggleSyncButton()
}

function toggleSyncButton() {
    if (!configSynced)
        $('#syncButton')[0].style.display = 'flex'
    else
        $('#syncButton')[0].style.display = 'none'
}



function openExternalURL(url) {
    shell.openExternal(url)
}



function copyCredits(feedData) {
    feedId = feedData.feedid
    creditOutputIndex = feedData.outputindex
    creditFeedIndex = feedData.feedindex

    
    let feedName = ""
    let videoId = ""


    if (creditOutputIndex === 'undefined' || creditFeedIndex === 'undefined') {
        // if output location is not present, update data in feedList
        for (let i=0;i<config.feedList.length;i++) {
            if (config.feedList[i].feedId == feedId) {
                feedName = config.feedList[i].feedName
                videoId = config.feedList[i].videoId
                break
            }
        }
    }   else {
        let feedObj = config.outputs[parseInt(creditOutputIndex)].feeds[parseInt(creditFeedIndex)]
        feedName = feedObj.feedName
        videoId = feedObj.videoId
    }


    navigator.clipboard.writeText(`[ Credit: [${feedName}](<https://youtube.com/watch?v=${videoId}>) ]`)

    addNotification({"title":`Copied '${feedName}' credits to clipboard`,"body":"","color":"success"}, 'true')
}



function refreshOutputs(outputIndex, feedIndex, mode) {
    ipcRenderer.send("resync-config",JSON.stringify({outputIndex:outputIndex, feedIndex:feedIndex, mode:mode}))
}