window.$ = window.jQuery = require('jquery');
const shell = require('electron').shell;

configSynced = true


function openWindow(url, feedCount) {
    console.log(feedCount)
    ipcRenderer.send("openWindow", {"url": url, "feedCount": feedCount})
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
}



function refreshOutputs(outputIndex, feedIndex, mode) {
    ipcRenderer.send("resync-config",JSON.stringify({outputIndex:outputIndex, feedIndex:feedIndex, mode:mode}))
}